import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MainLayout } from '@/components/layout/main-layout'
import { NotificationsClient } from '@/components/notifications/notifications-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'الإشعارات — BookSwap' }

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <MainLayout user={{ id: user.id }}>
      <NotificationsClient userId={user.id} notifications={notifications ?? []} />
    </MainLayout>
  )
}

