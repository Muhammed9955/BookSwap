import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MessagesClient } from '@/components/messages/messages-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'الرسائل — BookSwap',
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirectTo=/messages')

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      *,
      participant_1_profile:profiles!conversations_participant_1_fkey(id, full_name, full_name_ar, avatar_url, is_verified),
      participant_2_profile:profiles!conversations_participant_2_fkey(id, full_name, full_name_ar, avatar_url, is_verified),
      listing:book_listings(id, book:books(title, title_ar), images:book_images(url, is_primary))
    `)
    .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
    .order('last_message_at', { ascending: false })

  return (
    <MessagesClient
      userId={user.id}
      conversations={conversations ?? []}
    />
  )
}

