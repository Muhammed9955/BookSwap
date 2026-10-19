'use client'

import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { cn, formatPrice } from '@/lib/utils'
import type { Bookstore, StoreOffer, StoreEvent, StoreInventoryItem, StoreType, BookCondition } from '@/types/store'
import {
  DEMO_STORES,
  getStoreInventory,
  addStoreBook,
  deleteStoreBook,
  updateBookstore,
  createStoreOffer,
  deleteStoreOffer,
  createStoreEvent,
  deleteStoreEvent,
} from '@/lib/stores/store-service'
import { MapLocationPicker, type MapCoordinates } from '@/components/common/map-location-picker'

interface StoreDashboardClientProps {
  initialStore: Bookstore
  allStores: Bookstore[]
  initialOffers: StoreOffer[]
  initialEvents: StoreEvent[]
  currentUserId?: string | null
}

type DashboardTab = 'profile' | 'inventory' | 'offers' | 'events'

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
    opening_weekdays: currentStore.opening_hours?.['السبت - الخميس'] || '9:00 ص - 11:00 م',
    opening_friday: currentStore.opening_hours?.['الجمعة'] || '1:00 م - 11:00 م',
    logo_url: currentStore.logo_url || '',
    cover_url: currentStore.cover_url || '',
  })

  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Inventory State
  const [inventory, setInventory] = useState<StoreInventoryItem[]>([])
  const [isInventoryLoading, setIsInventoryLoading] = useState(true)
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false)
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

  // Offers State
  const [offers, setOffers] = useState<StoreOffer[]>(
    initialOffers.filter(o => o.store_id === currentStore.id)
  )
  const [isAddOfferModalOpen, setIsAddOfferModalOpen] = useState(false)
  const [newOffer, setNewOffer] = useState({
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    bundle_buy_qty: 20,
    bundle_price: 550,
    discount_pct: 35,
    gift_description: '3 فواصل كتب خشبية محفورة بالليزر + مفكرة قراءة أنيقة 🎁',
    promo_code: 'BUNDLE20',
    cover_image_url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80',
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
    starts_at: '2026-11-01T18:00:00Z',
    location: currentStore.address || 'فرع المكتبة الرئيسي',
    max_attendees: 50,
    cover_image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
  })

  // Load Inventory for selected store
  useEffect(() => {
    let isMounted = true
    setIsInventoryLoading(true)
    getStoreInventory(activeStoreId).then(items => {
      if (isMounted) {
        setInventory(items)
        setIsInventoryLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [activeStoreId])

  // Handle Store Profile Save
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateBookstore(activeStoreId, {
        name: profileForm.name,
        name_ar: profileForm.name_ar,
        slug: profileForm.slug,
        description: profileForm.description,
        description_ar: profileForm.description_ar,
        store_type: profileForm.store_type,
        address: profileForm.address,
        latitude: profileForm.latitude,
        longitude: profileForm.longitude,
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

  // Handle Add Offer
  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOffer.title_ar && !newOffer.title) return
    const created = await createStoreOffer({
      store_id: activeStoreId,
      title: newOffer.title || newOffer.title_ar,
      title_ar: newOffer.title_ar,
      description: newOffer.description,
      description_ar: newOffer.description_ar,
      offer_type: 'BUNDLE',
      bundle_buy_qty: Number(newOffer.bundle_buy_qty),
      bundle_price: Number(newOffer.bundle_price),
      discount_pct: Number(newOffer.discount_pct),
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
  }

  // Handle Delete Offer
  const handleDeleteOffer = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل تريد حذف هذا العرض؟' : 'Delete this offer?')) return
    await deleteStoreOffer(id)
    setOffers(prev => prev.filter(o => o.id !== id))
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
      event_type: 'SIGNING',
      starts_at: newEvent.starts_at,
      location: newEvent.location,
      max_attendees: Number(newEvent.max_attendees),
      is_free: true,
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
                    <span className="shrink-0 text-[11px] font-mono opacity-60">waraqconnect.vercel.app/stores/</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-foreground">
                    {lang === 'ar' ? 'رابط شعار المكتبة (Logo URL)' : 'Logo Image URL'}
                  </label>
                  <input
                    type="url"
                    value={profileForm.logo_url}
                    onChange={e => setProfileForm(prev => ({ ...prev, logo_url: e.target.value }))}
                    className="w-full bg-muted/40 border-2 border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-foreground">
                    {lang === 'ar' ? 'رابط غلاف المكتبة (Cover Image URL)' : 'Cover Image URL'}
                  </label>
                  <input
                    type="url"
                    value={profileForm.cover_url}
                    onChange={e => setProfileForm(prev => ({ ...prev, cover_url: e.target.value }))}
                    className="w-full bg-muted/40 border-2 border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Location & Map Section */}
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
                <label className="text-xs font-black text-foreground">
                  {lang === 'ar' ? 'العنوان التفصيلي' : 'Detailed Address'} *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.address}
                  onChange={e => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full bg-muted/40 border-2 border-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                  placeholder="مثال: 159 شارع 26 يوليو، الزمالك، القاهرة"
                />
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

            {/* Working Hours & Social Media Channels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Working Hours Card */}
              <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-4">
                <h2 className="text-base font-black text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{lang === 'ar' ? 'ساعات ومواعيد العمل' : 'Opening Hours'}</span>
                </h2>

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

              <Button
                onClick={() => setIsAddBookModalOpen(true)}
                className="rounded-2xl font-black text-xs gap-2 shadow-md shadow-primary/25 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{lang === 'ar' ? 'إضافة كتاب جديد للمكتبة' : 'Add New Book'}</span>
              </Button>
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
              {offers.map(offer => (
                <div
                  key={offer.id}
                  className="rounded-3xl border-2 border-border/80 bg-card overflow-hidden shadow-xs p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {offer.bundle_buy_qty && (
                          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-primary text-primary-foreground">
                            {offer.bundle_buy_qty} {lang === 'ar' ? 'كتب' : 'books bundle'}
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

                    <h3 className="text-base font-black text-foreground">
                      {lang === 'ar' && offer.title_ar ? offer.title_ar : offer.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {lang === 'ar' && offer.description_ar ? offer.description_ar : offer.description}
                    </p>

                    {offer.gift_description && (
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        <Gift className="h-4 w-4 shrink-0 text-amber-600" />
                        <span>{offer.gift_description}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold block">
                        {lang === 'ar' ? 'سعر الحزمة:' : 'Bundle Price:'}
                      </span>
                      <span className="text-lg font-black text-foreground">{offer.bundle_price} ج.م</span>
                    </div>

                    {offer.promo_code && (
                      <div className="px-3 py-1.5 rounded-xl bg-muted border border-border font-mono text-xs font-bold">
                        كود: {offer.promo_code}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal: Add Offer */}
            {isAddOfferModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                <div className="rounded-3xl border-2 border-border bg-card p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="font-black text-foreground text-sm flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span>{lang === 'ar' ? 'إطلاق باقة كتب أو عرض جديد' : 'Create Book Bundle / Deal'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAddOfferModalOpen(false)}
                      className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAddOffer} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">عنوان العرض أو الباقة *</label>
                      <input
                        type="text"
                        required
                        value={newOffer.title_ar}
                        onChange={e => setNewOffer(prev => ({ ...prev, title_ar: e.target.value }))}
                        className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        placeholder="مثال: باقة الـ 20 رواية الأكثر مبيعاً بخصم 40%"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">عدد الكتب بالحزمة</label>
                        <select
                          value={newOffer.bundle_buy_qty}
                          onChange={e => setNewOffer(prev => ({ ...prev, bundle_buy_qty: Number(e.target.value) }))}
                          className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer"
                        >
                          <option value={10}>10 كتب</option>
                          <option value={20}>20 كتاب</option>
                          <option value={25}>25 كتاب</option>
                          <option value={50}>50 كتاب</option>
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

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">وصف الهدايا المرفقة مع الحزمة 🎁</label>
                      <input
                        type="text"
                        value={newOffer.gift_description}
                        onChange={e => setNewOffer(prev => ({ ...prev, gift_description: e.target.value }))}
                        className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        placeholder="3 فواصل خشبية + مفكرة قراءة..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">تفاصيل العرض</label>
                      <textarea
                        rows={2}
                        value={newOffer.description_ar}
                        onChange={e => setNewOffer(prev => ({ ...prev, description_ar: e.target.value }))}
                        className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                        placeholder="ما تشمله الباقة ومميزات الكتب وشروط الشحن..."
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
                        نشر الباقة الآن
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: EVENTS & SIGNINGS HOST                                  */}
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
                  className="rounded-3xl border-2 border-border/80 bg-card overflow-hidden shadow-xs p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                        {ev.event_type}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="h-8 w-8 p-0 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                        <span>{new Date(ev.starts_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {ev.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{ev.location}</span>
                        </div>
                      )}
                    </div>
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
              ))}
            </div>

            {/* Modal: Add Event */}
            {isAddEventModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                <div className="rounded-3xl border-2 border-border bg-card p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="font-black text-foreground text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      <span>{lang === 'ar' ? 'إضافة فعالية أو حفل توقيع' : 'Schedule Event / Signing'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAddEventModalOpen(false)}
                      className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAddEvent} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">عنوان الفعالية *</label>
                      <input
                        type="text"
                        required
                        value={newEvent.title_ar}
                        onChange={e => setNewEvent(prev => ({ ...prev, title_ar: e.target.value }))}
                        className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        placeholder="مثال: حفل توقيع ومناقشة الرواية الجديدة مع الكاتب..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">المكان / القاعة</label>
                        <input
                          type="text"
                          value={newEvent.location}
                          onChange={e => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                          placeholder="حديقة فرع الزمالك"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground">الحد الأقصى للمقاعد</label>
                        <input
                          type="number"
                          value={newEvent.max_attendees}
                          onChange={e => setNewEvent(prev => ({ ...prev, max_attendees: Number(e.target.value) }))}
                          className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">وصف الفعالية وتفاصيل الحضور</label>
                      <textarea
                        rows={2}
                        value={newEvent.description_ar}
                        onChange={e => setNewEvent(prev => ({ ...prev, description_ar: e.target.value }))}
                        className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                        placeholder="محاور النقاش، موعد التوقيع..."
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
                      <Button type="submit" className="rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                        نشر الفعالية الآن
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
