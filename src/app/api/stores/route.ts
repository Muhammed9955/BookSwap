import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/stores
 * Fetch bookstores from Supabase database
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const storeType = searchParams.get('storeType')
    const query = searchParams.get('query')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    let q = supabase
      .from('bookstores')
      .select('*')
      .order('created_at', { ascending: false })

    if (!includeInactive) {
      q = q.eq('is_active', true)
    }

    if (storeType && storeType !== 'ALL') {
      q = q.eq('store_type', storeType)
    }

    if (query) {
      q = q.or(`name.ilike.%${query}%,name_ar.ilike.%${query}%,address.ilike.%${query}%`)
    }

    const { data, error } = await q

    if (error) {
      console.warn('Error fetching bookstores from DB:', error.message)
      return NextResponse.json({ success: false, error: error.message, stores: [] }, { status: 500 })
    }

    return NextResponse.json({ success: true, stores: data || [] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message, stores: [] }, { status: 500 })
  }
}

/**
 * POST /api/stores
 * Save a new bookstore directly into Supabase database (bookstores table)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = await req.json()
    const {
      name,
      name_ar,
      slug,
      description,
      description_ar,
      store_type = 'ONLINE',
      address,
      latitude,
      longitude,
      opening_hours,
      website_url,
      social_links,
      logo_url,
      cover_url,
      is_verified = false,
      is_active = true,
      owner_id: providedOwnerId,
    } = body

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Store name and slug are required' },
        { status: 400 }
      )
    }

    // Determine valid owner_id (must reference profiles(id))
    let effectiveOwnerId = user?.id || providedOwnerId

    if (!effectiveOwnerId) {
      // Find default admin or first available profile
      const { data: firstProfile } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle()
      effectiveOwnerId = firstProfile?.id
    }

    if (!effectiveOwnerId) {
      return NextResponse.json(
        { success: false, error: 'Could not determine store owner profile' },
        { status: 400 }
      )
    }

    // Sanitize slug to be safe
    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')

    const storePayload = {
      owner_id: effectiveOwnerId,
      name,
      name_ar: name_ar || name,
      slug: cleanSlug,
      description: description || '',
      description_ar: description_ar || description || '',
      store_type,
      address: address || (store_type === 'ONLINE' ? 'متجر إلكتروني — شحن لكافة المحافظات' : null),
      latitude: store_type === 'ONLINE' ? null : (latitude ?? null),
      longitude: store_type === 'ONLINE' ? null : (longitude ?? null),
      opening_hours: typeof opening_hours === 'object' ? opening_hours : { 'مواعيد العمل': opening_hours || 'يومياً 10:00 ص - 11:00 م' },
      website_url: website_url || null,
      social_links: typeof social_links === 'object' ? social_links : {},
      logo_url: logo_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=250&q=80',
      cover_url: cover_url || 'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=1200&q=80',
      is_verified: Boolean(is_verified),
      is_active: Boolean(is_active),
      updated_at: new Date().toISOString(),
    }

    // Check if store already exists by slug
    const { data: existingStore } = await supabase
      .from('bookstores')
      .select('id')
      .eq('slug', cleanSlug)
      .maybeSingle()

    let result
    if (existingStore) {
      result = await supabase
        .from('bookstores')
        .update(storePayload)
        .eq('id', existingStore.id)
        .select('*')
        .single()
    } else {
      result = await supabase
        .from('bookstores')
        .insert(storePayload)
        .select('*')
        .single()
    }

    if (result.error) {
      console.error('Failed to save store in DB:', result.error)
      return NextResponse.json(
        { success: false, error: result.error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      store: result.data,
      message: 'Store saved successfully in Supabase database',
    })
  } catch (err: any) {
    console.error('API /api/stores error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/stores
 * Update store status (e.g. is_active for hide/unhide, is_verified for official badge)
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'MODERATOR'

    const body = await req.json()
    const {
      storeId,
      is_active,
      is_verified,
      name,
      name_ar,
      store_type,
      address,
      description,
      description_ar,
      social_links,
      website_url,
      slogan,
      logo_url,
      cover_url,
    } = body

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Store ID is required' }, { status: 400 })
    }

    if (!isAdmin) {
      const { data: store } = await supabase
        .from('bookstores')
        .select('owner_id')
        .eq('id', storeId)
        .maybeSingle()

      if (store?.owner_id !== user.id) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (typeof is_active === 'boolean') updatePayload.is_active = is_active
    if (typeof is_verified === 'boolean') {
      if (!isAdmin) {
        return NextResponse.json({ success: false, error: 'Only administrators can toggle store verification' }, { status: 403 })
      }
      updatePayload.is_verified = is_verified
      updatePayload.verified_at = is_verified ? new Date().toISOString() : null
    }

    if (name) updatePayload.name = name.trim()
    if (name_ar) updatePayload.name_ar = name_ar.trim()
    if (store_type) updatePayload.store_type = store_type
    if (typeof address === 'string') updatePayload.address = address.trim()
    if (typeof description === 'string') updatePayload.description = description.trim()
    if (typeof description_ar === 'string') updatePayload.description_ar = description_ar.trim()
    if (typeof slogan === 'string') updatePayload.slogan = slogan.trim()
    if (typeof website_url === 'string') updatePayload.website_url = website_url.trim() || null
    if (typeof logo_url === 'string') updatePayload.logo_url = logo_url.trim()
    if (typeof cover_url === 'string') updatePayload.cover_url = cover_url.trim()
    if (social_links && typeof social_links === 'object') updatePayload.social_links = social_links

    const { data: updated, error } = await supabase
      .from('bookstores')
      .update(updatePayload)
      .eq('id', storeId)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, store: updated })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 })
  }
}

/**
 * DELETE /api/stores?id=...
 * Permanently delete a bookstore (admin only)
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'MODERATOR'
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admins only' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('id')

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Store ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('bookstores')
      .delete()
      .eq('id', storeId)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Store deleted successfully' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 })
  }
}

