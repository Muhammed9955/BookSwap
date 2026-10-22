import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBookstores, getAllOffers, getAllEvents, DEMO_STORES } from '@/lib/stores/store-service'

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

  const stores = await getBookstores({ _client: supabase })
  const userStore = stores.find(s => s.owner_id === user.id)
  const isStaff = profile?.role === 'ADMIN' || profile?.role === 'MODERATOR'
  const isPartner = Boolean(userStore)

  // Normal users who are neither staff nor bookstore owners are blocked
  if (!isStaff && !isPartner) {
    redirect('/partner-form?unauthorized=true')
  }

  const offers = await getAllOffers({ _client: supabase })
  const events = await getAllEvents(supabase)

  const defaultStore = userStore || stores[0] || DEMO_STORES[0]

  return {
    user,
    stores: stores.length > 0 ? stores : DEMO_STORES,
    defaultStore,
    offers,
    events,
  }
}
