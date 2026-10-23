'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Store,
  BookOpen,
  Flame,
  Calendar,
  ShoppingBag,
  Eye,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Bookstore } from '@/types/store'
import type { DashboardTab } from '../types'

interface StoreDashboardHeaderProps {
  currentStore: Bookstore
  allStores: Bookstore[]
  activeStoreId: string
  activeTab: DashboardTab
  onStoreChange: (storeId: string) => void
  onTabChange: (tab: DashboardTab) => void
  inventoryCount: number
  offersCount: number
  ordersCount: number
  newOrdersCount: number
  eventsCount: number
  lang: 'ar' | 'en'
}

export function StoreDashboardHeader({
  currentStore,
  allStores,
  activeStoreId,
  activeTab,
  onStoreChange,
  onTabChange,
  inventoryCount,
  offersCount,
  ordersCount,
  newOrdersCount,
  eventsCount,
  lang,
}: StoreDashboardHeaderProps) {
  const tabs = [
    {
      id: 'profile' as DashboardTab,
      labelAr: 'بيانات المكتبة والخريطة ومواعيد العمل 📍',
      labelEn: 'Store Profile, Map & Hours 📍',
      icon: Store,
    },
    {
      id: 'inventory' as DashboardTab,
      labelAr: `إدارة كتب المكتبة (${inventoryCount}) 📚`,
      labelEn: `Store Inventory (${inventoryCount}) 📚`,
      icon: BookOpen,
    },
    {
      id: 'offers' as DashboardTab,
      labelAr: `باقات وعروض الكتب (${offersCount}) 🔥`,
      labelEn: `Bundles & Offers (${offersCount}) 🔥`,
      icon: Flame,
    },
    {
      id: 'orders' as DashboardTab,
      labelAr: `الطلبات ومتابعة الشحن (${ordersCount}) 🛍️`,
      labelEn: `Orders & Fulfillment (${ordersCount}) 🛍️`,
      icon: ShoppingBag,
      hasBadge: newOrdersCount > 0,
      badgeText: `${newOrdersCount} جديد`,
    },
    {
      id: 'events' as DashboardTab,
      labelAr: `الفعاليات وحفلات التوقيع (${eventsCount}) 📅`,
      labelEn: `Events & Signings (${eventsCount}) 📅`,
      icon: Calendar,
    },
  ]

  return (
    <div className="space-y-6 mb-6">
      {/* Top Header Card */}
      <div className="rounded-3xl border-2 border-border/80 bg-gradient-to-r from-card via-background to-muted/40 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-md shrink-0 bg-muted">
            {currentStore.logo_url ? (
              <Image src={currentStore.logo_url} alt="" fill className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-3xl">🏬</div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {lang === 'ar' ? 'بوابة الشركاء والمكتبات' : 'Bookstore Partner Hub'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                {currentStore.store_type === 'BOTH'
                  ? (lang === 'ar' ? 'فروع + أونلاين' : 'Physical & Online')
                  : currentStore.store_type}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground mt-1">
              {lang === 'ar' && currentStore.name_ar ? currentStore.name_ar : currentStore.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === 'ar'
                ? 'إدارة بيانات المكتبة، الموقع على الخريطة، مواعيد العمل، المخزون، وحزم العروض والفعاليات.'
                : 'Manage store branding, GPS location, opening hours, book inventory, bundles, and signings.'}
            </p>
          </div>
        </div>

        {/* Action Header Buttons & Store Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Store Switcher */}
          <select
            value={activeStoreId}
            onChange={e => onStoreChange(e.target.value)}
            className="bg-card border-2 border-border text-xs font-bold rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary cursor-pointer"
          >
            {allStores.map(st => (
              <option key={st.id} value={st.id}>
                {lang === 'ar' && st.name_ar ? st.name_ar : st.name}
              </option>
            ))}
          </select>

          {/* Marketplace Link */}
          <Link href="/stores">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-bold text-xs gap-1.5 border-border hover:border-emerald-500 hover:text-emerald-600 cursor-pointer shadow-xs"
            >
              <Store className="h-4 w-4 text-emerald-600" />
              <span>{lang === 'ar' ? 'دليل المكتبات الشريكة' : 'Bookstore Directory'}</span>
            </Button>
          </Link>

          {/* Public Page Preview */}
          <Link href={`/stores/${currentStore.slug}`} target="_blank">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-bold text-xs gap-1.5 border-border hover:border-primary hover:text-primary cursor-pointer"
            >
              <Eye className="h-4 w-4" />
              <span>{lang === 'ar' ? 'معاينة الصفحة العامة' : 'Preview Public Store'}</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Dashboard Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/80 scrollbar-none">
        {tabs.map(tab => {
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shadow-xs relative',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-102'
                  : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/70'
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
              {tab.hasBadge && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  {tab.badgeText}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
