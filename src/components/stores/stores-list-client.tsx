'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Store,
  MapPin,
  Star,
  Sparkles,
  Search,
  CheckCircle2,
  ExternalLink,
  Flame,
  Calendar,
  BookOpen,
  ArrowRight,
  Filter,
  Users,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { cn } from '@/lib/utils'
import { toggleStoreFollow } from '@/lib/stores/store-service'
import type { Bookstore, StoreType } from '@/types/store'

interface StoresListClientProps {
  initialStores: Bookstore[]
  currentUserId?: string | null
}

export function StoresListClient({ initialStores, currentUserId }: StoresListClientProps) {
  const { lang, isRTL } = useLanguage()
  const [stores, setStores] = useState<Bookstore[]>(initialStores)
  const [selectedType, setSelectedType] = useState<StoreType | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({})

  const filteredStores = stores.filter(store => {
    // Type filter
    if (selectedType !== 'ALL') {
      if (selectedType === 'OFFLINE' && store.store_type === 'ONLINE') return false
      if (selectedType === 'ONLINE' && store.store_type === 'OFFLINE') return false
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = store.name.toLowerCase().includes(q) || (store.name_ar && store.name_ar.includes(q))
      const matchAddr = store.address && store.address.toLowerCase().includes(q)
      const matchDesc =
        store.description?.toLowerCase().includes(q) || (store.description_ar && store.description_ar.includes(q))
      if (!matchName && !matchAddr && !matchDesc) return false
    }

    return true
  })

  const handleFollowToggle = async (e: React.MouseEvent, storeId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!currentUserId) {
      alert(lang === 'ar' ? 'يرجى تسجيل الدخول لمتابعة المتجر' : 'Please log in to follow this bookstore')
      return
    }

    const currentlyFollowing = Boolean(followingMap[storeId])
    setFollowingMap(prev => ({ ...prev, [storeId]: !currentlyFollowing }))

    try {
      await toggleStoreFollow(storeId, currentUserId)
    } catch {
      // Revert on error
      setFollowingMap(prev => ({ ...prev, [storeId]: currentlyFollowing }))
    }
  }

  return (
    <MainLayout>
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background border-b border-border/80 pt-10 pb-12">
        <div className="page-container relative z-10">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black border border-primary/20">
              <Store className="h-3.5 w-3.5" />
              <span>{lang === 'ar' ? 'سوق المكتبات الشريكة في مصر' : 'Partner Bookstores & Bookshops in Egypt'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
              {lang === 'ar' ? (
                <>
                  اكتشف أعرق <span className="text-primary underline decoration-primary/30">مكتبات مصر</span> وعروض الحزم الحصرية
                </>
              ) : (
                <>
                  Discover Egypt’s Finest <span className="text-primary underline decoration-primary/30">Bookstores</span> & Exclusive Bundles
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {lang === 'ar'
                ? 'تصفح كبرى المكتبات التراثية والحديثة في القاهرة والإسكندرية والمحافظات، واكتشف عروض الباقات (10، 20 كتاب مع هدايا)، وحفلات توقيع الكتّاب والفعاليات الثقافية.'
                : 'Browse historic & modern bookshops across Cairo, Alexandria, and all governorates. Explore bulk discount bundles, author signings, and reader meetups.'}
            </p>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/offers">
                <Button className="rounded-2xl font-black text-xs gap-2 shadow-lg shadow-primary/20">
                  <Flame className="h-4 w-4 text-orange-300 fill-orange-300" />
                  {lang === 'ar' ? 'استعراض عروض وحزم الكتب 🔥' : 'Browse Bundle Deals 🔥'}
                </Button>
              </Link>
              <Link href="/events">
                <Button variant="outline" className="rounded-2xl font-black text-xs gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {lang === 'ar' ? 'جدول الفعاليات وتوقيع الكتب' : 'Upcoming Book Events'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Content Area */}
      <div className="page-container py-8 space-y-8">
        {/* Coming Soon Notice Banner */}
        <div className="rounded-3xl border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black text-xs">
                ⏳ {lang === 'ar' ? 'ميزة قادمة قريباً — معاينة تجريبية' : 'Coming Soon — Early Preview'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-foreground/85 font-medium leading-relaxed max-w-2xl">
              {lang === 'ar'
                ? 'تركيزنا الأساسي حالياً في منصة وَرَق ينصب على نجاح وتسهيل صفقات المبادلة والاستعارة والشراء المباشر بين القراء يداً بيد. سوق المكتبات الشريكة قيد التجهيز مع المكتبات وسيُطلق رسمياً قريباً.'
                : 'Our core focus right now in WARAQ is perfecting peer-to-peer book swaps, lending, and direct purchases between readers. The Bookstore Marketplace is in preparation and launching soon.'}
            </p>
          </div>
          <Link href="/explore" className="shrink-0">
            <Button size="sm" className="font-bold text-xs rounded-xl shadow-xs">
              {lang === 'ar' ? 'استكشف كتب القراء المتاحة الآن 📚' : 'Browse Reader Books 📚'}
            </Button>
          </Link>
        </div>

        {/* Controls Bar: Type Filter + Search Input */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-3xl bg-card border-2 border-border/80 shadow-xs">
          {/* Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', labelAr: 'الكل', labelEn: 'All Stores', icon: Store },
              { id: 'OFFLINE', labelAr: 'مكتبات فعلية 🏬', labelEn: 'Physical Stores 🏬', icon: MapPin },
              { id: 'ONLINE', labelAr: 'متاجر أونلاين 🌐', labelEn: 'Online Boutiques 🌐', icon: Sparkles },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id as StoreType | 'ALL')}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap',
                  selectedType === tab.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {lang === 'ar' ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className={cn('absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground', isRTL ? 'right-3' : 'left-3')} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'ابحث باسم المكتبة أو الحي (الزمالك، المعادي، وسط البلد)...' : 'Search by bookstore name or area...'}
              className={cn(
                'w-full py-2 text-xs font-bold rounded-2xl bg-muted/40 border border-border/80 focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all',
                isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
              )}
            />
          </div>
        </div>

        {/* Store Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map(store => {
            const isFollowing = followingMap[store.id] ?? false

            return (
              <div
                key={store.id}
                className="group relative rounded-3xl border-2 border-border/80 bg-card overflow-hidden shadow-xs hover:shadow-xl hover:border-primary/50 transition-all flex flex-col"
              >
                {/* Cover Image */}
                <div className="relative h-40 w-full overflow-hidden bg-muted">
                  {store.cover_url ? (
                    <Image
                      src={store.cover_url}
                      alt={store.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-primary/20 to-indigo-500/20 text-3xl">
                      📖
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Badges on Cover */}
                  <div className="absolute top-3 start-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-black/60 text-white border border-white/20">
                      {store.store_type === 'OFFLINE'
                        ? lang === 'ar' ? '🏬 فرع فعلي' : 'Physical Store'
                        : store.store_type === 'ONLINE'
                        ? lang === 'ar' ? '🌐 متجر أونلاين' : 'Online Store'
                        : lang === 'ar' ? '🏬 فرع وموقع' : 'Physical & Online'}
                    </span>
                  </div>

                  {store.offers_count && store.offers_count > 0 ? (
                    <div className="absolute top-3 end-3">
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black backdrop-blur-md bg-amber-500/90 text-white border border-amber-400 flex items-center gap-1">
                        <Flame className="h-3 w-3 fill-white" />
                        {lang === 'ar' ? `${store.offers_count} عروض نشطة` : `${store.offers_count} Active Deals`}
                      </span>
                    </div>
                  ) : null}

                  {/* Logo Avatar pinned at bottom of cover */}
                  <div className="absolute -bottom-5 start-5 h-14 w-14 rounded-2xl overflow-hidden border-3 border-card bg-card shadow-md">
                    {store.logo_url ? (
                      <Image src={store.logo_url} alt="" fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center font-black text-primary text-xl">
                        {store.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 pt-8 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        <span>{lang === 'ar' && store.name_ar ? store.name_ar : store.name}</span>
                        {store.is_verified && (
                          <CheckCircle2 className="h-4 w-4 text-primary fill-primary/20 shrink-0" />
                        )}
                      </h3>

                      <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        <span>{store.rating_average}</span>
                        <span className="text-[10px] text-muted-foreground">({store.rating_count})</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {lang === 'ar' && store.description_ar ? store.description_ar : store.description}
                    </p>

                    {store.address && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/90 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{store.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats Bar & Action */}
                  <div className="pt-3 border-t border-border/60 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                        <span>{store.total_listings} {lang === 'ar' ? 'كتاب معروض' : 'books listed'}</span>
                      </span>

                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{store.follower_count} {lang === 'ar' ? 'متابع' : 'followers'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        variant={isFollowing ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={e => handleFollowToggle(e, store.id)}
                        className="rounded-xl font-bold text-xs flex-1 cursor-pointer"
                      >
                        {isFollowing
                          ? lang === 'ar' ? '✓ تتابع المتجر' : '✓ Following'
                          : lang === 'ar' ? '+ متابعة' : '+ Follow'}
                      </Button>

                      <Link href={`/stores/${store.slug}`} className="flex-1">
                        <Button
                          size="sm"
                          className="w-full rounded-xl font-black text-xs gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>{lang === 'ar' ? 'زيارة المتجر' : 'Visit Store'}</span>
                          <ArrowRight className={cn('h-3.5 w-3.5', isRTL && 'rotate-180')} />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty state */}
        {filteredStores.length === 0 && (
          <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-border/80 bg-muted/10 space-y-3">
            <div className="text-5xl">🏬</div>
            <h3 className="text-lg font-bold text-foreground">
              {lang === 'ar' ? 'لم يتم العثور على مكتبات مطابقة لبحثك' : 'No bookstores match your search'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {lang === 'ar'
                ? 'جرب البحث بكلمات مختلفة أو إزالة الفلاتر لعرض كافة المكتبات المتاحة.'
                : 'Try adjusting your filters or search keywords to see all bookstores.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedType('ALL')
                setSearchQuery('')
              }}
              className="rounded-xl font-bold text-xs"
            >
              {lang === 'ar' ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
            </Button>
          </div>
        )}

        {/* Bookstore Owner Partner CTA Banner */}
        <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-r from-primary/10 via-indigo-500/10 to-violet-500/10 p-6 sm:p-10 relative overflow-hidden">
          <div className="max-w-2xl space-y-3 relative z-10">
            <Badge className="bg-primary text-primary-foreground font-bold text-xs">
              {lang === 'ar' ? 'شركاء ورق كونكت 🤝' : 'WaraqConnect Partners 🤝'}
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">
              {lang === 'ar'
                ? 'هل تمتلك مكتبة أو صفحة لبيع الكتب في مصر؟'
                : 'Do you own a bookstore or book-selling page in Egypt?'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {lang === 'ar'
                ? 'انضم إلى شبكة WaraqConnect واعرض عروض الحزم (10، 20، 25 كتاب مع هدايا)، وفعاليات توقيع الكتب أمام أكثر من 50,000 قارئ نشط في كافة المحافظات مع شارة توثيق رسمية.'
                : 'Join WaraqConnect to promote your bundle packages, in-store signings, and literary sales directly to thousands of active book lovers nationwide.'}
            </p>
            <div className="pt-2">
              <a
                href="https://wa.me/201556252658?text=مرحباً، أود تسجيل مكتبتي على منصة WaraqConnect"
                target="_blank"
                rel="noreferrer"
              >
                <Button className="rounded-2xl font-black text-xs gap-2 shadow-md shadow-primary/25 cursor-pointer">
                  <span>{lang === 'ar' ? 'سجّل مكتبتك وتواصل معنا عبر واتساب' : 'Register Your Store on WhatsApp'}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
