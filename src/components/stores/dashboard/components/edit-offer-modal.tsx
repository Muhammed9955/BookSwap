'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Edit3,
  Package,
  Flame,
  Sparkles,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  Trash2,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { StoreOffer } from '@/types/store'

interface EditOfferModalProps {
  isOpen: boolean
  offer: StoreOffer | null
  onClose: () => void
  onSave: (updatedOffer: StoreOffer) => void
  isUploadingOfferCover?: boolean
  onOfferCoverFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  lang: 'ar' | 'en'
}

export function EditOfferModal({
  isOpen,
  offer,
  onClose,
  onSave,
  isUploadingOfferCover = false,
  onOfferCoverFileChange,
  lang,
}: EditOfferModalProps) {
  const [formData, setFormData] = useState<Partial<StoreOffer> & { included_books_text?: string }>({})

  useEffect(() => {
    if (offer) {
      setFormData({
        ...offer,
        included_books_text: (offer.included_books || []).join('\n'),
      })
    }
  }, [offer])

  if (!isOpen || !offer) return null

  const isPack = offer.offer_type === 'CURATED_PACK'
  const isSeries = offer.offer_type === 'SERIES'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    let includedBooksList: string[] = []
    if (formData.included_books_text) {
      includedBooksList = formData.included_books_text
        .split(/[\n,،]+/)
        .map(s => s.trim())
        .filter(Boolean)
    }

    const effectiveOfferPrice = formData.offer_price || formData.bundle_price || 0
    const calcDiscount =
      formData.original_price && formData.original_price > effectiveOfferPrice
        ? Math.round(((formData.original_price - effectiveOfferPrice) / formData.original_price) * 100)
        : formData.discount_pct

    const updated: StoreOffer = {
      ...offer,
      title: formData.title || offer.title,
      title_ar: formData.title_ar,
      description: formData.description,
      description_ar: formData.description_ar,
      badge_text: formData.badge_text,
      book_count: formData.book_count ? Number(formData.book_count) : offer.book_count,
      genre: formData.genre,
      genre_ar: formData.genre_ar,
      included_books: includedBooksList.length > 0 ? includedBooksList : offer.included_books,
      original_price: formData.original_price !== undefined ? Number(formData.original_price) : offer.original_price,
      offer_price: Number(effectiveOfferPrice),
      bundle_price: Number(effectiveOfferPrice),
      bundle_buy_qty: formData.bundle_buy_qty ? Number(formData.bundle_buy_qty) : offer.bundle_buy_qty,
      discount_pct: calcDiscount,
      gift_description: formData.gift_description,
      promo_code: formData.promo_code ? formData.promo_code.toUpperCase() : undefined,
      cover_image_url: formData.cover_image_url,
      updated_at: new Date().toISOString(),
    }

    onSave(updated)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="rounded-3xl border-2 border-border bg-card p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-black text-foreground text-sm flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-primary" />
            <span>
              {isPack
                ? (lang === 'ar' ? 'تعديل تفاصيل بوكس القراءة 🎁' : 'Edit Curated Reading Box 🎁')
                : (lang === 'ar' ? 'تعديل تفاصيل العرض / السلسلة' : 'Edit Deal / Series Details')}
            </span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title in Arabic and English */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">
              {lang === 'ar' ? 'عنوان الباقة أو العرض (بالعربية) *' : 'Offer Title (Arabic) *'}
            </label>
            <input
              type="text"
              required
              value={formData.title_ar || ''}
              onChange={e => setFormData(prev => ({ ...prev, title_ar: e.target.value }))}
              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                {lang === 'ar' ? 'شارة العرض (Badge)' : 'Badge Text'}
              </label>
              <input
                type="text"
                value={formData.badge_text || ''}
                onChange={e => setFormData(prev => ({ ...prev, badge_text: e.target.value }))}
                placeholder="ثنائية التوفير 🔥"
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                {lang === 'ar' ? 'التصنيف / القسم' : 'Genre / Category'}
              </label>
              <input
                type="text"
                value={formData.genre_ar || ''}
                onChange={e => setFormData(prev => ({ ...prev, genre_ar: e.target.value }))}
                placeholder="روايات وأدب"
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Included Books for Packs */}
          {(isPack || isSeries || (formData.included_books && formData.included_books.length > 0)) && (
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-primary/5 border border-primary/20">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>{lang === 'ar' ? 'الكتب المتضمنة في هذا الباكدج (سطر لكل كتاب)' : 'Included Book Titles'}</span>
                {formData.book_count && (
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {formData.book_count} {lang === 'ar' ? 'كتب' : 'books'}
                  </span>
                )}
              </label>
              <textarea
                rows={3}
                value={formData.included_books_text || ''}
                onChange={e => setFormData(prev => ({ ...prev, included_books_text: e.target.value }))}
                className="w-full bg-card border border-border rounded-xl p-2.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary resize-none"
              />
            </div>
          )}

          {/* Pricing Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                {lang === 'ar' ? 'السعر الأصلي قبل الخصم (ج.م)' : 'Original Price (EGP)'}
              </label>
              <input
                type="number"
                min={0}
                value={formData.original_price || ''}
                onChange={e => setFormData(prev => ({ ...prev, original_price: Number(e.target.value) }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                {lang === 'ar' ? 'سعر العرض المطلوب (ج.م) *' : 'Offer Price (EGP) *'}
              </label>
              <input
                type="number"
                min={1}
                required
                value={formData.offer_price || formData.bundle_price || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    offer_price: Number(e.target.value),
                    bundle_price: Number(e.target.value),
                  }))
                }
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Cover image upload & preview */}
          <div className="space-y-2.5 rounded-2xl border border-border bg-muted/20 p-3.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                <span>{lang === 'ar' ? 'صورة غلاف أو بوستر العرض' : 'Cover Image / Poster'}</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {lang === 'ar' ? 'ارفع من جهازك أو ضع رابط صورة مباشر' : 'Upload or enter direct URL'}
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={cn(
                  'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary bg-card text-xs font-bold text-primary cursor-pointer transition-colors shadow-xs text-center',
                  isUploadingOfferCover && 'opacity-50 pointer-events-none'
                )}
              >
                {isUploadingOfferCover ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>{lang === 'ar' ? 'جاري رفع الغلاف...' : 'Uploading...'}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 text-primary" />
                    <span>{lang === 'ar' ? 'تغيير الغلاف من جهازك 📷' : 'Upload cover 📷'}</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingOfferCover}
                  onChange={e => {
                    if (onOfferCoverFileChange) {
                      onOfferCoverFileChange(e)
                    }
                  }}
                />
              </label>

              <div>
                <input
                  type="url"
                  value={formData.cover_image_url || ''}
                  onChange={e => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                  placeholder="https://..."
                />
              </div>
            </div>

            {formData.cover_image_url && (
              <div className="relative h-28 w-full rounded-xl overflow-hidden border border-border bg-muted mt-2 group">
                <Image
                  src={formData.cover_image_url}
                  alt="Cover Preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between p-2.5 text-white">
                  <span className="text-[11px] font-bold">
                    {lang === 'ar' ? 'معاينة الغلاف' : 'Cover Preview'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, cover_image_url: '' }))}
                    className="p-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>{lang === 'ar' ? 'إزالة' : 'Remove'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Gift Description & Promo Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                {lang === 'ar' ? 'الهدايا المرفقة المجانية' : 'Free Gift Description'}
              </label>
              <input
                type="text"
                value={formData.gift_description || ''}
                onChange={e => setFormData(prev => ({ ...prev, gift_description: e.target.value }))}
                placeholder={lang === 'ar' ? 'فاصل قراءة خشبي محفور 🔖' : 'Free Bookmark 🔖'}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                {lang === 'ar' ? 'كود الخصم الترويجي' : 'Promo Code'}
              </label>
              <input
                type="text"
                value={formData.promo_code || ''}
                onChange={e => setFormData(prev => ({ ...prev, promo_code: e.target.value.toUpperCase() }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">
              {lang === 'ar' ? 'الوصف والتفاصيل' : 'Description'}
            </label>
            <textarea
              rows={2}
              value={formData.description_ar || formData.description || ''}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  description_ar: e.target.value,
                  description: e.target.value,
                }))
              }
              className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs font-medium text-foreground focus:outline-none focus:border-primary resize-none"
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
              className="rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>{lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
