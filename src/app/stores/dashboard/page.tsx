import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBookstores, getAllOffers, getAllEvents, DEMO_STORES } from '@/lib/stores/store-service'
import { StoreDashboardClient } from '@/components/stores/store-dashboard-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'لوحة إدارة المكتبات والعروض — WARAQ | ورق',
  description: 'بوابة إدارة المكتبة: تعديل العنوان والموقع على الخريطة، مواعيد العمل، إضافة كتب المخزون، باقات العروض وحفلات التوقيع.',
}

export default async function StoreDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const stores = await getBookstores({ _client: supabase })
  const offers = await getAllOffers({ _client: supabase })
  const events = await getAllEvents(supabase)

  const defaultStore = stores[0] || DEMO_STORES[0]

  return (
    <StoreDashboardClient
      initialStore={defaultStore}
      allStores={stores.length > 0 ? stores : DEMO_STORES}
      initialOffers={offers}
      initialEvents={events}
      currentUserId={user?.id ?? null}
    />
  )
}
