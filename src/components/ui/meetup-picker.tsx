'use client'

import { useState } from 'react'
import { MapPin, Building2, Truck, Clock, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MeetupProposal, DeliveryPreference } from '@/lib/transactions/lifecycle'

interface MeetupPickerProps {
  value: MeetupProposal
  onChange: (v: MeetupProposal) => void
  lang?: 'ar' | 'en'
  className?: string
}

const ALEX_LOCATIONS = [
  { label: 'Bibliotheca Alexandrina (Main Plaza)', label_ar: 'مكتبة الإسكندرية (الساحة الرئيسية)', city: 'alex' },
  { label: 'Raml Station (Saad Zaghloul Square)', label_ar: 'محطة الرمل (ميدان سعد زغلول / البن البرازيلي)', city: 'alex' },
  { label: 'San Stefano Mall (Cinema Lobby / Gate)', label_ar: 'سان ستيفانو مول (البوابة الرئيسية / الكافيهات)', city: 'alex' },
  { label: 'Smouha (Green Plaza Mall)', label_ar: 'سموحة (جرين بلازا مول)', city: 'alex' },
  { label: 'Stanley Bridge Walkway', label_ar: 'كوبري ستانلي (الممشى / كوستا)', city: 'alex' },
  { label: 'Gleem Bay Corniche', label_ar: 'جليم باي (ممشى الكورنيش)', city: 'alex' },
  { label: 'Sidi Gaber Train Station (Main Hall)', label_ar: 'سيدي جابر (محطة القطار / البهو الرئيسي)', city: 'alex' },
  { label: 'Mandara / Montaza Plaza', label_ar: 'المندرة (دوران المندرة / قصر المنتزه)', city: 'alex' },
  { label: 'Miami (Gamal Abdel Nasser / Academy)', label_ar: 'ميامي (جمال عبد الناصر / الأكاديمية)', city: 'alex' },
  { label: 'Costa Coffee Shatby Corniche', label_ar: 'كوستا كورنيش الشاطبي', city: 'alex' },
]

const CAIRO_LOCATIONS = [
  { label: 'Cilantro Degla Maadi', label_ar: 'سيلانترو دجلة المعادي', city: 'cairo' },
  { label: 'Beano\'s Zamalek (Brazil St)', label_ar: 'بيانوز الزمالك (شارع البرازيل)', city: 'cairo' },
  { label: 'Starbucks City Stars (Nasr City)', label_ar: 'ستاربكس سيتي ستارز (مدينة نصر)', city: 'cairo' },
  { label: 'Downtown Mall (New Cairo)', label_ar: 'الداون تاون مول (التجمع الخامس)', city: 'cairo' },
  { label: 'The GrEEK Campus Tahrir', label_ar: 'الجريك كامبس (وسط البلد / التحرير)', city: 'cairo' },
]

const QUICK_LOCATIONS = [...ALEX_LOCATIONS, ...CAIRO_LOCATIONS]

const QUICK_TIMES = [
  { label: 'Friday afternoon', label_ar: 'الجمعة بعد الظهر', iso: '' },
  { label: 'Saturday morning', label_ar: 'السبت صباحاً', iso: '' },
  { label: 'Sunday evening', label_ar: 'الأحد مساءً', iso: '' },
  { label: 'Weekday after 5pm', label_ar: 'يوم عمل بعد 5م', iso: '' },
  { label: 'Anytime this week', label_ar: 'أي وقت هذا الأسبوع', iso: '' },
]

const t = (ar: string, en: string, lang: string) => lang === 'ar' ? ar : en

export function MeetupPicker({ value, onChange, lang = 'ar', className }: MeetupPickerProps) {
  const [customLocation, setCustomLocation] = useState('')
  const [showCustomTime, setShowCustomTime] = useState(false)
  const [customTimeLabel, setCustomTimeLabel] = useState('')
  const [activeCityTab, setActiveCityTab] = useState<'all' | 'alex' | 'cairo'>('alex')

  const setDelivery = (d: DeliveryPreference) =>
    onChange({ ...value, preferred_delivery: d, hub_id: undefined, location: d === 'COURIER' ? undefined : value.location })

  const setLocation = (loc: string) =>
    onChange({ ...value, location: loc })

  const toggleTime = (slot: { label: string; label_ar: string; iso: string }) => {
    const label = lang === 'ar' ? slot.label_ar : slot.label
    const existing = value.proposed_times ?? []
    const already = existing.find(t => t.label === label)
    if (already) {
      onChange({ ...value, proposed_times: existing.filter(t => t.label !== label) })
    } else {
      onChange({ ...value, proposed_times: [...existing, { label, iso: slot.iso }] })
    }
  }

  const isTimeSelected = (slot: { label: string; label_ar: string }) => {
    const label = lang === 'ar' ? slot.label_ar : slot.label
    return (value.proposed_times ?? []).some(t => t.label === label)
  }

  const addCustomTime = () => {
    if (!customTimeLabel.trim()) return
    const existing = value.proposed_times ?? []
    onChange({ ...value, proposed_times: [...existing, { label: customTimeLabel.trim(), iso: '' }] })
    setCustomTimeLabel('')
    setShowCustomTime(false)
  }

  const removeTime = (label: string) =>
    onChange({ ...value, proposed_times: (value.proposed_times ?? []).filter(t => t.label !== label) })

  const filteredLocations = activeCityTab === 'all'
    ? QUICK_LOCATIONS
    : activeCityTab === 'alex'
    ? ALEX_LOCATIONS
    : CAIRO_LOCATIONS

  return (
    <div className={cn('space-y-4', className)}>
      {/* ── Delivery method ── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          {t('طريقة التسليم والمقابلة', 'Pickup Method', lang)}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              {
                key: 'MEETUP',
                icon: <MapPin className="h-4 w-4" />,
                label: t('لقاء شخصي مباشر', 'In-Person Meetup', lang),
              },
              {
                key: 'COMMUNITY_HUB',
                icon: <Building2 className="h-4 w-4" />,
                label: t('نقطة لقاء آمنة (Hub)', 'Safe Community Hub', lang),
              },
              {
                key: 'COURIER',
                icon: <Truck className="h-4 w-4" />,
                label: t('مندوب شحن وتوصيل', 'Courier', lang),
              },
            ] as { key: DeliveryPreference; icon: React.ReactNode; label: string }[]
          ).map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setDelivery(opt.key)}
              className={cn(
                'flex flex-col items-center text-center gap-1.5 rounded-xl border py-3 px-2 text-xs font-bold transition-all cursor-pointer',
                value.preferred_delivery === opt.key
                  ? 'border-primary bg-primary/10 text-primary shadow-xs'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Location (Meetup only) ── */}
      {value.preferred_delivery === 'MEETUP' && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <p className="text-xs font-bold text-foreground">
              <MapPin className="inline h-3.5 w-3.5 text-primary me-1" />
              {t('اختر مكان اللقاء المفضل (أماكن عامة وآمنة):', 'Select Safe Public Meetup Location:', lang)}
            </p>

            {/* City filter tabs */}
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveCityTab('alex')}
                className={cn(
                  'px-2 py-0.5 rounded-md transition-all cursor-pointer',
                  activeCityTab === 'alex' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                🌊 {t('الإسكندرية', 'Alexandria', lang)}
              </button>
              <button
                type="button"
                onClick={() => setActiveCityTab('cairo')}
                className={cn(
                  'px-2 py-0.5 rounded-md transition-all cursor-pointer',
                  activeCityTab === 'cairo' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                🏛️ {t('القاهرة', 'Cairo', lang)}
              </button>
              <button
                type="button"
                onClick={() => setActiveCityTab('all')}
                className={cn(
                  'px-2 py-0.5 rounded-md transition-all cursor-pointer',
                  activeCityTab === 'all' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t('الكل', 'All', lang)}
              </button>
            </div>
          </div>

          {/* Quick picks */}
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-border/50 rounded-xl bg-muted/20">
            {filteredLocations.map(loc => {
              const label = lang === 'ar' ? loc.label_ar : loc.label
              const isSelected = value.location === label
              return (
                <button
                  key={loc.label}
                  type="button"
                  onClick={() => setLocation(label)}
                  className={cn(
                    'rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer text-start',
                    isSelected
                      ? 'border-primary bg-primary/15 text-primary font-black shadow-xs ring-1 ring-primary/40'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  📍 {label}
                </button>
              )
            })}
          </div>

          {/* Custom location */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t('أو اكتب مكاناً آخر مفضلاً للمقابلة...', 'Or type a custom meetup spot...', lang)}
              value={value.location && !QUICK_LOCATIONS.some(l => l.label === value.location || l.label_ar === value.location)
                ? value.location
                : customLocation}
              onChange={e => {
                setCustomLocation(e.target.value)
                setLocation(e.target.value)
              }}
              className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>
        </div>
      )}

      {/* ── Community Hub selection ── */}
      {value.preferred_delivery === 'COMMUNITY_HUB' && (
        <div className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs">
          <div className="flex items-center gap-2 font-black text-emerald-800 dark:text-emerald-300">
            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('اختر النقطة الآمنة المعتمدة للمجتمع:', 'Select Designated Community Safe Hub:', lang)}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { id: 'hub-alex-bib', nameAr: 'مكتبة الإسكندرية (الساحة الخارجية)', nameEn: 'Bibliotheca Alexandrina Plaza', areaAr: 'الشاطبي، الإسكندرية' },
              { id: 'hub-alex-san', nameAr: 'سان ستيفانو مول (ردهة الكافيهات)', nameEn: 'San Stefano Mall Lounge', areaAr: 'سان ستيفانو، الإسكندرية' },
              { id: 'hub-alex-smouha', nameAr: 'جرين بلازا مول (سموحة)', nameEn: 'Green Plaza Smouha', areaAr: 'سموحة، الإسكندرية' },
              { id: 'hub-alex-shatby', nameAr: 'كوستا كورنيش الشاطبي', nameEn: 'Costa Coffee Shatby', areaAr: 'كورنيش الإسكندرية' },
              { id: 'hub-maadi', nameAr: 'سيلانترو دجلة المعادي', nameEn: 'Cilantro Degla Maadi', areaAr: 'شارع 218 المعادي، القاهرة' },
              { id: 'hub-zamalek', nameAr: 'بيانوز شارع البرازيل', nameEn: 'Beano\'s Zamalek', areaAr: 'جزيرة الزمالك، القاهرة' },
              { id: 'hub-auc', nameAr: 'بهو مكتبة الجامعة الأمريكية', nameEn: 'AUC Campus Center Lobby', areaAr: 'القاهرة الجديدة' },
              { id: 'hub-tech', nameAr: 'الجريك كامبس وسط البلد', nameEn: 'The GrEEK Campus', areaAr: 'باب اللوق، وسط البلد' },
            ].map(hub => {
              const label = lang === 'ar' ? hub.nameAr : hub.nameEn
              const isSelected = value.location === label
              return (
                <button
                  key={hub.id}
                  type="button"
                  onClick={() => setLocation(label)}
                  className={cn(
                    'p-2.5 rounded-xl border text-start transition-all cursor-pointer flex flex-col gap-0.5',
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-black ring-1 ring-emerald-500'
                      : 'border-border/80 bg-card hover:border-emerald-500/40 text-muted-foreground'
                  )}
                >
                  <span className="font-bold text-foreground text-xs">{label}</span>
                  <span className="text-[10px] text-muted-foreground">{hub.areaAr}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Courier note ── */}
      {value.preferred_delivery === 'COURIER' && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-400">
          <Truck className="inline h-4 w-4 mr-1.5" />
          {t(
            'رسوم التوصيل على عاتق المشتري. سيتم التنسيق عبر المحادثة.',
            'Delivery fees are paid by buyer. We\'ll coordinate via chat.',
            lang
          )}
        </div>
      )}

      {/* ── Available times ── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          <Clock className="inline h-3 w-3 mr-1" />
          {t('الأوقات المناسبة', 'Available Times', lang)}
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {QUICK_TIMES.map(slot => (
            <button
              key={slot.label}
              type="button"
              onClick={() => toggleTime(slot)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-all',
                isTimeSelected(slot)
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40'
              )}
            >
              {lang === 'ar' ? slot.label_ar : slot.label}
            </button>
          ))}
        </div>

        {/* Selected times as removable tags */}
        {(value.proposed_times ?? []).filter(t =>
          !QUICK_TIMES.some(qt => qt.label === t.label || qt.label_ar === t.label)
        ).map(customT => (
          <span
            key={customT.label}
            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary mr-1.5 mb-1.5"
          >
            {customT.label}
            <button type="button" onClick={() => removeTime(customT.label)}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {/* Add custom time */}
        {showCustomTime ? (
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              autoFocus
              placeholder={t('مثال: الخميس 4م', 'e.g. Thursday 4pm', lang)}
              value={customTimeLabel}
              onChange={e => setCustomTimeLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomTime()}
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={addCustomTime}
              className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
            >
              {t('أضف', 'Add', lang)}
            </button>
            <button
              type="button"
              onClick={() => setShowCustomTime(false)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCustomTime(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
          >
            <Plus className="h-3 w-3" />
            {t('أضف وقتاً مخصصاً', 'Add custom time', lang)}
          </button>
        )}
      </div>
    </div>
  )
}
