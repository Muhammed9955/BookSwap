'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Store,
  ExternalLink,
  Sparkles,
  Search,
  Share2,
  Phone,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { cn } from '@/lib/utils'
import { rsvpEvent } from '@/lib/stores/store-service'
import type { StoreEvent, StoreEventType, RSVPStatus } from '@/types/store'

interface EventsHubClientProps {
  initialEvents: StoreEvent[]
  currentUserId?: string | null
}

export function EventsHubClient({ initialEvents, currentUserId }: EventsHubClientProps) {
  const { lang, isRTL } = useLanguage()
  const [events] = useState<StoreEvent[]>(initialEvents)
  const [selectedType, setSelectedType] = useState<StoreEventType | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [rsvps, setRsvps] = useState<Record<string, RSVPStatus>>({})

  const filteredEvents = events.filter(event => {
    if (selectedType !== 'ALL' && event.event_type !== selectedType) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const titleMatch =
        event.title.toLowerCase().includes(q) || (event.title_ar && event.title_ar.includes(q))
      const descMatch =
        event.description?.toLowerCase().includes(q) ||
        (event.description_ar && event.description_ar.includes(q))
      const locMatch = event.location?.toLowerCase().includes(q)
      if (!titleMatch && !descMatch && !locMatch) return false
    }
    return true
  })

  const handleRsvp = async (eventId: string, status: RSVPStatus) => {
    if (!currentUserId) {
      alert(lang === 'ar' ? 'يرجى تسجيل الدخول أولاً لتسجيل الحضور' : 'Please log in to RSVP')
      return
    }
    setRsvps(prev => ({ ...prev, [eventId]: status }))
    await rsvpEvent(eventId, currentUserId, status)
  }

  return (
    <MainLayout>
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background border-b border-border/80 pt-10 pb-12">
        <div className="page-container relative z-10">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black border border-primary/20">
              <Calendar className="h-4 w-4" />
              <span>{lang === 'ar' ? 'أجندة الفعاليات الثقافية' : 'Literary & Cultural Agenda'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
              {lang === 'ar' ? (
                <>
                  فعاليات القراءة، <span className="text-primary underline decoration-primary/30">حفلات التوقيع</span> وملتقيات تبادل الكتب
                </>
              ) : (
                <>
                  Book Gatherings, <span className="text-primary underline decoration-primary/30">Author Signings</span> & Swap Meetups
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {lang === 'ar'
                ? 'انضم إلى مجتمع القراء في القاهرة والإسكندرية والمحافظات: لقاءات مقاهي القراءة (سيلانترو المعادي، كورنيش الشاطبي)، ندوات مناقشة الروايات، وحفلات توقيع أحدث إصدارات الكتّاب.'
                : 'Connect with fellow readers across Egypt. Join weekend coffee & book exchange meetups, author signing ceremonies, and literary reading circles.'}
            </p>
          </div>
        </div>
      </section>

      {/* Filter and Content Area */}
      <div className="page-container py-8 space-y-8 max-w-5xl">
        {/* Coming Soon Notice Banner */}
        <div className="rounded-3xl border-2 border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-black text-xs">
                ⏳ {lang === 'ar' ? 'ميزة قادمة قريباً — معاينة تجريبية' : 'Coming Soon — Early Preview'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-foreground/85 font-medium leading-relaxed max-w-2xl">
              {lang === 'ar'
                ? 'أجندة الفعاليات الثقافية وحفلات التوقيع ستُفعل قريباً لتمكين منظمي نوادي القراءة من نشر فعالياتهم. يمكنك الآن الانضمام لمجتمعات القراءة المحلية ومبادلة الكتب معهم.'
                : 'The Cultural & Book Signing Agenda will launch soon. In the meantime, join local reader communities and meet fellow readers for safe book swaps.'}
            </p>
          </div>
          <Link href="/communities" className="shrink-0">
            <Button size="sm" className="font-bold text-xs rounded-xl shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white">
              {lang === 'ar' ? 'استكشف مجتمعات القراءة 👥' : 'Explore Communities 👥'}
            </Button>
          </Link>
        </div>

        {/* Controls Bar: Type Filter + Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-3xl bg-card border-2 border-border/80 shadow-xs">
          {/* Event Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
            {[
              { id: 'ALL', labelAr: 'الكل', labelEn: 'All' },
              { id: 'EXCHANGE', labelAr: 'تبادل كتب 🔄', labelEn: 'Book Swap 🔄' },
              { id: 'SIGNING', labelAr: 'حفلات توقيع ✍️', labelEn: 'Signings ✍️' },
              { id: 'DISCUSSION', labelAr: 'نوادي قراءة 🗣️', labelEn: 'Book Clubs 🗣️' },
              { id: 'SALE', labelAr: 'معارض وتصفيات 🏷️', labelEn: 'Fairs & Sales 🏷️' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id as StoreEventType | 'ALL')}
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
              placeholder={lang === 'ar' ? 'ابحث في الفعاليات أو الموقع...' : 'Search events or location...'}
              className={cn(
                'w-full py-2 text-xs font-bold rounded-2xl bg-muted/40 border border-border/80 focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all',
                isRTL ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
              )}
            />
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.map(event => {
            const eventTitle = lang === 'ar' && event.title_ar ? event.title_ar : event.title
            const eventDesc = lang === 'ar' && event.description_ar ? event.description_ar : event.description
            const store = event.store
            const userStatus = rsvps[event.id]

            return (
              <div
                key={event.id}
                className="group rounded-3xl border-2 border-border/80 bg-card p-5 sm:p-6 shadow-xs hover:border-primary/50 transition-all flex flex-col md:flex-row gap-6"
              >
                {/* Event Cover Image - One Click to Store */}
                {event.cover_image_url && (
                  <div className="relative h-44 md:h-auto md:w-60 rounded-2xl overflow-hidden bg-muted shrink-0">
                    <Link
                      href={store ? `/stores/${store.slug}` : '/stores'}
                      className="block absolute inset-0 cursor-pointer"
                      title={store ? (lang === 'ar' ? `زيارة صفحة ${store.name_ar || store.name}` : `Visit ${store.name}`) : undefined}
                    >
                      <Image
                        src={event.cover_image_url}
                        alt=""
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                    <div className="absolute top-2 start-2 pointer-events-none">
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-black/75 text-white border border-white/20">
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

                      {store && (
                        <Link
                          href={`/stores/${store.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Store className="h-3.5 w-3.5 text-primary" />
                          <span>{lang === 'ar' && store.name_ar ? store.name_ar : store.name}</span>
                        </Link>
                      )}

                      <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 ms-auto">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {new Date(event.starts_at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">
                      {eventTitle}
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {eventDesc}
                    </p>

                    {event.location && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold pt-1">
                        <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    {/* Host & Organizer Info */}
                    {event.host_name && (
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-muted/40 border border-border/80 text-xs mt-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-primary/10 text-primary text-sm">🎙️</span>
                          <div>
                            <p className="font-bold text-foreground text-xs">{event.host_name}</p>
                            {event.host_role && (
                              <p className="text-[11px] text-muted-foreground">{event.host_role}</p>
                            )}
                          </div>
                        </div>
                        {event.host_phone && (
                          <a
                            href={`https://wa.me/${event.host_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              lang === 'ar'
                                ? `مرحباً، أود الاستفسار بخصوص فعالية: ${eventTitle}`
                                : `Hello, I'd like to ask about the event: ${eventTitle}`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-bold text-[11px] transition-colors"
                          >
                            <Phone className="h-3 w-3" />
                            <span>{lang === 'ar' ? 'تواصل مع المنسق' : 'Contact Host'}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions & RSVP */}
                  <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-primary" />
                      <span>
                        {event.current_attendees} {lang === 'ar' ? 'قارئ أكدوا الحضور' : 'confirmed RSVPs'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={userStatus === 'GOING' ? 'default' : 'outline'}
                        onClick={() => handleRsvp(event.id, 'GOING')}
                        className="rounded-xl font-bold text-xs gap-1.5 cursor-pointer shadow-xs"
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

        {/* Empty state */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-border/80 bg-muted/10 space-y-3">
            <div className="text-5xl">📅</div>
            <h3 className="text-lg font-bold text-foreground">
              {lang === 'ar' ? 'لم يتم العثور على فعاليات مطابقة' : 'No matching events found'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {lang === 'ar'
                ? 'جرب اختيار فئة أخرى أو إزالة كلمة البحث لعرض كافة الفعاليات.'
                : 'Try adjusting your filters or search keywords to see all events.'}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
