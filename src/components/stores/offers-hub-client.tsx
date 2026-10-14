'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Flame,
  Gift,
  Copy,
  MessageCircle,
  Tag,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  Store,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { cn, formatPrice } from '@/lib/utils'
import type { StoreOffer, OfferType } from '@/types/store'

interface OffersHubClientProps {
  initialOffers: StoreOffer[]
}

export function OffersHubClient({ initialOffers }: OffersHubClientProps) {
  const { lang, isRTL } = useLanguage()
  const [offers] = useState<StoreOffer[]>(initialOffers)
  const [selectedType, setSelectedType] = useState<OfferType | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const filteredOffers = offers.filter(offer => {
    if (selectedType !== 'ALL' && offer.offer_type !== selectedType) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const titleMatch =
        offer.title.toLowerCase().includes(q) || (offer.title_ar && offer.title_ar.includes(q))
      const descMatch =
        offer.description?.toLowerCase().includes(q) ||
        (offer.description_ar && offer.description_ar.includes(q))
      const giftMatch = offer.gift_description?.toLowerCase().includes(q)
      if (!titleMatch && !descMatch && !giftMatch) return false
    }
    return true
  })

  const handleCopyPromo = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2500)
  }

  return (
    <MainLayout>
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-background to-background border-b border-border/80 pt-10 pb-12">
        <div className="page-container relative z-10">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-black border border-amber-500/20">
              <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span>{lang === 'ar' ? 'سوق الحزم والعروض المخفضة' : 'Book Packages & Flash Deals'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
              {lang === 'ar' ? (
                <>
                  باقات وحزم الكتب: <span className="text-primary underline decoration-primary/30">10، 20، 25 كتاب</span> مع هدايا وفواصل فاخرة
                </>
              ) : (
                <>
                  Book Packages: <span className="text-primary underline decoration-primary/30">10, 20, 25 Books</span> with Free Gifts & Bookmarks
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {lang === 'ar'
                ? 'استمتع بأقوى العروض المجمعة من كبرى المكتبات الشريكة وصفحات بيع الكتب في مصر. حزم روايات متنوعة، مجموعات تطوير الذات، وتصفيات بخصومات تصل إلى 60% مع هدايا قراءة مجانية.'
                : 'Browse curated bulk packages (10, 20, 25 books bundles), clearance sales, and seasonal discounts from verified Egyptian bookstores and book boutiques.'}
            </p>
          </div>
        </div>
      </section>

      {/* Filter and Content Area */}
      <div className="page-container py-8 space-y-8 max-w-6xl">
        {/* Coming Soon Notice Banner */}
        <div className="rounded-3xl border-2 border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-700 dark:text-orange-400 font-black text-xs">
                ⏳ {lang === 'ar' ? 'ميزة قادمة قريباً — معاينة تجريبية' : 'Coming Soon — Early Preview'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-foreground/85 font-medium leading-relaxed max-w-2xl">
              {lang === 'ar'
                ? 'نعمل مع شركائنا من دور النشر والمكتبات لإطلاق حزم التخفيضات الكبرى. حالياً يمكنك استكشاف آلاف الكتب المعروضة بأسعار رمزية أو للمبادلة المجانية مباشرة من القراء.'
                : 'We are partnering with publishers and bookstores for major discount bundles. In the meantime, browse thousands of books available for direct peer-to-peer swap or affordable purchase.'}
            </p>
          </div>
          <Link href="/explore" className="shrink-0">
            <Button size="sm" className="font-bold text-xs rounded-xl shadow-xs bg-orange-600 hover:bg-orange-700 text-white">
              {lang === 'ar' ? 'تصفح كتب القراء المخفضة 📚' : 'Explore Reader Deals 📚'}
            </Button>
          </Link>
        </div>

        {/* Controls Bar: Type Filter + Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-3xl bg-card border-2 border-border/80 shadow-xs">
          {/* Offer Type Tabs */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
            {[
              { id: 'ALL', labelAr: 'كافة العروض', labelEn: 'All Deals' },
              { id: 'BUNDLE', labelAr: 'حزم وباقات الكتب (10-25) 📦', labelEn: 'Book Bundles (10-25) 📦' },
              { id: 'DISCOUNT', labelAr: 'خصومات فورية 🏷️', labelEn: 'Discounts 🏷️' },
              { id: 'CLEARANCE', labelAr: 'تصفيات كبرى ⚡', labelEn: 'Clearance ⚡' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id as OfferType | 'ALL')}
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
          <div className="relative flex-1 max-w-xs">
            <Search className={cn('absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground', isRTL ? 'right-3' : 'left-3')} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'ar' ? 'ابحث في العروض والهدايا...' : 'Search offers or gifts...'}
              className={cn(
                'w-full py-2 text-xs font-bold rounded-2xl bg-muted/40 border border-border/80 focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all',
                isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
              )}
            />
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map(offer => {
            const offerTitle = lang === 'ar' && offer.title_ar ? offer.title_ar : offer.title
            const offerDesc = lang === 'ar' && offer.description_ar ? offer.description_ar : offer.description
            const store = offer.store

            return (
              <div
                key={offer.id}
                className="group rounded-3xl border-2 border-border/80 bg-card overflow-hidden shadow-xs hover:shadow-xl hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Cover */}
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    {offer.cover_image_url ? (
                      <Image
                        src={offer.cover_image_url}
                        alt=""
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-tr from-amber-500/20 to-primary/20 flex items-center justify-center text-4xl">
                        📚
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 start-3 flex items-center gap-1.5">
                      {offer.discount_pct && (
                        <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-red-600 text-white shadow-md">
                          %{offer.discount_pct} {lang === 'ar' ? 'خصم' : 'OFF'}
                        </span>
                      )}
                      {offer.bundle_buy_qty && (
                        <span className="px-2.5 py-1 rounded-xl text-xs font-black backdrop-blur-md bg-black/60 text-white border border-white/20">
                          {lang === 'ar' ? `حزمة ${offer.bundle_buy_qty} كتب` : `${offer.bundle_buy_qty} Books`}
                        </span>
                      )}
                    </div>

                    {/* Store Link Chip on Cover */}
                    {store && (
                      <Link
                        href={`/stores/${store.slug}`}
                        className="absolute bottom-3 start-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl backdrop-blur-md bg-black/70 text-white text-xs font-bold hover:bg-primary transition-colors border border-white/20"
                      >
                        <Store className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate max-w-[160px]">
                          {lang === 'ar' && store.name_ar ? store.name_ar : store.name}
                        </span>
                      </Link>
                    )}

                    {/* Bundle Price */}
                    {offer.bundle_price && (
                      <div className="absolute bottom-3 end-3 px-3 py-1 rounded-2xl backdrop-blur-md bg-white/95 dark:bg-slate-900/95 shadow-lg border border-border">
                        <span className="text-base font-black text-primary">
                          {formatPrice(offer.bundle_price)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                      {offerTitle}
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {offerDesc}
                    </p>

                    {/* Gift Notification */}
                    {offer.gift_description && (
                      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-2.5 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                        <Gift className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <span className="font-black block">{lang === 'ar' ? 'هدية مجانية:' : 'Gift:'}</span>
                          <p className="text-[11px] font-semibold">{offer.gift_description}</p>
                        </div>
                      </div>
                    )}

                    {/* Promo code */}
                    {offer.promo_code && (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/60 border border-border/80 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-muted-foreground">
                          <span>{lang === 'ar' ? 'الكود:' : 'Code:'}</span>
                          <span className="font-mono text-primary font-black uppercase text-xs">{offer.promo_code}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyPromo(offer.promo_code!)}
                          className="h-6 px-2 font-bold text-[10px] gap-1 cursor-pointer"
                        >
                          <Copy className="h-3 w-3" />
                          {copiedCode === offer.promo_code
                            ? lang === 'ar' ? 'تم!' : 'Copied!'
                            : lang === 'ar' ? 'نسخ' : 'Copy'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-5 pt-0">
                  {store?.social_links?.whatsapp ? (
                    <a
                      href={`https://wa.me/${store.social_links.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        lang === 'ar'
                          ? `مرحباً، أود طلب "${offerTitle}" من منصة وَرَق بسعر ${offer.bundle_price ? `${offer.bundle_price} ج.م` : ''}`
                          : `Hello! I would like to order the "${offerTitle}" offer from WARAQ.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button className="w-full rounded-2xl font-black text-xs gap-2 shadow-sm cursor-pointer">
                        <MessageCircle className="h-4 w-4" />
                        <span>{lang === 'ar' ? 'اطلب الحزمة عبر واتساب' : 'Order via WhatsApp'}</span>
                      </Button>
                    </a>
                  ) : store ? (
                    <Link href={`/stores/${store.slug}`}>
                      <Button className="w-full rounded-2xl font-black text-xs gap-2 cursor-pointer">
                        <span>{lang === 'ar' ? 'تفاصيل المتجر والعرض' : 'View Store Offer'}</span>
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty state */}
        {filteredOffers.length === 0 && (
          <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-border/80 bg-muted/10 space-y-3">
            <div className="text-5xl">🎁</div>
            <h3 className="text-lg font-bold text-foreground">
              {lang === 'ar' ? 'لم يتم العثور على عروض مطابقة' : 'No matching offers found'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {lang === 'ar'
                ? 'جرب اختيار قسم آخر أو مسح عبارة البحث لمشاهدة جميع حزم الكتب.'
                : 'Try adjusting your filter or search query to see all book packages.'}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
