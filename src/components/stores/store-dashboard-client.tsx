'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'

import { useLanguage } from '@/i18n/language-context'

import type { Bookstore } from '@/types/store'

import { getStoreInventory, getStoreOrders, getLocalStoreOffers, STORE_ID_ALIASES } from '@/lib/stores/store-service'
import { Button } from '@/components/ui/button'

import type { DashboardTab, StoreDashboardClientProps } from './dashboard/types'


export type { DashboardTab, StoreDashboardClientProps } from './dashboard/types'
export { formatRealDateTime } from './dashboard/types'

import { StoreDashboardHeader } from './dashboard/components/store-dashboard-header'
import { StoreProfileTab } from './dashboard/tabs/store-profile-tab'
import { StoreInventoryTab } from './dashboard/tabs/store-inventory-tab'
import { StoreOffersTab } from './dashboard/tabs/store-offers-tab'
import { StoreOrdersTab } from './dashboard/tabs/store-orders-tab'
import { StoreEventsTab } from './dashboard/tabs/store-events-tab'

export function StoreDashboardClient({
  initialStore,
  allStores,
  initialOffers,
  initialEvents,
  currentUserId,
  initialActiveTab,
}: StoreDashboardClientProps) {
  const { lang } = useLanguage()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  const validTabs: DashboardTab[] = ['profile', 'inventory', 'offers', 'orders', 'events']

  const resolvedInitialTab: DashboardTab =
    (tabParam && validTabs.includes(tabParam as DashboardTab)
      ? (tabParam as DashboardTab)
      : initialActiveTab || 'profile')

  const [activeTab, setActiveTab] = useState<DashboardTab>(resolvedInitialTab)

  // Synchronize when tabParam changes in URL without causing loop
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam as DashboardTab)) {
      setActiveTab(prev => (prev !== tabParam ? (tabParam as DashboardTab) : prev))
    }
  }, [tabParam])

  const handleTabChange = React.useCallback((tab: DashboardTab) => {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href)
        if (url.searchParams.get('tab') !== tab) {
          url.searchParams.set('tab', tab)
          window.history.replaceState(null, '', url.pathname + url.search)
        }
      } catch {}
    }
  }, [])

  // Active Store Selection State
  const [storesList, setStoresList] = useState<Bookstore[]>(allStores)
  const [activeStoreId, setActiveStoreId] = useState<string>(initialStore?.id || allStores[0]?.id || '')
  const currentStore = React.useMemo(
    () => storesList.find(s => s.id === activeStoreId) || initialStore || storesList[0] || null,
    [storesList, activeStoreId, initialStore]
  )

  const handleStoreUpdated = React.useCallback((updated: Bookstore) => {
    setStoresList(prev => prev.map(s => (s.id === updated.id ? updated : s)))
  }, [])

  // Counts for header tab badges
  const [inventoryCount, setInventoryCount] = useState<number>(0)
  const [ordersCount, setOrdersCount] = useState<number>(0)
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0)
  const [offersCount, setOffersCount] = useState<number>(() => {
    if (!currentStore) return 0
    const matched = initialOffers.filter(o => o.store_id === currentStore.id)
    return matched.length
  })

  useEffect(() => {
    if (!activeStoreId) return
    let isMounted = true
    const resolvedId = STORE_ID_ALIASES[activeStoreId] || activeStoreId
    getStoreInventory(activeStoreId).then(items => {
      if (isMounted) {
        setInventoryCount(items.length)
        const local = getLocalStoreOffers(activeStoreId)
        const localResolved = getLocalStoreOffers(resolvedId)
        const invOffers = items.filter(item => {
          const t = (item.title || '') + ' ' + ((item as any).title_ar || '') + ' ' + ((item as any).badge || '') + ' ' + ((item as any).description || '')
          return (
            /عرض|باكدج|حزمة|بوكس|توفير|ثنائية|ثلاثية|رباعية|خماسية|offer|bundle/i.test(t) ||
            Boolean((item as any).is_offer) ||
            Boolean((item as any).is_bundle)
          )
        })
        const matched = initialOffers.filter(o => o.store_id === activeStoreId || o.store_id === resolvedId)
        const uniqueKeys = new Set<string>()
        const allOffersList = [...matched, ...local, ...localResolved, ...invOffers]
        for (const o of allOffersList) {
          const normTitle = (o.title_ar || o.title || '').trim().toLowerCase()
          if (normTitle) uniqueKeys.add(normTitle)
          else if (o.id) uniqueKeys.add(o.id)
        }
        setOffersCount(uniqueKeys.size)
      }
    })
    getStoreOrders(activeStoreId).then(orders => {
      if (isMounted) {
        setOrdersCount(orders.length)
        setNewOrdersCount(orders.filter(o => o.status === 'NEW').length)
      }
    })
    return () => {
      isMounted = false
    }
  }, [activeStoreId, currentStore?.id, initialOffers])

  const eventsCount = currentStore ? initialEvents.filter(e => e.store_id === currentStore.id).length : 0

  if (!currentStore) {
    return (
      <MainLayout>
        <div className="container max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center text-4xl shadow-inner border border-primary/20">
            🏬
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-foreground">
              {lang === 'ar' ? 'لا توجد مكتبات مسجلة بعد' : 'No Stores Registered Yet'}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              {lang === 'ar'
                ? 'تم مسح كافة البيانات التجريبية للمكتبات بنجاح. يمكنك الآن تسجيل مكتبتك الحقيقية كشريك لإدارتها وإضافة كتب المخزون والعروض.'
                : 'All fake bookstore demo data has been purged. Register your real bookstore to manage inventory, bundle offers, and incoming orders.'}
            </p>
          </div>
          <div className="pt-2">
            <a href="/partner-form">
              <Button size="lg" className="rounded-2xl font-black text-sm gap-2 shadow-lg shadow-primary/20 cursor-pointer">
                <span>{lang === 'ar' ? 'تسجيل مكتبة جديدة كشريك ✍️' : 'Register a New Partner Store ✍️'}</span>
              </Button>
            </a>
          </div>
        </div>
      </MainLayout>
    )
  }


  return (
    <MainLayout>
      <div className="page-container py-8 max-w-7xl">
        {/* Modular Header */}
        <StoreDashboardHeader
          currentStore={currentStore}
          allStores={storesList}
          activeStoreId={activeStoreId}
          activeTab={activeTab}
          onStoreChange={setActiveStoreId}
          onTabChange={handleTabChange}
          inventoryCount={inventoryCount}
          offersCount={offersCount}
          ordersCount={ordersCount}
          newOrdersCount={newOrdersCount}
          eventsCount={eventsCount}
          lang={lang}
        />

        {/* Modular Tabs */}
        {activeTab === 'profile' && (
          <StoreProfileTab
            currentStore={currentStore}
            activeStoreId={activeStoreId}
            currentUserId={currentUserId}
            onStoreUpdated={handleStoreUpdated}
            lang={lang}
          />
        )}

        {activeTab === 'inventory' && (
          <StoreInventoryTab
            activeStoreId={activeStoreId}
            currentUserId={currentUserId}
            lang={lang}
          />
        )}

        {activeTab === 'offers' && (
          <StoreOffersTab
            initialOffers={initialOffers}
            activeStoreId={activeStoreId}
            currentStoreId={currentStore.id}
            lang={lang}
          />
        )}

        {activeTab === 'orders' && (
          <StoreOrdersTab
            activeStoreId={activeStoreId}
            lang={lang}
          />
        )}

        {activeTab === 'events' && (
          <StoreEventsTab
            initialEvents={initialEvents}
            activeStoreId={activeStoreId}
            currentStoreId={currentStore.id}
            currentStoreAddress={currentStore.address}
            lang={lang}
          />
        )}
      </div>
    </MainLayout>
  )
}
