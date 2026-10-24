import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home,
  Search,
  PlusCircle,
  MessageCircle,
  User,
  Bell,
  BookOpen,
  Shield,
  LogOut,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ArrowRightLeft,
  Layers,
  X,
  TrendingUp,
  Flame,
  Users,
  Settings,
  Store,
  Smartphone,
  Menu,
  Calendar,
  Tag,
  Compass,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/i18n/language-context'
import { t } from '@/i18n/translations'
import { useAuth } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from './theme-toggle'
import { WaraqLogo } from '@/components/ui/waraq-logo'

const POPULAR_CATEGORIES = [
  { slug: 'novels', icon: '📚', nameAr: 'روايات وأدب', nameEn: 'Novels & Fiction' },
  { slug: 'self-help', icon: '🌱', nameAr: 'تطوير الذات وتنمية بشرية', nameEn: 'Self Help' },
  { slug: 'tech', icon: '💻', nameAr: 'برمجة وتقنية', nameEn: 'Technology & AI' },
  { slug: 'psychology', icon: '🧠', nameAr: 'علم نفس وفلسفة', nameEn: 'Psychology' },
  { slug: 'history', icon: '🏛️', nameAr: 'تاريخ وحضارة', nameEn: 'History' },
  { slug: 'religion', icon: '🌙', nameAr: 'دين وروحانيات', nameEn: 'Religion' },
  { slug: 'kids', icon: '🎨', nameAr: 'أطفال وكوميكس', nameEn: 'Comics & Kids' },
  { slug: 'languages', icon: '🌍', nameAr: 'لغات وترجمة', nameEn: 'Languages' },
]

const TRENDING_SEARCHES = [
  { ar: 'نجيب محفوظ', en: 'Naguib Mahfouz' },
  { ar: 'Atomic Habits (العادات الذرية)', en: 'Atomic Habits' },
  { ar: 'علم النفس ولغة الجسد', en: 'Psychology & Body Language' },
  { ar: 'برمجة وذكاء اصطناعي', en: 'Coding & AI' },
  { ar: 'روايات غموض وفانتازيا', en: 'Mystery & Fantasy' },
  { ar: 'كتب مجانية للإهداء 🎁', en: 'Free Giveaways 🎁' },
]

const navItems = [
  { key: 'home', href: '/', icon: Home, labelKey: 'nav_home' as const },
  { key: 'search', href: '/search', icon: Search, labelKey: 'nav_explore' as const },
  { key: 'add', href: '/books/add', icon: PlusCircle, labelKey: 'nav_add' as const, isAdd: true },
  { key: 'notifications', href: '/notifications', icon: Bell, labelKey: 'nav_notifications' as const },
  { key: 'profile', href: '/profile', icon: User, labelKey: 'nav_profile' as const },
]

export function BottomNav() {
  const pathname = usePathname()
  const { lang } = useLanguage()
  const { unreadNotifications } = useAuth()

  return (
    <nav className="bottom-nav md:hidden px-1 bg-white dark:bg-slate-900 border-t border-border shadow-2xl" aria-label="Mobile navigation">
      {navItems.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        const Icon = item.icon

        if (item.isAdd) {
          return (
            <Link
              key={item.key}
              href={item.href}
              prefetch={true}
              aria-label={t(item.labelKey, lang)}
              className="relative -mt-5 flex-1 max-w-[72px] flex flex-col items-center justify-center cursor-pointer group select-none"
            >
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-white dark:ring-slate-900 transition-all duration-200 group-hover:scale-105 group-active:scale-95 cursor-pointer">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-black text-primary mt-1 leading-none select-none">
                {t(item.labelKey, lang)}
              </span>
            </Link>
          )
        }

        return (
          <Link
            key={item.key}
            href={item.href}
            prefetch={true}
            aria-label={t(item.labelKey, lang)}
            className={cn(
              'relative flex-1 max-w-[72px] min-w-0 flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-xl transition-all duration-200 cursor-pointer select-none',
              isActive
                ? 'text-primary font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative flex items-center justify-center">
              <Icon className={cn('h-5 w-5 transition-transform duration-200', isActive && 'scale-110')} />
              {item.key === 'notifications' && unreadNotifications > 0 && (
                <span className="absolute -top-1.5 -end-2 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-xs animate-pulse">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-tight truncate max-w-full font-bold select-none">
              {item.key === 'notifications'
                ? (lang === 'ar' ? 'إشعارات' : 'Alerts')
                : item.key === 'search'
                ? (lang === 'ar' ? 'بحث' : 'Search')
                : t(item.labelKey, lang)}
            </span>
            {isActive && (
              <span className="h-1 w-1 rounded-full bg-primary mt-0.5" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export function TopNav({
  user: initialUser,
  unreadCount: initialUnreadCount = 0,
}: {
  user?: { id: string; profile?: { full_name?: string; avatar_url?: string; role?: string } } | null
  unreadCount?: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { lang, setLang, isRTL } = useLanguage()
  const { user: authUser, profile: authProfile, signOut, unreadNotifications, unreadMessages } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const categoriesRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Use props if supplied, otherwise fallback to AuthContext
  // For avatar: prefer profile DB row, then Google/OAuth user_metadata, then initials
  const activeUser = initialUser || (authUser ? { id: authUser.id, profile: authProfile ?? undefined } : null)
  const effectiveAvatar =
    activeUser?.profile?.avatar_url ||
    authUser?.user_metadata?.avatar_url ||
    authUser?.user_metadata?.picture ||
    null
  const effectiveName =
    activeUser?.profile?.full_name ||
    authUser?.user_metadata?.full_name ||
    authUser?.user_metadata?.name ||
    null
  const effectiveUnread = Math.max(initialUnreadCount, unreadNotifications)

  const [hasConfirmedStore, setHasConfirmedStore] = useState(false)

  useEffect(() => {
    if (!activeUser?.id) return
    let isMounted = true

    // Check localStorage cache first for instant display
    try {
      if (localStorage.getItem(`waraq_store_confirmed_${activeUser.id}`) === 'true') {
        setHasConfirmedStore(true)
      }
    } catch {}

    // Verify in database if user owns a store or has approved application
    const supabaseClient = createClient()
    Promise.all([
      supabaseClient.from('bookstores').select('id, is_verified').eq('owner_id', activeUser.id).maybeSingle(),
      supabaseClient.from('partner_requests').select('id, status').eq('submitted_by', activeUser.id).eq('status', 'APPROVED').maybeSingle(),
    ]).then(([{ data: storeData }, { data: reqData }]) => {
      if (isMounted && (storeData || reqData)) {
        setHasConfirmedStore(true)
        try {
          localStorage.setItem(`waraq_store_confirmed_${activeUser.id}`, 'true')
        } catch {}
      }
    }).catch(() => {})

    return () => {
      isMounted = false
    }
  }, [activeUser?.id])

  const isAdmin = Boolean(
    activeUser?.profile?.role === 'ADMIN' ||
    authProfile?.role === 'ADMIN' ||
    (authUser as any)?.app_metadata?.role === 'admin' ||
    (authUser as any)?.user_metadata?.role === 'admin' ||
    activeUser?.profile?.role === 'MODERATOR' ||
    authProfile?.role === 'MODERATOR'
  )

  const isStorePartner = Boolean(
    isAdmin ||
    (activeUser?.profile as any)?.role === 'PARTNER' ||
    (authProfile as any)?.role === 'PARTNER' ||
    (activeUser?.profile as any)?.role === 'STORE_OWNER' ||
    (authProfile as any)?.role === 'STORE_OWNER' ||
    hasConfirmedStore
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false)
      }
      if (categoriesRef.current && !categoriesRef.current.contains(target)) {
        setCategoriesOpen(false)
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setDropdownOpen(false)
    setMobileSearchOpen(false)
    setCategoriesOpen(false)
    setSearchFocused(false)
  }, [pathname])

  // Keyboard shortcut '/' to focus search bar like GitHub/Udemy
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
        setSearchFocused(true)
      }
      if (e.key === 'Escape') {
        setSearchFocused(false)
        setCategoriesOpen(false)
        setDropdownOpen(false)
        setMobileSearchOpen(false)
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Pre-warm client router cache for instant back/forth page transitions
  useEffect(() => {
    try {
      router.prefetch('/')
      router.prefetch('/explore')
      router.prefetch('/events')
      router.prefetch('/communities')
      router.prefetch('/challenges')
      router.prefetch('/stores')
      router.prefetch('/offers')
      router.prefetch('/search')
      router.prefetch('/notifications')
      router.prefetch('/messages')
      router.prefetch('/profile')
      router.prefetch('/transactions')
      router.prefetch('/books/add')
      router.prefetch('/login')
      router.prefetch('/register')
    } catch {}
  }, [router])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchFocused(false)
    setMobileSearchOpen(false)
    if (!searchQuery.trim()) {
      router.push('/search')
    } else {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSelectQuery = (q: string) => {
    setSearchQuery(q)
    setSearchFocused(false)
    setMobileSearchOpen(false)
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  const handleSignOut = async () => {
    try {
      setSigningOut(true)
      setDropdownOpen(false)
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-white dark:bg-slate-900 shadow-sm transition-colors">
      <div className="page-container">
        <div className="flex h-16 items-center justify-between gap-1.5 sm:gap-4 px-1 sm:px-0">
          {/* Official WARAQ Logo & Mobile Menu Trigger */}
          <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-black bg-muted/80 hover:bg-primary/10 hover:text-primary border border-border/80 text-foreground transition-all cursor-pointer select-none hover:scale-105 active:scale-95"
              aria-label="Open navigation menu"
              title={lang === 'ar' ? 'تصفح كل الأقسام' : 'Open menu'}
            >
              <Menu className="h-4 w-4 text-primary shrink-0" />
              <span className="hidden xs:inline text-[11px] font-black">{lang === 'ar' ? 'الأقسام' : 'Menu'}</span>
            </button>

            <WaraqLogo size="md" priority className="hidden sm:inline-flex" />
            <WaraqLogo size="sm" priority className="sm:hidden" />
          </div>

          {/* Udemy-style Centered Search Bar */}
          <div className="hidden md:flex flex-1 min-w-0 max-w-sm lg:max-w-md xl:max-w-xl mx-2 sm:mx-3 items-center relative" ref={searchContainerRef}>
            <form
              onSubmit={handleSearchSubmit}
              className="relative w-full h-11 flex items-center bg-muted/50 hover:bg-muted/80 focus-within:bg-background border-2 border-border/80 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 rounded-full transition-all shadow-xs group"
            >
              {/* Categories Dropdown Button (Udemy style) */}
              <div className="relative shrink-0" ref={categoriesRef}>
                <button
                  type="button"
                  onClick={() => {
                    setCategoriesOpen(prev => !prev)
                    setSearchFocused(false)
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground border-e border-border/80 transition-colors cursor-pointer select-none"
                  aria-label="Browse categories"
                >
                  <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="hidden lg:inline">{lang === 'ar' ? 'التصنيفات' : 'Categories'}</span>
                  <ChevronDown className={cn('h-3 w-3 transition-transform duration-200', categoriesOpen && 'rotate-180')} />
                </button>

                {/* Categories Popup Menu */}
                {categoriesOpen && (
                  <div className="absolute start-0 mt-3 w-64 rounded-2xl bg-white dark:bg-slate-900 border-2 border-border shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 ring-1 ring-black/5 dark:ring-white/10">
                    <div className="px-3 py-2 border-b border-border/60 mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-black text-muted-foreground uppercase">
                        {lang === 'ar' ? 'أشهر التصنيفات' : 'Top Categories'}
                      </span>
                      <Link
                        href="/explore"
                        onClick={() => setCategoriesOpen(false)}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        {lang === 'ar' ? 'عرض الكل' : 'View all'}
                      </Link>
                    </div>

                    {/* Quick Community Link */}
                    <div className="p-1 mb-1.5 rounded-xl bg-muted/40 border border-border/60">
                      <Link
                        href="/communities"
                        onClick={() => setCategoriesOpen(false)}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-foreground hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors cursor-pointer"
                      >
                        <Users className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{lang === 'ar' ? 'نوادي القراءة ونقاط اللقاء 🌳' : 'Reading Clubs & Safe Hubs 🌳'}</span>
                      </Link>
                    </div>
                    <div className="space-y-0.5">
                      {POPULAR_CATEGORIES.map(cat => (
                        <Link
                          key={cat.slug}
                          href={`/explore?category=${cat.slug}`}
                          onClick={() => setCategoriesOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5">
                            <span className="text-base">{cat.icon}</span>
                            <span>{lang === 'ar' ? cat.nameAr : cat.nameEn}</span>
                          </span>
                          <ChevronRight className={cn('h-3 w-3 text-muted-foreground', isRTL && 'rotate-180')} />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input field */}
              <div className="relative flex-1 flex items-center min-w-0">
                <Search className="h-4 w-4 ms-3.5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onChange={e => {
                    setSearchQuery(e.target.value)
                    setSearchFocused(true)
                  }}
                  placeholder={lang === 'ar' ? 'ابحث عن أي كتاب، مؤلف، أو تصنيف في أي مكان...' : 'Search for any book, author, or genre worldwide...'}
                  className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground/75 focus:outline-none min-w-0"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      searchInputRef.current?.focus()
                    }}
                    className="p-1 rounded-full text-muted-foreground hover:text-foreground me-1.5 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <kbd className="hidden xl:inline-flex me-2 px-1.5 py-0.5 rounded-md bg-background border border-border text-[10px] font-mono text-muted-foreground shadow-2xs">
                  /
                </kbd>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full me-1 font-black text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0 hover:scale-105 active:scale-95"
              >
                <span>{lang === 'ar' ? 'بحث' : 'Search'}</span>
              </button>
            </form>

            {/* Udemy-Style Instant Search Dropdown Popover */}
            {searchFocused && (
              <div className="absolute top-full start-0 end-0 mt-2 rounded-3xl bg-white dark:bg-slate-900 border-2 border-border shadow-2xl p-3.5 z-50 animate-in fade-in-50 zoom-in-95 ring-1 ring-black/5 dark:ring-white/10">
                {/* Active search preview if user has typed something */}
                {searchQuery.trim() && (
                  <div className="mb-2.5">
                    <button
                      type="button"
                      onMouseDown={() => handleSelectQuery(searchQuery.trim())}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer text-start group"
                    >
                      <span className="flex items-center gap-2.5 min-w-0 truncate">
                        <Search className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {lang === 'ar' ? `ابحث عن "${searchQuery}" في جميع الكتب والمؤلفين...` : `Search for "${searchQuery}" across all books...`}
                        </span>
                      </span>
                      <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform', isRTL && 'rotate-180')} />
                    </button>
                  </div>
                )}

                {/* Trending in Alexandria */}
                <div className="px-2 py-1 flex items-center justify-between text-[11px] font-black text-muted-foreground uppercase">
                  <span className="flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500" />
                    <span>{lang === 'ar' ? 'الأكثر بحثاً عالمياً ⚡' : 'Trending Worldwide ⚡'}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground/80 font-normal">
                    {lang === 'ar' ? 'اقتراحات سريعة' : 'Instant tags'}
                  </span>
                </div>

                <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {TRENDING_SEARCHES.map(item => (
                    <button
                      key={item.en}
                      type="button"
                      onMouseDown={() => handleSelectQuery(lang === 'ar' ? item.ar : item.en)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted hover:text-primary transition-colors cursor-pointer text-start group"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                        <span className="truncate">{lang === 'ar' ? item.ar : item.en}</span>
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground/60 group-hover:text-primary shrink-0 ms-1">
                        {lang === 'ar' ? 'بحث' : 'Go'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Quick Categories Bar */}
                <div className="mt-3 pt-2.5 border-t border-border/60">
                  <div className="px-2 mb-1.5 text-[10px] font-black text-muted-foreground uppercase">
                    {lang === 'ar' ? 'أقسام سريعة' : 'Quick Categories'}
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {POPULAR_CATEGORIES.slice(0, 6).map(cat => (
                      <Link
                        key={cat.slug}
                        href={`/explore?category=${cat.slug}`}
                        onMouseDown={() => setSearchFocused(false)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <span>{cat.icon}</span>
                        <span>{lang === 'ar' ? cat.nameAr : cat.nameEn}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side Navigation & Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Marketplace Link */}
            <Link
              href="/explore"
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                pathname.startsWith('/explore')
                  ? "text-primary bg-primary/10 font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <BookOpen className="h-4 w-4 text-primary" />
              <span>{lang === 'ar' ? 'المعرض' : 'Market'}</span>
            </Link>

            {/* Events Link */}
            <Link
              href="/events"
              className={cn(
                "hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                pathname.startsWith('/events')
                  ? "text-purple-600 bg-purple-500/10 font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Calendar className="h-4 w-4 text-purple-600" />
              <span>{lang === 'ar' ? 'الفعاليات' : 'Events'}</span>
            </Link>

            {/* Communities Link */}
            <Link
              href="/communities"
              className={cn(
                "hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                pathname.startsWith('/communities')
                  ? "text-emerald-600 bg-emerald-500/10 font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Users className="h-4 w-4 text-emerald-600" />
              <span>{lang === 'ar' ? 'المجتمعات' : 'Communities'}</span>
            </Link>

            {/* Challenges Link */}
            <Link
              href="/challenges"
              className={cn(
                "hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                pathname.startsWith('/challenges')
                  ? "text-orange-500 bg-orange-500/10 font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
              <span>{lang === 'ar' ? 'التحديات' : 'Challenges'}</span>
            </Link>

            {/* Bookstores Link */}
            <Link
              href="/stores"
              className={cn(
                "hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                pathname.startsWith('/stores')
                  ? "text-primary bg-primary/10 font-black"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Store className="h-4 w-4 text-primary" />
              <span>{lang === 'ar' ? 'المكتبات' : 'Bookstores'}</span>
            </Link>

            {/* Quick Wishlist Icon */}
            <Link
              href="/wishlist"
              className="hidden xl:flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title={t('nav_wishlist', lang)}
              aria-label={t('nav_wishlist', lang)}
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
            </Link>

            {/* Mobile Search Button (Toggle mobile search bar) — hidden on <360px where bottom nav has search */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(prev => !prev)}
              className="md:hidden hidden xs:flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Toggle mobile search"
            >
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </button>

            {/* Theme Toggle (Light / Dark) */}
            <ThemeToggle className="h-8 w-8 sm:h-9 sm:w-9" />

            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center justify-center h-8 px-2 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-black bg-muted/80 hover:bg-accent text-foreground transition-colors cursor-pointer border border-border/60"
              aria-label="Toggle language"
            >
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>

            {activeUser ? (
              <>
                {/* Deals & Loans quick link (with active badge) */}
                <Link
                  href="/transactions"
                  prefetch={true}
                  className="relative hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  aria-label={lang === 'ar' ? 'معاملاتي وطلبات الكتب' : 'Deals & Requests'}
                  title={lang === 'ar' ? 'معاملاتي وطلبات الكتب' : 'Deals & Requests'}
                >
                  <ArrowRightLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </Link>

                {/* Messages quick link — Visible on ALL screens (including Mobile Top Header!) */}
                <Link
                  href="/messages"
                  prefetch={true}
                  className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  aria-label={t('nav_messages', lang)}
                  title={t('nav_messages', lang)}
                >
                  <MessageCircle className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-primary text-[9px] sm:text-[10px] text-white font-black animate-pulse">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Link>

                {/* Notifications — Visible on desktop (screens >= sm); on mobile it is in the Bottom Nav */}
                <Link
                  href="/notifications"
                  prefetch={true}
                  className="relative hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  aria-label={t('nav_notifications', lang)}
                  title={t('nav_notifications', lang)}
                >
                  <Bell className="h-5 w-5" />
                  {effectiveUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-black">
                      {effectiveUnread > 9 ? '9+' : effectiveUnread}
                    </span>
                  )}
                </Link>

                {/* Add Book Button — Desktop CTA (Guaranteed no wrap with whitespace-nowrap and shrink-0) */}
                <Link
                  href="/books/add"
                  className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black shadow-xs hover:scale-105 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <PlusCircle className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap font-black">{t('nav_add', lang)}</span>
                </Link>

                {/* Store Dashboard Direct Badge for Verified Partners */}
                {isStorePartner && (
                  <Link
                    href="/stores/dashboard"
                    prefetch={true}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
                    title={lang === 'ar' ? 'لوحة إدارة متجري والمخزون' : 'Store Manager Dashboard'}
                  >
                    <Store className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden lg:inline">{lang === 'ar' ? 'متجري 🏬' : 'My Store 🏬'}</span>
                  </Link>
                )}

                {/* Admin Dashboard Direct Badge for Admins */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    prefetch={true}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
                    title={lang === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin Dashboard'}
                  >
                    <Shield className="h-3.5 w-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span className="hidden lg:inline">{lang === 'ar' ? 'الإدارة 🛡️' : 'Admin 🛡️'}</span>
                  </Link>
                )}

                {/* User Avatar with Status Ring and Solid Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(prev => !prev)}
                    className="flex items-center gap-1 p-0.5 rounded-full hover:bg-muted transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary select-none"
                    aria-label="User menu"
                  >
                    <div className="relative">
                      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center ring-2 ring-primary/40 hover:ring-primary transition-all shadow-xs">
                        {effectiveAvatar ? (
                          <img
                            src={effectiveAvatar}
                            alt="Profile"
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-xs sm:text-sm font-black text-primary">
                            {(effectiveName?.charAt(0) ?? 'U').toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Active status indicator dot */}
                      <span className="absolute bottom-0 end-0 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500 ring-2 ring-background shadow-xs" />
                    </div>
                    <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 hidden sm:block', dropdownOpen && 'rotate-180')} />
                  </button>

                  {/* Solid Elevated User Dropdown Card with Mobile Scroll Fix */}
                  {dropdownOpen && (
                    <div className="absolute end-0 mt-2.5 w-[calc(100vw-24px)] max-w-[300px] sm:w-72 max-h-[calc(100dvh-75px)] sm:max-h-[min(650px,calc(100vh-90px))] overflow-y-auto overscroll-contain rounded-3xl bg-white dark:bg-slate-900 border-2 border-border shadow-2xl p-2.5 z-50 animate-in fade-in-50 zoom-in-95 ring-1 ring-black/5 dark:ring-white/10 scrollbar-thin">
                      {/* Profile User Info Card */}
                      <div className="p-3 rounded-2xl bg-muted/50 border border-border/60 mb-1.5 flex items-center gap-3 shrink-0">
                        <div className="h-11 w-11 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center ring-2 ring-primary/30 shrink-0">
                          {effectiveAvatar ? (
                            <img
                              src={effectiveAvatar}
                              alt="Profile"
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-base font-black text-primary">
                              {(effectiveName?.charAt(0) ?? 'U').toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-foreground truncate">
                            {effectiveName || (lang === 'ar' ? 'قارئ وَرَق' : 'WARAQ Reader')}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {isAdmin ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[10px] font-black border border-rose-500/30">
                                <span>🛡️</span>
                                <span>{lang === 'ar' ? 'مدير المنصة' : 'Admin'}</span>
                              </span>
                            ) : isStorePartner ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                                <span>🏬</span>
                                <span>{lang === 'ar' ? 'شريك مكتبة' : 'Store Partner'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                <span>⭐</span>
                                <span>{lang === 'ar' ? 'قارئ موثق' : 'Verified Reader'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Menu Items */}
                      <div className="space-y-0.5">
                        {/* Admin Dashboard - Prominent Quick Link for Admins */}
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black text-rose-700 dark:text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 transition-all cursor-pointer group shadow-2xs mb-1"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="p-1 rounded-lg bg-rose-500/25 text-rose-600 dark:text-rose-300 group-hover:scale-110 transition-transform">
                                <Shield className="h-4 w-4" />
                              </div>
                              <span>{lang === 'ar' ? 'لوحة تحكم الإدارة 🛡️' : 'Admin Dashboard 🛡️'}</span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-black tracking-wider">
                              ADMIN
                            </span>
                          </Link>
                        )}
                        {/* Partner Bookstore Flow */}
                        <Link
                          href="/stores"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-foreground/90 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                              <Store className="h-4 w-4" />
                            </div>
                            <span>{lang === 'ar' ? 'دليل المكتبات الشريكة 🏬' : 'Partner Bookstores'}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                            {lang === 'ar' ? 'متاجر وعروض' : 'Stores & Deals'}
                          </span>
                        </Link>

                        <div className="my-1 border-t border-border/50" />

                        <Link
                          href="/transactions"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-foreground/90 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                              <ArrowRightLeft className="h-4 w-4" />
                            </div>
                            <span>{lang === 'ar' ? 'معاملاتي وكتبي المستعارة' : 'My Deals & Loans'}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                            نشط ⏳
                          </span>
                        </Link>

                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground/90 hover:bg-accent hover:text-foreground transition-colors cursor-pointer group"
                        >
                          <div className="p-1 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                            <User className="h-4 w-4" />
                          </div>
                          <span>{t('nav_profile', lang)}</span>
                        </Link>

                        <Link
                          href="/profile/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground/90 hover:bg-accent hover:text-foreground transition-colors cursor-pointer group"
                        >
                          <div className="p-1 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform">
                            <Settings className="h-4 w-4" />
                          </div>
                          <span>{lang === 'ar' ? 'إعدادات وتعديل الملف' : 'Profile Settings'}</span>
                        </Link>

                        <Link
                          href="/messages"
                          prefetch={true}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-foreground/90 hover:bg-accent hover:text-foreground transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
                              <MessageCircle className="h-4 w-4" />
                            </div>
                            <span>{lang === 'ar' ? 'الرسائل والمحادثات' : 'Messages & Chat'}</span>
                          </div>
                          {unreadMessages > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-black animate-pulse">
                              {unreadMessages > 9 ? '9+' : unreadMessages}
                            </span>
                          )}
                        </Link>

                        <Link
                          href="/wishlist"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground/90 hover:bg-accent hover:text-foreground transition-colors cursor-pointer group"
                        >
                          <div className="p-1 rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <span>{t('nav_wishlist', lang)}</span>
                        </Link>

                        <div className="my-1 border-t border-border/50" />

                        <Link
                          href="/communities"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground/90 hover:bg-accent hover:text-foreground transition-colors cursor-pointer group"
                        >
                          <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                            <Users className="h-4 w-4" />
                          </div>
                          <span>{lang === 'ar' ? 'نوادي القراءة ونقاط اللقاء الآمنة' : 'Reading Clubs & Safe Hubs'}</span>
                        </Link>

                        <Link
                          href="/about"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground/90 hover:bg-accent hover:text-foreground transition-colors cursor-pointer group"
                        >
                          <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <span>{lang === 'ar' ? 'عن منصة وَرَق' : 'About WARAQ'}</span>
                        </Link>

                        <Link
                          href="/challenges"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground/90 hover:bg-accent hover:text-foreground transition-colors cursor-pointer group"
                        >
                          <div className="p-1 rounded-lg bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                            <Flame className="h-4 w-4 fill-orange-500" />
                          </div>
                          <span>{lang === 'ar' ? 'تحديات القراءة والماراثونات 🔥' : 'Reading Challenges & Quests'}</span>
                        </Link>

                        {/* Store Manager Dashboard — Matched to store partner / staff roles */}
                        {isStorePartner && (
                          <Link
                            href="/stores/dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-600 transition-colors cursor-pointer group border border-emerald-500/20"
                          >
                            <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-600 group-hover:scale-110 transition-transform">
                              <Store className="h-4 w-4" />
                            </div>
                            <span>{lang === 'ar' ? 'لوحة إدارة متجري والمخزون 🏬' : 'Store Manager Dashboard'}</span>
                          </Link>
                        )}

                        <Link
                          href="/download"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground/90 hover:bg-accent hover:text-foreground transition-colors cursor-pointer group"
                        >
                          <div className="p-1 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform">
                            <Smartphone className="h-4 w-4" />
                          </div>
                          <span>{lang === 'ar' ? 'تحميل تطبيق الموبايل (PWA) 📱' : 'Download Mobile App'}</span>
                        </Link>

                        <Link
                          href="/partner-form"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground/90 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-600 transition-colors cursor-pointer group"
                        >
                          <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600 group-hover:scale-110 transition-transform">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <span>{lang === 'ar' ? 'انضم كشريك (مكتبة / فعاليات)' : 'Partner With Us'}</span>
                        </Link>

                        <div className="my-1 border-t border-border/50" />


                        <Link
                          href="/books/add"
                          onClick={() => setDropdownOpen(false)}
                          className="flex md:hidden items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground/90 hover:bg-accent hover:text-foreground transition-colors cursor-pointer group"
                        >
                          <div className="p-1 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                            <PlusCircle className="h-4 w-4" />
                          </div>
                          <span>{t('nav_add', lang)}</span>
                        </Link>

                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                          >
                            <div className="p-1 rounded-lg bg-rose-500/10 text-rose-600">
                              <Shield className="h-4 w-4" />
                            </div>
                            <span>{lang === 'ar' ? 'لوحة تحكم الإدارة 🛡️' : 'Admin Dashboard 🛡️'}</span>
                          </Link>
                        )}
                      </div>

                      {/* Sign Out Button */}
                      <div className="pt-1.5 mt-1.5 border-t border-border/60">
                        <button
                          type="button"
                          onClick={handleSignOut}
                          disabled={signingOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>
                            {signingOut
                              ? (lang === 'ar' ? 'جاري الخروج...' : 'Signing out...')
                              : (lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out')}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-foreground bg-muted/60 hover:bg-muted border border-border/60 transition-colors cursor-pointer shrink-0"
                >
                  {t('nav_login', lang)}
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black active:scale-[0.98] transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                >
                  {t('nav_register', lang)}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide-Down Search Drawer (Udemy Style) */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-border/80 bg-background/98 backdrop-blur-xl px-4 py-3 animate-in slide-in-from-top-2 duration-200 shadow-lg">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className={cn(
              'absolute h-4 w-4 text-muted-foreground pointer-events-none',
              isRTL ? 'right-3.5' : 'left-3.5'
            )} />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'ابحث عن أي كتاب، مؤلف، أو تصنيف في أي مكان...' : 'Search for any book, author, or genre worldwide...'}
              className={cn(
                'w-full bg-muted/60 border border-border/90 focus:border-primary rounded-xl py-2.5 text-base sm:text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20',
                isRTL ? 'pr-10 pl-20' : 'pl-10 pr-20'
              )}
            />
            <button
              type="submit"
              className={cn(
                'absolute top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow-xs cursor-pointer',
                isRTL ? 'left-1.5' : 'right-1.5'
              )}
            >
              {lang === 'ar' ? 'بحث' : 'Search'}
            </button>
          </form>
          {/* Mobile trending chips */}
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[10px] font-bold text-muted-foreground shrink-0 flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500 fill-orange-500" />
            </span>
            {TRENDING_SEARCHES.slice(0, 4).map(item => (
              <button
                key={item.en}
                type="button"
                onClick={() => handleSelectQuery(lang === 'ar' ? item.ar : item.en)}
                className="px-2.5 py-1 rounded-lg bg-muted text-[11px] font-medium text-foreground hover:text-primary shrink-0 cursor-pointer"
              >
                {lang === 'ar' ? item.ar : item.en}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile & Guest Explore Drawer / Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200" role="dialog" aria-modal="true">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            className={cn(
              "relative z-10 w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border-border shadow-2xl flex flex-col h-full overflow-hidden animate-in duration-300",
              isRTL ? "ms-auto border-s slide-in-from-right" : "me-auto border-e slide-in-from-left"
            )}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-border/80 flex items-center justify-between bg-muted/30 shrink-0">
              <div className="flex items-center gap-2">
                <WaraqLogo size="sm" priority />
                <span className="text-xs font-black text-foreground">
                  {lang === 'ar' ? 'أقسام المنصة' : 'Menu & Hubs'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* If NOT logged in (Guest Non-User Welcome Card) */}
              {!activeUser ? (
                <div className="p-4 rounded-3xl bg-gradient-to-br from-primary/15 via-emerald-500/10 to-indigo-500/15 border-2 border-primary/25 shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black shadow-md shadow-primary/20 text-lg">
                      📖
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-foreground">
                        {lang === 'ar' ? 'أهلاً بك في منصة وَرَق! 👋' : 'Welcome to WARAQ! 👋'}
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        {lang === 'ar' ? 'سوق القراء لتبادل، شراء واستعارة الكتب والفعاليات' : 'Book marketplace, reader clubs & live events'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-xs hover:bg-primary/90 transition-all text-center"
                    >
                      {t('nav_login', lang)}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 text-foreground border border-border text-xs font-black hover:bg-muted transition-all text-center"
                    >
                      {t('nav_register', lang)}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center ring-2 ring-primary/30 shrink-0">
                      {effectiveAvatar ? (
                        <img src={effectiveAvatar} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-sm font-black text-primary">{(effectiveName?.charAt(0) ?? 'U').toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-foreground truncate">{effectiveName || (lang === 'ar' ? 'قارئ وَرَق' : 'WARAQ Reader')}</p>
                      <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="text-[11px] font-bold text-primary hover:underline">
                        {lang === 'ar' ? 'عرض الملف الشخصي ←' : 'View Profile →'}
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Hubs Navigation Links */}
              <div className="space-y-1.5">
                <div className="px-2 py-1 text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                  {lang === 'ar' ? 'الأقسام الرئيسية' : 'Main Hubs'}
                </div>

                {/* 1. Marketplace */}
                <Link
                  href="/explore"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 hover:bg-primary/10 hover:border-primary/30 border border-border/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                          {lang === 'ar' ? 'سوق ومعرض الكتب' : 'Book Marketplace'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/15 text-primary">
                          {lang === 'ar' ? 'شراء ومبادلة' : 'Buy & Swap'}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {lang === 'ar' ? 'تصفح آلاف الكتب للبيع والاستعارة والمبادلة الفورية' : 'Browse thousands of books for buy, loan & swap'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={cn('h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors', isRTL && 'rotate-180')} />
                </Link>

                {/* 2. Events Hub */}
                <Link
                  href="/events"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 hover:bg-purple-500/10 hover:border-purple-500/30 border border-border/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-foreground group-hover:text-purple-600 transition-colors">
                          {lang === 'ar' ? 'الفعاليات وورش العمل' : 'Events & Workshops'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-600">
                          {lang === 'ar' ? 'حفلات توقيع ⚡' : 'Book Clubs ⚡'}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {lang === 'ar' ? 'حفلات توقيع الكتّاب، ملتقيات ومناقشات القراءة' : 'Book signings, meetups & reading discussions'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={cn('h-4 w-4 text-muted-foreground group-hover:text-purple-600 transition-colors', isRTL && 'rotate-180')} />
                </Link>

                {/* 3. Communities & Reading Clubs */}
                <Link
                  href="/communities"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-border/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-foreground group-hover:text-emerald-600 transition-colors">
                          {lang === 'ar' ? 'نوادي القراءة والمجتمعات' : 'Communities & Clubs'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600">
                          {lang === 'ar' ? 'نقاط آمنة 🌳' : 'Safe Hubs 🌳'}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {lang === 'ar' ? 'انضم لمجتمعات القراء ونقاط التبادل الآمنة' : 'Join reader clubs & verified meetup safe hubs'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={cn('h-4 w-4 text-muted-foreground group-hover:text-emerald-600 transition-colors', isRTL && 'rotate-180')} />
                </Link>

                {/* 4. Reading Challenges */}
                <Link
                  href="/challenges"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 hover:bg-orange-500/10 hover:border-orange-500/30 border border-border/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-orange-500/15 text-orange-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Flame className="h-5 w-5 fill-orange-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-foreground group-hover:text-orange-500 transition-colors">
                          {lang === 'ar' ? 'تحديات القراءة والماراثونات' : 'Reading Challenges'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-500/15 text-orange-600">
                          🔥 2026
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {lang === 'ar' ? 'تحدي 50 كتاب ومسابقات القراءة وجوائزها' : '50 Books Quest & reader leaderboards'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={cn('h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors', isRTL && 'rotate-180')} />
                </Link>

                {/* 5. Bookstores & Partners */}
                <Link
                  href="/stores"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 hover:bg-blue-500/10 hover:border-blue-500/30 border border-border/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-foreground group-hover:text-blue-600 transition-colors">
                          {lang === 'ar' ? 'دليل المكتبات والشركاء' : 'Bookstores Catalog'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/15 text-blue-600">
                          {lang === 'ar' ? 'مكتبات معتمدة' : 'Verified'}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {lang === 'ar' ? 'مكتبات معتمدة، عروض الشحن وباكدجات حصرية' : 'Official bookshops, exclusive bundles & fast shipping'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={cn('h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors', isRTL && 'rotate-180')} />
                </Link>

                {/* 6. Special Offers & Deals */}
                <Link
                  href="/offers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 hover:bg-amber-500/10 hover:border-amber-500/30 border border-border/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Tag className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-foreground group-hover:text-amber-600 transition-colors">
                          {lang === 'ar' ? 'العروض وتخفيضات الكتب' : 'Special Offers & Bundles'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-600">
                          {lang === 'ar' ? 'توفير 🎁' : 'Deals 🎁'}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {lang === 'ar' ? 'خصومات باكدجات التوفير وسلاسل الروايات' : 'Bundle discounts, free gifts & series packs'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={cn('h-4 w-4 text-muted-foreground group-hover:text-amber-600 transition-colors', isRTL && 'rotate-180')} />
                </Link>
              </div>

              {/* Extra Services & Platform Links */}
              <div className="space-y-1 pt-2 border-t border-border/60">
                <div className="px-2 py-1 text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                  {lang === 'ar' ? 'خدمات إضافية' : 'Services'}
                </div>

                <Link
                  href="/books/add"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4 text-primary" />
                  <span>{lang === 'ar' ? 'أضف كتاباً للبيع أو المبادلة' : 'Add Book Listing'}</span>
                </Link>

                <Link
                  href="/partner-form"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground hover:bg-amber-500/10 hover:text-amber-600 transition-colors cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>{lang === 'ar' ? 'انضم كشريك (مكتبة أو منظم فعاليات)' : 'Partner With Us'}</span>
                </Link>

                {/* Admin Management in Mobile Drawer */}
                {isAdmin && (
                  <div className="pt-2 border-t border-border/60 space-y-1">
                    <div className="px-2 py-1 text-[11px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-rose-600" />
                      <span>{lang === 'ar' ? 'إدارة المنصة (Admin)' : 'Platform Admin'}</span>
                    </div>
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-rose-700 dark:text-rose-300 group-hover:text-rose-600 transition-colors">
                              {lang === 'ar' ? 'لوحة تحكم الإدارة 🛡️' : 'Admin Dashboard 🛡️'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500/20 text-rose-700 dark:text-rose-300">
                              ADMIN
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">
                            {lang === 'ar' ? 'إدارة المستخدمين، المكتبات الشريكة، التقارير والإحصائيات' : 'Users, partner stores, reports & stats'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={cn('h-4 w-4 text-rose-600 group-hover:translate-x-0.5 transition-transform', isRTL && 'rotate-180')} />
                    </Link>
                  </div>
                )}

                {/* Partner Store Tools in Mobile Drawer */}
                {activeUser && isStorePartner && (
                  <div className="pt-2 border-t border-border/60 space-y-1">
                    <div className="px-2 py-1 text-[11px] font-black uppercase text-emerald-600 tracking-wider flex items-center gap-1.5">
                      <Store className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{lang === 'ar' ? 'أدوات الشركاء والمكتبات' : 'Partner Store Tools'}</span>
                    </div>
                    <Link
                      href="/stores/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Store className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-600 transition-colors">
                              {lang === 'ar' ? 'لوحة إدارة متجري والمخزون 🏬' : 'Store Manager Dashboard 🏬'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                              STORE
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">
                            {lang === 'ar' ? 'إدارة باقات وكتالوج الكتب، العروض والطلبات' : 'Manage books catalog, bundles & orders'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={cn('h-4 w-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform', isRTL && 'rotate-180')} />
                    </Link>
                  </div>
                )}

                <Link
                  href="/download"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span>{lang === 'ar' ? 'تحميل تطبيق الموبايل (PWA)' : 'Download Mobile App'}</span>
                </Link>

                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{lang === 'ar' ? 'عن منصة وَرَق' : 'About WARAQ'}</span>
                </Link>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <ThemeToggle className="h-9 w-9" />
                <button
                  type="button"
                  onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                  className="flex items-center justify-center h-9 px-3 rounded-xl text-xs font-black bg-muted hover:bg-accent text-foreground transition-colors border border-border cursor-pointer"
                >
                  {lang === 'ar' ? 'English' : 'عربي'}
                </button>
              </div>

              {activeUser ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{signingOut ? (lang === 'ar' ? 'جاري الخروج...' : 'Signing out...') : (lang === 'ar' ? 'خروج' : 'Logout')}</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-xs hover:bg-primary/90 transition-colors"
                >
                  <span>{t('nav_login', lang)}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
