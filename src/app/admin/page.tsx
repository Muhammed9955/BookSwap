import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client'
import { getCommunities } from '@/lib/communities/community-service'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'لوحة التحكم — BookSwap Admin',
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['ADMIN', 'MODERATOR'].includes(profile.role)) {
    redirect('/')
  }

  // KPIs & Data
  const [
    { count: totalUsers },
    { count: totalListings },
    { count: activeListings },
    { count: totalTransactions },
    { count: pendingReports },
    { count: featuredCount },
    { data: recentListings },
    { data: recentReports },
    { data: recentUsers },
    communities,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact' }),
    supabase.from('book_listings').select('id', { count: 'exact' }),
    supabase.from('book_listings').select('id', { count: 'exact' }).eq('status', 'ACTIVE'),
    supabase.from('transactions').select('id', { count: 'exact' }),
    supabase.from('reports').select('id', { count: 'exact' }).eq('status', 'PENDING'),
    supabase.from('book_listings').select('id', { count: 'exact' }).eq('is_featured', true),
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

  const stats = {
    total_users: totalUsers ?? 0,
    active_users: 0,
    new_users_today: 0,
    total_listings: totalListings ?? 0,
    active_listings: activeListings ?? 0,
    new_listings_today: 0,
    total_transactions: totalTransactions ?? 0,
    completed_transactions: 0,
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
      adminRole={profile.role}
      initialCommunities={communities ?? []}
      currentUserId={user.id}
    />
  )
}

