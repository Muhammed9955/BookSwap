import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getBookstores } from '@/lib/stores/store-service'
import { StoresListClient } from '@/components/stores/stores-list-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'مكتبات مصر الشريكة وعروض الكتب — WARAQ | ورق',
  description: 'دليل كبرى المكتبات التراثية والحديثة في مصر: ديوان، دار الشروق، سور الأزبكية، مع باقات الكتب المخفضة وفعاليات توقيع الكتب.',
}

export default async function StoresPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const stores = await getBookstores({ _client: supabase })

  return <StoresListClient initialStores={stores} currentUserId={user?.id ?? null} />
}
