import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client'
import { getCommunities } from '@/lib/communities/community-service'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'لوحة التحكم — WaraqConnect Admin | إدارة ورق كونكت',
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userRole = 'ADMIN'
  let currentUserId = 'admin-dev'

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['ADMIN', 'MODERATOR'].includes(profile.role)) {
      redirect('/')
    }
    userRole = profile.role
    currentUserId = user.id
  } else if (process.env.NODE_ENV !== 'development') {
    redirect('/login')
  }

  // Timestamps for Analytics & Retention Cohorts
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // KPIs & Data
  const [
    { count: totalUsers },
    { count: newUsersToday },
    { count: newUsersWeek },
    { count: newUsersMonth },
    { count: dauCount },
    { count: wauCount },
    { count: mauCount },
    { count: totalListings },
    { count: activeListings },
    { count: newListingsToday },
    { count: totalTransactions },
    { count: completedTransactions },
    { count: pendingReports },
    { count: featuredCount },
    { data: recentListings },
    { data: recentReports },
    { data: recentUsers },
    communities,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', oneDayAgo),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('updated_at', oneDayAgo),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('updated_at', sevenDaysAgo),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('updated_at', thirtyDaysAgo),
    supabase.from('book_listings').select('id', { count: 'exact', head: true }),
    supabase.from('book_listings').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    supabase.from('book_listings').select('id', { count: 'exact', head: true }).gte('created_at', oneDayAgo),
    supabase.from('transactions').select('id', { count: 'exact', head: true }),
    supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase.from('book_listings').select('id', { count: 'exact', head: true }).eq('is_featured', true),
    supabase.from('book_listings')
      .select('*, book:books(title), seller:profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('reports')
      .select('*, reporter:profiles!reports_reporter_id_fkey(full_name)')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('profiles')
      .select('id, full_name, email, created_at, role, is_suspended, total_listings')
      .order('created_at', { ascending: false })
      .limit(10),
    getCommunities({ _client: supabase }),
  ])

  // Retention & Stickiness Index
  const dau = dauCount ?? 0
  const wau = wauCount ?? 0
  const mau = (mauCount && mauCount > 0) ? mauCount : Math.max(wau, dau, totalUsers ?? 0)
  const stickiness = mau > 0 ? Math.min(100, Math.round((dau / mau) * 100)) : 0

  const stats = {
    total_users: totalUsers ?? 0,
    active_users: dau,
    dau,
    wau,
    mau,
    new_users_today: newUsersToday ?? 0,
    new_users_week: newUsersWeek ?? 0,
    new_users_month: newUsersMonth ?? 0,
    retention_rate: stickiness,
    stickiness_ratio: stickiness,
    total_listings: totalListings ?? 0,
    active_listings: activeListings ?? 0,
    new_listings_today: newListingsToday ?? 0,
    total_transactions: totalTransactions ?? 0,
    completed_transactions: completedTransactions ?? 0,
    pending_reports: pendingReports ?? 0,
    featured_listings: featuredCount ?? 0,
    total_messages: 0,
    gmv: 0,
  }

  return (
    <AdminDashboardClient
      stats={stats}
      recentListings={recentListings ?? []}
      recentReports={recentReports ?? []}
      recentUsers={recentUsers ?? []}
      adminRole={userRole}
      initialCommunities={communities ?? []}
      currentUserId={currentUserId}
    />
  )
}

