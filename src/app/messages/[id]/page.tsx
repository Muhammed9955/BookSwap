import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MessagesClient } from '@/components/messages/messages-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'المحادثة — WARAQ | ورق',
}

interface MessagePageProps {
  params: Promise<{ id: string }>
}

export default async function ConversationPage({ params }: MessagePageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?redirectTo=/messages/${id}`)

  // 1. Fetch user conversations for the sidebar
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

  let allConversations = conversations ?? []

  // 2. If the requested conversation is not yet in the list (e.g. just created by a borrow/swap request), fetch it specifically
  if (!allConversations.some(c => c.id === id)) {
    const { data: specificConv } = await supabase
      .from('conversations')
      .select(`
        *,
        participant_1_profile:profiles!conversations_participant_1_fkey(id, full_name, full_name_ar, avatar_url, is_verified),
        participant_2_profile:profiles!conversations_participant_2_fkey(id, full_name, full_name_ar, avatar_url, is_verified),
        listing:book_listings(id, book:books(title, title_ar), images:book_images(url, is_primary))
      `)
      .eq('id', id)
      .maybeSingle()

    if (specificConv && (specificConv.participant_1 === user.id || specificConv.participant_2 === user.id)) {
      allConversations = [specificConv, ...allConversations]
    }
  }

  return (
    <MessagesClient
      userId={user.id}
      conversations={allConversations}
      initialConversationId={id}
    />
  )
}
