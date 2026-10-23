import { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AddBookForm } from '@/components/books/add-book-form'
import { MainLayout } from '@/components/layout/main-layout'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'أضف كتاب — WARAQ | ورق',
  description: 'أضف كتابك وابدأ رحلة المبادلة على منصة وَرَق',
}

interface AddBookPageProps {
  searchParams: Promise<{ communityId?: string; communitySlug?: string }>
}

export default async function AddBookPage({ searchParams }: AddBookPageProps) {
  const { communityId, communitySlug } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const redirectTarget = communityId
      ? `/login?redirectTo=/books/add?communityId=${encodeURIComponent(communityId)}&communitySlug=${encodeURIComponent(communitySlug || '')}`
      : '/login?redirectTo=/books/add'
    redirect(redirectTarget)
  }

  const [{ data: categories }, { data: cities }, { data: profile }, { data: community }] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('cities').select('*, areas(*)').eq('is_active', true).order('sort_order'),
    supabase.from('profiles').select('city_id, area_id').eq('id', user.id).single(),
    communityId
      ? supabase.from('communities').select('id, name, name_ar, slug').eq('id', communityId).maybeSingle()
      : Promise.resolve({ data: null } as any),
  ])

  return (
    <MainLayout user={{ id: user.id }}>
      <div className="page-container py-4 sm:py-8 max-w-2xl px-3.5 sm:px-6">
        <Suspense fallback={<div className="h-40 flex items-center justify-center text-muted-foreground">جاري التحميل...</div>}>
          <AddBookForm
            userId={user.id}
            categories={categories ?? []}
            cities={cities ?? []}
            defaultCityId={profile?.city_id || undefined}
            defaultAreaId={profile?.area_id || undefined}
            communityId={communityId}
            communitySlug={communitySlug || community?.slug}
            communityName={community?.name_ar || community?.name}
          />
        </Suspense>
      </div>
    </MainLayout>
  )
}

