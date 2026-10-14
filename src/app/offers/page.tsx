import { Metadata } from 'next'
import { getAllOffers } from '@/lib/stores/store-service'
import { OffersHubClient } from '@/components/stores/offers-hub-client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'باقات وحزم عروض الكتب في مصر — BookSwap Egypt',
  description: 'عروض حزم الكتب (10، 20، 25 كتاب) بخصومات ضخمة مع فواصل وهدايا قراءة مجانية وتوصيل لكافة المحافظات.',
}

export default async function OffersPage() {
  const offers = await getAllOffers()

  return <OffersHubClient initialOffers={offers} />
}
