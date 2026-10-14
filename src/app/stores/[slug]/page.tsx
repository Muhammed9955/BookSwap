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
  return {
    title: `${store.name_ar || store.name} — عروض الكتب والفعاليات | WARAQ | ورق`,
    description: store.description_ar || store.description,
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

  return (
    <StoreDetailClient
      store={store}
      offers={offers}
      events={events}
      currentUserId={user?.id ?? null}
    />
  )
}
