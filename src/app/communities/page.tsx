import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCommunities } from '@/lib/communities/community-service'
import { CommunitiesListClient } from '@/components/communities/communities-list-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'نوادي القراءة ومجموعات التبادل الآمن في مصر — WARAQ | ورق',
  description: 'انضم إلى مجتمعات القراءة في حيك أو جامعتك (المعادي، الجامعة الأمريكية، الإسكندرية، الزمالك) مع نقاط لقاء آمنة معتمدة لتبادل واستعارة الكتب.',
}

export default async function CommunitiesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userRole: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    userRole = profile?.role ?? null
  }

  const [{ data: cities }, communities] = await Promise.all([
    supabase
      .from('cities')
      .select('*, areas(*)')
      .eq('is_active', true)
      .order('sort_order'),
    getCommunities({ _client: supabase, currentUserId: user?.id ?? null }),
  ])

  return (
    <CommunitiesListClient
      initialCommunities={communities}
      currentUserId={user?.id ?? null}
      userRole={userRole}
      cities={cities ?? []}
    />
  )
}
