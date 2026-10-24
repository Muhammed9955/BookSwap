import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // If Supabase credentials are missing or invalid, bypass gracefully
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Refresh session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // 1. Strict Protection for Admin Routes (/admin)
    if (pathname.startsWith('/admin')) {
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(url)
      }

      // Check role in profile table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile || !['ADMIN', 'MODERATOR'].includes(profile.role)) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        url.searchParams.set('access_denied', 'admin_only')
        return NextResponse.redirect(url)
      }
    }

    // 2. Protection for Bookstore Partner Dashboard (/stores/dashboard)
    if (pathname.startsWith('/stores/dashboard')) {
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(url)
      }
      // Any authenticated user can access the store dashboard
    }

    // 3. User Account & Member Routes Protection
    const protectedPaths = [
      '/messages',
      '/profile/settings',
      '/profile/edit',
      '/books/add',
      '/wishlist',
      '/notifications',
      '/transactions',
      '/orders',
    ]
    const isProtected = protectedPaths.some(p => pathname.startsWith(p))

    if (isProtected && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error('Session update error in proxy middleware:', error)
  }

  return supabaseResponse
}
