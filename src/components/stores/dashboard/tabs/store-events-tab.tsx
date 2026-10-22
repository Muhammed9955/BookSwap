'use client'

import React from 'react'
import Image from 'next/image'
import {
  Calendar,
  PlusCircle,
  Clock,
  MapPin,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { StoreEvent } from '@/types/store'
import { useStoreEvents } from '../hooks/use-store-events'
import { AddEventModal } from '../components/add-event-modal'

interface StoreEventsTabProps {
  initialEvents: StoreEvent[]
  activeStoreId: string
  currentStoreId: string
  currentStoreAddress?: string
  lang: 'ar' | 'en'
}

export function StoreEventsTab({
  initialEvents,
  activeStoreId,
  currentStoreId,
  currentStoreAddress,
  lang,
}: StoreEventsTabProps) {
  const {
    events,
    isAddEventModalOpen,
    setIsAddEventModalOpen,
    newEvent,
    setNewEvent,
    isUploadingEventCover,
    handleEventCoverFileChange,
    handleAddEvent,
    handleDeleteEvent,
  } = useStoreEvents({
    initialEvents,
    activeStoreId,
    currentStoreId,
    currentStoreAddress,
    lang,
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-500" />
            <span>{lang === 'ar' ? 'إدارة فعاليات وحفلات توقيع المكتبة' : 'Events & Book Signings'}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lang === 'ar'
              ? 'نظّم أمسيات مناقشة الروايات، حفلات توقيع الكتاب، وأيام التخفيضات الكبرى وتتبع تأكيدات الحضور.'
              : 'Schedule author signings, novel circles, clearance fairs, and manage RSVPs.'}
          </p>
        </div>

        <Button
          onClick={() => setIsAddEventModalOpen(true)}
          className="rounded-2xl font-black text-xs gap-2 shadow-md shadow-indigo-500/25 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{lang === 'ar' ? 'إضافة فعالية جديدة 📅' : 'Add New Event 📅'}</span>
        </Button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map(ev => (
          <div
            key={ev.id}
            className="rounded-3xl border-2 border-border/80 bg-card overflow-hidden shadow-xs flex flex-col justify-between"
          >
            {/* Event Cover Image */}
            {ev.cover_image_url && (
              <div className="relative h-44 w-full bg-muted overflow-hidden">
                <Image src={ev.cover_image_url} alt="" fill className="object-cover" />
                <div className="absolute top-3 start-3">
                  <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-black/75 text-white border border-white/20">
                    {ev.is_free ? (lang === 'ar' ? 'دخول مجاني' : 'Free Entry') : `${ev.price} ج.م`}
                  </span>
                </div>
                <div className="absolute top-3 end-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="h-8 w-8 p-0 rounded-xl bg-black/60 text-white hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="p-5 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                    {ev.event_type}
                  </span>
                  {!ev.cover_image_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="h-8 w-8 p-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <h3 className="text-base font-black text-foreground">
                  {lang === 'ar' && ev.title_ar ? ev.title_ar : ev.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {lang === 'ar' && ev.description_ar ? ev.description_ar : ev.description}
                </p>

                <div className="space-y-1 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    <span>
                      {new Date(ev.starts_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {ev.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{ev.location}</span>
                    </div>
                  )}
                </div>

                {/* Event Host Pill */}
                {ev.host_name && (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/40 border border-border/80 text-xs mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🎙️</span>
                      <div>
                        <p className="font-bold text-foreground text-[11px]">{ev.host_name}</p>
                        {ev.host_role && (
                          <p className="text-[10px] text-muted-foreground">{ev.host_role}</p>
                        )}
                      </div>
                    </div>
                    {ev.host_phone && (
                      <span className="text-[10px] font-mono text-emerald-600 font-bold">
                        {ev.host_phone}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">
                  {ev.current_attendees} {lang === 'ar' ? 'أكدوا الحضور (RSVP)' : 'confirmed RSVPs'}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {ev.is_free ? (lang === 'ar' ? 'حضور مجاني' : 'Free Entry') : `${ev.price} ج.م`}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="p-12 text-center text-muted-foreground text-xs bg-card border-2 border-dashed border-border/80 rounded-3xl">
          {lang === 'ar' ? 'لا توجد فعاليات أو حفلات توقيع مجدولة حالياً.' : 'No scheduled events or signings yet.'}
        </div>
      )}

      {/* Modal: Add Event */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        newEvent={newEvent}
        setNewEvent={setNewEvent}
        isUploadingEventCover={isUploadingEventCover}
        onEventCoverFileChange={handleEventCoverFileChange}
        onSubmit={handleAddEvent}
        lang={lang}
      />
    </div>
  )
}
