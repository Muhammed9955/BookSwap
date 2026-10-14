import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface UniversalBookSearchResult {
  id: string
  title: string
  title_ar?: string | null
  author: string
  author_ar?: string | null
  isbn?: string | null
  published_year?: number | null
  cover_url?: string | null
  description?: string | null
  category_name?: string | null
  category_id?: string | null
  rating_average?: number | null
  rating_count?: number | null
  exists_on_platform: boolean
  listing_count: number
  // Pricing breakdown
  min_price?: number | null
  new_min_price?: number | null   // cheapest NEW copy
  used_min_price?: number | null  // cheapest USED/LIKE_NEW/etc. copy
  // Listing type counts
  swap_count: number
  borrow_count: number
  store_count: number
  has_swap: boolean
  has_giveaway: boolean
  // Location breakdown: [{ city: string, count: number }]
  locations: string[]
  city_breakdown: { city: string; count: number }[]
  internal_book_id?: string
  source: 'bookswap' | 'openlibrary' | 'archive'
}

/**
 * Generate normalized Arabic variants (handling ى/ي and أ/إ/آ/ا)
 */
function getArabicSearchVariants(q: string): string[] {
  const set = new Set<string>([q.trim()])
  const v1 = q.replace(/ى(?=\s|$)/g, 'ي')
  const v2 = q.replace(/ي(?=\s|$)/g, 'ى')
  set.add(v1)
  set.add(v2)
  const v3 = q.replace(/[أإآ]/g, 'ا')
  set.add(v3)
  set.add(v1.replace(/[أإآ]/g, 'ا'))
  set.add(v2.replace(/[أإآ]/g, 'ا'))
  return Array.from(set).filter(Boolean)
}

/**
 * Patterns that identify non-book content (study sheets, exams, magazines, theses, software, etc.)
 */
const NON_BOOK_PATTERN =
  /امتحان|امتحانات|مراجعة|بنك اسئلة|مذكرات شرح|الصف\s+(?:الأول|الثاني|الثالث|الرابع|الخامس|السادس)|الترم\s+(?:الأول|الثاني)|الابتدائي|الإعدادي|الثانوي|ثانوية عامة|\bمستر\b|أطروحة|رسالة ماجستير|دكتوراه|رسالة تخرج|بحث جامعي|مجلة|جريدة|صحيفة|قاموس|معجم|دليل|فهرس|أرشيف|مشروع ترجمة|قائمة مؤلفات|قائمة كتب|تسجيلات|أشرطة|برنامج|سوفت وير/i

/**
 * Clean Archive.org records into pure, structured book entries
 */
function cleanArchiveBook(
  doc: { identifier?: string; title?: string; creator?: string | string[]; year?: string; description?: string | string[] },
  searchedAuthorQuery: string | null
): UniversalBookSearchResult | null {
  let title = (doc.title || '').trim()
  if (!title) return null

  // 1. Filter out non-books, school exam sheets, academic theses, magazines
  if (NON_BOOK_PATTERN.test(title)) return null

  // 2. Remove leading noise prefixes (e.g. "fahmi dawabshehكتاب...", numbers, hashes)
  title = title.replace(/^[a-zA-Z0-9_\-\.\s]*?(?:كتاب|رواية|مسرحية|ديوان)\s+/i, '')
  title = title.replace(/^[0-9]+[=\-_#\s]*/, '')
  title = title.replace(/=+/g, ' ')

  // 3. Extract category or year if embedded in metadata tags like: "# رواية # 1975 #"
  let categoryName: string | null = null
  let publishedYear = doc.year ? parseInt(doc.year, 10) : null
  if (isNaN(publishedYear as number)) publishedYear = null

  const tagMatch = title.match(/#\s*(رواية|مسرحية|دراسة|قصص|شعر|فكر إسلامي|فلسفة|مذكرات|مقالات)\s*(?:(\d{4}))?\s*#/)
  if (tagMatch) {
    categoryName = tagMatch[1]
    if (tagMatch[2] && !publishedYear) publishedYear = parseInt(tagMatch[2], 10)
    title = title.replace(/#\s*(رواية|مسرحية|دراسة|قصص|شعر|فكر إسلامي|فلسفة|مذكرات|مقالات)\s*(?:\d{4})?\s*#/, '')
  }

  // 4. Remove brackets like [13642], PDF extensions, trailing hash tags
  title = title.replace(/\[\d+\]/g, '')
  title = title.replace(/#.*$/, '')
  title = title.replace(/\.pdf$/i, '')

  // 5. Clean author names embedded in the title
  const authorRemovalRegex =
    /(?:تأليف|للدكتور|للكاتب|للمؤلف|بقلم|الدكتور|د\.)\s*(?:مصطفى|مصطفي|أحمد خالد|احمد خالد|نجيب|طه|عباس|توفيق|إحسان|احسان|يوسف|رضوى|سعود|جمال|علاء)?\s*[\u0600-\u06FF]+/g
  title = title.replace(authorRemovalRegex, '')

  if (searchedAuthorQuery) {
    const variants = getArabicSearchVariants(searchedAuthorQuery)
    for (const v of variants) {
      title = title.split(v).join('')
    }
  }

  // Remove leading prefixes like "كتاب", "رواية", etc.
  title = title.replace(/^(?:كتاب|رواية|مسرحية|ديوان|دراسة|مجموعة)\s+/i, '')
  // Clean special punctuation
  title = title.replace(/[-–—/\\:,._#()[\]{}«»"']/g, ' ').replace(/\s+/g, ' ').trim()

  // Ensure title is valid and not empty or just a number
  if (title.length < 2 || /^(\d+|pdf|book)$/i.test(title)) return null

  // If title is just an author name or generic word, skip
  if (/^(?:مصطفى|مصطفي|محمود|توفيق|أحمد|احمد|نجيب|محفوظ)$/.test(title)) return null

  // 6. Clean author
  let author = searchedAuthorQuery || ''
  if (!author) {
    if (Array.isArray(doc.creator)) {
      author = doc.creator.join('، ')
    } else if (typeof doc.creator === 'string') {
      author = doc.creator
    }
  }
  if (!author || author.includes('.com') || author.includes('archive') || author === 'مؤلف عربي') {
    author = 'مؤلف مصري / عربي'
  }
  author = author.replace(/[-–—]/g, '').trim()

  // 7. Clean description (reject technical file metadata)
  let cleanDesc: string | null = null
  if (doc.description) {
    const raw = Array.isArray(doc.description) ? doc.description[0] : doc.description
    if (
      typeof raw === 'string' &&
      raw.length > 20 &&
      !raw.includes('.pdf') &&
      !raw.includes('الحجم') &&
      !/^\d+\s*ميجا/.test(raw) &&
      !raw.includes('Scanner') &&
      !raw.includes('ABBYY')
    ) {
      cleanDesc = raw.replace(/<[^>]*>?/gm, '').trim()
      if (cleanDesc.length > 300) {
        cleanDesc = cleanDesc.substring(0, 300) + '...'
      }
    }
  }

  const coverUrl = doc.identifier ? `https://archive.org/services/img/${doc.identifier}` : null

  return {
    id: `arch_${doc.identifier || Math.random().toString(36).substring(2, 9)}`,
    title,
    author,
    published_year: publishedYear,
    cover_url: coverUrl,
    description: cleanDesc,
    category_name: categoryName,
    exists_on_platform: false,
    listing_count: 0,
    swap_count: 0,
    borrow_count: 0,
    store_count: 0,
    has_swap: false,
    has_giveaway: false,
    locations: [],
    city_breakdown: [],
    source: 'archive',
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() ?? ''
  const filter = searchParams.get('filter') ?? 'all' // 'all' | 'available' | 'missing'

  if (!query || query.length < 2) {
    return NextResponse.json({
      query: '',
      total: 0,
      platformCount: 0,
      externalCount: 0,
      results: [],
    })
  }

  const supabase = await createClient()

  // 1. Analyze query
  const isNumericIsbn = /^[0-9Xx-]{10,17}$/.test(query.replace(/-/g, ''))
  const isArabicQuery = /[\u0600-\u06FF]/.test(query)
  const arabicWordCount = (query.match(/[\u0600-\u06FF]+/g) || []).length

  // Author search detection: 2 to 4 Arabic words without typical title keywords
  const isLikelyAuthorSearch =
    isArabicQuery &&
    !isNumericIsbn &&
    arabicWordCount >= 2 &&
    arabicWordCount <= 4 &&
    !/رواية|كتاب|قصة|ديوان|ملحمة|سلسلة|مجلد|عالم|فانتازيا|ثلاثية|مقدمة|أسرار|حوار/.test(query)

  const arabicVariants = isArabicQuery ? getArabicSearchVariants(query) : [query]

  // 2. Search BookSwap Internal DB (books + active book_listings)
  let internalQuery = supabase
    .from('books')
    .select(`
      id,
      title,
      title_ar,
      author,
      author_ar,
      isbn,
      isbn_13,
      published_year,
      cover_image_url,
      description,
      description_ar,
      category:categories(id, name_ar, name_en),
      listings:book_listings(
        id,
        listing_type,
        condition,
        price,
        status,
        city:cities(name_ar, name_en),
        area:areas(name_ar, name_en),
        images:book_images(url, is_primary)
      )
    `)
    .limit(20)

  if (isNumericIsbn) {
    const clean = query.replace(/-/g, '')
    internalQuery = internalQuery.or(`isbn.eq.${clean},isbn_13.eq.${clean}`)
  } else {
    const clauses = arabicVariants.map(
      v => `title.ilike.%${v}%,title_ar.ilike.%${v}%,author.ilike.%${v}%,author_ar.ilike.%${v}%`
    )
    internalQuery = internalQuery.or(clauses.join(','))
  }

  const { data: internalBooks, error: internalErr } = await internalQuery

  const internalResults: UniversalBookSearchResult[] = []
  const seenTitles = new Set<string>()
  const internalIsbns = new Set<string>()

  if (internalBooks && !internalErr) {
    for (const b of internalBooks) {
      const normTitle = (b.title_ar || b.title).trim().toLowerCase()
      seenTitles.add(normTitle)
      if (b.title) seenTitles.add(b.title.trim().toLowerCase())
      if (b.title_ar) seenTitles.add(b.title_ar.trim().toLowerCase())
      if (b.isbn) internalIsbns.add(b.isbn.replace(/-/g, '').toLowerCase())
      if (b.isbn_13) internalIsbns.add(b.isbn_13.replace(/-/g, '').toLowerCase())

      // Filter active listings
      const activeListings = (b.listings || []).filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (l: any) => l.status === 'ACTIVE'
      )

      let minPrice: number | null = null
      let newMinPrice: number | null = null
      let usedMinPrice: number | null = null
      let hasSwap = false
      let hasGiveaway = false
      let swapCount = 0
      let borrowCount = 0
      let storeCount = 0
      const locationsSet = new Set<string>()
      const cityCountMap = new Map<string, number>()

      const NEW_CONDITIONS = new Set(['NEW'])
      const USED_CONDITIONS = new Set(['LIKE_NEW', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE'])

      for (const l of activeListings) {
        if (l.listing_type === 'SWAP' || l.listing_type === 'SELL_OR_SWAP') {
          hasSwap = true
          swapCount++
        }
        if (l.listing_type === 'GIVEAWAY') {
          hasGiveaway = true
        }
        // Borrow detection — future listing type
        if (l.listing_type === 'BORROW') {
          borrowCount++
        }
        // Store detection — seller is a verified store
        if ((l as any).is_store_listing) {
          storeCount++
        }
        if (typeof l.price === 'number' && l.price > 0) {
          if (minPrice === null || l.price < minPrice) {
            minPrice = l.price
          }
          if (NEW_CONDITIONS.has(l.condition)) {
            if (newMinPrice === null || l.price < newMinPrice) newMinPrice = l.price
          } else if (USED_CONDITIONS.has(l.condition)) {
            if (usedMinPrice === null || l.price < usedMinPrice) usedMinPrice = l.price
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cityObj: any = Array.isArray(l.city) ? l.city[0] : l.city
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const areaObj: any = Array.isArray(l.area) ? l.area[0] : l.area
        const loc = areaObj?.name_ar || cityObj?.name_ar || cityObj?.name_en
        if (loc) {
          locationsSet.add(loc)
          cityCountMap.set(loc, (cityCountMap.get(loc) ?? 0) + 1)
        }
      }

      const cityBreakdown = Array.from(cityCountMap.entries())
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listingWithImg = activeListings.find((l: any) => l.images && l.images.length > 0)
      const coverUrl =
        b.cover_image_url ||
        listingWithImg?.images?.find((img: { is_primary: boolean; url: string }) => img.is_primary)?.url ||
        listingWithImg?.images?.[0]?.url ||
        null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cat = Array.isArray(b.category) ? b.category[0] : (b.category as any)

      internalResults.push({
        id: b.id,
        title: b.title_ar || b.title,
        title_ar: b.title_ar,
        author: b.author_ar || b.author,
        author_ar: b.author_ar,
        isbn: b.isbn || b.isbn_13,
        published_year: b.published_year,
        cover_url: coverUrl,
        description: b.description_ar || b.description,
        category_name: cat?.name_ar || cat?.name_en || null,
        category_id: cat?.id || null,
        exists_on_platform: activeListings.length > 0,
        listing_count: activeListings.length,
        min_price: minPrice,
        new_min_price: newMinPrice,
        used_min_price: usedMinPrice,
        swap_count: swapCount,
        borrow_count: borrowCount,
        store_count: storeCount,
        has_swap: hasSwap,
        has_giveaway: hasGiveaway,
        locations: Array.from(locationsSet),
        city_breakdown: cityBreakdown,
        internal_book_id: b.id,
        source: 'bookswap',
      })
    }
  }

  // 3. Books-Only External Catalogs
  const externalResults: UniversalBookSearchResult[] = []

  // Engine A: Internet Archive (mediatype:texts) - Filtered Strictly to Books Only
  if (isArabicQuery) {
    try {
      let archiveQueryParts: string[] = []
      if (isLikelyAuthorSearch) {
        archiveQueryParts = arabicVariants.map(v => `creator:("${v.replace(/"/g, '')}")`)
      } else {
        archiveQueryParts = arabicVariants.map(v => `title:("${v.replace(/"/g, '')}")`)
      }

      const archiveQuery = `(${archiveQueryParts.join(' OR ')}) AND mediatype:texts`
      const archiveUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
        archiveQuery
      )}&fl[]=identifier,title,creator,year,description&rows=45&output=json`

      const archiveRes = await fetch(archiveUrl, {
        signal: AbortSignal.timeout(4500),
        headers: { 'User-Agent': 'WaraqBooks/1.0 (contact@waraq.app)' },
        next: { revalidate: 3600 },
      })

      if (archiveRes.ok) {
        const archData = await archiveRes.json()
        const docs = archData.response?.docs || []

        for (const doc of docs) {
          const cleaned = cleanArchiveBook(doc, isLikelyAuthorSearch ? query : null)
          if (!cleaned) continue

          const norm = cleaned.title.trim().toLowerCase()
          if (!seenTitles.has(norm)) {
            seenTitles.add(norm)
            externalResults.push(cleaned)
          }
        }
      }
    } catch (err) {
      console.warn('Archive.org books query error:', err)
    }
  }

  // Engine B: Open Library (Worldwide and Arabic Books Catalog)
  try {
    const encoded = encodeURIComponent(query)
    let openLibUrl = ''

    if (isNumericIsbn) {
      openLibUrl = `https://openlibrary.org/search.json?isbn=${query.replace(/-/g, '')}&limit=10`
    } else if (isLikelyAuthorSearch) {
      openLibUrl = `https://openlibrary.org/search.json?author=${encoded}&limit=15`
    } else {
      openLibUrl = `https://openlibrary.org/search.json?title=${encoded}&limit=12`
    }

    const olRes = await fetch(openLibUrl, {
      signal: AbortSignal.timeout(4000),
      headers: {
        'User-Agent': 'WaraqBooks/1.0 (contact@waraq.app)',
        Accept: 'application/json',
      },
      next: { revalidate: 3600 },
    })

    if (olRes.ok) {
      const olData = await olRes.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docs = (olData.docs || []).slice(0, 15)

      for (const doc of docs) {
        const rawTitle = (doc.title || '').trim()
        if (!rawTitle || NON_BOOK_PATTERN.test(rawTitle)) continue

        const normTitle = rawTitle.toLowerCase()
        const isbn = doc.isbn ? doc.isbn[0] : null
        const cleanDocIsbn = isbn ? isbn.replace(/-/g, '').toLowerCase() : ''

        const isAlreadyInResults =
          (cleanDocIsbn && internalIsbns.has(cleanDocIsbn)) || seenTitles.has(normTitle)

        if (!isAlreadyInResults) {
          seenTitles.add(normTitle)
          const author = doc.author_name ? doc.author_name.join('، ') : 'مؤلف غير معروف'
          const coverUrl = doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
            : null

          externalResults.push({
            id: `ol_${doc.key?.replace(/\//g, '_') || Math.random().toString(36).substring(2, 9)}`,
            title: rawTitle,
            author,
            isbn,
            published_year: doc.first_publish_year || null,
            cover_url: coverUrl,
            description: doc.first_sentence ? doc.first_sentence[0] : null,
            exists_on_platform: false,
            listing_count: 0,
            swap_count: 0,
            borrow_count: 0,
            store_count: 0,
            has_swap: false,
            has_giveaway: false,
            locations: [],
            city_breakdown: [],
            source: 'openlibrary',
          })
        }
      }
    }
  } catch (err) {
    console.warn('Open Library books search error:', err)
  }

  // Engine C: Gemini Literary AI for Regional/Egyptian ISBNs (when not in OpenLibrary)
  if (isNumericIsbn && externalResults.length === 0 && internalResults.length === 0) {
    const geminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.GOOGLE_AI_KEY

    if (geminiKey) {
      try {
        const cleanIsbn = query.replace(/-/g, '')
        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are an expert literary assistant specialized in Arabic and international publishing.
Identify this book by its ISBN: ${cleanIsbn}.
Provide complete metadata in JSON format:
{
  "title": "exact title of the book in Arabic or original language",
  "author": "author full name",
  "published_year": publish year as integer or null,
  "description": "short 1-2 sentence description in Arabic"
}
Return ONLY valid JSON. If the book cannot be identified, return {"title": null}.`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                response_mime_type: 'application/json',
              },
            }),
          }
        )

        if (aiRes.ok) {
          const aiData = await aiRes.json()
          const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text
          if (rawText) {
            const parsed = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim())
            if (parsed.title) {
              externalResults.push({
                id: `ai_${cleanIsbn}`,
                title: parsed.title,
                author: parsed.author || 'مؤلف غير معروف',
                isbn: cleanIsbn,
                published_year: parsed.published_year || null,
                cover_url: null,
                description: parsed.description || null,
                exists_on_platform: false,
                listing_count: 0,
                swap_count: 0,
                borrow_count: 0,
                store_count: 0,
                has_swap: false,
                has_giveaway: false,
                locations: [],
                city_breakdown: [],
                source: 'openlibrary',
              })
            }
          }
        }
      } catch (geminiSearchErr) {
        console.warn('Gemini ISBN search error:', geminiSearchErr)
      }
    }
  }

  // 4. Combine and prioritize
  // Books that exist on BookSwap Egypt always come first!
  let combined = [...internalResults, ...externalResults]

  if (filter === 'available') {
    combined = combined.filter(b => b.exists_on_platform)
  } else if (filter === 'missing') {
    combined = combined.filter(b => !b.exists_on_platform)
  }

  // Sort: Available on BookSwap platform first, then by active listing count
  combined.sort((a, b) => {
    if (a.exists_on_platform && !b.exists_on_platform) return -1
    if (!a.exists_on_platform && b.exists_on_platform) return 1
    return b.listing_count - a.listing_count
  })

  return NextResponse.json({
    query,
    total: combined.length,
    platformCount: internalResults.filter(b => b.exists_on_platform).length,
    externalCount: externalResults.length + internalResults.filter(b => !b.exists_on_platform).length,
    results: combined,
  })
}
