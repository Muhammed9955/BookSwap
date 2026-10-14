'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SlidersHorizontal, Search, Grid3X3, List, X } from 'lucide-react'
import { BookListing, Category, City } from '@/types'
import { BookCard, BookCardSkeleton } from '@/components/books/book-card'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { cn } from '@/lib/utils'
import { UniversalBookSearch } from '@/components/search/universal-book-search'

interface ExplorePageClientProps {
  listings: BookListing[]
  totalCount: number
  page: number
  pageSize: number
  categories: Category[]
  cities: City[]
  currentFilters: {
    q?: string
    category?: string
    type?: string
    sort?: string
    city?: string
    area?: string
    condition?: string
    featured?: string
  }
}

const LISTING_TYPES = [
  { value: 'SELL', labelAr: 'للبيع', labelEn: 'For Sale' },
  { value: 'SWAP', labelAr: 'للمبادلة', labelEn: 'For Swap' },
  { value: 'SELL_OR_SWAP', labelAr: 'بيع/مبادلة', labelEn: 'Sale/Swap' },
  { value: 'GIVEAWAY', labelAr: 'مجاني', labelEn: 'Free' },
]

const CONDITIONS = [
  { value: 'NEW', labelAr: 'جديد', labelEn: 'New' },
  { value: 'LIKE_NEW', labelAr: 'شبه جديد', labelEn: 'Like New' },
  { value: 'VERY_GOOD', labelAr: 'ممتاز', labelEn: 'Very Good' },
  { value: 'GOOD', labelAr: 'جيد', labelEn: 'Good' },
  { value: 'ACCEPTABLE', labelAr: 'مقبول', labelEn: 'Acceptable' },
]

const SORT_OPTIONS = [
  { value: 'newest', labelAr: 'الأحدث', labelEn: 'Newest' },
  { value: 'price_asc', labelAr: 'السعر (الأقل)', labelEn: 'Price (Low)' },
  { value: 'price_desc', labelAr: 'السعر (الأعلى)', labelEn: 'Price (High)' },
  { value: 'most_wished', labelAr: 'الأكثر طلباً', labelEn: 'Most Wished' },
  { value: 'most_viewed', labelAr: 'الأكثر مشاهدة', labelEn: 'Most Viewed' },
]

export function ExplorePageClient({
  listings,
  totalCount,
  page,
  pageSize,
  categories,
  cities,
  currentFilters,
}: ExplorePageClientProps) {
  const { lang, isRTL } = useLanguage()
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(currentFilters.q ?? '')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const totalPages = Math.ceil(totalCount / pageSize)

  const updateFilter = useCallback((key: string, value: string | undefined) => {
    const params = new URLSearchParams()
    const filters = { ...currentFilters, [key]: value, page: '1' }
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    router.push(`/explore?${params.toString()}`)
  }, [currentFilters, router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter('q', searchInput || undefined)
  }

  const clearFilter = (key: string) => updateFilter(key, undefined)

  const activeFilters = Object.entries(currentFilters).filter(([k, v]) => v && k !== 'page')

  return (
    <MainLayout>
      <div className="page-container py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold">
              {lang === 'ar' ? 'استكشف الكتب' : 'Explore Books'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalCount > 0
                ? (lang === 'ar' ? `${totalCount.toLocaleString('ar-EG')} كتاب` : `${totalCount.toLocaleString()} books`)
                : (lang === 'ar' ? 'مفيش نتائج' : 'No results')
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
              className="h-9 w-9 flex items-center justify-center rounded-lg border bg-card hover:bg-accent transition-colors"
              aria-label="Toggle view"
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-accent'
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {lang === 'ar' ? 'فلتر' : 'Filters'}
              {activeFilters.length > 0 && (
                <Badge variant="default" className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                  {activeFilters.length}
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative mb-4">
          <Search className={cn('absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground', isRTL ? 'right-3' : 'left-3')} />
          <Input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={lang === 'ar' ? 'ابحث عن كتاب، مؤلف، ISBN...' : 'Search books, author, ISBN...'}
            className={cn('h-10', isRTL ? 'pr-9 pl-20' : 'pl-9 pr-20')}
          />
          <Button type="submit" size="sm" className={cn('absolute top-1/2 -translate-y-1/2', isRTL ? 'left-2' : 'right-2')}>
            {lang === 'ar' ? 'بحث' : 'Search'}
          </Button>
        </form>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeFilters.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                {value}
                <button onClick={() => clearFilter(key)} aria-label="Remove filter">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => router.push('/explore')}
              className="px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {lang === 'ar' ? 'مسح الكل' : 'Clear All'}
            </button>
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-4 rounded-xl border bg-card space-y-4">
            {/* Categories */}
            <div>
              <h3 className="text-sm font-semibold mb-2">{lang === 'ar' ? 'التصنيف' : 'Category'}</h3>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => clearFilter('category')}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors', !currentFilters.category ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-accent')}
                >
                  {lang === 'ar' ? 'الكل' : 'All'}
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => updateFilter('category', cat.slug)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors', currentFilters.category === cat.slug ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-accent')}
                  >
                    {cat.icon} {lang === 'ar' ? cat.name_ar : cat.name_en}
                  </button>
                ))}
              </div>
            </div>

            {/* Listing Type */}
            <div>
              <h3 className="text-sm font-semibold mb-2">{lang === 'ar' ? 'نوع الإعلان' : 'Listing Type'}</h3>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => clearFilter('type')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors', !currentFilters.type ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-accent')}>
                  {lang === 'ar' ? 'الكل' : 'All'}
                </button>
                {LISTING_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => updateFilter('type', t.value)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors', currentFilters.type === t.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-accent')}
                  >
                    {lang === 'ar' ? t.labelAr : t.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition */}
            <div>
              <h3 className="text-sm font-semibold mb-2">{lang === 'ar' ? 'الحالة' : 'Condition'}</h3>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => clearFilter('condition')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors', !currentFilters.condition ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-accent')}>
                  {lang === 'ar' ? 'الكل' : 'All'}
                </button>
                {CONDITIONS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => updateFilter('condition', c.value)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors', currentFilters.condition === c.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-accent')}
                  >
                    {lang === 'ar' ? c.labelAr : c.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <h3 className="text-sm font-semibold mb-2">{lang === 'ar' ? 'الترتيب' : 'Sort By'}</h3>
              <div className="flex flex-wrap gap-1.5">
                {SORT_OPTIONS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => updateFilter('sort', s.value)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors', currentFilters.sort === s.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card hover:bg-accent')}
                  >
                    {lang === 'ar' ? s.labelAr : s.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {listings.length === 0 ? (
          currentFilters.q ? (
            <div className="py-6 space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center max-w-2xl mx-auto">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                  {lang === 'ar'
                    ? `لم نجد إعلانات نشطة حالياً لكلمة "${currentFilters.q}" — جاري البحث في الكتالوج الشامل لمعرفة تفاصيل الكتاب وإضافته:`
                    : `No active listings for "${currentFilters.q}" — Searching global catalog for book details and listing triggers:`}
                </p>
              </div>
              <UniversalBookSearch initialQuery={currentFilters.q} embedded={true} />
            </div>
          ) : (
            <div className="empty-state py-20">
              <span className="text-5xl mb-4">🔍</span>
              <h3 className="text-lg font-bold mb-2">
                {lang === 'ar' ? 'مفيش نتائج' : 'No Results'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {lang === 'ar' ? 'جرّب فلاتر تانية أو تصفح الأقسام' : 'Try different filters or browse categories'}
              </p>
              <Button variant="outline" onClick={() => router.push('/explore')} className="cursor-pointer">
                {lang === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
              </Button>
            </div>
          )
        ) : (
          <>
            <div className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
                : 'flex flex-col gap-3'
            )}>
              {listings.map(listing => (
                <BookCard
                  key={listing.id}
                  listing={listing}
                  compact={viewMode === 'list'}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {page > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilter('page', String(page - 1))}
                  >
                    {lang === 'ar' ? 'السابق' : 'Previous'}
                  </Button>
                )}
                <span className="text-sm text-muted-foreground px-4">
                  {lang === 'ar' ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
                </span>
                {page < totalPages && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateFilter('page', String(page + 1))}
                  >
                    {lang === 'ar' ? 'التالي' : 'Next'}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}
