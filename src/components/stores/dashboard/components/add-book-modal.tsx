'use client'

import React from 'react'
import Image from 'next/image'
import {
  PlusCircle,
  Edit,
  Sparkles,
  Search,
  Loader2,
  AlertCircle,
  Wand2,
  ImageIcon,
  UploadCloud,
  Trash2,
  Star,
  MessageSquareQuote,
  ExternalLink,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { BookCondition } from '@/types/store'
import type { SearchBookResult } from '@/app/api/stores/books-search/route'

interface AddBookModalProps {
  isOpen: boolean
  onClose: () => void
  editingBookId: string | null
  newBook: {
    title: string
    title_ar: string
    author: string
    isbn?: string
    category_name: string
    condition: BookCondition
    price: number
    original_price: number
    has_discount: boolean
    stock_quantity: number
    cover_url?: string
    description?: string
    description_ar?: string
    goodreads_url?: string
    rating?: number
    rating_count?: number
    review_count?: number
    reviews?: string
    publisher?: string
    published_year?: number
    pages_count?: number
    first_published?: string
    genres?: string[]
    author_details?: {
      name?: string
      bio?: string
      image_url?: string
    }
  }
  setNewBook: React.Dispatch<React.SetStateAction<any>>
  onlineBookSearchQuery: string
  isOnlineSearching: boolean
  onlineSearchResults: SearchBookResult[]
  onSearchOnlineBooks: (query: string, immediate?: boolean) => void
  onSelectOnlineSearchResult: (book: SearchBookResult) => void
  onClearOnlineSearch: () => void
  isUploadingBookCover: boolean
  onBookCoverFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => void
  lang: 'ar' | 'en'
}

export function AddBookModal({
  isOpen,
  onClose,
  editingBookId,
  newBook,
  setNewBook,
  onlineBookSearchQuery,
  isOnlineSearching,
  onlineSearchResults,
  onSearchOnlineBooks,
  onSelectOnlineSearchResult,
  onClearOnlineSearch,
  isUploadingBookCover,
  onBookCoverFileChange,
  onSubmit,
  lang,
}: AddBookModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="rounded-3xl border-2 border-border bg-card p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-black text-foreground text-sm flex items-center gap-2">
            {editingBookId ? (
              <>
                <Edit className="h-4 w-4 text-primary" />
                <span>{lang === 'ar' ? 'تعديل بيانات الكتاب في المخزون' : 'Edit Book in Inventory'}</span>
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 text-primary" />
                <span>{lang === 'ar' ? 'إضافة كتاب جديد للمخزون' : 'Add New Book to Store'}</span>
              </>
            )}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Smart Online Search & Auto-Enrich Box (Only shown in Add mode) */}
        {!editingBookId && (
          <div className="rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/5 via-card to-background p-3.5 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{lang === 'ar' ? 'بحث وجلب بيانات الكتاب أونلاين تلقائياً 🪄' : 'Search & Auto-Fill Book Data'}</span>
              </label>
              <span className="text-[10px] text-muted-foreground font-semibold">
                {lang === 'ar' ? 'جلب الغلاف، الكاتب، الـ ISBN والوصف' : 'Auto-fills cover, author, ISBN & desc'}
              </span>
            </div>

            <div className="flex gap-2 items-center">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={onlineBookSearchQuery}
                  onChange={e => onSearchOnlineBooks(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      onSearchOnlineBooks(onlineBookSearchQuery, true)
                    }
                  }}
                  placeholder={lang === 'ar' ? 'ابحث باسم الكتاب، المؤلف، رقم الـ ISBN، أو الصق رابط Goodreads...' : 'Search title, author, ISBN, or paste Goodreads URL...'}
                  className="w-full bg-card border border-border rounded-xl ps-9 pe-8 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary shadow-xs"
                />
                {onlineBookSearchQuery && (
                  <button
                    type="button"
                    onClick={onClearOnlineSearch}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs cursor-pointer p-0.5"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => onSearchOnlineBooks(onlineBookSearchQuery, true)}
                disabled={isOnlineSearching || !onlineBookSearchQuery.trim()}
                title={lang === 'ar' ? 'بحث وجلب بيانات وغلاف الكتاب' : 'Search & Fetch Book Cover'}
                className="rounded-xl px-3 h-10 text-xs font-black gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 cursor-pointer shadow-xs min-w-[70px] justify-center"
              >
                {isOnlineSearching ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-[11px]">{lang === 'ar' ? 'جاري...' : '...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'بحث' : 'Search'}</span>
                  </>
                )}
              </Button>
            </div>

            {/* In-depth Search Progress Notice */}
            {isOnlineSearching && (
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold flex items-center gap-2 animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                <span>
                  {lang === 'ar'
                    ? 'جاري الفحص المباشر في Goodreads و OpenLibrary وأرشيف الكتب لجلب الغلاف والتقييمات والبيانات الكاملة...'
                    : 'Searching Goodreads, OpenLibrary, Archive.org, and Google Books CDN for verified cover and metadata...'}
                </span>
              </div>
            )}

            {/* Online Search Results Dropdown / Grid */}
            {onlineSearchResults.length > 0 && (
              <div className="space-y-1.5 pt-1 max-h-60 overflow-y-auto">
                <div className="text-[10px] font-bold text-muted-foreground flex items-center justify-between">
                  <span>{lang === 'ar' ? `نتائج البحث (${onlineSearchResults.length} نتيجة): اضغط للتعبئة التلقائية للبيانات الغنية` : 'Click any book to auto-populate all rich data:'}</span>
                  <span className="text-primary font-black">1-Click Auto Fill ⚡</span>
                </div>
                {onlineSearchResults.map(book => (
                  <div
                    key={book.id}
                    onClick={() => onSelectOnlineSearchResult(book)}
                    className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-card border border-border/80 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all shadow-xs group"
                  >
                    <div className="relative h-14 w-10 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/60 shadow-xs">
                      {book.cover_url ? (
                        <Image src={book.cover_url} alt="" fill unoptimized className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs">📖</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-black text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {book.title_ar || book.title}
                        </p>
                        {book.source === 'goodreads' && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            Goodreads موثق 🌟
                          </span>
                        )}
                        {book.source === 'popular_db' && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            الأكثر مبيعاً ⚡
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
                        {book.author_details?.image_url && (
                          <div className="relative h-4 w-4 rounded-full overflow-hidden border border-primary/20 shrink-0">
                            <Image src={book.author_details.image_url} alt="" fill unoptimized className="object-cover" />
                          </div>
                        )}
                        <span className="font-bold text-foreground/90">{book.author_ar || book.author}</span>
                        {book.category_name && <span className="text-[10px] text-primary/80">• {book.category_name}</span>}
                      </div>

                      {/* Rich Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {book.rating && (
                          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border border-amber-500/20">
                            ★ {book.rating}
                            {book.rating_count ? <span className="opacity-70 text-[9px]">({book.rating_count})</span> : null}
                          </span>
                        )}
                        {book.pages_count && (
                          <span className="text-[9px] font-semibold text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded-md border border-border/60">
                            📄 {book.pages_count} ص
                          </span>
                        )}
                        {(book.published_year || book.first_published) && (
                          <span className="text-[9px] text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded-md border border-border/60">
                            📅 {book.first_published || book.published_year}
                          </span>
                        )}
                        {book.publisher && (
                          <span className="text-[9px] text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded-md border border-border/60 truncate max-w-[120px]">
                            🏢 {book.publisher}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-primary text-primary-foreground group-hover:bg-primary/90 shrink-0 flex items-center gap-1 shadow-xs">
                      <span>تعبئة</span>
                      <Wand2 className="h-2.5 w-2.5" />
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Notice when search yields no results */}
            {!isOnlineSearching && onlineBookSearchQuery.trim().length >= 2 && onlineSearchResults.length === 0 && (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 text-muted-foreground text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="leading-relaxed">
                  {lang === 'ar'
                    ? `لم يتم العثور على كتاب باسم "${onlineBookSearchQuery}". يرجى التأكد من كتابة الاسم بصورة صحيحة.`
                    : `No book found matching "${onlineBookSearchQuery}". Please check the spelling.`}
                </span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3.5">
          {/* Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  {lang === 'ar' ? 'عنوان الكتاب (بالعربية) *' : 'Book Title (Arabic) *'}
                </label>
                {!editingBookId && (newBook.title_ar || newBook.title) && (
                  <button
                    type="button"
                    onClick={() => onSearchOnlineBooks(newBook.title_ar || newBook.title, true)}
                    className="text-[10px] font-black text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{lang === 'ar' ? 'جلب بيانات هذا العنوان 🪄' : 'Fetch Rich Data 🪄'}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                value={newBook.title_ar}
                onChange={e => setNewBook((prev: any) => ({
                  ...prev,
                  title_ar: e.target.value,
                  title: prev.title || e.target.value
                }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                placeholder={lang === 'ar' ? 'مثال: يوتوبيا، تراب الماس، 1984، العادات الذرية' : 'Book Arabic Title'}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                {lang === 'ar' ? 'العنوان بالإنجليزية / البديل' : 'Book Title (English / Alt)'}
              </label>
              <input
                type="text"
                value={newBook.title}
                onChange={e => setNewBook((prev: any) => ({
                  ...prev,
                  title: e.target.value,
                  title_ar: prev.title_ar || e.target.value
                }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                placeholder="Utopia"
              />
            </div>
          </div>

          {/* Author & ISBN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                {lang === 'ar' ? 'المؤلف / الكاتب *' : 'Author *'}
              </label>
              <input
                type="text"
                required
                value={newBook.author}
                onChange={e => setNewBook((prev: any) => ({ ...prev, author: e.target.value }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                placeholder="أحمد خالد توفيق"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                {lang === 'ar' ? 'رقم الـ ISBN' : 'ISBN Number'}
              </label>
              <input
                type="text"
                value={newBook.isbn}
                onChange={e => setNewBook((prev: any) => ({ ...prev, isbn: e.target.value }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                placeholder="978977..."
              />
            </div>
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                {lang === 'ar' ? 'التصنيف / الفئة' : 'Category'}
              </label>
              <select
                value={newBook.category_name}
                onChange={e => setNewBook((prev: any) => ({ ...prev, category_name: e.target.value }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="روايات وأدب">روايات وأدب</option>
                <option value="تطوير الذات وعلم النفس">تطوير الذات وعلم النفس</option>
                <option value="دين وفكر إسلامي">دين وفكر إسلامي</option>
                <option value="تاريخ وسير ذاتية">تاريخ وسير ذاتية</option>
                <option value="علوم وتكنولوجيا">علوم وتكنولوجيا</option>
                <option value="أعمال ومالية">أعمال ومالية</option>
                <option value="كتب أطفال ويافعين">كتب أطفال ويافعين</option>
                <option value="فلسفة واجتماع">فلسفة واجتماع</option>
                <option value="شعر ونصوص">شعر ونصوص</option>
                <option value="لغات وتعليم">لغات وتعليم</option>
                <option value="كتب عامة">كتب عامة</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                {lang === 'ar' ? 'حالة الكتاب *' : 'Book Condition *'}
              </label>
              <select
                value={newBook.condition}
                onChange={e => setNewBook((prev: any) => ({ ...prev, condition: e.target.value as BookCondition }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="NEW">{lang === 'ar' ? 'جديد تماماً (NEW)' : 'New'}</option>
                <option value="LIKE_NEW">{lang === 'ar' ? 'كالجديد (LIKE NEW)' : 'Like New'}</option>
                <option value="VERY_GOOD">{lang === 'ar' ? 'حالة ممتازة (VERY GOOD)' : 'Very Good'}</option>
                <option value="GOOD">{lang === 'ar' ? 'حالة جيدة (GOOD)' : 'Good'}</option>
                <option value="ACCEPTABLE">{lang === 'ar' ? 'مقبول (ACCEPTABLE)' : 'Acceptable'}</option>
              </select>
            </div>
          </div>

          {/* Price, Optional Discount & Stock */}
          <div className="rounded-2xl border border-border bg-muted/20 p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  {newBook.has_discount
                    ? (lang === 'ar' ? 'السعر بعد الخصم (ج.م) *' : 'Discounted Price (EGP) *')
                    : (lang === 'ar' ? 'سعر البيع (ج.م) *' : 'Selling Price (EGP) *')}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newBook.price}
                  onChange={e => setNewBook((prev: any) => ({ ...prev, price: Number(e.target.value) }))}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  {lang === 'ar' ? 'الكمية المتوفرة في الفرع *' : 'Available Stock Quantity *'}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newBook.stock_quantity}
                  onChange={e => setNewBook((prev: any) => ({ ...prev, stock_quantity: Number(e.target.value) }))}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Optional Discount Toggle */}
            <div className="pt-2 border-t border-border/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newBook.has_discount}
                    onChange={e => {
                      const checked = e.target.checked
                      setNewBook((prev: any) => ({
                        ...prev,
                        has_discount: checked,
                        original_price: checked
                          ? (prev.original_price > prev.price ? prev.original_price : prev.price + 30)
                          : prev.price,
                      }))
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-xs font-bold text-foreground">
                    {lang === 'ar' ? 'تطبيق خصم وتخفيض على هذا الكتاب؟' : 'Apply discount to this book?'}
                  </span>
                </label>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {newBook.has_discount
                    ? (lang === 'ar' ? 'عرض السعر قبل وبعد الخصم' : 'Discount Active')
                    : (lang === 'ar' ? 'سعر موحد (بدون خصم)' : 'No Discount')}
                </span>
              </div>

              {newBook.has_discount && (
                <div className="space-y-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">
                      {lang === 'ar' ? 'السعر الأصلي قبل الخصم (ج.م) *' : 'Original Price before discount (EGP) *'}
                    </label>
                    <input
                      type="number"
                      min={Number(newBook.price) + 1}
                      value={newBook.original_price}
                      onChange={e => setNewBook((prev: any) => ({ ...prev, original_price: Number(e.target.value) }))}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                      placeholder="200"
                    />
                  </div>
                  {Number(newBook.original_price) > Number(newBook.price) && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                      <span>{lang === 'ar' ? 'قيمة الخصم للعميل:' : 'Customer Savings:'}</span>
                      <span className="font-mono">
                        وفر {Number(newBook.original_price) - Number(newBook.price)} ج.م (خصم {Math.round(((Number(newBook.original_price) - Number(newBook.price)) / Number(newBook.original_price)) * 100)}%) 🔥
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Book Cover Image: Upload from device or URL */}
          <div className="space-y-2.5 rounded-2xl border border-border bg-muted/20 p-3.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                <span>{lang === 'ar' ? 'صورة غلاف الكتاب' : 'Book Cover Image'}</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {lang === 'ar' ? 'ارفع من جهازك أو ضع رابط صورة مباشر' : 'Upload or enter direct image URL'}
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className={cn(
                "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary bg-card text-xs font-bold text-primary cursor-pointer transition-colors shadow-xs text-center",
                isUploadingBookCover && "opacity-50 pointer-events-none"
              )}>
                {isUploadingBookCover ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>{lang === 'ar' ? 'جاري ضغط ورفع الصورة...' : 'Compressing & uploading...'}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 text-primary" />
                    <span>{lang === 'ar' ? 'رفع صورة من جهازك 📷' : 'Upload from device 📷'}</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingBookCover}
                  onChange={onBookCoverFileChange}
                />
              </label>

              <div>
                <input
                  type="url"
                  value={newBook.cover_url}
                  onChange={e => setNewBook((prev: any) => ({ ...prev, cover_url: e.target.value }))}
                  className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Cover Preview & Clear */}
            {newBook.cover_url && (
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-10 rounded-md overflow-hidden bg-muted shrink-0 border border-border shadow-xs">
                    <Image src={newBook.cover_url} alt="" fill unoptimized className="object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {lang === 'ar' ? 'معاينة غلاف الكتاب' : 'Book Cover Preview'}
                    </p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[220px]">
                      {newBook.cover_url}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setNewBook((prev: any) => ({ ...prev, cover_url: '' }))}
                  className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 me-1" />
                  <span>{lang === 'ar' ? 'إزالة الغلاف' : 'Remove'}</span>
                </Button>
              </div>
            )}
          </div>

          {/* Description Textarea */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>{lang === 'ar' ? 'نبذة ووصف عن الكتاب (اختياري)' : 'Book Description / Synopsis (Optional)'}</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {lang === 'ar' ? 'ملخص يساعد القراء على اتخاذ قرار الشراء' : 'Summary for readers'}
              </span>
            </label>
            <textarea
              rows={3}
              value={newBook.description_ar || newBook.description}
              onChange={e => setNewBook((prev: any) => ({ ...prev, description: e.target.value, description_ar: e.target.value }))}
              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:border-primary resize-none"
              placeholder={lang === 'ar' ? 'اكتب نبذة مختصرة عن أحداث الرواية أو موضوع الكتاب، عدد الصفحات، دار النشر، إلخ...' : 'Short description about the book, topics covered, publisher notes...'}
            />
          </div>

          {/* Goodreads & Ratings Section */}
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span>{lang === 'ar' ? 'بيانات Goodreads والتقييمات والمراجعات' : 'Goodreads, Ratings & Reviews'}</span>
              </span>
              <span className="text-[10px] text-amber-800/70 dark:text-amber-300/70 font-semibold">
                {lang === 'ar' ? 'تظهر للمستخدم مع رابط مباشر للمراجعات' : 'Visible on card & detail modal'}
              </span>
            </div>

            {/* Goodreads URL */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>{lang === 'ar' ? 'رابط صفحة الكتاب على Goodreads' : 'Goodreads Book URL'}</span>
                {newBook.goodreads_url && (
                  <a
                    href={newBook.goodreads_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                  >
                    <span>{lang === 'ar' ? 'فتح الرابط' : 'Open link'}</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </label>
              <input
                type="url"
                value={newBook.goodreads_url || ''}
                onChange={e => setNewBook((prev: any) => ({ ...prev, goodreads_url: e.target.value }))}
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                placeholder="https://www.goodreads.com/book/show/..."
              />
            </div>

            {/* Ratings & Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500" />
                  <span>{lang === 'ar' ? 'التقييم (من 5.0)' : 'Rating (out of 5.0)'}</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={newBook.rating !== undefined ? newBook.rating : ''}
                  onChange={e =>
                    setNewBook((prev: any) => ({
                      ...prev,
                      rating: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                  placeholder="4.5"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  {lang === 'ar' ? 'إجمالي عدد التقييمات' : 'Ratings Count'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={newBook.rating_count !== undefined ? newBook.rating_count : ''}
                  onChange={e =>
                    setNewBook((prev: any) => ({
                      ...prev,
                      rating_count: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                  placeholder="1250"
                />
              </div>
            </div>

            {/* Reader Reviews / Quotes */}
            <div className="space-y-1 pt-1">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MessageSquareQuote className="h-3.5 w-3.5 text-primary" />
                <span>{lang === 'ar' ? 'مراجعة أو اقتباس مميز من القراء (Reviews)' : 'Featured Reader Review / Quote'}</span>
              </label>
              <textarea
                rows={2}
                value={newBook.reviews || ''}
                onChange={e => setNewBook((prev: any) => ({ ...prev, reviews: e.target.value }))}
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:border-primary resize-none"
                placeholder={lang === 'ar' ? 'مثال: "رواية استثنائية وأسلوب مشوق لا يتركك حتى الصفحة الأخيرة..."' : 'e.g., "A thrilling masterpiece with thought-provoking themes..."'}
              />
            </div>
          </div>

          {/* Rich Author & Genres Details (Populated from Goodreads / Search) */}
          {(newBook.author_details || (newBook.genres && newBook.genres.length > 0) || newBook.first_published) && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>{lang === 'ar' ? 'بيانات الكاتب والتصنيفات الموثقة 🌟' : 'Author Profile & Verified Genres'}</span>
                </span>
                {newBook.first_published && (
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-lg border border-border">
                    {lang === 'ar' ? `نُشر لأول مرة: ${newBook.first_published}` : `First published: ${newBook.first_published}`}
                  </span>
                )}
              </div>

              {/* Author Details Preview */}
              {newBook.author_details && (
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-card border border-border/80">
                  {newBook.author_details.image_url ? (
                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted shrink-0 border border-primary/20">
                      <Image
                        src={newBook.author_details.image_url}
                        alt={newBook.author_details.name || newBook.author}
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
                      {newBook.author_details.name || newBook.author}
                    </p>
                    {newBook.author_details.bio && (
                      <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed mt-0.5">
                        {newBook.author_details.bio}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Genres Badges */}
              {newBook.genres && newBook.genres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {newBook.genres.slice(0, 6).map((genre, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-muted/60 text-muted-foreground border border-border"
                    >
                      #{genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Optional Publishing Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                {lang === 'ar' ? 'دار النشر' : 'Publisher'}
              </label>
              <input
                type="text"
                value={newBook.publisher || ''}
                onChange={e => setNewBook((prev: any) => ({ ...prev, publisher: e.target.value }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                placeholder={lang === 'ar' ? 'دار الشروق، الكرمة...' : 'Publisher name'}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                {lang === 'ar' ? 'سنة النشر' : 'Year'}
              </label>
              <input
                type="number"
                min="1800"
                max="2030"
                value={newBook.published_year !== undefined ? newBook.published_year : ''}
                onChange={e =>
                  setNewBook((prev: any) => ({
                    ...prev,
                    published_year: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                placeholder="2024"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">
                {lang === 'ar' ? 'عدد الصفحات' : 'Pages Count'}
              </label>
              <input
                type="number"
                min="1"
                value={newBook.pages_count !== undefined ? newBook.pages_count : ''}
                onChange={e =>
                  setNewBook((prev: any) => ({
                    ...prev,
                    pages_count: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                placeholder="240"
              />
            </div>
          </div>

          {/* Modal Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl font-bold text-xs cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" className="rounded-xl font-bold text-xs cursor-pointer">
              {editingBookId
                ? (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes')
                : (lang === 'ar' ? 'إضافة الكتاب الآن' : 'Add Book Now')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
