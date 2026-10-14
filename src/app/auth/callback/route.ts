import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  let next = searchParams.get('next') ?? '/'

  // Prevent open redirect attacks: ensure next is a relative path
  if (!next.startsWith('/') || next.startsWith('//')) {
    next = '/'
  }

  // Handle OAuth provider error returned directly in the query parameters
  if (error) {
    const errorParam = encodeURIComponent(errorDescription || error)
    return NextResponse.redirect(`${origin}/login?error=${errorParam}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError && data?.user) {
      // Check if profile exists and if onboarding is completed
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, onboarding_completed, full_name, avatar_url')
        .eq('id', data.user.id)
        .maybeSingle()

      // If user profile doesn't exist yet, create it from Google user metadata
      if (!profile) {
        const meta = data.user.user_metadata || {}
        const fullName = meta.full_name || meta.name || ''
        const avatarUrl = meta.avatar_url || meta.picture || ''
        const referralCode = 'BOOK-' + Math.random().toString(36).substring(2, 8).toUpperCase()

        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: fullName || null,
          avatar_url: avatarUrl || null,
          email_verified: true,
          referral_code: referralCode,
          preferred_language: 'ar',
          onboarding_completed: false,
        })

        return NextResponse.redirect(`${origin}/onboarding`)
      }

      if (!profile.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    } else if (exchangeError) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
