import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from '@/components/profile/profile-client'

export const dynamic = 'force-dynamic'

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, full_name_ar, bio')
    .or(`username.eq.${username},id.eq.${username}`)
    .single()

  if (!profile) return { title: 'ملف شخصي — BookSwap' }
  return {
    title: `${profile.full_name ?? 'مستخدم'} — BookSwap`,
    description: profile.bio ?? 'ملف شخصي على BookSwap',
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, city:cities(*), area:areas(*), genres:profile_genres(category:categories(*))')
    .or(`username.eq.${username},id.eq.${username}`)
    .single()

  if (!profile) notFound()

  const [{ data: listings }, { data: ratings }, { count: followerCount }] = await Promise.all([
    supabase.from('book_listings')
      .select('*, book:books(title, title_ar, author, cover_image_url), images:book_images(url, is_primary), area:areas(name_ar, name_en)')
      .eq('seller_id', profile.id)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('ratings')
      .select('*, rater:profiles!ratings_rater_id_fkey(id, full_name, full_name_ar, avatar_url)')
      .eq('rated_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('follows')
      .select('follower_id', { count: 'exact' })
      .eq('following_id', profile.id),
  ])

  let isFollowing = false
  const isOwnProfile = currentUser ? currentUser.id === profile.id : false

  if (currentUser && !isOwnProfile) {
    const { data: followData } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', profile.id)
      .maybeSingle()
    isFollowing = !!followData
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let incomingTransactions: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let outgoingTransactions: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let incomingSwaps: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let outgoingSwaps: any[] = []

  if (isOwnProfile) {
    const [
      { data: inTx },
      { data: outTx },
      { data: inSwaps },
      { data: outSwaps },
    ] = await Promise.all([
      supabase
        .from('transactions')
        .select(`
          id, transaction_type, status, price, delivery_method, buyer_note, created_at,
          buyer:profiles!transactions_buyer_id_fkey(id, full_name, full_name_ar, avatar_url),
          listing:book_listings!transactions_listing_id_fkey(id, price, book:books(id, title, title_ar, author, cover_image_url), images:book_images(url, is_primary))
        `)
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50),

      supabase
        .from('transactions')
        .select(`
          id, transaction_type, status, price, delivery_method, buyer_note, created_at,
          seller:profiles!transactions_seller_id_fkey(id, full_name, full_name_ar, avatar_url),
          listing:book_listings!transactions_listing_id_fkey(id, price, book:books(id, title, title_ar, author, cover_image_url), images:book_images(url, is_primary))
        `)
        .eq('buyer_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50),

      supabase
        .from('swap_requests')
        .select(`
          id, status, message, created_at,
          requester:profiles!swap_requests_requester_id_fkey(id, full_name, full_name_ar, avatar_url),
          listing:book_listings!swap_requests_listing_id_fkey(id, seller_id, book:books(id, title, title_ar, author, cover_image_url), images:book_images(url, is_primary)),
          offered_listing:book_listings!swap_requests_offered_listing_id_fkey(id, book:books(id, title, title_ar, author, cover_image_url), images:book_images(url, is_primary))
        `)
        .order('created_at', { ascending: false })
        .limit(50),

      supabase
        .from('swap_requests')
        .select(`
          id, status, message, created_at,
          listing:book_listings!swap_requests_listing_id_fkey(id, seller_id, seller:profiles!book_listings_seller_id_fkey(id, full_name, full_name_ar, avatar_url), book:books(id, title, title_ar, author, cover_image_url), images:book_images(url, is_primary)),
          offered_listing:book_listings!swap_requests_offered_listing_id_fkey(id, book:books(id, title, title_ar, author, cover_image_url), images:book_images(url, is_primary))
        `)
        .eq('requester_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    incomingTransactions = inTx || []
    outgoingTransactions = outTx || []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    incomingSwaps = (inSwaps || []).filter((s: any) => s.listing?.seller_id === profile.id)
    outgoingSwaps = outSwaps || []
  }

  return (
    <ProfileClient
      profile={profile}
      listings={listings ?? []}
      ratings={ratings ?? []}
      followerCount={followerCount ?? 0}
      isFollowing={isFollowing}
      isOwnProfile={isOwnProfile}
      currentUserId={currentUser?.id}
      incomingTransactions={incomingTransactions}
      outgoingTransactions={outgoingTransactions}
      incomingSwaps={incomingSwaps}
      outgoingSwaps={outgoingSwaps}
    />
  )
}
