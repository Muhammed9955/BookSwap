'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Store,
  MapPin,
  Star,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  Flame,
  Gift,
  Share2,
  Copy,
  ExternalLink,
  MessageCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { cn, formatPrice } from '@/lib/utils'
import { toggleStoreFollow, rsvpEvent } from '@/lib/stores/store-service'
import type { Bookstore, StoreOffer, StoreEvent, RSVPStatus } from '@/types/store'

interface StoreDetailClientProps {
  store: Bookstore
  offers: StoreOffer[]
  events: StoreEvent[]
  currentUserId?: string | null
}

type TabType = 'offers' | 'events' | 'about'

export function StoreDetailClient({
  store,
  offers,
  events,
  currentUserId,
}: StoreDetailClientProps) {
  const { lang, isRTL } = useLanguage()
  const [activeTab, setActiveTab] = useState<TabType>('offers')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(store.follower_count)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [rsvps, setRsvps] = useState<Record<string, RSVPStatus>>({})

  const handleFollowToggle = async () => {
    if (!currentUserId) {
      alert(lang === 'ar' ? 'يرجى تسجيل الدخول أولاً لمتابعة المتجر' : 'Please log in to follow this store')
      return
    }

    const nextState = !isFollowing
    setIsFollowing(nextState)
    setFollowerCount(prev => (nextState ? prev + 1 : Math.max(0, prev - 1)))

    try {
      await toggleStoreFollow(store.id, currentUserId)
    } catch {
      setIsFollowing(!nextState)
      setFollowerCount(prev => (nextState ? Math.max(0, prev - 1) : prev + 1))
    }
  }

  const handleCopyPromo = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2500)
  }

  const handleRsvp = async (eventId: string, status: RSVPStatus) => {
    if (!currentUserId) {
      alert(lang === 'ar' ? 'يرجى تسجيل الدخول لتسجيل الحضور' : 'Please log in to RSVP')
      return
    }
    setRsvps(prev => ({ ...prev, [eventId]: status }))
    await rsvpEvent(eventId, currentUserId, status)
  }

  const storeName = lang === 'ar' && store.name_ar ? store.name_ar : store.name
  const storeDesc = lang === 'ar' && store.description_ar ? store.description_ar : store.description

  return (
    <MainLayout>
      {/* Cover & Hero Section */}
      <div className="relative">
        <div className="relative h-56 sm:h-80 w-full overflow-hidden bg-muted">
          {store.cover_url ? (
            <Image src={store.cover_url} alt={store.name} fill className="object-cover" priority />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-primary/30 to-violet-500/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        {/* Store Header Card */}
        <div className="page-container relative -mt-20 sm:-mt-24 z-10">
          <div className="rounded-3xl border-2 border-border/80 bg-card p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              {/* Logo & Basic Info */}
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border-4 border-card bg-card shadow-lg shrink-0">
                  {store.logo_url ? (
                    <Image src={store.logo_url} alt="" fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-black text-2xl text-primary bg-primary/10">
                      {store.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                      {storeName}
                    </h1>
                    {store.is_verified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-primary/15 text-primary border border-primary/30">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {lang === 'ar' ? 'مكتبة موثقة' : 'Verified Store'}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 max-w-xl">
                    {storeDesc}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      <span>{store.rating_average}</span>
                      <span className="text-[10px] text-muted-foreground">({store.rating_count} {lang === 'ar' ? 'تقييم' : 'reviews'})</span>
                    </div>

                    <span className="flex items-center gap-1 font-semibold">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span>{followerCount} {lang === 'ar' ? 'متابع' : 'followers'}</span>
                    </span>

                    {store.address && (
                      <span className="flex items-center gap-1 font-semibold truncate max-w-xs">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{store.address}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions: Follow & Contact Buttons */}
              <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                <Button
                  onClick={handleFollowToggle}
                  variant={isFollowing ? 'secondary' : 'default'}
                  className="rounded-xl font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
                >
                  <Users className="h-4 w-4" />
                  {isFollowing
                    ? lang === 'ar' ? '✓ تتابع المتجر' : '✓ Following'
                    : lang === 'ar' ? '+ متابعة المتجر' : '+ Follow Store'}
                </Button>

                {store.social_links?.whatsapp && (
                  <a
                    href={`https://wa.me/${store.social_links.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      lang === 'ar'
                        ? `مرحباً، أود الاستفسار عن عروض الكتب من ${storeName} عبر منصة BookSwap`
                        : `Hello, I'd like to ask about book offers from ${storeName} via BookSwap`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button
                      variant="outline"
                      className="w-full rounded-xl font-bold text-xs gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{lang === 'ar' ? 'تواصل واتساب' : 'WhatsApp'}</span>
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-t border-border/80 pt-4 overflow-x-auto">
              {[
                {
                  id: 'offers',
                  labelAr: `عروض وحزم التوفير (${offers.length}) 🔥`,
                  labelEn: `Bundle Deals & Offers (${offers.length}) 🔥`,
                  icon: Flame,
                },
                {
                  id: 'events',
                  labelAr: `الفعاليات وتوقيع الكتب (${events.length}) 📅`,
                  labelEn: `Events & Signings (${events.length}) 📅`,
                  icon: Calendar,
                },
                {
                  id: 'about',
                  labelAr: 'عن المكتبة والموقع ℹ️',
                  labelEn: 'About & Location ℹ️',
                  icon: Store,
                },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="page-container py-10 max-w-5xl">
        {/* TAB 1: OFFERS & BUNDLE PACKAGES */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
                  {lang === 'ar' ? 'باقات وحزم التوفير الحصرية' : 'Exclusive Bundles & Packages'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'ar'
                    ? 'عروض حزم الكتب (10، 20، 25 كتاب) بخصومات ضخمة وهدايا فواصل ومفكرات قراءة مجانية'
                    : 'Curated book bundles (10, 20, 25 books packages) with discounts & free reader gifts'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {offers.map(offer => {
                const offerTitle = lang === 'ar' && offer.title_ar ? offer.title_ar : offer.title
                const offerDesc = lang === 'ar' && offer.description_ar ? offer.description_ar : offer.description

                return (
                  <div
                    key={offer.id}
                    className="group rounded-3xl border-2 border-border/80 bg-card overflow-hidden shadow-xs hover:shadow-xl hover:border-primary/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Offer Cover */}
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

                        {/* Badges on cover */}
                        <div className="absolute top-3 start-3 flex items-center gap-1.5">
                          {offer.discount_pct && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-red-600 text-white shadow-md">
                              %{offer.discount_pct} {lang === 'ar' ? 'خصم' : 'OFF'}
                            </span>
                          )}
                          {offer.bundle_buy_qty && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black backdrop-blur-md bg-black/60 text-white border border-white/20">
                              {lang === 'ar' ? `حزمة ${offer.bundle_buy_qty} كتب` : `${offer.bundle_buy_qty}-Book Bundle`}
                            </span>
                          )}
                        </div>

                        {/* Bundle Price Tag pinned at bottom */}
                        {offer.bundle_price && (
                          <div className="absolute bottom-3 end-3 px-3 py-1.5 rounded-2xl backdrop-blur-md bg-white/95 dark:bg-slate-900/95 shadow-lg border border-border">
                            <span className="text-xs text-muted-foreground block leading-none font-semibold">
                              {lang === 'ar' ? 'سعر الحزمة:' : 'Bundle Price:'}
                            </span>
                            <span className="text-base font-black text-primary">
                              {formatPrice(offer.bundle_price)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors leading-snug">
                          {offerTitle}
                        </h3>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {offerDesc}
                        </p>

                        {/* Free Gift Alert */}
                        {offer.gift_description && (
                          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                            <Gift className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div>
                              <span className="font-black block">{lang === 'ar' ? 'هدية مجانية مع العرض:' : 'Free Gift Included:'}</span>
                              <p className="text-[11px] font-semibold mt-0.5">{offer.gift_description}</p>
                            </div>
                          </div>
                        )}

                        {/* Promo Code Chip */}
                        {offer.promo_code && (
                          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/60 border border-border/80 text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-muted-foreground">
                              <span>{lang === 'ar' ? 'كود الخصم:' : 'Promo Code:'}</span>
                              <span className="font-mono text-primary font-black uppercase text-xs">{offer.promo_code}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyPromo(offer.promo_code!)}
                              className="h-7 px-2.5 font-bold text-[11px] gap-1 cursor-pointer"
                            >
                              <Copy className="h-3 w-3" />
                              {copiedCode === offer.promo_code
                                ? lang === 'ar' ? 'تم النسخ!' : 'Copied!'
                                : lang === 'ar' ? 'نسخ' : 'Copy'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Action Button */}
                    <div className="p-5 pt-0">
                      {store.social_links?.whatsapp ? (
                        <a
                          href={`https://wa.me/${store.social_links.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            lang === 'ar'
                              ? `مرحباً، أود طلب "${offerTitle}" المعروض على منصة BookSwap بسعر ${offer.bundle_price ? `${offer.bundle_price} ج.م` : ''}`
                              : `Hello! I would like to order the "${offerTitle}" offer from BookSwap.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button className="w-full rounded-2xl font-black text-xs gap-2 shadow-md shadow-primary/20 cursor-pointer">
                            <MessageCircle className="h-4 w-4" />
                            <span>{lang === 'ar' ? 'اطلب العرض الآن عبر واتساب' : 'Order Bundle via WhatsApp'}</span>
                          </Button>
                        </a>
                      ) : (
                        <Button className="w-full rounded-2xl font-black text-xs gap-2 cursor-pointer">
                          <span>{lang === 'ar' ? 'طلب العرض' : 'Order Offer'}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {offers.length === 0 && (
              <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-border/80 bg-muted/10 space-y-3">
                <div className="text-5xl">🎁</div>
                <h3 className="text-lg font-bold text-foreground">
                  {lang === 'ar' ? 'لا توجد عروض نشطة حالياً' : 'No active offers right now'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {lang === 'ar'
                    ? 'تابع المتجر ليصلك إشعار فوري عند نشر باقات أو خصومات جديدة.'
                    : 'Follow this bookstore to receive notifications when new offers drop.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STORE EVENTS & SIGNINGS */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {lang === 'ar' ? 'الفعاليات الأدبية وتوقيع الكتب' : 'Literary Events & Signings'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'ar'
                    ? 'حفلات توقيع الكتّاب، حلقات النقاش، وأمسيات القراءة المنظمة في المتجر'
                    : 'Author signings, book club circles, and reading evenings hosted by the store'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {events.map(event => {
                const eventTitle = lang === 'ar' && event.title_ar ? event.title_ar : event.title
                const eventDesc = lang === 'ar' && event.description_ar ? event.description_ar : event.description
                const userStatus = rsvps[event.id]

                return (
                  <div
                    key={event.id}
                    className="rounded-3xl border-2 border-border/80 bg-card p-5 sm:p-6 shadow-xs hover:border-primary/40 transition-all flex flex-col md:flex-row gap-6"
                  >
                    {/* Event image */}
                    {event.cover_image_url && (
                      <div className="relative h-44 md:h-auto md:w-56 rounded-2xl overflow-hidden bg-muted shrink-0">
                        <Image src={event.cover_image_url} alt="" fill className="object-cover" />
                        <div className="absolute top-2 start-2">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-black/70 text-white">
                            {event.is_free ? (lang === 'ar' ? 'دخول مجاني' : 'Free Entry') : `${event.price} EGP`}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex-1 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="font-bold text-xs border-primary/30 text-primary">
                            {event.event_type}
                          </Badge>
                          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(event.starts_at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-foreground">{eventTitle}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{eventDesc}</p>

                        {event.location && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                            <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>

                      {/* RSVP Buttons */}
                      <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-primary" />
                          <span>
                            {event.current_attendees} {lang === 'ar' ? 'قارئ أكدوا الحضور' : 'readers confirmed RSVP'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={userStatus === 'GOING' ? 'default' : 'outline'}
                            onClick={() => handleRsvp(event.id, 'GOING')}
                            className="rounded-xl font-bold text-xs gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {userStatus === 'GOING'
                              ? lang === 'ar' ? '✓ سأحضر مؤكد' : '✓ Going'
                              : lang === 'ar' ? 'سأحضر' : 'Going'}
                          </Button>

                          <Button
                            size="sm"
                            variant={userStatus === 'MAYBE' ? 'secondary' : 'ghost'}
                            onClick={() => handleRsvp(event.id, 'MAYBE')}
                            className="rounded-xl font-bold text-xs cursor-pointer"
                          >
                            {lang === 'ar' ? 'ربما' : 'Interested'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {events.length === 0 && (
              <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-border/80 bg-muted/10 space-y-3">
                <div className="text-5xl">📅</div>
                <h3 className="text-lg font-bold text-foreground">
                  {lang === 'ar' ? 'لا توجد فعاليات قادمة حالياً' : 'No upcoming events right now'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {lang === 'ar'
                    ? 'تابع المتجر ليصلك إشعار بالفعاليات وحفلات التوقيع القادمة فور إعلانها.'
                    : 'Follow this bookstore to receive notifications when new events are scheduled.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ABOUT & LOCATION */}
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* About Card */}
            <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-4">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                {lang === 'ar' ? 'نبذة عن المكتبة' : 'About the Bookstore'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {storeDesc}
              </p>

              {store.social_links && (
                <div className="pt-3 border-t border-border/60 space-y-2">
                  <span className="text-xs font-black text-muted-foreground block">
                    {lang === 'ar' ? 'وسائل التواصل الرسمية:' : 'Official Social Links:'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {store.social_links.facebook && (
                      <a href={store.social_links.facebook} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1.5">
                          <span>فيسبوك Facebook</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    )}
                    {store.social_links.instagram && (
                      <a href={store.social_links.instagram} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1.5">
                          <span>إنستغرام Instagram</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Opening Hours & Location Card */}
            <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-4">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {lang === 'ar' ? 'مواعيد العمل والعنوان' : 'Hours & Location'}
              </h3>

              {store.address && (
                <div className="flex items-start gap-2.5 bg-muted/40 p-3.5 rounded-2xl border border-border/60">
                  <MapPin className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      {lang === 'ar' ? 'العنوان الفعلي:' : 'Physical Address:'}
                    </span>
                    <p className="text-xs font-bold text-foreground mt-0.5">{store.address}</p>
                    {store.latitude && store.longitude && (
                      <a
                        href={`https://maps.google.com/?q=${store.latitude},${store.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-black text-primary hover:underline mt-1.5"
                      >
                        <span>{lang === 'ar' ? 'عرض على خرائط Google' : 'Open in Google Maps'}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {store.opening_hours && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-black text-muted-foreground block">
                    {lang === 'ar' ? 'ساعات استقبال القراء:' : 'Working Hours:'}
                  </span>
                  <div className="divide-y divide-border/60 rounded-2xl border border-border/60 overflow-hidden bg-muted/20">
                    {Object.entries(store.opening_hours).map(([days, hours]) => (
                      <div key={days} className="flex items-center justify-between p-3 text-xs">
                        <span className="font-bold text-foreground">{days}</span>
                        <span className="font-semibold text-muted-foreground">{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
