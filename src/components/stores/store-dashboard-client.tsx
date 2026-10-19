'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Store,
  MapPin,
  Clock,
  Share2,
  BookOpen,
  Flame,
  Calendar,
  PlusCircle,
  Trash2,
  Edit,
  ExternalLink,
  CheckCircle2,
  Save,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Layers,
  Tag,
  Gift,
  Eye,
  AlertCircle,
  Globe,
  UploadCloud,
  Loader2,
  Check,
  Building,
  ImageIcon,
  Search,
  ShoppingBag,
  Package,
  Phone,
  CheckCheck,
  Truck,
  FileText,
  ListPlus,
  Wand2,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { cn, formatPrice } from '@/lib/utils'
import type { Bookstore, StoreOffer, StoreEvent, StoreEventType, StoreInventoryItem, StoreType, BookCondition, StoreOrder } from '@/types/store'
import {
  DEMO_STORES,
  getStoreInventory,
  addStoreBook,
  addStoreBooksBatch,
  deleteStoreBook,
  updateBookstore,
  createStoreOffer,
  deleteStoreOffer,
  createStoreEvent,
  deleteStoreEvent,
  getStoreOrders,
  updateStoreOrderStatus,
} from '@/lib/stores/store-service'
import type { SearchBookResult } from '@/app/api/stores/books-search/route'
import { STORE_CATALOG_BOOKS, GENRE_CATEGORIES } from '@/lib/stores/store-catalog-data'
import { MapLocationPicker, type MapCoordinates } from '@/components/common/map-location-picker'
import { SquareImageUpload } from '@/components/stores/square-image-upload'
import { compressImageFile } from '@/lib/image-utils'
import { uploadCommunityImage } from '@/lib/storage/upload-helper'

interface StoreDashboardClientProps {
  initialStore: Bookstore
  allStores: Bookstore[]
  initialOffers: StoreOffer[]
  initialEvents: StoreEvent[]
  currentUserId?: string | null
}

type DashboardTab = 'profile' | 'inventory' | 'offers' | 'orders' | 'events'

export function StoreDashboardClient({
  initialStore,
  allStores,
  initialOffers,
  initialEvents,
  currentUserId,
}: StoreDashboardClientProps) {
  const { lang, isRTL } = useLanguage()
  const [activeTab, setActiveTab] = useState<DashboardTab>('profile')
  const [activeStoreId, setActiveStoreId] = useState<string>(initialStore.id)
  const currentStore = allStores.find(s => s.id === activeStoreId) || initialStore

  // Store Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: currentStore.name,
    name_ar: currentStore.name_ar || '',
    slug: currentStore.slug,
    description: currentStore.description || '',
    description_ar: currentStore.description_ar || '',
    store_type: currentStore.store_type,
    address: currentStore.address || '',
    latitude: currentStore.latitude || 30.0612,
    longitude: currentStore.longitude || 31.2185,
    website_url: currentStore.website_url || '',
    facebook: currentStore.social_links?.facebook || '',
    instagram: currentStore.social_links?.instagram || '',
    whatsapp: currentStore.social_links?.whatsapp || '',
    tiktok: currentStore.social_links?.tiktok || '',
    opening_weekdays: currentStore.opening_hours?.['السبت - الخميس'] || '10:00 ص - 12:00 منتصف الليل',
    opening_friday: currentStore.opening_hours?.['الجمعة'] || '1:00 م - 11:00 م',
    logo_url: currentStore.logo_url || '',
    cover_url: currentStore.cover_url || '',
  })

  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Logo & Cover Upload with Client-Side Compression
  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [isCompressingLogo, setIsCompressingLogo] = useState(false)
  const [logoStats, setLogoStats] = useState<{ origKb: number; compKb: number; savedPct: number } | null>(null)
  const [isCompressingCover, setIsCompressingCover] = useState(false)
  const [coverStats, setCoverStats] = useState<{ origKb: number; compKb: number; savedPct: number } | null>(null)

  // Hours-only Time Picker States (Default: 10:00 AM - 12:00 Midnight)
  const [weekdayOpenHour, setWeekdayOpenHour] = useState('10:00')
  const [weekdayCloseHour, setWeekdayCloseHour] = useState('00:00')
  const [fridayOpenHour, setFridayOpenHour] = useState('13:00')
  const [fridayCloseHour, setFridayCloseHour] = useState('23:00')
  const [fridayClosed, setFridayClosed] = useState(false)
  const [is24Hours, setIs24Hours] = useState(false)
  const [isManualHours, setIsManualHours] = useState(false)

  const formatHour12 = (timeStr: string, isAr: boolean): string => {
    if (!timeStr) return ''
    const [hStr, mStr] = timeStr.split(':')
    const h = parseInt(hStr, 10)
    const m = mStr || '00'
    if (h === 0 || h === 24) {
      return isAr ? (m === '00' ? '12:00 منتصف الليل' : `12:${m} ص`) : (m === '00' ? '12:00 Midnight' : `12:${m} AM`)
    }
    if (h === 12) {
      return isAr ? (m === '00' ? '12:00 ظهراً' : `12:${m} م`) : `12:${m} PM`
    }
    const period = h > 12 ? (isAr ? 'م' : 'PM') : (isAr ? 'ص' : 'AM')
    const h12 = h % 12
    const formattedH = h12 < 10 ? `0${h12}` : `${h12}`
    return `${formattedH}:${m} ${period}`
  }

  const syncHoursToProfile = (
    wOpen = weekdayOpenHour,
    wClose = weekdayCloseHour,
    fOpen = fridayOpenHour,
    fClose = fridayCloseHour,
    fClosed = fridayClosed,
    roundClock = is24Hours
  ) => {
    const isAr = lang === 'ar'
    if (roundClock) {
      setProfileForm(prev => ({
        ...prev,
        opening_weekdays: isAr ? 'على مدار الساعة 24/7 (أونلاين)' : '24/7 Round the Clock (Online)',
        opening_friday: isAr ? 'على مدار الساعة 24/7 (أونلاين)' : '24/7 Round the Clock (Online)',
      }))
      return
    }
    const wStr = `${formatHour12(wOpen, isAr)} - ${formatHour12(wClose, isAr)}`
    const fStr = fClosed
      ? (isAr ? 'عطلة مغلق' : 'Closed')
      : `${formatHour12(fOpen, isAr)} - ${formatHour12(fClose, isAr)}`

    setProfileForm(prev => ({
      ...prev,
      opening_weekdays: wStr,
      opening_friday: fStr,
    }))
  }

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsCompressingLogo(true)
    setLogoStats(null)
    try {
      const origSize = file.size
      const compressed = await compressImageFile(file, {
        maxWidth: 500,
        maxHeight: 500,
        quality: 0.85,
        format: 'image/webp',
      })
      const origKb = Math.round(origSize / 1024)
      const compKb = Math.round(compressed.sizeBytes / 1024)
      const savedPct = Math.max(0, Math.round((1 - compressed.sizeBytes / origSize) * 100))
      setLogoStats({ origKb, compKb, savedPct })

      const uploadRes = await uploadCommunityImage(compressed.file, 'logos', currentUserId || undefined)
      if (uploadRes.url) {
        setProfileForm(prev => ({ ...prev, logo_url: uploadRes.url }))
      } else if (compressed.dataUrl) {
        setProfileForm(prev => ({ ...prev, logo_url: compressed.dataUrl }))
      }
    } catch (err) {
      console.error('Logo upload error:', err)
      alert(lang === 'ar' ? 'فشل معالجة وضغط الشعار' : 'Failed to compress logo')
    } finally {
      setIsCompressingLogo(false)
    }
  }

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsCompressingCover(true)
    setCoverStats(null)
    try {
      const origSize = file.size
      const compressed = await compressImageFile(file, {
        maxWidth: 1400,
        maxHeight: 700,
        quality: 0.82,
        format: 'image/webp',
      })
      const origKb = Math.round(origSize / 1024)
      const compKb = Math.round(compressed.sizeBytes / 1024)
      const savedPct = Math.max(0, Math.round((1 - compressed.sizeBytes / origSize) * 100))
      setCoverStats({ origKb, compKb, savedPct })

      const uploadRes = await uploadCommunityImage(compressed.file, 'covers', currentUserId || undefined)
      if (uploadRes.url) {
        setProfileForm(prev => ({ ...prev, cover_url: uploadRes.url }))
      } else if (compressed.dataUrl) {
        setProfileForm(prev => ({ ...prev, cover_url: compressed.dataUrl }))
      }
    } catch (err) {
      console.error('Cover upload error:', err)
      alert(lang === 'ar' ? 'فشل معالجة وضغط صورة الغلاف' : 'Failed to compress cover')
    } finally {
      setIsCompressingCover(false)
    }
  }

  // Handle Store Profile Save
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    const isOnline = profileForm.store_type === 'ONLINE'
    try {
      await updateBookstore(activeStoreId, {
        name: profileForm.name,
        name_ar: profileForm.name_ar,
        slug: profileForm.slug,
        description: profileForm.description,
        description_ar: profileForm.description_ar,
        store_type: profileForm.store_type,
        address: isOnline ? (profileForm.address || 'متجر إلكتروني أونلاين') : profileForm.address,
        latitude: isOnline ? undefined : profileForm.latitude,
        longitude: isOnline ? undefined : profileForm.longitude,
        website_url: profileForm.website_url,
        social_links: {
          facebook: profileForm.facebook,
          instagram: profileForm.instagram,
          whatsapp: profileForm.whatsapp,
          tiktok: profileForm.tiktok,
        },
        opening_hours: {
          'السبت - الخميس': profileForm.opening_weekdays,
          'الجمعة': profileForm.opening_friday,
        },
        logo_url: profileForm.logo_url,
        cover_url: profileForm.cover_url,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // Inventory State & 1-Click Catalog Search
  const [inventory, setInventory] = useState<StoreInventoryItem[]>([])
  const [isInventoryLoading, setIsInventoryLoading] = useState(true)
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false)
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('')
  const [newBook, setNewBook] = useState({
    title: '',
    title_ar: '',
    author: '',
    isbn: '',
    category_name: 'روايات وأدب',
    condition: 'NEW' as BookCondition,
    price: 150,
    original_price: 200,
    stock_quantity: 10,
    cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  })

  // Catalog quick search results from platform's 130+ bestselling books
  const catalogSearchResults = useMemo(() => {
    const q = catalogSearchQuery.trim().toLowerCase()
    if (!q) return STORE_CATALOG_BOOKS.slice(0, 8)
    return STORE_CATALOG_BOOKS.filter(b =>
      b.title.toLowerCase().includes(q) ||
      (b.title_ar && b.title_ar.toLowerCase().includes(q)) ||
      b.author.toLowerCase().includes(q) ||
      (b.author_ar && b.author_ar.toLowerCase().includes(q))
    ).slice(0, 10)
  }, [catalogSearchQuery])

  const handleSelectCatalogBook = (catBook: (typeof STORE_CATALOG_BOOKS)[0]) => {
    setNewBook({
      title: catBook.title,
      title_ar: catBook.title_ar || catBook.title,
      author: catBook.author_ar || catBook.author,
      isbn: `97897709${Date.now().toString().slice(-4)}`,
      category_name: catBook.category_name_ar || 'أدب وروايات',
      condition: 'NEW',
      price: catBook.price,
      original_price: catBook.original_price || (catBook.price + 45),
      stock_quantity: 10,
      cover_url: catBook.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    })
    setIsAddBookModalOpen(true)
  }

  // Online Live Book Search State for Add Book Modal
  const [onlineBookSearchQuery, setOnlineBookSearchQuery] = useState('')
  const [isOnlineSearching, setIsOnlineSearching] = useState(false)
  const [onlineSearchResults, setOnlineSearchResults] = useState<SearchBookResult[]>([])

  const handleSearchOnlineBooks = async (query: string) => {
    setOnlineBookSearchQuery(query)
    if (!query.trim() || query.trim().length < 2) {
      setOnlineSearchResults([])
      return
    }
    setIsOnlineSearching(true)
    try {
      const res = await fetch(`/api/stores/books-search?q=${encodeURIComponent(query.trim())}`)
      if (res.ok) {
        const data = await res.json()
        setOnlineSearchResults(data.books || [])
      }
    } catch (err) {
      console.error('Online book search error:', err)
    } finally {
      setIsOnlineSearching(false)
    }
  }

  const handleSelectOnlineSearchResult = (book: SearchBookResult) => {
    setNewBook({
      title: book.title,
      title_ar: book.title_ar || book.title,
      author: book.author_ar || book.author,
      isbn: book.isbn || `97897709${Date.now().toString().slice(-4)}`,
      category_name: book.category_name || 'روايات وأدب',
      condition: 'NEW',
      price: book.suggested_price || 40,
      original_price: (book.suggested_price || 40) + 35,
      stock_quantity: 50,
      cover_url: book.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    })
    setOnlineSearchResults([])
    setOnlineBookSearchQuery('')
  }

  // Bulk Book Paste Import State
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false)
  const [bulkBooksText, setBulkBooksText] = useState('')
  const [bulkDefaultPrice, setBulkDefaultPrice] = useState<number>(40)
  const [bulkDefaultQty, setBulkDefaultQty] = useState<number>(50)
  const [bulkDefaultCondition, setBulkDefaultCondition] = useState<BookCondition>('NEW')
  const [isBulkImporting, setIsBulkImporting] = useState(false)

  // Sample list from user's exact scenario
  const SAMPLE_BULK_LIST = `الغيهب
نادر فودة ال2
الطريق الي الله
فاتتني صلاة
مر مثل القهوة حلو مثل الشيكولاتة
عقل بلا جسد
الدحيح
مدرسة ميلر
حارة الجزار
كن اقوي من مشاعرك
اسرار سورة البقرة
سر الغرفة 207
فكر كان طبيب نفسي
قوة الان`

  // Parse lines into structured book items and auto-match against catalog
  const parsedBulkBooks = useMemo(() => {
    if (!bulkBooksText.trim()) return []
    const lines = bulkBooksText
      .split('\n')
      .map(l => l.replace(/^[\d\s.\-•*()،,]+/, '').trim())
      .filter(l => l.length > 1)

    return lines.map((title, idx) => {
      // Find match in STORE_CATALOG_BOOKS
      const cleanTitle = title.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي')
      const matched = STORE_CATALOG_BOOKS.find(b => {
        const bTitle = (b.title_ar || b.title).toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي')
        return bTitle.includes(cleanTitle) || cleanTitle.includes(bTitle)
      })

      return {
        id: `bulk-row-${idx}`,
        title,
        title_ar: title,
        author: matched?.author_ar || matched?.author || 'مؤلف معتمد',
        author_ar: matched?.author_ar || matched?.author || 'مؤلف معتمد',
        category_name: matched?.category_name_ar || 'أدب وروايات',
        condition: bulkDefaultCondition,
        price: bulkDefaultPrice,
        original_price: bulkDefaultPrice + 35,
        stock_quantity: bulkDefaultQty,
        cover_url: matched?.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        matched: !!matched,
      }
    })
  }, [bulkBooksText, bulkDefaultPrice, bulkDefaultQty, bulkDefaultCondition])

  // Execute Bulk Import
  const handleExecuteBulkImport = async () => {
    if (parsedBulkBooks.length === 0) return
    setIsBulkImporting(true)
    try {
      const itemsToAdd = parsedBulkBooks.map(b => ({
        store_id: activeStoreId,
        title: b.title,
        title_ar: b.title_ar,
        author: b.author,
        isbn: `97897709${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 1000)}`,
        category_name: b.category_name,
        condition: b.condition,
        price: Number(b.price),
        original_price: Number(b.original_price),
        stock_quantity: Number(b.stock_quantity),
        cover_url: b.cover_url,
        is_active: true,
      }))

      const created = await addStoreBooksBatch(itemsToAdd)
      setInventory(prev => [...created, ...prev])
      setIsBulkAddModalOpen(false)
      setBulkBooksText('')
      alert(
        lang === 'ar'
          ? `تم بنجاح استيراد وإضافة ${created.length} كتاب إلى مخزون المكتبة!`
          : `Successfully imported ${created.length} books to inventory!`
      )
    } catch (err) {
      console.error('Bulk import error:', err)
    } finally {
      setIsBulkImporting(false)
    }
  }

  // Orders State
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [isOrdersLoading, setIsOrdersLoading] = useState(true)
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL')

  // Offers State (Supports Curated 2 or 3 Books Pack & Bulk Bundles)
  const [offers, setOffers] = useState<StoreOffer[]>(
    initialOffers.filter(o => o.store_id === currentStore.id)
  )
  const [isAddOfferModalOpen, setIsAddOfferModalOpen] = useState(false)
  const [newOffer, setNewOffer] = useState({
    offer_type: 'CURATED_PACK' as 'CURATED_PACK' | 'BUNDLE',
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
    bundle_buy_qty: 20,
    bundle_price: 550,
    discount_pct: 35,
    gift_description: 'فاصل قراءة خشبي محفور مجاناً 🔖',
    promo_code: '',
    cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  })

  // Events State
  const [events, setEvents] = useState<StoreEvent[]>(
    initialEvents.filter(e => e.store_id === currentStore.id)
  )
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    event_type: 'SIGNING' as StoreEventType,
    starts_at: '2026-11-01T18:00',
    location: currentStore.address || 'فرع المكتبة الرئيسي',
    is_free: true,
    price: 50,
    host_name: '',
    host_phone: '',
    host_role: 'الكاتب والروائي الضيف',
    max_attendees: 50,
    cover_image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
  })

  // Load Inventory & Orders for selected store
  useEffect(() => {
    let isMounted = true
    setIsInventoryLoading(true)
    getStoreInventory(activeStoreId).then(items => {
      if (isMounted) {
        setInventory(items)
        setIsInventoryLoading(false)
      }
    })

    setIsOrdersLoading(true)
    getStoreOrders(activeStoreId).then(ordersList => {
      if (isMounted) {
        setOrders(ordersList)
        setIsOrdersLoading(false)
      }
    })

    return () => {
      isMounted = false
    }
  }, [activeStoreId])

  // Handle Add Book
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBook.title) return
    const created = await addStoreBook({
      store_id: activeStoreId,
      title: newBook.title,
      title_ar: newBook.title_ar || newBook.title,
      author: newBook.author,
      isbn: newBook.isbn,
      category_name: newBook.category_name,
      condition: newBook.condition,
      price: Number(newBook.price),
      original_price: Number(newBook.original_price),
      stock_quantity: Number(newBook.stock_quantity),
      cover_url: newBook.cover_url,
      is_active: true,
    })
    setInventory(prev => [created, ...prev])
    setIsAddBookModalOpen(false)
    setNewBook({
      title: '',
      title_ar: '',
      author: '',
      isbn: '',
      category_name: 'روايات وأدب',
      condition: 'NEW',
      price: 150,
      original_price: 200,
      stock_quantity: 10,
      cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    })
  }

  // Handle Delete Book
  const handleDeleteBook = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الكتاب من المخزون؟' : 'Are you sure you want to delete this book?')) return
    await deleteStoreBook(activeStoreId, id)
    setInventory(prev => prev.filter(b => b.id !== id))
  }

  // Handle Add Offer (Supports Curated 2 or 3 Books Pack)
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

    const calcDiscount = newOffer.original_price && newOffer.original_price > (newOffer.offer_price || 0)
      ? Math.round(((newOffer.original_price - newOffer.offer_price) / newOffer.original_price) * 100)
      : newOffer.discount_pct

    const created = await createStoreOffer({
      store_id: activeStoreId,
      title: newOffer.title || newOffer.title_ar,
      title_ar: newOffer.title_ar,
      description: newOffer.description,
      description_ar: newOffer.description_ar,
      offer_type: newOffer.offer_type,
      book_count: Number(newOffer.book_count),
      genre: newOffer.offer_type === 'CURATED_PACK' ? newOffer.genre : undefined,
      genre_ar: newOffer.offer_type === 'CURATED_PACK' ? newOffer.genre_ar : undefined,
      included_books: includedBooksList,
      badge_text: newOffer.badge_text,
      original_price: Number(newOffer.original_price),
      offer_price: Number(newOffer.offer_price),
      bundle_buy_qty: newOffer.offer_type === 'BUNDLE' ? Number(newOffer.bundle_buy_qty) : undefined,
      bundle_price: newOffer.offer_type === 'BUNDLE' ? Number(newOffer.bundle_price) : Number(newOffer.offer_price),
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
      bundle_buy_qty: 20,
      bundle_price: 550,
      discount_pct: 35,
      gift_description: 'فاصل قراءة خشبي محفور مجاناً 🔖',
      promo_code: '',
      cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    })
  }

  // Handle Delete Offer
  const handleDeleteOffer = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل تريد حذف هذا العرض؟' : 'Delete this offer?')) return
    await deleteStoreOffer(id)
    setOffers(prev => prev.filter(o => o.id !== id))
  }

  // Handle Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, status: StoreOrder['status']) => {
    await updateStoreOrderStatus(activeStoreId, orderId, status)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
  }

  // Handle Add Event
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvent.title_ar && !newEvent.title) return
    const created = await createStoreEvent({
      store_id: activeStoreId,
      title: newEvent.title || newEvent.title_ar,
      title_ar: newEvent.title_ar,
      description: newEvent.description,
      description_ar: newEvent.description_ar,
      event_type: newEvent.event_type || 'SIGNING',
      starts_at: new Date(newEvent.starts_at).toISOString(),
      location: newEvent.location,
      max_attendees: Number(newEvent.max_attendees),
      is_free: newEvent.is_free,
      price: newEvent.is_free ? undefined : Number(newEvent.price),
      host_name: newEvent.host_name || undefined,
      host_phone: newEvent.host_phone || undefined,
      host_role: newEvent.host_role || undefined,
      is_active: true,
      cover_image_url: newEvent.cover_image_url,
    })
    setEvents(prev => [created, ...prev])
    setIsAddEventModalOpen(false)
  }

  // Handle Delete Event
  const handleDeleteEvent = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل تريد إلغاء هذه الفعالية؟' : 'Delete this event?')) return
    await deleteStoreEvent(id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  return (
    <MainLayout>
      <div className="page-container py-8 max-w-7xl">
        {/* Top Header Card */}
        <div className="rounded-3xl border-2 border-border/80 bg-gradient-to-r from-card via-background to-muted/40 p-6 sm:p-8 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
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
                  {currentStore.store_type === 'BOTH' ? (lang === 'ar' ? 'فروع + أونلاين' : 'Physical & Online') : currentStore.store_type}
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
            {/* Store Switcher (if managing multiple branches) */}
            <select
              value={activeStoreId}
              onChange={e => {
                const newId = e.target.value
                setActiveStoreId(newId)
                const s = allStores.find(st => st.id === newId)
                if (s) {
                  setProfileForm({
                    name: s.name,
                    name_ar: s.name_ar || '',
                    slug: s.slug,
                    description: s.description || '',
                    description_ar: s.description_ar || '',
                    store_type: s.store_type,
                    address: s.address || '',
                    latitude: s.latitude || 30.0612,
                    longitude: s.longitude || 31.2185,
                    website_url: s.website_url || '',
                    facebook: s.social_links?.facebook || '',
                    instagram: s.social_links?.instagram || '',
                    whatsapp: s.social_links?.whatsapp || '',
                    tiktok: s.social_links?.tiktok || '',
                    opening_weekdays: s.opening_hours?.['السبت - الخميس'] || '9:00 ص - 11:00 م',
                    opening_friday: s.opening_hours?.['الجمعة'] || '1:00 م - 11:00 م',
                    logo_url: s.logo_url || '',
                    cover_url: s.cover_url || '',
                  })
                }
              }}
              className="bg-card border-2 border-border text-xs font-bold rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary cursor-pointer"
            >
              {allStores.map(st => (
                <option key={st.id} value={st.id}>
                  {lang === 'ar' && st.name_ar ? st.name_ar : st.name}
                </option>
              ))}
            </select>

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
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-border/80 scrollbar-none">
          {[
            {
              id: 'profile',
              labelAr: 'بيانات المكتبة والخريطة ومواعيد العمل 📍',
              labelEn: 'Store Profile, Map & Hours 📍',
              icon: Store,
            },
            {
              id: 'inventory',
              labelAr: `إدارة كتب المكتبة (${inventory.length}) 📚`,
              labelEn: `Store Inventory (${inventory.length}) 📚`,
              icon: BookOpen,
            },
            {
              id: 'offers',
              labelAr: `باقات وعروض الكتب (${offers.length}) 🔥`,
              labelEn: `Bundles & Offers (${offers.length}) 🔥`,
              icon: Flame,
            },
            {
              id: 'orders',
              labelAr: `الطلبات الواردة (${orders.length}) 🛍️`,
              labelEn: `Customer Orders (${orders.length}) 🛍️`,
              icon: ShoppingBag,
            },
            {
              id: 'events',
              labelAr: `الفعاليات وحفلات التوقيع (${events.length}) 📅`,
              labelEn: `Events & Signings (${events.length}) 📅`,
              icon: Calendar,
            },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              className={cn(
                'flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shadow-xs',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-102'
                  : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/70'
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
            </button>
          ))}
        </div>

        {/* ============================================================== */}
        {/* TAB 1: STORE PROFILE, MAP LOCATION & WORKING HOURS             */}
        {/* ============================================================== */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSave} className="space-y-8">
            {saveSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{lang === 'ar' ? 'تم حفظ وتحديث بيانات المكتبة بنجاح!' : 'Store profile updated successfully!'}</span>
              </div>
            )}

            {/* Basic Info */}
            <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-5">
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                <span>{lang === 'ar' ? 'البيانات الأساسية للمكتبة' : 'General Store Information'}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-foreground">
                    {lang === 'ar' ? 'اسم المكتبة (بالعربية)' : 'Bookstore Name (Arabic)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name_ar}
                    onChange={e => setProfileForm(prev => ({ ...prev, name_ar: e.target.value }))}
                    className="w-full bg-muted/40 border-2 border-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                    placeholder="مثال: مكتبة ديوان — فرع الزمالك"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-foreground">
                    {lang === 'ar' ? 'اسم المكتبة (بالإنجليزية)' : 'Bookstore Name (English)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-muted/40 border-2 border-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. Diwan Bookstore Zamalek"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-foreground">
                    {lang === 'ar' ? 'الرابط التعريفي المخصص (Slug)' : 'Unique Slug URL'} *
                  </label>
                  <div className="flex items-center bg-muted/40 border-2 border-border rounded-xl px-3 py-2 text-xs font-bold text-muted-foreground">
                    <span className="shrink-0 text-[11px] font-mono opacity-60 hidden sm:inline">waraqconnect.vercel.app/stores/</span>
                    <span className="shrink-0 text-[11px] font-mono opacity-60 sm:hidden">/stores/</span>
                    <input
                      type="text"
                      required
                      value={profileForm.slug}
                      onChange={e => setProfileForm(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full bg-transparent border-none text-xs font-bold text-foreground focus:outline-none ps-1"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-foreground">
                    {lang === 'ar' ? 'نوع المكتبة وتوفر الفروع' : 'Store Type'}
                  </label>
                  <select
                    value={profileForm.store_type}
                    onChange={e => setProfileForm(prev => ({ ...prev, store_type: e.target.value as StoreType }))}
                    className="w-full bg-muted/40 border-2 border-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="BOTH">{lang === 'ar' ? 'مكتبة فعلية ولديها متجر أونلاين (Both)' : 'Both Physical & Online'}</option>
                    <option value="OFFLINE">{lang === 'ar' ? 'فرع ومكتبة فعلية فقط (Offline)' : 'Physical Storefront Only'}</option>
                    <option value="ONLINE">{lang === 'ar' ? 'متجر إلكتروني وتوصيل فقط (Online)' : 'Online Boutique Only'}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-black text-foreground">
                  {lang === 'ar' ? 'نبذة عن المكتبة وتاريخها ورسالتها (بالعربية)' : 'About / Bio (Arabic)'}
                </label>
                <textarea
                  rows={3}
                  value={profileForm.description_ar}
                  onChange={e => setProfileForm(prev => ({ ...prev, description_ar: e.target.value }))}
                  className="w-full bg-muted/40 border-2 border-border rounded-xl p-3 text-xs font-medium text-foreground focus:outline-none focus:border-primary leading-relaxed"
                  placeholder="اكتب نبذة عن تاريخ مكتبتكم، الأقسام المميزة، وما تقدمونه لمجتمع القراء..."
                />
              </div>

              {/* Square & Catchy Visual Identity Upload Section */}
              <div className="space-y-4 p-5 sm:p-6 rounded-3xl bg-muted/20 border-2 border-border/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div>
                    <span className="text-xs sm:text-sm font-black text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>{lang === 'ar' ? 'هوية المتجر البصرية (شعار وغلاف بنسبة 1:1 مربعة وجذابة)' : 'Store Visual Identity (Square 1:1 Logo & Cover)'}</span>
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {lang === 'ar' ? 'بطاقات مربعة عصرية بنسبة 1:1 تدعم السحب والإفلات وضغط الصور WebP تلقائياً' : 'Square catchy cards with drag & drop and auto WebP compression'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      ⚡ ضغط فوري WebP
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Square Logo Upload */}
                  <SquareImageUpload
                    label={lang === 'ar' ? 'شعار المتجر الرسمي' : 'Official Store Logo'}
                    subLabel={lang === 'ar' ? 'اسحب الشعار هنا أو اضغط للاختيار' : 'Drop store logo here or click to browse'}
                    value={profileForm.logo_url}
                    onChange={url => setProfileForm(prev => ({ ...prev, logo_url: url }))}
                    onRemove={() => setProfileForm(prev => ({ ...prev, logo_url: '' }))}
                    folder="logos"
                    userId={currentUserId}
                    theme="primary"
                    tagText={lang === 'ar' ? '✨ الشعار (1:1)' : '✨ Store Logo (1:1)'}
                    resolutionHint="Square 1:1 (400×400+)"
                    lang={lang}
                  />

                  {/* Square Cover Upload */}
                  <SquareImageUpload
                    label={lang === 'ar' ? 'غلاف واجهة المتجر' : 'Store Cover Banner'}
                    subLabel={lang === 'ar' ? 'اسحب صورة الغلاف هنا أو اضغط للاختيار' : 'Drop store cover here or click to browse'}
                    value={profileForm.cover_url}
                    onChange={url => setProfileForm(prev => ({ ...prev, cover_url: url }))}
                    onRemove={() => setProfileForm(prev => ({ ...prev, cover_url: '' }))}
                    folder="covers"
                    userId={currentUserId}
                    theme="emerald"
                    tagText={lang === 'ar' ? '🎨 الغلاف المربع (1:1)' : '🎨 Square Cover (1:1)'}
                    resolutionHint="Square 1:1 (800×800+)"
                    presets={[
                      '/images/cover-placeholder.svg',
                      'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=800&q=80',
                      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
                      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80',
                      'https://images.unsplash.com/photo-1526721940322-10fb6e3ae94a?auto=format&fit=crop&w=800&q=80',
                    ]}
                    lang={lang}
                  />
                </div>
              </div>
            </div>

            {/* Location & Map Section (Conditioned: waived for ONLINE stores) */}
            {profileForm.store_type === 'ONLINE' ? (
              <div className="rounded-3xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground flex items-center gap-2">
                      <span>{lang === 'ar' ? 'متجر إلكتروني أونلاين — بدون مقر فعلي للزيارات' : 'Online Store — No Physical Storefront'}</span>
                      <Badge className="bg-emerald-600 text-white text-[10px]">Online Only</Badge>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {lang === 'ar'
                        ? 'تم إعفاء متجرك تلقائياً من إدخال إحداثيات الخريطة أو عنوان الزيارات الفعلي. يتم إرسال طلبات الكتب وشحنها مباشرة إلى عناوين القراء.'
                        : 'Online boutiques are exempt from map coordinates and street addresses. Customer orders are fulfilled via courier shipping.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Building className="h-4 w-4 text-emerald-600" />
                    <span>{lang === 'ar' ? 'مركز التوزيع والشحن الرئيسي (المحافظة / المستودع)' : 'Shipping / Dispatch Hub'}</span>
                  </label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={e => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-background border-2 border-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                    placeholder={lang === 'ar' ? 'مثال: مستودع الشحن بالمعادي، القاهرة (مركز توزيع)' : 'e.g. Maadi Dispatch Center, Cairo'}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {lang === 'ar' ? 'المحافظة أو المنطقة التي تنطلق منها شحنات الكتب للقراء لتسهيل حساب مدة التوصيل.' : 'Region from which book deliveries originate.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      <span>{lang === 'ar' ? 'الموقع الفعلي على الخريطة' : 'Physical Address & Map GPS'}</span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lang === 'ar'
                        ? 'حدد موقع فرع المكتبة بدقة ليتمكن القراء من الوصول إليك ونقاط التبادل بسهولة.'
                        : 'Pinpoint your exact branch on the map for easy reader footfall and meetup pickups.'}
                    </p>
                  </div>

                  <a
                    href={`https://maps.google.com/?q=${profileForm.latitude},${profileForm.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <span>{lang === 'ar' ? 'فتح في خرائط Google' : 'Open in Google Maps'}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-foreground">
                      {lang === 'ar' ? 'العنوان التفصيلي' : 'Detailed Address'} *
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      {lang === 'ar' ? 'أدخل اسم الشارع والمعالم والحي' : 'Street name, landmark & district'}
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={profileForm.address}
                    onChange={e => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-muted/40 border-2 border-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                    placeholder="مثال: 159 شارع 26 يوليو، الزمالك، القاهرة"
                  />

                  {/* Common Districts Quick Chips */}
                  <div className="pt-1 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      <span>{lang === 'ar' ? 'إضافة حي بسرعة (القاهرة، الإسكندرية، الجيزة):' : 'Add district quickly (Cairo, Alex, Giza):'}</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {['المعادي', 'الزمالك', 'مدينة نصر', 'مصر الجديدة', 'التجمع الخامس', 'وسط البلد', 'الدقي', 'المهندسين', 'الشيخ زايد', '6 أكتوبر', 'حدائق الأهرام', 'سموحة', 'سيدي جابر', 'محطة الرمل', 'ميامي', 'رشدي'].map(dist => (
                        <button
                          key={dist}
                          type="button"
                          onClick={() => {
                            setProfileForm(prev => {
                              if (prev.address.includes(dist)) return prev
                              return {
                                ...prev,
                                address: prev.address ? `${prev.address}، ${dist}` : dist,
                              }
                            })
                          }}
                          className="px-2 py-0.5 rounded-md bg-muted/60 hover:bg-primary/10 hover:text-primary text-[10px] font-medium border border-border transition-colors cursor-pointer"
                        >
                          {dist}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Coordinates Preview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border text-xs">
                    <span className="text-[10px] font-bold text-muted-foreground block">Latitude:</span>
                    <span className="font-mono font-bold text-foreground">{profileForm.latitude}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border text-xs">
                    <span className="text-[10px] font-bold text-muted-foreground block">Longitude:</span>
                    <span className="font-mono font-bold text-foreground">{profileForm.longitude}</span>
                  </div>
                </div>

                {/* Interactive Map Picker */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{lang === 'ar' ? 'حرّك الدبوس على الخريطة لتحديث الإحداثيات تلقائياً:' : 'Drag the pin to update coordinates:'}</span>
                  </label>
                  <div className="rounded-2xl overflow-hidden border-2 border-border shadow-xs">
                    <MapLocationPicker
                      latitude={profileForm.latitude}
                      longitude={profileForm.longitude}
                      height="320px"
                      lang={lang}
                      showHubOption={false}
                      onLocationSelect={(coords: MapCoordinates) => {
                        setProfileForm(prev => ({
                          ...prev,
                          latitude: coords.lat,
                          longitude: coords.lng,
                          address: coords.address || prev.address,
                        }))
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Working Hours & Social Media Channels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Working Hours Card (HOURS ONLY TIME PICKER) */}
              <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{lang === 'ar' ? 'ساعات ومواعيد العمل (منتقي الساعات)' : 'Opening Hours (Time Picker)'}</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsManualHours(!isManualHours)}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    {isManualHours
                      ? (lang === 'ar' ? '↶ منتقي الساعات' : '↶ Time Picker')
                      : (lang === 'ar' ? '✍️ كتابة يدوية' : '✍️ Manual Text')}
                  </button>
                </div>

                {!isManualHours ? (
                  <div className="space-y-4">
                    {/* Quick 24/7 round-the-clock toggle */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-muted/30 border border-border">
                      <span className="text-xs font-bold text-foreground">
                        {lang === 'ar' ? 'استقبال الطلبات على مدار الساعة 24/7:' : '24/7 Round the Clock Service:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const next24 = !is24Hours
                          setIs24Hours(next24)
                          syncHoursToProfile(weekdayOpenHour, weekdayCloseHour, fridayOpenHour, fridayCloseHour, fridayClosed, next24)
                        }}
                        className={cn(
                          'px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer',
                          is24Hours
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-background text-muted-foreground border-border'
                        )}
                      >
                        {is24Hours ? (lang === 'ar' ? 'مفعل 24/7 ✓' : '24/7 Active ✓') : (lang === 'ar' ? 'تحديد ساعات محددة' : 'Specific Hours')}
                      </button>
                    </div>

                    {!is24Hours && (
                      <div className="space-y-3">
                        {/* Weekday Hours (Hours Only) */}
                        <div className="p-3 rounded-2xl bg-muted/20 border border-border space-y-2">
                          <label className="text-xs font-black text-foreground block">
                            {lang === 'ar' ? 'مواعيد العمل (السبت إلى الخميس):' : 'Weekdays (Saturday - Thursday):'}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground block">{lang === 'ar' ? 'ساعة الفتح:' : 'Open Time:'}</span>
                              <input
                                type="time"
                                value={weekdayOpenHour}
                                onChange={e => {
                                  setWeekdayOpenHour(e.target.value)
                                  syncHoursToProfile(e.target.value, weekdayCloseHour, fridayOpenHour, fridayCloseHour, fridayClosed, false)
                                }}
                                className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground block">{lang === 'ar' ? 'ساعة الإغلاق:' : 'Close Time:'}</span>
                              <input
                                type="time"
                                value={weekdayCloseHour}
                                onChange={e => {
                                  setWeekdayCloseHour(e.target.value)
                                  syncHoursToProfile(weekdayOpenHour, e.target.value, fridayOpenHour, fridayCloseHour, fridayClosed, false)
                                }}
                                className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Friday Hours */}
                        <div className="p-3 rounded-2xl bg-muted/20 border border-border space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-foreground block">
                              {lang === 'ar' ? 'مواعيد يوم الجمعة:' : 'Friday Operating Hours:'}
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const nextClosed = !fridayClosed
                                setFridayClosed(nextClosed)
                                syncHoursToProfile(weekdayOpenHour, weekdayCloseHour, fridayOpenHour, fridayCloseHour, nextClosed, false)
                              }}
                              className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer',
                                fridayClosed
                                  ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              )}
                            >
                              {fridayClosed ? (lang === 'ar' ? 'الجمعة عطلة مغلق' : 'Friday Closed') : (lang === 'ar' ? 'مفتوح الجمعة' : 'Friday Open')}
                            </button>
                          </div>

                          {!fridayClosed && (
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground block">{lang === 'ar' ? 'ساعة الفتح:' : 'Open Time:'}</span>
                                <input
                                  type="time"
                                  value={fridayOpenHour}
                                  onChange={e => {
                                    setFridayOpenHour(e.target.value)
                                    syncHoursToProfile(weekdayOpenHour, weekdayCloseHour, e.target.value, fridayCloseHour, false, false)
                                  }}
                                  className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground block">{lang === 'ar' ? 'ساعة الإغلاق:' : 'Close Time:'}</span>
                                <input
                                  type="time"
                                  value={fridayCloseHour}
                                  onChange={e => {
                                    setFridayCloseHour(e.target.value)
                                    syncHoursToProfile(weekdayOpenHour, weekdayCloseHour, fridayOpenHour, e.target.value, false, false)
                                  }}
                                  className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Live Badge Preview */}
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span>{lang === 'ar' ? 'الصيغة المعتمدة:' : 'Active Hours:'}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {lang === 'ar' ? 'السبت - الخميس:' : 'Sat-Thu:'} {profileForm.opening_weekdays} | {lang === 'ar' ? 'الجمعة:' : 'Fri:'} {profileForm.opening_friday}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">
                        {lang === 'ar' ? 'السبت إلى الخميس:' : 'Saturday - Thursday:'}
                      </label>
                      <input
                        type="text"
                        value={profileForm.opening_weekdays}
                        onChange={e => setProfileForm(prev => ({ ...prev, opening_weekdays: e.target.value }))}
                        className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        placeholder="9:00 ص - 11:00 م"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">
                        {lang === 'ar' ? 'يوم الجمعة:' : 'Friday:'}
                      </label>
                      <input
                        type="text"
                        value={profileForm.opening_friday}
                        onChange={e => setProfileForm(prev => ({ ...prev, opening_friday: e.target.value }))}
                        className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        placeholder="1:00 م - 11:00 م"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Social Channels Card */}
              <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-4">
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-primary" />
                  <span>{lang === 'ar' ? 'قنوات التواصل الاجتماعي' : 'Social Channels'}</span>
                </h2>

                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">Facebook URL:</label>
                    <input
                      type="url"
                      value={profileForm.facebook}
                      onChange={e => setProfileForm(prev => ({ ...prev, facebook: e.target.value }))}
                      className="w-full bg-muted/40 border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                      placeholder="https://facebook.com/..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">Instagram URL:</label>
                    <input
                      type="url"
                      value={profileForm.instagram}
                      onChange={e => setProfileForm(prev => ({ ...prev, instagram: e.target.value }))}
                      className="w-full bg-muted/40 border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                      placeholder="https://instagram.com/..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">WhatsApp Number:</label>
                    <input
                      type="text"
                      value={profileForm.whatsapp}
                      onChange={e => setProfileForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                      className="w-full bg-muted/40 border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                      placeholder="+201001234567"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">Website URL:</label>
                    <input
                      type="url"
                      value={profileForm.website_url}
                      onChange={e => setProfileForm(prev => ({ ...prev, website_url: e.target.value }))}
                      className="w-full bg-muted/40 border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Save Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
              <Button
                type="submit"
                disabled={isSaving}
                className="px-8 py-5 rounded-2xl font-black text-xs gap-2 shadow-lg shadow-primary/25 cursor-pointer hover:scale-105 active:scale-95 transition-all"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ كافة التغييرات' : 'Save Changes')}</span>
              </Button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* TAB 2: STORE INVENTORY & BOOKS MANAGEMENT                      */}
        {/* ============================================================== */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>{lang === 'ar' ? 'كتالوج ومخزون كتب المكتبة' : 'Store Catalog & Inventory'}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'ar'
                    ? 'أضف الكتب المتوفرة في فرعك، مع تحديد الأسعار والخصومات والكميات المتاحة.'
                    : 'List books available in your branch, set condition, prices, discounts, and live stock.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => setIsBulkAddModalOpen(true)}
                  variant="outline"
                  className="rounded-2xl font-black text-xs gap-2 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer shadow-xs"
                >
                  <ListPlus className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'استيراد قائمة كتب مجمعة (Bulk List) ⚡' : 'Bulk Books Import ⚡'}</span>
                </Button>

                <Button
                  onClick={() => setIsAddBookModalOpen(true)}
                  className="rounded-2xl font-black text-xs gap-2 shadow-md shadow-primary/25 cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'إضافة كتاب جديد للمكتبة' : 'Add New Book'}</span>
                </Button>
              </div>
            </div>

            {/* 1-Click Catalog Quick Search Banner */}
            <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>{lang === 'ar' ? 'إضافة سريعة من الكتالوج العام بضغطة زر' : '1-Click Quick Add from Platform Catalog'}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {lang === 'ar'
                      ? 'ابحث باسم الرواية أو الكاتب، وأضف تفاصيل الكتاب وصورته فوراً إلى مخزون فرعك دون كتابة يدوية.'
                      : 'Search popular books to populate cover, author, ISBN and prices in one click.'}
                  </p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={catalogSearchQuery}
                    onChange={e => setCatalogSearchQuery(e.target.value)}
                    placeholder={lang === 'ar' ? 'ابحث: الفيل الأزرق، نجيب محفوظ...' : 'Search books, authors...'}
                    className="w-full bg-card border border-border rounded-xl ps-9 pe-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary shadow-xs"
                  />
                  {catalogSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCatalogSearchQuery('')}
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Catalog Search Results Grid */}
              {catalogSearchQuery.trim() !== '' && (
                <div className="pt-2 border-t border-border/60">
                  <div className="text-[11px] font-bold text-muted-foreground mb-2">
                    {lang === 'ar' ? `نتائج البحث (${catalogSearchResults.length} كتاب):` : `Search Results (${catalogSearchResults.length} books):`}
                  </div>
                  {catalogSearchResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {catalogSearchResults.map((book: (typeof STORE_CATALOG_BOOKS)[number]) => (
                        <div
                          key={book.id}
                          className="flex items-center gap-3 p-2.5 rounded-2xl bg-card border border-border/80 hover:border-primary/50 transition-all shadow-xs group"
                        >
                          <div className="relative h-14 w-10 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/60">
                            {book.cover_url ? (
                              <Image src={book.cover_url} alt="" fill className="object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs">📖</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-foreground line-clamp-1">
                              {lang === 'ar' && book.title_ar ? book.title_ar : book.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {lang === 'ar' && book.author_ar ? book.author_ar : book.author}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-black text-primary">{book.price} ج.م</span>
                              {book.original_price && (
                                <span className="text-[10px] text-muted-foreground line-through">
                                  {book.original_price} ج.م
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            type="button"
                            onClick={() => handleSelectCatalogBook(book)}
                            className="rounded-xl text-[11px] font-black h-8 px-2.5 shrink-0 gap-1 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 cursor-pointer"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span>{lang === 'ar' ? 'أضف' : 'Add'}</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      {lang === 'ar' ? 'لم يتم العثور على كتب مطابقة في الكتالوج العام. يمكنك استخدام زر "إضافة كتاب جديد" لإدخاله يدوياً.' : 'No matching books found. Use "Add New Book" to enter manually.'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Inventory Table */}
            <div className="rounded-3xl border-2 border-border/80 bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-start border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-black">
                      <th className="p-4 text-start">{lang === 'ar' ? 'الكتاب' : 'Book'}</th>
                      <th className="p-4 text-start">{lang === 'ar' ? 'المؤلف والتصنيف' : 'Author & Category'}</th>
                      <th className="p-4 text-center">{lang === 'ar' ? 'الحالة' : 'Condition'}</th>
                      <th className="p-4 text-center">{lang === 'ar' ? 'السعر' : 'Price'}</th>
                      <th className="p-4 text-center">{lang === 'ar' ? 'المخزون' : 'Stock'}</th>
                      <th className="p-4 text-end">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {inventory.map(item => (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-9 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                              {item.cover_url ? (
                                <Image src={item.cover_url} alt="" fill className="object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-xs">📖</div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-xs line-clamp-1">
                                {lang === 'ar' && item.title_ar ? item.title_ar : item.title}
                              </p>
                              {item.isbn && (
                                <span className="text-[10px] text-muted-foreground font-mono block">
                                  ISBN: {item.isbn}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-foreground text-xs">{item.author}</p>
                          <span className="text-[10px] text-muted-foreground">{item.category_name}</span>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {item.condition}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-black text-foreground text-xs block">
                            {item.price} ج.م
                          </span>
                          {item.original_price && item.original_price > item.price && (
                            <span className="text-[10px] text-muted-foreground line-through block">
                              {item.original_price} ج.م
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-black',
                            item.stock_quantity > 5 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                          )}>
                            {item.stock_quantity} {lang === 'ar' ? 'نسخ' : 'copies'}
                          </span>
                        </td>
                        <td className="p-4 text-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteBook(item.id)}
                            className="h-8 w-8 p-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {inventory.length === 0 && !isInventoryLoading && (
                <div className="p-12 text-center text-muted-foreground text-xs">
                  {lang === 'ar' ? 'لا توجد كتب مضافة بعد في مخزون هذه المكتبة.' : 'No books in this bookstore catalog yet.'}
                </div>
              )}
            </div>

            {/* Modal: Add Book */}
            {isAddBookModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                <div className="rounded-3xl border-2 border-border bg-card p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="font-black text-foreground text-sm flex items-center gap-2">
                      <PlusCircle className="h-4 w-4 text-primary" />
                      <span>{lang === 'ar' ? 'إضافة كتاب جديد للمخزون' : 'Add New Book to Store'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAddBookModalOpen(false)}
                      className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Smart Online Search & Auto-Enrich Box */}
                  <div className="rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/5 via-card to-background p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>{lang === 'ar' ? 'بحث وجلب بيانات الكتاب أونلاين تلقائياً 🪄' : 'Search & Auto-Fill Book Data'}</span>
                      </label>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {lang === 'ar' ? 'جلب الغلاف، الكاتب، الـ ISBN والتصنيف' : 'Auto-fills cover, author & ISBN'}
                      </span>
                    </div>

                    <div className="relative">
                      <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        value={onlineBookSearchQuery}
                        onChange={e => handleSearchOnlineBooks(e.target.value)}
                        placeholder={lang === 'ar' ? 'اكتب اسم الرواية: الغيهب، نادر فودة، فاتتني صلاة، الدحيح...' : 'Search title, author or ISBN...'}
                        className="w-full bg-card border border-border rounded-xl ps-9 pe-9 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary shadow-xs"
                      />
                      {isOnlineSearching ? (
                        <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary animate-spin" />
                      ) : onlineBookSearchQuery ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOnlineBookSearchQuery('')
                            setOnlineSearchResults([])
                          }}
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>

                    {/* Search Results Dropdown / Grid */}
                    {onlineSearchResults.length > 0 && (
                      <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto">
                        <div className="text-[10px] font-bold text-muted-foreground">
                          {lang === 'ar' ? `نتائج البحث (${onlineSearchResults.length} نتيجة): اضغط للتعبئة التلقائية` : 'Click any book to auto-populate form:'}
                        </div>
                        {onlineSearchResults.map(book => (
                          <div
                            key={book.id}
                            onClick={() => handleSelectOnlineSearchResult(book)}
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-card border border-border/80 hover:border-primary/60 hover:bg-primary/5 cursor-pointer transition-all shadow-xs group"
                          >
                            <div className="relative h-10 w-8 rounded bg-muted overflow-hidden shrink-0 border border-border/60">
                              {book.cover_url ? (
                                <Image src={book.cover_url} alt="" fill className="object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-xs">📖</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {book.title_ar || book.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground line-clamp-1">
                                {book.author_ar || book.author} {book.publisher ? `• ${book.publisher}` : ''}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary shrink-0 flex items-center gap-1">
                              <span>تعبئة</span>
                              <Wand2 className="h-2.5 w-2.5" />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleAddBook} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">عنوان الكتاب (بالعربية أو بالإنجليزية) *</label>
                      <input
                        type="text"
                        required
                        value={newBook.title}
                        onChange={e => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        placeholder="مثال: يوتوبيا"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">المؤلف *</label>
                        <input
                          type="text"
                          required
                          value={newBook.author}
                          onChange={e => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                          className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                          placeholder="أحمد خالد توفيق"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">رقم الـ ISBN</label>
                        <input
                          type="text"
                          value={newBook.isbn}
                          onChange={e => setNewBook(prev => ({ ...prev, isbn: e.target.value }))}
                          className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                          placeholder="978977..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">السعر بعد الخصم (ج.م) *</label>
                        <input
                          type="number"
                          required
                          value={newBook.price}
                          onChange={e => setNewBook(prev => ({ ...prev, price: Number(e.target.value) }))}
                          className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">السعر الأصلي (ج.م)</label>
                        <input
                          type="number"
                          value={newBook.original_price}
                          onChange={e => setNewBook(prev => ({ ...prev, original_price: Number(e.target.value) }))}
                          className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">الكمية المتوفرة *</label>
                        <input
                          type="number"
                          required
                          value={newBook.stock_quantity}
                          onChange={e => setNewBook(prev => ({ ...prev, stock_quantity: Number(e.target.value) }))}
                          className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Calculated Discount Pill */}
                    {newBook.original_price > newBook.price && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                        <span>قيمة الخصم للعميل:</span>
                        <span className="font-mono">
                          وفر {newBook.original_price - newBook.price} ج.م (خصم {Math.round(((newBook.original_price - newBook.price) / newBook.original_price) * 100)}%) 🔥
                        </span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">رابط صورة الغلاف (Cover URL)</label>
                      <input
                        type="url"
                        value={newBook.cover_url}
                        onChange={e => setNewBook(prev => ({ ...prev, cover_url: e.target.value }))}
                        className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>

                    {/* Quick Cover Preview if available */}
                    {newBook.cover_url && (
                      <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/30 border border-border">
                        <div className="relative h-12 w-9 rounded-md overflow-hidden bg-muted shrink-0 border border-border">
                          <Image src={newBook.cover_url} alt="" fill className="object-cover" />
                        </div>
                        <span className="text-[11px] text-muted-foreground font-semibold">معاينة غلاف الكتاب المحدد</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsAddBookModalOpen(false)}
                        className="rounded-xl font-bold text-xs"
                      >
                        إلغاء
                      </Button>
                      <Button type="submit" className="rounded-xl font-bold text-xs">
                        إضافة الكتاب الآن
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal: Bulk Book Import (Batch Paste) */}
            {isBulkAddModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                <div className="rounded-3xl border-2 border-border bg-card p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <ListPlus className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-foreground text-sm">
                          {lang === 'ar' ? 'استيراد سريع لقائمة كتب (Bulk Paste & Auto-Detect)' : 'Bulk Books Quick Paste'}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          {lang === 'ar'
                            ? 'الصق عناوين الكتب سطر بسطر. يتعرف النظام على الكتب تلقائياً ويطبق السعر والكمية الموحدة.'
                            : 'Paste book titles line by line. Auto-matches authors and covers with unified pricing.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBulkAddModalOpen(false)}
                      className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Sample List Demo Shortcut */}
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-primary/5 border border-primary/20 text-xs">
                    <span className="font-bold text-foreground text-[11px]">
                      {lang === 'ar' ? '💡 هل تود تجربة قائمة الـ 14 عنواناً الجاهزة؟' : '💡 Try sample 14-books list:'}
                    </span>
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => setBulkBooksText(SAMPLE_BULK_LIST)}
                      className="h-7 text-[11px] font-black rounded-xl border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                    >
                      📋 {lang === 'ar' ? 'لصق القائمة النموذجية بنقرة' : 'Paste Sample List'}
                    </Button>
                  </div>

                  {/* Textarea for Bulk Titles */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <label>قائمة عناوين الكتب (عنوان في كل سطر) *</label>
                      <span className="text-[11px] text-primary font-black">
                        {parsedBulkBooks.length} {lang === 'ar' ? 'كتاب تم التعرف عليه' : 'books detected'}
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      value={bulkBooksText}
                      onChange={e => setBulkBooksText(e.target.value)}
                      placeholder={`الغيهب\nنادر فودة ال2\nالطريق الي الله\nفاتتني صلاة\nمر مثل القهوة حلو مثل الشيكولاتة\nعقل بلا جسد\nالدحيح\nمدرسة ميلر\nحارة الجزار\nكن اقوي من مشاعرك\nاسرار سورة البقرة\nسر الغرفة 207\nفكر كان طبيب نفسي\nقوة الان`}
                      className="w-full bg-muted/40 border border-border rounded-2xl p-3 text-xs font-mono text-foreground focus:outline-none focus:border-primary leading-relaxed shadow-inner"
                    />
                  </div>

                  {/* Bulk Defaults Controller Bar */}
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
                    <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-primary" />
                      <span>{lang === 'ar' ? 'الإعدادات الموحدة لجميع كتب هذه الدفعة:' : 'Unified Defaults for Batch:'}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground">السعر الموحد للكتاب (ج.م) *</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={bulkDefaultPrice}
                          onChange={e => setBulkDefaultPrice(Number(e.target.value))}
                          className="w-full bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground">الكمية المتوفرة لكل عنوان *</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={bulkDefaultQty}
                          onChange={e => setBulkDefaultQty(Number(e.target.value))}
                          className="w-full bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-muted-foreground">حالة النسخ المضافة</label>
                        <select
                          value={bulkDefaultCondition}
                          onChange={e => setBulkDefaultCondition(e.target.value as BookCondition)}
                          className="w-full bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="NEW">جديد (New / غير مستعمل)</option>
                          <option value="LIKE_NEW">كالجديد (Like New)</option>
                          <option value="VERY_GOOD">جيد جداً (Very Good)</option>
                          <option value="GOOD">جيد (Good)</option>
                          <option value="FAIR">طبعة شعبية / مقروءة (Fair)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Live Preview List / Table */}
                  {parsedBulkBooks.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground">
                        <span>{lang === 'ar' ? 'معاينة الكتب التي سيتم إنشاؤها فوراً:' : 'Live Books Preview:'}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {lang === 'ar'
                            ? `إجمالي النسخ: ${parsedBulkBooks.length * bulkDefaultQty} نسخة | القيمة الإجمالية: ${parsedBulkBooks.length * bulkDefaultQty * bulkDefaultPrice} ج.م`
                            : `Total copies: ${parsedBulkBooks.length * bulkDefaultQty}`}
                        </span>
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-1.5 border border-border/80 rounded-2xl p-2 bg-muted/20">
                        {parsedBulkBooks.map((item, idx) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 p-2 rounded-xl bg-card border border-border/60 text-xs shadow-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono text-[10px] text-muted-foreground w-4 text-center">
                                {idx + 1}
                              </span>
                              <div className="relative h-9 w-7 rounded overflow-hidden bg-muted shrink-0 border border-border/60">
                                <Image src={item.cover_url} alt="" fill className="object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-foreground truncate">{item.title}</p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {item.author} • {item.category_name}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                {item.price} ج.م
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-bold text-[11px]">
                                {item.stock_quantity} نسخة
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsBulkAddModalOpen(false)}
                      className="rounded-xl font-bold text-xs"
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="button"
                      disabled={parsedBulkBooks.length === 0 || isBulkImporting}
                      onClick={handleExecuteBulkImport}
                      className="rounded-xl font-black text-xs gap-2 shadow-md shadow-primary/25 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {isBulkImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>جاري إضافة الكتب...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>
                            {lang === 'ar'
                              ? `إضافة الـ ${parsedBulkBooks.length} كتاباً دفعة واحدة للمخزون 🚀`
                              : `Add ${parsedBulkBooks.length} Books to Inventory 🚀`}
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: BUNDLES & OFFERS MANAGER                                */}
        {/* ============================================================== */}
        {activeTab === 'offers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
                  <span>{lang === 'ar' ? 'إدارة باقات وحزم العروض' : 'Bundles & Special Offers'}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'ar'
                    ? 'أطلق حزم التوفير (10، 20، 25 كتاب) مع هدايا فواصل ومفكرات قراءة وأكواد خصم لجذب آلاف القراء.'
                    : 'Launch bulk book packages (10, 20, 25 books) with reader gifts and promo codes.'}
                </p>
              </div>

              <Button
                onClick={() => setIsAddOfferModalOpen(true)}
                className="rounded-2xl font-black text-xs gap-2 shadow-md shadow-orange-500/25 bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{lang === 'ar' ? 'إنشاء باقة أو عرض جديد 🔥' : 'Create New Bundle 🔥'}</span>
              </Button>
            </div>

            {/* Offers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {offers.map(offer => {
                const isPack = offer.offer_type === 'CURATED_PACK'
                const effectiveOfferPrice = offer.offer_price || offer.bundle_price || 0
                const savings = offer.original_price && offer.original_price > effectiveOfferPrice
                  ? offer.original_price - effectiveOfferPrice
                  : null

                return (
                  <div
                    key={offer.id}
                    className="rounded-3xl border-2 border-border/80 bg-card overflow-hidden shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all"
                  >
                    {/* Pack Image Header (if curated pack and has image) */}
                    {isPack && offer.cover_image_url && (
                      <div className="relative h-44 w-full bg-muted overflow-hidden border-b border-border">
                        <Image
                          src={offer.cover_image_url}
                          alt={offer.title}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute top-3 start-3 flex flex-wrap items-center gap-1.5">
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-primary text-primary-foreground shadow-md">
                            {offer.badge_text || (lang === 'ar' ? 'عرض باكدج مجهز' : 'Curated Pack')}
                          </span>
                          {offer.genre_ar && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md bg-black/60 text-white border border-white/20">
                              {offer.genre_ar}
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-3 start-3 end-3 flex items-center justify-between text-white">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <Package className="h-4 w-4 text-primary" />
                            {offer.book_count || (offer.included_books ? offer.included_books.length : 2)} {lang === 'ar' ? 'كتب في الباكدج' : 'books pack'}
                          </span>
                          {savings && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500 text-white shadow-xs">
                              {lang === 'ar' ? `وفر ${savings} ج.م` : `Save ${savings} EGP`}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          {!isPack && offer.bundle_buy_qty && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-primary text-primary-foreground">
                              {offer.bundle_buy_qty} {lang === 'ar' ? 'كتب' : 'books bundle'}
                            </span>
                          )}
                          {isPack && !offer.cover_image_url && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-primary/10 text-primary border border-primary/20">
                              {offer.badge_text || (lang === 'ar' ? 'باكدج مجهز' : 'Curated Pack')}
                            </span>
                          )}
                          {isPack && offer.genre_ar && (
                            <span className="px-2 py-0.5 rounded-xl text-xs font-bold bg-muted text-foreground border border-border">
                              {offer.genre_ar}
                            </span>
                          )}
                          {offer.discount_pct && (
                            <span className="px-2 py-0.5 rounded-xl text-xs font-black bg-red-600 text-white">
                              %{offer.discount_pct} OFF
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="h-8 w-8 p-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-base font-black text-foreground">
                          {lang === 'ar' && offer.title_ar ? offer.title_ar : offer.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {lang === 'ar' && offer.description_ar ? offer.description_ar : offer.description}
                        </p>
                      </div>

                      {/* Included Books in Pack */}
                      {isPack && offer.included_books && offer.included_books.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-muted-foreground block">
                            {lang === 'ar' ? 'الكتب المتضمنة في هذا الباكدج:' : 'Included books in this pack:'}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {offer.included_books.map((bookTitle, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-muted/60 border border-border text-[11px] font-bold text-foreground"
                              >
                                <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                                <span>{bookTitle}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {offer.gift_description && (
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                          <Gift className="h-4 w-4 shrink-0 text-amber-600" />
                          <span>{offer.gift_description}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 pt-3 border-t border-border flex items-center justify-between bg-muted/10">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-semibold block">
                          {isPack ? (lang === 'ar' ? 'سعر الباكدج الخاص:' : 'Pack Offer Price:') : (lang === 'ar' ? 'سعر الحزمة:' : 'Bundle Price:')}
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-foreground">{effectiveOfferPrice} ج.م</span>
                          {offer.original_price && offer.original_price > effectiveOfferPrice && (
                            <span className="text-xs text-muted-foreground line-through">
                              {offer.original_price} ج.م
                            </span>
                          )}
                        </div>
                      </div>

                      {offer.promo_code ? (
                        <div className="px-3 py-1.5 rounded-xl bg-muted border border-border font-mono text-xs font-bold">
                          كود: {offer.promo_code}
                        </div>
                      ) : savings ? (
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {lang === 'ar' ? `توفير ${savings} ج.م 💥` : `Save ${savings} EGP 💥`}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Modal: Add Offer */}
            {isAddOfferModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                <div className="rounded-3xl border-2 border-border bg-card p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="font-black text-foreground text-sm flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span>{lang === 'ar' ? 'إطلاق باقة كتب أو عرض باكدج مجهز' : 'Create Book Offer / Curated Pack'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAddOfferModalOpen(false)}
                      className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAddOffer} className="space-y-4">
                    {/* Offer Type Segmented Toggle */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">نوع العرض المراد إنشاؤه *</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewOffer(prev => ({
                            ...prev,
                            offer_type: 'CURATED_PACK',
                            badge_text: prev.badge_text || 'ثنائية التوفير 🔥',
                          }))}
                          className={cn(
                            'p-3 rounded-2xl border-2 text-xs font-black transition-all flex flex-col items-center gap-1.5 text-center cursor-pointer',
                            newOffer.offer_type === 'CURATED_PACK'
                              ? 'border-primary bg-primary/10 text-primary shadow-xs'
                              : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                          )}
                        >
                          <Package className="h-5 w-5" />
                          <span>باكدج مجهز (2 أو 3 كتب)</span>
                          <span className="text-[10px] font-normal opacity-80">مع صورة محددة وقائمة روايات وسعر خاص</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setNewOffer(prev => ({ ...prev, offer_type: 'BUNDLE' }))}
                          className={cn(
                            'p-3 rounded-2xl border-2 text-xs font-black transition-all flex flex-col items-center gap-1.5 text-center cursor-pointer',
                            newOffer.offer_type === 'BUNDLE'
                              ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 shadow-xs'
                              : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                          )}
                        >
                          <Flame className="h-5 w-5" />
                          <span>باقة توفير مفتوحة (Bulk)</span>
                          <span className="text-[10px] font-normal opacity-80">مثلاً باقة 5، 10، 20 كتاب يختارهم القارئ</span>
                        </button>
                      </div>
                    </div>

                    {/* Common / Curated Pack Fields */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">عنوان العرض أو الباكدج *</label>
                      <input
                        type="text"
                        required
                        value={newOffer.title_ar}
                        onChange={e => setNewOffer(prev => ({ ...prev, title_ar: e.target.value }))}
                        className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        placeholder={
                          newOffer.offer_type === 'CURATED_PACK'
                            ? 'مثال: ثنائية أحمد مراد (الفيل الأزرق + تراب الماس)'
                            : 'مثال: باقة الـ 5 روايات الأكثر طلباً بـ 200 ج.م فقط'
                        }
                      />
                    </div>

                    {newOffer.offer_type === 'CURATED_PACK' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-foreground">عدد الكتب في الباكدج</label>
                            <select
                              value={newOffer.book_count}
                              onChange={e => {
                                const count = Number(e.target.value)
                                setNewOffer(prev => ({
                                  ...prev,
                                  book_count: count,
                                  badge_text:
                                    count === 2
                                      ? 'ثنائية التوفير 🔥'
                                      : count === 3
                                      ? 'ثلاثية ذهبية 🏆'
                                      : count === 4
                                      ? 'رباعية مميزة 🌟'
                                      : 'خماسية التوفير 💥',
                                }))
                              }}
                              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer"
                            >
                              <option value={2}>كتابان (ثنائية 2 Books)</option>
                              <option value={3}>3 كتب (ثلاثية 3 Books)</option>
                              <option value={4}>4 كتب (رباعية 4 Books)</option>
                              <option value={5}>5 كتب (خماسية 5 Books)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-foreground">شارة العرض المميزة (Badge)</label>
                            <input
                              type="text"
                              value={newOffer.badge_text}
                              onChange={e => setNewOffer(prev => ({ ...prev, badge_text: e.target.value }))}
                              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                              placeholder="ثنائية التوفير 🔥"
                            />
                          </div>
                        </div>

                        {/* Quick Badge Presets */}
                        <div className="flex flex-wrap gap-1.5">
                          {['ثنائية التوفير 🔥', 'ثلاثية نجيب محفوظ 🏆', 'باكدج الإثارة والتشويق ⚡', 'باكدج تطوير الذات 💡', 'عرض الـ 200 ج.م 💥'].map(preset => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setNewOffer(prev => ({ ...prev, badge_text: preset }))}
                              className="px-2 py-0.5 rounded-lg bg-muted text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>

                        {/* Genre / Category Selection for Filterability */}
                        <div className="space-y-1.5 p-3 rounded-2xl bg-muted/30 border border-border/80">
                          <label className="text-xs font-bold text-foreground flex items-center justify-between">
                            <span>تصنيف وجانر الباكدج (لحفظه وفلترته لاحقاً للقراء) *</span>
                            <span className="text-[10px] text-muted-foreground font-normal">لتسهيل وصول القراء للباكدج</span>
                          </label>
                          <select
                            value={newOffer.genre}
                            onChange={e => {
                              const g = e.target.value
                              const found = GENRE_CATEGORIES.find(c => c.id === g)
                              setNewOffer(prev => ({
                                ...prev,
                                genre: g,
                                genre_ar: found ? found.nameAr : 'روايات وأدب',
                              }))
                            }}
                            className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer shadow-xs"
                          >
                            <option value="NOVELS">📖 روايات وأدب (Novels & Literature)</option>
                            <option value="THRILLER">🔦 غموض ورعب وتشويق (Mystery & Thriller)</option>
                            <option value="PSYCHOLOGY">🧠 علم نفس وتطوير ذات (Psychology & Self-Help)</option>
                            <option value="RELIGIOUS">🕌 دين وروحانيات (Faith & Spiritual)</option>
                            <option value="PHILOSOPHY">💡 فكر وفلسفة ومجتمع (Philosophy & Society)</option>
                          </select>

                          {/* Quick Genre Chips */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {[
                              { id: 'NOVELS', label: '📖 روايات وأدب' },
                              { id: 'THRILLER', label: '🔦 غموض ورعب' },
                              { id: 'PSYCHOLOGY', label: '🧠 تطوير ذات' },
                              { id: 'RELIGIOUS', label: '🕌 دين وروحانيات' },
                              { id: 'PHILOSOPHY', label: '💡 فكر وفلسفة' },
                            ].map(cat => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  const found = GENRE_CATEGORIES.find(c => c.id === cat.id)
                                  setNewOffer(prev => ({
                                    ...prev,
                                    genre: cat.id,
                                    genre_ar: found ? found.nameAr : cat.label,
                                  }))
                                }}
                                className={cn(
                                  'px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer',
                                  newOffer.genre === cat.id
                                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                                )}
                              >
                                {cat.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Included Books List */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-foreground">
                            أسماء الكتب المتضمنة في هذا الباكدج (كل كتاب في سطر) *
                          </label>
                          <textarea
                            rows={3}
                            required
                            value={newOffer.included_books_text}
                            onChange={e => setNewOffer(prev => ({ ...prev, included_books_text: e.target.value }))}
                            className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary font-bold"
                            placeholder={"الفيل الأزرق\nتراب الماس"}
                          />
                        </div>

                        {/* Square Image Upload Component for 1:1 Pack Cover */}
                        <div className="space-y-1">
                          <SquareImageUpload
                            label={lang === 'ar' ? 'صورة الباكدج المربعة (Square Pack Image) *' : 'Square Pack Image *'}
                            subLabel={lang === 'ar' ? 'ارفع صورة حزمة الكتب (مربعة 1:1) مع ضغط وحفظ تلقائي، أو اختر من الصور الجاهزة' : 'Upload 1:1 square package image with auto compression'}
                            value={newOffer.cover_image_url}
                            onChange={url => setNewOffer(prev => ({ ...prev, cover_image_url: url }))}
                            onRemove={() => setNewOffer(prev => ({ ...prev, cover_image_url: '' }))}
                            folder="covers"
                            userId={currentUserId}
                            targetSize={{ maxWidth: 800, maxHeight: 800 }}
                            theme="amber"
                            tagText={lang === 'ar' ? `باكدج ${newOffer.book_count} كتب` : `${newOffer.book_count} Books`}
                            presets={[
                              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
                            ]}
                            lang={lang}
                          />
                        </div>

                        {/* Pricing: Original Price vs Offer Price */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-foreground">السعر بعد الخصم (سعر العرض ج.م) *</label>
                            <input
                              type="number"
                              required
                              value={newOffer.offer_price}
                              onChange={e => setNewOffer(prev => ({ ...prev, offer_price: Number(e.target.value) }))}
                              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-black text-foreground focus:outline-none focus:border-primary"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-foreground">السعر الأصلي قبل الخصم (ج.م) *</label>
                            <input
                              type="number"
                              required
                              value={newOffer.original_price}
                              onChange={e => setNewOffer(prev => ({ ...prev, original_price: Number(e.target.value) }))}
                              className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-black text-foreground focus:outline-none focus:border-primary"
                            />
                          </div>
                        </div>

                        {/* Calculated Savings Pill */}
                        {newOffer.original_price > newOffer.offer_price && (
                          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                            <span>نسبة التوفير للقارئ:</span>
                            <span className="font-mono">
                              وفر {newOffer.original_price - newOffer.offer_price} ج.م (خصم {Math.round(((newOffer.original_price - newOffer.offer_price) / newOffer.original_price) * 100)}%) 🔥
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {newOffer.offer_type === 'BUNDLE' && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-foreground">عدد الكتب بالحزمة</label>
                          <select
                            value={newOffer.bundle_buy_qty}
                            onChange={e => setNewOffer(prev => ({ ...prev, bundle_buy_qty: Number(e.target.value) }))}
                            className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer"
                          >
                            <option value={3}>3 كتب</option>
                            <option value={5}>5 كتب (200 ج.م)</option>
                            <option value={10}>10 كتب</option>
                            <option value={15}>15 كتاب</option>
                            <option value={20}>20 كتاب</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-foreground">سعر الباقة (ج.م) *</label>
                          <input
                            type="number"
                            required
                            value={newOffer.bundle_price}
                            onChange={e => setNewOffer(prev => ({ ...prev, bundle_price: Number(e.target.value) }))}
                            className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-foreground">كود الخصم</label>
                          <input
                            type="text"
                            value={newOffer.promo_code}
                            onChange={e => setNewOffer(prev => ({ ...prev, promo_code: e.target.value }))}
                            className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                            placeholder="BUNDLE20"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">وصف الهدايا المرفقة مع العرض 🎁</label>
                      <input
                        type="text"
                        value={newOffer.gift_description}
                        onChange={e => setNewOffer(prev => ({ ...prev, gift_description: e.target.value }))}
                        className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        placeholder="فاصل قراءة خشبي محفور مجاناً + مفكرة..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">تفاصيل إضافية ووصف العرض</label>
                      <textarea
                        rows={2}
                        value={newOffer.description_ar}
                        onChange={e => setNewOffer(prev => ({ ...prev, description_ar: e.target.value }))}
                        className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                        placeholder="نبذة عن الروايات، وحالة الكتب، ومميزات الشحن والتوصيل..."
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsAddOfferModalOpen(false)}
                        className="rounded-xl font-bold text-xs"
                      >
                        إلغاء
                      </Button>
                      <Button type="submit" className="rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-700 text-white">
                        {newOffer.offer_type === 'CURATED_PACK' ? 'نشر باكدج الكتب الآن 🎁' : 'نشر باقة التوفير الآن 🔥'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: STORE ORDERS MANAGEMENT (DIRECT FROM STORE PAGE)        */}
        {/* ============================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <span>{lang === 'ar' ? 'سجل طلبات عملاء المكتبة' : 'Store Customer Orders'}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'ar'
                    ? 'الطلبات الواردة مباشرة من صفحة مكتبتك (باكدجات 2 و 3 كتب، باقات التوفير، أو الكتب الفردية).'
                    : 'Incoming orders placed directly via your public store page.'}
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { key: 'ALL', labelAr: `الكل (${orders.length})`, labelEn: `All (${orders.length})` },
                  { key: 'NEW', labelAr: `جديد (${orders.filter(o => o.status === 'NEW').length})`, labelEn: `New (${orders.filter(o => o.status === 'NEW').length})` },
                  { key: 'CONFIRMED', labelAr: `مؤكد (${orders.filter(o => o.status === 'CONFIRMED').length})`, labelEn: `Confirmed (${orders.filter(o => o.status === 'CONFIRMED').length})` },
                  { key: 'DISPATCHED', labelAr: `جاري التوصيل (${orders.filter(o => o.status === 'DISPATCHED').length})`, labelEn: `Dispatched (${orders.filter(o => o.status === 'DISPATCHED').length})` },
                  { key: 'DELIVERED', labelAr: `تم التسليم (${orders.filter(o => o.status === 'DELIVERED').length})`, labelEn: `Delivered (${orders.filter(o => o.status === 'DELIVERED').length})` },
                ].map(filterItem => (
                  <button
                    key={filterItem.key}
                    type="button"
                    onClick={() => setOrderStatusFilter(filterItem.key)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                      orderStatusFilter === filterItem.key
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {lang === 'ar' ? filterItem.labelAr : filterItem.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {(() => {
              const filteredOrders = orders.filter(
                o => orderStatusFilter === 'ALL' || o.status === orderStatusFilter
              )

              if (filteredOrders.length === 0) {
                return (
                  <div className="rounded-3xl border-2 border-dashed border-border p-12 text-center space-y-3 bg-card/50">
                    <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-2xl">
                      🛍️
                    </div>
                    <h3 className="font-black text-foreground text-sm">
                      {lang === 'ar' ? 'لا توجد طلبات في هذا القسم حالياً' : 'No orders found in this section'}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      {lang === 'ar'
                        ? 'عندما يقوم القراء بطلب باكدجات الكتب (2 أو 3 كتب) أو الكتب الفردية من صفحة مكتبتك العامة، ستظهر بياناتهم وطلباتهم هنا فوراً.'
                        : 'When readers order curated packs or single books from your public page, they appear here instantly.'}
                    </p>
                  </div>
                )
              }

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {filteredOrders.map(order => {
                    const cleanPhone = (order.customer_phone || '').replace(/\D/g, '')
                    const formattedPhone = cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone

                    return (
                      <div
                        key={order.id}
                        className="rounded-3xl border-2 border-border/80 bg-card p-5 space-y-4 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Order Header: Order ID, Type Badge, and Status */}
                          <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-foreground">
                                #{order.id.slice(-6).toUpperCase()}
                              </span>
                              <span
                                className={cn(
                                  'px-2.5 py-0.5 rounded-full text-[10px] font-black',
                                  order.order_type === 'CURATED_PACK'
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : order.order_type === 'BUNDLE_PACKAGE'
                                    ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
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

                            {/* Status Selector */}
                            <select
                              value={order.status}
                              onChange={e => handleUpdateOrderStatus(order.id, e.target.value as StoreOrder['status'])}
                              className={cn(
                                'text-[11px] font-black px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer',
                                order.status === 'NEW' && 'bg-blue-500/10 text-blue-600 border-blue-500/30',
                                order.status === 'CONFIRMED' && 'bg-amber-500/10 text-amber-600 border-amber-500/30',
                                order.status === 'DISPATCHED' && 'bg-purple-500/10 text-purple-600 border-purple-500/30',
                                order.status === 'DELIVERED' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
                                order.status === 'CANCELLED' && 'bg-red-500/10 text-red-600 border-red-500/30'
                              )}
                            >
                              <option value="NEW">جديد (New)</option>
                              <option value="CONFIRMED">مؤكد (Confirmed)</option>
                              <option value="DISPATCHED">جاري الشحن (Dispatched)</option>
                              <option value="DELIVERED">تم التسليم (Delivered)</option>
                              <option value="CANCELLED">ملغي (Cancelled)</option>
                            </select>
                          </div>

                          {/* Customer Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground font-bold block">العميل:</span>
                              <p className="font-black text-foreground">{order.customer_name}</p>
                              <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
                                <Phone className="h-3 w-3 text-primary" />
                                <span>{order.customer_phone}</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground font-bold block">عنوان التوصيل:</span>
                              <p className="font-bold text-foreground">
                                {order.customer_city ? `${order.customer_city} — ` : ''}
                                {order.customer_address}
                              </p>
                              {order.customer_notes && (
                                <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                                  ملاحظة: {order.customer_notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Order Content Summary */}
                          <div className="p-3 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                                <Package className="h-3.5 w-3.5 text-primary" />
                                <span>{order.pack_title || (order.items && order.items[0]?.book_title) || 'تفاصيل المنتجات'}</span>
                              </span>
                              <span className="text-xs font-black text-primary">
                                {order.total_price} ج.م
                              </span>
                            </div>

                            {/* If Curated Pack with included books or items */}
                            {order.items && order.items.length > 0 && (
                              <div className="text-[11px] text-muted-foreground space-y-1">
                                {order.items.map((it, idx) => (
                                  <div key={idx} className="flex items-center justify-between">
                                    <span>• {it.book_title}</span>
                                    <span className="font-mono">{it.price} ج.م</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Order Actions Footer */}
                        <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(order.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Direct WhatsApp Chat with Customer */}
                            {order.customer_phone && (
                              <a
                                href={`https://wa.me/20${formattedPhone}?text=${encodeURIComponent(
                                  `مرحباً أستاذ ${order.customer_name}، نتواصل معك من مكتبة "${currentStore.name_ar || currentStore.name}" بخصوص طلبك رقم #${order.id.slice(-6).toUpperCase()} بقيمة ${order.total_price} ج.م لتأكيد التوصيل.`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-colors cursor-pointer"
                              >
                                <span>مراسلة واتساب</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: EVENTS & SIGNINGS HOST                                  */}
        {/* ============================================================== */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-500" />
                  <span>{lang === 'ar' ? 'إدارة فعاليات وحفلات توقيع المكتبة' : 'Events & Book Signings'}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'ar'
                    ? 'نظّم أمسيات مناقشة الروايات، حفلات توقيع الكتاب، وأيام التخفيضات الكبرى وتتبع تأكيدات الحضور.'
                    : 'Schedule author signings, novel circles, clearance fairs, and manage RSVPs.'}
                </p>
              </div>

              <Button
                onClick={() => setIsAddEventModalOpen(true)}
                className="rounded-2xl font-black text-xs gap-2 shadow-md shadow-indigo-500/25 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{lang === 'ar' ? 'إضافة فعالية جديدة 📅' : 'Add New Event 📅'}</span>
              </Button>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map(ev => (
                <div
                  key={ev.id}
                  className="rounded-3xl border-2 border-border/80 bg-card overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  {/* Event Cover Image */}
                  {ev.cover_image_url && (
                    <div className="relative h-44 w-full bg-muted overflow-hidden">
                      <Image src={ev.cover_image_url} alt="" fill className="object-cover" />
                      <div className="absolute top-3 start-3">
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-black/75 text-white border border-white/20">
                          {ev.is_free ? (lang === 'ar' ? 'دخول مجاني' : 'Free Entry') : `${ev.price} ج.م`}
                        </span>
                      </div>
                      <div className="absolute top-3 end-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="h-8 w-8 p-0 rounded-xl bg-black/60 text-white hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                          {ev.event_type}
                        </span>
                        {!ev.cover_image_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="h-8 w-8 p-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <h3 className="text-base font-black text-foreground">
                        {lang === 'ar' && ev.title_ar ? ev.title_ar : ev.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {lang === 'ar' && ev.description_ar ? ev.description_ar : ev.description}
                      </p>

                      <div className="space-y-1 text-xs text-muted-foreground pt-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-indigo-500" />
                          <span>
                            {new Date(ev.starts_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {ev.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{ev.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Event Host Pill */}
                      {ev.host_name && (
                        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/40 border border-border/80 text-xs mt-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">🎙️</span>
                            <div>
                              <p className="font-bold text-foreground text-[11px]">{ev.host_name}</p>
                              {ev.host_role && (
                                <p className="text-[10px] text-muted-foreground">{ev.host_role}</p>
                              )}
                            </div>
                          </div>
                          {ev.host_phone && (
                            <span className="text-[10px] font-mono text-emerald-600 font-bold">
                              {ev.host_phone}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">
                        {ev.current_attendees} {lang === 'ar' ? 'أكدوا الحضور (RSVP)' : 'confirmed RSVPs'}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {ev.is_free ? (lang === 'ar' ? 'حضور مجاني' : 'Free Entry') : `${ev.price} ج.م`}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal: Add Event */}
            {isAddEventModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                <div className="rounded-3xl border-2 border-border bg-card p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="font-black text-foreground text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      <span>{lang === 'ar' ? 'جدولة فعالية أو حفل توقيع جديد' : 'Schedule Event / Signing'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAddEventModalOpen(false)}
                      className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAddEvent} className="space-y-4">
                    {/* Event Type */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">نوع الفعالية *</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'SIGNING' as StoreEventType, label: '✍️ حفل توقيع' },
                          { id: 'DISCUSSION' as StoreEventType, label: '📖 مناقشة رواية' },
                          { id: 'EXCHANGE' as StoreEventType, label: '☕ تبادل كتب' },
                          { id: 'SALE' as StoreEventType, label: '🏷️ يوم خصومات' },
                        ].map(type => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setNewEvent(prev => ({ ...prev, event_type: type.id }))}
                            className={cn(
                              'p-2.5 rounded-xl border text-xs font-bold transition-all text-center',
                              newEvent.event_type === type.id
                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black shadow-xs'
                                : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                            )}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">عنوان الفعالية *</label>
                      <input
                        type="text"
                        required
                        value={newEvent.title_ar}
                        onChange={e => setNewEvent(prev => ({ ...prev, title_ar: e.target.value }))}
                        className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        placeholder="مثال: حفل توقيع ومناقشة الرواية الجديدة مع الكاتب أحمد مراد..."
                      />
                    </div>

                    {/* Date/Time and Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-indigo-500" />
                          <span>التاريخ وموعد البداية *</span>
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={newEvent.starts_at}
                          onChange={e => setNewEvent(prev => ({ ...prev, starts_at: e.target.value }))}
                          className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                          <span>المكان / القاعة أو الرابط</span>
                        </label>
                        <input
                          type="text"
                          value={newEvent.location}
                          onChange={e => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                          placeholder="مثال: حديقة فرع الزمالك، شارع 26 يوليو"
                        />
                      </div>
                    </div>

                    {/* Pricing: Free vs Paid */}
                    <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-2.5">
                      <label className="text-xs font-bold text-foreground block">رسوم الحضور والتسجيل</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewEvent(prev => ({ ...prev, is_free: true }))}
                          className={cn(
                            'p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-2',
                            newEvent.is_free
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black'
                              : 'border-border bg-muted/20 text-muted-foreground'
                          )}
                        >
                          <span>🎁 حضور مجاني بالكامل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewEvent(prev => ({ ...prev, is_free: false }))}
                          className={cn(
                            'p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-2',
                            !newEvent.is_free
                              ? 'border-primary bg-primary/10 text-primary font-black'
                              : 'border-border bg-muted/20 text-muted-foreground'
                          )}
                        >
                          <span>🎟️ تذكرة مدفوعة</span>
                        </button>
                      </div>

                      {!newEvent.is_free && (
                        <div className="pt-2 flex items-center gap-3">
                          <label className="text-xs font-bold text-foreground shrink-0">سعر التذكرة (ج.م):</label>
                          <input
                            type="number"
                            min={1}
                            value={newEvent.price}
                            onChange={e => setNewEvent(prev => ({ ...prev, price: Number(e.target.value) }))}
                            className="w-32 bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                      )}
                    </div>

                    {/* Host Details */}
                    <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <span>🎙️ بيانات المحاضر / منسق الفعالية والتواصل</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground">اسم المنسق / الضيف</label>
                          <input
                            type="text"
                            value={newEvent.host_name}
                            onChange={e => setNewEvent(prev => ({ ...prev, host_name: e.target.value }))}
                            className="w-full bg-card border border-border rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                            placeholder="أحمد مراد"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground">الصفة / الدور</label>
                          <input
                            type="text"
                            value={newEvent.host_role}
                            onChange={e => setNewEvent(prev => ({ ...prev, host_role: e.target.value }))}
                            className="w-full bg-card border border-border rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                            placeholder="الكاتب الضيف"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground">هاتف / واتساب للتنسيق</label>
                          <input
                            type="tel"
                            value={newEvent.host_phone}
                            onChange={e => setNewEvent(prev => ({ ...prev, host_phone: e.target.value }))}
                            className="w-full bg-card border border-border rounded-xl px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                            placeholder="+201001234567"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cover Image & Presets */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <ImageIcon className="h-3.5 w-3.5 text-primary" />
                          <span>صورة وبنر الفعالية</span>
                        </label>
                        <span className="text-[11px] text-muted-foreground">نماذج بنرات سريعة بنقرة:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: '✍️ حفل توقيع', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80' },
                          { label: '☕ قهوة وتبادل', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80' },
                          { label: '📖 نادي مناقشة', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80' },
                          { label: '🏷️ خصومات ومعرض', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80' },
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setNewEvent(prev => ({ ...prev, cover_image_url: preset.url }))}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-border bg-muted/40 hover:bg-muted text-foreground transition-all"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="url"
                        value={newEvent.cover_image_url}
                        onChange={e => setNewEvent(prev => ({ ...prev, cover_image_url: e.target.value }))}
                        className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                        placeholder="https://images.unsplash.com/..."
                      />
                      {newEvent.cover_image_url && (
                        <div className="relative h-28 w-full rounded-2xl overflow-hidden border border-border">
                          <Image src={newEvent.cover_image_url} alt="" fill className="object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">وصف الفعالية وتفاصيل الحضور</label>
                      <textarea
                        rows={2}
                        value={newEvent.description_ar}
                        onChange={e => setNewEvent(prev => ({ ...prev, description_ar: e.target.value }))}
                        className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                        placeholder="محاور النقاش، موعد التوقيع، شروط الحضور..."
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsAddEventModalOpen(false)}
                        className="rounded-xl font-bold text-xs"
                      >
                        إلغاء
                      </Button>
                      <Button type="submit" className="rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20">
                        نشر الفعالية الآن 🚀
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
