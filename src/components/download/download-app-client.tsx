'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  Smartphone,
  Download,
  Camera,
  Bell,
  MapPin,
  WifiOff,
  Sparkles,
  CheckCircle2,
  Share2,
  ArrowRight,
  ShieldCheck,
  Star,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Send,
  Edit2,
  Save,
  FileImage,
  RefreshCw,
  Globe,
  Layers,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/i18n/language-context'
import { cn } from '@/lib/utils'

interface DownloadAppClientProps {
  defaultDeployUrl?: string
}

export function DownloadAppClient({ defaultDeployUrl }: DownloadAppClientProps) {
  const { lang, isRTL } = useLanguage()

  // Determine initial deployed URL (favoring Vercel deployment if local)
  const initialUrl = React.useMemo(() => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      return window.location.origin
    }
    return defaultDeployUrl && !defaultDeployUrl.includes('localhost')
      ? defaultDeployUrl
      : 'https://waraqconnect.vercel.app'
  }, [defaultDeployUrl])

  const [activeUrl, setActiveUrl] = useState<string>(initialUrl)
  const [isEditingUrl, setIsEditingUrl] = useState(false)
  const [customUrlInput, setCustomUrlInput] = useState(initialUrl)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [installSuccess, setInstallSuccess] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isGeneratingCard, setIsGeneratingCard] = useState(false)

  // Regenerate High-Resolution QR Code whenever activeUrl changes
  useEffect(() => {
    QRCode.toDataURL(activeUrl, {
      width: 480,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0F2F23',
        light: '#FFFFFF',
      },
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(() => {})
  }, [activeUrl])

  // Listen for PWA beforeinstallprompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handlePwaInstall = async () => {
    if (!deferredPrompt) {
      alert(
        lang === 'ar'
          ? 'لتثبيت التطبيق على آيفون: اضغط زر "المشاركة" (Share ⎋) في متصفح Safari ثم اختر "إضافة إلى الشاشة الرئيسية". وعلى أندرويد: اضغط زر القائمة (⋮) في متصفح Chrome ثم "تثبيت التطبيق".'
          : 'To install on iOS: Tap Share in Safari -> "Add to Home Screen". On Android: Tap menu (⋮) in Chrome -> "Install App".'
      )
      return
    }
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallSuccess(true)
      setIsInstallable(false)
    }
    setDeferredPrompt(null)
  }

  // Copy share link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  // Native Web Share API
  const handleNativeShare = async () => {
    const shareData = {
      title: 'WaraqConnect — تطبيق ورق كونكت لمجتمع القراء والكتب',
      text:
        lang === 'ar'
          ? 'جرّب تطبيق WaraqConnect (ورق كونكت) لتبادل واستعارة الكتب المستعملة في مصر مع نقاط كافيهات آمنة وبدون عمولات! ثبّت التطبيق مباشرة:'
          : 'Check out WaraqConnect to swap & discover secondhand books with 0% fees! Open or install the app here:',
      url: activeUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {}
    } else {
      handleCopyLink()
    }
  }

  // Share to WhatsApp
  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      lang === 'ar'
        ? `📚 مرحباً! جرّب تطبيق «WaraqConnect — ورق كونكت» لتبادل واستعارة وشراء الكتب المستعملة مع قراء حيك ومدينتك وبدون عمولات.\nثبّت التطبيق فوراً من الرابط:\n${activeUrl}`
        : `📚 Hello! Try the WaraqConnect app for swapping and discovering secondhand books with local readers.\nOpen or install the app here:\n${activeUrl}`
    )
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank')
  }

  // Share to Telegram
  const handleTelegramShare = () => {
    const text = encodeURIComponent(
      lang === 'ar'
        ? 'تطبيق WaraqConnect (ورق كونكت) لتبادل واستعارة الكتب المستعملة 📚'
        : 'WaraqConnect Book Swapping & Reading App 📚'
    )
    window.open(`https://t.me/share/url?url=${encodeURIComponent(activeUrl)}&text=${text}`, '_blank')
  }

  // Download Printable QR Flyer Card (PNG Canvas Generator)
  const handleDownloadQrCard = async () => {
    if (!qrCodeDataUrl) return
    setIsGeneratingCard(true)

    try {
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 1100
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 1. Rich Emerald Gradient Background
      const grad = ctx.createLinearGradient(0, 0, 800, 1100)
      grad.addColorStop(0, '#091E17')
      grad.addColorStop(0.5, '#143D30')
      grad.addColorStop(1, '#071612')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 800, 1100)

      // 2. Decorative Outer Border
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)'
      ctx.lineWidth = 3
      ctx.strokeRect(28, 28, 744, 1044)

      // 3. Brand Pill & Header
      ctx.fillStyle = '#34D399' // emerald-400
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('تطبيق ورق كونكت للموبايل • WARAQCONNECT APP', 400, 85)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = '900 44px system-ui, -apple-system, sans-serif'
      ctx.fillText('عالم جديد بين كل صفحة والتانية 📚', 400, 145)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
      ctx.font = '500 18px system-ui, -apple-system, sans-serif'
      ctx.fillText('منصة تبادل وشراء واستعارة الكتب المستعملة في مصر', 400, 185)

      // 4. White Rounded Container for QR
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.roundRect(140, 225, 520, 520, 36)
      ctx.fill()

      // 5. Draw QR Code
      const qrImage = new window.Image()
      qrImage.crossOrigin = 'anonymous'
      qrImage.src = qrCodeDataUrl
      await new Promise(resolve => {
        qrImage.onload = resolve
      })
      ctx.drawImage(qrImage, 170, 255, 460, 460)

      // 6. Subtitle & Scan Instruction
      ctx.fillStyle = '#FDE68A' // amber-200
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif'
      ctx.fillText('امسح الكود بكاميرا هاتفك لفتح وتثبيت التطبيق فوراً', 400, 800)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.font = '500 17px system-ui, -apple-system, sans-serif'
      ctx.fillText('Scan with your phone camera to open & install instantly', 400, 835)

      // 7. URL box
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
      ctx.beginPath()
      ctx.roundRect(140, 875, 520, 56, 18)
      ctx.fill()
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#6EE7B7'
      ctx.font = 'bold 19px monospace'
      ctx.fillText(activeUrl, 400, 910)

      // 8. Footer Feature Badges
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif'
      ctx.fillText('⚡ تطبيق ويب متقدم PWA • ماسح باركود • نقاط كافيهات آمنة • 0% عمولة', 400, 995)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.font = 'normal 13px system-ui, -apple-system, sans-serif'
      ctx.fillText('يعمل على آيفون وأندرويد والكمبيوتر بدون الحاجة لمتجر تطبيقات', 400, 1025)

      // Trigger Download
      const downloadUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = 'WaraqConnect_App_QR_Card.png'
      a.click()
    } finally {
      setIsGeneratingCard(false)
    }
  }

  // Download raw QR code only
  const handleDownloadQrOnly = () => {
    if (!qrCodeDataUrl) return
    const a = document.createElement('a')
    a.href = qrCodeDataUrl
    a.download = 'WaraqConnect_QR_Code.png'
    a.click()
  }

  const handleSaveCustomUrl = (e: React.FormEvent) => {
    e.preventDefault()
    let clean = customUrlInput.trim()
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`
    }
    setActiveUrl(clean)
    setIsEditingUrl(false)
  }

  return (
    <MainLayout>
      <div className="page-container py-10 max-w-7xl">
        {/* Top Notification if Installed */}
        {installSuccess && (
          <div className="p-4 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-2 mb-6 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{lang === 'ar' ? 'تم تثبيت تطبيق WaraqConnect بنجاح على جهازك!' : 'WaraqConnect installed successfully on your device!'}</span>
          </div>
        )}

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 border-2 border-emerald-500/30 text-white p-6 sm:p-12 shadow-2xl mb-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left Column: Information, PWA Install & Share Station */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md text-emerald-300 text-xs font-black border border-emerald-500/30">
                <Smartphone className="h-4 w-4" />
                <span>{lang === 'ar' ? 'تطبيق ويب متقدم PWA • يعمل بدون متجر تطبيقات' : 'Standalone Progressive Web App (PWA)'}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                {lang === 'ar'
                  ? 'مكتبتك ومجتمع القراء معك على هاتفك 📱✨'
                  : 'Your Bookshelf & Reader Community on Mobile 📱✨'}
              </h1>

              <p className="text-sm sm:text-base text-white/80 leading-relaxed font-medium">
                {lang === 'ar'
                  ? 'ثبّت تطبيق WaraqConnect (ورق كونكت) فوراً على شاشة هاتفك الرئيسية بنقرة واحدة بدون الحاجة لمتجر تطبيقات أو انتظار تحميل. استمتع بماسح الباركود بالكاميرا، تنبيهات المبادلة الفورية، وتصفح رف كتبك وتحديات القراءة حتى بدون إنترنت.'
                  : 'Install WaraqConnect directly to your smartphone home screen with 1 tap—no app store required! Enjoy instant camera barcode scanning, live swap push alerts, and offline bookshelf access.'}
              </p>

              {/* Main 1-Click PWA Install CTA */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  size="lg"
                  onClick={handlePwaInstall}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black shadow-xl shadow-emerald-500/30 px-7 py-6 rounded-2xl cursor-pointer hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  <span>
                    {lang === 'ar' ? 'تثبيت فوري على هاتفك (PWA)' : '1-Tap Install App on Phone'}
                  </span>
                </Button>

                <Button
                  size="lg"
                  variant="ghost"
                  onClick={handleNativeShare}
                  className="border-2 border-white/20 hover:border-white/40 bg-white/10 text-white backdrop-blur-md px-6 py-6 rounded-2xl text-xs sm:text-sm font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'مشاركة التطبيق مع الأصدقاء' : 'Share App Link'}</span>
                </Button>
              </div>

              {/* Fast Sharing Buttons (WhatsApp / Copy Link / Telegram) */}
              <div className="pt-2 space-y-2.5">
                <span className="text-xs font-bold text-white/70 block">
                  {lang === 'ar' ? 'مشاركة سريعة عبر القنوات:' : 'Quick Share Channels:'}
                </span>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* WhatsApp */}
                  <Button
                    size="sm"
                    onClick={handleWhatsAppShare}
                    className="bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'واتساب WhatsApp' : 'WhatsApp'}</span>
                  </Button>

                  {/* Telegram */}
                  <Button
                    size="sm"
                    onClick={handleTelegramShare}
                    className="bg-sky-600/90 hover:bg-sky-600 text-white font-bold text-xs rounded-xl gap-1.5 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'تيليجرام Telegram' : 'Telegram'}</span>
                  </Button>

                  {/* Copy Link */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20 font-bold text-xs rounded-xl gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedLink ? (lang === 'ar' ? 'تم نسخ الرابط!' : 'Copied!') : (lang === 'ar' ? 'نسخ الرابط' : 'Copy Link')}</span>
                  </Button>
                </div>
              </div>

              {/* Target URL Display & Customizer (Linked to Vercel) */}
              <div className="pt-2 p-3.5 rounded-2xl bg-black/40 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-white/60 block font-semibold leading-none">
                      {lang === 'ar' ? 'رابط التطبيق المرتبط بـ Vercel والـ QR:' : 'Active App & QR Link (Vercel):'}
                    </span>
                    <a
                      href={activeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono font-bold text-emerald-300 hover:underline truncate block mt-0.5"
                    >
                      {activeUrl}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isEditingUrl ? (
                    <form onSubmit={handleSaveCustomUrl} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={customUrlInput}
                        onChange={e => setCustomUrlInput(e.target.value)}
                        className="bg-black/60 border border-emerald-500 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none"
                        placeholder="https://your-project.vercel.app"
                      />
                      <Button size="sm" type="submit" className="h-7 text-[11px] rounded-lg font-bold px-2.5">
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => setIsEditingUrl(false)}
                        className="h-7 text-[11px] rounded-lg px-2"
                      >
                        ✕
                      </Button>
                    </form>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setCustomUrlInput(activeUrl)
                        setIsEditingUrl(true)
                      }}
                      className="h-7 text-[11px] text-white/80 hover:text-white rounded-lg gap-1 border border-white/10"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>{lang === 'ar' ? 'تعديل الرابط' : 'Change URL'}</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Trust Metric Chips */}
              <div className="pt-1 flex flex-wrap items-center gap-6 text-white/70 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>{lang === 'ar' ? 'آمن وسريع • حجم أقل من 3 ميجابايت' : 'Ultra lightweight (<3MB)'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span>{lang === 'ar' ? 'يعمل بدون متجر تطبيقات على كل الأنظمة' : 'Zero store approval wait time'}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Prominent Large QR Code Station + Download QR Card */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full max-w-sm rounded-[36px] bg-card text-foreground border-4 border-emerald-500/40 p-6 sm:p-7 shadow-2xl space-y-5 text-center relative">
                {/* Glow Ring Accent */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-md">
                  {lang === 'ar' ? 'امسح للتثبيت الفوري 📸' : 'Scan to Install Instantly 📸'}
                </div>

                {/* Header text inside scan card */}
                <div className="pt-2">
                  <h3 className="font-black text-lg text-foreground">
                    {lang === 'ar' ? 'رمز الاستجابة السريع (QR Code)' : 'App QR Scan Station'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lang === 'ar' ? 'وجّه كاميرا هاتفك لفتح وتثبيت التطبيق مباشرة:' : 'Point your smartphone camera to open:'}
                  </p>
                </div>

                {/* Big Prominent QR Code with Scanner Brackets */}
                <div className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 p-3 rounded-3xl bg-white shadow-xl border-2 border-emerald-500/30 flex items-center justify-center">
                  {/* Decorative Corner Scanner Brackets */}
                  <div className="absolute top-2 start-2 w-5 h-5 border-t-4 border-s-4 border-emerald-600 rounded-tl-lg" />
                  <div className="absolute top-2 end-2 w-5 h-5 border-t-4 border-e-4 border-emerald-600 rounded-tr-lg" />
                  <div className="absolute bottom-2 start-2 w-5 h-5 border-b-4 border-s-4 border-emerald-600 rounded-bl-lg" />
                  <div className="absolute bottom-2 end-2 w-5 h-5 border-b-4 border-e-4 border-emerald-600 rounded-br-lg" />

                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="WaraqConnect App QR Code"
                      className="w-full h-full object-contain rounded-2xl"
                    />
                  ) : (
                    <div className="flex items-center justify-center text-xs text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                {/* Active Link Preview Pill */}
                <div className="p-2.5 rounded-2xl bg-muted/60 border border-border text-[11px] font-mono text-muted-foreground truncate">
                  {activeUrl}
                </div>

                {/* Download Printable Card Buttons */}
                <div className="space-y-2 pt-1">
                  <Button
                    onClick={handleDownloadQrCard}
                    disabled={isGeneratingCard || !qrCodeDataUrl}
                    className="w-full rounded-2xl font-black text-xs gap-2 py-5 shadow-lg shadow-emerald-500/25 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  >
                    <FileImage className="h-4 w-4" />
                    <span>
                      {isGeneratingCard
                        ? (lang === 'ar' ? 'جاري إنشاء البطاقة...' : 'Generating Card...')
                        : (lang === 'ar' ? 'تحميل بطاقة الـ QR للطباعة والمشاركة (PNG)' : 'Download Printable QR Card (PNG)')}
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadQrOnly}
                    className="w-full rounded-xl font-bold text-xs gap-1.5 border-border hover:border-primary cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'تحميل رمز الـ QR فقط (PNG)' : 'Download Raw QR Image Only'}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-6 mb-16">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {lang === 'ar' ? 'لماذا تستخدم تطبيق WaraqConnect على هاتفك؟' : 'Why Use the WaraqConnect App on Your Phone?'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {lang === 'ar'
                ? 'مزايا حصرية وتكامل مع عتاد الهاتف تجعل تجربة تدوير الكتب والالتقاء بمجتمع القراء أسرع بـ 10 أضعاف.'
                : 'Native hardware integration making book swapping and reader meetups 10x faster.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-3 shadow-xs hover:border-primary/50 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <Camera className="h-6 w-6" />
              </div>
              <h3 className="font-black text-base text-foreground">
                {lang === 'ar' ? 'ماسح الباركود بالكاميرا' : 'Instant Barcode Scanner'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'ar'
                  ? 'وجّه كاميرا هاتفك لباركود أي كتاب لملء العنوان والغلاف والبيانات تلقائياً وإضافته لرفك في 5 ثوانٍ.'
                  : 'Scan any ISBN barcode with your camera to autofill metadata and list books in 5 seconds.'}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-3 shadow-xs hover:border-emerald-500/50 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="font-black text-base text-foreground">
                {lang === 'ar' ? 'إشعارات المبادلة الفورية' : 'Instant Push Alerts'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'ar'
                  ? 'لا تفوت أي فرصة قراءة! إشعار فوري على شاشة قفل هاتفك عندما يطلب قارئ مبادلة أحد كتبك.'
                  : 'Get notified the exact second another reader requests your book or sends a meetup proposal.'}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-3 shadow-xs hover:border-amber-500/50 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="font-black text-base text-foreground">
                {lang === 'ar' ? 'رادار القراء ونقاط الكافيهات' : 'Nearby Readers Radar'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'ar'
                  ? 'خريطة تفاعلية لمعرفة الكتب المتاحة ونقاط التبادل الآمنة (سيلانترو، ديوان) في محيط سكنك وجامعتك.'
                  : 'Interactive map locating nearby physical books and certified safe exchange hubs around you.'}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-3 shadow-xs hover:border-indigo-500/50 transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <WifiOff className="h-6 w-6" />
              </div>
              <h3 className="font-black text-base text-foreground">
                {lang === 'ar' ? 'رف كتبي بدون إنترنت' : 'Offline Bookshelf Access'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'ar'
                  ? 'تصفح قائمة أمنياتك ورف كتبك المعروضة وتتبع تقدم تحديات القراءة في المترو وبدون اتصال بالشبكة.'
                  : 'Access your shelf, wishlist, and reading sprint progress on the go even with zero connectivity.'}
              </p>
            </div>
          </div>
        </div>

        {/* Step-by-Step Installation Guides */}
        <div className="rounded-3xl border-2 border-border/80 bg-muted/30 p-8 sm:p-10 space-y-6">
          <h3 className="text-xl font-black text-foreground text-center">
            {lang === 'ar' ? 'طريقة تثبيت التطبيق خلال 10 ثوانٍ' : 'How to Install in 10 Seconds'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* iOS Guide */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-2 text-sm font-black text-foreground">
                <span className="text-xl">🍏</span>
                <span>{lang === 'ar' ? 'على أجهزة آيفون وآيباد (Safari):' : 'On iPhone & iPad (Safari):'}</span>
              </div>
              <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside leading-relaxed">
                <li>{lang === 'ar' ? `افتح الرابط ${activeUrl} في متصفح Safari.` : `Open ${activeUrl} in Safari browser.`}</li>
                <li>{lang === 'ar' ? 'اضغط على زر المشاركة (Share ⎋) أسفل الشاشة.' : 'Tap the Share icon at the bottom.'}</li>
                <li>{lang === 'ar' ? 'اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).' : 'Select "Add to Home Screen".'}</li>
                <li>{lang === 'ar' ? 'سيظهر تطبيق وَرَق كأيقونة تطبيق كاملة على هاتفك بدون أي متجر.' : 'WARAQ will appear as a full standalone app.'}</li>
              </ol>
            </div>

            {/* Android Guide */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-2 text-sm font-black text-foreground">
                <span className="text-xl">🤖</span>
                <span>{lang === 'ar' ? 'على أجهزة أندرويد (Chrome):' : 'On Android Devices (Chrome):'}</span>
              </div>
              <ol className="space-y-2 text-xs text-muted-foreground list-decimal list-inside leading-relaxed">
                <li>{lang === 'ar' ? `افتح الرابط ${activeUrl} في متصفح Chrome.` : `Open ${activeUrl} in Chrome browser.`}</li>
                <li>{lang === 'ar' ? 'اضغط زر "تثبيت فوري" في أعلى الصفحة، أو قائمة (⋮).' : 'Tap "Install App" or menu (⋮).'}</li>
                <li>{lang === 'ar' ? 'اختر "تثبيت التطبيق" (Install Application).' : 'Select "Install App".'}</li>
                <li>{lang === 'ar' ? 'استمتع بالتطبيق بشاشة كاملة وسرعة فائقة وبدون أي متجر.' : 'Enjoy full screen standalone performance.'}</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
