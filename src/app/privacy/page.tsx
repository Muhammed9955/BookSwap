import { Metadata } from 'next'
import { PrivacyClient } from './privacy-client'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'سياسة الخصوصية — WARAQ | ورق',
  description:
    'تعرف على كيفية جمع واستخدام وحماية بياناتك في منصة وَرَق (WARAQ)، التزامنا بعدم بيع البيانات الشخصية، وأمان حسابك وتسجيل الدخول عبر Google.',
}

export default async function PrivacyPage() {
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

  return <PrivacyClient user={user ? { id: user.id, profile: userProfile } : null} />
}
