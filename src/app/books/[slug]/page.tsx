import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookDetailClient } from '@/components/books/book-detail-client'

export const dynamic = 'force-dynamic'

interface BookPageProps {
  params: Promise<{ slug: string }>
}

const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

function extractListingId(slug: string): string {
  const match = slug.match(uuidRegex)
  if (match) return match[0]
  const parts = slug.split('-')
  return parts[parts.length - 1]
}

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { slug } = await params
  const listingId = extractListingId(slug)
  
  const supabase = await createClient()

  let listing: any = null
  try {
    if (isValidUUID(listingId)) {
      const { data } = await supabase
        .from('book_listings')
        .select('book:books(title, author, description, cover_image_url)')
        .eq('id', listingId)
        .maybeSingle()
      listing = data
    }
  } catch {}

  const book = Array.isArray(listing?.book) ? listing.book[0] : listing?.book
  if (!book) return { title: 'كتاب — WARAQ | ورق' }

  return {
    title: `${book.title} — WARAQ | ورق`,
    description: book.description ?? `${book.title} بقلم ${book.author}`,
    openGraph: {
      title: book.title,
      description: book.description ?? '',
      images: book.cover_image_url ? [{ url: book.cover_image_url }] : [],
    },
  }
}

export default async function BookDetailPage({ params }: BookPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Extract listing ID or UUID from slug
  const listingId = extractListingId(slug)
  const isUUID = isValidUUID(listingId)

  let listing: any = null

  // 1. Try by listing ID first if it's a valid UUID
  if (isUUID) {
    const { data } = await supabase
      .from('book_listings')
      .select(`
        *,
        book:books(*, category:categories(*)),
        seller:profiles(id, username, full_name, full_name_ar, avatar_url, whatsapp_number, show_whatsapp, rating_average, rating_count, total_transactions, is_verified, created_at, city:cities(*), area:areas(*)),
        city:cities(*),
        area:areas(*),
        images:book_images(id, url, is_primary, sort_order)
      `)
      .eq('id', listingId)
      .maybeSingle()

    listing = data

    // 2. If not found by listing id, check if it's a book_id
    if (!listing) {
      const { data: byBookId } = await supabase
        .from('book_listings')
        .select(`
          *,
          book:books(*, category:categories(*)),
          seller:profiles(id, username, full_name, full_name_ar, avatar_url, whatsapp_number, show_whatsapp, rating_average, rating_count, total_transactions, is_verified, created_at, city:cities(*), area:areas(*)),
          city:cities(*),
          area:areas(*),
          images:book_images(id, url, is_primary, sort_order)
        `)
        .eq('book_id', listingId)
        .limit(1)
        .maybeSingle()

      listing = byBookId
    }
  }

  // 3. Fallback: If not a UUID or not found, try matching by book title from slug
  if (!listing) {
    const cleanedTitle = decodeURIComponent(slug).replace(/[-_]+/g, ' ').trim()
    if (cleanedTitle && cleanedTitle.length > 1) {
      const { data: bookMatch } = await supabase
        .from('books')
        .select('id')
        .or(`title.ilike.%${cleanedTitle}%,title_ar.ilike.%${cleanedTitle}%`)
        .limit(1)
        .maybeSingle()

      if (bookMatch) {
        const { data: byBookTitle } = await supabase
          .from('book_listings')
          .select(`
            *,
            book:books(*, category:categories(*)),
            seller:profiles(id, username, full_name, full_name_ar, avatar_url, whatsapp_number, show_whatsapp, rating_average, rating_count, total_transactions, is_verified, created_at, city:cities(*), area:areas(*)),
            city:cities(*),
            area:areas(*),
            images:book_images(id, url, is_primary, sort_order)
          `)
          .eq('book_id', bookMatch.id)
          .eq('status', 'ACTIVE')
          .limit(1)
          .maybeSingle()

        listing = byBookTitle
      }
    }
  }

  if (!listing) notFound()

  // Hide deleted or hidden listings from non-owners; allow ACTIVE, RESERVED, and SOLD to load
  const isOwner = user?.id === listing.seller_id
  if (!isOwner && (listing.status === 'DELETED' || listing.status === 'HIDDEN')) {
    notFound()
  }

  // Increment view count
  await supabase.from('book_listings').update({ view_count: (listing.view_count ?? 0) + 1 }).eq('id', listing.id)

  // Fetch similar listings (same book or same category)
  const { data: similarListings } = await supabase
    .from('book_listings')
    .select(`
      *,
      book:books(*),
      seller:profiles(id, full_name, rating_average),
      area:areas(id, name_ar, name_en),
      images:book_images(id, url, is_primary)
    `)
    .eq('status', 'ACTIVE')
    .eq('book_id', listing.book_id)
    .neq('id', listing.id)
    .limit(6)

  // Fetch other listings from same seller
  const { data: sellerListings } = await supabase
    .from('book_listings')
    .select(`
      *,
      book:books(*),
      area:areas(id, name_ar, name_en),
      images:book_images(id, url, is_primary)
    `)
    .eq('status', 'ACTIVE')
    .eq('seller_id', listing.seller_id)
    .neq('id', listing.id)
    .limit(6)

  // Check if user has wishlisted this book or already has a pending request
  let isWishlisted = false
  let userProfile = null
  let userListings: Array<{
    id: string
    condition?: string
    book: {
      title: string
      author?: string
      cover_image_url?: string | null
    }
  }> = []
  let existingRequest: {
    id: string
    type: 'BUY' | 'BORROW' | 'SWAP'
    status: string
    createdAt: string
    loanDays?: number
    deposit?: number
  } | null = null

  if (user) {
    const [
      { data: wishlist },
      { data: profile },
      { data: myListings },
      { data: pendingTx },
      { data: pendingSwap },
    ] = await Promise.all([
      supabase.from('wishlist_items').select('id').eq('user_id', user.id).eq('book_id', listing.book_id).maybeSingle(),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('book_listings')
        .select(`
          id,
          condition,
          book:books(title, author, cover_image_url),
          images:book_images(url, is_primary)
        `)
        .eq('seller_id', user.id)
        .eq('status', 'ACTIVE')
        .limit(30),
      supabase
        .from('transactions')
        .select('id, status, transaction_type, buyer_note, created_at')
        .eq('listing_id', listing.id)
        .eq('buyer_id', user.id)
        .in('status', ['PENDING', 'ACCEPTED'])
        .maybeSingle(),
      supabase
        .from('swap_requests')
        .select('id, status, created_at')
        .eq('listing_id', listing.id)
        .eq('requester_id', user.id)
        .in('status', ['PENDING', 'ACCEPTED'])
        .maybeSingle(),
    ])
    isWishlisted = !!wishlist
    userProfile = profile
    userListings = (myListings ?? []).map((l: any) => {
      const b = Array.isArray(l.book) ? l.book[0] : l.book
      const imgs = Array.isArray(l.images) ? l.images : []
      const primaryImg = imgs.find((img: any) => img.is_primary)?.url || imgs[0]?.url || b?.cover_image_url || null
      return {
        id: l.id,
        condition: l.condition ?? 'GOOD',
        book: {
          title: b?.title ?? '',
          author: b?.author ?? '',
          cover_image_url: primaryImg,
        },
      }
    })

    if (pendingTx) {
      let mode: 'BUY' | 'BORROW' = 'BUY'
      let loanDays: number | undefined
      let deposit: number | undefined
      try {
        const parsed = JSON.parse(pendingTx.buyer_note || '{}')
        if (parsed.mode === 'BORROW') {
          mode = 'BORROW'
          loanDays = parsed.loan_days
          deposit = parsed.deposit
        }
      } catch {}
      existingRequest = {
        id: pendingTx.id,
        type: mode,
        status: pendingTx.status,
        createdAt: pendingTx.created_at,
        loanDays,
        deposit,
      }
    } else if (pendingSwap) {
      existingRequest = {
        id: pendingSwap.id,
        type: 'SWAP',
        status: pendingSwap.status,
        createdAt: pendingSwap.created_at,
      }
    }
  }

  // People looking for this book (wishlist count)
  const { count: wantCount } = await supabase
    .from('wishlist_items')
    .select('id', { count: 'exact' })
    .eq('book_id', listing.book_id)

  return (
    <BookDetailClient
      listing={listing}
      user={user ? { id: user.id, profile: userProfile } : null}
      similarListings={similarListings ?? []}
      sellerListings={sellerListings ?? []}
      isWishlisted={isWishlisted}
      wantCount={wantCount ?? 0}
      userListings={userListings}
      existingRequest={existingRequest}
    />
  )
}
