import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAllEvents } from '@/lib/stores/store-service'
import { EventsHubClient } from '@/components/stores/events-hub-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'فعاليات القراءة وحفلات التوقيع وملتقيات الكتب — WARAQ | ورق',
  description:
    'دليل فعاليات ومجتمعات القراءة في مصر: حفلات توقيع الكتّاب، ملتقيات مقاهي القراءة وسيلانترو، ومناقشات الروايات الأسبوعية مع إمكانية تأكيد الحضور RSVP.',
  openGraph: {
    title: 'فعاليات ومجتمعات القراءة وحفلات التوقيع — WARAQ | ورق',
    description: 'ملتقيات مقاهي القراءة وسيلانترو، ندوات مناقشة الروايات وحفلات توقيع الكتاب في القاهرة والإسكندرية.',
    type: 'website',
  },
}

export default async function EventsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const events = await getAllEvents()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'فعاليات ومجتمعات القراءة وحفلات التوقيع في مصر',
    itemListElement: events.map((ev, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Event',
        name: ev.title_ar || ev.title,
        description: ev.description_ar || ev.description,
        startDate: ev.starts_at,
        endDate: ev.ends_at,
        location: {
          '@type': 'Place',
          name: ev.location || 'القاهرة، مصر',
          address: ev.address || 'Cairo, Egypt',
        },
        offers: {
          '@type': 'Offer',
          price: ev.price || '0',
          priceCurrency: 'EGP',
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EventsHubClient initialEvents={events} currentUserId={user?.id ?? null} />
    </>
  )
}
