import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileSettingsClient } from '@/components/profile/profile-settings-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'إعدادات الملف الشخصي — WARAQ | ورق',
  description: 'إدارة وتعديل بيانات ملفك الشخصي وصورتك واهتماماتك الأدبية على منصة وَرَق',
}

export default async function ProfileSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [
    { data: profile },
    { data: categories },
    { data: cities },
    { data: profileGenres },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, city:cities(*), area:areas(*)')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('cities')
      .select('*, areas(*)')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('profile_genres')
      .select('category_id')
      .eq('profile_id', user.id),
  ])

  let currentProfile = profile
  if (!currentProfile) {
    const meta = user.user_metadata || {}
    const fullName = meta.full_name || meta.name || ''
    const avatarUrl = meta.avatar_url || meta.picture || ''
    const referralCode = 'BOOK-' + Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: fullName || null,
        avatar_url: avatarUrl || null,
        email_verified: user.email_confirmed_at != null,
        referral_code: referralCode,
        preferred_language: 'ar',
        onboarding_completed: true,
      })
      .select('*, city:cities(*), area:areas(*)')
      .maybeSingle()

    currentProfile = newProfile
  }

  if (!currentProfile) {
    redirect('/onboarding')
  }

  const initialGenreIds = (profileGenres || []).map(g => g.category_id)

  return (
    <ProfileSettingsClient
      profile={currentProfile}
      categories={categories ?? []}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cities={(cities ?? []) as any}
      initialGenreIds={initialGenreIds}
    />
  )
}
