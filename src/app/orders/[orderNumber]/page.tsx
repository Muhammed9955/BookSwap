'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/i18n/language-context'
import { getStoreOrder } from '@/lib/stores/store-service'
import { cn } from '@/lib/utils'
import type { StoreOrder } from '@/types/store'

export default function OrderTrackingPage() {
  const params = useParams()
  const orderNumber = String(params?.orderNumber || '')
  const { lang, isRTL } = useLanguage()

  const [order, setOrder] = useState<StoreOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadOrder() {
      if (!orderNumber) return
      setLoading(true)
      try {
        const found = await getStoreOrder(orderNumber)
        setOrder(found)
      } catch (err) {
        console.warn('Error loading order tracking:', err)
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
  }, [orderNumber])

  const handleCopyOrderNumber = () => {
    if (!order) return
    const code = order.order_number || order.id
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isCancelled = order?.status === 'CANCELLED'

  // Determine active step based on order status (NEW, CONFIRMED, DISPATCHED, DELIVERED, CANCELLED)
  const currentStepIndex = (() => {
    if (!order || isCancelled) return 0
    switch (order.status) {
      case 'NEW':
        return 0
      case 'CONFIRMED':
        return 1
      case 'DISPATCHED':
        return 2
      case 'DELIVERED':
        return 3
      default:
        return 0
    }
  })()

  const refreshOrder = async () => {
    if (!orderNumber) return
    setLoading(true)
    try {
      const found = await getStoreOrder(orderNumber)
      setOrder(found)
    } finally {
      setLoading(false)
    }
  }


  const steps = [
    {
      titleAr: 'تم استلام الطلب',
      titleEn: 'Order Received',
      descAr: 'تم تسجيل طلبك بنجاح وإرساله للمكتبة',
      descEn: 'Order placed & sent to bookstore',
      icon: Clock,
    },
    {
      titleAr: 'قيد التجهيز والتغليف',
      titleEn: 'Preparing & Packing',
      descAr: 'المكتبة تقوم بجمع وتغليف الكتب وهدايا الباكدج',
      descEn: 'Bookstore is packing books & gifts',
      icon: Package,
    },
    {
      titleAr: 'خرج مع مندوب التوصيل',
      titleEn: 'Out for Delivery',
      descAr: 'شحنتك في الطريق إليك مع شركة الشحن',
      descEn: 'Courier is delivering your package',
      icon: Truck,
    },
    {
      titleAr: 'تم الاستلام بنجاح',
      titleEn: 'Delivered',
      descAr: 'نتمنى لك قراءة ممتعة وملهمة!',
      descEn: 'Happy reading!',
      icon: CheckCircle2,
    },
  ]

  return (
    <MainLayout>
      <div className="min-h-screen bg-muted/20 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Breadcrumb / Back button */}
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              {lang === 'ar' ? 'الرئيسية' : 'Home'}
            </Link>
            <ChevronRight className="h-3 w-3 rtl:rotate-180" />
            <Link href="/stores" className="hover:text-foreground">
              {lang === 'ar' ? 'المكتبات' : 'Bookstores'}
            </Link>
            <ChevronRight className="h-3 w-3 rtl:rotate-180" />
            <span className="text-foreground">{lang === 'ar' ? 'متابعة حالة الشحن' : 'Track Order'}</span>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-border bg-card p-12 text-center space-y-4 shadow-sm animate-pulse">
              <div className="h-8 w-48 bg-muted rounded-xl mx-auto" />
              <div className="h-4 w-64 bg-muted/70 rounded-lg mx-auto" />
              <div className="h-24 w-full bg-muted/40 rounded-2xl mt-6" />
            </div>
          ) : !order ? (
            <div className="rounded-3xl border border-border bg-card p-12 text-center space-y-4 shadow-sm">
              <div className="text-5xl">🔍</div>
              <h2 className="text-xl font-black text-foreground">
                {lang === 'ar' ? 'لم يتم العثور على الطلب' : 'Order Not Found'}
              </h2>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {lang === 'ar'
                  ? `لم نتمكن من العثور على طلب برقم (${orderNumber}). يرجى التأكد من كتابة الرقم بشكل صحيح أو التواصل مع المكتبة عبر واتساب.`
                  : `We could not find an order with code (${orderNumber}). Please verify the tracking code.`}
              </p>
              <Link href="/stores">
                <Button className="rounded-xl font-bold text-xs mt-2">
                  {lang === 'ar' ? 'تصفح المكتبات' : 'Browse Bookstores'}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Order Header Card */}
              <div className="rounded-3xl border-2 border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-4 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-black border',
                          order.status === 'DELIVERED' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                          order.status === 'DISPATCHED' && 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
                          order.status === 'CONFIRMED' && 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                          order.status === 'NEW' && 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                          order.status === 'CANCELLED' && 'bg-red-500/10 text-red-600 border-red-500/20'
                        )}
                      >
                        {order.status === 'DELIVERED'
                          ? lang === 'ar' ? 'تم التسليم بنجاح ✓' : 'Delivered'
                          : order.status === 'DISPATCHED'
                          ? lang === 'ar' ? 'قيد التوصيل مع المندوب 🚚' : 'Out for Delivery'
                          : order.status === 'CONFIRMED'
                          ? lang === 'ar' ? 'تم التأكيد وجاري التجهيز 📦' : 'Confirmed & Packing'
                          : order.status === 'CANCELLED'
                          ? lang === 'ar' ? 'تم إلغاء الطلب ✕' : 'Order Cancelled'
                          : lang === 'ar' ? 'طلب جديد قيد المراجعة ⏳' : 'Order Received'}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold">
                        {new Date(order.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-black text-foreground pt-1 flex flex-wrap items-center gap-2">
                      <span>{lang === 'ar' ? 'طلب رقم:' : 'Order Code:'}</span>
                      <span className="font-mono text-primary font-black">#{order.order_number || order.id}</span>
                    </h1>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshOrder}
                      className="rounded-xl font-bold text-xs gap-1.5 cursor-pointer shadow-2xs hover:border-primary"
                    >
                      <span>{lang === 'ar' ? 'تحديث الحالة 🔄' : 'Refresh 🔄'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyOrderNumber}
                      className="rounded-xl font-bold text-xs gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'نسخ كود الطلب' : 'Copy Code')}</span>
                    </Button>
                  </div>
                </div>

                {isCancelled && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border-2 border-red-500/30 text-red-700 dark:text-red-400 font-bold text-xs flex items-center gap-2 mt-4">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p>
                      {lang === 'ar'
                        ? 'تم إلغاء هذا الطلب من قبل المكتبة أو العميل. إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع المكتبة عبر واتساب مباشرة.'
                        : 'This order has been cancelled. Please contact the bookstore directly via WhatsApp if you need assistance.'}
                    </p>
                  </div>
                )}


                {/* Shipping Stepper */}
                <div className="pt-6 border-t border-border/80">
                  <h3 className="text-xs font-black text-foreground mb-6 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    <span>{lang === 'ar' ? 'مراحل تجهيز وشحن الطلب خطوة بخطوة:' : 'Shipping & Fulfillment Progress:'}</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                    {steps.map((step, idx) => {
                      const StepIcon = step.icon
                      const isCompleted = idx < currentStepIndex
                      const isCurrent = idx === currentStepIndex

                      return (
                        <div
                          key={idx}
                          className={`rounded-2xl border p-4 transition-all flex flex-col justify-between relative ${
                            isCurrent
                              ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/30'
                              : isCompleted
                              ? 'border-emerald-500/50 bg-emerald-500/5'
                              : 'border-border/60 bg-muted/20 opacity-70'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div
                                className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                                  isCurrent
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : isCompleted
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : <StepIcon className="h-4 w-4" />}
                              </div>
                              <span className="text-[10px] font-mono font-bold text-muted-foreground">
                                0{idx + 1}
                              </span>
                            </div>

                            <h4 className="text-xs font-black text-foreground">
                              {lang === 'ar' ? step.titleAr : step.titleEn}
                            </h4>

                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {lang === 'ar' ? step.descAr : step.descEn}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Order Items & Customer Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Items List (2 Cols) */}
                <div className="md:col-span-2 rounded-3xl border-2 border-border/80 bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                      <span>{lang === 'ar' ? `الكتب المتضمنة في هذا الطلب (${order.items.length})` : `Order Items (${order.items.length})`}</span>
                    </h3>
                    {order.bundle_title && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        {order.bundle_title}
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-border/60">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.cover_url ? (
                            <div className="relative h-14 w-11 rounded-lg overflow-hidden shrink-0 border border-border bg-muted">
                              <Image src={item.cover_url} alt="" fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="h-14 w-11 rounded-lg bg-muted flex items-center justify-center text-lg shrink-0 border border-border">
                              📖
                            </div>
                          )}

                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-foreground truncate">
                              {item.title_ar || item.title || item.book_title || 'كتاب'}
                            </h4>
                            {item.author && (
                              <p className="text-[11px] text-muted-foreground truncate">{item.author}</p>
                            )}
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              {lang === 'ar' ? `الكمية: ${item.quantity || 1}` : `Qty: ${item.quantity || 1}`}
                            </span>
                          </div>
                        </div>

                        <div className="text-end shrink-0">
                          <span className="text-xs font-black text-primary block">
                            {item.price} ج.م
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Total Summary */}
                  <div className="pt-4 border-t border-border/80 flex items-center justify-between bg-muted/20 -mx-6 -mb-6 p-6 rounded-b-3xl">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground block">
                        {lang === 'ar' ? 'المبلغ المطلوب للدفع عند الاستلام:' : 'Total Cash On Delivery:'}
                      </span>
                      <span className="text-2xl font-black text-primary">
                        {order.total_price} ج.م
                      </span>
                    </div>

                    <div className="text-end">
                      <span className="inline-block px-3 py-1 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-xs">
                        {lang === 'ar' ? 'الدفع نقداً عند الاستلام (COD)' : 'Cash on Delivery'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Information (1 Col) */}
                <div className="rounded-3xl border-2 border-border/80 bg-card p-6 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-foreground flex items-center gap-2 border-b border-border/80 pb-3">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      <span>{lang === 'ar' ? 'بيانات الشحن والاستلام' : 'Delivery Details'}</span>
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground block flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{lang === 'ar' ? 'اسم المستلم:' : 'Recipient:'}</span>
                        </span>
                        <p className="font-black text-foreground mt-0.5">{order.customer_name}</p>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground block flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{lang === 'ar' ? 'رقم الهاتف / الواتساب:' : 'Phone:'}</span>
                        </span>
                        <p className="font-mono font-bold text-foreground mt-0.5" dir="ltr">
                          {order.customer_phone}
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground block flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{lang === 'ar' ? 'المحافظة والعنوان:' : 'Address:'}</span>
                        </span>
                        <p className="font-bold text-foreground mt-0.5 leading-relaxed">
                          {order.customer_city} {order.customer_address ? `- ${order.customer_address}` : ''}
                        </p>
                      </div>

                      {order.customer_notes && (
                        <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                          <span className="text-[10px] font-bold text-muted-foreground block">
                            {lang === 'ar' ? 'ملاحظات العميل:' : 'Notes:'}
                          </span>
                          <p className="font-semibold text-foreground text-[11px] mt-0.5">
                            {order.customer_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/80 space-y-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `مرحباً، أتابع طلبي رقم #${order.order_number || order.id} عبر منصة WaraqConnect: https://waraqconnect.com/orders/${order.order_number || order.id}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <Button className="w-full rounded-xl font-black text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md shadow-emerald-600/20">
                        <MessageCircle className="h-4 w-4" />
                        <span>{lang === 'ar' ? 'تواصل مع المكتبة عبر واتساب' : 'Contact Bookstore via WhatsApp'}</span>
                      </Button>
                    </a>

                    <Link href="/stores" className="block">
                      <Button variant="ghost" className="w-full rounded-xl text-xs font-bold text-muted-foreground">
                        {lang === 'ar' ? 'تصفح مكتبات أخرى 📚' : 'Browse More Bookstores'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
