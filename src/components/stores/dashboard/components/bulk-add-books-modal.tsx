import React, { useState } from 'react'
import Image from 'next/image'
import {
  ListPlus,
  Tag,
  Check,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Edit2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Star,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BookCondition } from '@/types/store'
import type { BulkParsedBook } from '../hooks/use-bulk-import'

interface BulkAddBooksModalProps {
  isOpen: boolean
  onClose: () => void
  bulkBooksText: string
  setBulkBooksText: (text: string) => void
  bulkDefaultPrice: number
  setBulkDefaultPrice: (price: number) => void
  bulkDefaultQty: number
  setBulkDefaultQty: (qty: number) => void
  bulkDefaultCondition: BookCondition
  setBulkDefaultCondition: (cond: BookCondition) => void
  isBulkImporting: boolean
  sampleBulkList: string
  parsedBulkBooks: BulkParsedBook[]
  onExecuteImport: () => void
  isAutoEnriching?: boolean
  enrichProgress?: { done: number; total: number }
  onAutoEnrich?: () => void
  onUpdateItem?: (id: string, updates: any) => void
  ignoredGibberishCount?: number
  lang: 'ar' | 'en'
}

export function BulkAddBooksModal({
  isOpen,
  onClose,
  bulkBooksText,
  setBulkBooksText,
  bulkDefaultPrice,
  setBulkDefaultPrice,
  bulkDefaultQty,
  setBulkDefaultQty,
  bulkDefaultCondition,
  setBulkDefaultCondition,
  isBulkImporting,
  sampleBulkList,
  parsedBulkBooks,
  onExecuteImport,
  isAutoEnriching = false,
  enrichProgress = { done: 0, total: 0 },
  onAutoEnrich,
  onUpdateItem,
  ignoredGibberishCount = 0,
  lang,
}: BulkAddBooksModalProps) {
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [editCoverInput, setEditCoverInput] = useState('')
  const [editDescInput, setEditDescInput] = useState('')

  function BulkCoverImage({ src, title }: { src?: string; title: string }) {
    const [error, setError] = useState(false)
    if (!src || error) {
      return (
        <Image
          src="/images/book-placeholder.svg"
          alt={title}
          fill
          className="object-cover p-1"
        />
      )
    }
    return (
      <Image
        src={src}
        alt={title}
        fill
        unoptimized
        className="object-cover"
        onError={() => setError(true)}
      />
    )
  }

  if (!isOpen) return null

  const realMatchedCount = parsedBulkBooks.filter(b => b.hasRealCover && b.hasRealDesc).length

  const handleStartEditRow = (item: BulkParsedBook) => {
    setEditingRowId(item.id)
    setEditCoverInput(item.cover_url || '')
    setEditDescInput(item.description || '')
  }

  const handleSaveEditRow = (id: string) => {
    if (onUpdateItem) {
      onUpdateItem(id, {
        cover_url: editCoverInput.trim() || undefined,
        description: editDescInput.trim() || undefined,
        description_ar: editDescInput.trim() || undefined,
        hasRealCover: Boolean(editCoverInput.trim()),
        hasRealDesc: Boolean(editDescInput.trim()),
      })
    }
    setEditingRowId(null)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="rounded-3xl border-2 border-border bg-card p-6 w-full max-w-3xl shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ListPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-foreground text-sm flex items-center gap-1.5">
                <span>{lang === 'ar' ? 'استيراد سريع لقائمة كتب (بيانات غنية كاملة) ⚡' : 'Bulk Books Import with Full Rich Metadata'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Rich Data Auto-Sync
                </span>
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {lang === 'ar'
                  ? 'الصق قائمة عناوين الكتب. يتعرف النظام تلقائياً على العناوين ويجلب الغلاف، الكاتب وسيرته، التقييم، عدد الصفحات، تاريخ النشر، دار النشر، والـ ISBN.'
                  : 'Paste book titles line by line. Automatically pulls cover image, author bio & photo, rating, page count, publish date, publisher & ISBN.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Sample List Demo Shortcut */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-primary/5 border border-primary/20 text-xs">
          <span className="font-bold text-foreground text-[11px]">
            {lang === 'ar' ? '💡 هل تود تجربة قائمة الـ 14 عنواناً الجاهزة؟' : '💡 Try sample 14-books list:'}
          </span>
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={() => setBulkBooksText(sampleBulkList)}
            className="h-7 text-[11px] font-black rounded-xl border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
          >
            📋 {lang === 'ar' ? 'لصق القائمة النموذجية بنقرة' : 'Paste Sample List'}
          </Button>
        </div>

        {/* Textarea for Bulk Titles */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <label>
              {lang === 'ar'
                ? 'قائمة عناوين الكتب أو الباركود (يدعم: عنوان، عنوان - مؤلف، أو عنوان | مؤلف | سعر | كمية) *'
                : 'Book Titles or Barcodes (Supports: Title, Title - Author, or Title | Author | Price | Qty) *'}
            </label>
            <span className="text-[11px] text-primary font-black">
              {parsedBulkBooks.length} {lang === 'ar' ? 'كتاب تم التعرف عليه' : 'books detected'}
            </span>
          </div>
          <textarea
            rows={5}
            value={bulkBooksText}
            onChange={e => setBulkBooksText(e.target.value)}
            placeholder={`الغيهب\nنادر فودة ال2\nالطريق الي الله\nفاتتني صلاة\nمر مثل القهوة حلو مثل الشيكولاتة\nعقل بلا جسد\nالدحيح\nمدرسة ميلر\nحارة الجزار\nكن اقوي من مشاعرك\nاسرار سورة البقرة\nسر الغرفة 207\nفكر كان طبيب نفسي\nقوة الان\n1984\nالعادات الذرية`}
            className="w-full bg-muted/40 border border-border rounded-2xl p-3 text-xs font-mono text-foreground focus:outline-none focus:border-primary leading-relaxed shadow-inner"
          />
          {ignoredGibberishCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>
                {lang === 'ar'
                  ? `تم تلقائياً تصفية واستبعاد ${ignoredGibberishCount} سطر (نصوص عشوائية أو غير صالحة كعناوين كتب).`
                  : `Filtered out ${ignoredGibberishCount} invalid/gibberish line(s).`}
              </span>
            </div>
          )}
        </div>

        {/* Bulk Defaults Controller Bar */}
        <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
          <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-primary" />
            <span>{lang === 'ar' ? 'الإعدادات الموحدة لجميع كتب هذه الدفعة:' : 'Unified Defaults for Batch:'}</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground">{lang === 'ar' ? 'السعر الموحد للكتاب (ج.م) *' : 'Default Price (EGP) *'}</label>
              <input
                type="number"
                min={1}
                required
                value={bulkDefaultPrice}
                onChange={e => setBulkDefaultPrice(Number(e.target.value))}
                className="w-full bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground">{lang === 'ar' ? 'الكمية المتوفرة لكل عنوان *' : 'Default Quantity *'}</label>
              <input
                type="number"
                min={1}
                required
                value={bulkDefaultQty}
                onChange={e => setBulkDefaultQty(Number(e.target.value))}
                className="w-full bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground">{lang === 'ar' ? 'حالة النسخ المضافة' : 'Book Condition'}</label>
              <select
                value={bulkDefaultCondition}
                onChange={e => setBulkDefaultCondition(e.target.value as BookCondition)}
                className="w-full bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="NEW">{lang === 'ar' ? 'جديد (New / غير مستعمل)' : 'New'}</option>
                <option value="LIKE_NEW">{lang === 'ar' ? 'كالجديد (Like New)' : 'Like New'}</option>
                <option value="VERY_GOOD">{lang === 'ar' ? 'جيد جداً (Very Good)' : 'Very Good'}</option>
                <option value="GOOD">{lang === 'ar' ? 'جيد (Good)' : 'Good'}</option>
                <option value="ACCEPTABLE">{lang === 'ar' ? 'طبعة شعبية / مقروءة' : 'Acceptable'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Real Cover & Description Auto-Enrichment Toolbar */}
        {parsedBulkBooks.length > 0 && onAutoEnrich && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-primary/5 to-card border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {realMatchedCount} / {parsedBulkBooks.length} {lang === 'ar' ? 'أغلفة وتفاصيل غنية كاملة موثقة' : 'fully enriched books'}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {lang === 'ar'
                  ? 'يتأكد النظام من إرفاق الأغلفة الملونة العالية الدقة والوصف الأدبي وتقييم القراء وتفاصيل الكاتب لكل كتاب.'
                  : 'Ensures correct high-res cover photos, detailed descriptions, ratings, and author profiles are linked.'}
              </p>
            </div>

            <Button
              size="sm"
              type="button"
              disabled={isAutoEnriching}
              onClick={onAutoEnrich}
              className="rounded-xl font-black text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 cursor-pointer shadow-xs"
            >
              {isAutoEnriching ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>
                    {lang === 'ar'
                      ? `جاري جلب البيانات (${enrichProgress.done}/${enrichProgress.total})...`
                      : `Fetching (${enrichProgress.done}/${enrichProgress.total})...`}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? '🔍 جلب كافة البيانات الغنية تلقائياً' : '🔍 Auto-Fetch All Rich Metadata'}</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Live Preview List with Real Covers & Descriptions */}
        {parsedBulkBooks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span>{lang === 'ar' ? 'معاينة تفاصيل وأغلفة الكتب قبل الإضافة:' : 'Live Books Preview:'}</span>
              <span className="text-[11px] text-muted-foreground">
                {lang === 'ar'
                  ? `إجمالي النسخ: ${parsedBulkBooks.length * bulkDefaultQty} نسخة | القيمة: ${parsedBulkBooks.length * bulkDefaultQty * bulkDefaultPrice} ج.م`
                  : `Total copies: ${parsedBulkBooks.length * bulkDefaultQty}`}
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2.5 border border-border/80 rounded-2xl p-2 bg-muted/20">
              {parsedBulkBooks.map((item, idx) => {
                const isEditingThis = editingRowId === item.id
                const isExpanded = expandedRowId === item.id

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-card border border-border/70 text-xs shadow-xs space-y-2.5 transition-all hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="font-mono text-[10px] text-muted-foreground w-4 text-center mt-1">
                          {idx + 1}
                        </span>

                        {/* Cover Image */}
                        <div className="relative h-16 w-11 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/80 shadow-xs">
                          <BulkCoverImage src={item.cover_url} title={item.title} />
                        </div>

                        <div className="min-w-0 space-y-1.5 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-black text-xs text-foreground truncate">{item.title}</p>
                            {item.first_published && (
                              <span className="text-[9px] font-bold text-muted-foreground bg-muted/70 px-1.5 py-0.2 rounded border border-border/50">
                                {item.first_published}
                              </span>
                            )}
                          </div>

                          {/* Author & Author Portrait Chip */}
                          <div className="flex items-center gap-2">
                            {item.author_details?.image_url && (
                              <div className="relative h-5 w-5 rounded-full overflow-hidden border border-primary/30 shrink-0">
                                <Image
                                  src={item.author_details.image_url}
                                  alt={item.author_details.name || item.author}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <p className="text-[11px] font-bold text-muted-foreground truncate">
                              {item.author} • <span className="text-primary/90">{item.category_name}</span>
                            </p>
                          </div>

                          {/* Rich Metadata Badges: Rating, Pages, Publisher, ISBN */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {item.rating && (
                              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border border-amber-500/20">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                <span>{item.rating.toFixed(1)}</span>
                                {item.rating_count ? <span className="opacity-70 text-[9px]">({item.rating_count.toLocaleString()})</span> : null}
                              </span>
                            )}

                            {item.pages_count && (
                              <span className="text-[9px] font-semibold text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded-md border border-border/60">
                                📄 {item.pages_count} {lang === 'ar' ? 'صفحة' : 'pages'}
                              </span>
                            )}

                            {item.publisher && (
                              <span className="text-[9px] text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded-md border border-border/60 truncate max-w-[150px]">
                                🏢 {item.publisher}
                              </span>
                            )}

                            {item.isbn && (
                              <span className="text-[9px] font-mono text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded-md border border-border/60">
                                ISBN: {item.isbn}
                              </span>
                            )}

                            {item.goodreads_url && (
                              <a
                                href={item.goodreads_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] font-serif font-black text-[#54381e] dark:text-[#f4ebd0] bg-[#54381e]/10 dark:bg-[#f4ebd0]/10 px-1.5 py-0.5 rounded-md hover:underline inline-flex items-center gap-0.5"
                              >
                                <span>goodreads</span>
                                <ExternalLink className="h-2 w-2" />
                              </a>
                            )}
                          </div>

                          {/* Synopsis preview */}
                          {item.description && (
                            <p className="text-[10px] text-muted-foreground/90 line-clamp-1 leading-relaxed pt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                            {item.price} ج.م
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-bold text-[11px]">
                            {item.stock_quantity} نسخة
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {item.hasRealCover && item.hasRealDesc ? (
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                              ✓ {lang === 'ar' ? 'بيانات كاملة موثقة' : 'Verified'}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                              {lang === 'ar' ? 'يحتاج استخراج' : 'Needs Fetch'}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                            title={lang === 'ar' ? 'عرض التفاصيل الكاملة' : 'View full details'}
                          >
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => (isEditingThis ? handleSaveEditRow(item.id) : handleStartEditRow(item))}
                            className="p-1 rounded-lg text-primary hover:bg-primary/10 cursor-pointer"
                            title={lang === 'ar' ? 'تعديل الغلاف أو الوصف يدوياً' : 'Edit cover or description'}
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Rich Author & Book Details Drawer */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-border/60 bg-muted/30 p-3 rounded-xl space-y-2 animate-in fade-in">
                        {/* Author Bio with Image */}
                        {item.author_details && (
                          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-card border border-border/80">
                            {item.author_details.image_url ? (
                              <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0 border border-primary/20">
                                <Image
                                  src={item.author_details.image_url}
                                  alt={item.author_details.name || item.author}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                                ✍️
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-foreground">
                                {item.author_details.name || item.author}
                              </p>
                              {item.author_details.bio && (
                                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed mt-0.5">
                                  {item.author_details.bio}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Full Synopsis */}
                        {item.description && (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-muted-foreground">{lang === 'ar' ? 'النبذة الكاملة:' : 'Full Synopsis:'}</span>
                            <p className="text-[11px] text-foreground leading-relaxed bg-card p-2 rounded-xl border border-border/70">
                              {item.description}
                            </p>
                          </div>
                        )}

                        {/* Genres */}
                        {item.genres && item.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.genres.map((g, i) => (
                              <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-card border border-border text-muted-foreground">
                                #{g}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inline Quick Edit for Cover and Description */}
                    {isEditingThis && (
                      <div className="pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted/30 p-2 rounded-xl">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            <span>{lang === 'ar' ? 'رابط صورة الغلاف' : 'Cover URL'}</span>
                          </label>
                          <input
                            type="text"
                            value={editCoverInput}
                            onChange={e => setEditCoverInput(e.target.value)}
                            placeholder={lang === 'ar' ? 'رابط الصورة (https:// أو /images/...)' : 'Image URL (https:// or /images/...)'}
                            className="w-full bg-card border border-border rounded-lg px-2 py-1 text-[11px]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>{lang === 'ar' ? 'نبذة / وصف الكتاب' : 'Book Synopsis'}</span>
                          </label>
                          <input
                            type="text"
                            value={editDescInput}
                            onChange={e => setEditDescInput(e.target.value)}
                            placeholder={lang === 'ar' ? 'وصف الكتاب...' : 'Description...'}
                            className="w-full bg-card border border-border rounded-lg px-2 py-1 text-[11px]"
                          />
                        </div>

                        <div className="sm:col-span-2 flex justify-end gap-1.5 pt-1">
                          <Button
                            size="sm"
                            type="button"
                            variant="ghost"
                            onClick={() => setEditingRowId(null)}
                            className="h-6 text-[10px] rounded-lg"
                          >
                            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            onClick={() => handleSaveEditRow(item.id)}
                            className="h-6 text-[10px] rounded-lg bg-primary text-primary-foreground font-bold"
                          >
                            {lang === 'ar' ? 'حفظ التعديل' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Modal Submit Actions */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-2xl text-xs font-bold text-muted-foreground cursor-pointer"
          >
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>

          <Button
            type="button"
            disabled={isBulkImporting || parsedBulkBooks.length === 0}
            onClick={onExecuteImport}
            className="rounded-2xl font-black text-xs gap-2 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25 cursor-pointer"
          >
            {isBulkImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{lang === 'ar' ? 'جاري الاستيراد وإضافة الكتب...' : 'Importing...'}</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>
                  {lang === 'ar'
                    ? `إضافة واستيراد ${parsedBulkBooks.length} كتاب إلى المخزون`
                    : `Import & Add ${parsedBulkBooks.length} Books to Inventory`}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
