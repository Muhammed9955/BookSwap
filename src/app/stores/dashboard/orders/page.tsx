import React, { Suspense } from 'react'
import { Metadata } from 'next'
import { StoreDashboardClient } from '@/components/stores/store-dashboard-client'
import { Loader2 } from 'lucide-react'
import { loadStoreDashboardData } from '../loader'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'إدارة طلبات العملاء والشحن — WARAQ | ورق',
  description: 'متابعة دورة حياة طلبات العملاء وحالة التجهيز والشحن والتسليم.',
}

export default async function StoreOrdersPage() {
  const { user, stores, defaultStore, offers, events } = await loadStoreDashboardData()

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-bold text-muted-foreground">جاري تحميل طلبات العملاء...</p>
        </div>
      }
    >
      <StoreDashboardClient
        initialStore={defaultStore}
        allStores={stores}
        initialOffers={offers}
        initialEvents={events}
        currentUserId={user?.id ?? null}
        initialActiveTab="orders"
      />
    </Suspense>
  )
}
