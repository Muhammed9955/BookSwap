import { Metadata } from 'next'
import { getAllOffers } from '@/lib/stores/store-service'
import { OffersHubClient } from '@/components/stores/offers-hub-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'باقات وحزم عروض الكتب في مصر — WARAQ | ورق',
  description:
    'عروض حزم الكتب (10، 20، 25 كتاب) بخصومات ضخمة مع فواصل خشبية وهدايا قراءة مجانية وتوصيل لكافة المحافظات.',
  openGraph: {
    title: 'سوق باقات وحزم عروض الكتب — WARAQ | ورق',
    description: 'وفر حتى 50% مع حزم الروايات والكتب الكلاسيكية والتنمية البشرية مع هدايا فواصل ومفكرات قراءة.',
    type: 'website',
  },
}

export default async function OffersPage() {
  const offers = await getAllOffers()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'باقات وحزم عروض الكتب في مصر — WARAQ',
    itemListElement: offers.map((offer, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: offer.title_ar || offer.title,
        description: offer.description_ar || offer.description,
        image: offer.cover_image_url,
        offers: {
          '@type': 'Offer',
          price: offer.bundle_price || '0',
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
      <OffersHubClient initialOffers={offers} />
    </>
  )
}
