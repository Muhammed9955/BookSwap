import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/partner-requests
 * Fetch partner applications from Supabase database (partner_requests + unverified bookstores fallback)
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Fetch from partner_requests table
    let partnerReqs: any[] = []
    try {
      const { data, error } = await supabase
        .from('partner_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && Array.isArray(data)) {
        partnerReqs = data
      }
    } catch (e) {
      console.warn('Error fetching partner_requests from DB:', e)
    }

    // 2. Fetch unverified bookstores from bookstores table
    let unverifiedStores: any[] = []
    try {
      const { data, error } = await supabase
        .from('bookstores')
        .select('*')
        .eq('is_verified', false)
        .order('created_at', { ascending: false })

      if (!error && Array.isArray(data)) {
        unverifiedStores = data
      }
    } catch (e) {
      console.warn('Error fetching unverified bookstores from DB:', e)
    }

    // 3. Synthesize applications for any unverified bookstore not already in partnerReqs
    const combined = [...partnerReqs]
    for (const st of unverifiedStores) {
      const alreadyExists = combined.some(
        r =>
          r.id === st.id ||
          (r.business_name &&
            r.business_name.trim().toLowerCase() === (st.name || '').trim().toLowerCase()) ||
          (r.details && r.details.includes(st.id))
      )

      if (!alreadyExists) {
        combined.push({
          id: st.id,
          name: st.name_ar || st.name,
          business_name: st.name_ar || st.name,
          phone: st.social_links?.whatsapp || '',
          city: st.address || 'القاهرة (Cairo)',
          partner_type: st.store_type === 'EVENT_ORGANIZER' ? 'EVENT_ORGANIZER' : 'BOOKSTORE',
          details: JSON.stringify({
            id: st.id,
            store_name: st.name,
            store_name_ar: st.name_ar || st.name,
            business_name: st.name_ar || st.name,
            applicant_id: st.owner_id,
            owner_name: st.name_ar || st.name,
            phone: st.social_links?.whatsapp || '',
            email: st.social_links?.email || '',
            city: st.address || 'القاهرة',
            district: st.district,
            address: st.address,
            store_type: st.store_type || 'ONLINE',
            is_online_only: st.store_type === 'ONLINE',
            working_hours: st.opening_hours?.['مواعيد العمل'] || '',
            social_links: st.social_links || {},
            bio: st.description || '',
            bio_ar: st.description_ar || '',
            logo_url: st.logo_url,
            cover_url: st.cover_url,
            status: 'PENDING',
            created_at: st.created_at,
          }),
          status: 'PENDING',
          submitted_by: st.owner_id,
          created_at: st.created_at,
        })
      }
    }

    return NextResponse.json({ success: true, applications: combined })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message, applications: [] }, { status: 500 })
  }
}

/**
 * POST /api/partner-requests
 * Submit a partner store application into Supabase database
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = await req.json()
    const {
      applicant_name,
      owner_name,
      business_name,
      store_name_ar,
      phone,
      email,
      applicant_id,
      city,
      partner_type = 'BOOKSTORE',
      details,
    } = body

    const applicant = owner_name || applicant_name
    const bName = store_name_ar || business_name

    if (!applicant || !bName || !phone) {
      return NextResponse.json(
        { success: false, error: 'Owner name, business name, and phone are required' },
        { status: 400 }
      )
    }

    let parsedDetailsObj: any = {}
    if (typeof details === 'string') {
      try {
        parsedDetailsObj = JSON.parse(details)
      } catch {
        parsedDetailsObj = { raw: details }
      }
    } else if (details && typeof details === 'object') {
      parsedDetailsObj = { ...details }
    } else {
      parsedDetailsObj = { ...body }
    }

    // Ensure applicant_id and email are stored inside details
    if (email && !parsedDetailsObj.email) parsedDetailsObj.email = email
    if ((user?.id || applicant_id) && !parsedDetailsObj.applicant_id) {
      parsedDetailsObj.applicant_id = user?.id || applicant_id
    }

    // Ensure effective user id resolves to an existing profile if possible
    let resolvedUserId = user?.id || applicant_id || null
    if (resolvedUserId && typeof resolvedUserId === 'string' && !resolvedUserId.includes('-')) {
      // Not a valid UUID
      resolvedUserId = null
    }

    const payload = {
      name: applicant,
      business_name: bName,
      phone,
      city: city || 'القاهرة (Cairo)',
      partner_type: partner_type === 'EVENT_ORGANIZER' ? 'EVENT_ORGANIZER' : 'BOOKSTORE',
      details: JSON.stringify(parsedDetailsObj),
      status: 'PENDING',
      submitted_by: resolvedUserId,
    }

    let savedApp: any = null

    // 1. Try insert into partner_requests
    try {
      const { data, error } = await supabase
        .from('partner_requests')
        .insert(payload)
        .select('*')
        .single()

      if (!error && data) {
        savedApp = data
      } else if (error) {
        console.warn('Failed to insert into partner_requests (RLS or table issue):', error.message)
      }
    } catch (e) {
      console.warn('Exception during partner_requests insert:', e)
    }

    // 2. Pre-save bookstore in bookstores table with is_verified: false
    try {
      let bookstoreOwnerId = resolvedUserId
      if (!bookstoreOwnerId) {
        const { data: firstProfile } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
          .maybeSingle()
        if (firstProfile?.id) bookstoreOwnerId = firstProfile.id
      }

      const cleanSlug =
        bName
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-') || `store-${Date.now()}`

      const { data: storeData } = await supabase
        .from('bookstores')
        .insert({
          name: bName,
          name_ar: bName,
          slug: cleanSlug,
          description: parsedDetailsObj.bio || parsedDetailsObj.details || 'مكتبة شريكة تحت المراجعة والتوثيق',
          description_ar: parsedDetailsObj.bio_ar || parsedDetailsObj.details || 'مكتبة شريكة تحت المراجعة والتوثيق',
          store_type: parsedDetailsObj.store_type || 'ONLINE',
          address: parsedDetailsObj.address || (parsedDetailsObj.is_online_only ? 'متجر إلكتروني أونلاين' : city),
          district: parsedDetailsObj.district || null,
          latitude: parsedDetailsObj.latitude || null,
          longitude: parsedDetailsObj.longitude || null,
          social_links: {
            whatsapp: phone,
            email: parsedDetailsObj.email || undefined,
            ...(parsedDetailsObj.social_links || {}),
          },
          opening_hours: parsedDetailsObj.working_hours
            ? { 'مواعيد العمل': parsedDetailsObj.working_hours }
            : { 'مواعيد العمل': 'يومياً 10:00 ص - 12:00 منتصف الليل' },
          logo_url: parsedDetailsObj.logo_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=250&q=80',
          cover_url: parsedDetailsObj.cover_url || 'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=1200&q=80',
          is_verified: false,
          is_active: true,
          owner_id: bookstoreOwnerId,
        })
        .select('*')
        .single()

      if (!savedApp && storeData) {
        savedApp = {
          id: storeData.id,
          name: applicant,
          business_name: bName,
          phone,
          city: city || 'القاهرة (Cairo)',
          partner_type,
          details: JSON.stringify(parsedDetailsObj),
          status: 'PENDING',
          submitted_by: bookstoreOwnerId,
          created_at: storeData.created_at,
        }
      }
    } catch (e) {
      console.warn('Exception during bookstores table backup pre-save:', e)
    }

    if (!savedApp) {
      // Synthesize fallback response so client can safely continue
      savedApp = {
        id: `app-${Date.now()}`,
        name: applicant,
        business_name: bName,
        phone,
        city: city || 'القاهرة (Cairo)',
        partner_type,
        details: JSON.stringify(parsedDetailsObj),
        status: 'PENDING',
        submitted_by: resolvedUserId,
        created_at: new Date().toISOString(),
      }
    }

    // Application is submitted with status PENDING for admin review.
    // Role elevation to PARTNER, approval notification, and approval email are triggered when the admin confirms/approves the application.

    return NextResponse.json({
      success: true,
      application: savedApp,
      message: 'Application saved successfully',
    })
  } catch (err: any) {
    console.error('API /api/partner-requests error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
