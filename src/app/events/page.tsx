import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAllEvents } from '@/lib/stores/store-service'
import { EventsHubClient } from '@/components/stores/events-hub-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'فعاليات القراءة وحفلات التوقيع وملتقيات الكتب — BookSwap Egypt',
  description: 'دليل فعاليات ومجتمعات القراءة في مصر: حفلات توقيع الكتّاب، ملتقيات مقاهي القراءة وسيلانترو، ومناقشات الروايات الأسبوعية مع إمكانية تأكيد الحضور RSVP.',
}

export default async function EventsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const events = await getAllEvents()

  return <EventsHubClient initialEvents={events} currentUserId={user?.id ?? null} />
}
