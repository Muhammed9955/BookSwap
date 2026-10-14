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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/i18n/language-context'
import { t } from '@/i18n/translations'
import { useAuth } from '@/lib/auth/auth-context'
import { ThemeToggle } from './theme-toggle'

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
  { key: 'messages', href: '/messages', icon: MessageCircle, labelKey: 'nav_messages' as const },
  { key: 'profile', href: '/profile', icon: User, labelKey: 'nav_profile' as const },
]

export function BottomNav() {
  const pathname = usePathname()
  const { lang } = useLanguage()

  return (
    <nav className="bottom-nav md:hidden" aria-label="Mobile navigation">
      {navItems.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        const Icon = item.icon

        if (item.isAdd) {
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-label={t(item.labelKey, lang)}
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95 cursor-pointer">
                <Icon className="h-6 w-6" />
              </div>
            </Link>
          )
        }

        return (
          <Link
            key={item.key}
            href={item.href}
            aria-label={t(item.labelKey, lang)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors cursor-pointer',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
            <span className="text-[10px] font-medium leading-tight">
              {item.key === 'search' ? (lang === 'ar' ? 'بحث' : 'Search') : t(item.labelKey, lang)}
            </span>
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
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand with Graphic Icon */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary via-indigo-600 to-violet-500 text-white font-extrabold text-xl shadow-md shadow-primary/25 group-hover:scale-105 group-hover:shadow-primary/40 transition-all">
              📖
              <span className="absolute -top-1 -end-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-background"></span>
              </span>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-foreground flex items-center gap-1">
                BookSwap
              </span>
              <span className="text-[11px] font-bold text-primary block leading-none">
                {lang === 'ar' ? 'بادِل كتبك في مدينتك 📍' : 'Swap Books in Your City 📍'}
              </span>
            </div>
          </Link>

          {/* Udemy-style Centered Prominent Search Bar */}
          <div className="hidden md:flex flex-1 min-w-0 max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-2 sm:mx-4 lg:mx-6 items-center relative" ref={searchContainerRef}>
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
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Communities Link */}
            <Link
              href="/communities"
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Users className="h-4 w-4 text-emerald-600" />
              <span>{lang === 'ar' ? 'المجتمعات' : 'Communities'}</span>
            </Link>

            {/* Quick Explore Icon/Link for Desktop */}
            <Link
              href="/explore"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-primary" />
              <span>{lang === 'ar' ? 'استكشف' : 'Explore'}</span>
            </Link>

            {/* Quick Wishlist Icon */}
            <Link
              href="/wishlist"
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title={t('nav_wishlist', lang)}
              aria-label={t('nav_wishlist', lang)}
            >
              <Sparkles className="h-4.5 w-4.5 text-amber-500" />
            </Link>

            {/* Mobile Search Button (Toggle mobile search bar) */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(prev => !prev)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Toggle mobile search"
            >
              <Search className="h-5 w-5 text-primary" />
            </button>

            {/* Theme Toggle (Light / Dark) */}
            <ThemeToggle />

            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black bg-muted/80 hover:bg-accent text-foreground transition-colors cursor-pointer border border-border/60"
              aria-label="Toggle language"
            >
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>

            {activeUser ? (
              <>
                {/* Deals & Loans quick link (with active badge) */}
                <Link
                  href="/transactions"
                  className="relative hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  aria-label={lang === 'ar' ? 'معاملاتي وطلبات الكتب' : 'Deals & Requests'}
                  title={lang === 'ar' ? 'معاملاتي وطلبات الكتب' : 'Deals & Requests'}
                >
                  <ArrowRightLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </Link>

                {/* Messages quick link */}
                <Link
                  href="/messages"
                  className="relative hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  aria-label={t('nav_messages', lang)}
                  title={t('nav_messages', lang)}
                >
                  <MessageCircle className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white font-black animate-pulse">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Link>

                {/* Notifications */}
                <Link
                  href="/notifications"
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
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
                  className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <PlusCircle className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap font-black">{t('nav_add', lang)}</span>
                </Link>

                {/* User Avatar with Status Ring and Solid Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(prev => !prev)}
                    className="flex items-center gap-1.5 p-0.5 rounded-full hover:bg-muted transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary select-none"
                    aria-label="User menu"
                  >
                    <div className="relative">
                      <div className="h-9 w-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center ring-2 ring-primary/40 hover:ring-primary transition-all shadow-xs">
                        {effectiveAvatar ? (
                          <img
                            src={effectiveAvatar}
                            alt="Profile"
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-sm font-black text-primary">
                            {(effectiveName?.charAt(0) ?? 'U').toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Active status indicator dot */}
                      <span className="absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background shadow-xs" />
                    </div>
                    <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 hidden sm:block', dropdownOpen && 'rotate-180')} />
                  </button>

                  {/* Solid Elevated User Dropdown Card */}
                  {dropdownOpen && (
                    <div className="absolute end-0 mt-2.5 w-72 rounded-3xl bg-white dark:bg-slate-900 border-2 border-border shadow-2xl p-2.5 z-50 animate-in fade-in-50 zoom-in-95 ring-1 ring-black/5 dark:ring-white/10">
                      {/* Profile User Info Card */}
                      <div className="p-3 rounded-2xl bg-muted/50 border border-border/60 mb-1.5 flex items-center gap-3">
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
                            {effectiveName || (lang === 'ar' ? 'قارئ بدّلها' : 'BookSwap Reader')}
                          </p>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            <span>⭐</span>
                            <span>{lang === 'ar' ? 'قارئ موثق' : 'Verified Reader'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Menu Items */}
                      <div className="space-y-0.5">
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
                          href="/messages"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-foreground/90 hover:bg-accent hover:text-foreground transition-colors cursor-pointer group"
                        >
                          <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
                            <MessageCircle className="h-4 w-4" />
                          </div>
                          <span>{lang === 'ar' ? 'الرسائل والمحادثات' : 'Messages & Chat'}</span>
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
                          <span>{lang === 'ar' ? 'من نحن' : 'About BookSwap'}</span>
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

                        {activeUser.profile?.role === 'ADMIN' && (
                          <Link
                            href="/admin"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                          >
                            <div className="p-1 rounded-lg bg-red-500/10 text-red-600">
                              <Shield className="h-4 w-4" />
                            </div>
                            <span>{lang === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin Dashboard'}</span>
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
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  {t('nav_login', lang)}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white text-xs font-black hover:brightness-105 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
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
                'w-full bg-muted/60 border border-border/90 focus:border-primary rounded-xl py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20',
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
    </header>
  )
}
