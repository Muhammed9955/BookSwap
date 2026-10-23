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
  const apiKey = process.env.RESEND_API_KEY

  const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>تهانينا! تم تفعيل متجرك على منصة WaraqConnect</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
    .header { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 36px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 8px; font-size: 26px; font-weight: 900; }
    .header p { margin: 0; font-size: 15px; opacity: 0.95; }
    .body { padding: 32px 24px; }
    .greeting { font-size: 18px; font-weight: bold; margin-bottom: 16px; color: #0f172a; }
    .card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px; margin-bottom: 24px; }
    .card-title { color: #166534; font-weight: bold; font-size: 15px; margin-bottom: 8px; }
    .steps { margin: 24px 0; padding: 0; list-style: none; }
    .steps li { margin-bottom: 14px; display: flex; align-items: flex-start; font-size: 14px; line-height: 1.5; }
    .step-num { background: #059669; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-left: 10px; shrink: 0; }
    .cta-btn { display: block; text-align: center; background: #059669; color: #ffffff !important; padding: 16px 28px; border-radius: 14px; font-size: 16px; font-weight: bold; text-decoration: none; margin: 28px 0; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
    .secondary-link { text-align: center; font-size: 13px; color: #64748b; margin-top: 12px; }
    .secondary-link a { color: #059669; text-decoration: underline; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 أهلاً بك في شبكة شركاء WaraqConnect!</h1>
      <p>تم اعتماد وتوثيق متجرك رسمياً في المنصة</p>
    </div>
    <div class="body">
      <div class="greeting">مرحباً ${ownerName}،</div>
      <p>يسعدنا إعلامك بأنه تم فحص واعتماد طلب انضمام <strong>"${storeName}"</strong> بنجاح، وتم منحك <strong>شارة المتجر المعتمد (Verified Bookstore)</strong>.</p>
      
      <div class="card">
        <div class="card-title">✨ تذكير بشروط الشراكة المعتمدة:</div>
        <div style="font-size: 13px; color: #15803d; line-height: 1.6;">
          • الشهر الأول مجاني 100% ويبدأ تلقائياً مع استلام أول طلب ناجح.<br>
          • نسبة العمولة لاحقاً: 10% فقط من المبيعات المكتملة عبر المنصة.<br>
          • التحصيل والأموال تتم مباشرة بينك وبين القراء أو عبر خدمة التوصيل.
        </div>
      </div>

      <div style="font-size: 15px; font-weight: bold; margin-bottom: 12px;">📚 خطواتك التالية للبدء فوراً:</div>
      <ul class="steps">
        <li>
          <span class="step-num">1</span>
          <div><strong>إضافة كتبك:</strong> استخدم ميزة البحث السريع في لوحة التحكم لإضافة الكتب بضغطة زر وتحديد السعر والكمية والخصومات.</div>
        </li>
        <li>
          <span class="step-num">2</span>
          <div><strong>إنشاء باقات التوفير (Bundles):</strong> أنشئ عروض 5 أو 10 أو 15 أو 20 كتاباً بسعر مميز لتشجيع القراء على الشراء المجمع.</div>
        </li>
        <li>
          <span class="step-num">3</span>
          <div><strong>استقبال الطلبات:</strong> ستصلك طلبات القراء والباكدجات مباشرة على الواتساب ولوحة تحكم متجرك.</div>
        </li>
      </ul>

      <!-- DIRECT LINK TO STORE DASHBOARD -->
      <a href="${effectiveDashboardUrl}" class="cta-btn" target="_blank">
        🚀 الدخول إلى لوحة تحكم متجرك الآن
      </a>

      <div class="secondary-link">
        أو يمكنك تصفح صفحة متجرك العامة للقراء: 
        <a href="${storefrontUrl}" target="_blank">${storeName}</a>
      </div>
    </div>
    <div class="footer">
      منصة WaraqConnect (ورق كونكت) — ملتقى القراء والمكتبات في مصر والعالم العربي<br>
      إذا كان لديك أي استفسار، تواصل مع فريق دعم الشركاء عبر الواتساب على 01556252658
    </div>
  </div>
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
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'WaraqConnect <noreply@waraqconnect.com>',
        to: [to],
        subject: `🎉 تم توثيق واعتماد متجر (${storeName}) على منصة WaraqConnect! ابدأ بإضافة كتبك الآن`,
        html: htmlContent,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.warn('[Resend Error]', data)
      return { success: false, error: data.message || 'Failed to send email via Resend' }
    }

    return { success: true, id: data.id }
  } catch (err: unknown) {
    console.error('[Resend Exception]', err)
    return { success: false, error: (err as Error)?.message || 'Network exception' }
  }
}
