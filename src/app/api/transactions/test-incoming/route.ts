import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let body: { sellerId?: string; listingId?: string; mode?: 'BORROW' | 'BUY' } = {}
    try {
      body = await req.json()
    } catch {
      // empty body is fine
    }

    const sellerId = body.sellerId || user?.id
    if (!sellerId) {
      return NextResponse.json({ error: 'Unauthorized or missing sellerId' }, { status: 401 })
    }

    // 1. Pick an active listing
    let listingId = body.listingId
    let listingTitle = 'كتاب'
    let listingPrice = 40

    if (!listingId) {
      const { data: listings } = await supabase
        .from('book_listings')
        .select('id, price, book:books(title)')
        .eq('seller_id', sellerId)
        .eq('status', 'ACTIVE')
        .limit(1)

      if (listings && listings.length > 0) {
        listingId = listings[0].id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const b: any = listings[0].book
        listingTitle = (Array.isArray(b) ? b[0]?.title : b?.title) || 'كتاب'
        listingPrice = listings[0].price || 40
      } else {
        const { data: anyListing } = await supabase
          .from('book_listings')
          .select('id, price, book:books(title)')
          .eq('status', 'ACTIVE')
          .limit(1)
        if (anyListing && anyListing.length > 0) {
          listingId = anyListing[0].id
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const b: any = anyListing[0].book
          listingTitle = (Array.isArray(b) ? b[0]?.title : b?.title) || 'كتاب'
        }
      }
    }

    // 2. Pick a buyer profile (another reader profile)
    let buyerId = sellerId
    const { data: otherProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .neq('id', sellerId)
      .limit(1)

    if (otherProfiles && otherProfiles.length > 0) {
      buyerId = otherProfiles[0].id
    }

    const mode = body.mode || 'BORROW'
    const loanDays = 14
    const dueDate = new Date(Date.now() + loanDays * 24 * 60 * 60 * 1000).toISOString()
    const deposit = 50
    const borrowFee = 30

    const meetup = {
      preferred_delivery: 'MEETUP',
      location: 'مكتبة الإسكندرية - المدخل الرئيسي (الشاطبي)',
      proposed_times: [
        { label: 'الجمعة 4:30 مساءً', iso: new Date(Date.now() + 2 * 86400000).toISOString() },
        { label: 'السبت 6:00 مساءً', iso: new Date(Date.now() + 3 * 86400000).toISOString() },
      ],
    }

    const buyerNote = JSON.stringify(
      mode === 'BORROW'
        ? {
            mode: 'BORROW',
            loan_days: loanDays,
            due_date: dueDate,
            deposit,
            borrow_fee: borrowFee,
            note: 'طلب استعارة تجريبي لاختبار دورة القبول والتسليم',
            meetup,
          }
        : {
            mode: 'BUY',
            note: 'طلب شراء تجريبي لاختبار دورة القبول والتسليم',
            meetup,
          }
    )

    const payload: Record<string, unknown> = {
      transaction_type: 'BUY',
      status: 'PENDING',
      buyer_id: buyerId,
      seller_id: sellerId,
      listing_id: listingId || null,
      price: mode === 'BUY' ? listingPrice : borrowFee,
      payment_method: 'CASH',
      payment_status: 'UNPAID',
      buyer_note: buyerNote,
      meetup_location: meetup.location,
      deposit_amount: mode === 'BORROW' ? deposit : 0,
      deposit_status: mode === 'BORROW' ? 'HELD' : 'N/A',
    }

    const { data: newTx, error: txErr } = await supabase
      .from('transactions')
      .insert(payload)
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
      .single()

    if (txErr) {
      return NextResponse.json({ error: txErr.message }, { status: 400 })
    }

    // Insert notification
    await supabase.from('notifications').insert({
      user_id: sellerId,
      type: 'BOOK_RESERVED',
      title: mode === 'BORROW' ? 'طلب استعارة مؤقتة جديد ⏱️' : 'طلب شراء جديد 🛒',
      title_ar: mode === 'BORROW' ? 'طلب استعارة مؤقتة جديد ⏱️' : 'طلب شراء جديد 🛒',
      body: `أرسل قارئ طلب ${mode === 'BORROW' ? 'استعارة' : 'شراء'} لكتابك "${listingTitle}". المقابلة المقترحة: 📍 ${meetup.location}`,
      body_ar: `أرسل قارئ طلب ${mode === 'BORROW' ? 'استعارة' : 'شراء'} لكتابك "${listingTitle}". المقابلة المقترحة: 📍 ${meetup.location}`,
      action_url: `/transactions?tab=incoming&id=${newTx?.id}`,
      data: { transaction_id: newTx?.id, meetup },
    })

    return NextResponse.json({ success: true, transaction: newTx })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
