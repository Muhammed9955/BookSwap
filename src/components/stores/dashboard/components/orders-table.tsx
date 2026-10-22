'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Clock,
  CheckSquare,
  Truck,
  CheckCircle2,
  PhoneCall,
  ExternalLink,
  MessageCircle,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { StoreOrder } from '@/types/store'
import { formatRealDateTime } from '../types'

interface OrdersTableProps {
  orders: StoreOrder[]
  updatingOrderId: string | null
  expandedOrderId: string | null
  copiedCodeId: string | null
  onUpdateStatus: (orderId: string, status: StoreOrder['status']) => void
  onToggleExpand: (orderId: string) => void
  onCopyCode: (text: string, id: string) => void
  lang: 'ar' | 'en'
}

export function OrdersTable({
  orders,
  updatingOrderId,
  expandedOrderId,
  copiedCodeId,
  onUpdateStatus,
  onToggleExpand,
  onCopyCode,
  lang,
}: OrdersTableProps) {
  const getStatusBadge = (status: StoreOrder['status']) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>{lang === 'ar' ? 'طلب جديد 🆕' : 'New Order'}</span>
          </span>
        )
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
            <CheckSquare className="h-3 w-3" />
            <span>{lang === 'ar' ? 'مؤكد وقيد التجهيز 📦' : 'Packing'}</span>
          </span>
        )
      case 'DISPATCHED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 inline-flex items-center gap-1">
            <Truck className="h-3 w-3" />
            <span>{lang === 'ar' ? 'خرج مع المندوب 🚚' : 'Dispatched'}</span>
          </span>
        )
      case 'DELIVERED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>{lang === 'ar' ? 'تم التسليم بنجاح ✅' : 'Delivered'}</span>
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            {lang === 'ar' ? 'ملغي ❌' : 'Cancelled'}
          </span>
        )
    }
  }

  return (
    <div className="bg-card border-2 border-border/80 rounded-3xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-start border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground font-black">
              <th className="py-3 px-4 text-start">{lang === 'ar' ? 'رقم الطلب والتاريخ' : 'Order & Date'}</th>
              <th className="py-3 px-4 text-start">{lang === 'ar' ? 'العميل وبيانات التوصيل' : 'Customer & Delivery'}</th>
              <th className="py-3 px-4 text-start">{lang === 'ar' ? 'الكتب والباكدج' : 'Items & Books'}</th>
              <th className="py-3 px-4 text-center">{lang === 'ar' ? 'المبلغ المطلوب' : 'Total Amount'}</th>
              <th className="py-3 px-4 text-center">{lang === 'ar' ? 'حالة الطلب' : 'Status'}</th>
              <th className="py-3 px-4 text-end">{lang === 'ar' ? 'إجراءات ومتابعة' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {orders.map(order => {
              const isExpanded = expandedOrderId === order.id
              const isUpdatingThis = updatingOrderId === order.id
              const pipelineSteps: Array<StoreOrder['status']> = ['NEW', 'CONFIRMED', 'DISPATCHED', 'DELIVERED']
              const pipelineStepIndex = pipelineSteps.indexOf(order.status)

              return (
                <React.Fragment key={order.id}>
                  <tr className={cn(
                    'hover:bg-muted/30 transition-colors',
                    isExpanded && 'bg-muted/20'
                  )}>
                    {/* Col 1: Order Number, Type & Date */}
                    <td className="py-4 px-4 align-top">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/80">
                            {order.order_number || order.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => onCopyCode(order.order_number || order.id, order.id)}
                            className="text-muted-foreground hover:text-primary transition-colors p-1"
                            title="نسخ رقم الطلب"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          {copiedCodeId === order.id && (
                            <span className="text-[10px] text-emerald-600 font-bold animate-in fade-in">
                              تم النسخ ✓
                            </span>
                          )}
                        </div>

                        <div>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-lg text-[10px] font-bold inline-block',
                              order.order_type === 'CURATED_PACK'
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                : order.order_type === 'BUNDLE_PACKAGE'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            )}
                          >
                            {order.order_type === 'CURATED_PACK'
                              ? (lang === 'ar' ? 'باكدج مجهز 🎁' : 'Curated Pack')
                              : order.order_type === 'BUNDLE_PACKAGE'
                              ? (lang === 'ar' ? 'باقة توفير 📚' : 'Bundle Package')
                              : (lang === 'ar' ? 'كتاب مفرد 📖' : 'Single Book')}
                          </span>
                        </div>

                        <span
                          className="text-[10px] text-muted-foreground block font-mono"
                          title={new Date(order.created_at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                        >
                          {formatRealDateTime(order.created_at, lang)}
                        </span>
                      </div>
                    </td>

                    {/* Col 2: Customer & Delivery Contact */}
                    <td className="py-4 px-4 align-top max-w-[220px]">
                      <div className="space-y-1">
                        <p className="font-black text-foreground truncate">{order.customer_name}</p>
                        <div className="flex items-center gap-2">
                          <a
                            href={`tel:${order.customer_phone}`}
                            className="text-muted-foreground hover:text-primary transition-colors font-mono font-bold text-[11px] inline-flex items-center gap-1"
                            title="اتصال هاتفي مباشر"
                          >
                            <PhoneCall className="h-3 w-3 text-primary" />
                            <span>{order.customer_phone}</span>
                          </a>
                        </div>
                        <p
                          className="text-[11px] text-muted-foreground truncate leading-relaxed"
                          title={`${order.customer_city ? `${order.customer_city} — ` : ''}${order.customer_address}`}
                        >
                          📍 {order.customer_city ? `${order.customer_city} — ` : ''}{order.customer_address}
                        </p>
                      </div>
                    </td>

                    {/* Col 3: Ordered Books */}
                    <td className="py-4 px-4 align-top">
                      <div className="space-y-1.5 max-w-[260px]">
                        {order.pack_title && (
                          <p className="font-black text-xs text-primary line-clamp-1" title={order.pack_title}>
                            {order.pack_title}
                          </p>
                        )}
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.items.slice(0, 2).map((it, iIdx) => (
                              <div key={iIdx} className="flex items-center gap-2 text-[11px] text-foreground">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                <span className="font-bold truncate max-w-[190px]">
                                  {it.title_ar || it.book_title || it.title}
                                </span>
                                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                                  ×{it.quantity || 1}
                                </span>
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <span className="text-[10px] font-bold text-muted-foreground block">
                                + {order.items.length - 2} كتب إضافية
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px] font-semibold">
                            {order.pack_title || 'مجموعة كتب'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Col 4: Total Price */}
                    <td className="py-4 px-4 align-top text-center">
                      <div className="space-y-1">
                        <span className="font-black text-foreground text-sm block">
                          {order.total_price} ج.م
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                          دفع عند الاستلام
                        </span>
                      </div>
                    </td>

                    {/* Col 5: Order Status */}
                    <td className="py-4 px-4 align-top text-center">
                      {getStatusBadge(order.status)}
                    </td>

                    {/* Col 6: Quick Action & Expand Drawer */}
                    <td className="py-4 px-4 align-top text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status === 'NEW' && (
                          <Button
                            size="sm"
                            disabled={isUpdatingThis}
                            onClick={() => onUpdateStatus(order.id, 'CONFIRMED')}
                            className="h-8 px-2.5 rounded-xl font-bold text-[11px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs gap-1 cursor-pointer"
                            title="تأكيد الطلب وبدء التجهيز"
                          >
                            <CheckSquare className="h-3 w-3" />
                            <span>{lang === 'ar' ? 'تأكيد 📦' : 'Confirm'}</span>
                          </Button>
                        )}

                        {order.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            disabled={isUpdatingThis}
                            onClick={() => onUpdateStatus(order.id, 'DISPATCHED')}
                            className="h-8 px-2.5 rounded-xl font-bold text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs gap-1 cursor-pointer"
                            title="تسليم الشحنة لمندوب التوصيل"
                          >
                            <Truck className="h-3 w-3" />
                            <span>{lang === 'ar' ? 'للمندوب 🚚' : 'Dispatch'}</span>
                          </Button>
                        )}

                        {order.status === 'DISPATCHED' && (
                          <Button
                            size="sm"
                            disabled={isUpdatingThis}
                            onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
                            className="h-8 px-2.5 rounded-xl font-bold text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs gap-1 cursor-pointer"
                            title="تأكيد استلام العميل ودفع المبلغ"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{lang === 'ar' ? 'تم التسليم ✅' : 'Delivered'}</span>
                          </Button>
                        )}

                        {/* Expand / Collapse Button */}
                        <button
                          type="button"
                          onClick={() => onToggleExpand(order.id)}
                          className={cn(
                            'h-8 w-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer',
                            isExpanded
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                          )}
                          title={isExpanded ? 'طي التفاصيل' : 'عرض مسار التتبع وتفاصيل العميل'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable Drawer Underneath Row */}
                  {isExpanded && (
                    <tr className="bg-muted/15 border-b border-border animate-in fade-in duration-150">
                      <td colSpan={6} className="p-4 sm:p-5">
                        <div className="space-y-4 max-w-5xl">
                          {/* Order Received Date Header */}
                          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-muted-foreground pb-2 border-b border-border/60 gap-2">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              <span>{lang === 'ar' ? 'تاريخ ووقت استلام الطلب:' : 'Order Received:'}</span>
                              <span className="font-bold text-foreground">
                                {new Date(order.created_at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-muted-foreground">
                              {formatRealDateTime(order.created_at, lang)}
                            </span>
                          </div>

                          {/* Step-by-step pipeline */}
                          {order.status !== 'CANCELLED' ? (
                            <div className="bg-card p-3.5 rounded-2xl border border-border/80 space-y-2">
                              <div className="flex items-center justify-between text-[11px] font-black text-foreground">
                                <span>{lang === 'ar' ? 'مراحل ومسار تتبع الطلب خطوة بخطوة:' : 'Order Lifecycle Progress:'}</span>
                                <span className="font-mono text-muted-foreground">{pipelineStepIndex + 1} / 4</span>
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-center">
                                {[
                                  { status: 'NEW', titleAr: '1. استلام الطلب', titleEn: '1. Received' },
                                  { status: 'CONFIRMED', titleAr: '2. تأكيد وتغليف', titleEn: '2. Packing' },
                                  { status: 'DISPATCHED', titleAr: '3. مع مندوب الشحن', titleEn: '3. Out' },
                                  { status: 'DELIVERED', titleAr: '4. اكتمال التسليم', titleEn: '4. Done' },
                                ].map((step, sIdx) => {
                                  const isPast = sIdx < pipelineStepIndex
                                  const isCurrent = sIdx === pipelineStepIndex

                                  return (
                                    <button
                                      key={step.status}
                                      type="button"
                                      onClick={() => onUpdateStatus(order.id, step.status as StoreOrder['status'])}
                                      className={cn(
                                        'py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center gap-0.5',
                                        isCurrent && 'bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/30 scale-102',
                                        isPast && 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30',
                                        !isCurrent && !isPast && 'bg-muted/70 text-muted-foreground hover:bg-muted'
                                      )}
                                    >
                                      <span>{lang === 'ar' ? step.titleAr : step.titleEn}</span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-600 flex items-center gap-2">
                              <span>⚠️ تم إلغاء هذا الطلب من قبل الإدارة أو بناءً على رغبة العميل.</span>
                            </div>
                          )}

                          {/* Customer Details & Quick Contact */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left: Contact and Location */}
                            <div className="bg-card p-4 rounded-2xl border border-border/80 space-y-3">
                              <h4 className="font-black text-xs text-foreground flex items-center gap-1.5">
                                <span>👤 بيانات العميل والتوصيل التفصيلية:</span>
                              </h4>
                              <div className="space-y-1.5 text-xs">
                                <p className="font-bold text-foreground">
                                  الاسم: <span className="font-normal">{order.customer_name}</span>
                                </p>
                                <p className="font-bold text-foreground">
                                  الهاتف: <span className="font-mono font-normal text-primary">{order.customer_phone}</span>
                                </p>
                                <p className="font-bold text-foreground leading-relaxed">
                                  العنوان الكامل: <span className="font-normal text-muted-foreground">{order.customer_city ? `${order.customer_city} — ` : ''}{order.customer_address}</span>
                                </p>
                                {order.customer_notes && (
                                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                                    📝 ملاحظات العميل: {order.customer_notes}
                                  </div>
                                )}
                              </div>

                              {/* Quick Contact Buttons */}
                              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
                                <a
                                  href={`https://wa.me/2${order.customer_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                    `مرحباً ${order.customer_name}، نتواصل معك من مكتبتنا بخصوص طلبك رقم (${order.order_number || order.id}) على منصة ورق...`
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-2xs transition-colors cursor-pointer"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  <span>محادثة واتساب 💬</span>
                                </a>

                                <a
                                  href={`tel:${order.customer_phone}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs border border-border transition-colors cursor-pointer"
                                >
                                  <PhoneCall className="h-3.5 w-3.5 text-primary" />
                                  <span>اتصال هاتفي 📞</span>
                                </a>

                                <a
                                  href={`https://maps.google.com/?q=${encodeURIComponent(`${order.customer_city || ''} ${order.customer_address}`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs border border-border transition-colors cursor-pointer"
                                >
                                  <span>الخريطة 📍</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            </div>

                            {/* Right: Items Details & Customer Tracking Link */}
                            <div className="bg-card p-4 rounded-2xl border border-border/80 space-y-3">
                              <h4 className="font-black text-xs text-foreground flex items-center justify-between">
                                <span>📚 تفاصيل محتويات الطلب:</span>
                                <span className="font-mono text-primary font-bold">{order.total_price} ج.م</span>
                              </h4>

                              {order.items && order.items.length > 0 ? (
                                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/40 border border-border/60 text-xs">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="relative h-9 w-7 rounded overflow-hidden bg-muted shrink-0 border border-border/60">
                                          {item.cover_url ? (
                                            <Image src={item.cover_url} alt="" fill className="object-cover" />
                                          ) : (
                                            <div className="h-full w-full flex items-center justify-center text-[10px]">📖</div>
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-bold text-foreground text-xs truncate">
                                            {item.title_ar || item.book_title || item.title}
                                          </p>
                                          <p className="text-[10px] text-muted-foreground truncate">
                                            {item.author}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[11px] font-mono font-bold text-muted-foreground">
                                          ×{item.quantity || 1}
                                        </span>
                                        <span className="text-xs font-bold text-foreground">
                                          {item.price} ج.م
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  {order.pack_title || 'عرض باكدج مجهز'}
                                </p>
                              )}

                              {/* Customer Public Tracking URL Box */}
                              <div className="pt-2 border-t border-border/60 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                                  <span>رابط صفحة تتبع الطلب الخاصة بالعميل:</span>
                                  <Link
                                    href={`/orders/${order.order_number || order.id}`}
                                    target="_blank"
                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                  >
                                    <span>فتح الرابط</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </Link>
                                </div>
                                <div className="flex items-center gap-1.5 bg-muted/60 p-1.5 rounded-xl border border-border text-[11px] font-mono text-muted-foreground">
                                  <span className="truncate flex-1 px-1">
                                    waraq.app/orders/{order.order_number || order.id}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onCopyCode(`https://waraqconnect.vercel.app/orders/${order.order_number || order.id}`, `url-${order.id}`)}
                                    className="h-6 px-2 text-[10px] rounded-lg cursor-pointer"
                                  >
                                    {copiedCodeId === `url-${order.id}` ? 'تم النسخ ✓' : 'نسخ الرابط'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
