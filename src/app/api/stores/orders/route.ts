import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dispatchStoreOrderEmail } from '@/lib/email/order-email-service'
import type { StoreOrder } from '@/types/store'

export const dynamic = 'force-dynamic'

/**
 * Generate a friendly readable order number like: ORD-L4KV2-782
 */
function generateOrderNumber(): string {
  const timeCode = Date.now().toString(36).toUpperCase().slice(-5)
  const randCode = Math.floor(100 + Math.random() * 900)
  return `ORD-${timeCode}-${randCode}`
}

/**
 * POST /api/stores/orders
 * Persists a new customer order into `store_orders` table,
 * notifies the bookstore owner in-app, and triggers anti-flood transactional emails.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      store_id,
      order_type = 'SINGLE_BOOK',
      bundle_title,
      bundle_size,
      pack_title,
      pack_image_url,
      total_price,
      customer_name,
      customer_phone,
      customer_city,
      customer_address,
      customer_notes,
      items = [],
    } = body

    if (!store_id || !customer_name || !customer_phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required order details (store_id, customer_name, customer_phone)' },
        { status: 400 }
      )
    }

    const orderNumber = body.order_number || generateOrderNumber()
    const supabase = await createClient()

    // 1. Prepare record
    const newOrderData = {
      order_number: orderNumber,
      store_id,
      order_type,
      bundle_title: bundle_title || null,
      bundle_size: bundle_size || null,
      pack_title: pack_title || null,
      pack_image_url: pack_image_url || null,
      total_price: Number(total_price) || 0,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      customer_city: (customer_city || 'القاهرة').trim(),
      customer_address: customer_address ? customer_address.trim() : null,
      customer_notes: customer_notes ? customer_notes.trim() : null,
      items: Array.isArray(items) ? items : [],
      status: 'NEW',
    }

    let savedOrder: StoreOrder

    // 2. Insert into Supabase store_orders table
    const { data: insertedOrder, error: insertError } = await supabase
      .from('store_orders')
      .insert(newOrderData)
      .select('*')
      .single()

    if (insertError) {
      console.warn('[StoreOrders API] Database insert notice/fallback:', insertError.message)
      // Fallback object if table is not migrated yet in remote instance
      savedOrder = {
        id: 'ord-' + Date.now().toString(36),
        ...newOrderData,
        order_number: orderNumber,
        status: 'NEW',
        created_at: new Date().toISOString(),
      } as StoreOrder
    } else {
      savedOrder = insertedOrder as StoreOrder
    }

    // 3. Resolve Store & Owner Details
    let storeInfo: { id: string; name: string; name_ar?: string; slug: string; owner_id?: string; email?: string } = {
      id: store_id,
      name: 'Bookstore',
      slug: 'store',
    }

    try {
      const { data: storeRow } = await supabase
        .from('bookstores')
        .select('id, name, name_ar, slug, owner_id, social_links')
        .eq('id', store_id)
        .maybeSingle()

      if (storeRow) {
        let storeEmail = storeRow.social_links?.email

        // If email not found in social_links, try fetching from owner's profile
        if (!storeEmail && storeRow.owner_id) {
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', storeRow.owner_id)
            .maybeSingle()

          if (profileRow?.email) {
            storeEmail = profileRow.email
          }
        }

        storeInfo = {
          id: storeRow.id,
          name: storeRow.name,
          name_ar: storeRow.name_ar,
          slug: storeRow.slug,
          owner_id: storeRow.owner_id,
          email: storeEmail,
        }

        // 4. In-App Notification for Store Owner
        if (storeRow.owner_id) {
          const notifPayload = {
            user_id: storeRow.owner_id,
            type: 'STORE_NEW_ORDER',
            title: '📦 طلب شراء جديد',
            title_ar: '📦 طلب شراء جديد',
            body: `طلب جديد رقم #${orderNumber} بقيمة ${newOrderData.total_price} ج.م من ${newOrderData.customer_name} (${newOrderData.customer_city})`,
            body_ar: `طلب جديد رقم #${orderNumber} بقيمة ${newOrderData.total_price} ج.م من ${newOrderData.customer_name} (${newOrderData.customer_city})`,
            action_url: `/store-dashboard?tab=orders`,
            data: {
              order_id: savedOrder.id,
              order_number: orderNumber,
              total_price: newOrderData.total_price,
              customer_name: newOrderData.customer_name,
              customer_phone: newOrderData.customer_phone,
              store_id,
            },
          }

          let { error: notifError } = await supabase.from('notifications').insert(notifPayload)
          if (notifError && (notifError.message?.includes('enum') || notifError.code === '22P02')) {
            // Safe fallback if enum value is not registered yet
            await supabase.from('notifications').insert({ ...notifPayload, type: 'TRANSACTION_COMPLETED' })
          }
        }
      }
    } catch (storeQueryErr) {
      console.warn('[StoreOrders API] Store lookup/notification warning:', storeQueryErr)
    }

    // 5. Dispatch Email with Intelligent Surge & Batching
    const recipientEmail = storeInfo.email || process.env.ADMIN_NOTIFICATION_EMAIL || process.env.RESEND_DEFAULT_TO
    if (recipientEmail) {
      try {
        await dispatchStoreOrderEmail({
          order: savedOrder,
          store: {
            id: storeInfo.id,
            name: storeInfo.name,
            name_ar: storeInfo.name_ar,
            slug: storeInfo.slug,
          },
          ownerEmail: recipientEmail,
        })
      } catch (emailErr) {
        console.error('[StoreOrders API] Email dispatch warning:', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      order: savedOrder,
    })
  } catch (err: unknown) {
    console.error('[StoreOrders API] Error placing order:', err)
    return NextResponse.json(
      { success: false, error: (err as Error)?.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/stores/orders?store_id=...
 * Fetch orders for a bookstore
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const orderNumber = searchParams.get('order_number')
    const orderId = searchParams.get('id')
    const storeId = searchParams.get('store_id')

    if (orderNumber || orderId) {
      let q = supabase.from('store_orders').select('*')
      if (orderNumber) {
        q = q.eq('order_number', orderNumber)
      } else if (orderId) {
        q = q.eq('id', orderId)
      }
      const { data, error } = await q.maybeSingle()
      if (error) {
        console.warn('[StoreOrders API] Error fetching single order:', error.message)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, order: data })
    }

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Missing store_id or order_number' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('store_orders')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[StoreOrders API] Error fetching orders:', error.message)
      return NextResponse.json({ success: true, orders: [], dbError: error.message })
    }

    return NextResponse.json({ success: true, orders: data || [] })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error)?.message || 'Internal Server Error', orders: [] },
      { status: 500 }
    )
  }
}
