'use client'

import React from 'react'
import {
  ShoppingBag,
  RotateCw,
  Package,
  Clock,
  CheckSquare,
  Truck,
  CheckCircle2,
  Sparkles,
  Search,
  Table,
  LayoutGrid,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useStoreOrders } from '../hooks/use-store-orders'
import { OrdersTable } from '../components/orders-table'
import { OrdersCards } from '../components/orders-cards'

interface StoreOrdersTabProps {
  activeStoreId: string
  lang: 'ar' | 'en'
}

export function StoreOrdersTab({ activeStoreId, lang }: StoreOrdersTabProps) {
  const {
    orders,
    isOrdersLoading,
    orderStatusFilter,
    setOrderStatusFilter,
    orderSearchQuery,
    setOrderSearchQuery,
    orderTypeFilter,
    setOrderTypeFilter,
    copiedCodeId,
    updatingOrderId,
    expandedOrderId,
    setExpandedOrderId,
    ordersViewMode,
    setOrdersViewMode,
    filteredOrders,
    handleUpdateOrderStatus,
    handleRefreshOrders,
    handleCopyCode,
  } = useStoreOrders({
    activeStoreId,
    lang,
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Refresh Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border/80 p-5 sm:p-6 rounded-3xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black text-foreground">
              {lang === 'ar' ? 'إدارة ومتابعة طلبات العملاء والشحن' : 'Order Management & Shipping Follow-up'}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            {lang === 'ar'
              ? 'تابع دورة حياة الطلبات خطوة بخطوة من استلام الطلب وتأكيد التجهيز، إلى خروج مندوب التوصيل واكتمال التسليم مع إمكانية مشاركة روابط التتبع المباشرة مع العملاء.'
              : 'Track order fulfillment lifecycle step-by-step: confirm packs, hand over to couriers, monitor delivery, and share real-time tracking links.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshOrders}
            disabled={isOrdersLoading}
            className="rounded-2xl font-black text-xs gap-1.5 cursor-pointer border-border hover:border-primary hover:text-primary transition-all shadow-2xs"
          >
            <RotateCw className={cn('h-3.5 w-3.5', isOrdersLoading && 'animate-spin')} />
            <span>{lang === 'ar' ? 'تحديث الطلبات' : 'Refresh Orders'}</span>
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            labelAr: 'إجمالي الطلبات',
            labelEn: 'Total Orders',
            count: orders.length,
            icon: Package,
            color: 'text-foreground',
            bg: 'bg-card border-border',
          },
          {
            labelAr: 'طلبات جديدة',
            labelEn: 'New Orders',
            count: orders.filter(o => o.status === 'NEW').length,
            icon: Clock,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-500/5 border-blue-500/20',
            pulse: orders.filter(o => o.status === 'NEW').length > 0,
          },
          {
            labelAr: 'قيد التجهيز',
            labelEn: 'In Packing',
            count: orders.filter(o => o.status === 'CONFIRMED').length,
            icon: CheckSquare,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500/5 border-amber-500/20',
          },
          {
            labelAr: 'جاري التوصيل',
            labelEn: 'Out for Delivery',
            count: orders.filter(o => o.status === 'DISPATCHED').length,
            icon: Truck,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-500/5 border-purple-500/20',
          },
          {
            labelAr: 'تم التسليم',
            labelEn: 'Delivered',
            count: orders.filter(o => o.status === 'DELIVERED').length,
            icon: CheckCircle2,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500/5 border-emerald-500/20',
          },
          {
            labelAr: 'إجمالي المبيعات',
            labelEn: 'Total Sales',
            count: `${orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + (Number(o.total_price) || 0), 0)} ج.م`,
            icon: Sparkles,
            color: 'text-primary',
            bg: 'bg-primary/5 border-primary/20',
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className={cn(
              'p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-2 relative overflow-hidden',
              kpi.bg
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground truncate">
                {lang === 'ar' ? kpi.labelAr : kpi.labelEn}
              </span>
              <kpi.icon className={cn('h-4 w-4 shrink-0', kpi.color)} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={cn('text-lg sm:text-xl font-black', kpi.color)}>
                {kpi.count}
              </span>
              {kpi.pulse && (
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping inline-block" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border/80 p-4 rounded-3xl shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground absolute start-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={orderSearchQuery}
              onChange={e => setOrderSearchQuery(e.target.value)}
              placeholder={
                lang === 'ar'
                  ? 'بحث باسم العميل، رقم الهاتف، المدينة، أو رقم الطلب...'
                  : 'Search by customer, phone, city, or order #...'
              }
              className="w-full bg-muted/40 border border-border rounded-2xl ps-10 pe-9 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
            />
            {orderSearchQuery && (
              <button
                type="button"
                onClick={() => setOrderSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-black cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode & Order Type Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted/60 p-1 rounded-2xl border border-border">
              <button
                type="button"
                onClick={() => setOrdersViewMode('table')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  ordersViewMode === 'table'
                    ? 'bg-card text-foreground shadow-2xs font-black'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={lang === 'ar' ? 'عرض جدول الصفوف' : 'Row Table View'}
              >
                <Table className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{lang === 'ar' ? 'جدول صفوف' : 'Table'}</span>
              </button>
              <button
                type="button"
                onClick={() => setOrdersViewMode('cards')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  ordersViewMode === 'cards'
                    ? 'bg-card text-foreground shadow-2xs font-black'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={lang === 'ar' ? 'عرض بطاقات' : 'Cards View'}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{lang === 'ar' ? 'بطاقات' : 'Cards'}</span>
              </button>
            </div>

            {/* Order Type Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                {lang === 'ar' ? 'نوع الطلب:' : 'Type:'}
              </span>
              <select
                value={orderTypeFilter}
                onChange={e => setOrderTypeFilter(e.target.value)}
                className="bg-muted/40 border border-border text-xs font-bold rounded-2xl px-3 py-2 text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="ALL">{lang === 'ar' ? 'كافة الأنواع (الكل)' : 'All Types'}</option>
                <option value="CURATED_PACK">{lang === 'ar' ? 'باكدج مجهز 🎁' : 'Curated Pack'}</option>
                <option value="BUNDLE_PACKAGE">{lang === 'ar' ? 'باقة توفير 📚' : 'Bundle Package'}</option>
                <option value="SINGLE_BOOK">{lang === 'ar' ? 'كتاب مفرد 📖' : 'Single Book'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-border/60">
          {[
            { key: 'ALL', labelAr: `الكل (${orders.length})`, labelEn: `All (${orders.length})` },
            { key: 'NEW', labelAr: `جديد (${orders.filter(o => o.status === 'NEW').length})`, labelEn: `New (${orders.filter(o => o.status === 'NEW').length})` },
            { key: 'CONFIRMED', labelAr: `مؤكد وجاري التجهيز (${orders.filter(o => o.status === 'CONFIRMED').length})`, labelEn: `Confirmed (${orders.filter(o => o.status === 'CONFIRMED').length})` },
            { key: 'DISPATCHED', labelAr: `خرج للتوصيل (${orders.filter(o => o.status === 'DISPATCHED').length})`, labelEn: `Dispatched (${orders.filter(o => o.status === 'DISPATCHED').length})` },
            { key: 'DELIVERED', labelAr: `تم التسليم (${orders.filter(o => o.status === 'DELIVERED').length})`, labelEn: `Delivered (${orders.filter(o => o.status === 'DELIVERED').length})` },
            { key: 'CANCELLED', labelAr: `ملغي (${orders.filter(o => o.status === 'CANCELLED').length})`, labelEn: `Cancelled (${orders.filter(o => o.status === 'CANCELLED').length})` },
          ].map(filterItem => (
            <button
              key={filterItem.key}
              type="button"
              onClick={() => setOrderStatusFilter(filterItem.key)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-2xs',
                orderStatusFilter === filterItem.key
                  ? 'bg-primary text-primary-foreground shadow-xs font-black'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {lang === 'ar' ? filterItem.labelAr : filterItem.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Display (Table or Cards) */}
      {filteredOrders.length > 0 ? (
        ordersViewMode === 'table' ? (
          <OrdersTable
            orders={filteredOrders}
            updatingOrderId={updatingOrderId}
            expandedOrderId={expandedOrderId}
            copiedCodeId={copiedCodeId}
            onUpdateStatus={handleUpdateOrderStatus}
            onToggleExpand={id => setExpandedOrderId(prev => (prev === id ? null : id))}
            onCopyCode={handleCopyCode}
            lang={lang}
          />
        ) : (
          <OrdersCards
            orders={filteredOrders}
            updatingOrderId={updatingOrderId}
            copiedCodeId={copiedCodeId}
            onUpdateStatus={handleUpdateOrderStatus}
            onCopyCode={handleCopyCode}
            lang={lang}
          />
        )
      ) : (
        <div className="bg-card border-2 border-dashed border-border/80 rounded-3xl p-12 text-center space-y-2">
          <p className="font-bold text-foreground text-sm">
            {lang === 'ar' ? 'لا توجد طلبات تطابق معايير البحث الحالية' : 'No orders found matching the filter'}
          </p>
          <p className="text-xs text-muted-foreground">
            {lang === 'ar' ? 'جرب تغيير حالة الطلب أو مسح نص البحث' : 'Try clearing your search query or changing filter tabs'}
          </p>
        </div>
      )}
    </div>
  )
}
