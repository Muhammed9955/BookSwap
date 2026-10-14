'use client'

import Link from 'next/link'
import { useLanguage } from '@/i18n/language-context'
import {
  BookOpen,
  Users,
  Store,
  ShieldCheck,
  Heart,
  Mail,
  MessageCircle,
  Sparkles,
  MapPin,
  HelpCircle,
  FileText,
  Lock,
} from 'lucide-react'

export function SiteFooter() {
  const { lang, isRTL } = useLanguage()

  const whatsappNumber = '201556252658'
  const email = 'muhamed.dev.95@gmail.com'
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    lang === 'ar'
      ? 'مرحباً بفريق BookSwap! لدي استفسار.'
      : 'Hello BookSwap team! I have an inquiry.'
  )}`

  return (
    <footer className="border-t border-border bg-card/70 backdrop-blur-xl text-foreground mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xl tracking-tight text-foreground">BookSwap</span>
                  <span className="text-amber-500 font-black text-lg">بدّلها</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {lang === 'ar' ? 'بادِل كتبك في مدينتك 📍' : 'Swap books in your city 📍'}
                </span>
              </div>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {lang === 'ar'
                ? 'أول منصة عربية محلية لتبادل واستعارة وشراء الكتب بين قراء الحي والمدينة. قراءة لا تنتهي، بدون أي عمولات أو تكاليف شحن مرتفعة.'
                : 'The premier local platform for swapping, borrowing, and buying books among neighborhood readers. Infinite reading with 0% commissions.'}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'تواصل عبر واتساب' : 'WhatsApp Us'}</span>
              </a>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>{email}</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-wider uppercase text-foreground/80 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>{lang === 'ar' ? 'استكشف المنصة' : 'Explore'}</span>
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/explore" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 opacity-60" />
                  <span>{lang === 'ar' ? 'تصفح كل الكتب' : 'All Books'}</span>
                </Link>
              </li>
              <li>
                <Link href="/communities" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 opacity-60" />
                  <span>{lang === 'ar' ? 'نوادي القراءة بالمدن' : 'Reading Clubs'}</span>
                </Link>
              </li>
              <li>
                <Link href="/stores" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 opacity-60" />
                  <span>{lang === 'ar' ? 'نقاط التبادل والمتاجر' : 'Safe Hubs & Stores'}</span>
                </Link>
              </li>
              <li>
                <Link href="/books/add" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 opacity-60" />
                  <span>{lang === 'ar' ? 'أضف كتابك للتبادل' : 'List a Book'}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Community */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-wider uppercase text-foreground/80 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>{lang === 'ar' ? 'الثقة والأمان' : 'Trust & Safety'}</span>
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 opacity-60 text-rose-500" />
                  <span>{lang === 'ar' ? 'قصتنا ورؤيتنا' : 'About BookSwap'}</span>
                </Link>
              </li>
              <li>
                <Link href="/about#safety" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 opacity-60 text-emerald-500" />
                  <span>{lang === 'ar' ? 'إرشادات اللقاء الآمن' : 'Safe Meetup Guidelines'}</span>
                </Link>
              </li>
              <li>
                <Link href="/partner-form" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 opacity-60 text-amber-500" />
                  <span>{lang === 'ar' ? 'انضم كنقطة استلام معتمدة' : 'Partner Your Cafe/Store'}</span>
                </Link>
              </li>
              <li>
                <Link href="/about#faq" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 opacity-60" />
                  <span>{lang === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-wider uppercase text-foreground/80 flex items-center gap-2">
              <Lock className="h-4 w-4 text-indigo-500" />
              <span>{lang === 'ar' ? 'القوانين والخصوصية' : 'Legal & Policy'}</span>
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 opacity-60" />
                  <span>{lang === 'ar' ? 'شروط الخدمة والتبادل' : 'Terms of Service'}</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 opacity-60" />
                  <span>{lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
                </Link>
              </li>
              <li>
                <span className="inline-block text-xs text-muted-foreground/80 bg-muted px-2 py-1 rounded-md">
                  {lang === 'ar' ? '🔒 تبادل آمن 100% بدون عمولات' : '🔒 100% Commission-Free'}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} BookSwap.</span>
            <span>{lang === 'ar' ? 'صُنع بحب لكل عشاق القراءة في مصر والعالم العربي.' : 'Crafted with passion for readers across Egypt & the Arab World.'}</span>
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:underline">
              {lang === 'ar' ? 'الشروط' : 'Terms'}
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:underline">
              {lang === 'ar' ? 'الخصوصية' : 'Privacy'}
            </Link>
            <span>•</span>
            <Link href="/about" className="hover:underline">
              {lang === 'ar' ? 'من نحن' : 'About'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
