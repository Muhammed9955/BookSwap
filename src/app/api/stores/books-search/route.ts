import { NextResponse } from 'next/server'
import { STORE_CATALOG_BOOKS } from '@/lib/stores/store-catalog-data'

export interface SearchBookResult {
  id: string
  title: string
  title_ar?: string
  author: string
  author_ar?: string
  isbn?: string
  publisher?: string
  published_year?: number
  description?: string
  category_name?: string
  rating?: number
  rating_count?: number
  cover_url?: string
  suggested_price?: number
  source: 'catalog' | 'openlibrary' | 'google'
}

function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u065F]/g, '') // remove tashkeel
    .trim()
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ success: true, books: [] })
  }

  const normQ = normalizeArabic(q)
  const results: SearchBookResult[] = []
  const seenTitles = new Set<string>()

  // 1. Search Internal Curated Catalog (Highest Quality & Instant)
  for (const b of STORE_CATALOG_BOOKS) {
    const titleNorm = normalizeArabic(b.title || '')
    const titleArNorm = normalizeArabic(b.title_ar || '')
    const authorNorm = normalizeArabic(b.author || '')
    const authorArNorm = normalizeArabic(b.author_ar || '')

    if (
      titleNorm.includes(normQ) ||
      titleArNorm.includes(normQ) ||
      authorNorm.includes(normQ) ||
      authorArNorm.includes(normQ) ||
      normQ.includes(titleNorm) ||
      normQ.includes(titleArNorm)
    ) {
      const key = titleArNorm || titleNorm
      if (!seenTitles.has(key)) {
        seenTitles.add(key)
        results.push({
          id: `cat-${b.id}`,
          title: b.title,
          title_ar: b.title_ar || b.title,
          author: b.author,
          author_ar: b.author_ar || b.author,
          category_name: b.category_name_ar || 'أدب وروايات',
          cover_url: b.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
          suggested_price: b.price || 40,
          rating: b.rating || 4.8,
          source: 'catalog',
        })
      }
    }
  }

  // 2. Query OpenLibrary (Free, No Rate Limits)
  try {
    const olRes = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=6`,
      { next: { revalidate: 3600 } }
    )
    if (olRes.ok) {
      const olData = await olRes.json()
      for (const doc of olData.docs || []) {
        const title = doc.title
        if (!title) continue
        const normDocTitle = normalizeArabic(title)
        if (seenTitles.has(normDocTitle)) continue

        seenTitles.add(normDocTitle)
        const coverUrl = doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : undefined

        results.push({
          id: `ol-${doc.key?.replace(/\//g, '-') || Math.random().toString(36).substring(2, 9)}`,
          title,
          title_ar: title,
          author: doc.author_name?.[0] || 'مؤلف غير محدد',
          author_ar: doc.author_name?.[0] || 'مؤلف غير محدد',
          isbn: doc.isbn?.[0],
          publisher: doc.publisher?.[0],
          published_year: doc.first_publish_year,
          cover_url: coverUrl,
          suggested_price: 50,
          source: 'openlibrary',
        })
      }
    }
  } catch (err) {
    console.error('OpenLibrary search error:', err)
  }

  // 3. Optional Google Books API (Graceful Fallback if Rate Limited)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)
    const gRes = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=4`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

    if (gRes.ok) {
      const gData = await gRes.json()
      for (const item of gData.items || []) {
        const info = item.volumeInfo
        if (!info || !info.title) continue

        const normGTitle = normalizeArabic(info.title)
        if (seenTitles.has(normGTitle)) continue

        seenTitles.add(normGTitle)
        const cover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail
        const secureCover = cover ? cover.replace(/^http:/, 'https:') : undefined

        const isbn = info.industryIdentifiers?.find(
          (id: { type: string; identifier: string }) => id.type.includes('ISBN')
        )?.identifier

        results.push({
          id: `gb-${item.id}`,
          title: info.title,
          title_ar: info.title,
          author: info.authors?.[0] || 'غير محدد',
          author_ar: info.authors?.[0] || 'غير محدد',
          isbn,
          publisher: info.publisher,
          published_year: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) : undefined,
          description: info.description,
          category_name: info.categories?.[0] || 'عام',
          cover_url: secureCover,
          rating: info.averageRating,
          rating_count: info.ratingsCount,
          suggested_price: 60,
          source: 'google',
        })
      }
    }
  } catch {
    // Gracefully ignore Google Books rate limits or network issues
  }

  return NextResponse.json({
    success: true,
    count: results.length,
    books: results,
  })
}
