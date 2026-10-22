'use client'

import { useState, useEffect } from 'react'
import type { StoreOffer } from '@/types/store'
import {
  createStoreOffer,
  deleteStoreOffer,
  updateStoreOffer,
  deleteMultipleStoreOffers,
  getStoreInventory,
  deleteStoreBook,
  STORE_ID_ALIASES,
  getLocalStoreOffers,
} from '@/lib/stores/store-service'
import { compressImageFile } from '@/lib/image-utils'
import { uploadCommunityImage } from '@/lib/storage/upload-helper'


export function convertInventoryItemToOffer(item: any, storeId: string): StoreOffer {
  const countMatch = (item.title || item.title_ar || '').match(/(\d+)\s*كتب|(\d+)\s*روايات|ثنائية|ثلاثية|رباعية|خماسية/i)
  let bookCount = 3
  if (countMatch) {
    if (countMatch[1]) bookCount = Number(countMatch[1])
    else if (countMatch[2]) bookCount = Number(countMatch[2])
    else if (countMatch[0].includes('ثنائية')) bookCount = 2
    else if (countMatch[0].includes('ثلاثية')) bookCount = 3
    else if (countMatch[0].includes('رباعية')) bookCount = 4
    else if (countMatch[0].includes('خماسية')) bookCount = 5
  }

  const desc = item.description_ar || item.description || ''
  const booksList = desc
    .split(/[-–—•\n,،]+/)
    .map((s: string) => s.trim().replace(/^.*كتب:\s*/, ''))
    .filter((s: string) => s.length > 2 && !s.includes('هديه') && !s.includes('بوك مارك') && !s.includes('جنيه') && !s.includes('ج.م'))

  const giftDesc = (item.title && item.title.includes('بوك مارك'))
    ? '3 فواصل بوك مارك وأذكار هدية مجاناً 🎁'
    : 'فاصل قراءة خشبي محفور مجاناً 🔖'

  return {
    id: item.id || `inv-pack-${Date.now()}`,
    store_id: storeId,
    title: item.title,
    title_ar: item.title_ar || item.title,
    description: item.description || '',
    description_ar: item.description_ar || item.description || '',
    offer_type: 'CURATED_PACK',
    book_count: bookCount,
    genre: item.category || 'NOVELS',
    genre_ar: item.category_name_ar || 'روايات وأدب',
    original_price: item.original_price && Number(item.original_price) > Number(item.price)
      ? Number(item.original_price)
      : Math.round(Number(item.price) * 1.35),
    offer_price: Number(item.price),
    bundle_price: Number(item.price),
    discount_pct: item.discount_pct || 25,
    included_books: booksList.length > 0 ? booksList : [item.title],
    badge_text: item.badge && item.badge.length <= 25 ? item.badge : 'عرض توفير 🔥',
    gift_description: giftDesc,
    cover_image_url: item.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    is_featured: true,
    status: 'ACTIVE',
    created_at: item.created_at || new Date().toISOString(),
  }
}

interface UseStoreOffersProps {
  initialOffers: StoreOffer[]
  activeStoreId: string
  currentStoreId: string
  lang: 'ar' | 'en'
}

export function deduplicateOffers(offersList: StoreOffer[]): StoreOffer[] {
  const seenIds = new Set<string>()
  const seenTitles = new Set<string>()
  const result: StoreOffer[] = []

  for (const offer of offersList) {
    if (!offer) continue
    const id = offer.id
    const titleKey = (offer.title_ar || offer.title || '').trim().toLowerCase()

    if (id && seenIds.has(id)) continue
    if (titleKey && seenTitles.has(titleKey)) continue

    if (id) seenIds.add(id)
    if (titleKey) seenTitles.add(titleKey)
    result.push(offer)
  }

  return result
}

export function useStoreOffers({
  initialOffers,
  activeStoreId,
  currentStoreId,
  lang,
}: UseStoreOffersProps) {
  const storeId = currentStoreId || activeStoreId
  const resolvedStoreId = STORE_ID_ALIASES[storeId] || storeId

  const [offers, setOffers] = useState<StoreOffer[]>(() => {
    const matched = initialOffers.filter(o => o.store_id === storeId || o.store_id === resolvedStoreId)
    const local = typeof window !== 'undefined' ? getLocalStoreOffers(storeId) : []
    const localResolved = typeof window !== 'undefined' ? getLocalStoreOffers(resolvedStoreId) : []
    const combinedOffers = deduplicateOffers([...matched, ...local, ...localResolved])

    let invOffers: StoreOffer[] = []
    if (typeof window !== 'undefined') {
      try {
        const keysToTry = [
          `waraq_store_inventory_v1_${resolvedStoreId}`,
          `waraq_store_inventory_v1_${storeId}`,
          `waraq_store_inventory_${storeId}`,
          'store_inventory',
        ]
        const allItemsMap = new Map<string, any>()
        for (const k of keysToTry) {
          const stored = localStorage.getItem(k)
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as any[]
              if (Array.isArray(parsed)) {
                for (const item of parsed) {
                  if (item) {
                    const normTitle = (item.title_ar || item.title || '').trim().toLowerCase()
                    const mapKey = normTitle || item.id
                    if (mapKey) allItemsMap.set(mapKey, item)
                  }
                }
              }
            } catch {}
          }
        }

        invOffers = Array.from(allItemsMap.values())
          .filter(item => {
            const t = (item.title || '') + ' ' + (item.title_ar || '') + ' ' + (item.badge || '') + ' ' + (item.description || '')
            return (
              /عرض|باكدج|حزمة|بوكس|توفير|ثنائية|ثلاثية|رباعية|خماسية|offer|bundle/i.test(t) ||
              Boolean(item.is_offer) ||
              Boolean(item.is_bundle)
            )
          })
          .map(item => convertInventoryItemToOffer(item, storeId))
      } catch {}
    }

    const existingTitles = new Set(combinedOffers.map(o => (o.title_ar || o.title || '').trim().toLowerCase()))
    const newInvOffers = invOffers.filter(
      o => !existingTitles.has((o.title_ar || o.title || '').trim().toLowerCase())
    )
    const merged = deduplicateOffers([...newInvOffers, ...combinedOffers])
    // Filter out any default starter-pack items
    return merged.filter(o => !o.id?.startsWith('starter-pack-') && !o.id?.startsWith('pack-starter'))
  })

  // Re-sync when switching stores or when initialOffers updates, including inventory offers
  useEffect(() => {
    let isMounted = true

    async function syncOffersWithInventory() {
      const activeId = currentStoreId || activeStoreId
      const resolvedId = STORE_ID_ALIASES[activeId] || activeId
      const matched = initialOffers.filter(o => o.store_id === activeId || o.store_id === resolvedId)
      const local = getLocalStoreOffers(activeId)
      const localResolved = getLocalStoreOffers(resolvedId)
      const combinedOffers = deduplicateOffers([...matched, ...local, ...localResolved])

      let invOffers: StoreOffer[] = []
      try {
        const [items1, items2] = await Promise.all([
          getStoreInventory(activeId),
          getStoreInventory(resolvedId),
        ])
        const allItemsMap = new Map<string, any>()
        for (const item of [...(items1 || []), ...(items2 || [])]) {
          if (item) {
            const normTitle = (item.title_ar || item.title || '').trim().toLowerCase()
            const mapKey = normTitle || item.id
            if (mapKey) allItemsMap.set(mapKey, item)
          }
        }

        // Also check raw localStorage keys
        const keysToTry = [
          `waraq_store_inventory_v1_${resolvedId}`,
          `waraq_store_inventory_v1_${activeId}`,
          `waraq_store_inventory_${activeId}`,
          'store_inventory',
        ]
        for (const k of keysToTry) {
          const stored = localStorage.getItem(k)
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as any[]
              if (Array.isArray(parsed)) {
                for (const item of parsed) {
                  if (item) {
                    const normTitle = (item.title_ar || item.title || '').trim().toLowerCase()
                    const mapKey = normTitle || item.id
                    if (mapKey) allItemsMap.set(mapKey, item)
                  }
                }
              }
            } catch {}
          }
        }

        invOffers = Array.from(allItemsMap.values())
          .filter(item => {
            const t = (item.title || '') + ' ' + ((item as any).title_ar || '') + ' ' + ((item as any).badge || '') + ' ' + ((item as any).description || '')
            return (
              /عرض|باكدج|حزمة|بوكس|توفير|ثنائية|ثلاثية|رباعية|خماسية|offer|bundle/i.test(t) ||
              Boolean((item as any).is_offer) ||
              Boolean((item as any).is_bundle)
            )
          })
          .map(item => convertInventoryItemToOffer(item, activeId))
      } catch (err) {
        console.error('Failed to sync inventory offers:', err)
      }

      if (!isMounted) return

      const existingTitles = new Set(combinedOffers.map(o => (o.title_ar || o.title || '').trim().toLowerCase()))

      const newInvOffers = invOffers.filter(
        o => !existingTitles.has((o.title_ar || o.title || '').trim().toLowerCase())
      )

      const merged = deduplicateOffers([...newInvOffers, ...combinedOffers])
      // Filter out any default starter-pack items
      setOffers(merged.filter(o => !o.id?.startsWith('starter-pack-') && !o.id?.startsWith('pack-starter')))
    }

    syncOffersWithInventory()

    return () => {
      isMounted = false
    }
  }, [currentStoreId, activeStoreId, initialOffers])
  const [isAddOfferModalOpen, setIsAddOfferModalOpen] = useState(false)
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false)
  const [isUploadingOfferCover, setIsUploadingOfferCover] = useState(false)

  // Multi-select for batch operations
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([])

  // Edit Offer Modal state
  const [editingOffer, setEditingOffer] = useState<StoreOffer | null>(null)
  const [isEditOfferModalOpen, setIsEditOfferModalOpen] = useState(false)

  const [newOffer, setNewOffer] = useState({
    offer_type: 'CURATED_PACK' as const,
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    book_count: 2,
    genre: 'NOVELS',
    genre_ar: 'روايات وأدب',
    included_books_text: '',
    badge_text: 'ثنائية التوفير 🔥',
    original_price: 340,
    offer_price: 210,
    bundle_buy_qty: 2,
    bundle_price: 210,
    discount_pct: 38,
    gift_description: 'فاصل قراءة خشبي محفور مجاناً 🔖',
    promo_code: '',
    cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  })

  // Cover Image Upload Handler (used for both Add and Edit modals)
  const handleOfferCoverFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isEditing = false
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingOfferCover(true)
    try {
      const compressed = await compressImageFile(file, { maxWidth: 1200, maxHeight: 800, quality: 0.85 })
      const uploadRes = await uploadCommunityImage(compressed.file, 'covers')
      const finalUrl = uploadRes.url || compressed.dataUrl

      if (isEditing) {
        setEditingOffer(prev => (prev ? { ...prev, cover_image_url: finalUrl } : null))
      } else {
        setNewOffer(prev => ({ ...prev, cover_image_url: finalUrl }))
      }
    } catch (err) {
      console.error('Failed to upload bundle cover:', err)
      const reader = new FileReader()
      reader.onload = ev => {
        if (ev.target?.result) {
          const dataUrl = ev.target.result as string
          if (isEditing) {
            setEditingOffer(prev => (prev ? { ...prev, cover_image_url: dataUrl } : null))
          } else {
            setNewOffer(prev => ({ ...prev, cover_image_url: dataUrl }))
          }
        }
      }
      reader.readAsDataURL(file)
    } finally {
      setIsUploadingOfferCover(false)
    }
  }

  // Handle Multi-Selection
  const handleToggleSelectOffer = (id: string) => {
    setSelectedOfferIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAll = (targetOffers?: StoreOffer[]) => {
    const list = targetOffers && targetOffers.length > 0 ? targetOffers : offers
    const allIds = list.map(o => o.id)
    const isAllSelected = allIds.length > 0 && allIds.every(id => selectedOfferIds.includes(id))
    if (isAllSelected) {
      setSelectedOfferIds(prev => prev.filter(id => !allIds.includes(id)))
    } else {
      setSelectedOfferIds(prev => Array.from(new Set([...prev, ...allIds])))
    }
  }

  const handleClearSelection = () => {
    setSelectedOfferIds([])
  }

  // Handle Bulk Delete
  const handleBulkDeleteOffers = async () => {
    if (selectedOfferIds.length === 0) return
    const msg =
      lang === 'ar'
        ? `هل أنت متأكد من حذف ${selectedOfferIds.length} من العروض المحددة نهائياً؟`
        : `Are you sure you want to delete ${selectedOfferIds.length} selected offers?`
    if (!confirm(msg)) return

    try {
      await deleteMultipleStoreOffers(selectedOfferIds)
    } catch {}

    const storeId = currentStoreId || activeStoreId
    // Also remove from store inventory if any of them originated from inventory
    for (const id of selectedOfferIds) {
      try {
        await deleteStoreBook(storeId, id)
      } catch {}
    }

    setOffers(prev => prev.filter(o => !selectedOfferIds.includes(o.id)))
    setSelectedOfferIds([])
  }

  // Handle Add Offer
  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOffer.title_ar && !newOffer.title) return

    let includedBooksList: string[] = []
    if (newOffer.included_books_text) {
      includedBooksList = newOffer.included_books_text
        .split(/[\n,،]+/)
        .map(s => s.trim())
        .filter(Boolean)
    }

    const calcDiscount =
      newOffer.original_price && newOffer.original_price > (newOffer.offer_price || 0)
        ? Math.round(((newOffer.original_price - newOffer.offer_price) / newOffer.original_price) * 100)
        : newOffer.discount_pct

    const created = await createStoreOffer({
      store_id: activeStoreId,
      title: newOffer.title || newOffer.title_ar,
      title_ar: newOffer.title_ar,
      description: newOffer.description,
      description_ar: newOffer.description_ar,
      offer_type: 'CURATED_PACK',
      book_count: Number(newOffer.book_count) || 2,
      genre: newOffer.genre,
      genre_ar: newOffer.genre_ar,
      included_books: includedBooksList,
      badge_text: newOffer.badge_text,
      original_price: Number(newOffer.original_price),
      offer_price: Number(newOffer.offer_price),
      bundle_price: Number(newOffer.offer_price),
      discount_pct: calcDiscount,
      gift_description: newOffer.gift_description,
      promo_code: newOffer.promo_code,
      cover_image_url: newOffer.cover_image_url,
      is_featured: true,
      status: 'ACTIVE',
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    setOffers(prev => [created, ...prev])
    setIsAddOfferModalOpen(false)
    setNewOffer({
      offer_type: 'CURATED_PACK',
      title: '',
      title_ar: '',
      description: '',
      description_ar: '',
      book_count: 2,
      genre: 'NOVELS',
      genre_ar: 'روايات وأدب',
      included_books_text: '',
      badge_text: 'ثنائية التوفير 🔥',
      original_price: 340,
      offer_price: 210,
      bundle_buy_qty: 2,
      bundle_price: 210,
      discount_pct: 38,
      gift_description: 'فاصل قراءة خشبي محفور مجاناً 🔖',
      promo_code: '',
      cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    })
  }

  // Handle Edit Offer
  const handleOpenEditOffer = (offer: StoreOffer) => {
    setEditingOffer({ ...offer })
    setIsEditOfferModalOpen(true)
  }

  const handleCloseEditOffer = () => {
    setEditingOffer(null)
    setIsEditOfferModalOpen(false)
  }

  const handleSaveEditOffer = async (updatedOffer: StoreOffer) => {
    await updateStoreOffer(updatedOffer.id, updatedOffer)
    setOffers(prev => prev.map(o => (o.id === updatedOffer.id ? { ...o, ...updatedOffer } : o)))
    setIsEditOfferModalOpen(false)
    setEditingOffer(null)
  }

  // Handle Delete Single Offer
  const handleDeleteOffer = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل تريد حذف هذا العرض؟' : 'Delete this offer?')) return
    await deleteStoreOffer(id)
    setOffers(prev => prev.filter(o => o.id !== id))
    setSelectedOfferIds(prev => prev.filter(x => x !== id))
  }

  return {
    offers,
    setOffers,
    isAddOfferModalOpen,
    setIsAddOfferModalOpen,
    isTemplatePickerOpen,
    setIsTemplatePickerOpen,
    newOffer,
    setNewOffer,
    handleAddOffer,
    handleDeleteOffer,
    // Multi-select for delete
    selectedOfferIds,
    handleToggleSelectOffer,
    handleToggleSelectAll,
    handleClearSelection,
    handleBulkDeleteOffers,
    // Edit Offer
    editingOffer,
    setEditingOffer,
    isEditOfferModalOpen,
    handleOpenEditOffer,
    handleCloseEditOffer,
    handleSaveEditOffer,
    // Cover upload
    isUploadingOfferCover,
    handleOfferCoverFileChange,
  }
}

