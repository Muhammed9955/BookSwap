'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import {
  Flame,
  PlusCircle,
  Sparkles,
  Package,
  Check,
  Gift,
  Trash2,
  Table as TableIcon,
  LayoutGrid,
  Tag,
  BookOpen,
  Bookmark,
  Layers,
  Edit3,
  X,
  PenLine,
  Plus,
  Loader2,
  RotateCcw,
  CheckSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { OfferTemplatesPicker } from '@/components/stores/offer-templates-picker'
import type { StoreOffer } from '@/types/store'
import { useStoreOffers } from '../hooks/use-store-offers'
import { AddOfferModal } from '../components/add-offer-modal'
import { EditOfferModal } from '../components/edit-offer-modal'
import {
  buildTierOffer,
  TIER_PRESET_TEMPLATES,
  type TierTemplate,
} from '@/lib/stores/offer-templates'
import {
  createStoreOffer,
  deleteMultipleStoreOffers,
} from '@/lib/stores/store-service'

interface StoreOffersTabProps {
  initialOffers: StoreOffer[]
  activeStoreId: string
  currentStoreId: string
  lang: 'ar' | 'en'
}

type OfferTabType = 'packages' | 'ready_offers'

interface EditableTier extends TierTemplate {
  key: string
  selected: boolean
}

function OfferCoverThumbnail({ src, title, offerType }: { src?: string; title: string; offerType: string }) {
  const [error, setError] = useState(false)

  if (src && !error) {
    return (
      <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-muted shrink-0 border border-border shadow-2xs group-hover:scale-105 transition-transform">
        <Image
          src={src}
          alt={title}
          fill
          unoptimized
          className="object-cover"
          onError={() => setError(true)}
        />
      </div>
    )
  }

  // Fallback styled icon based on offer type
  const getGradient = () => {
    switch (offerType) {
      case 'SERIES':
        return 'from-purple-500/20 to-indigo-500/20 text-purple-600 border-purple-500/30'
      case 'BUNDLE_TIER':
        return 'from-amber-500/20 to-orange-500/20 text-amber-600 border-amber-500/30'
      default:
        return 'from-emerald-500/20 to-primary/20 text-emerald-600 border-emerald-500/30'
    }
  }

  return (
    <div
      className={cn(
        'h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border bg-gradient-to-br shadow-2xs',
        getGradient()
      )}
    >
      {offerType === 'SERIES' ? (
        <Sparkles className="h-6 w-6" />
      ) : offerType === 'BUNDLE_TIER' ? (
        <Flame className="h-6 w-6" />
      ) : (
        <Package className="h-6 w-6" />
      )}
    </div>
  )
}

export function StoreOffersTab({
  initialOffers,
  activeStoreId,
  currentStoreId,
  lang,
}: StoreOffersTabProps) {
  const searchParams = useSearchParams()
  const subtabParam = searchParams.get('subtab')
  const initialSubtab: OfferTabType =
    subtabParam === 'packages' || subtabParam === 'boxes' || subtabParam === 'packs'
      ? 'packages'
      : 'ready_offers'

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [activeOfferTab, setActiveOfferTab] = useState<OfferTabType>(initialSubtab)

  const handleSelectOfferTab = (tab: OfferTabType) => {
    setActiveOfferTab(tab)
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href)
        url.searchParams.set('subtab', tab)
        window.history.replaceState(null, '', url.pathname + url.search)
      } catch {}
    }
  }

  const {
    offers,
    setOffers,
    isAddOfferModalOpen,
    setIsAddOfferModalOpen,
    isTemplatePickerOpen,
    setIsTemplatePickerOpen,
    newOffer,
    setNewOffer,
    handleAddOffer,
    handleDeleteOffer,
    // Multi-select for delete
    selectedOfferIds,
    handleToggleSelectOffer,
    handleToggleSelectAll,
    handleClearSelection,
    handleBulkDeleteOffers,
    // Edit Offer
    editingOffer,
    isEditOfferModalOpen,
    handleOpenEditOffer,
    handleCloseEditOffer,
    handleSaveEditOffer,
    // Cover upload
    isUploadingOfferCover,
    handleOfferCoverFileChange,
  } = useStoreOffers({
    initialOffers,
    activeStoreId,
    currentStoreId,
    lang,
  })

  // Quick stats & 2 kinds of offers separation
  const curatedPacks = offers.filter(o => o.offer_type === 'CURATED_PACK')
  const seriesAndBundles = offers.filter(o => o.offer_type !== 'CURATED_PACK')
  const tierOffers = offers.filter(o => o.offer_type === 'BUNDLE_TIER')
  const seriesOffers = offers.filter(o => o.offer_type === 'SERIES')

  const curatedPacksCount = curatedPacks.length
  const seriesCount = seriesOffers.length
  const tiersCount = tierOffers.length

  // Selection states for Select All & Partial Selection
  const isAllCuratedSelected = curatedPacks.length > 0 && curatedPacks.every(o => selectedOfferIds.includes(o.id))
  const isSomeCuratedSelected = curatedPacks.some(o => selectedOfferIds.includes(o.id))

  const isAllSeriesSelected = seriesOffers.length > 0 && seriesOffers.every(o => selectedOfferIds.includes(o.id))
  const isSomeSeriesSelected = seriesOffers.some(o => selectedOfferIds.includes(o.id))

  // ==========================================
  // READY OFFERS IN-PAGE TIER LADDER EDITOR
  // Matches exact UI from the screenshot!
  // ==========================================
  const [activePresetId, setActivePresetId] = useState<'preset-4' | 'preset-5' | 'custom'>('preset-4')
  const [editableTiers, setEditableTiers] = useState<EditableTier[]>(() => {
    const existing = initialOffers.filter(
      o => o.offer_type === 'BUNDLE_TIER' && o.store_id === currentStoreId
    )
    if (existing.length > 0) {
      return existing
        .sort((a, b) => (a.bundle_buy_qty || 0) - (b.bundle_buy_qty || 0))
        .map(o => ({
          key: o.id,
          books: o.bundle_buy_qty || 3,
          gift_books: o.bundle_free_qty || 1,
          bookmarks: o.bundle_buy_qty || 3,
          price: o.bundle_price || o.offer_price || 120,
          selected: o.status === 'ACTIVE',
        }))
    }
    // Default 4 levels as in screenshot: 3, 6, 10, 15
    return [
      { key: 'tier-1', books: 3, gift_books: 1, bookmarks: 3, price: 120, selected: true },
      { key: 'tier-2', books: 6, gift_books: 2, bookmarks: 6, price: 240, selected: true },
      { key: 'tier-3', books: 10, gift_books: 3, bookmarks: 10, price: 400, selected: true },
      { key: 'tier-4', books: 15, gift_books: 4, bookmarks: 15, price: 600, selected: true },
    ]
  })

  const [isSavingTiers, setIsSavingTiers] = useState(false)
  const [tiersSavedSuccess, setTiersSavedSuccess] = useState(false)

  const handleUpdateTier = (key: string, patch: Partial<EditableTier>) => {
    setEditableTiers(prev => prev.map(t => (t.key === key ? { ...t, ...patch } : t)))
  }

  const handleAddTier = () => {
    const last = editableTiers[editableTiers.length - 1]
    const books = last ? last.books + 5 : 3
    const gift_books = last ? last.gift_books + 1 : 1
    const bookmarks = books
    const price = last ? Math.round((last.price / last.books) * books) : 120
    setEditableTiers(prev => [
      ...prev,
      {
        key: `custom-tier-${Date.now()}`,
        books,
        gift_books,
        bookmarks,
        price,
        selected: true,
      },
    ])
    setActivePresetId('custom')
  }

  const handleRemoveTier = (key: string) => {
    setEditableTiers(prev => prev.filter(t => t.key !== key))
  }

  const handleLoadPreset = (preset: 'preset-4' | 'preset-5') => {
    setActivePresetId(preset)
    if (preset === 'preset-4') {
      setEditableTiers([
        { key: `tier-p4-1`, books: 3, gift_books: 1, bookmarks: 3, price: 120, selected: true },
        { key: `tier-p4-2`, books: 6, gift_books: 2, bookmarks: 6, price: 240, selected: true },
        { key: `tier-p4-3`, books: 10, gift_books: 3, bookmarks: 10, price: 400, selected: true },
        { key: `tier-p4-4`, books: 15, gift_books: 4, bookmarks: 15, price: 600, selected: true },
      ])
    } else {
      setEditableTiers([
        { key: `tier-p5-1`, books: 3, gift_books: 1, bookmarks: 3, price: 120, selected: true },
        { key: `tier-p5-2`, books: 5, gift_books: 2, bookmarks: 5, price: 200, selected: true },
        { key: `tier-p5-3`, books: 10, gift_books: 3, bookmarks: 10, price: 400, selected: true },
        { key: `tier-p5-4`, books: 15, gift_books: 4, bookmarks: 15, price: 600, selected: true },
        { key: `tier-p5-5`, books: 20, gift_books: 5, bookmarks: 20, price: 800, selected: true },
      ])
    }
  }

  const handlePublishTiers = async () => {
    const selected = editableTiers.filter(t => t.selected && t.books > 0 && t.price > 0)
    if (selected.length === 0) {
      alert(lang === 'ar' ? 'يرجى تحديد وتفعيل مستوى واحد على الأقل للحفظ' : 'Please select at least one tier')
      return
    }

    setIsSavingTiers(true)
    try {
      // 1. Remove existing BUNDLE_TIER offers from this store
      const oldTierIds = offers.filter(o => o.offer_type === 'BUNDLE_TIER').map(o => o.id)
      if (oldTierIds.length > 0) {
        await deleteMultipleStoreOffers(oldTierIds)
      }

      // 2. Create new BUNDLE_TIER offers
      const createdOffers: StoreOffer[] = []
      for (const t of selected) {
        const payload = buildTierOffer(activeStoreId, {
          books: t.books,
          gift_books: t.gift_books,
          bookmarks: t.bookmarks,
          price: t.price,
        })
        const created = await createStoreOffer(payload as any)
        createdOffers.push(created)
      }

      // 3. Update offers state
      setOffers(prev => {
        const filtered = prev.filter(o => o.offer_type !== 'BUNDLE_TIER')
        return [...createdOffers, ...filtered]
      })

      setTiersSavedSuccess(true)
      setTimeout(() => setTiersSavedSuccess(false), 4000)
    } catch (err) {
      console.error('Failed to save tier offers:', err)
      alert(lang === 'ar' ? 'حدث خطأ أثناء حفظ مستويات العروض' : 'Error saving tier offers')
    } finally {
      setIsSavingTiers(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
            <span>{lang === 'ar' ? 'إدارة باقات وحزم العروض' : 'Bundles & Special Offers'}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lang === 'ar'
              ? 'تبويبان منفصلان: تبويب خاص بالعروض الجاهزة والمستويات، وتبويب خاص بباكدجات وحزم الكتب المعروضة في المتجر والسلة.'
              : 'Two separate tabs: one for Ready Offers & Series Tiers, and one for Books Packages Products.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeOfferTab === 'packages' && (
            <>
              {/* View Mode Switcher for packages */}
              <div className="flex items-center bg-muted/60 p-1 rounded-2xl border border-border">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    viewMode === 'table'
                      ? 'bg-card text-foreground shadow-xs font-black'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title={lang === 'ar' ? 'عرض كجدول' : 'Table View'}
                >
                  <TableIcon className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'جدول' : 'Table'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    viewMode === 'grid'
                      ? 'bg-card text-foreground shadow-xs font-black'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title={lang === 'ar' ? 'عرض كبطاقات' : 'Cards View'}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'بطاقات' : 'Cards'}</span>
                </button>
              </div>

              <Button
                onClick={() => setIsAddOfferModalOpen(true)}
                className="rounded-2xl font-black text-xs gap-2 shadow-md shadow-emerald-500/25 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{lang === 'ar' ? 'إنشاء باكدج كتب مجهز (2-5 كتب) 📦' : 'Create 2-5 Books Pack 📦'}</span>
              </Button>
            </>
          )}

          {activeOfferTab === 'ready_offers' && (
            <Button
              onClick={() => setIsTemplatePickerOpen(true)}
              variant="outline"
              className="rounded-2xl font-black text-xs gap-2 border-orange-500/40 text-orange-600 hover:bg-orange-500/10 shadow-xs cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-orange-500" />
              <span>{lang === 'ar' ? 'تصفح وتفعيل سلاسل روايات جاهزة 🌟' : 'Ready Series Templates 🌟'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2 MAIN TABS: 1 for Ready Offers & Series, 1 for Curated Book Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 rounded-2xl bg-muted/60 border border-border">
        {/* TAB 1: READY OFFERS & TIERS */}
        <button
          type="button"
          onClick={() => handleSelectOfferTab('ready_offers')}
          className={cn(
            'flex items-center justify-between gap-3 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer',
            activeOfferTab === 'ready_offers'
              ? 'bg-card text-orange-700 dark:text-orange-300 shadow-sm ring-1 ring-orange-500/30'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-500" />
            <span>{lang === 'ar' ? 'العروض وسلاسل التوفير الجاهزة 🌟' : 'Ready Offers & Series 🌟'}</span>
          </div>
          <Badge className="bg-orange-600 text-white font-black text-xs px-2.5 py-0.5 rounded-lg">
            {seriesAndBundles.length} {lang === 'ar' ? 'عرض مفعّل' : 'Active'}
          </Badge>
        </button>

        {/* TAB 2: CURATED BOOK BOXES & BUNDLES (NICE NAME) */}
        <button
          type="button"
          onClick={() => handleSelectOfferTab('packages')}
          className={cn(
            'flex items-center justify-between gap-3 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer',
            activeOfferTab === 'packages'
              ? 'bg-card text-emerald-700 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/30'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-emerald-600" />
            <span>{lang === 'ar' ? 'بوكسات وحِزَم القراءة 🎁 (2 - 5 كتب)' : 'Curated Book Boxes & Bundles 🎁 (2-5 Books)'}</span>
          </div>
          <Badge className="bg-emerald-600 text-white font-black text-xs px-2.5 py-0.5 rounded-lg">
            {curatedPacks.length} {lang === 'ar' ? 'بوكس معروض بالسلة' : 'Basket Boxes'}
          </Badge>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB CONTENT 1: READY OFFERS & SERIES                       */}
      {/* ========================================================= */}
      {activeOfferTab === 'ready_offers' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Quick Stats for Ready Offers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-2xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground">{lang === 'ar' ? 'مستويات باقات التوفير' : 'Published Tiers'}</p>
                <p className="text-base font-black text-foreground">{tiersCount}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-2xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground">{lang === 'ar' ? 'سلاسل روايات مفعّلة' : 'Active Series'}</p>
                <p className="text-base font-black text-foreground">{seriesCount}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-2xs flex items-center gap-3 col-span-2 sm:col-span-1">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground">{lang === 'ar' ? 'نوع العرض' : 'Offer Category'}</p>
                <p className="text-xs font-black text-foreground">{lang === 'ar' ? 'عروض ترويجية يختارها القارئ' : 'Promotional Series & Tiers'}</p>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* THE LIVE TIER LADDER EDITOR (EXACT REPLICA OF THE SCREENSHOT) */}
          {/* ------------------------------------------------------------- */}
          <div className="rounded-3xl border border-[#1b2f29] bg-[#0c1412] p-4 sm:p-6 shadow-2xl space-y-5">
            {/* Header: Pencil + Title + Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1b2f29]">
              <div className="flex items-center gap-2.5">
                <PenLine className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                    {lang === 'ar' ? 'راجع وعدّل المستويات قبل النشر' : 'Review & Edit Tiers Before Publishing'}
                  </h3>
                  <p className="text-[11px] text-[#719086] mt-0.5">
                    {lang === 'ar'
                      ? 'حدد عدد الكتب التي يختارها القارئ والهدايا والبوك مارك والسعر الإجمالي للباقة.'
                      : 'Set book count, bonus gift books, bookmarks, and total tier price.'}
                  </p>
                </div>
              </div>

              {/* Amber Badge */}
              <div className="self-start sm:self-auto px-3.5 py-1 rounded-xl text-xs font-black border border-amber-500/50 bg-amber-500/10 text-amber-400 shrink-0 shadow-xs">
                {lang === 'ar' ? `لديك ${tiersCount} مستويات منشورة` : `You have ${tiersCount} published tiers`}
              </div>
            </div>

            {/* Presets Chips Selector */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-[#719086]">
                {lang === 'ar' ? 'نماذج سريعة جاهزة:' : 'Quick Presets:'}
              </span>
              <button
                type="button"
                onClick={() => handleLoadPreset('preset-4')}
                className={cn(
                  'px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  activePresetId === 'preset-4'
                    ? 'bg-orange-500 text-white font-black shadow-sm'
                    : 'bg-[#131d1b] border border-[#223530] text-[#719086] hover:text-white'
                )}
              >
                {lang === 'ar' ? 'باقات 4 مستويات (3 → 15 كتاب)' : '4 Levels (3 → 15 books)'}
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset('preset-5')}
                className={cn(
                  'px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  activePresetId === 'preset-5'
                    ? 'bg-orange-500 text-white font-black shadow-sm'
                    : 'bg-[#131d1b] border border-[#223530] text-[#719086] hover:text-white'
                )}
              >
                {lang === 'ar' ? 'باقات 5 مستويات (3 → 20 كتاب)' : '5 Levels (3 → 20 books)'}
              </button>
            </div>

            {/* Table Column Headers */}
            <div className="grid grid-cols-[36px_1fr_1fr_1fr_1fr_36px] gap-2.5 text-center text-xs font-bold text-[#8ba89f] px-1 pt-1">
              <span />
              <span className="flex items-center justify-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[#8ba89f]" />
                <span>{lang === 'ar' ? 'كتب يختارها' : 'Books'}</span>
              </span>
              <span className="flex items-center justify-center gap-1.5">
                <Gift className="h-3.5 w-3.5 text-[#8ba89f]" />
                <span>{lang === 'ar' ? 'كتب هدية' : 'Gift Books'}</span>
              </span>
              <span className="flex items-center justify-center gap-1.5">
                <Bookmark className="h-3.5 w-3.5 text-[#8ba89f]" />
                <span>{lang === 'ar' ? 'بوك مارك' : 'Bookmarks'}</span>
              </span>
              <span>{lang === 'ar' ? 'السعر (ج.م)' : 'Price (EGP)'}</span>
              <span />
            </div>

            {/* Editable Tier Rows */}
            <div className="space-y-3">
              {editableTiers.map(t => (
                <div
                  key={t.key}
                  className={cn(
                    'grid grid-cols-[36px_1fr_1fr_1fr_1fr_36px] gap-2.5 items-center transition-all',
                    !t.selected && 'opacity-40'
                  )}
                >
                  {/* Orange Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleUpdateTier(t.key, { selected: !t.selected })}
                    className={cn(
                      'h-9 w-9 rounded-xl flex items-center justify-center cursor-pointer transition-all shadow-sm font-black',
                      t.selected
                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
                        : 'border border-[#223530] bg-[#131d1b] text-muted-foreground hover:border-orange-500/50'
                    )}
                    title={lang === 'ar' ? 'تفعيل / تعطيل هذا المستوى' : 'Toggle Level'}
                  >
                    {t.selected && <Check className="h-5 w-5 stroke-[3]" />}
                  </button>

                  {/* Books Input */}
                  <input
                    type="number"
                    min={1}
                    value={t.books}
                    onChange={e => handleUpdateTier(t.key, { books: Number(e.target.value) })}
                    className="w-full bg-[#131d1b] border border-[#223530] text-center font-extrabold text-white text-sm py-2.5 px-2 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner"
                    placeholder="3"
                  />

                  {/* Gift Books Input */}
                  <input
                    type="number"
                    min={0}
                    value={t.gift_books}
                    onChange={e => handleUpdateTier(t.key, { gift_books: Number(e.target.value) })}
                    className="w-full bg-[#131d1b] border border-[#223530] text-center font-extrabold text-white text-sm py-2.5 px-2 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner"
                    placeholder="1"
                  />

                  {/* Bookmarks Input */}
                  <input
                    type="number"
                    min={0}
                    value={t.bookmarks}
                    onChange={e => handleUpdateTier(t.key, { bookmarks: Number(e.target.value) })}
                    className="w-full bg-[#131d1b] border border-[#223530] text-center font-extrabold text-white text-sm py-2.5 px-2 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner"
                    placeholder="3"
                  />

                  {/* Price Input (Emerald Green text) */}
                  <input
                    type="number"
                    min={1}
                    value={t.price}
                    onChange={e => handleUpdateTier(t.key, { price: Number(e.target.value) })}
                    className="w-full bg-[#131d1b] border border-[#223530] text-center font-black text-emerald-400 text-sm py-2.5 px-2 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner"
                    placeholder="120"
                  />

                  {/* Delete Row Trash Icon */}
                  <button
                    type="button"
                    onClick={() => handleRemoveTier(t.key)}
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-[#719086] hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
                    title={lang === 'ar' ? 'حذف هذا المستوى' : 'Delete Tier'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Tier Button (Full-width Dashed Button) */}
            <button
              type="button"
              onClick={handleAddTier}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-[#223530] hover:border-emerald-500/50 hover:bg-emerald-500/5 text-[#8ba89f] hover:text-emerald-400 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all mt-4"
            >
              <Plus className="h-4 w-4" />
              <span>{lang === 'ar' ? 'إضافة مستوى جديد +' : '+ Add New Level'}</span>
            </button>

            {/* Save & Publish Action Bar */}
            <div className="pt-3 border-t border-[#1b2f29] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {tiersSavedSuccess && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black animate-in fade-in">
                    <Check className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'تم حفظ ونشر مستويات التوفير بنجاح! 🎉' : 'Tiers saved and published! 🎉'}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  onClick={handlePublishTiers}
                  disabled={isSavingTiers}
                  className="rounded-xl font-black text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 cursor-pointer px-5 py-2.5"
                >
                  {isSavingTiers ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{lang === 'ar' ? 'جاري الحفظ والنشر...' : 'Publishing...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 stroke-[3]" />
                      <span>{lang === 'ar' ? 'حفظ ونشر مستويات التوفير في المتجر 🚀' : 'Save & Publish Tiers 🚀'}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Floating Batch Action Bar when series deals are selected */}
          {selectedOfferIds.length > 0 && (
            <div className="sticky top-20 z-30 p-3.5 rounded-2xl bg-card border-2 border-purple-500/40 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <Badge className="bg-purple-600 text-white font-black px-3 py-1 rounded-xl text-xs">
                  {lang === 'ar'
                    ? `تم تحديد ${selectedOfferIds.length} من العروض`
                    : `${selectedOfferIds.length} offers selected`}
                </Badge>
                <button
                  type="button"
                  onClick={() => handleToggleSelectAll(seriesOffers)}
                  className="text-xs text-purple-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>
                    {isAllSeriesSelected
                      ? (lang === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All')
                      : (lang === 'ar' ? 'تحديد كل السلاسل' : 'Select All Series')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-bold cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'إلغاء التحديد' : 'Clear'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDeleteOffers}
                  className="rounded-xl font-bold text-xs gap-1.5 shadow-xs cursor-pointer bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>
                    {lang === 'ar'
                      ? `حذف المحدد (${selectedOfferIds.length}) نهائياً`
                      : `Delete Selected (${selectedOfferIds.length})`}
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* ACTIVE NOVEL SERIES OFFERS TABLE                              */}
          {/* ------------------------------------------------------------- */}
          <div className="rounded-3xl border-2 border-purple-500/30 bg-card overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-500/10 via-amber-500/5 to-transparent border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h3 className="text-sm sm:text-base font-black text-foreground">
                    {lang === 'ar' ? 'السلاسل الروائية الشهيرة المفعّلة في المتجر 🌟' : 'Active Novel Series Deals 🌟'}
                  </h3>
                  <Badge className="bg-purple-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-lg">
                    {seriesOffers.length} {lang === 'ar' ? 'سلسلة مفعّلة' : 'Series'}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {lang === 'ar'
                    ? 'عروض السلاسل (مثل ثلاثية نجيب محفوظ أو سلسلة أبابيل) التي يمكن للقارئ شراؤها كصفقة واحدة.'
                    : 'Popular series deals available for readers to buy as a bundle.'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                {seriesOffers.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleSelectAll(seriesOffers)}
                    className={cn(
                      'rounded-xl font-black text-xs gap-1.5 border-border cursor-pointer transition-colors',
                      isAllSeriesSelected
                        ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    <CheckSquare className="h-3.5 w-3.5 text-purple-600" />
                    <span>
                      {isAllSeriesSelected
                        ? (lang === 'ar' ? 'إلغاء تحديد السلاسل' : 'Deselect All')
                        : (lang === 'ar' ? 'تحديد كل السلاسل للحذف ☑️' : 'Select All Series for Delete ☑️')}
                    </span>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsTemplatePickerOpen(true)}
                  className="rounded-xl font-bold text-xs gap-1.5 border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10 cursor-pointer shrink-0"
                >
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  <span>{lang === 'ar' ? 'اختر وتفعيل سلاسل جديدة 🌟' : 'Pick New Series 🌟'}</span>
                </Button>
              </div>
            </div>

            {seriesOffers.length === 0 ? (
              <div className="p-8 text-center bg-muted/10 space-y-2">
                <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-xs font-bold text-foreground">
                  {lang === 'ar' ? 'لا توجد سلاسل روائية مفعّلة حالياً' : 'No series deals activated yet'}
                </p>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  {lang === 'ar'
                    ? 'أضف سلاسل روائية شهيرة (مثل ثلاثية نجيب محفوظ أو أرض زيكولا) بضغطة زر واحدة.'
                    : 'Add popular novel series with one click from our curated list.'}
                </p>
                <Button
                  size="sm"
                  onClick={() => setIsTemplatePickerOpen(true)}
                  className="rounded-xl font-bold text-xs mt-2"
                >
                  {lang === 'ar' ? 'تصفح 21 سلسلة جاهزة 🌟' : 'Browse 21 Ready Series 🌟'}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-black">
                      <th className="p-4 text-center w-12">
                        <input
                          type="checkbox"
                          aria-label={lang === 'ar' ? 'تحديد كل السلاسل للحذف' : 'Select all series for delete'}
                          checked={isAllSeriesSelected}
                          ref={el => {
                            if (el) {
                              el.indeterminate = isSomeSeriesSelected && !isAllSeriesSelected
                            }
                          }}
                          onChange={() => handleToggleSelectAll(seriesOffers)}
                          className="h-4 w-4 rounded border-border text-purple-600 focus:ring-purple-600 cursor-pointer accent-purple-600"
                          title={
                            isAllSeriesSelected
                              ? (lang === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect all')
                              : (lang === 'ar' ? 'تحديد كل السلاسل للحذف' : 'Select all for delete')
                          }
                        />
                      </th>
                      <th className="p-4 text-start min-w-[260px]">{lang === 'ar' ? 'اسم السلسلة' : 'Series Title'}</th>
                      <th className="p-4 text-start min-w-[150px]">{lang === 'ar' ? 'عدد الأجزاء' : 'Parts Count'}</th>
                      <th className="p-4 text-start min-w-[200px]">{lang === 'ar' ? 'الأجزاء المتضمنة' : 'Included Parts'}</th>
                      <th className="p-4 text-center min-w-[130px]">{lang === 'ar' ? 'سعر السلسلة والتوفير' : 'Price & Savings'}</th>
                      <th className="p-4 text-center min-w-[130px]">{lang === 'ar' ? 'كود الخصم / الحالة' : 'Status / Promo'}</th>
                      <th className="p-4 text-end min-w-[90px]">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {seriesOffers.map(offer => {
                      const effectiveOfferPrice = offer.offer_price || offer.bundle_price || 0
                      const savings =
                        offer.original_price && offer.original_price > effectiveOfferPrice
                          ? offer.original_price - effectiveOfferPrice
                          : null
                      const isSelected = selectedOfferIds.includes(offer.id)

                      return (
                        <tr
                          key={offer.id}
                          className={cn(
                            'transition-colors group',
                            isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/20'
                          )}
                        >
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOffer(offer.id)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                            />
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <OfferCoverThumbnail
                                src={offer.cover_image_url}
                                title={offer.title}
                                offerType={offer.offer_type}
                              />
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="font-black text-foreground text-xs line-clamp-1">
                                    {lang === 'ar' && offer.title_ar ? offer.title_ar : offer.title}
                                  </p>
                                  {offer.badge_text && (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                                      {offer.badge_text}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                  {lang === 'ar' && offer.description_ar ? offer.description_ar : offer.description}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-purple-600/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                              <Sparkles className="h-3 w-3 text-purple-600 shrink-0" />
                              <span>{lang === 'ar' ? `سلسلة (${offer.series_parts || 0} أجزاء)` : `Series (${offer.series_parts || 0} parts)`}</span>
                            </span>
                          </td>

                          <td className="p-4">
                            {offer.included_books && offer.included_books.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-sm">
                                {offer.included_books.slice(0, 3).map((book, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted/70 border border-border/80 text-[10px] font-semibold text-foreground"
                                  >
                                    <Check className="h-2.5 w-2.5 text-purple-600 shrink-0" />
                                    <span className="truncate max-w-[120px]">{book}</span>
                                  </span>
                                ))}
                                {offer.included_books.length > 3 && (
                                  <span className="px-1.5 py-0.5 rounded-lg bg-muted text-[10px] font-bold text-muted-foreground">
                                    +{offer.included_books.length - 3} {lang === 'ar' ? 'إضافي' : 'more'}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">
                                {offer.series_parts ? `${offer.series_parts} أجزاء كاملة` : 'كامل أجزاء السلسلة'}
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            <div className="space-y-0.5">
                              <span className="text-sm font-black text-foreground block">
                                {effectiveOfferPrice} ج.م
                              </span>
                              {offer.original_price && offer.original_price > effectiveOfferPrice && (
                                <span className="text-[10px] text-muted-foreground line-through block">
                                  {offer.original_price} ج.م
                                </span>
                              )}
                              {savings && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                                  {lang === 'ar' ? `وفر ${savings} ج.م` : `Save ${savings} EGP`}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-4 text-center">
                            {offer.promo_code ? (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-muted border border-border font-mono text-[11px] font-black text-foreground">
                                <span>كود:</span>
                                <span className="text-primary">{offer.promo_code}</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/10 text-purple-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                <span>{lang === 'ar' ? 'سلسلة مفعّلة' : 'Active'}</span>
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-end">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditOffer(offer)}
                                className="h-8 w-8 p-0 rounded-xl text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                                title={lang === 'ar' ? 'تعديل تفاصيل السلسلة' : 'Edit Deal'}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteOffer(offer.id)}
                                className="h-8 w-8 p-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                                title={lang === 'ar' ? 'حذف العرض' : 'Delete Deal'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB CONTENT 2: CURATED BOOK BOXES & BUNDLES (BASKET READY) */}
      {/* ========================================================= */}
      {activeOfferTab === 'packages' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Quick Stats for Reading Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-2xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground">{lang === 'ar' ? 'بوكسات وحِزَم القراءة' : 'Reading Boxes'}</p>
                <p className="text-base font-black text-foreground">{curatedPacksCount}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-2xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground">{lang === 'ar' ? 'معروضة كمنتجات بالسلة 🛒' : 'Active in Basket'}</p>
                <p className="text-base font-black text-foreground">{curatedPacksCount}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-2xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground">{lang === 'ar' ? 'حجم البوكس' : 'Box Size'}</p>
                <p className="text-xs font-black text-foreground">{lang === 'ar' ? 'من 2 إلى 5 كتب' : '2-5 Books'}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border shadow-2xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-muted-foreground">{lang === 'ar' ? 'هدايا متضمنة' : 'Included Gifts'}</p>
                <p className="text-xs font-black text-foreground">{lang === 'ar' ? 'فواصل وبوك مارك' : 'Bookmarks'}</p>
              </div>
            </div>
          </div>

          {/* Floating Batch Action Bar when boxes are selected */}
          {selectedOfferIds.length > 0 && (
            <div className="sticky top-20 z-30 p-3.5 rounded-2xl bg-card border-2 border-emerald-500/40 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <Badge className="bg-emerald-600 text-white font-black px-3 py-1 rounded-xl text-xs">
                  {lang === 'ar'
                    ? `تم تحديد ${selectedOfferIds.length} من أصل ${curatedPacks.length} بوكسات`
                    : `${selectedOfferIds.length} of ${curatedPacks.length} boxes selected`}
                </Badge>
                <button
                  type="button"
                  onClick={() => handleToggleSelectAll(curatedPacks)}
                  className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>
                    {isAllCuratedSelected
                      ? (lang === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect All')
                      : (lang === 'ar' ? 'تحديد كل البوكسات' : 'Select All Boxes')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-bold cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'إلغاء التحديد' : 'Clear'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDeleteOffers}
                  className="rounded-xl font-bold text-xs gap-1.5 shadow-xs cursor-pointer bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>
                    {lang === 'ar'
                      ? `حذف البوكسات المحددة (${selectedOfferIds.length}) نهائياً`
                      : `Delete Selected (${selectedOfferIds.length})`}
                  </span>
                </Button>
              </div>
            </div>
          )}

          {viewMode === 'table' ? (
            /* TABLE VIEW FOR CURATED BOOK BOXES & BUNDLES - ALWAYS VISIBLE */
            <div className="rounded-3xl border-2 border-emerald-500/30 bg-card overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Gift className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-sm sm:text-base font-black text-foreground">
                      {lang === 'ar'
                        ? 'بوكسات وحِزَم القراءة 🎁 — منتجات جاهزة للبيع والإضافة للسلة 🛒'
                        : 'Curated Reading Boxes & Bundles 🎁 — Basket Ready Products 🛒'}
                    </h3>
                    <Badge className="bg-emerald-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-lg shadow-2xs">
                      {curatedPacks.length} {lang === 'ar' ? 'بوكس معروض كمنتج' : 'Boxes Active'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {lang === 'ar'
                      ? 'بوكسات هدايا وحزم توفير مجهزة (من 2 إلى 5 كتب) مع صورة غلاف وسعر خاص وهدية، تظهر كمنتجات مستقلة في متجرك وتضاف مباشرة لسلة القارئ.'
                      : 'Ready 2-5 books gift bundles with custom cover, special price & gifts, displayed as direct products customers can add to their basket.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                  {curatedPacks.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleSelectAll(curatedPacks)}
                      className={cn(
                        'rounded-xl font-black text-xs gap-1.5 border-border cursor-pointer transition-colors',
                        isAllCuratedSelected
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                          : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                      <span>
                        {isAllCuratedSelected
                          ? (lang === 'ar' ? 'إلغاء تحديد البوكسات' : 'Deselect All')
                          : (lang === 'ar' ? 'تحديد كل البوكسات للحذف ☑️' : 'Select All Boxes for Delete ☑️')}
                      </span>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={() => setIsAddOfferModalOpen(true)}
                    className="rounded-xl font-bold text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer shrink-0"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'إنشاء بوكس جديد (2-5 كتب) 🎁' : 'Create 2-5 Books Box 🎁'}</span>
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-start border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-black">
                      <th className="p-4 text-center w-12">
                        <input
                          type="checkbox"
                          aria-label={lang === 'ar' ? 'تحديد كل البوكسات للحذف' : 'Select all boxes for delete'}
                          checked={isAllCuratedSelected}
                          ref={el => {
                            if (el) {
                              el.indeterminate = isSomeCuratedSelected && !isAllCuratedSelected
                            }
                          }}
                          onChange={() => handleToggleSelectAll(curatedPacks)}
                          className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-600 cursor-pointer accent-emerald-600"
                          title={
                            isAllCuratedSelected
                              ? (lang === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect all')
                              : (lang === 'ar' ? 'تحديد كل البوكسات للحذف' : 'Select all for delete')
                          }
                        />
                      </th>
                      <th className="p-4 text-start min-w-[260px]">{lang === 'ar' ? 'بوكس القراءة وصورة الغلاف' : 'Book Box & Cover'}</th>
                      <th className="p-4 text-start min-w-[150px]">{lang === 'ar' ? 'العدد والتصنيف' : 'Count & Genre'}</th>
                      <th className="p-4 text-start min-w-[220px]">{lang === 'ar' ? 'الكتب المتضمنة والهدايا' : 'Included Books & Gifts'}</th>
                      <th className="p-4 text-center min-w-[130px]">{lang === 'ar' ? 'سعر البوكس والتوفير' : 'Box Price & Savings'}</th>
                      <th className="p-4 text-center min-w-[140px]">{lang === 'ar' ? 'حالة المنتج في المتجر' : 'Product Status'}</th>
                      <th className="p-4 text-end min-w-[90px]">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {curatedPacks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center">
                          <div className="max-w-md mx-auto space-y-3">
                            <Gift className="h-12 w-12 text-emerald-600/40 mx-auto" />
                            <h4 className="text-sm font-black text-foreground">
                              {lang === 'ar' ? 'لم تقم بإضافة بوكسات قراءة لهذا المتجر بعد' : 'No curated book boxes added yet'}
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {lang === 'ar'
                                ? 'يمكنك إنشاء بوكس هدايا أو حزمة توفير مجهزة من 2 إلى 5 كتب لتظهر مباشرة كمنتج في متجرك وسلة الشراء.'
                                : 'Create custom 2-5 books gift bundles to display as direct products in your store and cart.'}
                            </p>
                            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => setIsAddOfferModalOpen(true)}
                                className="rounded-xl font-bold text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                              >
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span>{lang === 'ar' ? 'إنشاء بوكس قراءة جديد (2-5 كتب) 🎁' : 'Create 2-5 Books Box 🎁'}</span>
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                    {curatedPacks.map(offer => {
                      const effectiveOfferPrice = offer.offer_price || offer.bundle_price || 0
                      const savings =
                        offer.original_price && offer.original_price > effectiveOfferPrice
                          ? offer.original_price - effectiveOfferPrice
                          : null
                      const isSelected = selectedOfferIds.includes(offer.id)

                      return (
                        <tr
                          key={offer.id}
                          className={cn(
                            'transition-colors group',
                            isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/20'
                          )}
                        >
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOffer(offer.id)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                            />
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <OfferCoverThumbnail
                                src={offer.cover_image_url}
                                title={offer.title}
                                offerType={offer.offer_type}
                              />
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="font-black text-foreground text-xs line-clamp-1">
                                    {lang === 'ar' && offer.title_ar ? offer.title_ar : offer.title}
                                  </p>
                                  {offer.badge_text && (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                      {offer.badge_text}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                  {lang === 'ar' && offer.description_ar ? offer.description_ar : offer.description}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="space-y-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                <Package className="h-3 w-3 shrink-0" />
                                <span>{lang === 'ar' ? `باكدج ${offer.book_count || (offer.included_books ? offer.included_books.length : 2)} كتب` : `Curated Pack`}</span>
                              </span>
                              {offer.genre_ar && (
                                <div>
                                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-muted/80 text-muted-foreground border border-border">
                                    {offer.genre_ar}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="space-y-1.5">
                              {offer.included_books && offer.included_books.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-sm">
                                  {offer.included_books.slice(0, 3).map((book, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted/70 border border-border/80 text-[10px] font-semibold text-foreground"
                                    >
                                      <Check className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                                      <span className="truncate max-w-[120px]">{book}</span>
                                    </span>
                                  ))}
                                  {offer.included_books.length > 3 && (
                                    <span className="px-1.5 py-0.5 rounded-lg bg-muted text-[10px] font-bold text-muted-foreground">
                                      +{offer.included_books.length - 3} {lang === 'ar' ? 'إضافي' : 'more'}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-muted-foreground italic">
                                  {offer.book_count ? `${offer.book_count} كتب متضمنة` : 'حسب الاختيار'}
                                </span>
                              )}

                              {offer.gift_description && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                  <Gift className="h-3 w-3 shrink-0 text-amber-600" />
                                  <span className="truncate max-w-[180px]">{offer.gift_description}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="p-4 text-center">
                            <div className="space-y-0.5">
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">
                                {effectiveOfferPrice} ج.م
                              </span>
                              {offer.original_price && offer.original_price > effectiveOfferPrice && (
                                <span className="text-[10px] text-muted-foreground line-through block">
                                  {offer.original_price} ج.م
                                </span>
                              )}
                              {savings && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                  {lang === 'ar' ? `وفر ${savings} ج.م` : `Save ${savings} EGP`}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span>{lang === 'ar' ? 'معروض كمنتج في السلة 🛒' : 'Active in Basket 🛒'}</span>
                            </span>
                          </td>

                          <td className="p-4 text-end">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditOffer(offer)}
                                className="h-8 w-8 p-0 rounded-xl text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                                title={lang === 'ar' ? 'تعديل تفاصيل الباكدج' : 'Edit Pack'}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteOffer(offer.id)}
                                className="h-8 w-8 p-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                                title={lang === 'ar' ? 'حذف الباكدج' : 'Delete Pack'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* CARDS GRID VIEW FOR CURATED PACKS */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {curatedPacks.map(offer => {
                const effectiveOfferPrice = offer.offer_price || offer.bundle_price || 0
                const savings =
                  offer.original_price && offer.original_price > effectiveOfferPrice
                    ? offer.original_price - effectiveOfferPrice
                    : null
                const isSelected = selectedOfferIds.includes(offer.id)

                return (
                  <div
                    key={offer.id}
                    className={cn(
                      'rounded-3xl border-2 bg-card overflow-hidden shadow-xs flex flex-col justify-between transition-all relative',
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/5'
                        : 'border-emerald-500/30 hover:border-emerald-500/60'
                    )}
                  >
                    {/* Top End Selection Checkbox */}
                    <div className="absolute top-3 end-3 z-20">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOffer(offer.id)}
                        className="h-5 w-5 rounded border-border text-emerald-600 focus:ring-emerald-600 cursor-pointer accent-emerald-600 shadow-md bg-background/90 backdrop-blur-xs"
                        title={isSelected ? (lang === 'ar' ? 'إلغاء تحديد البوكس' : 'Deselect box') : (lang === 'ar' ? 'تحديد للحذف' : 'Select for delete')}
                      />
                    </div>

                    {offer.cover_image_url && (
                      <div className="relative h-44 w-full bg-muted overflow-hidden border-b border-border">
                        <Image
                          src={offer.cover_image_url}
                          alt={offer.title}
                          fill
                          unoptimized
                          className="object-cover hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute top-3 start-3 flex flex-wrap items-center gap-1.5 pe-10">
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-md">
                            {offer.badge_text || (lang === 'ar' ? 'باكدج مجهز كمنتج' : 'Curated Pack Product')}
                          </span>
                          {offer.genre_ar && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md bg-black/60 text-white border border-white/20">
                              {offer.genre_ar}
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-3 start-3 end-3 flex items-center justify-between text-white">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <Package className="h-4 w-4 text-emerald-400" />
                            {offer.book_count || (offer.included_books ? offer.included_books.length : 2)}{' '}
                            {lang === 'ar' ? 'كتب في الباكدج' : 'books pack'}
                          </span>
                          {savings && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500 text-white shadow-xs">
                              {lang === 'ar' ? `وفر ${savings} ج.م` : `Save ${savings} EGP`}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            <Package className="h-3 w-3 shrink-0" />
                            <span>{lang === 'ar' ? `باكدج ${offer.book_count || (offer.included_books ? offer.included_books.length : 2)} كتب` : 'Curated Pack'}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>{lang === 'ar' ? 'معروض كمنتج في السلة 🛒' : 'In Basket 🛒'}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEditOffer(offer)}
                            className="h-8 w-8 p-0 rounded-xl text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                            title={lang === 'ar' ? 'تعديل تفاصيل الباكدج' : 'Edit Pack'}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteOffer(offer.id)}
                            className="h-8 w-8 p-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                            title={lang === 'ar' ? 'حذف الباكدج' : 'Delete Pack'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-base font-black text-foreground">
                          {lang === 'ar' && offer.title_ar ? offer.title_ar : offer.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {lang === 'ar' && offer.description_ar ? offer.description_ar : offer.description}
                        </p>
                      </div>

                      {offer.included_books && offer.included_books.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-muted-foreground block">
                            {lang === 'ar' ? 'الكتب المتضمنة في هذا الباكدج:' : 'Included books in this pack:'}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {offer.included_books.map((bookTitle, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-muted/60 border border-border text-[11px] font-bold text-foreground"
                              >
                                <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                                <span>{bookTitle}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {offer.gift_description && (
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                          <Gift className="h-4 w-4 shrink-0 text-amber-600" />
                          <span>{offer.gift_description}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 pt-3 border-t border-border flex items-center justify-between bg-muted/10">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold block">
                          {lang === 'ar' ? 'سعر الباكدج الخاص كمنتج:' : 'Pack Offer Price:'}
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{effectiveOfferPrice} ج.م</span>
                          {offer.original_price && offer.original_price > effectiveOfferPrice && (
                            <span className="text-xs text-muted-foreground line-through">
                              {offer.original_price} ج.م
                            </span>
                          )}
                        </div>
                      </div>

                      {savings ? (
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {lang === 'ar' ? `توفير ${savings} ج.م 💥` : `Save ${savings} EGP 💥`}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Offer Templates & Series Picker */}
      {isTemplatePickerOpen && (
        <OfferTemplatesPicker
          storeId={activeStoreId}
          existingOffers={offers}
          onClose={() => setIsTemplatePickerOpen(false)}
          onPublished={(created, removedIds) => {
            setOffers(prev => {
              const filtered = prev.filter(o => !removedIds.includes(o.id))
              return [...created, ...filtered]
            })
            setIsTemplatePickerOpen(false)
          }}
          onCreateCustom={() => {
            setIsTemplatePickerOpen(false)
            setIsAddOfferModalOpen(true)
          }}
        />
      )}

      {/* Modal: Add Offer */}
      <AddOfferModal
        isOpen={isAddOfferModalOpen}
        onClose={() => setIsAddOfferModalOpen(false)}
        newOffer={newOffer}
        setNewOffer={setNewOffer}
        onSubmit={handleAddOffer}
        isUploadingOfferCover={isUploadingOfferCover}
        onOfferCoverFileChange={e => handleOfferCoverFileChange(e, false)}
        lang={lang}
      />

      {/* Modal: Edit Offer */}
      <EditOfferModal
        isOpen={isEditOfferModalOpen}
        offer={editingOffer}
        onClose={handleCloseEditOffer}
        onSave={handleSaveEditOffer}
        isUploadingOfferCover={isUploadingOfferCover}
        onOfferCoverFileChange={e => handleOfferCoverFileChange(e, true)}
        lang={lang}
      />
    </div>
  )
}
