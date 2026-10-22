import { Metadata } from 'next'
import { PartnerFormClient } from '@/components/partner/partner-form-client'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'انضم كشريك — WaraqConnect (ورق كونكت) | للمكتبات ومنظمي الفعاليات',
  description:
    'هل تمتلك مكتبة أو تنظم فعاليات قراءة؟ انضم كشريك مميز في منصة WaraqConnect (ورق كونكت) واستفد من الوصول لآلاف القراء النشطين.',
}

interface PartnerFormPageProps {
  searchParams?: Promise<{ unauthorized?: string }>
}

export default async function PartnerFormPage({ searchParams }: PartnerFormPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined
  const isUnauthorized = resolvedParams?.unauthorized === 'true'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userProfile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, full_name_ar, email')
      .eq('id', user.id)
      .single()
    userProfile = data
  }

  return (
    <PartnerFormClient
      user={user ? { id: user.id, profile: userProfile } : null}
      isUnauthorized={isUnauthorized}
    />
  )
}
