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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { StoreOrder } from '@/types/store'
import { formatRealDateTime } from '../types'

interface OrdersCardsProps {
  orders: StoreOrder[]
  updatingOrderId: string | null
  copiedCodeId: string | null
  onUpdateStatus: (orderId: string, status: StoreOrder['status']) => void
  onCopyCode: (text: string, id: string) => void
  lang: 'ar' | 'en'
}

export function OrdersCards({
  orders,
  updatingOrderId,
  copiedCodeId,
  onUpdateStatus,
  onCopyCode,
  lang,
}: OrdersCardsProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map(order => {
        const isUpdatingThis = updatingOrderId === order.id

        return (
          <div
            key={order.id}
            className="rounded-3xl border-2 border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all space-y-4"
          >
            {/* Top Bar: Order Number & Status */}
            <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-xs text-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border">
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
              <div>{getStatusBadge(order.status)}</div>
            </div>

            {/* Customer Contact & Address */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-foreground text-sm">{order.customer_name}</span>
                <span className="font-mono font-black text-primary text-base">
                  {order.total_price} ج.م
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${order.customer_phone}`}
                  className="text-muted-foreground hover:text-primary font-mono font-bold text-xs inline-flex items-center gap-1"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-primary" />
                  <span>{order.customer_phone}</span>
                </a>
                <a
                  href={`https://wa.me/2${order.customer_phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 p-1 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                  title="محادثة واتساب"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </a>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                📍 {order.customer_city ? `${order.customer_city} — ` : ''}{order.customer_address}
              </p>

              {/* Items Preview */}
              <div className="pt-2 border-t border-border/60 space-y-1.5">
                {order.pack_title && (
                  <p className="font-black text-xs text-primary line-clamp-1">{order.pack_title}</p>
                )}
                {order.items && order.items.length > 0 && (
                  <div className="space-y-1">
                    {order.items.slice(0, 3).map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span className="text-foreground truncate max-w-[200px]">
                          • {it.title_ar || it.book_title || it.title}
                        </span>
                        <span className="font-mono text-muted-foreground">×{it.quantity || 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-3 border-t border-border/80 space-y-2.5">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                <span title={new Date(order.created_at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}>
                  {formatRealDateTime(order.created_at, lang)}
                </span>

                {order.status === 'NEW' && (
                  <Button
                    size="sm"
                    disabled={isUpdatingThis}
                    onClick={() => onUpdateStatus(order.id, 'CONFIRMED')}
                    className="h-7 px-3 rounded-xl font-black text-[11px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs gap-1 cursor-pointer"
                  >
                    <CheckSquare className="h-3 w-3" />
                    <span>{lang === 'ar' ? 'تأكيد وتجهيز الطلب 📦' : 'Confirm & Pack'}</span>
                  </Button>
                )}
                {order.status === 'CONFIRMED' && (
                  <Button
                    size="sm"
                    disabled={isUpdatingThis}
                    onClick={() => onUpdateStatus(order.id, 'DISPATCHED')}
                    className="h-7 px-3 rounded-xl font-black text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs gap-1 cursor-pointer"
                  >
                    <Truck className="h-3 w-3" />
                    <span>{lang === 'ar' ? 'تسليم للمندوب 🚚' : 'Dispatch'}</span>
                  </Button>
                )}
                {order.status === 'DISPATCHED' && (
                  <Button
                    size="sm"
                    disabled={isUpdatingThis}
                    onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
                    className="h-7 px-3 rounded-xl font-black text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{lang === 'ar' ? 'تم التسليم بنجاح ✅' : 'Delivered'}</span>
                  </Button>
                )}
              </div>

              {/* Public Tracking Link */}
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <Link
                  href={`/orders/${order.order_number || order.id}`}
                  target="_blank"
                  className="text-primary hover:underline font-bold inline-flex items-center gap-1"
                >
                  <span>{lang === 'ar' ? 'رابط تتبع العميل' : 'Tracking Link'}</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${order.customer_city || ''} ${order.customer_address}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <span>{lang === 'ar' ? 'موقع العميل' : 'Map Pin'}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
