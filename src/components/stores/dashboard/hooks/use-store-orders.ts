'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import type { StoreOrder } from '@/types/store'
import { getStoreOrders, updateStoreOrderStatus } from '@/lib/stores/store-service'

interface UseStoreOrdersProps {
  activeStoreId: string
  lang: 'ar' | 'en'
}

export function useStoreOrders({ activeStoreId, lang }: UseStoreOrdersProps) {
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [isOrdersLoading, setIsOrdersLoading] = useState(true)
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL')
  const [orderSearchQuery, setOrderSearchQuery] = useState('')
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('ALL')
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [ordersViewMode, setOrdersViewMode] = useState<'table' | 'cards'>('table')

  // Auto-focus and expand order if navigated from a notification with ?orderId= or ?orderNumber=
  useEffect(() => {
    if (!searchParams) return
    const targetOrderId = searchParams.get('orderId')
    const targetOrderNumber = searchParams.get('orderNumber')
    if (targetOrderId) {
      setExpandedOrderId(targetOrderId)
    }
    if (targetOrderNumber) {
      setOrderSearchQuery(targetOrderNumber)
    }
  }, [searchParams])

  // Load orders for selected store
  useEffect(() => {
    let isMounted = true
    setIsOrdersLoading(true)
    getStoreOrders(activeStoreId).then(ordersList => {
      if (isMounted) {
        setOrders(ordersList)
        setIsOrdersLoading(false)

        // If navigated with orderId or orderNumber, ensure it's expanded once loaded
        if (searchParams) {
          const targetOrderId = searchParams.get('orderId')
          const targetOrderNumber = searchParams.get('orderNumber')
          if (targetOrderId) {
            setExpandedOrderId(targetOrderId)
          } else if (targetOrderNumber) {
            const found = ordersList.find(o => o.order_number === targetOrderNumber)
            if (found) setExpandedOrderId(found.id)
          }
        }
      }
    })
    return () => {
      isMounted = false
    }
  }, [activeStoreId, searchParams])

  // Handle Update Order Status with persistence & loading indicator
  const handleUpdateOrderStatus = async (orderId: string, status: StoreOrder['status']) => {
    setUpdatingOrderId(orderId)
    try {
      await updateStoreOrderStatus(activeStoreId, orderId, status)
      setOrders(prev =>
        prev.map(o => (o.id === orderId || o.order_number === orderId ? { ...o, status } : o))
      )
    } catch (err) {
      console.warn('Update order status error:', err)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // Handle Refresh Orders
  const handleRefreshOrders = async () => {
    setIsOrdersLoading(true)
    try {
      const ordersList = await getStoreOrders(activeStoreId)
      setOrders(ordersList)
    } catch (err) {
      console.warn('Refresh orders error:', err)
    } finally {
      setIsOrdersLoading(false)
    }
  }

  // Handle Copy Code with feedback
  const handleCopyCode = (text: string, id: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedCodeId(id)
    setTimeout(() => setCopiedCodeId(null), 2000)
  }

  // Filter and search computation
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Status Filter
      if (orderStatusFilter !== 'ALL' && order.status !== orderStatusFilter) {
        return false
      }

      // 2. Order Type Filter
      if (orderTypeFilter !== 'ALL' && order.order_type !== orderTypeFilter) {
        return false
      }

      // 3. Search Query
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.trim().toLowerCase()
        const matchesName = order.customer_name?.toLowerCase().includes(q)
        const matchesPhone = order.customer_phone?.toLowerCase().includes(q)
        const matchesCity = order.customer_city?.toLowerCase().includes(q)
        const matchesAddress = order.customer_address?.toLowerCase().includes(q)
        const matchesOrderNum = order.order_number?.toLowerCase().includes(q) || order.id?.toLowerCase().includes(q)
        const matchesBook = order.items?.some(it =>
          it.title?.toLowerCase().includes(q) || it.title_ar?.toLowerCase().includes(q) || it.author?.toLowerCase().includes(q)
        )
        const matchesPack = order.pack_title?.toLowerCase().includes(q)

        return (
          matchesName ||
          matchesPhone ||
          matchesCity ||
          matchesAddress ||
          matchesOrderNum ||
          matchesBook ||
          matchesPack
        )
      }

      return true
    })
  }, [orders, orderStatusFilter, orderTypeFilter, orderSearchQuery])

  return {
    orders,
    setOrders,
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
  }
}
