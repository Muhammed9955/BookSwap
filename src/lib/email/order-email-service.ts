/**
 * Order Notification Email Service with Intelligent Surge Batching
 * 
 * Solutions implemented for "in case of many orders":
 * 1. Debounce & Cooldown Window:
 *    - First order in a quiet period triggers an instant notification email immediately.
 *    - If subsequent orders arrive within a 2-minute cooldown window, the service enters "Digest Surge Mode".
 * 2. Surge Digest Batching:
 *    - Orders received during the burst window are collected into a digest queue.
 *    - When the 2-minute cooldown expires (or if 5 orders accumulate), a single consolidated
 *      "🚀 Active Sales Alert: X New Orders Received!" digest email is sent.
 * 3. Rate Limit Protection:
 *    - Prevents hitting transactional email provider quotas (e.g. Resend 2 req/sec, daily caps).
 *    - Eliminates inbox notification spam for bookstore owners during viral campaigns / flash sales.
 */

import type { StoreOrder, Bookstore } from '@/types/store'

interface StoreEmailThrottleState {
  lastSentAt: number
  pendingOrders: StoreOrder[]
  timer: NodeJS.Timeout | null
  storeName: string
  storeSlug: string
  ownerEmail: string
}

// In-memory throttle state per store ID
const throttleMap = new Map<string, StoreEmailThrottleState>()

const COOLDOWN_MS = 2 * 60 * 1000 // 2 minutes window
const MAX_BURST_BATCH = 5 // Flush immediately if 5 orders pile up

function getSiteOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://waraqconnect.com'
}

/**
 * Format Single Order Email HTML
 */
function buildSingleOrderEmailHtml(order: StoreOrder, store: { name: string; name_ar?: string; slug: string }): string {
  const origin = getSiteOrigin()
  const dashboardUrl = `${origin}/stores/dashboard?tab=orders`
  const storeDisplayName = store.name_ar || store.name

  const cleanCustomerPhone = order.customer_phone.replace(/[^0-9]/g, '')
  const waPhone = cleanCustomerPhone.startsWith('0') ? '2' + cleanCustomerPhone : cleanCustomerPhone
  const waContactUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    `مرحباً ${order.customer_name}، نتواصل معك بخصوص طلبك رقم (${order.order_number || order.id}) من مكتبة ${storeDisplayName}.`
  )}`

  const itemsRows = order.items.map((item, idx) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: bold; color: #1e293b;">
        ${idx + 1}. ${item.title_ar || item.title || item.book_title || 'كتاب'}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; text-align: center; color: #64748b;">
        ${item.quantity || 1}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 900; color: #059669; text-align: left;">
        ${item.price} ج.م
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>طلب شراء جديد لمكتبتك</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 6px; font-size: 24px; font-weight: 900; }
    .header p { margin: 0; font-size: 14px; opacity: 0.95; }
    .body { padding: 28px 24px; }
    .badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 11px; font-weight: 900; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; margin-bottom: 20px; }
    .info-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
    .info-row:last-child { margin-bottom: 0; }
    .table-wrap { border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 800; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    .total-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 24px; }
    .total-amount { font-size: 28px; font-weight: 900; color: #059669; margin: 4px 0 0; }
    .cta-btn { display: block; text-align: center; background: #059669; color: #ffffff !important; padding: 14px 24px; border-radius: 14px; font-size: 15px; font-weight: 900; text-decoration: none; margin-bottom: 10px; }
    .wa-btn { display: block; text-align: center; background: #25D366; color: #ffffff !important; padding: 12px 24px; border-radius: 14px; font-size: 14px; font-weight: 900; text-decoration: none; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 استلمت طلب شراء جديد!</h1>
      <p>مكتبة ${storeDisplayName} على منصة WaraqConnect</p>
    </div>
    
    <div class="body">
      <div class="badge">رقم الطلب: ${order.order_number || order.id}</div>
      
      <!-- Customer Information -->
      <div class="info-box">
        <div style="font-weight: 900; font-size: 14px; color: #0f172a; margin-bottom: 10px;">👤 بيانات العميل والشحن:</div>
        <div class="info-row">
          <span style="color: #64748b;">اسم العميل:</span>
          <strong>${order.customer_name}</strong>
        </div>
        <div class="info-row">
          <span style="color: #64748b;">رقم الهاتف / واتساب:</span>
          <strong dir="ltr">${order.customer_phone}</strong>
        </div>
        <div class="info-row">
          <span style="color: #64748b;">المحافظة:</span>
          <strong>${order.customer_city}</strong>
        </div>
        ${order.customer_address ? `
        <div class="info-row">
          <span style="color: #64748b;">العنوان التفصيلي:</span>
          <span>${order.customer_address}</span>
        </div>` : ''}
        ${order.customer_notes ? `
        <div class="info-row">
          <span style="color: #64748b;">ملاحظات العميل:</span>
          <span style="color: #d97706;">${order.customer_notes}</span>
        </div>` : ''}
      </div>

      <!-- Items Ordered -->
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>الكتاب / الإصدار</th>
              <th style="text-align: center;">الكمية</th>
              <th style="text-align: left;">السعر</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </div>

      <!-- Total Price -->
      <div class="total-box">
        <span style="font-size: 12px; font-weight: bold; color: #047857;">إجمالي قيمة الطلب:</span>
        <div class="total-amount">${order.total_price} ج.م</div>
        ${order.bundle_title ? `<span style="font-size: 11px; color: #059669; font-weight: bold;">(متضمن عرض: ${order.bundle_title})</span>` : ''}
      </div>

      <!-- Quick Action Buttons -->
      <a href="${waContactUrl}" class="wa-btn" target="_blank">
        💬 مراسلة العميل عبر واتساب لتأكيد الشحن
      </a>
      <div style="height: 10px;"></div>
      <a href="${dashboardUrl}" class="cta-btn" target="_blank">
        🔍 الدخول لإدارة الطلب في لوحة التحكم
      </a>
    </div>

    <div class="footer">
      منصة WaraqConnect (ورق كونكت) — إشعار طلبات الشركاء<br>
      لتعديل إعدادات الإشعارات، تواصل مع فريق الدعم.
    </div>
  </div>
</body>
</html>
`
}

/**
 * Format Batch Digest Email HTML for High Volume Surges
 */
function buildBatchDigestEmailHtml(
  orders: StoreOrder[],
  store: { name: string; name_ar?: string; slug: string }
): string {
  const origin = getSiteOrigin()
  const dashboardUrl = `${origin}/stores/dashboard?tab=orders`
  const storeDisplayName = store.name_ar || store.name
  const totalVolume = orders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0)

  const ordersListHtml = orders.map((o, idx) => `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 8px;">
        <span style="font-size: 12px; font-weight: 900; color: #0f172a;">#${idx + 1} - الطلب ${o.order_number || o.id}</span>
        <span style="font-size: 14px; font-weight: 900; color: #059669;">${o.total_price} ج.م</span>
      </div>
      <div style="font-size: 12px; color: #334155; line-height: 1.6;">
        👤 <strong>العميل:</strong> ${o.customer_name} (${o.customer_city})<br>
        📱 <strong>الهاتف:</strong> <span dir="ltr">${o.customer_phone}</span><br>
        📚 <strong>الكتب:</strong> ${o.items.map(i => i.title_ar || i.title).join('، ')}
      </div>
    </div>
  `).join('')

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>تنبيه مبيعات نشطة: استلم متجرك ${orders.length} طلبات جديدة</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; direction: rtl; }
    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .header { background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 6px; font-size: 24px; font-weight: 900; }
    .header p { margin: 0; font-size: 14px; opacity: 0.95; }
    .body { padding: 28px 24px; }
    .summary-card { background: #fef3c7; border: 1px solid #fde68a; border-radius: 16px; padding: 18px; text-align: center; margin-bottom: 24px; }
    .summary-title { font-size: 13px; font-weight: 800; color: #92400e; }
    .summary-amount { font-size: 32px; font-weight: 900; color: #b45309; margin: 6px 0 0; }
    .cta-btn { display: block; text-align: center; background: #059669; color: #ffffff !important; padding: 15px 24px; border-radius: 14px; font-size: 15px; font-weight: 900; text-decoration: none; margin-top: 20px; box-shadow: 0 4px 12px rgba(5,150,105,0.25); }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 تنبيه مبيعات نشطة!</h1>
      <p>استلم متجر ${storeDisplayName} دفعة من الطلبات الجديدة</p>
    </div>
    
    <div class="body">
      <div class="summary-card">
        <div class="summary-title">إجمالي مبيعات الدفعة (${orders.length} طلبات جديدة خلال الدقائق الأخيرة):</div>
        <div class="summary-amount">${totalVolume} ج.م</div>
      </div>

      <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">
        نظراً لنشاط المبيعات المتزايد، تم تجميع هذه الطلبات في إشعار واحد لتسهيل المتابعة ومنع إغراق بريدك الإلكتروني:
      </p>

      ${ordersListHtml}

      <a href="${dashboardUrl}" class="cta-btn" target="_blank">
        🔍 الدخول للوحة التحكم لمتابعة وشحن كل الطلبات
      </a>
    </div>

    <div class="footer">
      منصة WaraqConnect (ورق كونكت) — ملخص المبيعات النشطة المجمعة<br>
      تم تجميع هذا الإشعار تلقائياً لحماية بريدك الإلكتروني من التكرار.
    </div>
  </div>
</body>
</html>
`
}

/**
 * Execute actual email dispatch using Resend REST API (or dev simulator)
 */
async function sendRawEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log('[Resend Simulation] No RESEND_API_KEY. Simulated Order Notification to:', to)
    console.log('[Resend Simulation] Subject:', subject)
    return true
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'WaraqConnect Orders <orders@waraqconnect.com>',
        to: [to],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      console.warn('[Resend Order Notification Error]', errData)
      return false
    }

    return true
  } catch (err) {
    console.error('[Resend Order Notification Exception]', err)
    return false
  }
}

/**
 * Flush accumulated pending orders for a store in surge mode
 */
async function flushSurgeDigest(storeId: string) {
  const state = throttleMap.get(storeId)
  if (!state || state.pendingOrders.length === 0) return

  const ordersToFlush = [...state.pendingOrders]
  state.pendingOrders = []
  state.lastSentAt = Date.now()
  if (state.timer) {
    clearTimeout(state.timer)
    state.timer = null
  }

  // If only 1 order queued, send single email format
  if (ordersToFlush.length === 1) {
    const single = ordersToFlush[0]
    const subject = `📦 طلب جديد #${single.order_number || single.id} لمكتبة (${state.storeName}) بقيمة ${single.total_price} ج.م`
    const html = buildSingleOrderEmailHtml(single, { name: state.storeName, slug: state.storeSlug })
    await sendRawEmail(state.ownerEmail, subject, html)
  } else {
    // Send Surge Digest Batch
    const subject = `🚀 مبيعات نشطة: استلمت متجرك (${state.storeName}) عدد ${ordersToFlush.length} طلبات جديدة!`
    const html = buildBatchDigestEmailHtml(ordersToFlush, { name: state.storeName, slug: state.storeSlug })
    await sendRawEmail(state.ownerEmail, subject, html)
  }
}

/**
 * Public Dispatcher:
 * Handles incoming orders and applies the intelligent anti-flood throttling logic.
 */
export async function dispatchStoreOrderEmail(params: {
  order: StoreOrder
  store: { id: string; name: string; name_ar?: string; slug: string }
  ownerEmail: string
}): Promise<{ sentImmediately: boolean; queuedInDigest: boolean }> {
  const { order, store, ownerEmail } = params
  if (!ownerEmail) {
    console.warn('[OrderEmail] No owner email provided for store:', store.id)
    return { sentImmediately: false, queuedInDigest: false }
  }

  const now = Date.now()
  let state = throttleMap.get(store.id)

  if (!state) {
    state = {
      lastSentAt: 0,
      pendingOrders: [],
      timer: null,
      storeName: store.name_ar || store.name,
      storeSlug: store.slug,
      ownerEmail,
    }
    throttleMap.set(store.id, state)
  } else {
    state.ownerEmail = ownerEmail
    state.storeName = store.name_ar || store.name
    state.storeSlug = store.slug
  }

  const timeSinceLast = now - state.lastSentAt

  // CASE 1: Quiet period (more than 2 minutes since last email) -> Send immediate email!
  if (timeSinceLast >= COOLDOWN_MS && state.pendingOrders.length === 0) {
    state.lastSentAt = now
    const subject = `📦 طلب شراء جديد #${order.order_number || order.id} لمكتبة (${state.storeName}) بقيمة ${order.total_price} ج.م`
    const html = buildSingleOrderEmailHtml(order, store)
    await sendRawEmail(ownerEmail, subject, html)
    return { sentImmediately: true, queuedInDigest: false }
  }

  // CASE 2: High order frequency surge detected!
  // Queue the order into the pending digest
  state.pendingOrders.push(order)

  // If burst size reached maximum batch limit (e.g. 5 orders), flush immediately!
  if (state.pendingOrders.length >= MAX_BURST_BATCH) {
    await flushSurgeDigest(store.id)
    return { sentImmediately: true, queuedInDigest: true }
  }

  // Otherwise, ensure a timer is running to flush the batch when cooldown concludes
  if (!state.timer) {
    const remainingDelay = Math.max(1000, COOLDOWN_MS - timeSinceLast)
    state.timer = setTimeout(() => {
      flushSurgeDigest(store.id).catch(err => {
        console.error('[FlushDigest Error]', err)
      })
    }, remainingDelay)
  }

  return { sentImmediately: false, queuedInDigest: true }
}
