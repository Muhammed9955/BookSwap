import { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TransactionsHubClient } from '@/components/transactions/transactions-hub-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'معاملاتي وطلبات التبادل — WARAQ | ورق',
  description: 'إدارة طلبات المبادلة والشراء والاستعارة النشطة وتتبع تواريخ الإرجاع',
}

export default async function TransactionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/transactions')
  }

  // Fetch all transactions and swap requests involving the user
  const [
    { data: incomingTransactions },
    { data: outgoingTransactions },
    { data: incomingSwaps },
    { data: outgoingSwaps },
    { data: profile },
  ] = await Promise.all([
    // 1. Incoming transactions (User is seller / lender)
    supabase
      .from('transactions')
      .select(`
        id,
        transaction_type,
        status,
        price,
        platform_fee,
        delivery_method,
        payment_method,
        payment_status,
        buyer_note,
        seller_note,
        meetup_location,
        meetup_at,
        deposit_amount,
        borrow_due_date,
        seller_id,
        buyer_id,
        listing_id,
        completed_at,
        created_at,
        buyer:profiles!transactions_buyer_id_fkey(id, full_name, full_name_ar, avatar_url, rating_average),
        listing:book_listings!transactions_listing_id_fkey(
          id,
          price,
          condition,
          book:books(id, title, title_ar, author, cover_image_url),
          images:book_images(url, is_primary)
        )
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),

    // 2. Outgoing transactions (User is buyer / borrower)
    supabase
      .from('transactions')
      .select(`
        id,
        transaction_type,
        status,
        price,
        platform_fee,
        delivery_method,
        payment_method,
        payment_status,
        buyer_note,
        seller_note,
        meetup_location,
        meetup_at,
        deposit_amount,
        borrow_due_date,
        seller_id,
        buyer_id,
        listing_id,
        completed_at,
        created_at,
        seller:profiles!transactions_seller_id_fkey(id, full_name, full_name_ar, avatar_url, rating_average),
        listing:book_listings!transactions_listing_id_fkey(
          id,
          price,
          condition,
          book:books(id, title, title_ar, author, cover_image_url),
          images:book_images(url, is_primary)
        )
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false }),

    // 3. Incoming swap requests (People requesting user's books)
    supabase
      .from('swap_requests')
      .select(`
        id,
        status,
        message,
        response_message,
        responded_at,
        created_at,
        proposed_meetup_location,
        agreed_meetup_location,
        agreed_meetup_at,
        preferred_delivery,
        requester_id,
        listing_id,
        offered_listing_id,
        requester:profiles!swap_requests_requester_id_fkey(id, full_name, full_name_ar, avatar_url),
        listing:book_listings!swap_requests_listing_id_fkey(
          id,
          seller_id,
          book:books(id, title, title_ar, author, cover_image_url),
          images:book_images(url, is_primary)
        ),
        offered_listing:book_listings!swap_requests_offered_listing_id_fkey(
          id,
          book:books(id, title, title_ar, author, cover_image_url),
          images:book_images(url, is_primary)
        )
      `)
      .order('created_at', { ascending: false }),

    // 4. Outgoing swap requests (User requested someone else's book)
    supabase
      .from('swap_requests')
      .select(`
        id,
        status,
        message,
        response_message,
        responded_at,
        created_at,
        proposed_meetup_location,
        agreed_meetup_location,
        agreed_meetup_at,
        preferred_delivery,
        requester_id,
        listing_id,
        offered_listing_id,
        listing:book_listings!swap_requests_listing_id_fkey(
          id,
          seller_id,
          seller:profiles!book_listings_seller_id_fkey(id, full_name, full_name_ar, avatar_url),
          book:books(id, title, title_ar, author, cover_image_url),
          images:book_images(url, is_primary)
        ),
        offered_listing:book_listings!swap_requests_offered_listing_id_fkey(
          id,
          book:books(id, title, title_ar, author, cover_image_url),
          images:book_images(url, is_primary)
        )
      `)
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false }),

    // 5. Current profile
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
  ])

  // Filter incoming swaps to only listings owned by this user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myIncomingSwaps = (incomingSwaps || []).filter((s: any) => s.listing?.seller_id === user.id)

  return (
    <Suspense fallback={<div className="page-container py-12 text-center text-muted-foreground font-bold">جاري تحميل المعاملات والطلبات...</div>}>
      <TransactionsHubClient
        currentUserId={user.id}
        userProfile={profile}
        incomingTransactions={incomingTransactions || []}
        outgoingTransactions={outgoingTransactions || []}
        incomingSwaps={myIncomingSwaps}
        outgoingSwaps={outgoingSwaps || []}
      />
    </Suspense>
  )
}

