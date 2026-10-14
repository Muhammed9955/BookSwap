'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { useLanguage } from '@/i18n/language-context'
import { Button } from '@/components/ui/button'
import { Store, Calendar, CheckCircle2, Send, MessageCircle, ArrowRight, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PartnerFormClientProps {
  user: { id: string; profile?: Record<string, unknown> | null } | null
}

type PartnerType = 'BOOKSTORE' | 'EVENT_ORGANIZER' | 'BOTH'

export function PartnerFormClient({ user }: PartnerFormClientProps) {
  const { lang, isRTL } = useLanguage()

  const [partnerType, setPartnerType] = useState<PartnerType>('BOOKSTORE')
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [details, setDetails] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)

  const whatsappOwner = '201556252658'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !businessName || !phone) return
    setSending(true)

    const typeLabel =
      partnerType === 'BOOKSTORE'
        ? lang === 'ar' ? 'مكتبة / بوكستور' : 'Bookstore'
        : partnerType === 'EVENT_ORGANIZER'
        ? lang === 'ar' ? 'منظم فعاليات' : 'Event Organizer'
        : lang === 'ar' ? 'مكتبة + فعاليات' : 'Bookstore + Events'

    const message = `🤝 *طلب شراكة جديد — WARAQ | ورق*\n\n` +
      `👤 الاسم: ${name}\n` +
      `🏪 اسم المشروع: ${businessName}\n` +
      `📞 رقم التواصل: ${phone}\n` +
      `📍 المدينة: ${city || 'غير محددة'}\n` +
      `🏷️ نوع الشراكة: ${typeLabel}\n` +
      (details ? `📝 تفاصيل إضافية:\n${details}` : '')

    const whatsappUrl = `https://wa.me/${whatsappOwner}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')

    setTimeout(() => {
      setSending(false)
      setSubmitted(true)
    }, 800)
  }

  if (submitted) {
    return (
      <MainLayout user={user}>
        <div className="page-container py-20 flex flex-col items-center text-center max-w-md mx-auto gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-foreground">
              {lang === 'ar' ? '🎉 تم إرسال طلبك بنجاح!' : '🎉 Request Sent Successfully!'}
            </h1>
            <p className="text-muted-foreground">
              {lang === 'ar'
                ? 'تم فتح واتساب لإرسال تفاصيل طلبك مباشرة إلى فريق وَرَق. سنتواصل معك في أقرب وقت!'
                : 'WhatsApp opened to send your request directly to the WARAQ team. We will be in touch soon!'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full rounded-xl font-bold cursor-pointer">
                {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
              </Button>
            </Link>
            <Link href="/about" className="flex-1">
              <Button className="w-full rounded-xl font-bold cursor-pointer">
                {lang === 'ar' ? 'تعرف علينا أكثر' : 'Learn More About Us'}
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout user={user}>
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient text-white py-16 md:py-20">
        <div className="absolute -top-32 -start-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="page-container relative z-10 max-w-2xl text-center mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-emerald-300">
            <Star className="h-4 w-4" />
            <span>{lang === 'ar' ? 'برنامج الشراكة المبكرة' : 'Early Partner Program'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            {lang === 'ar' ? 'انضم كشريك مميز في وَرَق 🤝' : 'Become a Featured WARAQ Partner 🤝'}
          </h1>
          <p className="text-white/85 text-sm sm:text-base leading-relaxed">
            {lang === 'ar'
              ? 'سواء كنت تمتلك مكتبة أو بوكستور أو تنظم فعاليات ثقافية — تواصل معنا وسيتم نشر تفاصيلك مجاناً لآلاف القراء النشطين على المنصة.'
              : 'Whether you own a bookstore or organize cultural events — reach out and we\'ll feature your details to thousands of active readers on the platform.'}
          </p>
        </div>
      </section>

      <div className="page-container py-10 max-w-xl mx-auto">
        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {[
            { emoji: '📣', ar: 'وصول لآلاف القراء مجاناً', en: 'Free reach to thousands of readers' },
            { emoji: '🌟', ar: 'بروفايل مميز على المنصة', en: 'Featured profile on WARAQ' },
            { emoji: '🤝', ar: 'شراكة مدى الحياة', en: 'Lifetime partnership' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border text-xs font-semibold">
              <span className="text-xl">{b.emoji}</span>
              <span>{lang === 'ar' ? b.ar : b.en}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-black text-foreground">
            {lang === 'ar' ? '📋 تفاصيل طلب الشراكة' : '📋 Partnership Request Details'}
          </h2>

          {/* Partner Type */}
          <div className="space-y-2">
            <label className="text-xs font-black text-foreground">
              {lang === 'ar' ? '1. نوع الشراكة:' : '1. Partnership Type:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'BOOKSTORE', labelAr: '🏪 مكتبة', labelEn: '🏪 Bookstore' },
                { value: 'EVENT_ORGANIZER', labelAr: '🎪 فعاليات', labelEn: '🎪 Events' },
                { value: 'BOTH', labelAr: '✨ كلاهما', labelEn: '✨ Both' },
              ] as { value: PartnerType; labelAr: string; labelEn: string }[]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPartnerType(opt.value)}
                  className={cn(
                    'p-3 rounded-xl border-2 text-xs font-black transition-all cursor-pointer text-center',
                    partnerType === opt.value
                      ? 'border-primary bg-primary text-primary-foreground shadow-md'
                      : 'border-border bg-background hover:border-primary/40 text-foreground'
                  )}
                >
                  {lang === 'ar' ? opt.labelAr : opt.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-foreground">
              {lang === 'ar' ? '2. اسمك الكامل:' : '2. Your Full Name:'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: محمد أحمد' : 'e.g. Mohamed Ahmed'}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Business Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-foreground">
              {lang === 'ar'
                ? partnerType === 'EVENT_ORGANIZER' ? '3. اسم المنظمة / الفعالية:' : '3. اسم المكتبة / المشروع:'
                : partnerType === 'EVENT_ORGANIZER' ? '3. Organization / Event Name:' : '3. Bookstore / Project Name:'}
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: مكتبة دار المعرفة' : 'e.g. Dar Al Marefah Bookstore'}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-foreground">
              {lang === 'ar' ? '4. رقم التواصل (واتساب):' : '4. Contact Number (WhatsApp):'}
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: 01012345678' : 'e.g. 01012345678'}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              dir="ltr"
            />
          </div>

          {/* City */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-foreground">
              {lang === 'ar' ? '5. المدينة (اختياري):' : '5. City (Optional):'}
            </label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: القاهرة، الإسكندرية، المنصورة...' : 'e.g. Cairo, Alexandria, Mansoura...'}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Details */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-foreground">
              {lang === 'ar' ? '6. تفاصيل إضافية (اختياري):' : '6. Additional Details (Optional):'}
            </label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder={lang === 'ar'
                ? 'أخبرنا أكثر عن مشروعك وكيف تتصور الشراكة...'
                : 'Tell us more about your project and how you envision the partnership...'}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              rows={3}
            />
          </div>

          {/* Note */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-200">
            <MessageCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>
              {lang === 'ar'
                ? 'سيفتح واتساب تلقائياً برسالتك الكاملة مرسلة مباشرة لفريق وَرَق. ردنا عادةً خلال 24 ساعة.'
                : 'WhatsApp will open automatically with your complete message sent directly to the WARAQ team. We usually reply within 24 hours.'}
            </span>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full rounded-xl font-black py-6 gap-2 cursor-pointer shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
            disabled={!name || !businessName || !phone || sending}
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                {lang === 'ar' ? 'جاري الإرسال...' : 'Sending...'}
              </span>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>{lang === 'ar' ? 'إرسال عبر واتساب' : 'Send via WhatsApp'}</span>
                <ArrowRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              </>
            )}
          </Button>
        </form>

        {/* Partner types visual */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border flex items-start gap-3">
            <Store className="h-8 w-8 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-black text-sm">{lang === 'ar' ? 'مكتبات وبوكستورز' : 'Bookstores & Shops'}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {lang === 'ar'
                  ? 'احصل على صفحة مميزة تضم عنوانك ومنتجاتك ومبادراتك لآلاف القراء.'
                  : 'Get a featured page with your address, products, and initiatives in front of thousands.'}
              </p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border flex items-start gap-3">
            <Calendar className="h-8 w-8 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-black text-sm">{lang === 'ar' ? 'منظمو الفعاليات' : 'Event Organizers'}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {lang === 'ar'
                  ? 'أضف فعالياتك وملتقياتك وحفلات التوقيع مباشرة على منصة وَرَق.'
                  : 'Add your events, meetups, and signing sessions directly on the WARAQ platform.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
