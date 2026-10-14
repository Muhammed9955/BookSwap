'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Users,
  ArrowRightLeft,
  Sparkles,
  MapPin,
  Star,
  ShieldCheck,
  PlusCircle,
  CheckCircle2,
  Flame,
  Store,
  Calendar,
  Gift,
  Coffee,
  Zap,
  BookMarked,
  PiggyBank,
  HeartHandshake,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Compass,
} from 'lucide-react'
import { BookListing, Category, Book, Community } from '@/types'
import { BookCard } from '@/components/books/book-card'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface HomePageClientProps {
  user: { id: string; profile?: Record<string, unknown> | null } | null
  recentListings: BookListing[]
  featuredListings: BookListing[]
  giveawayListings: BookListing[]
  popularListings: BookListing[]
  categories: Category[]
  wantedBooks: Book[]
  userWishlistBookIds: string[]
  communities?: Community[]
}

export function HomePageClient({
  user,
  recentListings,
  featuredListings,
  giveawayListings,
  popularListings,
  categories,
  wantedBooks,
  userWishlistBookIds,
  communities = [],
}: HomePageClientProps) {
  const { lang, isRTL } = useLanguage()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(
    new Set(userWishlistBookIds)
  )
  const [activeTab, setActiveTab] = useState<'ALL' | 'SWAP' | 'SELL' | 'GIVEAWAY'>('ALL')
  const [activityIndex, setActivityIndex] = useState(0)
  const [isActivityPaused, setIsActivityPaused] = useState(false)
  const supabase = createClient()

  // Competitor-inspired Live Activity Stream (PangoBooks / Depop style)
  const liveActivities = [
    {
      id: 'act-1',
      icon: '🔄',
      user: lang === 'ar' ? 'عمر الشريف' : 'Omar El-Sherif',
      location: lang === 'ar' ? 'المعادي، القاهرة' : 'Maadi, Cairo',
      action: lang === 'ar' ? 'استبدل رواية «ثلاثية غرناطة» بـ «عزازيل»' : 'swapped "Granada Trilogy" for "Azazeel"',
      time: lang === 'ar' ? 'منذ 4 دقائق' : '4m ago',
    },
    {
      id: 'act-2',
      icon: '⚡',
      user: lang === 'ar' ? 'أحمد كمال' : 'Ahmed Kamal',
      location: lang === 'ar' ? 'محرم بيه، الإسكندرية' : 'Moharam Bek, Alex',
      action: lang === 'ar' ? 'أضاف 3 كتب جديدة لرف «نادي عقول المستقبل»' : 'added 3 books to Future Minds Club shelf',
      time: lang === 'ar' ? 'منذ 11 دقيقة' : '11m ago',
    },
    {
      id: 'act-3',
      icon: '🎁',
      user: lang === 'ar' ? 'ياسمين ممدوح' : 'Yasmine Mamdouh',
      location: lang === 'ar' ? 'مدينة نصر، القاهرة' : 'Nasr City, Cairo',
      action: lang === 'ar' ? 'أهدت كتاب «العادات الذرية» مجاناً لقارئ جديد' : 'gifted "Atomic Habits" for free to a new reader',
      time: lang === 'ar' ? 'منذ 18 دقيقة' : '18m ago',
    },
    {
      id: 'act-4',
      icon: '☕',
      user: lang === 'ar' ? 'كريم نبيل' : 'Karim Nabil',
      location: lang === 'ar' ? 'الشيخ زايد، الجيزة' : 'Sheikh Zayed, Giza',
      action: lang === 'ar' ? 'استعار «فن اللامبالاة» من نقطة سيلانترو دجلة' : 'borrowed "Subtle Art" at Cilantro Safe Hub',
      time: lang === 'ar' ? 'منذ 25 دقيقة' : '25m ago',
    },
    {
      id: 'act-5',
      icon: '💎',
      user: lang === 'ar' ? 'سارة منصور' : 'Sara Mansour',
      location: lang === 'ar' ? 'سموحة، الإسكندرية' : 'Smouha, Alex',
      action: lang === 'ar' ? 'طلبت مبادلة كتاب «يوتوبيا» لأحمد خالد توفيق' : 'requested swap for "Utopia"',
      time: lang === 'ar' ? 'منذ 34 دقيقة' : '34m ago',
    },
  ]

  // Auto cycle live activity
  useEffect(() => {
    if (isActivityPaused) return
    const timer = setInterval(() => {
      setActivityIndex(prev => (prev + 1) % liveActivities.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [isActivityPaused, liveActivities.length])

  // StoryGraph & PangoBooks Inspired: Curated Reading Moods & Vibes
  const readingVibes = [
    {
      id: 'cozy',
      emoji: '☕',
      titleAr: 'أجواء دافئة وروايات هادئة',
      titleEn: 'Cozy & Comforting Reads',
      descAr: 'روايات إنسانية وكلاسيكيات تأسر القلوب وتُقرأ مع فنجان قهوة',
      descEn: 'Heartwarming stories, gentle classics, and slow afternoon reads',
      query: 'روايات',
      gradient: 'from-amber-500/15 via-orange-500/10 to-amber-500/5 hover:border-amber-400/60 text-amber-600 dark:text-amber-400',
      badgeAr: 'روايات ودراما',
      badgeEn: 'Fiction',
    },
    {
      id: 'growth',
      emoji: '⚡',
      titleAr: 'تطوير ذات وإنتاجية خارقة',
      titleEn: 'High Impact & Self-Growth',
      descAr: 'بناء العادات، علم نفس الإنجاز، وكتب لإعادة ضبط مسار حياتك',
      descEn: 'Atomic habits, mindset mastery, and focus transformation',
      query: 'تطوير الذات',
      gradient: 'from-emerald-500/15 via-teal-500/10 to-emerald-500/5 hover:border-emerald-400/60 text-emerald-600 dark:text-emerald-400',
      badgeAr: 'تطوير ذات',
      badgeEn: 'Self-Help',
    },
    {
      id: 'mystery',
      emoji: '🕵️',
      titleAr: 'غموض وإثارة وتشويق',
      titleEn: 'Mind-Bending Thrillers',
      descAr: 'روايات جريمة، تحقيقات بوليسية، وحبكات تحبس أنفاسك حتى النهاية',
      descEn: 'Unputdownable whodunits, suspense, and psychological twists',
      query: 'غموض',
      gradient: 'from-purple-500/15 via-indigo-500/10 to-purple-500/5 hover:border-purple-400/60 text-purple-600 dark:text-purple-400',
      badgeAr: 'تشويق وتحقيق',
      badgeEn: 'Thrillers',
    },
    {
      id: 'scifi',
      emoji: '🌌',
      titleAr: 'عوالم خيالية وفانتازيا',
      titleEn: 'Epic Sci-Fi & Fantasy',
      descAr: 'ملاحم أسطورية، عوالم سحرية، وسفر عبر الزمن لمستقبل مجهول',
      descEn: 'Epic world-building, magical realms, and high-concept sci-fi',
      query: 'خيال',
      gradient: 'from-cyan-500/15 via-blue-500/10 to-cyan-500/5 hover:border-cyan-400/60 text-cyan-600 dark:text-cyan-400',
      badgeAr: 'خيال وفانتازيا',
      badgeEn: 'Sci-Fi/Fantasy',
    },
    {
      id: 'heritage',
      emoji: '📜',
      titleAr: 'أدب عربي وتاريخ وتراث',
      titleEn: 'Arabic Classics & Heritage',
      descAr: 'روائع نجيب محفوظ، رضوى عاشور، فكر وتاريخ حضاري أصيل',
      descEn: 'Timeless Arabic masterpieces, cultural history, and deep thought',
      query: 'نجيب محفوظ',
      gradient: 'from-rose-500/15 via-pink-500/10 to-rose-500/5 hover:border-rose-400/60 text-rose-600 dark:text-rose-400',
      badgeAr: 'تاريخ وأدب عربي',
      badgeEn: 'Arabic Classics',
    },
    {
      id: 'business',
      emoji: '💡',
      titleAr: 'ريادة أعمال وتقنية وبزنس',
      titleEn: 'Tech, Startups & Business',
      descAr: 'برمجة، ذكاء اصطناعي، واستراتيجيات عملية لإطلاق المشاريع',
      descEn: 'Tech architecture, AI, founder playbooks, and modern finance',
      query: 'برمجة',
      gradient: 'from-blue-500/15 via-indigo-500/10 to-blue-500/5 hover:border-blue-400/60 text-blue-600 dark:text-blue-400',
      badgeAr: 'تقنية وبزنس',
      badgeEn: 'Tech & Startups',
    },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleWishlistToggle = async (listingId: string) => {
    if (!user) {
      router.push('/login')
      return
    }
    const listing = [
      ...recentListings,
      ...featuredListings,
      ...giveawayListings,
      ...popularListings,
    ].find(l => l.id === listingId)
    if (!listing?.book_id) return

    const bookId = listing.book_id
    const isCurrentlyWishlisted = wishlistedIds.has(bookId)

    setWishlistedIds(prev => {
      const next = new Set(prev)
      if (isCurrentlyWishlisted) {
        next.delete(bookId)
      } else {
        next.add(bookId)
      }
      return next
    })

    if (isCurrentlyWishlisted) {
      await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', bookId)
    } else {
      await supabase
        .from('wishlist_items')
        .insert({ user_id: user.id, book_id: bookId })
    }
  }

  // Filter listings based on interactive tab
  const getFilteredListings = () => {
    if (activeTab === 'SWAP') {
      const swaps = recentListings.filter(
        l => l.listing_type === 'SWAP' || l.listing_type === 'SELL_OR_SWAP'
      )
      return swaps.length > 0 ? swaps : recentListings
    }
    if (activeTab === 'SELL') {
      const sales = recentListings.filter(
        l => l.listing_type === 'SELL' || l.listing_type === 'SELL_OR_SWAP'
      )
      return sales.length > 0 ? sales : recentListings
    }
    if (activeTab === 'GIVEAWAY') {
      return giveawayListings.length > 0
        ? giveawayListings
        : recentListings.filter(l => l.listing_type === 'GIVEAWAY')
    }
    return recentListings
  }

  const displayedListings = getFilteredListings()

  const SectionHeader = ({
    titleAr,
    titleEn,
    subtitleAr,
    subtitleEn,
    href,
  }: {
    titleAr: string
    titleEn: string
    subtitleAr?: string
    subtitleEn?: string
    href?: string
  }) => (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
          {lang === 'ar' ? titleAr : titleEn}
        </h2>
        {(subtitleAr || subtitleEn) && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {lang === 'ar' ? subtitleAr : subtitleEn}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-primary/80 transition-colors shrink-0 group"
        >
          <span>{lang === 'ar' ? 'عرض الكل' : 'View All'}</span>
          <ArrowRight
            className={cn(
              'h-4 w-4 transition-transform group-hover:translate-x-1',
              isRTL && 'rotate-180 group-hover:-translate-x-1'
            )}
          />
        </Link>
      )}
    </div>
  )

  const currentActivity = liveActivities[activityIndex]

  return (
    <MainLayout user={user ?? null}>
      {/* ======== ENHANCED HERO WITH LIVE STATS & QUICK FILTER MODES ======== */}
      <section className="hero-gradient relative overflow-hidden text-white">
        {/* Ambient atmospheric glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -start-32 h-[480px] w-[480px] rounded-full bg-purple-500/25 blur-[130px]" />
          <div className="absolute top-1/2 -end-32 h-[420px] w-[420px] rounded-full bg-indigo-500/25 blur-[130px]" />
          <div className="absolute -bottom-24 start-1/3 h-[320px] w-[320px] rounded-full bg-amber-500/15 blur-[110px]" />
        </div>

        <div className="page-container max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 relative py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left/Main Column: Headings, Quick Actions & Search Box */}
            <div className="lg:col-span-7 space-y-6">
              {/* WARAQ Brand Pill */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-emerald-300 border border-white/15 shadow-sm">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span>
                  {lang === 'ar'
                    ? '🌱 منصة وَرَق • عالم جديد بين كل صفحة والتانية'
                    : '🌱 WARAQ • A World Between Every Page'}
                </span>
              </div>

              {/* Bold Catchy Headline with Official WARAQ Slogan */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center border border-white/80 shadow-md">
                    <Image
                      src="/images/logo.png"
                      alt="WARAQ Logo"
                      width={32}
                      height={32}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-emerald-300 tracking-wider">
                    {lang === 'ar' ? 'وَرَق | WARAQ' : 'WARAQ | وَرَق'}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-white">
                  {lang === 'ar' ? (
                    <>
                      عالم جديد.. <br className="hidden sm:inline" />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-amber-200 to-emerald-300">
                        بين كل صفحة والتانية
                      </span>
                    </>
                  ) : (
                    <>
                      A World.. <br className="hidden sm:inline" />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-amber-200 to-emerald-300">
                        Between Every Page
                      </span>
                    </>
                  )}
                </h1>
              </div>

              {/* Engaging Subtitle */}
              <p className="text-base sm:text-lg text-white/85 max-w-xl leading-relaxed font-medium">
                {lang === 'ar'
                  ? 'منصة وَرَق لتبادل وشراء واستعارة الكتب المستعملة مع قراء حيك ومدينتك. كتابك المقروء كنز ينتظر قارئاً قريباً منك — التقي بأمان في كافيهات ومكتبات معتمدة وبدون أي عمولات.'
                  : 'WARAQ connects readers to swap, borrow, and buy secondhand books locally. Your read books are treasures waiting for the next reader nearby — 100% commission free.'}
              </p>

              {/* Competitor-Style Mode Pills: Swap, Buy, Borrow, Free */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {[
                  {
                    id: 'SWAP',
                    labelAr: '🔄 تبادل مباشر (0% عمولة)',
                    labelEn: '🔄 Direct Swap (0% Fee)',
                    tab: 'SWAP' as const,
                  },
                  {
                    id: 'SELL',
                    labelAr: '💸 صفقات رمزية ومخفضة',
                    labelEn: '💸 Discounted Deals',
                    tab: 'SELL' as const,
                  },
                  {
                    id: 'GIVEAWAY',
                    labelAr: '🎁 كتب مجانية وإهداء',
                    labelEn: '🎁 Free Giveaways',
                    tab: 'GIVEAWAY' as const,
                  },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.tab)
                      document
                        .getElementById('explore-books-section')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs font-black backdrop-blur-md transition-all cursor-pointer border',
                      activeTab === item.tab
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20 scale-105'
                        : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20'
                    )}
                  >
                    {lang === 'ar' ? item.labelAr : item.labelEn}
                  </button>
                ))}
              </div>

              {/* Udemy/PangoBooks Style Prominent Search Box */}
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl text-foreground">
                <form
                  onSubmit={handleSearch}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                >
                  <div className="relative flex-1 flex items-center min-w-0">
                    <Search
                      className={cn(
                        'absolute h-5 w-5 text-muted-foreground pointer-events-none',
                        isRTL ? 'right-3.5' : 'left-3.5'
                      )}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={
                        lang === 'ar'
                          ? 'ما الكتاب أو المؤلف أو التصنيف الذي تبحث عنه في مدينتك؟'
                          : 'Search any book, author, or genre in your city...'
                      }
                      className={cn(
                        'w-full bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border/80 focus:border-primary rounded-xl sm:rounded-2xl py-3 text-sm font-semibold text-foreground placeholder:text-muted-foreground/75 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all',
                        isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-6 py-3 rounded-xl sm:rounded-2xl shadow-md shadow-primary/25 cursor-pointer shrink-0 transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'ابحث الآن' : 'Search Now'}</span>
                  </Button>
                </form>

                {/* Popular / Trending Tags inside Search Card */}
                <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                  <span className="font-bold flex items-center gap-1 text-foreground shrink-0">
                    <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
                    <span>{lang === 'ar' ? 'شائع الآن:' : 'Trending:'}</span>
                  </span>
                  {[
                    { labelAr: 'العادات الذرية', labelEn: 'Atomic Habits', q: 'العادات الذرية' },
                    { labelAr: 'ثلاثية غرناطة', labelEn: 'Granada Trilogy', q: 'ثلاثية غرناطة' },
                    { labelAr: 'أحمد خالد توفيق', labelEn: 'Ahmed Khaled Tawfik', q: 'أحمد خالد توفيق' },
                    { labelAr: 'تطوير الذات', labelEn: 'Self-Help', q: 'تطوير الذات' },
                    { labelAr: 'كتب مجانية 🎁', labelEn: 'Free Books 🎁', q: 'مجاني' },
                  ].map(trend => (
                    <button
                      key={trend.q}
                      type="button"
                      onClick={() => {
                        setSearchQuery(trend.q)
                        router.push(`/search?q=${encodeURIComponent(trend.q)}`)
                      }}
                      className="px-2.5 py-1 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-[11px] font-semibold transition-colors cursor-pointer select-none"
                    >
                      {lang === 'ar' ? trend.labelAr : trend.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons & Quick Stats */}
              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link href="/books/add">
                  <Button
                    size="lg"
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-xl shadow-amber-400/25 px-6 py-6 rounded-2xl cursor-pointer hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2"
                  >
                    <PlusCircle className="h-5 w-5" />
                    <span>{lang === 'ar' ? 'أضف كتابك مجاناً' : 'Add Your Book Free'}</span>
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 px-6 py-6 rounded-2xl text-sm font-bold cursor-pointer"
                  >
                    <span>{lang === 'ar' ? 'تصفح كل الكتب' : 'Explore All Books'}</span>
                    <ArrowRight className={cn('h-4 w-4 ms-1.5', isRTL && 'rotate-180')} />
                  </Button>
                </Link>
              </div>

              {/* Trust Metric Chips */}
              <div className="pt-2 flex flex-wrap items-center gap-5 sm:gap-8 text-white/90 text-xs sm:text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-amber-400" />
                  <span>{lang === 'ar' ? '0% عمولات على التبادل' : '0% Commission on Swaps'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-emerald-400" />
                  <span>{lang === 'ar' ? 'نقاط تبادل آمنة في الكافيهات' : 'Safe Cafe Meetup Hubs'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-violet-400" />
                  <span>{lang === 'ar' ? 'تأمين مسترد 100% للإعارة' : '100% Refundable Deposit'}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Catchy Visual Artwork with Interactive Badges */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 via-violet-500/20 to-primary/30 rounded-3xl blur-2xl transform rotate-3 scale-105 pointer-events-none" />

              <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-900/60 backdrop-blur-md group">
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src="/images/hero-illustration.jpg"
                    alt={
                      lang === 'ar'
                        ? 'مجتمع القراء يتبادلون الكتب'
                        : 'Book community swapping books'
                    }
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/15 pointer-events-none" />
                </div>

                {/* Floating Badge 1: Direct Swap Guarantee */}
                <div className="absolute top-4 start-4 bg-background/90 dark:bg-slate-900/90 backdrop-blur-md text-foreground px-3.5 py-1.5 rounded-2xl shadow-xl border border-border/80 flex items-center gap-2 text-xs font-black">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span>{lang === 'ar' ? 'بادِل كتبك في حيك بدون أي عمولة 🤝' : 'Swap Books Locally with 0% Fee 🤝'}</span>
                </div>

                {/* Floating Badge 2: Safe Hub Guarantee */}
                <div className="absolute bottom-4 end-4 bg-background/90 dark:bg-slate-900/90 backdrop-blur-md text-foreground px-3.5 py-1.5 rounded-2xl shadow-xl border border-border/80 flex items-center gap-2 text-xs font-black">
                  <Coffee className="h-3.5 w-3.5 text-amber-500" />
                  <span>{lang === 'ar' ? 'نقاط تبادل آمنة في كافيهات مدينتك ☕' : 'Safe Cafe Hubs in Your City ☕'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======== LIVE ACTIVITY PULSE TICKER (PANGOBOOKS / DEPOP STYLE) ======== */}
      <section
        onMouseEnter={() => setIsActivityPaused(true)}
        onMouseLeave={() => setIsActivityPaused(false)}
        className="bg-card/95 border-y border-border/80 py-3 shadow-xs transition-colors"
      >
        <div className="page-container max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Live Indicator */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>{lang === 'ar' ? 'نبض المجتمع المباشر:' : 'Live Reader Pulse:'}</span>
            </span>
          </div>

          {/* Rotating Activity Item */}
          <div className="flex-1 flex items-center justify-center sm:justify-start gap-2.5 min-w-0 overflow-hidden text-center sm:text-start">
            <span className="text-lg">{currentActivity.icon}</span>
            <div className="text-xs font-bold text-foreground truncate">
              <span className="text-primary font-black">{currentActivity.user}</span>{' '}
              <span className="text-muted-foreground font-medium">({currentActivity.location})</span>{' '}
              <span>{currentActivity.action}</span>
            </div>
            <span className="text-[11px] text-muted-foreground/80 font-semibold shrink-0 hidden md:inline">
              • {currentActivity.time}
            </span>
          </div>

          {/* Quick Action Link */}
          <div className="shrink-0 flex items-center gap-2">
            <Link
              href="/books/add"
              className="text-xs font-black text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              <span>{lang === 'ar' ? 'أضف كتابك وانضم للنبض' : 'List a book & join pulse'}</span>
              <ArrowRight className={cn('h-3.5 w-3.5', isRTL && 'rotate-180')} />
            </Link>
          </div>
        </div>
      </section>

      <div className="page-container max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-10 space-y-16">
        {/* ======== DYNAMIC BOOKSHELF WITH INTERACTIVE FILTER TABS (PROMINENT AT TOP) ======== */}
        <section id="explore-books-section" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border/80 pb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {lang === 'ar' ? '📚 رفوف الكتب المتاحة للتبادل والشراء' : '📚 Available Books for Swap & Sale'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {lang === 'ar'
                  ? 'اختر نوع المعاملة لتصفح الكتب المعروضة في حيك ومدينتك'
                  : 'Select trade type to browse titles listed in your area'}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-muted/80 p-1 rounded-xl border border-border/80">
              {[
                { id: 'ALL', labelAr: 'الكل', labelEn: 'All', count: recentListings.length },
                {
                  id: 'SWAP',
                  labelAr: '🔄 تبادل',
                  labelEn: '🔄 Swap',
                  count: recentListings.filter(l => l.listing_type === 'SWAP' || l.listing_type === 'SELL_OR_SWAP').length,
                },
                {
                  id: 'SELL',
                  labelAr: '💸 شراء',
                  labelEn: '💸 Buy',
                  count: recentListings.filter(l => l.listing_type === 'SELL' || l.listing_type === 'SELL_OR_SWAP').length,
                },
                {
                  id: 'GIVEAWAY',
                  labelAr: '🎁 مجاني',
                  labelEn: '🎁 Free',
                  count: giveawayListings.length,
                },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer',
                    activeTab === tab.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
                  <span className="ms-1.5 text-[10px] opacity-70">({tab.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Listings Grid */}
          {displayedListings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
              {displayedListings.map(listing => (
                <BookCard
                  key={listing.id}
                  listing={listing}
                  isWishlisted={wishlistedIds.has(listing.book_id ?? '')}
                  onWishlistToggle={handleWishlistToggle}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="📚"
              titleAr="لسه مفيش كتب في هذا التصنيف"
              titleEn="No books in this tab yet"
              subtitleAr="أضف أول كتاب وكن البداية لمجتمعك!"
              subtitleEn="List the first book and kickstart your community!"
              ctaHref="/books/add"
              ctaLabelAr="أضف كتابك الآن"
              ctaLabelEn="List a Book Now"
              lang={lang}
            />
          )}

          <div className="pt-2 text-center">
            <Link href="/explore">
              <Button
                variant="outline"
                size="lg"
                className="rounded-2xl font-black text-sm px-8 border-border/80 hover:bg-muted cursor-pointer"
              >
                <span>{lang === 'ar' ? 'عرض جميع الكتب في المعرض' : 'Browse All Books in Catalog'}</span>
                <ArrowRight className={cn('h-4 w-4 ms-2', isRTL && 'rotate-180')} />
              </Button>
            </Link>
          </div>
        </section>

        {/* ======== BROWSE BY READING VIBE / MOOD (COMMENTED OUT FOR LATER DISCUSSION) ======== */}
        {/*
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-black text-primary mb-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-spin" />
                <span>{lang === 'ar' ? 'طريقة جديدة للاكتشاف • مستوحاة من StoryGraph' : 'Discover by Vibe • StoryGraph Inspired'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {lang === 'ar' ? 'تصفح حسب المود وأجواء القراءة ✨' : 'Browse by Reading Vibe & Mood ✨'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {lang === 'ar'
                  ? 'اختر الأجواء التي تناسب حالتك النفسية اليوم واكتشف كتباً تشاركك نفس الشعور'
                  : 'Choose the mood matching your mindset today and discover titles with that exact vibe'}
              </p>
            </div>

            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline shrink-0"
            >
              <span>{lang === 'ar' ? 'استكشف كافة التصنيفات' : 'Explore All Categories'}</span>
              <ArrowRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {readingVibes.map(vibe => (
              <div
                key={vibe.id}
                onClick={() => {
                  router.push(`/search?q=${encodeURIComponent(vibe.query)}`)
                }}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border-2 border-border/80 bg-gradient-to-br p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl',
                  vibe.gradient
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-3xl p-2.5 rounded-2xl bg-background/80 dark:bg-slate-900/80 shadow-xs border border-border/50">
                    {vibe.emoji}
                  </span>
                  <Badge variant="outline" className="text-[11px] font-bold px-2 py-0.5 border-border/60">
                    {lang === 'ar' ? vibe.badgeAr : vibe.badgeEn}
                  </Badge>
                </div>

                <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                  {lang === 'ar' ? vibe.titleAr : vibe.titleEn}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                  {lang === 'ar' ? vibe.descAr : vibe.descEn}
                </p>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-bold text-primary">
                  <span>{lang === 'ar' ? 'تصفح كتب هذا المود' : 'Explore this vibe'}</span>
                  <ArrowRight className={cn('h-3.5 w-3.5 transition-transform group-hover:translate-x-1', isRTL && 'rotate-180 group-hover:-translate-x-1')} />
                </div>
              </div>
            ))}
          </div>
        </section>
        */}

        {/* ======== STANDARD CATEGORIES CHIPS ======== */}
        <section className="space-y-4">
          <SectionHeader
            titleAr="التصنيفات والأنواع الأدبية"
            titleEn="Genres & Categories"
            subtitleAr="تصفح الكتب حسب مجالك واهتماماتك الدراسية والشخصية"
            subtitleEn="Browse books by your academic and personal interests"
            href="/explore"
          />
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/explore?category=${cat.slug}`}
                id={`category-${cat.slug}`}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 text-xs sm:text-sm font-semibold shadow-2xs group"
              >
                <span className="text-base group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span>{lang === 'ar' ? cat.name_ar : cat.name_en}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ======== FEATURED BOOKSHELF ======== */}
        {featuredListings.length > 0 && (
          <section>
            <SectionHeader
              titleAr="⭐ إعلانات مميزة مختارة"
              titleEn="⭐ Curated Featured Books"
              subtitleAr="كتب مميزة يوصي بها مجتمع وَرَق هذا الأسبوع"
              subtitleEn="Hand-picked listings recommended by the community this week"
              href="/explore?featured=true"
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
              {featuredListings.map(listing => (
                <BookCard
                  key={listing.id}
                  listing={listing}
                  isWishlisted={wishlistedIds.has(listing.book_id ?? '')}
                  onWishlistToggle={handleWishlistToggle}
                />
              ))}
            </div>
          </section>
        )}

        {/* ======== SAFE MEETUP HUBS & READING COMMUNITIES SPOTLIGHT (LITERAL.CLUB & EGYPTIAN HUBS) ======== */}
        {communities.length > 0 && (
          <section className="space-y-6">
            <SectionHeader
              titleAr="📍 نوادي القراءة ونقاط التبادل الآمنة"
              titleEn="📍 Reader Clubs & Safe Exchange Hubs"
              subtitleAr="نوادٍ حقيقية في حيك أو جامعتك تتيح لك مقابلة القراء وتسليم الكتب في كافيهات ومكتبات معتمدة"
              subtitleEn="Real local clubs enabling safe handovers at verified partner cafes and bookstores"
              href="/communities"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {communities.map(comm => (
                <div
                  key={comm.id}
                  className="group flex flex-col justify-between rounded-2xl border-2 border-border/80 bg-card hover:border-primary/60 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Top Cover Banner */}
                  <div className="relative h-32 w-full bg-muted overflow-hidden">
                    {comm.cover_image_url ? (
                      <Image
                        src={comm.cover_image_url}
                        alt={comm.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 300px"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/20 to-purple-600/30 flex items-center justify-center text-4xl">
                        📚
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Member Count Pill */}
                    <div className="absolute top-2.5 end-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Users className="h-3 w-3 text-emerald-400" />
                      <span>{comm.member_count} {lang === 'ar' ? 'عضو' : 'members'}</span>
                    </div>

                    {/* Community Avatar Overlay */}
                    <div className="absolute -bottom-3 start-3 h-12 w-12 rounded-xl overflow-hidden border-2 border-background bg-card shadow-md">
                      {comm.avatar_url ? (
                        <Image
                          src={comm.avatar_url}
                          alt={comm.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="h-full w-full bg-primary/10 flex items-center justify-center font-black text-primary text-sm">
                          {comm.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 pt-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <Link
                        href={`/communities/${comm.slug}`}
                        className="font-black text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
                      >
                        {lang === 'ar' && comm.name_ar ? comm.name_ar : comm.name}
                      </Link>

                      {/* Safe Hub Location Pill */}
                      {comm.hub_name && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          <Coffee className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{comm.hub_name}</span>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {lang === 'ar' && comm.description_ar
                          ? comm.description_ar
                          : comm.description}
                      </p>
                    </div>

                    {/* Bottom Shelf Stat & CTA */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        <span>{comm.books_count ?? 0} {lang === 'ar' ? 'كتاب متاح' : 'books'}</span>
                      </div>

                      <Link href={`/communities/${comm.slug}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs font-bold text-primary hover:bg-primary/10 px-2.5 rounded-lg"
                        >
                          <span>{lang === 'ar' ? 'تصفح الرف' : 'View Shelf'}</span>
                          <ArrowRight className={cn('h-3 w-3 ms-1', isRTL && 'rotate-180')} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* Companion Card 1: Create Club in your area */}
              {communities.length < 4 && (
                <div className="group flex flex-col justify-between rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary bg-gradient-to-br from-primary/5 via-card to-background hover:shadow-xl transition-all duration-300 p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      👥
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-foreground group-hover:text-primary transition-colors">
                        {lang === 'ar' ? 'أنشئ نادي قراءة لحيك أو جامعتك 🚀' : 'Start a Club in Your Area 🚀'}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {lang === 'ar'
                          ? 'اجمع قراء منطقتك، حدد كافيه أو مكتبة كنقطة تسليم آمنة، وابدأ رف كتب تشاركي خاص بكم.'
                          : 'Gather local readers, designate a cafe safe hub, and start your private shared bookshelf.'}
                      </p>
                    </div>
                  </div>

                  <Link href="/communities" className="block pt-2">
                    <Button
                      size="sm"
                      className="w-full rounded-xl font-bold text-xs gap-1.5 cursor-pointer"
                    >
                      <span>{lang === 'ar' ? 'أطلق ناديك الآن مجاناً' : 'Launch Free Club'}</span>
                      <ArrowRight className={cn('h-3.5 w-3.5', isRTL && 'rotate-180')} />
                    </Button>
                  </Link>
                </div>
              )}

              {/* Companion Card 2: Safe Hub Explanation */}
              {communities.length < 3 && (
                <div className="group flex flex-col justify-between rounded-2xl border-2 border-border/80 bg-gradient-to-br from-amber-500/5 via-card to-background hover:border-amber-500/50 hover:shadow-xl transition-all duration-300 p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all">
                      ☕
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-foreground group-hover:text-amber-500 transition-colors">
                        {lang === 'ar' ? 'كيف تعمل نقاط التبادل الآمنة؟ ☕' : 'How Safe Hubs Work ☕'}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {lang === 'ar'
                          ? 'نقاط معتمدة في كافيهات ومكتبات شريكة (مثل سيلانترو وديوان) تتيح تبادل الكتب بأمان بدون مصاريف شحن أو قلق.'
                          : 'Partner cafes & bookstores where readers can safely hand off books with 0% shipping costs.'}
                      </p>
                    </div>
                  </div>

                  <Link href="/communities" className="block pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full rounded-xl font-bold text-xs gap-1.5 border-border/80 group-hover:border-amber-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 cursor-pointer"
                    >
                      <span>{lang === 'ar' ? 'اكتشف كل المراكز والنوادي' : 'Explore All Hubs'}</span>
                      <ArrowRight className={cn('h-3.5 w-3.5', isRTL && 'rotate-180')} />
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Launch Your Own Club Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-amber-500/10 border border-primary/20 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">👥</span>
                <div>
                  <h4 className="text-sm font-black text-foreground">
                    {lang === 'ar'
                      ? 'هل تريد تأسيس نادي قراءة لجامعتك أو حيك السكني؟'
                      : 'Want to start a reading club for your university or neighborhood?'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lang === 'ar'
                      ? 'أنشئ مجتمعك مجاناً، حدد نقطة التبادل الآمنة (كافيه أو مكتبة)، وشارك الكتب مع جيرانك وزملائك.'
                      : 'Create your free club, pick a safe meetup cafe, and share bookshelves locally.'}
                  </p>
                </div>
              </div>

              <Link href="/communities" className="shrink-0">
                <Button size="sm" className="font-bold text-xs gap-1.5 rounded-xl cursor-pointer">
                  <span>{lang === 'ar' ? 'أنشئ ناديك الآن' : 'Create Your Club'}</span>
                  <ArrowRight className={cn('h-3.5 w-3.5', isRTL && 'rotate-180')} />
                </Button>
              </Link>
            </div>
          </section>
        )}



        {/* ======== MOST WANTED BOOKS (WISHLIST ACCUMULATOR) ======== */}
        {wantedBooks.length > 0 && (
          <section className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-card rounded-3xl p-6 sm:p-8 border-2 border-amber-500/20 space-y-4">
            <SectionHeader
              titleAr="📣 كتب يبحث عنها القراء الآن"
              titleEn="📣 Books Readers Are Currently Looking For"
              subtitleAr="إذا كان لديك أحد هذه العناوين على رفك، اعرضه الآن للمبادلة أو البيع السريع!"
              subtitleEn="If you have any of these titles on your shelf, list them for instant matches!"
              href="/explore?sort=most_wished"
            />
            <div className="flex flex-wrap gap-2.5">
              {wantedBooks.slice(0, 12).map(book => (
                <div
                  key={book.id}
                  onClick={() => router.push(`/search?q=${encodeURIComponent(book.title)}`)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-card border border-amber-200 dark:border-amber-900/40 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer shadow-2xs group"
                >
                  <BookMarked className="h-4 w-4 text-amber-500 group-hover:text-primary transition-colors" />
                  <span className="text-xs sm:text-sm font-bold text-foreground line-clamp-1 max-w-[150px]">
                    {lang === 'ar' && book.title_ar ? book.title_ar : book.title}
                  </span>
                  <Badge variant="warning" className="text-[10px] px-2 py-0.5 shrink-0 font-black">
                    {book.wishlist_count} {lang === 'ar' ? 'طلب' : 'wants'}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ======== VALUE PROPOSITION & COMPARISON BANNER (STORYGRAPH & THRIFTBOOKS STYLE) ======== */}
        <section className="relative overflow-hidden rounded-3xl border-2 border-border/80 bg-gradient-to-br from-card via-background to-muted/40 p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Why BookSwap vs Expensive Bookstores */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-black text-emerald-600 dark:text-emerald-400">
                <PiggyBank className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'وفر أموالك • اقرأ بلا حدود' : 'Save Money • Read Limitlessly'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {lang === 'ar'
                  ? 'لماذا يدفع القراء 400 ج.م لكتاب جديد بينما يمكنهم مبادلته مجاناً؟'
                  : 'Why pay 400 EGP for a new book when you can swap it for free?'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {lang === 'ar'
                  ? 'مع ارتفاع أسعار الكتب المطبوعة، صممنا «وَرَق» لتمكين القراء من تدوير مكتباتهم الشخصية بدون أي عمولات خفية وبأمان كامل في نقاط تسليم معتمدة.'
                  : 'With rising paper book prices, WARAQ empowers readers to recirculate physical books with zero broker commissions and verified safe pickup points.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-muted/60 border border-border/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{lang === 'ar' ? '0% عمولات' : '0% Commission'}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {lang === 'ar' ? 'التعامل مباشر ومجاني 100% بين القراء' : '100% free direct trades between readers'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/60 border border-border/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-primary">
                    <Coffee className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'نقاط تسليم آمنة' : 'Safe Hubs'}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {lang === 'ar' ? 'مقاهي ومكتبات معتمدة لتبادل مريح' : 'Partner cafes & bookstores for handoffs'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/60 border border-border/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400">
                    <Sparkles className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'استدامة وخفض هدر' : 'Eco-Friendly'}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {lang === 'ar' ? 'إعادة تدوير متعة القراءة وإنقاذ الورق' : 'Recycle physical pages and save trees'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Savings Calculator Card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-primary/10 via-card to-background p-6 rounded-2xl border-2 border-primary/20 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <span className="text-xs font-black text-muted-foreground">
                  {lang === 'ar' ? 'متوسط توفير القارئ (12 كتاب سنوياً):' : 'Annual Reader Savings (12 books):'}
                </span>
                <span className="text-xs font-black text-emerald-500">💰 3,600+ ج.م</span>
              </div>

              <div className="space-y-2.5 text-xs font-semibold">
                <div className="flex items-center justify-between text-muted-foreground line-through">
                  <span>{lang === 'ar' ? 'شراء من المكتبات بأسعار جديدة:' : 'Bought new from stores:'}</span>
                  <span>~4,200 ج.م</span>
                </div>
                <div className="flex items-center justify-between text-foreground font-black text-sm">
                  <span>{lang === 'ar' ? 'تكلفة التبادل في وَرَق:' : 'Cost on WARAQ:'}</span>
                  <span className="text-emerald-500 text-base">0 ج.م (مجاناً)</span>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/books/add" className="block">
                  <Button className="w-full rounded-xl font-black text-xs gap-2 py-5 cursor-pointer shadow-md shadow-primary/20">
                    <PlusCircle className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'ابدأ توفير أموالك واعرض أول كتاب' : 'Start Saving & List First Book'}</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ======== HOW IT WORKS: 3-STEP ZERO-FEE CYCLE ======== */}
        <section className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {lang === 'ar' ? 'كيف تتم عملية التبادل؟ في 3 خطوات بسيطة' : 'How It Works in 3 Simple Steps'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {lang === 'ar'
                ? 'تجربة سلسة صُممت لتمنحك متعة القراءة بدون تعقيدات أو مصاريف زائدة'
                : 'A seamless cycle designed to give you pure reading joy with zero friction'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                emoji: '📸',
                titleAr: 'صور كتابك واعرضه مجاناً',
                titleEn: 'Photo & List in 30 Seconds',
                descAr: 'التقط صورة لغلاف كتابك، حدد حالته (كالجديد أو ممتاز)، واعرضه للمبادلة أو البيع الرمزي.',
                descEn: 'Snap a cover photo, pick condition (like-new or good), and list it for swap or cheap sale.',
              },
              {
                step: '2',
                emoji: '🤝',
                titleAr: 'اتفق مع القارئ بنقرة واحدة',
                titleEn: 'Connect with a Reader Instantly',
                descAr: 'تصفح رفوف القراء في حيك، اختر الكتاب المقابل أو تواصل عبر الدردشة المباشرة للاتفاق.',
                descEn: 'Explore neighbor shelves, propose a title trade, or chat directly to finalize agreement.',
              },
              {
                step: '3',
                emoji: '☕',
                titleAr: 'استلم كتابك في نقطة التبادل الآمنة',
                titleEn: 'Swap Safely at a Hub or Delivery',
                descAr: 'تقابل في نقطة التبادل المعتمدة (مثل سيلانترو أو ديوان) أو أتم التسليم عبر شركة الشحن بأمان.',
                descEn: 'Meet at a verified hub cafe/store or swap via tracked courier safely with zero hassle.',
              },
            ].map(item => (
              <div
                key={item.step}
                className="group relative flex flex-col items-center text-center p-6 rounded-2xl bg-card border-2 border-border/80 hover:border-primary/50 hover:shadow-xl transition-all duration-300"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {item.emoji}
                </div>
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center mb-3 shadow-md shadow-primary/20">
                  {item.step}
                </div>
                <h3 className="font-black text-base sm:text-lg mb-2 text-foreground group-hover:text-primary transition-colors">
                  {lang === 'ar' ? item.titleAr : item.titleEn}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {lang === 'ar' ? item.descAr : item.descEn}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ======== COMING SOON EXPANSIONS (BOOKSTORES, DEALS, EVENTS) ======== */}
        <section className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-card via-background to-primary/5 p-6 sm:p-10 space-y-8 shadow-sm">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/70 pb-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-primary/15 to-indigo-500/15 border border-primary/30 text-xs font-black text-primary shadow-2xs">
                <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                <span>
                  {lang === 'ar'
                    ? 'قريباً في وَرَق • ميزات قيد التطوير'
                    : 'Coming Soon to WARAQ • In The Pipeline'}
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {lang === 'ar'
                  ? 'مزايا حصرية نجهزها للقراء قريباً 🚀'
                  : 'Exciting New Features Arriving Soon 🚀'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {lang === 'ar'
                  ? 'نعمل على توسيع تجربة تبادل الكتب لتشمل شراكات رسمية مع كبرى المكتبات، حزم توفير مخفضة، وأجندة لأهم الفعاليات الثقافية وحفلات التوقيع.'
                  : 'We are expanding WARAQ beyond individual trades to include verified bookstore partnerships, bulk discount bundles, and a literary events calendar.'}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/80 border border-border/80 text-xs font-bold text-muted-foreground">
                <span className="text-emerald-500 font-black">●</span>
                <span>{lang === 'ar' ? 'النسخة التجريبية (Beta)' : 'Beta Preview Ready'}</span>
              </span>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Bookstores */}
            <div className="group relative flex flex-col justify-between rounded-2xl border-2 border-border/90 bg-card/95 hover:border-primary/60 hover:shadow-xl transition-all duration-300 p-6 space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <Store className="h-6 w-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <span>🕒</span>
                    <span>{lang === 'ar' ? 'قريباً' : 'Coming Soon'}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">
                    {lang === 'ar' ? 'المكتبات ودور النشر الشريكة 🏬' : 'Partner Bookstores & Hubs 🏬'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {lang === 'ar'
                      ? 'دليل موثق لأشهر المكتبات (ديوان، الشروق، الأزبكية) لتصفح كتالوجاتهم، استلام الكتب في فروعهم بأمان، والاستفادة من عروض خاصة.'
                      : 'Verified directory of partner bookstores to browse physical catalogs, pick up trades at counter hubs safely, and unlock member discounts.'}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60">
                  {[
                    { ar: 'ربط مباشر بمخزون وعناوين كبرى المكتبات', en: 'Live stock access to top bookstore titles' },
                    { ar: 'نقاط تسليم واستلام آمنة ومعتمدة للقراء', en: 'Safe verified exchange points across cities' },
                    { ar: 'صفحات مستقلة لكل مكتبة وتقييمات القراء', en: 'Dedicated store pages & reader reviews' },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{lang === 'ar' ? feat.ar : feat.en}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Link href="/stores" className="block">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl font-black text-xs gap-1.5 border-border/80 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all cursor-pointer shadow-2xs"
                  >
                    <span>{lang === 'ar' ? 'معاينة دليل المكتبات (Beta)' : 'Preview Bookstores (Beta)'}</span>
                    <ArrowRight className={cn('h-3.5 w-3.5 transition-transform group-hover:translate-x-1', isRTL && 'rotate-180 group-hover:-translate-x-1')} />
                  </Button>
                </Link>
              </div>
            </div>

            {/* 2. Deals */}
            <div className="group relative flex flex-col justify-between rounded-2xl border-2 border-border/90 bg-card/95 hover:border-amber-500/60 hover:shadow-xl transition-all duration-300 p-6 space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-xs group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                    <Flame className="h-6 w-6 fill-amber-500 group-hover:fill-white" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 flex items-center gap-1">
                    <span>⚡</span>
                    <span>{lang === 'ar' ? 'قريباً' : 'Coming Soon'}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-foreground group-hover:text-amber-500 transition-colors">
                    {lang === 'ar' ? 'سوق الحزم وباقات التوفير 🔥' : 'Book Bundles & Flash Deals 🔥'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {lang === 'ar'
                      ? 'باقات مجمعة (10، 20 كتاب) بخصومات تصل لـ 50% مع هدايا فواصل خشبية محفورة، مفكرات تتبع القراءة، وشحن مخفض لكافة المحافظات.'
                      : 'Curated 10 & 20 books bundles with up to 50% off, handcrafted wooden bookmarks, reading planners, and cheap shipping.'}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60">
                  {[
                    { ar: 'حزم موضوعية جاهزة (روايات، فكر، تنمية)', en: 'Curated genre boxes (Fiction, Growth, Classics)' },
                    { ar: 'هدايا فواصل ومفكرات قراءة مع كل حزمة', en: 'Free artisan bookmarks & gifts with packages' },
                    { ar: 'تخفيضات فلاش دورية على المجموعات الكاملة', en: 'Periodic flash discounts on bulk bundles' },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>{lang === 'ar' ? feat.ar : feat.en}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Link href="/offers" className="block">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl font-black text-xs gap-1.5 border-border/80 group-hover:border-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all cursor-pointer shadow-2xs"
                  >
                    <span>{lang === 'ar' ? 'معاينة سوق العروض (Beta)' : 'Preview Deals Hub (Beta)'}</span>
                    <ArrowRight className={cn('h-3.5 w-3.5 transition-transform group-hover:translate-x-1', isRTL && 'rotate-180 group-hover:-translate-x-1')} />
                  </Button>
                </Link>
              </div>
            </div>

            {/* 3. Events */}
            <div className="group relative flex flex-col justify-between rounded-2xl border-2 border-border/90 bg-card/95 hover:border-indigo-500/60 hover:shadow-xl transition-all duration-300 p-6 space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-xs group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-black bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                    <span>🎉</span>
                    <span>{lang === 'ar' ? 'قريباً' : 'Coming Soon'}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-foreground group-hover:text-indigo-500 transition-colors">
                    {lang === 'ar' ? 'الفعاليات وحفلات التوقيع 📅' : 'Literary Events & Signings 📅'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {lang === 'ar'
                      ? 'أجندة تفاعلية لفعاليات القراءة: ندوات مناقشة الروايات في المقاهي الثقافية، حفلات توقيع الكتاب، مع تأكيد الحضور بنقرة واحدة.'
                      : 'Interactive literary calendar: cozy cafe novel clubs, author book signings, fair meetups with instant one-click RSVP.'}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60">
                  {[
                    { ar: 'أجندة شاملة لملتقيات ونوادي القراءة بالمدن', en: 'Comprehensive schedule of book club meetups' },
                    { ar: 'تأكيد الحضور (RSVP) وحجز المقاعد مباشرة', en: 'One-click RSVP & attendance confirmations' },
                    { ar: 'تذكير ذكي بمواعيد الفعاليات وحفلات التوقيع', en: 'Smart calendar reminders for upcoming events' },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span>{lang === 'ar' ? feat.ar : feat.en}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Link href="/events" className="block">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl font-black text-xs gap-1.5 border-border/80 group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all cursor-pointer shadow-2xs"
                  >
                    <span>{lang === 'ar' ? 'معاينة أجندة الفعاليات (Beta)' : 'Preview Events (Beta)'}</span>
                    <ArrowRight className={cn('h-3.5 w-3.5 transition-transform group-hover:translate-x-1', isRTL && 'rotate-180 group-hover:-translate-x-1')} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ======== HIGH CONVERSION BOTTOM CTA BANNER ======== */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-indigo-700 to-purple-800 p-8 sm:p-12 text-center text-white shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="inline-block text-4xl mb-1 animate-bounce">📚</span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              {lang === 'ar'
                ? 'هل تمتلك كتباً على الرف انتهيت من قراءتها؟'
                : 'Have books on your shelf you have already read?'}
            </h2>
            <p className="text-sm sm:text-base text-white/85 leading-relaxed font-medium">
              {lang === 'ar'
                ? 'حوّلها الآن لفرص قراءة جديدة ومجانية مع آلاف القراء في حيك ومدينتك. أضف كتابك الأول في 30 ثانية فقط!'
                : 'Turn them into new free reading adventures with thousands of readers in your city. Add your first book in just 30 seconds!'}
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Link href="/books/add">
                <Button
                  size="lg"
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-xl shadow-amber-400/30 px-8 py-6 rounded-2xl text-sm cursor-pointer hover:scale-105 active:scale-95 transition-all"
                >
                  <PlusCircle className="h-5 w-5 me-2" />
                  <span>{lang === 'ar' ? 'أضف أول كتاب الآن' : 'List Your First Book Now'}</span>
                </Button>
              </Link>
              <Link href="/communities">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-6 rounded-2xl text-sm font-bold cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'استكشف نوادي القراءة' : 'Explore Reader Clubs'}</span>
                  <ArrowRight className={cn('h-4 w-4 ms-2', isRTL && 'rotate-180')} />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  )
}

function EmptyState({
  emoji,
  titleAr,
  titleEn,
  subtitleAr,
  subtitleEn,
  ctaHref,
  ctaLabelAr,
  ctaLabelEn,
  lang,
}: {
  emoji: string
  titleAr: string
  titleEn: string
  subtitleAr: string
  subtitleEn: string
  ctaHref: string
  ctaLabelAr: string
  ctaLabelEn: string
  lang: 'ar' | 'en'
}) {
  return (
    <div className="empty-state py-12 flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-border bg-card/60">
      <span className="text-5xl mb-4">{emoji}</span>
      <h3 className="text-lg font-bold mb-2 text-foreground">
        {lang === 'ar' ? titleAr : titleEn}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground mb-4 max-w-sm">
        {lang === 'ar' ? subtitleAr : subtitleEn}
      </p>
      <Link href={ctaHref}>
        <Button className="rounded-xl font-bold cursor-pointer">
          {lang === 'ar' ? ctaLabelAr : ctaLabelEn}
        </Button>
      </Link>
    </div>
  )
}
