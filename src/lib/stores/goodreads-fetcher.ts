/**
 * Goodreads Rich Book Fetcher & Parser
 * Supports:
 * 1. Direct Goodreads book URL (e.g., https://www.goodreads.com/ar/book/show/55478259)
 * 2. Goodreads Book ID (e.g., 55478259)
 * 3. ISBN (ISBN-10 or ISBN-13)
 * 4. Title & Author query
 */

export interface GoodreadsRichBook {
  id: string
  title: string
  title_ar?: string
  author: string
  author_ar?: string
  cover_url?: string
  rating?: number
  rating_count?: number
  review_count?: number
  pages_count?: number
  published_year?: number
  first_published?: string
  category_name?: string
  genres: string[]
  goodreads_url: string
  description?: string
  description_ar?: string
  author_details?: {
    name?: string
    bio?: string
    image_url?: string
  }
  community_reviews?: Array<{
    name: string
    text: string
    rating?: number
    date?: string
    verified?: boolean
  }>
  isbn?: string
  source: 'goodreads'
}

function cleanText(str?: string): string {
  if (!str) return ''
  return str.replace(/[\u200E\u200F\u202A-\u202E]/g, '').trim()
}

function cleanHtml(html?: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

const GENRE_MAP: Record<string, string> = {
  'self-help': 'تطوير الذات وعلم النفس',
  'psychology': 'تطوير الذات وعلم النفس',
  'personal-development': 'تطوير الذات وعلم النفس',
  'business': 'أعمال ومالية',
  'finance': 'أعمال ومالية',
  'money': 'أعمال ومالية',
  'economics': 'أعمال ومالية',
  'fiction': 'روايات وأدب',
  'novels': 'روايات وأدب',
  'literature': 'روايات وأدب',
  'classics': 'روايات وأدب',
  'history': 'تاريخ وسير ذاتية',
  'biography': 'تاريخ وسير ذاتية',
  'memoir': 'تاريخ وسير ذاتية',
  'religion': 'دين وفكر إسلامي',
  'islam': 'دين وفكر إسلامي',
  'spirituality': 'دين وفكر إسلامي',
  'philosophy': 'فلسفة واجتماع',
  'sociology': 'فلسفة واجتماع',
  'science': 'علوم وتكنولوجيا',
  'technology': 'علوم وتكنولوجيا',
  'thriller': 'غموض ورعب وتشويق',
  'mystery': 'غموض ورعب وتشويق',
  'horror': 'غموض ورعب وتشويق',
  'crime': 'غموض ورعب وتشويق',
  'poetry': 'شعر ونصوص',
  'children': 'كتب أطفال ويافعين',
  'young-adult': 'كتب أطفال ويافعين',
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
]

export async function fetchRichBookFromGoodreads(queryOrUrl: string): Promise<GoodreadsRichBook | null> {
  const query = queryOrUrl.trim()
  if (!query) return null

  const isDirectUrl = /goodreads\.com\/(?:[a-z]{2}\/)?book\/show\/(\d+)/i.test(query)
  const isDirectId = /^\d{5,12}$/.test(query)
  const isIsbn = /^(97[89]\d{10}|\d{9}[\dX])$/i.test(query.replace(/[-\s]/g, ''))

  let targetBookUrl = ''

  if (isDirectUrl) {
    const match = query.match(/book\/show\/(\d+)/i)
    if (match) targetBookUrl = `https://www.goodreads.com/book/show/${match[1]}`
  } else if (isDirectId) {
    targetBookUrl = `https://www.goodreads.com/book/show/${query}`
  } else {
    // Search on Goodreads
    const cleanQ = isIsbn ? query.replace(/[-\s]/g, '') : query
    const searchUrl = `https://www.goodreads.com/search?search_type=books&q=${encodeURIComponent(cleanQ)}`

    try {
      const searchRes = await fetch(searchUrl, {
        redirect: 'manual',
        headers: {
          'User-Agent': USER_AGENTS[0],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ar,en;q=0.9',
        },
      })

      const loc = searchRes.headers.get('location')
      if (loc && /book\/show\/(\d+)/i.test(loc)) {
        const idMatch = loc.match(/book\/show\/(\d+)/i)
        targetBookUrl = idMatch ? `https://www.goodreads.com/book/show/${idMatch[1]}` : loc
      } else if (searchRes.status === 200) {
        const searchHtml = await searchRes.text()
        const match = searchHtml.match(/\/book\/show\/(\d+)/i)
        if (match) {
          targetBookUrl = `https://www.goodreads.com/book/show/${match[1]}`
        }
      }
      } catch (err) {
        console.warn('Goodreads search query failed:', err)
      }

      // Fast fallback search for Goodreads Book ID
      if (!targetBookUrl) {
        try {
          const ddgUrl = `https://html.duckduckgo.com/html/?q=site:goodreads.com/book/show+${encodeURIComponent(cleanQ)}`
          const res = await fetch(ddgUrl, {
            headers: {
              'User-Agent': USER_AGENTS[0],
            },
          })
          if (res.ok) {
            const html = await res.text()
            const match = html.match(/goodreads\.com\/book\/show\/(\d+)/i)
            if (match) {
              targetBookUrl = `https://www.goodreads.com/book/show/${match[1]}`
            }
          }
        } catch (err) {
          console.warn('Fallback search for Goodreads ID error:', err)
        }
      }
    }

    if (!targetBookUrl) {
      return null
    }

  try {
    const bookRes = await fetch(targetBookUrl, {
      headers: {
        'User-Agent': USER_AGENTS[0],
        'Referer': 'https://www.goodreads.com/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
      },
      next: { revalidate: 86400 }, // Cache 24 hours
    })

    if (!bookRes.ok) return null
    const html = await bookRes.text()

    // 1. Parse JSON-LD
    let ld: any = null
    const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)
    if (ldMatch) {
      try {
        ld = JSON.parse(ldMatch[1])
      } catch {}
    }

    const rawTitle = cleanText(ld?.name || '')
    const image = ld?.image && !ld.image.includes('nophoto') ? ld.image : undefined
    const numberOfPages = ld?.numberOfPages ? Number(ld.numberOfPages) : undefined
    const ratingValue = ld?.aggregateRating?.ratingValue ? Number(Number(ld.aggregateRating.ratingValue).toFixed(2)) : undefined
    const ratingCount = ld?.aggregateRating?.ratingCount ? Number(ld.aggregateRating.ratingCount) : undefined
    const reviewCount = ld?.aggregateRating?.reviewCount ? Number(ld.aggregateRating.reviewCount) : undefined
    const extractedIsbn = ld?.isbn || undefined

    // 2. Parse Authors
    let authorAr = ''
    let authorEn = ''
    if (Array.isArray(ld?.author)) {
      for (const a of ld.author) {
        const aName = cleanText(a?.name || '')
        if (/[\u0600-\u06FF]/.test(aName) && !authorAr) {
          authorAr = aName
        } else if (!authorEn) {
          authorEn = aName
        }
      }
    }

    // 3. Parse Description
    const descMatch =
      html.match(/<div[^>]*data-testid="description"[^>]*>([\s\S]*?)<\/div>/i) ||
      html.match(/<meta property="og:description" content="([^"]+)"/i)
    const rawDesc = descMatch ? descMatch[1] : (ld?.description || '')
    const description = cleanHtml(rawDesc)

    // 4. Parse Genres & Map to Store Category
    const genreMatches = [...html.matchAll(/\/genres\/([a-zA-Z0-9-]+)"/g)].map(m => m[1])
    const uniqueGenres = [...new Set(genreMatches)].slice(0, 10)
    let mappedCategory = 'روايات وأدب'
    for (const g of uniqueGenres) {
      if (GENRE_MAP[g.toLowerCase()]) {
        mappedCategory = GENRE_MAP[g.toLowerCase()]
        break
      }
    }

    // 5. Parse Publication Info
    let publishedYear: number | undefined = undefined
    let firstPublishedStr: string | undefined = undefined
    const pubMatch =
      html.match(/data-testid="publication_info">([^<]+)<\/p>/i) ||
      html.match(/First published\s+([^<]+)/i) ||
      html.match(/published\s+([A-Za-z]+ \d+, \d{4}|\d{4})/i)
    if (pubMatch) {
      firstPublishedStr = cleanHtml(pubMatch[1])
      const yearMatch = pubMatch[1].match(/\b(18\d{2}|19\d{2}|20\d{2})\b/)
      if (yearMatch) publishedYear = Number(yearMatch[1])
    }

    // 6. Parse Apollo State from __NEXT_DATA__ for Author Details & Community Reviews
    let authorDetails: { name?: string; bio?: string; image_url?: string } | undefined = undefined
    const communityReviews: Array<{ name: string; text: string; rating?: number; date?: string; verified?: boolean }> = []

    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i)
    if (nextDataMatch) {
      try {
        const nextJson = JSON.parse(nextDataMatch[1])
        const apollo = nextJson?.props?.pageProps?.apolloState || {}

        for (const [k, v] of Object.entries<any>(apollo)) {
          // Author Contributor
          if (k.startsWith('Contributor:') && v?.name && !authorDetails?.bio) {
            authorDetails = {
              name: v.name,
              bio: v.description ? cleanHtml(v.description) : undefined,
              image_url: v.profileImageUrl || undefined,
            }
          }

          // Community Reviews
          if (k.startsWith('Review:') && v?.text) {
            const cleanRev = cleanHtml(v.text)
            if (cleanRev.length > 30) {
              communityReviews.push({
                name: v.creator?.name || 'قارئ موثق على Goodreads',
                text: cleanRev.length > 400 ? cleanRev.slice(0, 400) + '...' : cleanRev,
                rating: v.rating || ratingValue || 5,
                date: v.createdAt ? new Date(v.createdAt).toLocaleDateString('ar-EG') : 'مراجعة معتمدة',
                verified: true,
              })
            }
          }
        }
      } catch (err) {
        console.warn('Apollo state parse warning:', err)
      }
    }

    // Canonical Goodreads Show URL
    const canonicalIdMatch = targetBookUrl.match(/book\/show\/(\d+)/i)
    const cleanGoodreadsUrl = canonicalIdMatch
      ? `https://www.goodreads.com/book/show/${canonicalIdMatch[1]}`
      : targetBookUrl.split('?')[0]

    const bookId = canonicalIdMatch ? canonicalIdMatch[1] : `gr-${Date.now()}`

    return {
      id: `gr-${bookId}`,
      title: rawTitle || query,
      title_ar: /[\u0600-\u06FF]/.test(rawTitle) ? rawTitle : undefined,
      author: authorEn || authorAr || 'مؤلف معتمد',
      author_ar: authorAr || authorEn,
      cover_url: image,
      rating: ratingValue,
      rating_count: ratingCount,
      review_count: reviewCount,
      pages_count: numberOfPages,
      published_year: publishedYear,
      first_published: firstPublishedStr,
      category_name: mappedCategory,
      genres: uniqueGenres,
      goodreads_url: cleanGoodreadsUrl,
      description: description,
      description_ar: /[\u0600-\u06FF]/.test(description) ? description : undefined,
      author_details: authorDetails,
      community_reviews: communityReviews.slice(0, 5),
      isbn: extractedIsbn,
      source: 'goodreads',
    }
  } catch (err) {
    console.error('Failed to parse book details from Goodreads:', err)
    return null
  }
}
