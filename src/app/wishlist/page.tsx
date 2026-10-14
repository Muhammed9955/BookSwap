import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MainLayout } from '@/components/layout/main-layout'
import { WishlistClient } from '@/components/wishlist/wishlist-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'قائمة الأمنيات — BookSwap' }

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wishlistItems } = await supabase
    .from('wishlist_items')
    .select(`
      *,
      book:books(
        id, title, title_ar, author, author_ar, cover_image_url,
        listing_count, wishlist_count,
        category:categories(name_ar, name_en, icon)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // For each wishlisted book, check if there are matching listings
  const matchingListings: Record<string, boolean> = {}
  if (wishlistItems && wishlistItems.length > 0) {
    const bookIds = wishlistItems.map(w => w.book_id).filter(Boolean)
    if (bookIds.length > 0) {
      const { data: existingListings } = await supabase
        .from('book_listings')
        .select('book_id')
        .in('book_id', bookIds)
        .eq('status', 'ACTIVE')
        .neq('seller_id', user.id)
      
      existingListings?.forEach(l => {
        if (l.book_id) matchingListings[l.book_id] = true
      })
    }
  }

  return (
    <MainLayout user={{ id: user.id }}>
      <WishlistClient
        userId={user.id}
        wishlistItems={wishlistItems ?? []}
        matchingListings={matchingListings}
      />
    </MainLayout>
  )
}

