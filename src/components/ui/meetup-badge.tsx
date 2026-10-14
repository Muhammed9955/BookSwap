'use client'

import React from 'react'
import { MapPin, Building2, Truck, Clock, Calendar, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MeetupInfo {
  location?: string | null
  deliveryMethod?: 'MEETUP' | 'COMMUNITY_HUB' | 'COURIER' | string | null
  times?: Array<{ label: string; iso?: string }> | string[] | null
  at?: string | null
  isConfirmed?: boolean
}

interface MeetupDetailBadgeProps {
  meetup: MeetupInfo | null | undefined
  lang?: 'ar' | 'en'
  className?: string
  compact?: boolean
}

export function MeetupDetailBadge({
  meetup,
  lang = 'ar',
  className,
  compact = false,
}: MeetupDetailBadgeProps) {
  if (!meetup) return null
  if (!meetup.location && (!meetup.times || meetup.times.length === 0) && !meetup.at && !meetup.deliveryMethod) {
    return null
  }

  const deliveryMethod = meetup.deliveryMethod || 'MEETUP'
  const isConfirmed = Boolean(meetup.isConfirmed || meetup.at)

  const getMethodDetails = () => {
    switch (deliveryMethod) {
      case 'COMMUNITY_HUB':
        return {
          icon: Building2,
          labelAr: 'استلام من نقطة مجتمعية (Community Hub)',
          labelEn: 'Community Hub Pickup',
          badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        }
      case 'COURIER':
        return {
          icon: Truck,
          labelAr: 'توصيل عبر شركة شحن',
          labelEn: 'Courier Delivery',
          badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        }
      default:
        return {
          icon: MapPin,
          labelAr: 'مقابلة شخصية لتسليم الكتاب',
          labelEn: 'In-Person Handover',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        }
    }
  }

  const method = getMethodDetails()
  const MethodIcon = method.icon

  // Format times list
  const formattedTimes: string[] = []
  if (meetup.at) {
    formattedTimes.push(
      new Date(meetup.at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    )
  } else if (meetup.times && Array.isArray(meetup.times)) {
    meetup.times.forEach(t => {
      if (typeof t === 'string') formattedTimes.push(t)
      else if (t?.label) formattedTimes.push(t.label)
    })
  }

  if (compact) {
    return (
      <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border', method.badgeClass, className)}>
        <MethodIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate max-w-[200px]">
          {meetup.location || (lang === 'ar' ? method.labelAr : method.labelEn)}
        </span>
        {formattedTimes.length > 0 && (
          <span className="opacity-75 font-normal">
            • {formattedTimes[0]}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-2xl border p-3.5 bg-gradient-to-br from-card to-muted/20 space-y-2 text-xs',
        isConfirmed
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-border/80',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-black text-foreground">
          <MethodIcon className="h-4 w-4 text-primary" />
          <span>{lang === 'ar' ? 'تفاصيل موعد ومكان التسليم:' : 'Meetup & Delivery Details:'}</span>
        </div>

        {isConfirmed ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" />
            {lang === 'ar' ? 'موعد ومكان مؤكد ✅' : 'Confirmed Handover ✅'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <Clock className="h-3 w-3" />
            {lang === 'ar' ? 'مقترح من مقدم الطلب' : 'Proposed by Buyer'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
        {meetup.location && (
          <div className="flex items-start gap-2 bg-background/80 p-2 rounded-xl border border-border/60">
            <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground block font-semibold">
                {lang === 'ar' ? 'نقطة الالتقاء المقترحة' : 'Proposed Meetup Spot'}
              </span>
              <p className="font-bold text-foreground text-xs truncate">
                {meetup.location}
              </p>
            </div>
          </div>
        )}

        {formattedTimes.length > 0 && (
          <div className="flex items-start gap-2 bg-background/80 p-2 rounded-xl border border-border/60">
            <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground block font-semibold">
                {lang === 'ar' ? 'الأوقات المقترحة' : 'Available Times'}
              </span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {formattedTimes.map((time, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[10px]"
                  >
                    {time}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
