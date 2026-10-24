import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBookstores, getAllOffers, getAllEvents } from '@/lib/stores/store-service'

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
  let userStore = stores.find(s => s.owner_id === user.id)
  if (!userStore && user.email) {
    userStore = stores.find(s => s.email?.toLowerCase() === user.email?.toLowerCase())
  }
  const isStaff = profile?.role === 'ADMIN' || profile?.role === 'MODERATOR'
  const isPartner = Boolean(userStore) || profile?.role === 'PARTNER'

  // Normal users who are neither staff nor bookstore owners are blocked
  if (!isStaff && !isPartner) {
    redirect('/partner-form?unauthorized=true')
  }

  const offers = await getAllOffers({ _client: supabase })
  const events = await getAllEvents(supabase)

  const defaultStore = userStore || (isStaff ? stores[0] : null) || null

  return {
    user,
    stores,
    defaultStore,
    offers,
    events,
  }
}
