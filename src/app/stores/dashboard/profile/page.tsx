import React, { Suspense } from 'react'
import { Metadata } from 'next'
import { StoreDashboardClient } from '@/components/stores/store-dashboard-client'
import { Loader2 } from 'lucide-react'
import { loadStoreDashboardData } from '../loader'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'بيانات المكتبة والخريطة ومواعيد العمل — WARAQ | ورق',
  description: 'تعديل بيانات المتجر، العنوان والخريطة، مواعيد وساعات العمل، وروابط التواصل.',
}

export default async function StoreProfilePage() {
  const { user, stores, defaultStore, offers, events } = await loadStoreDashboardData()

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-bold text-muted-foreground">جاري تحميل بيانات المكتبة...</p>
        </div>
      }
    >
      <StoreDashboardClient
        initialStore={defaultStore}
        allStores={stores}
        initialOffers={offers}
        initialEvents={events}
        currentUserId={user?.id ?? null}
        initialActiveTab="profile"
      />
    </Suspense>
  )
}
