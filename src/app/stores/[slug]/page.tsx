import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStoreBySlug } from '@/lib/stores/store-service'
import { StoreDetailClient } from '@/components/stores/store-detail-client'

interface StorePageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { store } = await getStoreBySlug(slug, supabase)
  if (!store) {
    return { title: 'المكتبة غير موجودة — WARAQ | ورق' }
  }

  const title = `${store.name_ar || store.name} — عروض الكتب والفعاليات | WARAQ | ورق`
  const description =
    store.description_ar ||
    store.description ||
    `دليل وكتالوج ${store.name_ar || store.name} في مصر، باقات الكتب المخفضة وفعاليات القراءة وحفلات التوقيع.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: store.cover_url ? [{ url: store.cover_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: store.cover_url ? [store.cover_url] : [],
    },
  }
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { store, offers, events } = await getStoreBySlug(slug, supabase)

  if (!store) {
    notFound()
  }

  // Schema.org BookStore JSON-LD
  const sameAsLinks = store.social_links
    ? Object.values(store.social_links).filter(Boolean)
    : []
  if (store.website_url) sameAsLinks.push(store.website_url)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BookStore',
    name: store.name_ar || store.name,
    alternateName: store.name,
    description: store.description_ar || store.description,
    image: store.logo_url || store.cover_url,
    address: store.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: store.address,
          addressCountry: 'EG',
        }
      : undefined,
    geo:
      store.latitude && store.longitude
        ? {
            '@type': 'GeoCoordinates',
            latitude: store.latitude,
            longitude: store.longitude,
          }
        : undefined,
    sameAs: sameAsLinks,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StoreDetailClient
        store={store}
        offers={offers}
        events={events}
        currentUserId={user?.id ?? null}
      />
    </>
  )
}
