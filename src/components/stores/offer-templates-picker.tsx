'use client'

import React, { useMemo, useState } from 'react'
import {
  X,
  Layers,
  Search,
  Check,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Gift,
  Bookmark,
  PenLine,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createStoreOffer, deleteStoreOffer } from '@/lib/stores/store-service'
import {
  TIER_PRESET_TEMPLATES,
  SERIES_TEMPLATES,
  buildTierOffer,
  buildSeriesOffer,
  type TierTemplate,
} from '@/lib/stores/offer-templates'
import type { StoreOffer } from '@/types/store'

interface OfferTemplatesPickerProps {
  storeId: string
  existingOffers: StoreOffer[]
  onClose: () => void
  onPublished: (created: StoreOffer[], removedIds: string[]) => void
  onCreateCustom: () => void
}

type PickerTab = 'tiers' | 'series'

interface EditableTier extends TierTemplate {
  key: string
  selected: boolean
}

interface EditableSeries {
  id: string
  name_ar: string
  parts: number
  price: number
  selected: boolean
  isCustom?: boolean
}

const inputCls =
  'w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs font-bold text-foreground text-center focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

export function OfferTemplatesPicker({
  storeId,
  existingOffers,
  onClose,
  onPublished,
  onCreateCustom,
}: OfferTemplatesPickerProps) {
  const [tab, setTab] = useState<PickerTab>('tiers')
  const [isPublishing, setIsPublishing] = useState(false)

  // ---------- Tier ladders ----------
  const [activePresetId, setActivePresetId] = useState(TIER_PRESET_TEMPLATES[0].id)
  const [tiersByPreset, setTiersByPreset] = useState<Record<string, EditableTier[]>>(() =>
    Object.fromEntries(
      TIER_PRESET_TEMPLATES.map(p => [
        p.id,
        p.tiers.map((t, i) => ({ ...t, key: `${p.id}-${i}`, selected: true })),
      ])
    )
  )
  const activePreset = TIER_PRESET_TEMPLATES.find(p => p.id === activePresetId)!
  const activeTiers = tiersByPreset[activePresetId] || []
  const existingTierOffers = existingOffers.filter(o => o.offer_type === 'BUNDLE_TIER')

  const updateTier = (key: string, patch: Partial<EditableTier>) => {
    setTiersByPreset(prev => ({
      ...prev,
      [activePresetId]: prev[activePresetId].map(t => (t.key === key ? { ...t, ...patch } : t)),
    }))
  }

  const addCustomTier = () => {
    const last = activeTiers[activeTiers.length - 1]
    const books = last ? last.books + 5 : 3
    setTiersByPreset(prev => ({
      ...prev,
      [activePresetId]: [
        ...prev[activePresetId],
        {
          key: `${activePresetId}-custom-${Date.now()}`,
          books,
          gift_books: last ? last.gift_books + 1 : 1,
          bookmarks: books,
          price: last ? Math.round((last.price / last.books) * books) : 120,
          selected: true,
        },
      ],
    }))
  }

  const removeTier = (key: string) => {
    setTiersByPreset(prev => ({
      ...prev,
      [activePresetId]: prev[activePresetId].filter(t => t.key !== key),
    }))
  }

  const publishTiers = async () => {
    const chosen = activeTiers.filter(t => t.selected && t.books > 0 && t.price > 0)
    if (chosen.length === 0) {
      alert('اختر مستوى واحد على الأقل لنشره.')
      return
    }
    let removedIds: string[] = []
    if (existingTierOffers.length > 0) {
      const replace = confirm(
        `لديك ${existingTierOffers.length} مستويات باقات منشورة بالفعل.\nهل تريد استبدالها بالمستويات الجديدة؟ (إلغاء = الإضافة بجانبها)`
      )
      if (replace) {
        await Promise.all(existingTierOffers.map(o => deleteStoreOffer(o.id)))
        removedIds = existingTierOffers.map(o => o.id)
      }
    }
    setIsPublishing(true)
    const created: StoreOffer[] = []
    const sorted = [...chosen].sort((a, b) => a.books - b.books)
    for (const [idx, t] of sorted.entries()) {
      created.push(
        await createStoreOffer(
          buildTierOffer(storeId, t, {
            templateId: activePreset.id,
            tagline: activePreset.tagline_ar,
            popular: sorted.length > 2 && idx === 1,
          })
        )
      )
    }
    setIsPublishing(false)
    onPublished(created, removedIds)
  }

  // ---------- Series ----------
  const [seriesQuery, setSeriesQuery] = useState('')
  const [seriesList, setSeriesList] = useState<EditableSeries[]>(() =>
    SERIES_TEMPLATES.map(s => ({ ...s, selected: false }))
  )
  const [newSeries, setNewSeries] = useState({ name_ar: '', parts: 3, price: 150 })

  const publishedSeriesNames = useMemo(
    () =>
      new Set(
        existingOffers
          .filter(o => o.offer_type === 'SERIES')
          .map(o => (o.series_name || '').trim())
      ),
    [existingOffers]
  )

  const visibleSeries = seriesList.filter(s =>
    s.name_ar.toLowerCase().includes(seriesQuery.trim().toLowerCase())
  )
  const selectableVisible = visibleSeries.filter(s => !publishedSeriesNames.has(s.name_ar))
  const allVisibleSelected = selectableVisible.length > 0 && selectableVisible.every(s => s.selected)
  const selectedSeries = seriesList.filter(s => s.selected && !publishedSeriesNames.has(s.name_ar))

  const updateSeries = (id: string, patch: Partial<EditableSeries>) => {
    setSeriesList(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)))
  }

  const toggleAllVisible = () => {
    const ids = new Set(selectableVisible.map(s => s.id))
    setSeriesList(prev => prev.map(s => (ids.has(s.id) ? { ...s, selected: !allVisibleSelected } : s)))
  }

  const addNewSeriesRow = () => {
    const name = newSeries.name_ar.trim()
    if (!name) return
    const finalName = name.startsWith('سلسلة') || name.startsWith('ثلاثية') ? name : `سلسلة ${name}`
    setSeriesList(prev => [
      {
        id: `custom-series-${Date.now()}`,
        name_ar: finalName,
        parts: Math.max(2, Number(newSeries.parts) || 2),
        price: Math.max(1, Number(newSeries.price) || 1),
        selected: true,
        isCustom: true,
      },
      ...prev,
    ])
    setNewSeries({ name_ar: '', parts: 3, price: 150 })
  }

  const publishSeries = async () => {
    if (selectedSeries.length === 0) {
      alert('اختر سلسلة واحدة على الأقل لنشرها.')
      return
    }
    setIsPublishing(true)
    const created: StoreOffer[] = []
    for (const s of selectedSeries) {
      created.push(
        await createStoreOffer(
          buildSeriesOffer(storeId, {
            name_ar: s.name_ar,
            parts: s.parts,
            price: s.price,
            templateId: s.isCustom ? undefined : s.id,
          })
        )
      )
    }
    setIsPublishing(false)
    onPublished(created, [])
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="rounded-3xl border-2 border-border bg-card w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-500 shrink-0" />
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-4 pb-3 border-b border-border shrink-0">
          <div>
            <h3 className="font-black text-foreground text-base sm:text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-orange-500" />
              <span>اختر من العروض الجاهزة</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              انشر عروض جاهزة بضغطة واحدة — وتقدر تعدّل الأسعار والأعداد قبل النشر أو تضيف عرض جديد خاص بيك.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer shrink-0"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 sm:px-6 pt-3 shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-muted/50 border border-border">
            {([
              { id: 'tiers', label: '📚 باقات "اختار كتبك"', sub: 'كتب + هدايا + بوك مارك' },
              { id: 'series', label: '🌟 عروض السلاسل', sub: `${SERIES_TEMPLATES.length} سلسلة جاهزة` },
            ] as { id: PickerTab; label: string; sub: string }[]).map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'rounded-xl px-3 py-2 text-xs font-black transition-all cursor-pointer flex flex-col items-center',
                  tab === t.id ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span>{t.label}</span>
                <span className="text-[10px] font-semibold opacity-70">{t.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {tab === 'tiers' && (
            <>
              {/* Preset chooser */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TIER_PRESET_TEMPLATES.map(p => {
                  const isActive = p.id === activePresetId
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActivePresetId(p.id)}
                      className={cn(
                        'text-start rounded-2xl border-2 p-3.5 transition-all cursor-pointer',
                        isActive
                          ? 'border-orange-500 bg-orange-500/10 shadow-sm'
                          : 'border-border bg-muted/20 hover:border-orange-500/40'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm font-black text-foreground">{p.name_ar}</span>
                        {isActive && (
                          <span className="h-5 w-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-0.5 text-[11px] text-muted-foreground font-semibold">
                        {p.tiers.map((t, i) => (
                          <div key={i}>
                            📚 {t.books} كتب + {t.gift_books} هدية + {t.bookmarks} بوك مارك ={' '}
                            <strong className="text-foreground">{t.price}ج</strong>
                          </div>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Editable tiers */}
              <div className="rounded-2xl border border-border overflow-hidden">
                <div className="px-3.5 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <PenLine className="h-3.5 w-3.5 text-primary" />
                    راجع وعدّل المستويات قبل النشر
                  </span>
                  {existingTierOffers.length > 0 && (
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                      لديك {existingTierOffers.length} مستويات منشورة
                    </span>
                  )}
                </div>

                <div className="hidden sm:grid grid-cols-[28px_1fr_1fr_1fr_1fr_28px] gap-2 px-3.5 pt-2.5 text-[10px] font-black text-muted-foreground text-center">
                  <span />
                  <span className="flex items-center justify-center gap-1"><BookOpen className="h-3 w-3" /> كتب يختارها</span>
                  <span className="flex items-center justify-center gap-1"><Gift className="h-3 w-3" /> كتب هدية</span>
                  <span className="flex items-center justify-center gap-1"><Bookmark className="h-3 w-3" /> بوك مارك</span>
                  <span>السعر (ج.م)</span>
                  <span />
                </div>

                <div className="p-3.5 pt-2 space-y-2">
                  {activeTiers.map(t => (
                    <div
                      key={t.key}
                      className={cn(
                        'grid grid-cols-[28px_1fr_1fr_1fr_1fr_28px] gap-2 items-center rounded-xl p-1.5 transition-colors',
                        t.selected ? 'bg-orange-500/5' : 'opacity-50'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => updateTier(t.key, { selected: !t.selected })}
                        className={cn(
                          'h-6 w-6 rounded-lg border flex items-center justify-center cursor-pointer',
                          t.selected ? 'bg-orange-500 border-orange-500 text-white' : 'border-border bg-background'
                        )}
                        aria-label="اختيار المستوى"
                      >
                        {t.selected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </button>
                      <input type="number" min={1} value={t.books} onChange={e => updateTier(t.key, { books: Number(e.target.value) })} className={inputCls} aria-label="عدد الكتب" />
                      <input type="number" min={0} value={t.gift_books} onChange={e => updateTier(t.key, { gift_books: Number(e.target.value) })} className={inputCls} aria-label="كتب هدية" />
                      <input type="number" min={0} value={t.bookmarks} onChange={e => updateTier(t.key, { bookmarks: Number(e.target.value) })} className={inputCls} aria-label="بوك مارك" />
                      <input type="number" min={1} value={t.price} onChange={e => updateTier(t.key, { price: Number(e.target.value) })} className={cn(inputCls, 'text-primary')} aria-label="السعر" />
                      <button
                        type="button"
                        onClick={() => removeTier(t.key)}
                        className="h-6 w-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                        aria-label="حذف المستوى"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addCustomTier}
                    className="w-full mt-1 py-2 rounded-xl border border-dashed border-border hover:border-orange-500/60 text-xs font-bold text-muted-foreground hover:text-orange-600 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    إضافة مستوى جديد
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                المستويات دي هتظهر في صفحة مكتبتك في &quot;مجمّع باقات التوفير&quot; — القارئ يختار كتبه وأول ما يوصل للعدد يتفعّل السعر والهدايا تلقائياً.
              </p>
            </>
          )}

          {tab === 'series' && (
            <>
              {/* Add new series */}
              <div className="rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 p-3.5 space-y-2">
                <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-emerald-600" />
                  إضافة سلسلة جديدة غير موجودة في القائمة
                </span>
                <div className="grid grid-cols-[1fr_80px_90px_auto] gap-2">
                  <input
                    type="text"
                    value={newSeries.name_ar}
                    onChange={e => setNewSeries(p => ({ ...p, name_ar: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNewSeriesRow() } }}
                    placeholder="اسم السلسلة (مثال: سلسلة ما وراء الطبيعة)"
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-emerald-500"
                  />
                  <input type="number" min={2} value={newSeries.parts} onChange={e => setNewSeries(p => ({ ...p, parts: Number(e.target.value) }))} className={inputCls} aria-label="عدد الأجزاء" title="عدد الأجزاء" />
                  <input type="number" min={1} value={newSeries.price} onChange={e => setNewSeries(p => ({ ...p, price: Number(e.target.value) }))} className={inputCls} aria-label="السعر" title="السعر" />
                  <Button type="button" size="sm" onClick={addNewSeriesRow} disabled={!newSeries.name_ar.trim()} className="rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white h-auto">
                    إضافة
                  </Button>
                </div>
                <div className="grid grid-cols-[1fr_80px_90px_auto] gap-2 text-[10px] text-muted-foreground font-bold text-center">
                  <span />
                  <span>الأجزاء</span>
                  <span>السعر</span>
                  <span className="invisible">إضافة</span>
                </div>
              </div>

              {/* Search + select all */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={seriesQuery}
                    onChange={e => setSeriesQuery(e.target.value)}
                    placeholder="ابحث في السلاسل..."
                    className="w-full bg-muted/40 border border-border rounded-xl ps-9 pe-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={toggleAllVisible} className="rounded-xl text-xs font-bold shrink-0">
                  {allVisibleSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                </Button>
              </div>

              {/* Series list */}
              <div className="rounded-2xl border border-border divide-y divide-border overflow-hidden">
                <div className="grid grid-cols-[28px_1fr_70px_90px] gap-2 px-3 py-2 bg-muted/40 text-[10px] font-black text-muted-foreground text-center">
                  <span />
                  <span className="text-start">السلسلة</span>
                  <span>الأجزاء</span>
                  <span>السعر (ج.م)</span>
                </div>
                {visibleSeries.map((s, idx) => {
                  const isPublished = publishedSeriesNames.has(s.name_ar)
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        'grid grid-cols-[28px_1fr_70px_90px] gap-2 items-center px-3 py-2 transition-colors',
                        isPublished ? 'bg-muted/30' : s.selected ? 'bg-emerald-500/5' : 'hover:bg-muted/20'
                      )}
                    >
                      <button
                        type="button"
                        disabled={isPublished}
                        onClick={() => updateSeries(s.id, { selected: !s.selected })}
                        className={cn(
                          'h-6 w-6 rounded-lg border flex items-center justify-center',
                          isPublished
                            ? 'bg-muted border-border text-muted-foreground cursor-not-allowed'
                            : s.selected
                              ? 'bg-emerald-600 border-emerald-600 text-white cursor-pointer'
                              : 'border-border bg-background cursor-pointer'
                        )}
                        aria-label={`اختيار ${s.name_ar}`}
                      >
                        {(s.selected || isPublished) && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </button>
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="text-[10px] font-black text-muted-foreground w-5 shrink-0">{idx + 1}</span>
                        <span className="text-xs font-black text-foreground truncate">{s.name_ar}</span>
                        {s.isCustom && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shrink-0">جديدة</span>
                        )}
                        {isPublished && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-primary/10 text-primary shrink-0">منشورة ✓</span>
                        )}
                      </div>
                      <input type="number" min={2} disabled={isPublished} value={s.parts} onChange={e => updateSeries(s.id, { parts: Number(e.target.value) })} className={inputCls} aria-label="عدد الأجزاء" />
                      <input type="number" min={1} disabled={isPublished} value={s.price} onChange={e => updateSeries(s.id, { price: Number(e.target.value) })} className={cn(inputCls, 'text-primary')} aria-label="السعر" />
                    </div>
                  )
                })}
                {visibleSeries.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted-foreground">لا توجد سلاسل مطابقة — أضفها من الأعلى ☝️</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-border bg-muted/20 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onCreateCustom}
            className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PenLine className="h-3.5 w-3.5" />
            أو أنشئ عرضاً مخصصاً من الصفر (باكدج بصورة وكتب محددة)
          </button>

          {tab === 'tiers' ? (
            <Button
              type="button"
              onClick={publishTiers}
              disabled={isPublishing || activeTiers.every(t => !t.selected)}
              className="rounded-xl font-black text-xs gap-2 bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
            >
              {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
              نشر {activeTiers.filter(t => t.selected).length} مستويات الآن 🔥
            </Button>
          ) : (
            <Button
              type="button"
              onClick={publishSeries}
              disabled={isPublishing || selectedSeries.length === 0}
              className="rounded-xl font-black text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              نشر {selectedSeries.length} سلسلة الآن 🌟
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
