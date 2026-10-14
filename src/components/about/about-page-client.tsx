'use client'

import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { useLanguage } from '@/i18n/language-context'
import {
  BookOpen, Users, ArrowRightLeft, Clock, Phone, Mail, MessageCircle,
  Heart, Globe, Shield, Sparkles, Star, MapPin, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AboutPageClientProps {
  user: { id: string; profile?: Record<string, unknown> | null } | null
}

export function AboutPageClient({ user }: AboutPageClientProps) {
  const { lang, isRTL } = useLanguage()

  const whatsappNumber = '201556252658'
  const email = 'muhamed.dev.95@gmail.com'
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    lang === 'ar'
      ? 'مرحباً بفريق WARAQ | ورق! أود التواصل معكم.'
      : 'Hello WARAQ team! I would like to get in touch.'
  )}`

  const values = [
    {
      icon: <Heart className="h-6 w-6" />,
      color: 'from-rose-500/15 to-pink-500/15 border-rose-500/20 text-rose-600 dark:text-rose-400',
      titleAr: 'مجتمع أولاً',
      titleEn: 'Community First',
      descAr: 'نبني منصة يبنيها القراء أنفسهم — مكان حقيقي للتواصل وتبادل الأفكار قبل الكتب.',
      descEn: 'We build a platform shaped by readers themselves — a real place to connect and share ideas, not just books.',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      color: 'from-emerald-500/15 to-teal-500/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      titleAr: 'ثقة وأمان',
      titleEn: 'Trust & Safety',
      descAr: 'نظام تأمين مسترد، تقييمات حقيقية، ونقاط لقاء آمنة معتمدة لكل عملية تبادل.',
      descEn: 'Refundable deposits, verified reviews, and safe meetup hubs for every swap — because trust is everything.',
    },
    {
      icon: <Globe className="h-6 w-6" />,
      color: 'from-blue-500/15 to-indigo-500/15 border-blue-500/20 text-blue-600 dark:text-blue-400',
      titleAr: 'وصول عالمي',
      titleEn: 'Global Access',
      descAr: 'نحلم بيوم يتبادل فيه قارئ في القاهرة كتاباً مع قارئ في لندن أو دبي بسهولة تامة.',
      descEn: 'We dream of the day a reader in Cairo swaps a book with one in London or Dubai — seamlessly.',
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      color: 'from-amber-500/15 to-orange-500/15 border-amber-500/20 text-amber-600 dark:text-amber-400',
      titleAr: 'مجاني دائماً',
      titleEn: 'Always Free',
      descAr: 'المبادلة بين القراء مجانية بالكامل — لا عمولات، لا وسطاء، لا رسوم مخفية.',
      descEn: 'Reader-to-reader swaps are 100% free — no commissions, no brokers, no hidden fees. Ever.',
    },
  ]

  const milestones = [
    {
      year: '2024',
      titleAr: 'فكرة الانطلاق',
      titleEn: 'The Spark',
      descAr: 'بدأت الفكرة من إحساسنا بأن الكتب الجيدة تستحق أن تنتقل بين أيدي أكثر من قارئ.',
      descEn: 'The idea started from a simple belief: great books deserve more than one reader.',
    },
    {
      year: '2025',
      titleAr: 'النسخة التجريبية',
      titleEn: 'Beta Launch',
      descAr: 'أطلقنا النسخة الأولى وبدأنا نبني مجتمعاً حقيقياً من القراء في مصر والوطن العربي.',
      descEn: 'We launched our first version and started building a real community of readers across Egypt and the Arab world.',
    },
    {
      year: '2025+',
      titleAr: 'التوسع العالمي',
      titleEn: 'Going Global',
      descAr: 'الهدف هو أكبر مجتمع عربي لتبادل الكتب — ونقاط لقاء آمنة في كل مدينة عربية كبرى.',
      descEn: 'The goal: the largest Arabic book-swap community — with safe hubs in every major Arab city.',
    },
  ]

  return (
    <MainLayout user={user}>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden hero-gradient text-white py-20 md:py-28">
        {/* Glows */}
        <div className="absolute -top-32 -start-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 end-0 h-80 w-80 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />

        <div className="page-container relative z-10 text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-emerald-300">
            <BookOpen className="h-4 w-4" />
            <span>{lang === 'ar' ? 'قصة وَرَق | WARAQ Story' : 'The WARAQ Story'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-white">
            {lang === 'ar' ? (
              <>
                عالم جديد..{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-amber-200 to-emerald-300">
                  بين كل صفحة والتانية
                </span>
              </>
            ) : (
              <>
                A World..{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-amber-200 to-emerald-300">
                  Between Every Page
                </span>
              </>
            )}
          </h1>

          <p className="text-base sm:text-lg text-white/85 leading-relaxed font-medium">
            {lang === 'ar'
              ? 'وَرَق — منصة عربية لتبادل واستعارة وشراء الكتب المستعملة ونوادي القراءة في مدينتك. نؤمن أن الكتاب الجيد يستحق أن يُقرأ أكثر من مرة، وبدون أي عمولات أو تكاليف شحن مرتفعة.'
              : 'WARAQ — A World Between Every Page. The modern platform connecting readers to swap, borrow, and buy secondhand books locally with zero broker fees.'}
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link href="/books/add">
              <Button className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-8 py-6 rounded-2xl shadow-xl cursor-pointer">
                {lang === 'ar' ? 'أضف كتابك مجاناً' : 'List Your Book Free'}
              </Button>
            </Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 rounded-2xl font-bold cursor-pointer"
              >
                <MessageCircle className="h-5 w-5 me-2" />
                {lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}
              </Button>
            </a>
          </div>
        </div>
      </section>

      <div className="page-container py-12 space-y-16 max-w-5xl mx-auto">

        {/* ── VISION ── */}
        <section className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            {lang === 'ar' ? '🎯 رؤيتنا' : '🎯 Our Vision'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: <Users className="h-6 w-6" />, valAr: 'مجتمع قراء حقيقي', valEn: 'Real Readers Community', descAr: 'نبني أكبر شبكة عربية لمحبي الكتب — حيث يصنع القراء المحتوى ويتشاركون معرفتهم.', descEn: 'Building the largest Arabic book-lovers network — where readers create content and share knowledge.' },
              { icon: <ArrowRightLeft className="h-6 w-6" />, valAr: 'تبادل بلا حدود', valEn: 'Borderless Exchange', descAr: 'نريد يوماً يتبادل فيه قارئ في الجزائر كتاباً مع قارئ في السعودية أو مصر بنقرة واحدة.', descEn: 'We want a day when a reader in Algeria swaps a book with one in Saudi Arabia or Egypt in one click.' },
              { icon: <Clock className="h-6 w-6" />, valAr: 'مكتبة متجددة دائماً', valEn: 'Ever-Renewing Library', descAr: 'كل كتاب يُباع أو يُبادل هو فرصة لقراءة جديدة — مكتبتك الشخصية تتجدد بتكلفة أقل.', descEn: 'Every book sold or swapped is a new reading opportunity — your personal library, renewed for less.' },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all space-y-3"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {item.icon}
                </div>
                <h3 className="font-black text-foreground">{lang === 'ar' ? item.valAr : item.valEn}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{lang === 'ar' ? item.descAr : item.descEn}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── VALUES ── */}
        <section className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            {lang === 'ar' ? '💡 قيمنا' : '💡 What We Stand For'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((v, i) => (
              <div
                key={i}
                className={cn(
                  'p-5 rounded-2xl border bg-gradient-to-br flex items-start gap-4',
                  v.color
                )}
              >
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/50 dark:bg-black/20', v.color)}>
                  {v.icon}
                </div>
                <div>
                  <h3 className="font-black text-foreground mb-1">{lang === 'ar' ? v.titleAr : v.titleEn}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{lang === 'ar' ? v.descAr : v.descEn}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TIMELINE ── */}
        <section className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            {lang === 'ar' ? '🗓️ رحلتنا' : '🗓️ Our Journey'}
          </h2>
          <div className="relative border-s-2 border-primary/30 ps-8 space-y-8">
            {milestones.map((m, i) => (
              <div key={i} className="relative">
                <div className="absolute -start-[1.65rem] top-1 h-5 w-5 rounded-full bg-primary border-2 border-background shadow" />
                <p className="text-xs font-black text-primary mb-1">{m.year}</p>
                <h3 className="font-black text-foreground">{lang === 'ar' ? m.titleAr : m.titleEn}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {lang === 'ar' ? m.descAr : m.descEn}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            {lang === 'ar' ? '🔄 كيف تعمل المنصة؟' : '🔄 How Does WARAQ Work?'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '1', emoji: '📸', titleAr: 'أضف كتابك', titleEn: 'List Your Book', descAr: 'صور الكتاب أو ابحث بالـ ISBN وأضفه في ثوانٍ. حدد السعر أو نوع التبادل بحرية.', descEn: 'Photo your book or search by ISBN. Set price or swap terms freely.' },
              { step: '2', emoji: '🔍', titleAr: 'ابحث وتواصل', titleEn: 'Search & Connect', descAr: 'ابحث عن الكتاب الذي تريده، اطلب شراءه أو مبادلته أو استعارته مباشرة من المالك.', descEn: 'Find the book you want. Request to buy, swap, or borrow it directly from the owner.' },
              { step: '3', emoji: '🤝', titleAr: 'الق وأتمّ الصفقة', titleEn: 'Meet & Complete', descAr: 'تقابل في مكان آمن وأتمّ الصفقة. قيّم تجربتك لمساعدة المجتمع.', descEn: 'Meet at a safe spot and seal the deal. Rate your experience to help the community.' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border hover:border-primary/30 hover:shadow-lg transition-all">
                <div className="text-4xl mb-3">{item.emoji}</div>
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold text-base mb-2">{lang === 'ar' ? item.titleAr : item.titleEn}</h3>
                <p className="text-sm text-muted-foreground">{lang === 'ar' ? item.descAr : item.descEn}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section className="rounded-3xl bg-gradient-to-br from-primary/10 via-indigo-500/5 to-violet-500/10 border border-primary/20 p-8 md:p-12 space-y-6">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {lang === 'ar' ? '📬 تواصل معنا' : '📬 Get In Touch'}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {lang === 'ar'
                ? 'سواء كان عندك سؤال، اقتراح، تعاون مقترح، أو مجرد حبيت تقول مرحباً — إحنا هنا!'
                : 'Whether you have a question, suggestion, partnership idea, or just want to say hi — we\'re here!'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border hover:border-emerald-500/50 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <MessageCircle className="h-7 w-7" />
              </div>
              <div className="text-center">
                <p className="font-black text-foreground">{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</p>
                <p className="text-sm text-muted-foreground mt-0.5 dir-ltr">+20 155 625 2658</p>
                <p className="text-xs font-bold text-emerald-600 mt-1.5 group-hover:underline">
                  {lang === 'ar' ? 'ابدأ محادثة الآن' : 'Chat with us now'}
                </p>
              </div>
            </a>

            {/* Email */}
            <a
              href={`mailto:${email}`}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <Mail className="h-7 w-7" />
              </div>
              <div className="text-center">
                <p className="font-black text-foreground">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</p>
                <p className="text-sm text-muted-foreground mt-0.5 break-all">{email}</p>
                <p className="text-xs font-bold text-primary mt-1.5 group-hover:underline">
                  {lang === 'ar' ? 'راسلنا الآن' : 'Email us now'}
                </p>
              </div>
            </a>

            {/* Phone */}
            <a
              href="tel:+201556252658"
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border hover:border-amber-500/50 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all">
                <Phone className="h-7 w-7" />
              </div>
              <div className="text-center">
                <p className="font-black text-foreground">{lang === 'ar' ? 'هاتف مباشر' : 'Direct Phone'}</p>
                <p className="text-sm text-muted-foreground mt-0.5 dir-ltr">01556252658</p>
                <p className="text-xs font-bold text-amber-600 mt-1.5 group-hover:underline">
                  {lang === 'ar' ? 'اتصل بنا الآن' : 'Call us now'}
                </p>
              </div>
            </a>
          </div>

          {/* Partner CTA */}
          <div className="mt-6 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🤝</span>
              <div>
                <p className="font-black text-foreground text-sm">
                  {lang === 'ar' ? 'هل تمتلك مكتبة أو تنظم فعاليات قراءة؟' : 'Own a bookstore or organize reading events?'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'ar'
                    ? 'تواصل معنا للانضمام كشريك مميز واستفد من الوصول لآلاف القراء النشطين.'
                    : 'Contact us to join as a featured partner and reach thousands of active readers.'}
                </p>
              </div>
            </div>
            <Link href="/partner-form" className="shrink-0">
              <Button className="rounded-xl font-black text-xs gap-1.5 cursor-pointer shadow-md px-6 py-5">
                <Star className="h-4 w-4" />
                <span>{lang === 'ar' ? 'انضم كشريك' : 'Become a Partner'}</span>
              </Button>
            </Link>
          </div>
        </section>

        {/* ── LOCATION ── */}
        <section className="flex flex-col sm:flex-row items-center gap-3 p-5 rounded-2xl bg-muted/50 border border-border">
          <MapPin className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="font-bold text-sm text-foreground">
              {lang === 'ar' ? '📍 نعمل من مصر ونخدم العالم العربي' : '📍 Based in Egypt, Serving the Arab World'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === 'ar'
                ? 'فريقنا في مصر — ونحلم بتوسع يشمل كل دولة عربية.'
                : 'Our team is in Egypt — and we\'re dreaming of expanding to every Arab country.'}
            </p>
          </div>
          <Link
            href="/communities"
            className="sm:ms-auto shrink-0 flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            {lang === 'ar' ? 'نوادي القراءة' : 'Reading Hubs'}
            <ChevronRight className={cn('h-3.5 w-3.5', isRTL && 'rotate-180')} />
          </Link>
        </section>

      </div>
    </MainLayout>
  )
}
