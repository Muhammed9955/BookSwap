import { Metadata } from 'next'
import { TermsClient } from './terms-client'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'شروط الخدمة والتبادل — WARAQ | ورق',
  description:
    'تعرف على شروط وقواعد استخدام منصة وَرَق (WARAQ)، ميثاق مجتمع القراء، إرشادات التبادل العادل، وحماية الودائع واللقاءات الآمنة.',
}

export default async function TermsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userProfile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    userProfile = data
  }

  return <TermsClient user={user ? { id: user.id, profile: userProfile } : null} />
}
