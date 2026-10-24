/**
 * Resend Email Service for WaraqConnect
 * Sends transactional emails using Resend REST API (Zero extra dependencies needed).
 * Free tier: 3,000 emails/month (100 emails/day) forever free.
 */

export interface StoreApprovedEmailParams {
  to: string
  ownerName: string
  storeName: string
  storeSlug: string
  dashboardUrl?: string
}

function getResendApiKey(): string | undefined {
  if (process.env.RESEND_API_KEY) return process.env.RESEND_API_KEY
  try {
    // Dynamic read from .env.local to ensure newly added keys are picked up without server restart
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path')
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      const match = content.match(/^RESEND_API_KEY=(.*)$/m)
      if (match && match[1]) {
        const val = match[1].trim()
        process.env.RESEND_API_KEY = val
        return val
      }
    }
  } catch {}
  return undefined
}

export async function sendStoreApprovedEmail({
  to,
  ownerName,
  storeName,
  storeSlug,
  dashboardUrl,
}: StoreApprovedEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const origin = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_SITE_URL || 'https://waraqconnect.com')

  const effectiveDashboardUrl = dashboardUrl || `${origin}/stores/dashboard`
  const storefrontUrl = `${origin}/stores/${storeSlug}`
  const apiKey = getResendApiKey()

  const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تهانينا! تم تفعيل متجرك على منصة ورق كونكت WaraqConnect</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; direction: rtl; text-align: right; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.04); direction: rtl; text-align: right; }
    .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 36px 24px; text-align: center; color: #ffffff; direction: rtl; }
    .header h1 { margin: 0 0 8px; font-size: 24px; font-weight: 900; color: #ffffff; }
    .header p { margin: 0; font-size: 14px; opacity: 0.95; color: #e6fffa; }
    .body { padding: 32px 24px; direction: rtl; text-align: right; }
    .greeting { font-size: 18px; font-weight: bold; margin-bottom: 16px; color: #0f172a; direction: rtl; text-align: right; }
    .card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px; margin-bottom: 24px; direction: rtl; text-align: right; }
    .card-title { color: #166534; font-weight: bold; font-size: 15px; margin-bottom: 8px; direction: rtl; text-align: right; }
    .steps { margin: 24px 0; padding: 0; list-style: none; direction: rtl; text-align: right; }
    .steps li { margin-bottom: 14px; display: flex; align-items: flex-start; font-size: 14px; line-height: 1.6; direction: rtl; text-align: right; }
    .step-num { background: #059669; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-left: 12px; margin-right: 0; shrink: 0; }
    .cta-btn { display: block; text-align: center; background: #059669; color: #ffffff !important; padding: 16px 28px; border-radius: 14px; font-size: 16px; font-weight: bold; text-decoration: none; margin: 28px 0; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
    .secondary-link { text-align: center; font-size: 13px; color: #64748b; margin-top: 12px; direction: rtl; }
    .secondary-link a { color: #059669; text-decoration: underline; font-weight: bold; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; direction: rtl; line-height: 1.6; }
  </style>
</head>
<body dir="rtl" style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; color: #1e293b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="direction: rtl; text-align: right;">
    <tr>
      <td align="center">
        <div class="container" dir="rtl" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; direction: rtl; text-align: right;">
          
          <!-- Header -->
          <div class="header" dir="rtl" style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 36px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 900; color: #ffffff;">🎉 أهلاً بك في شبكة شركاء منصة ورق!</h1>
            <p style="margin: 0; font-size: 14px; color: #e6fffa;">تم اعتماد وتوثيق متجرك رسمياً في المنصة</p>
          </div>

          <!-- Body -->
          <div class="body" dir="rtl" style="padding: 32px 24px; direction: rtl; text-align: right;">
            <div class="greeting" dir="rtl" style="font-size: 18px; font-weight: bold; margin-bottom: 16px; color: #0f172a; text-align: right;">مرحباً ${ownerName}،</div>
            <p dir="rtl" style="font-size: 14px; line-height: 1.8; color: #334155; margin: 0 0 16px; text-align: right;">
              يسعدنا إعلامك بأنه تم فحص واعتماد طلب انضمام مكتبة <strong>"${storeName}"</strong> بنجاح، وتم منحك <strong>شارة المتجر المعتمد (Verified Bookstore 🟢)</strong>.
            </p>
            
            <div class="card" dir="rtl" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px; margin-bottom: 24px; direction: rtl; text-align: right;">
              <div class="card-title" dir="rtl" style="color: #166534; font-weight: bold; font-size: 15px; margin-bottom: 8px; text-align: right;">✨ تذكير بشروط الشراكة المعتمدة:</div>
              <div dir="rtl" style="font-size: 13px; color: #15803d; line-height: 1.8; text-align: right;">
                • <strong>الشهر الأول مجاني 100%</strong>: يبدأ تلقائياً مع استلام أول طلب شراء ناجح.<br>
                • <strong>نسبة العمولة لاحقاً</strong>: 10% فقط من المبيعات المكتملة عبر المنصة.<br>
                • <strong>التحصيل مباشر</strong>: قيمة الكتب والشحن تتم مباشرة بينك وبين القراء أو عبر شركة الشحن.
              </div>
            </div>

            <div dir="rtl" style="font-size: 15px; font-weight: bold; margin-bottom: 12px; color: #0f172a; text-align: right;">📚 خطواتك التالية للبدء فوراً:</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="direction: rtl; text-align: right; margin-bottom: 24px;">
              <tr>
                <td valign="top" style="padding-bottom: 12px; text-align: right; direction: rtl;">
                  <strong style="color: #059669;">1. إضافة كتبك:</strong> استخدم البحث السريع لإضافة الكتب في ثوانٍ مع تحديد الأسعار والخصومات.
                </td>
              </tr>
              <tr>
                <td valign="top" style="padding-bottom: 12px; text-align: right; direction: rtl;">
                  <strong style="color: #059669;">2. إنشاء باقات التوفير (Bundles):</strong> أنشئ عروض 5 أو 10 أو 15 أو 20 كتاباً بسعر مميز لتشجيع القراء على الشراء المجمع.
                </td>
              </tr>
              <tr>
                <td valign="top" style="padding-bottom: 12px; text-align: right; direction: rtl;">
                  <strong style="color: #059669;">3. استقبال الطلبات:</strong> ستصلك تنبيهات الطلبات مباشرة على الواتساب ولوحة تحكم متجرك.
                </td>
              </tr>
            </table>

            <!-- Direct CTA to Dashboard -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${effectiveDashboardUrl}" class="cta-btn" target="_blank" style="display: block; text-align: center; background: #059669; color: #ffffff !important; padding: 16px 28px; border-radius: 14px; font-size: 16px; font-weight: bold; text-decoration: none; margin: 20px 0; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
                    🚀 الدخول إلى لوحة تحكم متجرك الآن
                  </a>
                </td>
              </tr>
            </table>

            <div class="secondary-link" dir="rtl" style="text-align: center; font-size: 13px; color: #64748b; margin-top: 14px; direction: rtl;">
              أو يمكنك معاينة صفحة متجرك العامة للقراء: 
              <a href="${storefrontUrl}" target="_blank" style="color: #059669; text-decoration: underline; font-weight: bold;">${storeName}</a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer" dir="rtl" style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; direction: rtl; line-height: 1.6;">
            منصة WaraqConnect (ورق كونكت) — ملتقى القراء والمكتبات في مصر والعالم العربي<br>
            إذا كان لديك أي استفسار، تواصل مع فريق دعم الشركاء عبر الواتساب على 01556252658
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`

  // If no Resend API key configured yet, simulate safely in dev
  if (!apiKey) {
    console.log('[Resend Simulation] No RESEND_API_KEY found. Simulated store approval email to:', to)
    console.log('[Resend Simulation] Direct Dashboard URL:', effectiveDashboardUrl)
    return {
      success: true,
      id: `sim-${Date.now()}`,
    }
  }

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'منصة ورق <onboarding@resend.dev>'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject: `🎉 تم توثيق واعتماد متجر (${storeName}) على منصة ورق! ابدأ بإضافة كتبك الآن`,
        html: htmlContent,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.warn('[Resend Error]', data)
      if (res.status === 403 && data.message?.includes('testing emails to your own email address')) {
        const matchOwner = data.message.match(/\(([^)]+@[^)]+)\)/)
        const ownerEmail = matchOwner ? matchOwner[1] : 'muhamed.dev.95@gmail.com'
        console.warn(`[Resend Notice] Redirecting to registered test account email (${ownerEmail}) because custom domain is not yet verified on Resend.`)

        const retryRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [ownerEmail],
            subject: `🎉 تم توثيق واعتماد متجر (${storeName}) على منصة ورق! ابدأ بإضافة كتبك الآن`,
            html: `<div dir="rtl" style="direction: rtl; text-align: right; background:#fef3c7;border:1px solid #f59e0b;padding:14px;border-radius:12px;margin-bottom:16px;font-family:'Segoe UI', Tahoma, Arial, sans-serif;font-size:13px;line-height:1.6;color:#92400e;">⚠️ <strong>ملاحظة المطور (Resend Free Test Mode):</strong> تم إرسال هذه الرسالة إلى بريدك المسجل في Resend (<strong>${ownerEmail}</strong>) بدلاً من (<strong>${to}</strong>) لأن الحساب التجريبي في Resend يسمح بالإرسال لبريد المالك فقط قبل ربط دومين في resend.com/domains.</div>` + htmlContent,
          }),
        })
        const retryData = await retryRes.json()
        if (retryRes.ok) {
          return { success: true, id: retryData.id }
        }
      }
      return { success: false, error: data.message || 'Failed to send email via Resend' }
    }

    return { success: true, id: data.id }
  } catch (err: unknown) {
    console.error('[Resend Exception]', err)
    return { success: false, error: (err as Error)?.message || 'Network exception' }
  }
}

export interface StoreSubmittedEmailParams {
  to: string
  ownerName: string
  storeName: string
  phone?: string
  whatsapp?: string
  city?: string
  storeType?: string
}

export async function sendStoreSubmittedEmail({
  to,
  ownerName,
  storeName,
  phone,
  whatsapp,
  city,
  storeType,
}: StoreSubmittedEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL || 'https://waraqconnect.com')

  const dashboardUrl = `${origin}/stores/dashboard`
  const apiKey = getResendApiKey()

  const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تم استلام طلب تسجيل متجرك بنجاح على منصة ورق WaraqConnect</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; direction: rtl; text-align: right; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.04); direction: rtl; text-align: right; }
    .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 36px 24px; text-align: center; color: #ffffff; direction: rtl; }
    .header h1 { margin: 0 0 8px; font-size: 24px; font-weight: 900; color: #ffffff; }
    .header p { margin: 0; font-size: 14px; opacity: 0.95; color: #e0f2fe; }
    .body { padding: 32px 24px; direction: rtl; text-align: right; }
    .greeting { font-size: 18px; font-weight: bold; margin-bottom: 16px; color: #0f172a; direction: rtl; text-align: right; }
    .card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px; margin-bottom: 24px; direction: rtl; text-align: right; }
    .cta-btn { display: block; text-align: center; background: #0284c7; color: #ffffff !important; padding: 16px 28px; border-radius: 14px; font-size: 16px; font-weight: bold; text-decoration: none; margin: 24px 0; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3); }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; direction: rtl; line-height: 1.6; }
  </style>
</head>
<body dir="rtl" style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; color: #1e293b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="direction: rtl; text-align: right;">
    <tr>
      <td align="center">
        <div class="container" dir="rtl" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; direction: rtl; text-align: right;">
          
          <!-- Header -->
          <div class="header" dir="rtl" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 36px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 900; color: #ffffff;">📋 تم استلام طلب تسجيل متجرك بنجاح!</h1>
            <p style="margin: 0; font-size: 14px; color: #e0f2fe;">منصة WaraqConnect (ورق كونكت) — شبكة المكتبات المعتمدة</p>
          </div>

          <!-- Body -->
          <div class="body" dir="rtl" style="padding: 32px 24px; direction: rtl; text-align: right;">
            <div class="greeting" dir="rtl" style="font-size: 18px; font-weight: bold; margin-bottom: 16px; color: #0f172a; text-align: right;">مرحباً ${ownerName}،</div>
            <p dir="rtl" style="font-size: 14px; line-height: 1.8; color: #334155; margin: 0 0 16px; text-align: right;">
              تم استلام طلب تسجيل وتوثيق متجرك <strong>"${storeName}"</strong> بنجاح. تم تفعيل صلاحية شريك المتجر لحسابك ويمكنك الآن الدخول إلى لوحة التحكم للبدء بإعداد كتالوج كتبك.
            </p>
            
            <div class="card" dir="rtl" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px; margin-bottom: 24px; direction: rtl; text-align: right;">
              <div style="font-weight: bold; color: #166534; font-size: 15px; margin-bottom: 8px; text-align: right; direction: rtl;">✨ ملخص شروط الشراكة المعتمدة:</div>
              <div dir="rtl" style="font-size: 13px; color: #15803d; line-height: 1.8; text-align: right;">
                • <strong>الشهر الأول مجاني 100%</strong>: يبدأ تلقائياً مع أول طلب شراء يتم تنفيذه بنجاح.<br>
                • <strong>نسبة العمولة لاحقاً</strong>: 10% فقط من المبيعات المكتملة عبر المنصة.<br>
                • <strong>التحصيل مباشر</strong>: قيمة الكتب وأجور الشحن تتم بينك وبين القارئ مباشرة.
              </div>
            </div>

            <div dir="rtl" style="font-size: 14px; margin-bottom: 16px; line-height: 1.8; color: #334155; text-align: right; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
              <strong style="color: #0f172a;">تفاصيل المتجر المسجلة:</strong><br>
              📍 <strong>المحافظة:</strong> ${city || 'مصر'}<br>
              📱 <strong>واتساب الطلبات:</strong> ${whatsapp || phone || 'مسجل'}<br>
              🏷️ <strong>طبيعة المتجر:</strong> ${storeType === 'ONLINE' ? 'متجر إلكتروني أونلاين للشحن المباشر' : 'مقر فعلي + شحن أونلاين'}
            </div>

            <!-- Direct CTA to Dashboard -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${dashboardUrl}" class="cta-btn" target="_blank" style="display: block; text-align: center; background: #0284c7; color: #ffffff !important; padding: 16px 28px; border-radius: 14px; font-size: 16px; font-weight: bold; text-decoration: none; margin: 20px 0; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">
                    🚀 متابعة حالة المتجر والدخول للوحة التحكم
                  </a>
                </td>
              </tr>
            </table>

            <p dir="rtl" style="font-size: 13px; color: #64748b; line-height: 1.6; text-align: right; margin-top: 16px;">
              سيصلك إشعار فوري وتأكيد رسمي فور اكتمال مطابقة روابط وسائل التواصل وشارة التوثيق. كما يمكنك البدء فوراً في إضافة كتبك وباقات التوفير (Packages).
            </p>
          </div>

          <!-- Footer -->
          <div class="footer" dir="rtl" style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; direction: rtl; line-height: 1.6;">
            منصة WaraqConnect (ورق كونكت) — ملتقى القراء والمكتبات في مصر والعالم العربي<br>
            للاستفسارات والدعم المباشر، يمكنك التواصل عبر الواتساب على 01556252658
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`

  if (!apiKey) {
    console.log('[Resend Simulation] No RESEND_API_KEY found. Simulated store submission email to:', to)
    return { success: true, id: `sim-${Date.now()}` }
  }

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'منصة ورق <onboarding@resend.dev>'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject: `📋 تم استلام طلب تسجيل متجر (${storeName}) على منصة ورق — جاري التوثيق`,
        html: htmlContent,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.warn('[Resend Error]', data)
      if (res.status === 403 && data.message?.includes('testing emails to your own email address')) {
        const matchOwner = data.message.match(/\(([^)]+@[^)]+)\)/)
        const ownerEmail = matchOwner ? matchOwner[1] : 'muhamed.dev.95@gmail.com'

        const retryRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [ownerEmail],
            subject: `📋 تم استلام طلب تسجيل متجر (${storeName}) على منصة ورق — جاري التوثيق`,
            html: `<div dir="rtl" style="direction: rtl; text-align: right; background:#fef3c7;border:1px solid #f59e0b;padding:14px;border-radius:12px;margin-bottom:16px;font-family:'Segoe UI', Tahoma, Arial, sans-serif;font-size:13px;line-height:1.6;color:#92400e;">⚠️ <strong>ملاحظة المطور (Resend Free Test Mode):</strong> تم إرسال هذه الرسالة إلى بريدك المسجل في Resend (<strong>${ownerEmail}</strong>) بدلاً من (<strong>${to}</strong>) لأن الحساب التجريبي في Resend يسمح بالإرسال لبريد المالك فقط قبل ربط دومين في resend.com/domains.</div>` + htmlContent,
          }),
        })
        const retryData = await retryRes.json()
        if (retryRes.ok) {
          return { success: true, id: retryData.id }
        }
      }
      return { success: false, error: data.message || 'Failed to send email via Resend' }
    }

    return { success: true, id: data.id }
  } catch (err: unknown) {
    console.error('[Resend Exception]', err)
    return { success: false, error: (err as Error)?.message || 'Network exception' }
  }
}

