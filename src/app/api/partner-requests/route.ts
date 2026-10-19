import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/partner-requests
 * Fetch partner applications from Supabase database
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('partner_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Error fetching partner requests from DB:', error.message)
      return NextResponse.json({ success: false, error: error.message, applications: [] }, { status: 500 })
    }

    return NextResponse.json({ success: true, applications: data || [] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message, applications: [] }, { status: 500 })
  }
}

/**
 * POST /api/partner-requests
 * Submit a partner store application into Supabase database (partner_requests table)
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

    const payload = {
      name: applicant,
      business_name: bName,
      phone,
      city: city || 'القاهرة (Cairo)',
      partner_type: partner_type === 'EVENT_ORGANIZER' ? 'EVENT_ORGANIZER' : 'BOOKSTORE',
      details: typeof details === 'string' ? details : JSON.stringify(body),
      status: 'PENDING',
      submitted_by: user?.id || null,
    }

    const { data, error } = await supabase
      .from('partner_requests')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      console.error('Failed to save partner request in DB:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      application: data,
      message: 'Application saved successfully in database',
    })
  } catch (err: any) {
    console.error('API /api/partner-requests error:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
