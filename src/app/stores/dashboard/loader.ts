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
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  // 1. Fetch public & inactive stores
  const stores = await getBookstores({ _client: supabase, includeInactive: true })

  // 2. Direct database query for bookstores owned by this user (utilizing RLS owner policy)
  const { data: ownedDbStores } = await supabase
    .from('bookstores')
    .select('*')
    .eq('owner_id', user.id)

  // 3. Direct database check for any partner requests submitted by this user
  const { data: partnerReqs } = await supabase
    .from('partner_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

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

  // If user applied but store not yet instantiated in DB, construct temporary draft store so dashboard renders
  if (!userStore && partnerReqs && partnerReqs.length > 0) {
    const pr = partnerReqs[0]
    userStore = {
      id: pr.id,
      owner_id: user.id,
      name: pr.store_name || pr.contact_name || 'My Store',
      name_ar: pr.store_name || pr.contact_name || 'متجري',
      slug: (pr.store_name || 'my-store').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      store_type: (pr.store_type as any) || 'BOTH',
      city_id: pr.city_id || 'cairo',
      address: pr.address || '',
      phone: pr.phone || '',
      email: user.email,
      social_links: { email: user.email, whatsapp: pr.whatsapp || pr.phone },
      is_active: pr.status === 'APPROVED',
      is_verified: pr.status === 'APPROVED',
      created_at: pr.created_at || new Date().toISOString(),
    } as Bookstore

    if (!stores.some(s => s.id === userStore!.id)) {
      stores.unshift(userStore)
    }
  }

  const isStaff = profile?.role === 'ADMIN' || profile?.role === 'MODERATOR'
  const hasPartnerReq = Boolean(partnerReqs && partnerReqs.length > 0)
  const isPartner = Boolean(userStore) || profile?.role === 'PARTNER' || profile?.role === 'STORE_OWNER' || hasPartnerReq

  // Normal users who are neither staff, store owners, nor applicants are blocked
  if (!isStaff && !isPartner) {
    redirect('/partner-form?unauthorized=true')
  }

  const offers = await getAllOffers({ _client: supabase })
  const events = await getAllEvents(supabase)

  const defaultStore = userStore || (isStaff ? stores[0] : null) || stores[0] || null

  return {
    user,
    stores,
    defaultStore,
    offers,
    events,
  }
}

