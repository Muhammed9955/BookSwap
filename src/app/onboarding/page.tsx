import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingClient } from '@/components/onboarding/onboarding-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'مرحباً بك في وَرَق — WARAQ | ورق',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: categories }, { data: cities }, { data: profile }, { data: profileGenres }] =
    await Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('cities').select('*, areas(*)').eq('is_active', true).order('sort_order'),
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('profile_genres').select('category_id').eq('profile_id', user.id),
    ])

  // If user has already completed onboarding, never repeat it: send to home
  if (profile?.onboarding_completed) {
    redirect('/')
  }

  // Ensure profile row exists if this is the very first time
  let currentProfile = profile
  if (!currentProfile) {
    const meta = user.user_metadata || {}
    const fullName = meta.full_name || meta.name || ''
    const avatarUrl = meta.avatar_url || meta.picture || ''
    const phone = meta.whatsapp_number || meta.phone || ''
    const referralCode = 'BOOK-' + Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: fullName || null,
        avatar_url: avatarUrl || null,
        whatsapp_number: phone || null,
        show_whatsapp: Boolean(phone),
        email_verified: user.email_confirmed_at != null,
        referral_code: referralCode,
        preferred_language: 'ar',
        onboarding_completed: false,
        onboarding_step: 0,
      })
      .select()
      .maybeSingle()

    currentProfile = newProfile
  } else if (!currentProfile.whatsapp_number) {
    const meta = user.user_metadata || {}
    const phone = meta.whatsapp_number || meta.phone || ''
    if (phone) {
      currentProfile.whatsapp_number = phone
      currentProfile.show_whatsapp = true
      await supabase.from('profiles').update({ whatsapp_number: phone, show_whatsapp: true }).eq('id', user.id)
    }
  }

  const initialGenreIds = (profileGenres || []).map(g => g.category_id)

  return (
    <OnboardingClient
      userId={user.id}
      profile={currentProfile}
      categories={categories ?? []}
      cities={cities ?? []}
      initialGenreIds={initialGenreIds}
    />
  )
}
