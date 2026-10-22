'use client'

import React from 'react'
import Image from 'next/image'
import { Calendar, UploadCloud, ImageIcon, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { StoreEventType } from '@/types/store'

interface AddEventModalProps {
  isOpen: boolean
  onClose: () => void
  newEvent: {
    title: string
    title_ar: string
    description: string
    description_ar: string
    event_type: StoreEventType
    starts_at: string
    location: string
    is_free: boolean
    price: number
    host_name: string
    host_phone: string
    host_role: string
    max_attendees: number
    cover_image_url: string
  }
  setNewEvent: React.Dispatch<React.SetStateAction<any>>
  isUploadingEventCover?: boolean
  onEventCoverFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => void
  lang: 'ar' | 'en'
}

export function AddEventModal({
  isOpen,
  onClose,
  newEvent,
  setNewEvent,
  isUploadingEventCover = false,
  onEventCoverFileChange,
  onSubmit,
  lang,
}: AddEventModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="rounded-3xl border-2 border-border bg-card p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-black text-foreground text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-500" />
            <span>{lang === 'ar' ? 'جدولة فعالية أو حفل توقيع جديد' : 'Schedule Event / Signing'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Event Type */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'نوع الفعالية *' : 'Event Type *'}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'SIGNING' as StoreEventType, label: '✍️ حفل توقيع' },
                { id: 'DISCUSSION' as StoreEventType, label: '📖 مناقشة رواية' },
                { id: 'EXCHANGE' as StoreEventType, label: '☕ تبادل كتب' },
                { id: 'SALE' as StoreEventType, label: '🏷️ يوم خصومات' },
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setNewEvent((prev: any) => ({ ...prev, event_type: type.id }))}
                  className={cn(
                    'p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer',
                    newEvent.event_type === type.id
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black shadow-xs'
                      : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Titles */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'عنوان الفعالية *' : 'Event Title *'}</label>
            <input
              type="text"
              required
              value={newEvent.title_ar}
              onChange={e => setNewEvent((prev: any) => ({ ...prev, title_ar: e.target.value, title: e.target.value }))}
              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-indigo-500"
              placeholder={lang === 'ar' ? 'مثال: حفل توقيع رواية موسم صيد الغزلان بحضور الكاتب' : 'e.g. Author Signing Night'}
            />
          </div>

          {/* Host info */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'اسم الكاتب / الضيف المتحدث' : 'Guest Speaker / Author'}</label>
                <input
                  type="text"
                  value={newEvent.host_name}
                  onChange={e => setNewEvent((prev: any) => ({ ...prev, host_name: e.target.value }))}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-indigo-500"
                  placeholder="أحمد مراد"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'صفة الضيف' : 'Guest Role / Title'}</label>
                <input
                  type="text"
                  value={newEvent.host_role}
                  onChange={e => setNewEvent((prev: any) => ({ ...prev, host_role: e.target.value }))}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-indigo-500"
                  placeholder="الروائي والسيناريست"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'رقم هاتف المنسق للتواصل' : 'Coordinator Phone'}</label>
              <input
                type="tel"
                value={newEvent.host_phone}
                onChange={e => setNewEvent((prev: any) => ({ ...prev, host_phone: e.target.value }))}
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-indigo-500"
                placeholder="01012345678"
              />
            </div>
          </div>

          {/* Date, Time & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'موعد وتوقيت البدء *' : 'Start Date & Time *'}</label>
              <input
                type="datetime-local"
                required
                value={newEvent.starts_at}
                onChange={e => setNewEvent((prev: any) => ({ ...prev, starts_at: e.target.value }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'مكان إقامة الفعالية *' : 'Event Location *'}</label>
              <input
                type="text"
                required
                value={newEvent.location}
                onChange={e => setNewEvent((prev: any) => ({ ...prev, location: e.target.value }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-indigo-500"
                placeholder={lang === 'ar' ? 'فرع الزمالك - صالة القراءة' : 'Store branch address'}
              />
            </div>
          </div>

          {/* Attendees Capacity & Entry Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'الحد الأقصى للحضور (المقاعد)' : 'Max Attendees'}</label>
              <input
                type="number"
                min={5}
                max={500}
                value={newEvent.max_attendees}
                onChange={e => setNewEvent((prev: any) => ({ ...prev, max_attendees: Number(e.target.value) }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-indigo-500"
                placeholder="50"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'رسوم الدخول' : 'Entry Fee'}</label>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEvent.is_free}
                    onChange={e => setNewEvent((prev: any) => ({ ...prev, is_free: e.target.checked }))}
                    className="rounded"
                  />
                  <span>{lang === 'ar' ? 'دخول مجاني' : 'Free Entry'}</span>
                </label>
              </div>
              <input
                type="number"
                disabled={newEvent.is_free}
                value={newEvent.is_free ? 0 : newEvent.price}
                onChange={e => setNewEvent((prev: any) => ({ ...prev, price: Number(e.target.value) }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                placeholder="50"
              />
            </div>
          </div>

          {/* Cover image: Upload from device or direct URL */}
          <div className="space-y-2.5 rounded-2xl border border-border bg-muted/20 p-3.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-indigo-500" />
                <span>{lang === 'ar' ? 'بوستر / صورة غلاف الفعالية' : 'Event Poster / Cover Image'}</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {lang === 'ar' ? 'ارفع من جهازك أو ضع رابط صورة مباشر' : 'Upload or enter direct image URL'}
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={cn(
                  'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-indigo-500/30 hover:border-indigo-500 bg-card text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer transition-colors shadow-xs text-center',
                  isUploadingEventCover && 'opacity-50 pointer-events-none'
                )}
              >
                {isUploadingEventCover ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                    <span>{lang === 'ar' ? 'جاري رفع البوستر...' : 'Uploading poster...'}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 text-indigo-500" />
                    <span>{lang === 'ar' ? 'رفع بوستر من جهازك 📷' : 'Upload from device 📷'}</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingEventCover}
                  onChange={onEventCoverFileChange}
                />
              </label>

              <div>
                <input
                  type="url"
                  value={newEvent.cover_image_url}
                  onChange={e => setNewEvent((prev: any) => ({ ...prev, cover_image_url: e.target.value }))}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-indigo-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Poster Preview & Clear */}
            {newEvent.cover_image_url && (
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-20 rounded-lg overflow-hidden bg-muted shrink-0 border border-border shadow-xs">
                    <Image src={newEvent.cover_image_url} alt="" fill unoptimized className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground">
                      {lang === 'ar' ? 'معاينة بوستر الفعالية' : 'Event Poster Preview'}
                    </p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px]">
                      {newEvent.cover_image_url}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setNewEvent((prev: any) => ({ ...prev, cover_image_url: '' }))}
                  className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 me-1" />
                  <span>{lang === 'ar' ? 'إزالة' : 'Remove'}</span>
                </Button>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'وصف ومحاور الفعالية' : 'Event Description'}</label>
            <textarea
              rows={2}
              value={newEvent.description_ar}
              onChange={e => setNewEvent((prev: any) => ({ ...prev, description_ar: e.target.value }))}
              placeholder={lang === 'ar' ? 'اكتب تفاصيل عن الأمسية، موعد الحضور، والفقرات...' : 'Event program details...'}
              className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs font-medium text-foreground focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl font-bold text-xs cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              className="rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
            >
              {lang === 'ar' ? 'جدولة ونشر الفعالية 📅' : 'Schedule Event 📅'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
