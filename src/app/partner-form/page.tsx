import { Metadata } from 'next'
import { PartnerFormClient } from '@/components/partner/partner-form-client'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'انضم كشريك — WARAQ | ورق | للمكتبات ومنظمي الفعاليات',
  description:
    'هل تمتلك مكتبة أو تنظم فعاليات قراءة؟ انضم كشريك مميز في منصة وَرَق واستفد من الوصول لآلاف القراء النشطين.',
}

export default async function PartnerFormPage() {
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

  return <PartnerFormClient user={user ? { id: user.id, profile: userProfile } : null} />
}
