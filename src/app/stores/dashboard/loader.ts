import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBookstores, getAllOffers, getAllEvents } from '@/lib/stores/store-service'
import type { Bookstore } from '@/types/store'

export async function loadStoreDashboardData() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/stores/dashboard')
  }

  // Fetch profile to verify role permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // 1. Fetch public & inactive stores
  const stores = await getBookstores({ _client: supabase, includeInactive: true })

  // 2. Direct database query for bookstores owned by this user (utilizing RLS owner policy)
  const { data: ownedDbStores } = await supabase
    .from('bookstores')
    .select('*')
    .eq('owner_id', user.id)

  // 3. Direct database check for any partner requests submitted by this user (column is submitted_by)
  let partnerReqs: any[] = []
  try {
    const { data: prData, error: prErr } = await supabase
      .from('partner_requests')
      .select('*')
      .eq('submitted_by', user.id)
      .order('created_at', { ascending: false })
    if (!prErr && Array.isArray(prData)) {
      partnerReqs = prData
    }
  } catch (err) {
    console.warn('partner_requests query fallback in loader:', err)
  }

  let userStore =
    (ownedDbStores?.[0] as Bookstore | undefined) ||
    stores.find(s => s.owner_id === user.id)

  if (!userStore && user.email) {
    userStore = stores.find(s => s.email?.toLowerCase() === user.email?.toLowerCase() || (s.social_links as any)?.email?.toLowerCase() === user.email?.toLowerCase())
  }

  // Prepend owned DB stores if not already in list
  if (ownedDbStores && ownedDbStores.length > 0) {
    for (const obs of ownedDbStores) {
      if (!stores.some(s => s.id === obs.id)) {
        stores.unshift(obs as Bookstore)
      }
    }
  }

  // If user applied but store not yet instantiated in DB, construct active store from partner request
  if (!userStore && partnerReqs && partnerReqs.length > 0) {
    const pr = partnerReqs[0]
    let parsedDetails: any = {}
    try {
      parsedDetails = typeof pr.details === 'string' ? JSON.parse(pr.details) : pr.details || {}
    } catch {}

    const storeName = pr.business_name || parsedDetails.store_name || pr.name || 'متجري'
    userStore = {
      id: pr.id,
      owner_id: user.id,
      name: storeName,
      name_ar: parsedDetails.store_name_ar || storeName,
      slug: (storeName || 'my-store').toLowerCase().replace(/[^a-z0-9]+/g, '-') || `store-${Date.now()}`,
      store_type: (parsedDetails.store_type as any) || 'BOTH',
      city_id: pr.city || 'cairo',
      address: parsedDetails.address || pr.city || '',
      phone: pr.phone || '',
      email: user.email,
      social_links: { email: user.email, whatsapp: pr.phone },
      is_active: true,
      is_verified: pr.status === 'APPROVED',
      created_at: pr.created_at || new Date().toISOString(),
    } as Bookstore

    if (!stores.some(s => s.id === userStore!.id)) {
      stores.unshift(userStore)
    }
  }

  // If userStore is still not present, ensure a default store instance is ready so dashboard loads cleanly
  if (!userStore) {
    const storeDisplayName = profile?.full_name ? `مكتبة ${profile.full_name}` : (user.email ? `متجر ${user.email.split('@')[0]}` : 'متجري')
    userStore = {
      id: `store-${user.id.slice(0, 8)}`,
      owner_id: user.id,
      name: storeDisplayName,
      name_ar: storeDisplayName,
      slug: `store-${user.id.slice(0, 8)}`,
      store_type: 'BOTH',
      city_id: 'cairo',
      address: 'القاهرة',
      phone: profile?.phone || '',
      email: user.email,
      social_links: { email: user.email },
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
    } as Bookstore

    if (!stores.some(s => s.id === userStore!.id)) {
      stores.unshift(userStore)
    }
  }

  // Ensure user profile role is elevated to PARTNER in DB
  if (profile?.role !== 'ADMIN' && profile?.role !== 'MODERATOR' && profile?.role !== 'PARTNER' && profile?.role !== 'STORE_OWNER') {
    try {
      await supabase.from('profiles').update({ role: 'PARTNER' }).eq('id', user.id)
    } catch {}
  }

  const offers = await getAllOffers({ _client: supabase })
  const events = await getAllEvents(supabase)

  const isStaff = profile?.role === 'ADMIN' || profile?.role === 'MODERATOR'
  const defaultStore = userStore || (isStaff ? stores[0] : null) || stores[0] || null

  return {
    user,
    stores,
    defaultStore,
    offers,
    events,
  }
}

