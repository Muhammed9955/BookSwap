import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ExplorePageClient } from '@/components/explore/explore-page-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'استكشف الكتب — WARAQ | ورق',
  description: 'اكتشف آلاف الكتب المستعملة للتبادل والشراء والاستعارة بين يديك في مصر',
}

interface ExplorePageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    type?: string
    sort?: string
    city?: string
    area?: string
    condition?: string
    featured?: string
    page?: string
  }>
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const page = parseInt(params.page ?? '1')
  const pageSize = 24
  const offset = (page - 1) * pageSize

  // Build query
  let query = supabase
    .from('book_listings')
    .select(`
      *,
      book:books(*, category:categories(*)),
      seller:profiles(id, full_name, full_name_ar, avatar_url, rating_average, rating_count),
      city:cities(id, name_ar, name_en, slug),
      area:areas(id, name_ar, name_en, slug),
      images:book_images(id, url, is_primary, sort_order)
    `, { count: 'exact' })
    .eq('status', 'ACTIVE')

  // Filters
  if (params.type) {
    query = query.eq('listing_type', params.type.toUpperCase())
  }

  if (params.condition) {
    query = query.eq('condition', params.condition.toUpperCase())
  }

  if (params.featured === 'true') {
    query = query.eq('is_featured', true).gt('featured_until', new Date().toISOString())
  }

  if (params.city) {
    const { data: city } = await supabase.from('cities').select('id').eq('slug', params.city).single()
    if (city) query = query.eq('city_id', city.id)
  }

  if (params.area) {
    const { data: area } = await supabase.from('areas').select('id').eq('slug', params.area).single()
    if (area) query = query.eq('area_id', area.id)
  }

  // Full-text search
  if (params.q) {
    // Search in both books table fields via join
    const { data: matchingBooks } = await supabase
      .from('books')
      .select('id')
      .or(`title.ilike.%${params.q}%,title_ar.ilike.%${params.q}%,author.ilike.%${params.q}%,author_ar.ilike.%${params.q}%,isbn.ilike.%${params.q}%`)
    
    if (matchingBooks && matchingBooks.length > 0) {
      query = query.in('book_id', matchingBooks.map(b => b.id))
    } else {
      // No books match internal database search - fetch filter metadata and let client show UniversalBookSearch
      const [{ data: categories }, { data: cities }] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('cities').select('*').eq('is_active', true).order('sort_order'),
      ])

      return (
        <ExplorePageClient
          listings={[]}
          totalCount={0}
          page={page}
          pageSize={pageSize}
          categories={categories ?? []}
          cities={cities ?? []}
          currentFilters={params}
        />
      )
    }
  }

  if (params.category) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', params.category).single()
    if (cat) {
      // filter books by category
      const { data: catBooks } = await supabase.from('books').select('id').eq('category_id', cat.id)
      if (catBooks) query = query.in('book_id', catBooks.map(b => b.id))
    }
  }

  // Sorting
  switch (params.sort) {
    case 'newest': query = query.order('created_at', { ascending: false }); break
    case 'price_asc': query = query.order('price', { ascending: true, nullsFirst: false }); break
    case 'price_desc': query = query.order('price', { ascending: false }); break
    case 'most_wished': query = query.order('wishlist_count', { ascending: false }); break
    case 'most_viewed': query = query.order('view_count', { ascending: false }); break
    default: query = query.order('created_at', { ascending: false }); break
  }

  const { data: listings, count } = await query.range(offset, offset + pageSize - 1)

  // Fetch categories and cities for filters
  const [{ data: categories }, { data: cities }] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('cities').select('*').eq('is_active', true).order('sort_order'),
  ])

  return (
    <ExplorePageClient
      listings={listings ?? []}
      totalCount={count ?? 0}
      page={page}
      pageSize={pageSize}
      categories={categories ?? []}
      cities={cities ?? []}
      currentFilters={params}
    />
  )
}
