import { Metadata } from 'next'
import { AboutPageClient } from '@/components/about/about-page-client'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'من نحن — WARAQ | ورق',
  description:
    'عالم جديد بين كل صفحة والتانية. تعرّف على قصة منصة وَرَق ورؤيتنا لبناء أكبر مجتمع عربي لتبادل واستعارة وشراء الكتب المستعملة.',
}

export default async function AboutPage() {
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

  return (
    <AboutPageClient user={user ? { id: user.id, profile: userProfile } : null} />
  )
}
