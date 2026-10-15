import { createClient } from '@/lib/supabase/client'

export interface LoanPayload {
  mode: 'BORROW'
  loan_days: number
  due_date: string
  deposit: number
  borrow_fee: number
  note?: string
}

// ─────────────────────────────────────────────────────────────
// MEETUP / LOCATION TYPES
// Shared across Buy, Borrow, and Swap — same fields everywhere
// ─────────────────────────────────────────────────────────────
export type DeliveryPreference = 'MEETUP' | 'COMMUNITY_HUB' | 'COURIER'

export interface MeetupProposal {
  /** Free-text location e.g. "Cilantro Maadi", "Shatby Library entrance" */
  location?: string
  /** FK to areas table */
  area_id?: string
  /** FK to communities table (when COMMUNITY_HUB) */
  hub_id?: string
  /** Lat/Lng for optional map pin */
  lat?: number
  lng?: number
  /** Array of available time slots */
  proposed_times?: Array<{ label: string; iso: string }>
  preferred_delivery: DeliveryPreference
  /** Specific meetup date e.g. "2026-10-18" */
  meetup_date?: string
  /** Specific meetup time e.g. "17:30" */
  meetup_time?: string
  /** Requester phone number for fast communication & calling */
  contact_phone?: string
}

/**
 * Format a human-readable meetup summary for chat messages and notifications.
 */
export function formatMeetupSummary(meetup?: MeetupProposal): string {
  if (!meetup) return ''
  const parts: string[] = []
  if (meetup.preferred_delivery === 'COMMUNITY_HUB') {
    parts.push('🏪 نقطة استلام آمنة (Community Hub)')
  } else if (meetup.preferred_delivery === 'COURIER') {
    parts.push('🚚 شحن وتوصيل (رسوم الشحن على المشتري)')
  } else if (meetup.location) {
    parts.push(`📍 مكان اللقاء: ${meetup.location}`)
  }

  if (meetup.meetup_date) {
    const formattedDate = new Date(meetup.meetup_date).toLocaleDateString('ar-EG', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    const timeStr = meetup.meetup_time ? ` الساعة ${meetup.meetup_time}` : ''
    parts.push(`📅 الموعد: ${formattedDate}${timeStr}`)
  } else if (meetup.proposed_times && meetup.proposed_times.length > 0) {
    parts.push(`🕐 الأوقات المقترحة: ${meetup.proposed_times.map(t => t.label).join(' أو ')}`)
  }

  if (meetup.contact_phone) {
    parts.push(`📞 للتواصل السريع: ${meetup.contact_phone}`)
  }

  return parts.join(' | ')
}

/**
 * Get or create a 1-to-1 conversation between two users
 */
export async function getOrCreateConversation(
  supabase: ReturnType<typeof createClient>,
  userAId: string,
  userBId: string,
  listingId?: string
): Promise<string | null> {
  const p1 = userAId < userBId ? userAId : userBId
  const p2 = userAId < userBId ? userBId : userAId

  try {
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('participant_1', p1)
      .eq('participant_2', p2)
      .maybeSingle()

    if (existing?.id) {
      return existing.id
    }

    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        participant_1: p1,
        participant_2: p2,
        listing_id: listingId || null,
      })
      .select('id')
      .single()

    if (error) {
      console.warn('Could not create conversation:', error)
      return null
    }

    return newConv?.id ?? null
  } catch (err) {
    console.error('getOrCreateConversation error:', err)
    return null
  }
}

/**
 * Send a chat message into a conversation and update the conversation timestamp
 */
export async function sendChatMessage(
  supabase: ReturnType<typeof createClient>,
  conversationId: string,
  senderId: string,
  content: string
) {
  try {
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      message_type: 'TEXT',
    })

    await supabase
      .from('conversations')
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
  } catch (err) {
    console.error('sendChatMessage error:', err)
  }
}

/**
 * Safe helper to push notifications with error logging so RLS or enum quirks don't crash flows
 */
export async function pushNotificationSafe(
  supabase: ReturnType<typeof createClient>,
  payload: {
    user_id: string
    type: string
    title: string
    title_ar?: string
    body?: string
    body_ar?: string
    action_url?: string
    data?: Record<string, unknown>
  }
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { error } = await supabase.from('notifications').insert(payload as any)
    if (error && (error.message?.includes('enum') || error.code === '22P02')) {
      // If remote Postgres DB doesn't have custom notification_type enum values yet, fallback to a standard enum
      const fallbackPayload = { ...payload, type: 'TRANSACTION_COMPLETED' }
      const res = await supabase.from('notifications').insert(fallbackPayload as any)
      error = res.error
    }
    if (error) {
      console.warn('[pushNotificationSafe] Notice from database:', error.message, error.details || '')
    }
  } catch (err) {
    console.warn('[pushNotificationSafe] Exception inserting notification:', err)
  }
}

/**
 * 1. BUY REQUEST LIFECYCLE
 * Works for Buy — includes optional meetup location in the request
 */
export async function submitBuyRequest(params: {
  buyerId: string
  sellerId: string
  listingId: string
  price?: number | null
  bookTitle: string
  buyerNote?: string
  meetup?: MeetupProposal
}) {
  const supabase = createClient()
  const { buyerId, sellerId, listingId, price, bookTitle, buyerNote, meetup } = params

  // 0. Validations (User & Listing rules)
  if (!buyerId || !sellerId || !listingId) {
    throw new Error('بيانات الطلب غير مكتملة.')
  }
  if (buyerId === sellerId && process.env.NODE_ENV === 'production') {
    throw new Error('لا يمكنك إرسال طلب شراء لكتابك الخاص.')
  }

  // Check listing status
  const { data: listingCheck } = await supabase
    .from('book_listings')
    .select('id, status')
    .eq('id', listingId)
    .maybeSingle()

  if (listingCheck && listingCheck.status !== 'ACTIVE') {
    throw new Error('عذراً، هذا الكتاب محجوز أو تم بيعه بالفعل.')
  }

  // Check for duplicate pending buy request
  const { data: duplicateCheck } = await supabase
    .from('transactions')
    .select('id')
    .eq('buyer_id', buyerId)
    .eq('listing_id', listingId)
    .eq('status', 'PENDING')
    .maybeSingle()

  if (duplicateCheck) {
    throw new Error('لديك بالفعل طلب شراء معلق لهذا الكتاب قيد مراجعة المالك.')
  }

  // 1. Create transaction row (resilient to missing migration columns)
  let transaction: { id: string } | null = null
  const computedMeetupAt = meetup?.meetup_date
    ? new Date(meetup.meetup_time ? `${meetup.meetup_date}T${meetup.meetup_time}` : meetup.meetup_date).toISOString()
    : null

  const payloadWithMeetup: Record<string, unknown> = {
    transaction_type: 'BUY',
    status: 'PENDING',
    buyer_id: buyerId,
    seller_id: sellerId,
    listing_id: listingId,
    price: price ?? 0,
    payment_method: 'CASH',
    payment_status: 'UNPAID',
    buyer_note: JSON.stringify({ mode: 'BUY', note: buyerNote, meetup, contact_phone: meetup?.contact_phone }),
    meetup_location: meetup?.location ?? null,
    meetup_at: computedMeetupAt,
    meetup_area_id: meetup?.area_id ?? null,
    meetup_lat: meetup?.lat ?? null,
    meetup_lng: meetup?.lng ?? null,
    hub_id: meetup?.hub_id ?? null,
  }

  const { data: txData, error: txErr } = await supabase
    .from('transactions')
    .insert(payloadWithMeetup)
    .select('id')
    .single()

  if (txErr && (txErr.code === '42703' || txErr.message?.includes('column'))) {
    // Fallback: columns don't exist yet on DB, use core fields only
    const { data: fbData, error: fbErr } = await supabase
      .from('transactions')
      .insert({
        transaction_type: 'BUY',
        status: 'PENDING',
        buyer_id: buyerId,
        seller_id: sellerId,
        listing_id: listingId,
        price: price ?? 0,
        payment_method: 'CASH',
        payment_status: 'UNPAID',
        buyer_note: JSON.stringify({ mode: 'BUY', meetup }),
      })
      .select('id')
      .single()

    if (fbErr) throw fbErr
    transaction = fbData
  } else if (txErr) {
    throw txErr
  } else {
    transaction = txData
  }

  const meetupLine = formatMeetupSummary(meetup)

  // 2. Push Notification to Seller
  await pushNotificationSafe(supabase, {
    user_id: sellerId,
    type: 'BOOK_RESERVED',
    title: 'طلب شراء جديد 🛒',
    title_ar: 'طلب شراء جديد 🛒',
    body: `أرسل قارئ طلب شراء لكتابك "${bookTitle}" بسعر ${price ?? 0} ج.م.${meetupLine ? ` الموعد المقترح: ${meetupLine}` : ''} راجع الطلب الآن.`,
    body_ar: `أرسل قارئ طلب شراء لكتابك "${bookTitle}" بسعر ${price ?? 0} ج.م.${meetupLine ? ` الموعد المقترح: ${meetupLine}` : ''} راجع الطلب الآن.`,
    action_url: `/transactions?tab=incoming&id=${transaction?.id}`,
    data: {
      transaction_id: transaction?.id,
      meetup,
    },
  })

  // 3. Connect Conversation and send welcome message
  const convId = await getOrCreateConversation(supabase, buyerId, sellerId, listingId)
  if (convId) {
    const msg = `👋 مرحباً! أرسلت لك طلب شراء لكتاب "${bookTitle}" بسعر ${price ?? 0} ج.م.${
      meetupLine ? `\n\n${meetupLine}` : '\n\nأين يناسبك أن نلتقي للتسليم؟'
    }`
    await sendChatMessage(supabase, convId, buyerId, msg)
  }

  return { transactionId: transaction?.id, conversationId: convId }
}

/**
 * 2. BORROW REQUEST LIFECYCLE
 * Works for Borrow — includes optional meetup location in the request
 */
export async function submitBorrowRequest(params: {
  borrowerId: string
  lenderId: string
  listingId: string
  loanDays: number
  deposit: number
  borrowFee: number
  note?: string
  bookTitle: string
  meetup?: MeetupProposal
}) {
  const supabase = createClient()
  const { borrowerId, lenderId, listingId, loanDays, deposit, borrowFee, note, bookTitle, meetup } = params

  // 0. Validations (User & Listing rules)
  if (!borrowerId || !lenderId || !listingId) {
    throw new Error('بيانات طلب الاستعارة غير مكتملة.')
  }
  if (borrowerId === lenderId && process.env.NODE_ENV === 'production') {
    throw new Error('لا يمكنك استعارة كتابك الخاص.')
  }
  if (loanDays < 1 || loanDays > 90) {
    throw new Error('مدة الاستعارة يجب أن تكون بين يوم واحد و 90 يوماً.')
  }
  if (deposit < 0 || borrowFee < 0) {
    throw new Error('قيمة التأمين أو رسم الاستعارة غير صحيحة.')
  }

  // Check listing status
  const { data: listingCheck } = await supabase
    .from('book_listings')
    .select('id, status')
    .eq('id', listingId)
    .maybeSingle()

  if (listingCheck && listingCheck.status !== 'ACTIVE') {
    throw new Error('عذراً، هذا الكتاب محجوز أو غير متاح للاستعارة حالياً.')
  }

  // Check for duplicate pending borrow request
  const { data: duplicateCheck } = await supabase
    .from('transactions')
    .select('id')
    .eq('buyer_id', borrowerId)
    .eq('listing_id', listingId)
    .eq('status', 'PENDING')
    .maybeSingle()

  if (duplicateCheck) {
    throw new Error('لديك بالفعل طلب معلق لهذا الكتاب قيد مراجعة المالك.')
  }

  const dueDate = new Date(Date.now() + loanDays * 24 * 60 * 60 * 1000).toISOString()
  const loanPayload = {
    mode: 'BORROW',
    loan_days: loanDays,
    due_date: dueDate,
    deposit,
    borrow_fee: borrowFee,
    note,
    meetup,
  }

  // 1. Create transaction row (resilient to missing migration columns)
  let transaction: { id: string } | null = null
  const computedMeetupAt = meetup?.meetup_date
    ? new Date(meetup.meetup_time ? `${meetup.meetup_date}T${meetup.meetup_time}` : meetup.meetup_date).toISOString()
    : null

  const payloadWithBorrow: Record<string, unknown> = {
    transaction_type: 'BUY',
    status: 'PENDING',
    buyer_id: borrowerId,
    seller_id: lenderId,
    listing_id: listingId,
    price: borrowFee,
    payment_method: 'CASH',
    payment_status: 'UNPAID',
    buyer_note: JSON.stringify({ ...loanPayload, contact_phone: meetup?.contact_phone }),
    meetup_location: meetup?.location ?? null,
    meetup_at: computedMeetupAt,
    meetup_area_id: meetup?.area_id ?? null,
    meetup_lat: meetup?.lat ?? null,
    meetup_lng: meetup?.lng ?? null,
    hub_id: meetup?.hub_id ?? null,
    borrow_due_date: dueDate,
    deposit_amount: deposit,
    deposit_status: 'HELD',
  }

  const { data: txData, error: txErr } = await supabase
    .from('transactions')
    .insert(payloadWithBorrow)
    .select('id')
    .single()

  if (txErr && (txErr.code === '42703' || txErr.message?.includes('column'))) {
    // Fallback: columns don't exist yet on DB, use core fields with JSON payload
    const { data: fbData, error: fbErr } = await supabase
      .from('transactions')
      .insert({
        transaction_type: 'BUY',
        status: 'PENDING',
        buyer_id: borrowerId,
        seller_id: lenderId,
        listing_id: listingId,
        price: borrowFee,
        payment_method: 'CASH',
        payment_status: 'UNPAID',
        buyer_note: JSON.stringify(loanPayload),
      })
      .select('id')
      .single()

    if (fbErr) throw fbErr
    transaction = fbData
  } else if (txErr) {
    throw txErr
  } else {
    transaction = txData
  }

  const meetupLine = formatMeetupSummary(meetup)

  // 2. Push Notification to Lender
  await pushNotificationSafe(supabase, {
    user_id: lenderId,
    type: 'BOOK_RESERVED',
    title: 'طلب استعارة مؤقتة ⏱️',
    title_ar: 'طلب استعارة مؤقتة ⏱️',
    body: `طلب قارئ استعارة كتاب "${bookTitle}" لمدة ${loanDays} يوماً (رسم: ${borrowFee} ج.م | تأمين: ${deposit} ج.م).${meetupLine ? ` الموعد المقترح: ${meetupLine}` : ''}`,
    body_ar: `طلب قارئ استعارة كتاب "${bookTitle}" لمدة ${loanDays} يوماً (رسم: ${borrowFee} ج.م | تأمين: ${deposit} ج.م).${meetupLine ? ` الموعد المقترح: ${meetupLine}` : ''}`,
    action_url: `/transactions?tab=incoming&id=${transaction?.id}`,
    data: {
      transaction_id: transaction?.id,
      loan: loanPayload,
      meetup,
    },
  })

  // 3. Connect Conversation and send welcome message
  const convId = await getOrCreateConversation(supabase, borrowerId, lenderId, listingId)
  if (convId) {
    const formattedDate = new Date(dueDate).toLocaleDateString('ar-EG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    const msg = `⏱️ مرحباً! أرسلت لك طلب استعارة لكتاب "${bookTitle}" لمدة ${loanDays} يوماً (تاريخ الإرجاع: ${formattedDate}).\n💰 التأمين: ${deposit} ج.م | رسم الاستعارة: ${borrowFee} ج.م${
      meetupLine ? `\n\n${meetupLine}` : ''
    }${note ? `\n\nملاحظة: ${note}` : ''}`
    await sendChatMessage(supabase, convId, borrowerId, msg)
  }

  return { transactionId: transaction?.id, conversationId: convId }
}

/**
 * 3. SWAP REQUEST LIFECYCLE
 * Works for Swap — includes optional meetup location in the request
 */
export async function submitSwapRequest(params: {
  requesterId: string
  ownerId: string
  listingId: string
  offeredListingId: string
  message?: string
  targetBookTitle: string
  offeredBookTitle?: string
  meetup?: MeetupProposal
}) {
  const supabase = createClient()
  const { requesterId, ownerId, listingId, offeredListingId, message, targetBookTitle, offeredBookTitle, meetup } = params

  // 0. Validations (User & Listing rules)
  if (!requesterId || !ownerId || !listingId || !offeredListingId) {
    throw new Error('بيانات طلب المبادلة غير مكتملة.')
  }
  if (requesterId === ownerId && process.env.NODE_ENV === 'production') {
    throw new Error('لا يمكنك إرسال طلب مبادلة لكتابك الخاص.')
  }
  if (listingId === offeredListingId) {
    throw new Error('لا يمكنك عرض نفس الكتاب المطلوب كبديل للمبادلة.')
  }

  // Check target listing status
  const { data: targetListing } = await supabase
    .from('book_listings')
    .select('id, status')
    .eq('id', listingId)
    .maybeSingle()

  if (targetListing && targetListing.status !== 'ACTIVE') {
    throw new Error('عذراً، الكتاب المطلوب غير متاح حالياً للمبادلة (محجوز أو تم تبادله).')
  }

  // Check offered listing ownership and status
  const { data: offeredListing } = await supabase
    .from('book_listings')
    .select('id, seller_id, status')
    .eq('id', offeredListingId)
    .maybeSingle()

  if (!offeredListing || offeredListing.seller_id !== requesterId) {
    throw new Error('الكتاب المعروض للمبادلة لا ينتمي إلى حسابك.')
  }
  if (offeredListing.status !== 'ACTIVE') {
    throw new Error('الكتاب الذي اخترته للمبادلة محجوز في صفقة أخرى.')
  }

  // Check duplicate pending swap request
  const { data: duplicateSwap } = await supabase
    .from('swap_requests')
    .select('id')
    .eq('requester_id', requesterId)
    .eq('listing_id', listingId)
    .eq('status', 'PENDING')
    .maybeSingle()

  if (duplicateSwap) {
    throw new Error('لديك بالفعل طلب مبادلة معلق لهذا الكتاب قيد مراجعة المالك.')
  }

  const meetupLine = formatMeetupSummary(meetup)

  // 1. Create swap_request row (resilient to missing migration columns)
  let swap: { id: string } | null = null
  const computedMeetupAt = meetup?.meetup_date
    ? new Date(meetup.meetup_time ? `${meetup.meetup_date}T${meetup.meetup_time}` : meetup.meetup_date).toISOString()
    : null

  const payloadWithMeetup: Record<string, unknown> = {
    requester_id: requesterId,
    listing_id: listingId,
    offered_listing_id: offeredListingId,
    status: 'PENDING',
    message: message || null,
    proposed_meetup_location: meetup?.location ?? null,
    proposed_meetup_at: computedMeetupAt,
    proposed_meetup_area_id: meetup?.area_id ?? null,
    proposed_meetup_lat: meetup?.lat ?? null,
    proposed_meetup_lng: meetup?.lng ?? null,
    preferred_delivery: meetup?.preferred_delivery ?? 'MEETUP',
    proposed_hub_id: meetup?.hub_id ?? null,
    proposed_times: meetup?.proposed_times ?? [],
  }

  const { data: swapData, error: swapErr } = await supabase
    .from('swap_requests')
    .insert(payloadWithMeetup)
    .select('id')
    .single()

  if (swapErr && (swapErr.code === '42703' || swapErr.message?.includes('column'))) {
    // Fallback: columns don't exist yet on DB, append meetup summary to message
    const combinedMessage = [
      message,
      meetupLine ? `[المقابلة المقترحة: ${meetupLine}]` : null,
    ].filter(Boolean).join('\n\n')

    const { data: fbData, error: fbErr } = await supabase
      .from('swap_requests')
      .insert({
        requester_id: requesterId,
        listing_id: listingId,
        offered_listing_id: offeredListingId,
        status: 'PENDING',
        message: combinedMessage || null,
      })
      .select('id')
      .single()

    if (fbErr) throw fbErr
    swap = fbData
  } else if (swapErr) {
    throw swapErr
  } else {
    swap = swapData
  }

  // 2. Push Notification to Owner
  await pushNotificationSafe(supabase, {
    user_id: ownerId,
    type: 'SWAP_REQUEST',
    title: 'طلب مبادلة كتاب جديد 🔄',
    title_ar: 'طلب مبادلة كتاب جديد 🔄',
    body: `أرسل لك قارئ عرض مبادلة${offeredBookTitle ? ` بكتاب "${offeredBookTitle}"` : ''} مقابل "${targetBookTitle}".${meetupLine ? ` الموعد المقترح: ${meetupLine}` : ''}`,
    body_ar: `أرسل لك قارئ عرض مبادلة${offeredBookTitle ? ` بكتاب "${offeredBookTitle}"` : ''} مقابل "${targetBookTitle}".${meetupLine ? ` الموعد المقترح: ${meetupLine}` : ''}`,
    action_url: `/transactions?tab=incoming&id=${swap?.id}`,
    data: {
      swap_id: swap?.id,
      meetup,
    },
  })

  // 3. Connect Conversation
  const convId = await getOrCreateConversation(supabase, requesterId, ownerId, listingId)
  if (convId) {
    const msg = `🔄 مرحباً! أرسلت لك طلب مبادلة${offeredBookTitle ? ` بكتاب "${offeredBookTitle}"` : ''} مقابل كتابك "${targetBookTitle}".${
      meetupLine ? `\n\n${meetupLine}` : ''
    }${message ? `\n\nرسالتي: ${message}` : ''}`
    await sendChatMessage(supabase, convId, requesterId, msg)
  }

  return { swapId: swap?.id, conversationId: convId }
}

/**
 * 4. SELLER / LENDER RESPONSE: ACCEPT
 * When seller accepts, the agreed meetup location is set on the transaction
 */
export async function acceptTransaction(params: {
  transactionId: string
  sellerId: string
  buyerId: string
  listingId?: string
  bookTitle?: string
  isBorrow?: boolean
  agreedMeetup?: Pick<MeetupProposal, 'location' | 'lat' | 'lng' | 'hub_id'> & { meetup_at?: string }
}) {
  const supabase = createClient()
  const { transactionId, sellerId, buyerId, listingId, bookTitle, isBorrow, agreedMeetup } = params

  // 0. Owner & State Validations
  const { data: curTx } = await supabase
    .from('transactions')
    .select('id, seller_id, status')
    .eq('id', transactionId)
    .maybeSingle()

  if (curTx) {
    if (curTx.seller_id && curTx.seller_id !== sellerId) {
      throw new Error('غير مصرح لك بقبول هذا الطلب.')
    }
    if (curTx.status !== 'PENDING') {
      throw new Error('لا يمكن قبول هذا الطلب لأنه لم يعد قيد الانتظار.')
    }
  }

  // 1. Update transaction to ACCEPTED + lock in agreed meetup
  await supabase
    .from('transactions')
    .update({
      status: 'ACCEPTED',
      meetup_location: agreedMeetup?.location ?? undefined,
      meetup_lat: agreedMeetup?.lat ?? undefined,
      meetup_lng: agreedMeetup?.lng ?? undefined,
      hub_id: agreedMeetup?.hub_id ?? undefined,
      meetup_at: agreedMeetup?.meetup_at ?? undefined,
    })
    .eq('id', transactionId)

  // 2. Mark listing as RESERVED
  if (listingId) {
    await supabase
      .from('book_listings')
      .update({ status: 'RESERVED' })
      .eq('id', listingId)
  }

  // 4. Notify Buyer / Borrower
  const meetupNote = agreedMeetup?.location
    ? ` الموعد المتفق: 📍 ${agreedMeetup.location}`
    : ' اتجه إلى المحادثة لتأكيد مكان وموعد اللقاء.'

  await pushNotificationSafe(supabase, {
    user_id: buyerId,
    type: 'BOOK_RESERVED',
    title: isBorrow ? 'تمت الموافقة على طلب الاستعارة! 🎉' : 'تم قبول طلب الشراء! 🎉',
    title_ar: isBorrow ? 'تمت الموافقة على طلب الاستعارة! 🎉' : 'تم قبول طلب الشراء! 🎉',
    body: `وافق صاحب كتاب "${bookTitle || 'الكتاب'}" على طلبك!${meetupNote}`,
    body_ar: `وافق صاحب كتاب "${bookTitle || 'الكتاب'}" على طلبك!${meetupNote}`,
    action_url: `/transactions?tab=outgoing&id=${transactionId}`,
  })

  // 4. Send confirmation in chat
  const convId = await getOrCreateConversation(supabase, sellerId, buyerId, listingId)
  if (convId) {
    const msg = `✅ تمت الموافقة على طلب ${isBorrow ? 'الاستعارة' : 'الشراء'}! يسعدني إتمام المعاملة معك.${
      agreedMeetup?.location
        ? `\n\n📍 موعد اللقاء: ${agreedMeetup.location}${agreedMeetup.meetup_at ? `\n🕐 ${new Date(agreedMeetup.meetup_at).toLocaleString('ar-EG')}` : ''}`
        : '\n\nمتى وأين يناسبك اللقاء للتسليم؟'
    }`
    await sendChatMessage(supabase, convId, sellerId, msg)
  }
}

/**
 * 5. ACCEPT SWAP REQUEST
 */
export async function acceptSwapRequest(params: {
  swapId: string
  responderId: string
  requesterId: string
  listingId: string
  offeredListingId?: string
  bookTitle?: string
  agreedMeetup?: Pick<MeetupProposal, 'location' | 'lat' | 'lng' | 'hub_id'> & { meetup_at?: string }
}) {
  const supabase = createClient()
  const { swapId, responderId, requesterId, listingId, offeredListingId, bookTitle, agreedMeetup } = params

  // 0. Owner & State Validations
  const { data: curSwap } = await supabase
    .from('swap_requests')
    .select('id, status')
    .eq('id', swapId)
    .maybeSingle()

  if (curSwap && curSwap.status !== 'PENDING') {
    throw new Error('لا يمكن قبول طلب المبادلة لأنه لم يعد قيد الانتظار.')
  }

  // 1. Update swap_request
  await supabase
    .from('swap_requests')
    .update({
      status: 'ACCEPTED',
      responded_at: new Date().toISOString(),
      agreed_meetup_location: agreedMeetup?.location ?? null,
      agreed_meetup_at: agreedMeetup?.meetup_at ?? null,
      agreed_hub_id: agreedMeetup?.hub_id ?? null,
    })
    .eq('id', swapId)

  // 2. Reserve BOTH listings
  const listingIds = [listingId, offeredListingId].filter(Boolean) as string[]
  if (listingIds.length) {
    await supabase
      .from('book_listings')
      .update({ status: 'RESERVED' })
      .in('id', listingIds)
  }

  // 3. Create a transaction record for the swap
  const { data: transaction } = await supabase
    .from('transactions')
    .insert({
      transaction_type: 'SWAP',
      status: 'ACCEPTED',
      buyer_id: requesterId,
      seller_id: responderId,
      listing_id: listingId,
      swap_listing_id: offeredListingId ?? null,
      payment_method: 'CASH',
      payment_status: 'UNPAID',
      meetup_location: agreedMeetup?.location ?? null,
      meetup_at: agreedMeetup?.meetup_at ?? null,
      hub_id: agreedMeetup?.hub_id ?? null,
    })
    .select('id')
    .single()

  // Update swap_request with transaction_id
  if (transaction?.id) {
    await supabase
      .from('swap_requests')
      .update({ transaction_id: transaction.id })
      .eq('id', swapId)
  }

  // 4. Notify requester
  await pushNotificationSafe(supabase, {
    user_id: requesterId,
    type: 'SWAP_ACCEPTED',
    title: 'تم قبول طلب المبادلة! 🔄🎉',
    title_ar: 'تم قبول طلب المبادلة! 🔄🎉',
    body: `وافق صاحب كتاب "${bookTitle || 'الكتاب'}" على مبادلتك!${agreedMeetup?.location ? ` اللقاء: ${agreedMeetup.location}` : ''}`,
    body_ar: `وافق صاحب كتاب "${bookTitle || 'الكتاب'}" على مبادلتك!${agreedMeetup?.location ? ` اللقاء: ${agreedMeetup.location}` : ''}`,
    action_url: `/transactions?tab=outgoing&id=${transaction?.id || swapId}`,
  })

  return { transactionId: transaction?.id }
}

/**
 * 6. SELLER / LENDER RESPONSE: REJECT
 */
export async function rejectTransaction(params: {
  transactionId: string
  sellerId: string
  buyerId: string
  listingId?: string
  bookTitle?: string
}) {
  const supabase = createClient()
  const { transactionId, sellerId, buyerId, listingId, bookTitle } = params

  await supabase
    .from('transactions')
    .update({ status: 'REJECTED' })
    .eq('id', transactionId)

  if (listingId) {
    await supabase.from('book_listings').update({ status: 'ACTIVE' }).eq('id', listingId)
  }

  await pushNotificationSafe(supabase, {
    user_id: buyerId,
    type: 'BOOK_RESERVED',
    title: 'اعتذار عن إتمام الطلب',
    title_ar: 'اعتذار عن إتمام الطلب',
    body: `عذراً، اعتذر مالك كتاب "${bookTitle || 'الكتاب'}" عن إتمام الطلب حالياً. يمكنك تصفح نسخ أخرى متاحة.`,
    body_ar: `عذراً، اعتذر مالك كتاب "${bookTitle || 'الكتاب'}" عن إتمام الطلب حالياً. يمكنك تصفح نسخ أخرى متاحة.`,
    action_url: '/explore',
  })
}

/**
 * 7. REJECT SWAP REQUEST
 */
export async function rejectSwapRequest(params: {
  swapId: string
  responderId: string
  requesterId: string
  listingId?: string
  offeredListingId?: string
  bookTitle?: string
}) {
  const supabase = createClient()
  const { swapId, responderId, requesterId, listingId, offeredListingId, bookTitle } = params

  await supabase
    .from('swap_requests')
    .update({ status: 'REJECTED', responded_at: new Date().toISOString() })
    .eq('id', swapId)

  const listingIds = [listingId, offeredListingId].filter(Boolean) as string[]
  if (listingIds.length) {
    await supabase.from('book_listings').update({ status: 'ACTIVE' }).in('id', listingIds)
  }

  await pushNotificationSafe(supabase, {
    user_id: requesterId,
    type: 'SWAP_REQUEST',
    title: 'لم يتم قبول طلب المبادلة',
    title_ar: 'لم يتم قبول طلب المبادلة',
    body: `اعتذر صاحب كتاب "${bookTitle || 'الكتاب'}" عن إتمام المبادلة. يمكنك البحث عن كتب أخرى للمبادلة.`,
    body_ar: `اعتذر صاحب كتاب "${bookTitle || 'الكتاب'}" عن إتمام المبادلة. يمكنك البحث عن كتب أخرى للمبادلة.`,
    action_url: '/explore',
  })
}

/**
 * 8. TRANSACTION COMPLETION (Handover Confirmed / Book Returned)
 * Works for Buy, Borrow, and Swap
 */
export async function completeTransaction(params: {
  transactionId: string
  actorId: string
  otherPartyId: string
  listingId?: string
  swapListingId?: string
  bookTitle?: string
  isBorrow?: boolean
  isSwap?: boolean
}) {
  const supabase = createClient()
  const { transactionId, otherPartyId, listingId, swapListingId, bookTitle, isBorrow, isSwap } = params

  // 1. Mark transaction completed & paid
  await supabase
    .from('transactions')
    .update({
      status: 'COMPLETED',
      payment_status: 'PAID',
      completed_at: new Date().toISOString(),
      ...(isBorrow ? { deposit_status: 'REFUNDED', borrow_returned_at: new Date().toISOString() } : {}),
    })
    .eq('id', transactionId)

  // 2. Listing status update
  // BORROW → re-ACTIVE (book returned)
  // BUY or SWAP → SOLD
  if (listingId) {
    await supabase
      .from('book_listings')
      .update({ status: isBorrow ? 'ACTIVE' : 'SOLD' })
      .eq('id', listingId)
  }
  // For swaps, the offered listing also becomes SOLD
  if (isSwap && swapListingId) {
    await supabase
      .from('book_listings')
      .update({ status: 'SOLD' })
      .eq('id', swapListingId)
  }

  // 3. Notify the other party
  let title: string
  let body: string
  if (isBorrow) {
    title = 'اكتملت الاستعارة وتم إرجاع الكتاب! 🎉'
    body = `تم تأكيد إرجاع كتاب "${bookTitle || 'الكتاب'}" واسترداد مبلغ التأمين بنجاح. شكراً لحفاظك على الكتاب!`
  } else if (isSwap) {
    title = 'اكتملت المبادلة بنجاح! 🔄✅'
    body = `تم تأكيد تبادل الكتب بنجاح. شاركنا تقييمك للتجربة!`
  } else {
    title = 'اكتملت عملية الشراء بنجاح! 🎉'
    body = `تم تأكيد تسليم واستلام كتاب "${bookTitle || 'الكتاب'}" بنجاح. شاركنا تقييمك للتجربة!`
  }

  await pushNotificationSafe(supabase, {
    user_id: otherPartyId,
    type: 'TRANSACTION_COMPLETED',
    title,
    title_ar: title,
    body,
    body_ar: body,
    action_url: '/transactions',
  })
}

/**
 * 9. MEETUP QR CODE & PIN VERIFICATION SYSTEM
 */

export interface MeetupQrPayload {
  v: 1
  type: 'BUY' | 'SWAP' | 'BORROW' | 'BORROW_RETURN' | 'COMMUNITY_INTAKE'
  id: string
  code: string
  title?: string
}

/**
 * Generate a deterministic, human-friendly 6-digit confirmation PIN for a transaction/swap.
 * Example: "BS-89F2A1"
 */
export function generateMeetupVerificationCode(id: string): string {
  if (!id) return 'BS-8821'
  const clean = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const part = clean.slice(-6).padEnd(6, '9')
  return `BS-${part}`
}

/**
 * Parse and validate QR code data scanned by camera or uploaded image
 */
export function parseMeetupQrData(rawValue: string): MeetupQrPayload | null {
  try {
    const parsed = JSON.parse(rawValue)
    if (parsed && parsed.id && parsed.code) {
      return parsed as MeetupQrPayload
    }
  } catch {
    // Might be plain text PIN code e.g. "BS-89F2A1"
    const trimmed = rawValue.trim().toUpperCase()
    if (trimmed.startsWith('BS-') || trimmed.length === 6) {
      return {
        v: 1,
        type: 'BUY',
        id: '',
        code: trimmed.startsWith('BS-') ? trimmed : `BS-${trimmed}`,
      }
    }
  }
  return null
}

/**
 * Verify Meetup Handover via QR Code or PIN
 * Supports BUY, SWAP, BORROW handover, and BORROW return
 */
export async function verifyMeetupHandover(params: {
  transactionId?: string
  swapId?: string
  inputCodeOrPayload: string
  actorId: string
  otherPartyId: string
  listingId?: string
  swapListingId?: string
  bookTitle?: string
  isBorrow?: boolean
  isBorrowReturn?: boolean
  isSwap?: boolean
}): Promise<{ success: boolean; message: string; newStatus: string }> {
  const {
    transactionId,
    swapId,
    inputCodeOrPayload,
    actorId,
    otherPartyId,
    listingId,
    swapListingId,
    bookTitle,
    isBorrow,
    isBorrowReturn,
    isSwap,
  } = params

  const targetId = transactionId || swapId || ''
  const expectedCode = generateMeetupVerificationCode(targetId).toUpperCase()
  const parsed = parseMeetupQrData(inputCodeOrPayload)

  // Verify either code match or payload ID match
  const providedCode = (parsed?.code || inputCodeOrPayload).trim().toUpperCase()
  const matchesCode =
    providedCode === expectedCode ||
    providedCode === expectedCode.replace('BS-', '') ||
    (providedCode.startsWith('BS-') && providedCode === expectedCode)

  const matchesId = parsed?.id && parsed.id === targetId

  if (!matchesCode && !matchesId) {
    return {
      success: false,
      message: 'رمز التأكيد غير صحيح. يرجى التأكد من مسح الرمز الصحيح للطرف الآخر.',
      newStatus: 'REJECTED',
    }
  }

  // Code is verified! Proceed with state transition
  const supabase = createClient()

  if (isSwap && swapId) {
    // Complete Swap
    await supabase
      .from('swap_requests')
      .update({ status: 'COMPLETED' })
      .eq('id', swapId)

    if (transactionId) {
      await supabase
        .from('transactions')
        .update({
          status: 'COMPLETED',
          payment_status: 'PAID',
          completed_at: new Date().toISOString(),
        })
        .eq('id', transactionId)
    }

    const listingIds = [listingId, swapListingId].filter(Boolean) as string[]
    if (listingIds.length) {
      await supabase.from('book_listings').update({ status: 'SOLD' }).in('id', listingIds)
    }

    await pushNotificationSafe(supabase, {
      user_id: otherPartyId,
      type: 'TRANSACTION_COMPLETED',
      title: 'تم تأكيد المقابلة وتبادل الكتب بنجاح! 🔄🎉',
      title_ar: 'تم تأكيد المقابلة وتبادل الكتب بنجاح! 🔄🎉',
      body: `تم مسح رمز QR بنجاح واكتملت عملية تبادل كتاب "${bookTitle || 'الكتاب'}". نتمنى لك قراءة ممتعة!`,
      body_ar: `تم مسح رمز QR بنجاح واكتملت عملية تبادل كتاب "${bookTitle || 'الكتاب'}". نتمنى لك قراءة ممتعة!`,
      action_url: '/transactions?tab=history',
    })

    return {
      success: true,
      message: 'تم التحقق من المقابلة وتأكيد تبادل الكتب بنجاح! 🔄✨',
      newStatus: 'COMPLETED',
    }
  }

  if (isBorrow) {
    if (isBorrowReturn) {
      // Complete Borrow Return
      if (transactionId) {
        await supabase
          .from('transactions')
          .update({
            status: 'COMPLETED',
            deposit_status: 'REFUNDED',
            borrow_returned_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          })
          .eq('id', transactionId)
      }

      if (listingId) {
        await supabase
          .from('book_listings')
          .update({ status: 'ACTIVE' })
          .eq('id', listingId)
      }

      await pushNotificationSafe(supabase, {
        user_id: otherPartyId,
        type: 'TRANSACTION_COMPLETED',
        title: 'تم استلام الكتاب المستعار واسترداد التأمين! 📖✅',
        title_ar: 'تم استلام الكتاب المستعار واسترداد التأمين! 📖✅',
        body: `تم تأكيد إرجاع كتاب "${bookTitle || 'الكتاب'}" بنجاح واسترداد مبلغ التأمين كاملاً. شكراً لأمانتك!`,
        body_ar: `تم تأكيد إرجاع كتاب "${bookTitle || 'الكتاب'}" بنجاح واسترداد مبلغ التأمين كاملاً. شكراً لأمانتك!`,
        action_url: '/transactions?tab=history',
      })

      return {
        success: true,
        message: 'تم تأكيد إرجاع الكتاب المستعار واسترداد التأمين بنجاح! 📚🎉',
        newStatus: 'COMPLETED',
      }
    } else {
      // Borrow Handover (book received by borrower, loan is now ACTIVE)
      if (transactionId) {
        await supabase
          .from('transactions')
          .update({
            payment_status: 'PAID',
            deposit_status: 'HELD',
          })
          .eq('id', transactionId)
      }

      if (listingId) {
        await supabase
          .from('book_listings')
          .update({ status: 'RESERVED' })
          .eq('id', listingId)
      }

      await pushNotificationSafe(supabase, {
        user_id: otherPartyId,
        type: 'BOOK_RESERVED',
        title: 'تم تسليم الكتاب وبدأت فترة الاستعارة! ⏱️📚',
        title_ar: 'تم تسليم الكتاب وبدأت فترة الاستعارة! ⏱️📚',
        body: `تم تأكيد استلام كتاب "${bookTitle || 'الكتاب'}" عبر رمز QR. استمتع بالقراءة وتذكر موعد الإرجاع المحدد!`,
        body_ar: `تم تسليم كتاب "${bookTitle || 'الكتاب'}" بنجاح عبر رمز QR.`,
        action_url: '/transactions?tab=loans',
      })

      return {
        success: true,
        message: 'تم تأكيد تسليم الكتاب المستعار وبدأت فترة الإعارة بنجاح! ⏱️📖',
        newStatus: 'ACCEPTED',
      }
    }
  }

  // Regular BUY transaction
  if (transactionId) {
    await completeTransaction({
      transactionId,
      actorId,
      otherPartyId,
      listingId,
      bookTitle,
      isBorrow: false,
      isSwap: false,
    })
  }

  return {
    success: true,
    message: 'تم تأكيد المقابلة وتسليم الكتاب وإتمام البيع بنجاح! 🎉🛒',
    newStatus: 'COMPLETED',
  }
}

/**
 * Helper: Generate a real incoming borrow or buy transaction
 * for testing the full lifecycle: request -> notification -> incoming cards -> accept/reject -> meetup QR
 */
export async function createTestIncomingTransaction(params?: {
  sellerId?: string
  listingId?: string
  mode?: 'BORROW' | 'BUY'
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const targetSellerId = params?.sellerId || user?.id
  if (!targetSellerId) {
    throw new Error('يرجى تسجيل الدخول أولاً لإنشاء طلب تجريبي.')
  }

  // 1. Find or pick an active listing for this seller
  let listingId = params?.listingId
  let listingTitle = 'كتاب'
  let listingPrice = 45

  if (!listingId) {
    const { data: listings } = await supabase
      .from('book_listings')
      .select('id, price, book:books(title, title_ar)')
      .eq('seller_id', targetSellerId)
      .eq('status', 'ACTIVE')
      .limit(1)

    if (listings && listings.length > 0) {
      listingId = listings[0].id
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b: any = listings[0].book
      listingTitle = (Array.isArray(b) ? b[0]?.title : b?.title) || 'كتاب'
      listingPrice = listings[0].price || 45
    } else {
      const { data: anyListing } = await supabase
        .from('book_listings')
        .select('id, price, book:books(title, title_ar)')
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

  // 2. Pick another reader profile as the buyer
  let buyerId = user?.id || targetSellerId
  const { data: otherProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .neq('id', targetSellerId)
    .limit(1)

  if (otherProfiles && otherProfiles.length > 0) {
    buyerId = otherProfiles[0].id
  }

  const mode = params?.mode || 'BORROW'
  const loanDays = 14
  const dueDate = new Date(Date.now() + loanDays * 24 * 60 * 60 * 1000).toISOString()
  const deposit = 50
  const borrowFee = 30

  const meetup: MeetupProposal = {
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

  // 3. Insert transaction
  const payload: Record<string, unknown> = {
    transaction_type: 'BUY',
    status: 'PENDING',
    buyer_id: buyerId,
    seller_id: targetSellerId,
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
    console.error('createTestIncomingTransaction error:', txErr)
    throw txErr
  }

  // 4. Send notification to the seller
  await pushNotificationSafe(supabase, {
    user_id: targetSellerId,
    type: 'BOOK_RESERVED',
    title: mode === 'BORROW' ? 'طلب استعارة مؤقتة جديد ⏱️' : 'طلب شراء جديد 🛒',
    title_ar: mode === 'BORROW' ? 'طلب استعارة مؤقتة جديد ⏱️' : 'طلب شراء جديد 🛒',
    body: `أرسل قارئ طلب ${mode === 'BORROW' ? 'استعارة' : 'شراء'} لكتابك "${listingTitle}". المقابلة المقترحة: 📍 ${meetup.location}`,
    body_ar: `أرسل قارئ طلب ${mode === 'BORROW' ? 'استعارة' : 'شراء'} لكتابك "${listingTitle}". المقابلة المقترحة: 📍 ${meetup.location}`,
    action_url: `/transactions?tab=incoming&id=${newTx?.id}`,
    data: { transaction_id: newTx?.id, meetup },
  })

  // 5. Connect conversation
  if (buyerId && targetSellerId && buyerId !== targetSellerId) {
    const convId = await getOrCreateConversation(supabase, buyerId, targetSellerId, listingId || undefined)
    if (convId) {
      await sendChatMessage(
        supabase,
        convId,
        buyerId,
        `👋 مرحباً! أرسلت لك طلب ${mode === 'BORROW' ? `استعارة مؤقتة (${loanDays} يوماً)` : 'شراء'} لكتاب "${listingTitle}".\n📍 المقابلة المقترحة: ${meetup.location}`
      )
    }
  }

  return newTx
}

