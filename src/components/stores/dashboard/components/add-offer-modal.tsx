import React from 'react'
import Image from 'next/image'
import { Flame, Package, Gift, Image as ImageIcon, UploadCloud, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AddOfferModalProps {
  isOpen: boolean
  onClose: () => void
  newOffer: {
    offer_type: 'CURATED_PACK' | 'BUNDLE'
    title: string
    title_ar: string
    description: string
    description_ar: string
    book_count: number
    genre: string
    genre_ar: string
    included_books_text: string
    badge_text: string
    original_price: number
    offer_price: number
    bundle_buy_qty: number
    bundle_price: number
    discount_pct: number
    gift_description: string
    promo_code: string
    cover_image_url: string
  }
  setNewOffer: React.Dispatch<React.SetStateAction<any>>
  onSubmit: (e: React.FormEvent) => void
  isUploadingOfferCover?: boolean
  onOfferCoverFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  lang: 'ar' | 'en'
}

export function AddOfferModal({
  isOpen,
  onClose,
  newOffer,
  setNewOffer,
  onSubmit,
  isUploadingOfferCover = false,
  onOfferCoverFileChange,
  lang,
}: AddOfferModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="rounded-3xl border-2 border-border bg-card p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-black text-foreground text-sm flex items-center gap-2">
              <Gift className="h-4 w-4 text-emerald-600" />
              <span>{lang === 'ar' ? 'إنشاء بوكس قراءة وحزمة كتب مجهزة (2 إلى 5 كتب) 🎁' : 'Create Curated Book Box (2-5 Books) 🎁'}</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {lang === 'ar'
                ? 'بوكس قراءة مجهز بصورة غلاف وسعر خاص يُباع كمنتج مستقل يُضاف مباشرة لسلة المشتري.'
                : 'Curated book box sold as an add-to-basket product with special price and cover image.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'عنوان بوكس القراءة *' : 'Reading Box Title *'}</label>
            <input
              type="text"
              required
              value={newOffer.title_ar}
              onChange={e => setNewOffer((prev: any) => ({ ...prev, title_ar: e.target.value }))}
              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              placeholder={lang === 'ar' ? 'مثال: ثنائية أحمد مراد (الفيل الأزرق + تراب الماس)' : 'e.g. Ahmed Mourad Thriller Duo'}
            />
          </div>

          {/* Curated 2-5 Books Options */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'عدد الكتب في الباكدج (2 إلى 5) *' : 'Books Count (2-5) *'}</label>
                <select
                  value={newOffer.book_count}
                  onChange={e => {
                    const count = Number(e.target.value)
                    const badges: Record<number, string> = {
                      2: 'ثنائية التوفير 🔥',
                      3: 'ثلاثية التوفير 🔥',
                      4: 'رباعية التوفير 🔥',
                      5: 'خماسية التوفير الكبرى 🔥',
                    }
                    setNewOffer((prev: any) => ({
                      ...prev,
                      book_count: count,
                      badge_text: prev.badge_text || badges[count] || `باكدج ${count} كتب 🔥`,
                    }))
                  }}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value={2}>{lang === 'ar' ? '2 كتب (ثنائية)' : '2 Books (Duo)'}</option>
                  <option value={3}>{lang === 'ar' ? '3 كتب (ثلاثية)' : '3 Books (Trio)'}</option>
                  <option value={4}>{lang === 'ar' ? '4 كتب (رباعية)' : '4 Books (Quartet)'}</option>
                  <option value={5}>{lang === 'ar' ? '5 كتب (خماسية)' : '5 Books (Quintet)'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'التصنيف الأدبي' : 'Genre'}</label>
                <select
                  value={newOffer.genre}
                  onChange={e => {
                    const val = e.target.value
                    const arNames: Record<string, string> = {
                      NOVELS: 'روايات وأدب',
                      PSYCHOLOGY: 'علم نفس وتطوير ذات',
                      ISLAMIC: 'فكر ودين',
                      HISTORY: 'تاريخ وسير',
                      PHILOSOPHY: 'فلسفة وفكر',
                      THRILLER: 'غموض وتشويق ورعب',
                    }
                    setNewOffer((prev: any) => ({ ...prev, genre: val, genre_ar: arNames[val] || val }))
                  }}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="NOVELS">{lang === 'ar' ? 'روايات وأدب' : 'Novels & Fiction'}</option>
                  <option value="PSYCHOLOGY">{lang === 'ar' ? 'علم نفس وتطوير ذات' : 'Self-help'}</option>
                  <option value="ISLAMIC">{lang === 'ar' ? 'فكر ودين' : 'Islamic & Philosophy'}</option>
                  <option value="HISTORY">{lang === 'ar' ? 'تاريخ وسير' : 'History & Biography'}</option>
                  <option value="THRILLER">{lang === 'ar' ? 'غموض وتشويق ورعب' : 'Thriller & Mystery'}</option>
                  <option value="PHILOSOPHY">{lang === 'ar' ? 'فلسفة وفكر' : 'Philosophy'}</option>
                </select>
              </div>
            </div>

            {/* Badge Text */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'شارة العرض الترويجية (Badge)' : 'Promo Badge'}</label>
              <input
                type="text"
                value={newOffer.badge_text}
                onChange={e => setNewOffer((prev: any) => ({ ...prev, badge_text: e.target.value }))}
                placeholder={lang === 'ar' ? 'ثنائية التوفير 🔥' : 'Special Duo 🔥'}
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Included books list */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>{lang === 'ar' ? 'عناوين الكتب المتضمنة في الباكدج *' : 'Included Book Titles in Package *'}</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  {lang === 'ar' ? 'اكتب كل كتاب في سطر أو افصل بفواصل' : 'One per line or comma-separated'}
                </span>
              </label>
              <textarea
                rows={2}
                required
                value={newOffer.included_books_text}
                onChange={e => setNewOffer((prev: any) => ({ ...prev, included_books_text: e.target.value }))}
                placeholder={lang === 'ar' ? 'مثال: الفيل الأزرق، تراب الماس' : 'e.g. The Blue Elephant, Vertigo'}
                className="w-full bg-card border border-border rounded-xl p-2.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary resize-none"
              />
            </div>
          </div>

          {/* Cover Image: Upload from Device or Direct URL */}
          <div className="space-y-2.5 rounded-2xl border border-border bg-muted/20 p-3.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-orange-500" />
                <span>{lang === 'ar' ? 'صورة غلاف الباقة أو العرض' : 'Bundle Cover Image'}</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {lang === 'ar' ? 'ارفع من جهازك أو ضع رابط صورة مباشر' : 'Upload or enter direct image URL'}
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={cn(
                  'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-orange-500/30 hover:border-orange-500 bg-card text-xs font-bold text-orange-600 dark:text-orange-400 cursor-pointer transition-colors shadow-xs text-center',
                  isUploadingOfferCover && 'opacity-50 pointer-events-none'
                )}
              >
                {isUploadingOfferCover ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                    <span>{lang === 'ar' ? 'جاري رفع الغلاف...' : 'Uploading cover...'}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 text-orange-500" />
                    <span>{lang === 'ar' ? 'رفع غلاف من جهازك 📷' : 'Upload from device 📷'}</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingOfferCover}
                  onChange={onOfferCoverFileChange}
                />
              </label>

              <div>
                <input
                  type="url"
                  value={newOffer.cover_image_url}
                  onChange={e => setNewOffer((prev: any) => ({ ...prev, cover_image_url: e.target.value }))}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-orange-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Live Cover Preview */}
            {newOffer.cover_image_url && (
              <div className="relative h-28 w-full rounded-xl overflow-hidden border border-border bg-muted mt-2 group">
                <Image
                  src={newOffer.cover_image_url}
                  alt="Cover Preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between p-2.5 text-white">
                  <span className="text-[11px] font-bold">
                    {lang === 'ar' ? 'معاينة غلاف الباقة' : 'Bundle Cover Preview'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewOffer((prev: any) => ({ ...prev, cover_image_url: '' }))}
                    className="p-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>{lang === 'ar' ? 'إزالة' : 'Remove'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'السعر الأصلي قبل الخصم (ج.م)' : 'Original Price (EGP)'}</label>
              <input
                type="number"
                min={1}
                value={newOffer.original_price}
                onChange={e => setNewOffer((prev: any) => ({ ...prev, original_price: Number(e.target.value) }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                placeholder="340"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'سعر الباكدج المطلوب (ج.م) *' : 'Package Price (EGP) *'}</label>
                {newOffer.original_price && newOffer.original_price > (newOffer.offer_price || 0) && (
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {lang === 'ar' ? `وفرت ${newOffer.original_price - newOffer.offer_price} ج.م` : `Save ${newOffer.original_price - newOffer.offer_price} EGP`}
                  </span>
                )}
              </div>
              <input
                type="number"
                min={1}
                required
                value={newOffer.offer_price}
                onChange={e => setNewOffer((prev: any) => ({ ...prev, offer_price: Number(e.target.value) }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                placeholder="210"
              />
            </div>
          </div>

          {/* Gift & Promo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'الهدايا المجانية المرفقة مع الباكدج' : 'Free Gift Description'}</label>
              <input
                type="text"
                value={newOffer.gift_description}
                onChange={e => setNewOffer((prev: any) => ({ ...prev, gift_description: e.target.value }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                placeholder={lang === 'ar' ? 'فاصل قراءة خشبي محفور مجاناً 🔖' : 'Free Bookmark 🔖'}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'كود الخصم الترويجي (اختياري)' : 'Promo Code (Optional)'}</label>
              <input
                type="text"
                value={newOffer.promo_code}
                onChange={e => setNewOffer((prev: any) => ({ ...prev, promo_code: e.target.value.toUpperCase() }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary"
                placeholder="DIWAN20"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'تفاصيل ووصف الباكدج' : 'Package Details'}</label>
            <textarea
              rows={2}
              value={newOffer.description_ar}
              onChange={e => setNewOffer((prev: any) => ({ ...prev, description_ar: e.target.value }))}
              placeholder={lang === 'ar' ? 'اكتب تفاصيل إضافية عن الباكدج أو الشروط...' : 'Write extra details about the deal...'}
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
              className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md shadow-emerald-600/20"
            >
              {lang === 'ar' ? 'نشر باكدج الكتب كمنتج في المتجر والسلة 🚀' : 'Publish Package as Product 🚀'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
