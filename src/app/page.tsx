import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { HomePageClient } from '@/components/home/home-page-client'
import { getCommunities, DEMO_COMMUNITIES } from '@/lib/communities/community-service'
import { Community } from '@/types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'BookSwap — بدّلها | بادِل كتبك في مدينتك',
  description: 'بادِل كتبك، اشترِ بأسعار رمزية، أو استعر مع مجتمع القراء في مدينتك وحيك. كتابك القديم كنز ينتظر قارئاً قريباً منك.',
}

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch recent listings
  const { data: recentListings } = await supabase
    .from('book_listings')
    .select(`
      *,
      book:books(*, category:categories(*)),
      seller:profiles(id, full_name, full_name_ar, avatar_url, rating_average, rating_count),
      city:cities(id, name_ar, name_en, slug),
      area:areas(id, name_ar, name_en, slug),
      images:book_images(id, url, is_primary, sort_order)
    `)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(12)

  // Fetch featured listings
  const { data: featuredListings } = await supabase
    .from('book_listings')
    .select(`
      *,
      book:books(*, category:categories(*)),
      seller:profiles(id, full_name, full_name_ar, avatar_url, rating_average),
      area:areas(id, name_ar, name_en),
      images:book_images(id, url, is_primary, sort_order)
    `)
    .eq('status', 'ACTIVE')
    .eq('is_featured', true)
    .gt('featured_until', new Date().toISOString())
    .limit(6)

  // Fetch giveaway listings
  const { data: giveawayListings } = await supabase
    .from('book_listings')
    .select(`
      *,
      book:books(*, category:categories(*)),
      seller:profiles(id, full_name, full_name_ar, avatar_url, rating_average),
      area:areas(id, name_ar, name_en),
      images:book_images(id, url, is_primary, sort_order)
    `)
    .eq('status', 'ACTIVE')
    .eq('listing_type', 'GIVEAWAY')
    .order('created_at', { ascending: false })
    .limit(6)

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  // Fetch popular books (by wishlist count)
  const { data: popularListings } = await supabase
    .from('book_listings')
    .select(`
      *,
      book:books(*, category:categories(*)),
      seller:profiles(id, full_name, full_name_ar, avatar_url, rating_average),
      area:areas(id, name_ar, name_en),
      images:book_images(id, url, is_primary, sort_order)
    `)
    .eq('status', 'ACTIVE')
    .order('wishlist_count', { ascending: false })
    .limit(8)

  // Fetch wishlist for logged-in user
  let userWishlistBookIds: string[] = []
  let userProfile = null

  if (user) {
    const [{ data: wishlist }, { data: profile }] = await Promise.all([
      supabase
        .from('wishlist_items')
        .select('book_id')
        .eq('user_id', user.id),
      supabase
        .from('profiles')
        .select('*, city:cities(*), area:areas(*)')
        .eq('id', user.id)
        .single()
    ])

    userWishlistBookIds = wishlist?.map(w => w.book_id).filter(Boolean) ?? []
    userProfile = profile
  }

  // Most wanted books (wishlist aggregation)
  const { data: wantedBooks } = await supabase
    .from('books')
    .select('*, category:categories(*)')
    .gt('wishlist_count', 0)
    .order('wishlist_count', { ascending: false })
    .limit(10)

  // Fetch communities for Safe Hubs & Clubs spotlight
  let communities: Community[] = []
  try {
    const comms = await getCommunities({ _client: supabase, currentUserId: user?.id ?? null })
    if (comms && comms.length > 0) {
      communities = comms.slice(0, 4)
    } else {
      communities = DEMO_COMMUNITIES.slice(0, 4)
    }
  } catch {
    communities = DEMO_COMMUNITIES.slice(0, 4)
  }

  return (
    <HomePageClient
      user={user ? { id: user.id, profile: userProfile } : null}
      recentListings={recentListings ?? []}
      featuredListings={featuredListings ?? []}
      giveawayListings={giveawayListings ?? []}
      popularListings={popularListings ?? []}
      categories={categories ?? []}
      wantedBooks={wantedBooks ?? []}
      userWishlistBookIds={userWishlistBookIds}
      communities={communities}
    />
  )
}
