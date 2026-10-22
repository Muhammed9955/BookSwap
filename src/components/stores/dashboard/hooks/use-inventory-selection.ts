'use client'

import { useState } from 'react'
import type { StoreInventoryItem, BookCondition } from '@/types/store'
import {
  deleteStoreBooksBatch,
  deleteAllStoreBooks,
  updateStoreBooksBatch,
} from '@/lib/stores/store-service'

interface UseInventorySelectionProps {
  activeStoreId: string
  inventory: StoreInventoryItem[]
  setInventory: React.Dispatch<React.SetStateAction<StoreInventoryItem[]>>
  lang: 'ar' | 'en'
}

export function useInventorySelection({
  activeStoreId,
  inventory,
  setInventory,
  lang,
}: UseInventorySelectionProps) {
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([])
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)
  const [bulkEditForm, setBulkEditForm] = useState({
    price: '',
    original_price: '',
    stock_quantity: '',
    condition: '' as BookCondition | '',
    category_name: '',
  })

  const handleToggleSelectBook = (id: string) => {
    setSelectedBookIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAll = (visibleIds?: string[]) => {
    const targetIds = visibleIds || inventory.map(b => b.id)
    setSelectedBookIds(prev =>
      prev.length === targetIds.length && targetIds.length > 0 ? [] : [...targetIds]
    )
  }

  const handleClearSelection = () => {
    setSelectedBookIds([])
  }

  const handleDeleteSelected = async () => {
    if (selectedBookIds.length === 0) return
    const count = selectedBookIds.length
    const msg =
      lang === 'ar'
        ? `هل أنت متأكد من حذف الكتب المحددة (${count} كتاب) من مخزون المكتبة؟`
        : `Are you sure you want to delete ${count} selected books?`
    if (!confirm(msg)) return

    await deleteStoreBooksBatch(activeStoreId, selectedBookIds)
    setInventory(prev => prev.filter(b => !selectedBookIds.includes(b.id)))
    setSelectedBookIds([])
  }

  const handleDeleteAll = async () => {
    if (inventory.length === 0) return
    const total = inventory.length
    const msg =
      lang === 'ar'
        ? `⚠️ تحذير: هل أنت متأكد من حذف كامل المخزون (${total} كتاب) لفرع هذه المكتبة؟ لن يمكن التراجع عن هذا الإجراء.`
        : `⚠️ Warning: Are you sure you want to delete ALL ${total} books from this store?`
    if (!confirm(msg)) return

    await deleteAllStoreBooks(activeStoreId)
    setInventory([])
    setSelectedBookIds([])
  }

  const handleOpenBulkEdit = () => {
    if (selectedBookIds.length === 0) return
    setBulkEditForm({
      price: '',
      original_price: '',
      stock_quantity: '',
      condition: '',
      category_name: '',
    })
    setIsBulkEditModalOpen(true)
  }

  const handleApplyBulkEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedBookIds.length === 0) return

    const updates: Partial<StoreInventoryItem> = {}
    if (bulkEditForm.price !== '') updates.price = Math.max(0, Number(bulkEditForm.price))
    if (bulkEditForm.original_price !== '') updates.original_price = Math.max(0, Number(bulkEditForm.original_price))
    if (bulkEditForm.stock_quantity !== '') updates.stock_quantity = Math.max(0, Number(bulkEditForm.stock_quantity))
    if (bulkEditForm.condition !== '') updates.condition = bulkEditForm.condition as BookCondition
    if (bulkEditForm.category_name.trim() !== '') updates.category_name = bulkEditForm.category_name.trim()

    if (Object.keys(updates).length === 0) {
      setIsBulkEditModalOpen(false)
      return
    }

    await updateStoreBooksBatch(activeStoreId, selectedBookIds, updates)
    setInventory(prev =>
      prev.map(item => (selectedBookIds.includes(item.id) ? { ...item, ...updates } : item))
    )
    setIsBulkEditModalOpen(false)
    setSelectedBookIds([])
  }

  return {
    selectedBookIds,
    setSelectedBookIds,
    handleToggleSelectBook,
    handleToggleSelectAll,
    handleClearSelection,
    handleDeleteSelected,
    handleDeleteAll,
    isBulkEditModalOpen,
    setIsBulkEditModalOpen,
    bulkEditForm,
    setBulkEditForm,
    handleOpenBulkEdit,
    handleApplyBulkEdit,
  }
}
