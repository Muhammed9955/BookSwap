'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { useLanguage } from '@/i18n/language-context'
import {
  Lock,
  EyeOff,
  MapPin,
  ShieldCheck,
  UserCheck,
  Trash2,
  Mail,
  MessageCircle,
} from 'lucide-react'

interface PrivacyClientProps {
  user: { id: string; profile?: Record<string, unknown> | null } | null
}

export function PrivacyClient({ user }: PrivacyClientProps) {
  const { lang } = useLanguage()

  const sections = [
    {
      icon: <UserCheck className="h-5 w-5 text-indigo-500" />,
      titleAr: '1. البيانات التي نجمعها',
      titleEn: '1. Information We Collect',
      contentAr:
        'نجمع فقط البيانات الضرورية لتشغيل المنصة: اسمك، بريدك الإلكتروني، صورتك الشخصية (عند تسجيل الدخول بـ Google أو البريد)، والمدينة والحي لتحديد الكتب القريبة منك، بالإضافة إلى الكتب التي تضيفها لرفك.',
      contentEn:
        'We only collect information necessary to operate the platform: your name, email, profile photo (via Google or email auth), and city/neighborhood to display relevant local books, alongside your listed books.',
    },
    {
      icon: <MapPin className="h-5 w-5 text-amber-500" />,
      titleAr: '2. خصوصية موقعك — لا نشارك عنوان منزلك أبداً',
      titleEn: '2. Location Privacy — We Never Share Home Addresses',
      contentAr:
        'لا نطلب ولا نشارك أبداً عنوان منزلك أو موقعك الدقيق على الخريطة. يظهر للمستخدمين الآخرين فقط اسم المدينة والحي، أو المقهى/المكتبة العامة التي تحددها كنقطة لقاء آمنة.',
      contentEn:
        'We never ask for or display your precise home address. Other readers only see your general city/district or the public cafe/bookstore you select as an agreed meetup point.',
    },
    {
      icon: <EyeOff className="h-5 w-5 text-emerald-500" />,
      titleAr: '3. التزامنا بعدم بيع البيانات',
      titleEn: '3. No Selling of Personal Data',
      contentAr:
        'بياناتك ملك لك. نلتزم بنسبة 100% بعدم بيع أو تأجير أي بيانات شخصية أو بريد إلكتروني لشركات تسويق أو جهات خارجية. نستخدم بياناتك حصرياً لتسهيل صفقات التبادل والتواصل بين القراء.',
      contentEn:
        'Your data belongs to you. We are 100% committed to never selling, renting, or monetizing your personal data to advertisers or third parties. Information is used strictly to power book exchanges and in-app notifications.',
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-blue-500" />,
      titleAr: '4. تسجيل الدخول عبر Google وسياسة الأمان',
      titleEn: '4. Google OAuth & Account Security',
      contentAr:
        'عند استخدام تسجيل الدخول بـ Google، نطلب فقط صلاحيات الوصول الأساسية للملف الشخصي (الاسم، البريد، والصورة) للتحقق من هويتك. نلتزم بسياسة بيانات مستخدم خدمات Google API بما في ذلك متطلبات الاستخدام المحدود (Limited Use Requirements).',
      contentEn:
        'When signing in via Google, we only request standard identity claims (name, email, profile picture) to authenticate you. Our use of Google user data complies strictly with the Google API Services User Data Policy, including Limited Use requirements.',
    },
    {
      icon: <Trash2 className="h-5 w-5 text-rose-500" />,
      titleAr: '5. حقك في حذف البيانات والحساب',
      titleEn: '5. Data Deletion & Account Closure Rights',
      contentAr:
        'لك الحق الكامل في أي وقت في تعديل معلوماتك، سحب قوائم كتبك، أو طلب حذف حسابك وبياناتك بالكامل من قواعد بياناتنا عن طريق إعدادات الحساب أو مراسلة فريق الدعم الفني.',
      contentEn:
        'You have the right to modify your details, delete book listings, or request complete deletion of your account and associated records at any time via settings or by contacting support.',
    },
  ]

  return (
    <MainLayout user={user}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-4 border border-emerald-500/20">
            <Lock className="h-4 w-4" />
            <span>{lang === 'ar' ? 'حماية وأمان البيانات' : 'Data Privacy & Security'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
            {lang === 'ar' ? 'سياسة الخصوصية وحماية بيانات القراء' : 'Privacy Policy & Data Protection'}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            {lang === 'ar'
              ? 'نحترم خصوصيتك ونتعامل مع بياناتك بأعلى معايير الأمان والشفافية. اقرأ التزامنا بحماية معلوماتك.'
              : 'We respect your privacy and manage your data with the highest security and transparency standards.'}
          </p>
          <div className="text-xs text-muted-foreground/70 mt-3">
            {lang === 'ar' ? 'ساري اعتباراً من: أكتوبر 2026' : 'Effective: October 2026'}
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
        <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">
            {lang === 'ar' ? 'استفسارات الخصوصية وحذف البيانات' : 'Privacy Inquiries & Data Requests'}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {lang === 'ar'
              ? 'إذا كان لديك أي سؤال حول كيفية معالجة بياناتك أو تود طلب حذف حسابك، تواصل مع مسؤول الخصوصية.'
              : 'Reach out to our privacy officer for questions or data deletion requests.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:muhamed.dev.95@gmail.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border"
            >
              <Mail className="h-4 w-4" />
              <span>muhamed.dev.95@gmail.com</span>
            </a>
            <a
              href="https://wa.me/201556252658"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-md shadow-emerald-600/20"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{lang === 'ar' ? 'تواصل مع الدعم الفني' : 'Technical Support'}</span>
            </a>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
