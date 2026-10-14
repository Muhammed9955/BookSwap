'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { useLanguage } from '@/i18n/language-context'
import {
  FileText,
  ShieldCheck,
  ArrowRightLeft,
  QrCode,
  AlertTriangle,
  Scale,
  Sparkles,
  Mail,
  MessageCircle,
} from 'lucide-react'
import Link from 'next/link'

interface TermsClientProps {
  user: { id: string; profile?: Record<string, unknown> | null } | null
}

export function TermsClient({ user }: TermsClientProps) {
  const { lang } = useLanguage()

  const sections = [
    {
      icon: <Sparkles className="h-5 w-5 text-amber-500" />,
      titleAr: '1. ميثاق المجتمع ورسالة المنصة',
      titleEn: '1. Community Charter & Mission',
      contentAr:
        'منصة BookSwap (بدّلها) هي مجتمع غير ربحي مبني على الثقة بين القراء لمشاركة شغف القراءة وتسهيل وصول الكتب للجميع في أحيائهم ومدنهم. باستخدامك للمنصة، فإنك تتعهد بالتعامل باحترام وأمانة مع أعضاء المجتمع والمحافظة على سلامة الكتب المعارة.',
      contentEn:
        'BookSwap is a trust-based community built by and for readers to share books locally within neighborhoods. By using BookSwap, you pledge to treat all community members with honesty and respect, and maintain borrowed books in pristine condition.',
    },
    {
      icon: <ArrowRightLeft className="h-5 w-5 text-blue-500" />,
      titleAr: '2. قواعد التبادل، البيع، والإعارة',
      titleEn: '2. Exchange, Sale & Borrowing Rules',
      contentAr:
        'يجب على كل مستخدم وصف حالة الكتاب بدقة وصدق (جديد، ممتاز، جيد، مع مقروءات سابقة). في صفقات البيع الرمزي، يكون الدفع مباشراً بين الأطراف أو عبر وسائل الدفع المعتمدة، ولا تفرض BookSwap أي عمولة أو نسبة على عمليات المبادلة بين القراء.',
      contentEn:
        'Users must honestly describe book conditions (New, Like New, Good, Fair). In direct sales, pricing must be transparent. BookSwap charges 0% platform commission on reader-to-reader exchanges.',
    },
    {
      icon: <QrCode className="h-5 w-5 text-emerald-500" />,
      titleAr: '3. اللقاءات الآمنة وتأكيد التسليم بالـ QR Code',
      titleEn: '3. Safe Meetups & QR Code Handshakes',
      contentAr:
        'لحماية جميع الأطراف، ننصح دائماً بإتمام المقابلات في أماكن عامة نهاراً أو من خلال شركائنا المعتمدين (مكتبات وكافيهات شريكة). يتم اعتماد تسليم واستلام الكتاب من خلال مسح رمز الاستجابة السريع (QR Code) الموجود في صفحة الصفقة داخل التطبيق.',
      contentEn:
        'For everyone’s safety, all in-person handoffs should occur in public, well-lit spaces or at our verified partner cafes and bookshops. Exchanges are officially confirmed in-app via QR code verification at the moment of handover.',
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-indigo-500" />,
      titleAr: '4. الودائع التأمينية ومواعيد الإرجاع',
      titleEn: '4. Security Deposits & Timely Returns',
      contentAr:
        'في حالات الاستعارة، يحق لصاحب الكتاب طلب وديعة تأمينية مستردة. يلتزم المستعير بإرجاع الكتاب في الموعد المحدد بالحالة المتفق عليها، وتُرد الوديعة فور مسح كود الاسترجاع. تأخير الإرجاع المتعمد يؤدي لتقييد الحساب تلقائياً.',
      contentEn:
        'For book loans, lenders may request a refundable deposit. Borrowers are obligated to return books on schedule in agreed condition, at which point the deposit is refunded. Repeated overdue delays result in account suspension.',
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-rose-500" />,
      titleAr: '5. المواد المحظورة والنزاهة الفكرية',
      titleEn: '5. Prohibited Items & Intellectual Property',
      contentAr:
        'يُحظر منعاً باتاً عرض نسخ مقرصنة مطبوعة رديئة لغرض التجارة، أو أي محتوى يحث على الكراهية أو العنف أو المواد المخالفة للقوانين المحلية. لإدارة المنصة الحق الكامل في حذف أي إعلان أو إيقاف أي حساب مخالف فوراً.',
      contentEn:
        'Counterfeit copies sold for commercial fraud, hate speech, defamatory content, or legally restricted materials are strictly prohibited. BookSwap reserves the right to remove non-compliant listings and ban offenders immediately.',
    },
    {
      icon: <Scale className="h-5 w-5 text-purple-500" />,
      titleAr: '6. المسؤولية القانونية وحل النزاعات',
      titleEn: '6. Limitation of Liability & Disputes',
      contentAr:
        'تعمل BookSwap كمنصة وسيطة لتسهيل التواصل واللقاء بين القراء. على الرغم من أننا نوفر أدوات الأمان والتحقق والتقييمات، فإن سلامة التعامل تقع على عاتق المستخدمين. في حال نشوء أي نزاع، يرجى التواصل مع فريق الدعم للتحقيق والوساطة الودية.',
      contentEn:
        'BookSwap connects readers and provides verification safeguards and reputation metrics. In the event of an unresolved dispute, contact support for mediation and community review.',
    },
  ]

  return (
    <MainLayout user={user}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold mb-4 border border-amber-500/20">
            <FileText className="h-4 w-4" />
            <span>{lang === 'ar' ? 'ميثاق وشروط الاستخدام' : 'Terms of Service'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
            {lang === 'ar' ? 'شروط الخدمة والتبادل العادل' : 'Terms of Service & Fair Swapping'}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            {lang === 'ar'
              ? 'صُممت هذه القواعد لضمان تجربة آمنة ومريحة وموثوقة لجميع القراء في مجتمع BookSwap.'
              : 'These rules ensure a safe, trustworthy, and welcoming experience for all readers in the BookSwap community.'}
          </p>
          <div className="text-xs text-muted-foreground/70 mt-3">
            {lang === 'ar' ? 'آخر تحديث: أكتوبر 2026' : 'Last updated: October 2026'}
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm hover:border-border/80 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-muted/60">{section.icon}</div>
                <h2 className="text-lg font-bold text-foreground">
                  {lang === 'ar' ? section.titleAr : section.titleEn}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed ps-11">
                {lang === 'ar' ? section.contentAr : section.contentEn}
              </p>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">
            {lang === 'ar' ? 'لديك استفسار حول الشروط؟' : 'Questions About Our Terms?'}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {lang === 'ar'
              ? 'فريق الدعم ومسؤولو المجتمع جاهزون لمساعدتك والإجابة على أي استفسار في أي وقت.'
              : 'Our community moderators and support team are always available to help.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://wa.me/201556252658"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-md shadow-emerald-600/20"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{lang === 'ar' ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}</span>
            </a>
            <a
              href="mailto:muhamed.dev.95@gmail.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border"
            >
              <Mail className="h-4 w-4" />
              <span>muhamed.dev.95@gmail.com</span>
            </a>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
