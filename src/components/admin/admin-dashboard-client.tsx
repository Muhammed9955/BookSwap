'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, BookOpen, ShoppingBag, AlertTriangle, Star, TrendingUp,
  BarChart2, Shield, Eye, EyeOff, Trash2, CheckCircle2, Clock,
  Edit3, MapPin, Search, Plus, X, Check, Coffee, Building,
  Smartphone, Download, ExternalLink, Activity, Calendar, ArrowUpRight,
  Store, Globe, Menu, MessageCircle, CheckCheck, Mail,
  ShieldCheck, Video, BadgeCheck, FileText, CheckSquare, Sparkles, Share2,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import type { DashboardStats, Community, CommunityOrgType } from '@/types'
import type { StoreApplication, StoreApplicationStatus, Bookstore, StoreType } from '@/types/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/i18n/language-context'
import { createClient } from '@/lib/supabase/client'
import { cn, formatRelativeTime } from '@/lib/utils'
import { updateCommunityDetails, deleteCommunity } from '@/lib/communities/community-service'
import {
  getStoreApplications, approveStoreApplication, rejectStoreApplication, getBookstores,
  toggleStoreActive, toggleStoreVerified, deleteBookstore, updateBookstore
} from '@/lib/stores/store-service'
import { WaraqLogo } from '@/components/ui/waraq-logo'

interface AdminDashboardClientProps {
  stats: DashboardStats
  recentListings: Array<Record<string, unknown>>
  recentReports: Array<Record<string, unknown>>
  recentUsers: Array<Record<string, unknown>>
  adminRole: string
  initialCommunities?: Community[]
  currentUserId?: string
}

const navItems = [
  { id: 'overview', labelAr: 'نظرة عامة', labelEn: 'Overview', icon: BarChart2 },
  { id: 'stores', labelAr: 'المكتبات والمتاجر والطلبات', labelEn: 'Stores & Requests', icon: Store },
  { id: 'analytics', labelAr: 'المستخدمون والاحتفاظ', labelEn: 'Active Users & Retention', icon: TrendingUp },
  { id: 'communities', labelAr: 'المجتمعات ونوادي القراءة', labelEn: 'Communities & Clubs', icon: Users },
  { id: 'listings', labelAr: 'الإعلانات والكتب', labelEn: 'Listings & Catalog', icon: BookOpen },
  { id: 'users', labelAr: 'إدارة المستخدمين', labelEn: 'User Management', icon: Shield },
  { id: 'reports', labelAr: 'البلاغات والنزاعات', labelEn: 'Dispute Reports', icon: AlertTriangle },
]

export function AdminDashboardClient({
  stats,
  recentListings,
  recentReports,
  recentUsers,
  adminRole,
  initialCommunities = [],
  currentUserId,
}: AdminDashboardClientProps) {
  const { lang, setLang, isRTL } = useLanguage()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('waraq_admin_sidebar_collapsed')
      if (saved !== null) {
        setSidebarCollapsed(saved === 'true')
      }
    } catch {}
  }, [])

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem('waraq_admin_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }

  // Store applications & Active Stores
  const [storeApps, setStoreApps] = useState<StoreApplication[]>([])
  const [activeStores, setActiveStores] = useState<Bookstore[]>([])
  const [appsLoading, setAppsLoading] = useState(true)
  const [storesLoading, setStoresLoading] = useState(true)
  const [storeSubTab, setStoreSubTab] = useState<'REQUESTS' | 'ACTIVE_STORES' | 'VERIFICATION_GUIDE'>('REQUESTS')
  const [appSearch, setAppSearch] = useState('')
  const [appStatusFilter, setAppStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [storeTypeFilter, setStoreTypeFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE' | 'BOTH'>('ALL')
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null)
  const [inspectingApp, setInspectingApp] = useState<StoreApplication | null>(null)
  const [inspectingStore, setInspectingStore] = useState<Bookstore | null>(null)

  useEffect(() => {
    // 1. Initial Load of applications and bookstores
    getStoreApplications().then(apps => {
      setStoreApps(apps)
      setAppsLoading(false)
    })
    getBookstores({ includeInactive: true }).then(stores => {
      setActiveStores(stores)
      setStoresLoading(false)
    })

    // 2. Realtime Subscription on partner_requests (Store join applications)
    const requestsChannel = supabase
      .channel('realtime-partner-requests-admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_requests',
        },
        async (payload) => {
          // Instantly refresh requests list in realtime
          const updatedApps = await getStoreApplications()
          setStoreApps(updatedApps)

          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as any
            const storeTitle = newRecord?.business_name || newRecord?.name || 'متجر جديد'
            setApprovalFeedback(
              lang === 'ar'
                ? `⚡ طلب انضمام جديد وصل في الوقت الفعلي: "${storeTitle}"`
                : `⚡ Realtime update: New partner application received: "${storeTitle}"`
            )
            setTimeout(() => setApprovalFeedback(null), 6000)
          }
        }
      )
      .subscribe()

    // 3. Realtime Subscription on bookstores (Active verified stores)
    const storesChannel = supabase
      .channel('realtime-bookstores-admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookstores',
        },
        async () => {
          const freshStores = await getBookstores({ includeInactive: true })
          setActiveStores(freshStores)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(requestsChannel)
      supabase.removeChannel(storesChannel)
    }
  }, [lang, supabase])

  const handleApproveStore = async (appId: string) => {
    const targetApp = storeApps.find(a => a.id === appId)
    const storeDisplayName = targetApp?.store_name_ar || targetApp?.store_name || targetApp?.business_name || 'المتجر'

    // Confirmation dialog before approving & dispatching
    const confirmed = window.confirm(
      lang === 'ar'
        ? `هل أنت متأكد من اعتماد وتوثيق متجر "${storeDisplayName}"؟\n\nعند التأكيد سيتم:\n1. اعتماد وتفعيل صفحة المتجر ومنحه شارة التوثيق 🟢\n2. ترقية حساب المستخدم لصلاحية تاجر (PARTNER) لتمكينه من لوحة التحكم\n3. إرسال إشعار فوري بحسابه يوجهه مباشرة لإضافة الكتب\n4. إرسال بريد إلكتروني ترحيبي يحتوي على رابط لوحة التحكم وإرشادات باقات التوفير`
        : `Are you sure you want to approve & verify "${storeDisplayName}"?\n\nThis will:\n1. Verify and activate the store\n2. Elevate user account role to PARTNER for instant dashboard access\n3. Send an in-app notification directing to /stores/dashboard\n4. Send an official approval email with next steps & bundle package guidelines`
    )
    if (!confirmed) return

    setApprovingId(appId)
    const result = await approveStoreApplication(appId)
    if (result.success) {
      setStoreApps(prev =>
        prev.map(a =>
          a.id === appId
            ? { ...a, status: 'APPROVED' as const, reviewed_at: new Date().toISOString(), approved_store_id: result.store?.id }
            : a
        )
      )
      if (result.store) {
        setActiveStores(prev => [result.store!, ...prev.filter(s => s.id !== result.store!.id)])
      }

      setApprovalFeedback(
        lang === 'ar'
          ? `🎉 تم اعتماد وتوثيق ${result.store?.name_ar || result.store?.name} بنجاح! تم إنشاء صفحة المتجر، ترقية صلاحيات المالك، وإرسال رابط لوحة التحكم عبر الإيميل والإشعار الداخلي.`
          : `🎉 ${result.store?.name} has been approved & verified! Storefront created, permissions upgraded, and activation email/notification sent.`
      )
      if (inspectingApp?.id === appId) {
        setInspectingApp(null)
      }
      setTimeout(() => setApprovalFeedback(null), 5000)
    }
    setApprovingId(null)
  }

  const [storeActionLoading, setStoreActionLoading] = useState<string | null>(null)

  const handleToggleStoreActive = async (storeId: string, currentActive: boolean) => {
    const nextActive = !currentActive
    const store = activeStores.find(s => s.id === storeId)
    const storeName = store?.name_ar || store?.name || 'المتجر'

    const confirmMsg = nextActive
      ? (lang === 'ar' ? `هل ترغب في إعادة إظهار وتفعيل متجر "${storeName}" ليظهر للقراء في الدليل والبحث؟` : `Unhide & activate "${storeName}" in directory?`)
      : (lang === 'ar' ? `هل أنت متأكد من إخفاء متجر "${storeName}"؟ لن يظهر للقراء في الدليل العام أو نتائج البحث، ولكن ستبقى بياناته محفوظة.` : `Hide "${storeName}" from public directory?`)

    if (!window.confirm(confirmMsg)) return

    setStoreActionLoading(storeId)
    const res = await toggleStoreActive(storeId, nextActive)
    if (res.success) {
      setActiveStores(prev =>
        prev.map(s => (s.id === storeId ? { ...s, is_active: nextActive } : s))
      )
      if (inspectingStore?.id === storeId) {
        setInspectingStore(prev => prev ? { ...prev, is_active: nextActive } : null)
      }
      setApprovalFeedback(
        lang === 'ar'
          ? (nextActive ? `✅ تم تفعيل وإظهار ${storeName} في الدليل العام بنجاح` : `👁️‍🗨️ تم إخفاء ${storeName} من الدليل العام`)
          : (nextActive ? `✅ "${storeName}" is now active & visible in directory` : `👁️‍🗨️ "${storeName}" is now hidden from public view`)
      )
      setTimeout(() => setApprovalFeedback(null), 4000)
    }
    setStoreActionLoading(null)
  }

  const handleToggleStoreVerified = async (storeId: string, currentVerified: boolean) => {
    const nextVerified = !currentVerified
    const store = activeStores.find(s => s.id === storeId)
    const storeName = store?.name_ar || store?.name || 'المتجر'

    setStoreActionLoading(storeId)
    const res = await toggleStoreVerified(storeId, nextVerified)
    if (res.success) {
      setActiveStores(prev =>
        prev.map(s => (s.id === storeId ? { ...s, is_verified: nextVerified } : s))
      )
      if (inspectingStore?.id === storeId) {
        setInspectingStore(prev => prev ? { ...prev, is_verified: nextVerified } : null)
      }
      setApprovalFeedback(
        lang === 'ar'
          ? (nextVerified ? `🟢 تم منح شارة التوثيق لـ ${storeName}` : `⚪ تم إزالة شارة التوثيق عن ${storeName}`)
          : (nextVerified ? `🟢 "${storeName}" verified badge granted` : `⚪ "${storeName}" verified badge removed`)
      )
      setTimeout(() => setApprovalFeedback(null), 4000)
    }
    setStoreActionLoading(null)
  }

  const handleDeleteStore = async (storeId: string, storeName?: string) => {
    const displayName = storeName || (activeStores.find(s => s.id === storeId)?.name_ar || activeStores.find(s => s.id === storeId)?.name || 'المتجر')
    const promptConfirm = window.confirm(
      lang === 'ar'
        ? `⚠️ تحذير نهائي:\nهل أنت متأكد من حذف متجر "${displayName}" نهائياً من المنصة وقاعدة البيانات؟\n\nهذا الإجراء لا يمكن التراجع عنه وسيتم إزالة المتجر نهائياً.`
        : `⚠️ Danger:\nPermanently delete bookstore "${displayName}" from database?\nThis action cannot be undone.`
    )
    if (!promptConfirm) return

    setStoreActionLoading(storeId)
    const res = await deleteBookstore(storeId)
    if (res.success) {
      setActiveStores(prev => prev.filter(s => s.id !== storeId))
      if (inspectingStore?.id === storeId) {
        setInspectingStore(null)
      }
      setApprovalFeedback(
        lang === 'ar'
          ? `🗑️ تم حذف متجر ${storeName} نهائياً بنجاح`
          : `🗑️ Store "${storeName}" deleted permanently`
      )
      setTimeout(() => setApprovalFeedback(null), 5000)
    }
    setStoreActionLoading(null)
  }

  // Edit Bookstore Modal State
  const [editingStore, setEditingStore] = useState<Bookstore | null>(null)
  const [editStoreForm, setEditStoreForm] = useState<{
    name: string
    name_ar: string
    store_type: StoreType
    address: string
    slogan: string
    description_ar: string
    whatsapp: string
    facebook: string
    instagram: string
    website_url: string
    is_active: boolean
    is_verified: boolean
  }>({
    name: '',
    name_ar: '',
    store_type: 'ONLINE',
    address: '',
    slogan: '',
    description_ar: '',
    whatsapp: '',
    facebook: '',
    instagram: '',
    website_url: '',
    is_active: true,
    is_verified: false,
  })
  const [isSavingStore, setIsSavingStore] = useState(false)

  const handleOpenEditStore = (store: Bookstore) => {
    setEditingStore(store)
    setEditStoreForm({
      name: store.name || '',
      name_ar: store.name_ar || store.name || '',
      store_type: store.store_type || 'ONLINE',
      address: store.address || '',
      slogan: store.slogan || '',
      description_ar: store.description_ar || store.description || '',
      whatsapp: store.social_links?.whatsapp || '',
      facebook: store.social_links?.facebook || '',
      instagram: store.social_links?.instagram || '',
      website_url: store.website_url || '',
      is_active: store.is_active !== false,
      is_verified: Boolean(store.is_verified),
    })
  }

  const handleSaveStoreEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStore) return
    setIsSavingStore(true)
    try {
      const updates: Partial<Bookstore> = {
        name: editStoreForm.name.trim(),
        name_ar: editStoreForm.name_ar.trim() || editStoreForm.name.trim(),
        store_type: editStoreForm.store_type,
        address: editStoreForm.address.trim(),
        slogan: editStoreForm.slogan.trim(),
        description: editStoreForm.description_ar.trim(),
        description_ar: editStoreForm.description_ar.trim(),
        website_url: editStoreForm.website_url.trim() || undefined,
        social_links: {
          whatsapp: editStoreForm.whatsapp.trim() || undefined,
          facebook: editStoreForm.facebook.trim() || undefined,
          instagram: editStoreForm.instagram.trim() || undefined,
        },
        is_active: editStoreForm.is_active,
        is_verified: editStoreForm.is_verified,
      }
      const res = await updateBookstore(editingStore.id, updates)
      if (res && res.id) {
        setActiveStores(prev =>
          prev.map(s => (s.id === editingStore.id ? { ...s, ...updates } : s))
        )
        if (inspectingStore?.id === editingStore.id) {
          setInspectingStore(prev => prev ? { ...prev, ...updates } : null)
        }
        setApprovalFeedback(
          lang === 'ar'
            ? `✅ تم حفظ وتحديث بيانات متجر "${updates.name_ar || updates.name}" بنجاح`
            : `✅ Store "${updates.name}" updated successfully`
        )
        setTimeout(() => setApprovalFeedback(null), 4000)
        setEditingStore(null)
      } else {
        alert(lang === 'ar' ? 'فشل حفظ التعديلات' : 'Failed to save store changes')
      }
    } finally {
      setIsSavingStore(false)
    }
  }

  const handleRejectStore = async (appId: string) => {
    const reason = prompt(
      lang === 'ar' ? 'سبب الرفض (اختياري):' : 'Rejection reason (optional):',
      lang === 'ar' ? 'عدم استيفاء شروط المكتبات الشريكة حالياً' : 'Does not meet partner criteria currently'
    )
    if (reason === null) return
    const result = await rejectStoreApplication(appId, reason)
    if (result.success) {
      setStoreApps(prev =>
        prev.map(a =>
          a.id === appId
            ? { ...a, status: 'REJECTED' as const, reviewed_at: new Date().toISOString(), rejection_reason: reason }
            : a
        )
      )
      if (inspectingApp?.id === appId) {
        setInspectingApp(null)
      }
    }
  }

  const pendingStoresCount = storeApps.filter(a => a.status === 'PENDING').length

  const filteredStoreApps = storeApps.filter(app => {
    const matchesStatus = appStatusFilter === 'ALL' || app.status === appStatusFilter
    const appType: StoreType = app.is_online_only || app.store_type === 'ONLINE' ? 'ONLINE' : (app.store_type || 'BOTH')
    const matchesType = storeTypeFilter === 'ALL' || appType === storeTypeFilter
    const q = appSearch.trim().toLowerCase()
    if (!q) return matchesStatus && matchesType
    const matchesSearch =
      (app.store_name && app.store_name.toLowerCase().includes(q)) ||
      (app.store_name_ar && app.store_name_ar.toLowerCase().includes(q)) ||
      (app.business_name && app.business_name.toLowerCase().includes(q)) ||
      (app.owner_name && app.owner_name.toLowerCase().includes(q)) ||
      (app.city && app.city.toLowerCase().includes(q)) ||
      (app.address && app.address.toLowerCase().includes(q)) ||
      (app.phone && app.phone.includes(q))
    return matchesStatus && matchesType && matchesSearch
  })

  const [storeActiveFilter, setStoreActiveFilter] = useState<'ALL' | 'ACTIVE' | 'HIDDEN'>('ALL')

  const filteredActiveStores = activeStores.filter(store => {
    const matchesType = storeTypeFilter === 'ALL' || store.store_type === storeTypeFilter
    const matchesActive =
      storeActiveFilter === 'ALL' ||
      (storeActiveFilter === 'ACTIVE' && store.is_active !== false) ||
      (storeActiveFilter === 'HIDDEN' && store.is_active === false)
    const q = appSearch.trim().toLowerCase()
    if (!q) return matchesType && matchesActive
    const matchesSearch =
      store.name.toLowerCase().includes(q) ||
      (store.name_ar && store.name_ar.toLowerCase().includes(q)) ||
      (store.address && store.address.toLowerCase().includes(q)) ||
      store.slug.toLowerCase().includes(q)
    return matchesType && matchesActive && matchesSearch
  })

  const [communities, setCommunities] = useState<Community[]>(initialCommunities)
  const [commSearch, setCommSearch] = useState('')
  const [commTypeFilter, setCommTypeFilter] = useState('ALL')

  // Edit community modal state
  const [editingComm, setEditingComm] = useState<Community | null>(null)
  const [editForm, setEditForm] = useState<{
    name: string
    name_ar: string
    location_text: string
    description_ar: string
    org_type: CommunityOrgType
    hub_name: string
    hub_address: string
    hub_instructions: string
    cover_image_url: string
    requires_approval: boolean
  }>({
    name: '',
    name_ar: '',
    location_text: '',
    description_ar: '',
    org_type: 'CLUB',
    hub_name: '',
    hub_address: '',
    hub_instructions: '',
    cover_image_url: '',
    requires_approval: false,
  })
  const [isSavingComm, setIsSavingComm] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  // Delete community modal state
  const [deletingComm, setDeletingComm] = useState<Community | null>(null)
  const [isDeletingComm, setIsDeletingComm] = useState(false)

  const handleOpenEdit = (comm: Community) => {
    setEditingComm(comm)
    setEditForm({
      name: comm.name || '',
      name_ar: comm.name_ar || '',
      location_text: comm.location_text || '',
      description_ar: comm.description_ar || comm.description || '',
      org_type: (comm.org_type || 'CLUB') as CommunityOrgType,
      hub_name: comm.hub_name || '',
      hub_address: comm.hub_address || '',
      hub_instructions: comm.hub_instructions || '',
      cover_image_url: comm.cover_image_url || comm.banner_url || '',
      requires_approval: Boolean(comm.requires_approval || comm.is_private),
    })
    setSaveSuccessMsg(null)
  }

  const handleSaveCommunity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingComm) return
    setIsSavingComm(true)
    try {
      const updates: Partial<Community> = {
        name: editForm.name,
        name_ar: editForm.name_ar,
        location_text: editForm.location_text?.trim() || undefined,
        description: editForm.description_ar,
        description_ar: editForm.description_ar,
        org_type: editForm.org_type,
        hub_name: editForm.hub_name,
        hub_address: editForm.hub_address,
        hub_instructions: editForm.hub_instructions,
        cover_image_url: editForm.cover_image_url,
        banner_url: editForm.cover_image_url,
        requires_approval: editForm.requires_approval,
        is_private: editForm.requires_approval,
      }
      const ok = await updateCommunityDetails(editingComm.id, updates)
      if (ok) {
        setCommunities(prev =>
          prev.map(c => (c.id === editingComm.id ? { ...c, ...updates } : c))
        )
        setSaveSuccessMsg(lang === 'ar' ? 'تم حفظ التعديلات بنجاح!' : 'Community updated successfully!')
        setTimeout(() => {
          setEditingComm(null)
          setSaveSuccessMsg(null)
        }, 1200)
      } else {
        alert(lang === 'ar' ? 'حدث خطأ أثناء حفظ التعديلات' : 'Failed to save changes')
      }
    } finally {
      setIsSavingComm(false)
    }
  }

  const handleDeleteCommunityAdmin = async () => {
    if (!deletingComm) return
    setIsDeletingComm(true)
    try {
      const ok = await deleteCommunity(deletingComm.id, currentUserId, true)
      if (ok) {
        setCommunities(prev => prev.filter(c => c.id !== deletingComm.id))
        setDeletingComm(null)
      } else {
        alert(lang === 'ar' ? 'فشل حذف المجتمع' : 'Failed to delete community')
      }
    } finally {
      setIsDeletingComm(false)
    }
  }

  const filteredCommunities = communities.filter(c => {
    const matchesType = commTypeFilter === 'ALL' || c.org_type === commTypeFilter
    const q = commSearch.trim().toLowerCase()
    if (!q) return matchesType
    const matchesSearch =
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.name_ar && c.name_ar.toLowerCase().includes(q)) ||
      (c.hub_name && c.hub_name.toLowerCase().includes(q)) ||
      (c.hub_address && c.hub_address.toLowerCase().includes(q))
    return matchesType && matchesSearch
  })

  const kpis: Array<{
    labelAr: string
    labelEn: string
    value: string | number
    icon: any
    color: string
    subtextAr?: string
    subtextEn?: string
  }> = [
    {
      labelAr: 'مستخدمون فريدون',
      labelEn: 'Unique Users',
      value: stats.total_users,
      icon: Users,
      color: 'text-blue-500',
      subtextAr: `+${stats.new_users_today || 0} اليوم`,
      subtextEn: `+${stats.new_users_today || 0} today`,
    },
    {
      labelAr: 'نشطون اليوم (DAU)',
      labelEn: 'Daily Active (DAU)',
      value: stats.dau || stats.active_users,
      icon: Activity,
      color: 'text-emerald-500',
      subtextAr: 'آخر 24 ساعة',
      subtextEn: 'Last 24 hours',
    },
    {
      labelAr: 'نشطون شهرياً (MAU)',
      labelEn: 'Monthly Active (MAU)',
      value: stats.mau || stats.total_users,
      icon: TrendingUp,
      color: 'text-teal-500',
      subtextAr: 'آخر 30 يوماً',
      subtextEn: 'Last 30 days',
    },
    {
      labelAr: 'معدل الاحتفاظ والتفاعل',
      labelEn: 'Stickiness Ratio',
      value: `${stats.stickiness_ratio || 0}%`,
      icon: Star,
      color: 'text-amber-500',
      subtextAr: 'DAU / MAU',
      subtextEn: 'DAU / MAU',
    },
    {
      labelAr: 'الإعلانات النشطة',
      labelEn: 'Active Listings',
      value: stats.active_listings,
      icon: BookOpen,
      color: 'text-green-500',
      subtextAr: `من ${stats.total_listings}`,
      subtextEn: `of ${stats.total_listings}`,
    },
    {
      labelAr: 'المعاملات',
      labelEn: 'Transactions',
      value: stats.total_transactions,
      icon: ShoppingBag,
      color: 'text-purple-500',
      subtextAr: `${stats.completed_transactions} مكتملة`,
      subtextEn: `${stats.completed_transactions} done`,
    },
  ]

  const hideListing = async (id: string) => {
    setActionLoading(id)
    await supabase.from('book_listings').update({ status: 'HIDDEN' }).eq('id', id)
    setActionLoading(null)
    window.location.reload()
  }

  const resolveReport = async (id: string) => {
    setActionLoading(id)
    await supabase.from('reports').update({ status: 'RESOLVED' }).eq('id', id)
    setActionLoading(null)
    window.location.reload()
  }

  const suspendUser = async (id: string) => {
    setActionLoading(id)
    await supabase.from('profiles').update({ is_suspended: true }).eq('id', id)
    setActionLoading(null)
    window.location.reload()
  }

  const featureListing = async (id: string) => {
    setActionLoading(id)
    const endsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('book_listings').update({
      is_featured: true,
      featured_until: endsAt,
    }).eq('id', id)
    setActionLoading(null)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background flex text-foreground" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar - In RTL dir="rtl", flex places this on the RIGHT; in LTR, on the LEFT */}
      <aside
        className={cn(
          "flex-shrink-0 border-e border-border bg-card hidden md:flex flex-col select-none transition-all duration-300 ease-in-out relative z-30",
          sidebarCollapsed ? "w-20" : "w-72"
        )}
      >
        <div
          className={cn(
            "border-b flex items-center transition-all",
            sidebarCollapsed ? "p-3 flex-col gap-2 justify-center" : "px-4 py-3.5 justify-between"
          )}
        >
          {!sidebarCollapsed ? (
            <Link href="/" className="flex items-center gap-2 min-w-0 hover:opacity-90 transition-opacity">
              <WaraqLogo size="sm" showText={true} href={null} />
            </Link>
          ) : (
            <Link
              href="/"
              className="flex items-center justify-center p-1 rounded-xl hover:bg-accent transition-colors"
              title="WaraqConnect Admin"
            >
              <WaraqLogo size="xs" showText={false} href={null} />
            </Link>
          )}

          {/* Shrink / Expand Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-border/60 hover:border-primary/50 shadow-2xs shrink-0"
            title={
              sidebarCollapsed
                ? lang === 'ar'
                  ? 'توسيع القائمة الجانبية'
                  : 'Expand Sidebar'
                : lang === 'ar'
                ? 'تصغير القائمة الجانبية'
                : 'Shrink Sidebar'
            }
            aria-label="Toggle Sidebar"
          >
            {sidebarCollapsed ? (
              isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className={cn("p-2.5 flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden", sidebarCollapsed && "px-2")}>
          {navItems.map(item => {
            const hasPendingStores = item.id === 'stores' && pendingStoresCount > 0
            const hasPendingReports = item.id === 'reports' && stats.pending_reports > 0
            const label = lang === 'ar' ? item.labelAr : item.labelEn

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={label}
                className={cn(
                  'w-full flex items-center rounded-xl text-xs font-bold transition-all cursor-pointer relative group',
                  sidebarCollapsed
                    ? 'justify-center p-3 text-center'
                    : 'gap-3 px-3 py-2.5 text-start',
                  activeTab === item.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className={cn("shrink-0", sidebarCollapsed ? "h-5 w-5" : "h-4 w-4")} />

                {!sidebarCollapsed && (
                  <>
                    <span className="truncate">{label}</span>
                    {hasPendingStores && (
                      <span
                        className={cn(
                          "ms-auto px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none shrink-0",
                          activeTab === 'stores' ? "bg-white text-primary" : "bg-amber-500 text-white animate-pulse"
                        )}
                      >
                        {pendingStoresCount}
                      </span>
                    )}
                    {hasPendingReports && (
                      <span
                        className={cn(
                          "ms-auto h-4 min-w-4 px-1 rounded-full text-[10px] flex items-center justify-center font-black shrink-0",
                          activeTab === 'reports' ? "bg-white text-destructive" : "bg-red-500 text-white"
                        )}
                      >
                        {stats.pending_reports}
                      </span>
                    )}
                  </>
                )}

                {/* Collapsed notification dots/badges */}
                {sidebarCollapsed && hasPendingStores && (
                  <span className="absolute top-1.5 end-1.5 h-4 min-w-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
                    {pendingStoresCount}
                  </span>
                )}
                {sidebarCollapsed && hasPendingReports && (
                  <span className="absolute top-1.5 end-1.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                    {stats.pending_reports}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div
          className={cn(
            "border-t bg-muted/20 transition-all",
            sidebarCollapsed ? "p-2 space-y-2 flex flex-col items-center" : "p-4 space-y-2"
          )}
        >
          {!sidebarCollapsed ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                className="w-full justify-center gap-2 text-xs font-bold border-border/80 hover:border-primary/50 cursor-pointer"
              >
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span>{lang === 'ar' ? 'English (EN)' : 'العربية (AR)'}</span>
              </Button>
              <Badge variant={adminRole === 'ADMIN' ? 'default' : 'secondary'} className="w-full justify-center py-1">
                <Shield className="h-3 w-3 me-1" />
                {adminRole}
              </Badge>
            </>
          ) : (
            <>
              <button
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                className="p-2.5 rounded-xl border border-border/80 hover:border-primary/50 bg-card hover:bg-accent text-foreground transition-all cursor-pointer shadow-2xs"
                title={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
              >
                <Globe className="h-4 w-4 text-primary" />
              </button>
              <div
                className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs"
                title={`Admin Role: ${adminRole}`}
              >
                <Shield className="h-4 w-4" />
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              "fixed top-0 bottom-0 w-72 bg-card p-5 shadow-2xl flex flex-col border-border animate-in",
              isRTL ? "right-0 border-s slide-in-from-right" : "left-0 border-e slide-in-from-left"
            )}
          >
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-2">
                <WaraqLogo size="sm" showText={true} />
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">Admin</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="py-4 space-y-1 flex-1 overflow-y-auto">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors text-start cursor-pointer',
                    activeTab === item.id ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{lang === 'ar' ? item.labelAr : item.labelEn}</span>
                  {item.id === 'stores' && pendingStoresCount > 0 && (
                    <span className="ms-auto px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                      {pendingStoresCount}
                    </span>
                  )}
                  {item.id === 'reports' && stats.pending_reports > 0 && (
                    <span className="ms-auto h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-black">
                      {stats.pending_reports}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="pt-4 border-t space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLang(lang === 'ar' ? 'en' : 'ar')
                  setMobileMenuOpen(false)
                }}
                className="w-full justify-center gap-2 text-xs font-bold"
              >
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span>{lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}</span>
              </Button>
              <Badge variant={adminRole === 'ADMIN' ? 'default' : 'secondary'} className="w-full justify-center py-1">
                <Shield className="h-3 w-3 me-1" />
                {adminRole}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Sticky Top Header */}
        <div className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Navigation Drawer Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl border border-border bg-card hover:bg-accent text-foreground cursor-pointer shadow-xs"
              aria-label="Toggle Navigation"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Desktop Sidebar Shrink / Expand Toggle */}
            <button
              onClick={toggleSidebar}
              className="hidden md:inline-flex p-2 rounded-xl border border-border bg-card hover:bg-accent text-foreground cursor-pointer shadow-2xs transition-colors shrink-0"
              title={
                sidebarCollapsed
                  ? lang === 'ar'
                    ? 'توسيع القائمة الجانبية'
                    : 'Expand Sidebar'
                  : lang === 'ar'
                  ? 'تصغير القائمة الجانبية'
                  : 'Shrink Sidebar'
              }
              aria-label="Toggle Sidebar"
            >
              {sidebarCollapsed ? (
                isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
              ) : (
                isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
              )}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-foreground">
                  {lang === 'ar' ? 'لوحة تحكم منصة ورق كونكت' : 'WaraqConnect Admin Platform'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {lang === 'ar' ? 'مباشر' : 'Live'}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                {lang === 'ar'
                  ? 'إدارة المنصة، اعتماد المكتبات الشريكة، المجتمعات والتقارير'
                  : 'Partner store approvals, reading clubs, catalog & dispute reports'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingStoresCount > 0 && (
              <button
                onClick={() => setActiveTab('stores')}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-all cursor-pointer animate-pulse"
              >
                <Store className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>{lang === 'ar' ? `${pendingStoresCount} طلب مكتبة جديد` : `${pendingStoresCount} new store requests`}</span>
              </button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="gap-1.5 text-xs font-bold border-border hover:border-primary/60 cursor-pointer shadow-xs rounded-xl"
              title={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            >
              <Globe className="h-3.5 w-3.5 text-primary" />
              <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
            </Button>

            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1 text-xs font-medium cursor-pointer rounded-xl">
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{lang === 'ar' ? 'الموقع العام' : 'Public Site'}</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6 flex-1">
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Alert Banner for Pending Bookstore Applications */}
              {pendingStoresCount > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-foreground">
                        {lang === 'ar'
                          ? `يوجد ${pendingStoresCount} طلب انضمام لمكتبة شريكة بحاجة للاعتماد`
                          : `${pendingStoresCount} bookstore partner application(s) awaiting your approval`}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lang === 'ar'
                          ? 'راجع بيانات السجل والتواصل ثم اعتمد المكتبة بضغطة زر لنشرها فوراً في دليل /stores.'
                          : 'Review commercial details, chat on WhatsApp, and approve with one click to publish live.'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab('stores')}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 shrink-0 cursor-pointer shadow-xs rounded-xl"
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'مراجعة واعتماد الطلبات الآن' : 'Review & Approve Now'}</span>
                  </Button>
                </div>
              )}
              {/* KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {kpis.map(kpi => (
                  <Card key={kpi.labelEn} className="stat-card">
                    <CardContent className="p-4">
                      <div className={cn('mb-2', kpi.color)}>
                        <kpi.icon className="h-5 w-5" />
                      </div>
                      <p className="text-2xl font-extrabold">
                        {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lang === 'ar' ? kpi.labelAr : kpi.labelEn}
                      </p>
                      {(kpi.subtextAr || kpi.subtextEn) && (
                        <p className="text-[10px] text-muted-foreground/75 mt-0.5 font-medium">
                          {lang === 'ar' ? kpi.subtextAr : kpi.subtextEn}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Listings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {lang === 'ar' ? 'آخر الإعلانات' : 'Recent Listings'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentListings.slice(0, 5).map((listing: Record<string, unknown>) => (
                      <div key={listing.id as string} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {(listing.book as Record<string, string>)?.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(listing.seller as Record<string, string>)?.full_name} • {formatRelativeTime(listing.created_at as string, lang)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ms-3">
                          <Badge variant="muted" className="text-[10px]">{listing.listing_type as string}</Badge>
                          <Button size="icon-sm" variant="ghost" onClick={() => hideListing(listing.id as string)} disabled={actionLoading === listing.id as string}>
                            {listing.status === 'HIDDEN' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => featureListing(listing.id as string)} disabled={actionLoading === listing.id as string}>
                            <Star className="h-3.5 w-3.5 text-amber-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Reports */}
              {stats.pending_reports > 0 && (
                <Card className="border-red-200 dark:border-red-900/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      {lang === 'ar' ? 'بلاغات معلقة' : 'Pending Reports'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentReports.map((report: Record<string, unknown>) => (
                        <div key={report.id as string} className="flex items-start justify-between py-2 border-b last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{report.report_reason as string}</p>
                            <p className="text-xs text-muted-foreground">
                              {(report.reporter as Record<string, string>)?.full_name} • {formatRelativeTime(report.created_at as string, lang)}
                            </p>
                            {report.description != null && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{String(report.description)}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 ms-2"
                            onClick={() => resolveReport(report.id as string)}
                            disabled={actionLoading === report.id as string}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Unified Stores, Requests & Anti-Spam Verification Tab */}
          {activeTab === 'stores' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Feedback Alert */}
              {approvalFeedback && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{approvalFeedback}</span>
                  </div>
                  <button
                    onClick={() => setApprovalFeedback(null)}
                    className="p-1 rounded-lg hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Header Hero Banner */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-primary/10 via-card to-card border border-border/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-foreground">
                        {lang === 'ar' ? 'إدارة المكتبات والمتاجر والطلبات' : 'Stores, Online Shops & Partner Requests'}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {lang === 'ar' ? 'إدارة موحدة للمتاجر الأونلاين والمقرات الفعلية مع فحص الحسابات ومكافحة السبام' : 'Unified partner directory, online-only stores, and social verification signals'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed pt-1">
                    {lang === 'ar'
                      ? 'جدول موحد لمتابعة طلبات الانضمام والمكتبات المعتمدة في ورق كونكت. تدعم المنصة المكتبات الأونلاين بالكامل (Online-Only) والمكتبات ذات الفروع، مع أدوات للتحقق من حسابات التواصل ومكافحة الحسابات الوهمية.'
                      : 'Unified directory for partner applications and live bookstores. Full support for online-only stores and physical branches with multi-channel verification to eliminate spam.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link href="/stores" target="_blank">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold rounded-xl cursor-pointer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'دليل المكتبات العام' : 'Public Directory'}</span>
                    </Button>
                  </Link>
                  <Link href="/partner" target="_blank">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold rounded-xl cursor-pointer">
                      <Plus className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'نموذج تقديم شريك' : 'Partner Form'}</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Status KPI Metric Cards (4 Metrics) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <Card className={cn(
                  "border transition-all",
                  pendingStoresCount > 0 ? "border-amber-500/40 bg-amber-500/5 shadow-xs" : "border-border"
                )}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">
                        {lang === 'ar' ? 'طلبات قيد الانتظار' : 'Pending Requests'}
                      </p>
                      <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                        {pendingStoresCount}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {lang === 'ar' ? 'بحاجة لمراجعة وإقرار' : 'Awaiting review'}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Clock className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">
                        {lang === 'ar' ? 'متاجر أونلاين فقط' : 'Online-Only Stores'}
                      </p>
                      <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                        {activeStores.filter(s => s.store_type === 'ONLINE').length + storeApps.filter(a => a.is_online_only || a.store_type === 'ONLINE').length}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {lang === 'ar' ? 'شحن لجميع المحافظات' : 'Nationwide shipping'}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Globe className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">
                        {lang === 'ar' ? 'مكتبات بمقرات وفروع' : 'Physical Stores'}
                      </p>
                      <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                        {activeStores.filter(s => s.store_type !== 'ONLINE').length}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {lang === 'ar' ? 'فروع ومساحات قراءة' : 'Walk-in locations'}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Building className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">
                        {lang === 'ar' ? 'إجمالي المتاجر المعتمدة' : 'Active Stores'}
                      </p>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                        {activeStores.length}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {lang === 'ar' ? 'نشطة في دليل المنصة' : 'Verified & Live'}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sub-Tabs: Unified Segmented View Switcher */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border pb-3">
                <div className="inline-flex p-1 rounded-2xl bg-muted/50 border border-border">
                  <button
                    onClick={() => setStoreSubTab('REQUESTS')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                      storeSubTab === 'REQUESTS'
                        ? "bg-card text-foreground shadow-xs border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <span>{lang === 'ar' ? 'طلبات الانضمام والمراجعة' : 'Partner Requests'}</span>
                    {pendingStoresCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                        {pendingStoresCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setStoreSubTab('ACTIVE_STORES')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                      storeSubTab === 'ACTIVE_STORES'
                        ? "bg-card text-foreground shadow-xs border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Store className="h-4 w-4 text-emerald-600" />
                    <span>{lang === 'ar' ? 'المكتبات الشريكة المعتمدة' : 'Active Stores'}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                      {activeStores.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setStoreSubTab('VERIFICATION_GUIDE')}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                      storeSubTab === 'VERIFICATION_GUIDE'
                        ? "bg-card text-foreground shadow-xs border border-border/80"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span>{lang === 'ar' ? 'معايير فحص الموثوقية ومكافحة السبام' : 'Anti-Spam Verification Guide'}</span>
                  </button>
                </div>

                {/* Store Type Filter Pills (Online vs Offline vs Both) */}
                {storeSubTab !== 'VERIFICATION_GUIDE' && (
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {[
                      { id: 'ALL', labelAr: 'الكل', labelEn: 'All Formats' },
                      { id: 'ONLINE', labelAr: '🌐 أونلاين فقط', labelEn: '🌐 Online Only' },
                      { id: 'OFFLINE', labelAr: '📍 فروع ومقرات', labelEn: '📍 Physical' },
                      { id: 'BOTH', labelAr: '🛍️ كلاهما', labelEn: '🛍️ Both' },
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setStoreTypeFilter(f.id as any)}
                        className={cn(
                          "px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                          storeTypeFilter === f.id
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {lang === 'ar' ? f.labelAr : f.labelEn}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub-Tab 1: Requests Table */}
              {storeSubTab === 'REQUESTS' && (
                <div className="space-y-4">
                  {/* Search and Request Status Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border">
                    <div className="relative flex-1">
                      <Search className={cn(
                        "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                        isRTL ? "right-3" : "left-3"
                      )} />
                      <input
                        type="text"
                        value={appSearch}
                        onChange={e => setAppSearch(e.target.value)}
                        placeholder={lang === 'ar' ? 'ابحث باسم المكتبة، المالك، المحافظة، أو الهاتف...' : 'Search by store name, owner, city, or phone...'}
                        className={cn(
                          "w-full rounded-xl border border-border bg-background py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40",
                          isRTL ? "pe-3 ps-9" : "ps-9 pe-3"
                        )}
                      />
                      {appSearch && (
                        <button
                          onClick={() => setAppSearch('')}
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1",
                            isRTL ? "left-2" : "right-2"
                          )}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                      {/* Realtime Live Pulse Badge */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{lang === 'ar' ? 'بث مباشر للطلبات (Realtime)' : 'Live Realtime'}</span>
                      </div>

                      {[
                        { id: 'ALL', labelAr: 'الكل', labelEn: 'All', count: storeApps.length },
                        { id: 'PENDING', labelAr: 'قيد الانتظار', labelEn: 'Pending', count: pendingStoresCount },
                        { id: 'APPROVED', labelAr: 'معتمدة', labelEn: 'Approved', count: storeApps.filter(a => a.status === 'APPROVED').length },
                        { id: 'REJECTED', labelAr: 'مرفوضة', labelEn: 'Rejected', count: storeApps.filter(a => a.status === 'REJECTED').length },
                      ].map(filterTab => (
                        <button
                          key={filterTab.id}
                          onClick={() => setAppStatusFilter(filterTab.id as any)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5",
                            appStatusFilter === filterTab.id
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <span>{lang === 'ar' ? filterTab.labelAr : filterTab.labelEn}</span>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.2 rounded-full",
                            appStatusFilter === filterTab.id
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {filterTab.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* UI Table for Requests */}
                  <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border">
                          <tr>
                            <th className="text-start p-3.5 font-bold text-xs whitespace-nowrap">{lang === 'ar' ? 'المكتبة والمالك' : 'Store & Owner'}</th>
                            <th className="text-start p-3.5 font-bold text-xs whitespace-nowrap">{lang === 'ar' ? 'طبيعة التواجد' : 'Format'}</th>
                            <th className="text-start p-3.5 font-bold text-xs whitespace-nowrap">{lang === 'ar' ? 'المقر / التغطية' : 'Location / Scope'}</th>
                            <th className="text-start p-3.5 font-bold text-xs whitespace-nowrap">{lang === 'ar' ? 'فيسبوك (FB)' : 'Facebook (FB)'}</th>
                            <th className="text-start p-3.5 font-bold text-xs whitespace-nowrap">{lang === 'ar' ? 'مؤشرات التحقق' : 'Trust Signals'}</th>
                            <th className="text-start p-3.5 font-bold text-xs whitespace-nowrap">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                            <th className="text-start p-3.5 font-bold text-xs whitespace-nowrap">{lang === 'ar' ? 'إجراءات الإدارة' : 'Actions'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {appsLoading ? (
                            <tr>
                              <td colSpan={7} className="text-center py-10 text-xs text-muted-foreground whitespace-nowrap">
                                {lang === 'ar' ? 'جارٍ تحميل طلبات المكتبات...' : 'Loading applications...'}
                              </td>
                            </tr>
                          ) : filteredStoreApps.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-12 text-xs text-muted-foreground">
                                <div className="h-10 w-10 rounded-2xl bg-muted text-muted-foreground mx-auto flex items-center justify-center mb-2">
                                  <Store className="h-5 w-5" />
                                </div>
                                <p className="font-bold">{lang === 'ar' ? 'لا توجد طلبات مطابقة للمعايير المحددة' : 'No matching applications found'}</p>
                              </td>
                            </tr>
                          ) : (
                            filteredStoreApps.map(app => {
                              const cleanPhone = (app.phone || '').replace(/[^0-9]/g, '')
                              const intlPhone = cleanPhone.startsWith('0') ? '20' + cleanPhone.slice(1) : cleanPhone
                              const isOnline = app.is_online_only || app.store_type === 'ONLINE'
                              const hasSocials = Boolean(
                                app.social_links?.instagram || app.social_links?.facebook || app.social_links?.tiktok || app.website_url
                              )
                              const signals = app.verification_signals || {}
                              const scoreCount = [
                                Boolean(hasSocials || signals.social_verified),
                                Boolean(signals.whatsapp_business),
                                Boolean(signals.sample_video_verified),
                                Boolean(signals.national_id_or_cr || app.commercial_reg)
                              ].filter(Boolean).length

                              return (
                                <tr key={app.id} className="hover:bg-muted/20 transition-colors">
                                  {/* 1. Store & Owner */}
                                  <td className="p-3.5 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                      <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border",
                                        isOnline ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-primary/10 text-primary border-primary/20"
                                      )}>
                                        {isOnline ? '🌐' : '🏪'}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-bold text-xs text-foreground truncate max-w-[200px]">
                                          {app.store_name_ar || app.store_name || app.business_name}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                                          {app.owner_name || app.applicant_name} • <span dir="ltr" className="font-mono text-[10px]">{app.phone}</span>
                                        </p>
                                        {app.email && (
                                          <p className="text-[10px] text-primary truncate max-w-[200px] flex items-center gap-1 mt-0.5 font-mono" dir="ltr">
                                            <Mail className="h-2.5 w-2.5 shrink-0" />
                                            <span>{app.email}</span>
                                          </p>
                                        )}
                                        <p className="text-[10px] text-muted-foreground/75 mt-0.5">
                                          {formatRelativeTime(app.created_at, lang)}
                                        </p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* 2. Format / Type (Image 1 - Area 3: Prevent wrapping) */}
                                  <td className="p-3.5 whitespace-nowrap">
                                    {isOnline ? (
                                      <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 gap-1.5 font-bold text-[10px] whitespace-nowrap inline-flex items-center shrink-0 px-2.5 py-1">
                                        <span className="shrink-0">🌐</span>
                                        <span className="whitespace-nowrap">{lang === 'ar' ? 'أونلاين فقط' : 'Online Only'}</span>
                                      </Badge>
                                    ) : app.store_type === 'BOTH' ? (
                                      <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 gap-1.5 font-bold text-[10px] whitespace-nowrap inline-flex items-center shrink-0 px-2.5 py-1">
                                        <span className="shrink-0">🛍️</span>
                                        <span className="whitespace-nowrap">{lang === 'ar' ? 'فرع + أونلاين' : 'Hybrid'}</span>
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1.5 font-bold text-[10px] whitespace-nowrap inline-flex items-center shrink-0 px-2.5 py-1">
                                        <span className="shrink-0">📍</span>
                                        <span className="whitespace-nowrap">{lang === 'ar' ? 'مقر فعلي' : 'Physical'}</span>
                                      </Badge>
                                    )}
                                  </td>

                                  {/* 3. Location / Scope */}
                                  <td className="p-3.5 whitespace-nowrap">
                                    {isOnline ? (
                                      <div className="whitespace-nowrap">
                                        <p className="font-bold text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5 whitespace-nowrap">
                                          <span className="shrink-0">🚚</span>
                                          <span className="whitespace-nowrap">{lang === 'ar' ? 'شحن لجميع المحافظات' : 'All Egypt Delivery'}</span>
                                        </p>
                                        <p className="text-[10px] text-muted-foreground whitespace-nowrap">{app.city}</p>
                                      </div>
                                    ) : (
                                      <div className="max-w-[180px]">
                                        <p className="font-bold text-xs text-foreground truncate">{app.city}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{app.address || app.city}</p>
                                      </div>
                                    )}
                                  </td>

                                  {/* 4. Facebook Channel Column (All channels & info in popup) */}
                                  <td className="p-3.5 whitespace-nowrap">
                                    {app.social_links?.facebook ? (
                                      <a
                                        href={app.social_links.facebook.startsWith('http') ? app.social_links.facebook : `https://facebook.com/${app.social_links.facebook}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500/20 transition-colors shadow-2xs group whitespace-nowrap shrink-0"
                                        title={lang === 'ar' ? 'فتح صفحة الفيسبوك' : 'Open Facebook Page'}
                                      >
                                        <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                        <span className="whitespace-nowrap">Facebook</span>
                                        <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                                      </a>
                                    ) : (
                                      <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">
                                        {lang === 'ar' ? 'غير مسجل' : 'Not linked'}
                                      </span>
                                    )}
                                  </td>

                                  {/* 5. Trust Signals Button (Image 1 - Area 2: Prevent wrapping) */}
                                  <td className="p-3.5 whitespace-nowrap">
                                    <button
                                      onClick={() => setInspectingApp(app)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border hover:border-primary text-xs font-bold transition-all cursor-pointer shadow-2xs hover:bg-accent whitespace-nowrap shrink-0"
                                    >
                                      <ShieldCheck className={cn(
                                        "h-3.5 w-3.5 shrink-0",
                                        scoreCount >= 3 ? "text-emerald-600" : scoreCount >= 2 ? "text-amber-500" : "text-rose-500"
                                      )} />
                                      <span className="whitespace-nowrap font-bold">{scoreCount}/4 {lang === 'ar' ? 'إشارات' : 'Signals'}</span>
                                    </button>
                                  </td>

                                  {/* 6. Status (Image 1 - Area 1: Prevent wrapping) */}
                                  <td className="p-3.5 whitespace-nowrap">
                                    {app.status === 'PENDING' && (
                                      <Badge variant="warning" className="gap-1.5 font-bold text-[10px] px-2.5 py-1 whitespace-nowrap inline-flex items-center shrink-0">
                                        <Clock className="h-3 w-3 animate-spin shrink-0" />
                                        <span className="whitespace-nowrap">{lang === 'ar' ? 'قيد المراجعة' : 'Pending'}</span>
                                      </Badge>
                                    )}
                                    {app.status === 'APPROVED' && (
                                      <Badge variant="default" className="gap-1.5 font-bold bg-emerald-600 text-white text-[10px] px-2.5 py-1 whitespace-nowrap inline-flex items-center shrink-0">
                                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                                        <span className="whitespace-nowrap">{lang === 'ar' ? 'معتمدة 🟢' : 'Approved'}</span>
                                      </Badge>
                                    )}
                                    {app.status === 'REJECTED' && (
                                      <Badge variant="destructive" className="gap-1.5 font-bold text-[10px] px-2.5 py-1 whitespace-nowrap inline-flex items-center shrink-0">
                                        <AlertTriangle className="h-3 w-3 shrink-0" />
                                        <span className="whitespace-nowrap">{lang === 'ar' ? 'مرفوضة' : 'Rejected'}</span>
                                      </Badge>
                                    )}
                                  </td>

                                  {/* 7. Actions */}
                                  <td className="p-3.5 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                                      {/* WhatsApp Chat */}
                                      <a
                                        href={`https://wa.me/${intlPhone}?text=${encodeURIComponent(
                                          lang === 'ar'
                                            ? `مرحباً أستاذ ${app.owner_name || app.applicant_name}، نتواصل معك من إدارة منصة ورق كونكت بخصوص اعتماد متجر (${app.store_name_ar || app.store_name || app.business_name}).`
                                            : `Hello ${app.owner_name || app.applicant_name}, contacting you from WaraqConnect regarding (${app.store_name || app.business_name}).`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors shrink-0"
                                        title={lang === 'ar' ? 'محادثة واتساب' : 'WhatsApp Chat'}
                                      >
                                        <MessageCircle className="h-4 w-4" />
                                      </a>

                                      {/* Inspect Checklist */}
                                      <button
                                        onClick={() => setInspectingApp(app)}
                                        className="p-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-accent transition-colors cursor-pointer"
                                        title={lang === 'ar' ? 'فحص المصداقية ومكافحة السبام' : 'Verify Authenticity'}
                                      >
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                      </button>

                                      {/* Approved Partner Quick Notifications (WhatsApp & Email) */}
                                      {app.status === 'APPROVED' && (
                                        <div className="flex items-center gap-1">
                                          {app.phone && (
                                            <a
                                              href={`https://wa.me/${app.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                                `🎉 مرحباً بك يا ${app.owner_name || app.applicant_name}! تم توثيق واعتماد متجرك (${app.store_name_ar || app.business_name}) بنجاح على منصة WaraqConnect.\n\n📚 يمكنك الآن الدخول للوحة التحكم لإضافة كتبك وباقات عروض التوفير:\n${typeof window !== 'undefined' ? window.location.origin : ''}/stores/dashboard`
                                              )}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                                              title={lang === 'ar' ? 'إرسال إشعار التفعيل عبر واتساب' : 'Notify via WhatsApp'}
                                            >
                                              <MessageCircle className="h-4 w-4" />
                                            </a>
                                          )}
                                          {app.email && (
                                            <a
                                              href={`mailto:${app.email}?subject=${encodeURIComponent(
                                                `🎉 تم اعتماد وتفعيل متجركم (${app.store_name_ar || app.business_name}) على منصة WaraqConnect`
                                              )}&body=${encodeURIComponent(
                                                `مرحباً ${app.owner_name || app.applicant_name}،\n\nيسعدنا إعلامك بأنه تم اعتماد وتوثيق متجركم رسمياً كشريك في منصة WaraqConnect!\n\nيمكنك الآن البدء بإضافة كتبك وإنشاء باقات عروض التوفير (Mix & Match) عبر لوحة التحكم:\n${typeof window !== 'undefined' ? window.location.origin : ''}/stores/dashboard\n\nمع تحيات فريق WaraqConnect.`
                                              )}`}
                                              className="p-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                                              title={lang === 'ar' ? 'إرسال إيميل التفعيل' : 'Send Activation Email'}
                                            >
                                              <Mail className="h-4 w-4" />
                                            </a>
                                          )}
                                        </div>
                                      )}

                                      {/* Approve Button */}
                                      {app.status === 'PENDING' && (
                                        <Button
                                          size="sm"
                                          onClick={() => handleApproveStore(app.id)}
                                          loading={approvingId === app.id}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-7 px-2.5 rounded-lg gap-1 cursor-pointer"
                                        >
                                          <CheckCheck className="h-3.5 w-3.5" />
                                          <span className="hidden lg:inline">{lang === 'ar' ? 'اعتماد' : 'Approve'}</span>
                                        </Button>
                                      )}

                                      {/* Reject Button */}
                                      {app.status === 'PENDING' && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleRejectStore(app.id)}
                                          className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-xs h-7 px-2 rounded-lg cursor-pointer"
                                          title={lang === 'ar' ? 'رفض الطلب' : 'Reject'}
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </Button>
                                      )}

                                      {app.status === 'APPROVED' && (
                                        <Link href="/stores" target="_blank">
                                          <Button variant="outline" size="sm" className="h-7 text-xs font-bold gap-1 rounded-lg">
                                            <ExternalLink className="h-3 w-3 text-primary" />
                                            <span className="hidden lg:inline">{lang === 'ar' ? 'الدليل' : 'Live'}</span>
                                          </Button>
                                        </Link>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Active Stores Table */}
              {storeSubTab === 'ACTIVE_STORES' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border">
                    <div className="relative flex-1">
                      <Search className={cn(
                        "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground",
                        isRTL ? "right-3" : "left-3"
                      )} />
                      <input
                        type="text"
                        value={appSearch}
                        onChange={e => setAppSearch(e.target.value)}
                        placeholder={lang === 'ar' ? 'ابحث في المتاجر المعتمدة بالاسم، العنوان، أو الرابط...' : 'Search active stores by name, city, or slug...'}
                        className={cn(
                          "w-full rounded-xl border border-border bg-background py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40",
                          isRTL ? "pe-3 ps-9" : "ps-9 pe-3"
                        )}
                      />
                    </div>

                    {/* Store Active/Hidden Filter Chips */}
                    <div className="flex items-center gap-1.5 self-center">
                      {[
                        { id: 'ALL', labelAr: 'الكل', labelEn: 'All', count: activeStores.length },
                        { id: 'ACTIVE', labelAr: 'نشط وظاهر', labelEn: 'Active', count: activeStores.filter(s => s.is_active !== false).length },
                        { id: 'HIDDEN', labelAr: 'مخفي', labelEn: 'Hidden', count: activeStores.filter(s => s.is_active === false).length },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setStoreActiveFilter(tab.id as any)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                            storeActiveFilter === tab.id
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <span>{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.2 rounded-full",
                            storeActiveFilter === tab.id
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Stores Table */}
                  <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border">
                          <tr>
                            <th className="text-start p-3.5 font-bold text-xs whitespace-nowrap">{lang === 'ar' ? 'المكتبة الشريكة' : 'Bookstore'}</th>
                            <th className="text-start p-3.5 font-bold text-xs whitespace-nowrap">{lang === 'ar' ? 'طبيعة التواجد' : 'Format'}</th>
                            <th className="text-start p-3.5 font-bold text-xs whitespace-nowrap">{lang === 'ar' ? 'المقر / التغطية' : 'Location / Scope'}</th>
                            <th className="text-start p-3.5 font-bold text-xs whitespace-nowrap">{lang === 'ar' ? 'فيسبوك (FB)' : 'Facebook (FB)'}</th>
                            <th className="text-start p-3.5 font-bold text-xs whitespace-nowrap">{lang === 'ar' ? 'الظهور والحالة' : 'Visibility & Status'}</th>
                            <th className="text-start p-3.5 font-bold text-xs whitespace-nowrap">{lang === 'ar' ? 'شارة التوثيق' : 'Verification'}</th>
                            <th className="text-start p-3.5 font-bold text-xs whitespace-nowrap">{lang === 'ar' ? 'إجراءات الإدارة' : 'Admin Actions'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {storesLoading ? (
                            <tr>
                              <td colSpan={7} className="text-center py-10 text-xs text-muted-foreground whitespace-nowrap">
                                {lang === 'ar' ? 'جارٍ تحميل المكتبات المعتمدة...' : 'Loading bookstores...'}
                              </td>
                            </tr>
                          ) : filteredActiveStores.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                                {lang === 'ar' ? 'لا توجد مكتبات مطابقة' : 'No matching stores'}
                              </td>
                            </tr>
                          ) : (
                            filteredActiveStores.map(store => (
                              <tr key={store.id} className="hover:bg-muted/20 transition-colors">
                                <td className="p-3.5 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center font-bold text-xs">
                                      {store.logo_url ? (
                                        <img src={store.logo_url} alt="" className="h-full w-full object-cover" />
                                      ) : (
                                        store.store_type === 'ONLINE' ? '🌐' : '🏪'
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <Link
                                        href={`/stores/${store.slug}`}
                                        target="_blank"
                                        className="font-bold text-xs text-foreground hover:text-primary transition-colors flex items-center gap-1 group whitespace-nowrap"
                                      >
                                        <span className="truncate max-w-[200px]">{lang === 'ar' ? store.name_ar || store.name : store.name || store.name_ar}</span>
                                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                      </Link>
                                      <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
                                        /stores/{store.slug}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="p-3.5 whitespace-nowrap">
                                  {store.store_type === 'ONLINE' ? (
                                    <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 gap-1.5 font-bold text-[10px] whitespace-nowrap inline-flex items-center shrink-0 px-2.5 py-1">
                                      <span className="shrink-0">🌐</span>
                                      <span className="whitespace-nowrap">{lang === 'ar' ? 'أونلاين فقط' : 'Online Only'}</span>
                                    </Badge>
                                  ) : store.store_type === 'BOTH' ? (
                                    <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 gap-1.5 font-bold text-[10px] whitespace-nowrap inline-flex items-center shrink-0 px-2.5 py-1">
                                      <span className="shrink-0">🛍️</span>
                                      <span className="whitespace-nowrap">{lang === 'ar' ? 'فرع + أونلاين' : 'Hybrid'}</span>
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1.5 font-bold text-[10px] whitespace-nowrap inline-flex items-center shrink-0 px-2.5 py-1">
                                      <span className="shrink-0">📍</span>
                                      <span className="whitespace-nowrap">{lang === 'ar' ? 'مقر فعلي' : 'Physical'}</span>
                                    </Badge>
                                  )}
                                </td>

                                <td className="p-3.5 whitespace-nowrap">
                                  {store.store_type === 'ONLINE' ? (
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                                      {lang === 'ar' ? 'متجر إلكتروني — شحن لكافة المحافظات' : 'Online — Nationwide'}
                                    </span>
                                  ) : (
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                      {store.address || 'القاهرة'}
                                    </p>
                                  )}
                                </td>

                                {/* Facebook Channel Column (All channels & info in popup) */}
                                <td className="p-3.5 whitespace-nowrap">
                                  {store.social_links?.facebook ? (
                                    <a
                                      href={store.social_links.facebook.startsWith('http') ? store.social_links.facebook : `https://facebook.com/${store.social_links.facebook}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500/20 transition-colors shadow-2xs group whitespace-nowrap shrink-0"
                                      title={lang === 'ar' ? 'فتح صفحة الفيسبوك' : 'Open Facebook Page'}
                                    >
                                      <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                                      <span className="whitespace-nowrap">Facebook</span>
                                      <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </a>
                                  ) : (
                                    <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">
                                      {lang === 'ar' ? 'غير مسجل' : 'Not linked'}
                                    </span>
                                  )}
                                </td>

                                <td className="p-3.5 whitespace-nowrap">
                                  <div>
                                    {store.is_active === false ? (
                                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-bold text-[10px] gap-1 px-2 py-0.5">
                                        <EyeOff className="h-3 w-3 shrink-0" />
                                        <span>{lang === 'ar' ? 'مخفي من الدليل' : 'Hidden'}</span>
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold text-[10px] gap-1 px-2 py-0.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                        <span>{lang === 'ar' ? 'نشط ومعروض' : 'Active & Live'}</span>
                                      </Badge>
                                    )}
                                    <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                                      <span className="font-semibold text-amber-500 flex items-center gap-0.5">
                                        <Star className="h-2.5 w-2.5 fill-amber-400 shrink-0" />
                                        <span>{store.rating_average || 5.0}</span>
                                      </span>
                                      <span>•</span>
                                      <span>{store.total_listings || 0} {lang === 'ar' ? 'كتاب' : 'bks'}</span>
                                    </div>
                                  </div>
                                </td>

                                <td className="p-3.5 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStoreVerified(store.id, store.is_verified)}
                                    disabled={storeActionLoading === store.id}
                                    className={cn(
                                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0",
                                      store.is_verified
                                        ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-2xs"
                                        : "bg-muted/60 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                                    )}
                                    title={lang === 'ar' ? (store.is_verified ? 'انقر لإلغاء شارة التوثيق' : 'انقر لمنح شارة التوثيق') : (store.is_verified ? 'Click to revoke badge' : 'Click to verify store')}
                                  >
                                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                                    <span>{store.is_verified ? (lang === 'ar' ? 'موثق رسمي' : 'Verified') : (lang === 'ar' ? 'غير موثق' : 'Unverified')}</span>
                                  </button>
                                </td>

                                <td className="p-3.5 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setInspectingStore(store)}
                                      className="h-7 text-xs font-bold rounded-lg gap-1 cursor-pointer px-2"
                                      title={lang === 'ar' ? 'عرض التفاصيل الكاملة وكافة القنوات' : 'View full details & all channels'}
                                    >
                                      <Eye className="h-3.5 w-3.5 text-primary" />
                                      <span>{lang === 'ar' ? 'التفاصيل' : 'Details'}</span>
                                    </Button>

                                    {/* Edit Store */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenEditStore(store)}
                                      className="h-7 text-xs font-bold rounded-lg gap-1 cursor-pointer px-2 text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                                      title={lang === 'ar' ? 'تعديل بيانات المتجر' : 'Edit store details'}
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                      <span>{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                                    </Button>

                                    {/* Hide / Unhide Store */}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleToggleStoreActive(store.id, store.is_active !== false)}
                                      disabled={storeActionLoading === store.id}
                                      className={cn(
                                        "h-7 text-xs font-bold rounded-lg gap-1 cursor-pointer px-2",
                                        store.is_active === false
                                          ? "text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                                          : "text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                                      )}
                                      title={store.is_active === false ? (lang === 'ar' ? 'إظهار المتجر في الدليل العام' : 'Unhide in directory') : (lang === 'ar' ? 'إخفاء المتجر من الدليل العام للجمهور' : 'Hide from public directory')}
                                    >
                                      {store.is_active === false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                      <span>{store.is_active === false ? (lang === 'ar' ? 'إظهار' : 'Unhide') : (lang === 'ar' ? 'إخفاء' : 'Hide')}</span>
                                    </Button>

                                    {/* Delete Store */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteStore(store.id, store.name_ar || store.name)}
                                      disabled={storeActionLoading === store.id}
                                      className="h-7 text-xs font-bold rounded-lg gap-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer px-2"
                                      title={lang === 'ar' ? 'حذف المتجر نهائياً من قاعدة البيانات' : 'Delete store permanently'}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      <span className="hidden sm:inline">{lang === 'ar' ? 'حذف' : 'Delete'}</span>
                                    </Button>

                                    <Link href={`/stores/${store.slug}`} target="_blank">
                                      <Button variant="ghost" size="sm" className="h-7 text-xs font-bold rounded-lg gap-1 text-muted-foreground hover:text-foreground px-2">
                                        <ExternalLink className="h-3 w-3" />
                                        <span className="hidden lg:inline">{lang === 'ar' ? 'المتجر' : 'Live'}</span>
                                      </Button>
                                    </Link>
                                    <Link href={`/stores/dashboard?store=${store.id}`} target="_blank">
                                      <Button variant="ghost" size="sm" className="h-7 text-xs font-bold rounded-lg text-primary px-2">
                                        {lang === 'ar' ? 'لوحة التاجر' : 'Merchant'}
                                      </Button>
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 3: Comprehensive Anti-Spam & Trust Signals Guide */}
              {storeSubTab === 'VERIFICATION_GUIDE' && (
                <div className="space-y-6">
                  {/* Banner */}
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/30 flex items-start gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-foreground">
                        {lang === 'ar' ? 'منظومة كشف الدخلاء ومكافحة السبام في ورق كونكت (Anti-Spotter & Spam Defense)' : 'WaraqConnect Anti-Spotter & Store Verification Framework'}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {lang === 'ar'
                          ? 'لمنع "السمسرة الوهمية" أو الحسابات المزيفة التي تدّعي امتلاك كتب دون وجود مخزون فعلي، تطبق المنصة 5 محاور تحقق متدرجة قبل وأثناء اعتماد أي متجر:'
                          : 'To eliminate middlemen or fraudulent sellers with no inventory, the platform enforces 5 structured verification pillars before granting the Verified Partner badge.'}
                      </p>
                    </div>
                  </div>

                  {/* 5 Pillars Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Pillar 1 */}
                    <Card className="border border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <span className="h-7 w-7 rounded-lg bg-pink-500/10 text-pink-600 flex items-center justify-center text-xs font-black">1</span>
                          <span>{lang === 'ar' ? 'فحص الوجود الرقمي (Social Media Footprint)' : 'Social Footprint Audit'}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                        <p className="font-semibold text-foreground">
                          {lang === 'ar' ? 'ماذا نفحص في الحساب؟' : 'What we audit:'}
                        </p>
                        <ul className="list-disc ps-4 space-y-1">
                          <li>{lang === 'ar' ? 'عمر حساب إنستغرام أو صفحة الفيسبوك (تاريخ أقدم منشور).' : 'Account age (first book post date).'}</li>
                          <li>{lang === 'ar' ? 'وجود تفاعل حقيقي من قراء مع تعليقات واستفسارات أسعار.' : 'Real reader comments & purchase inquiries.'}</li>
                          <li>{lang === 'ar' ? 'تطابق رقم الهاتف في البايو مع رقم هاتف مقدم الطلب.' : 'Phone number match in bio and WhatsApp.'}</li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Pillar 2 */}
                    <Card className="border border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <span className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-black">2</span>
                          <span>{lang === 'ar' ? 'واتساب تجاري موثق (WhatsApp Business)' : 'WhatsApp Business Profile'}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                        <p className="font-semibold text-foreground">
                          {lang === 'ar' ? 'المعايير المطلوبة:' : 'Required criteria:'}
                        </p>
                        <ul className="list-disc ps-4 space-y-1">
                          <li>{lang === 'ar' ? 'أن يكون الرقم مسجلاً كحساب أعمال تجاري وليس شخصياً عادياً.' : 'Registered as WhatsApp Business account.'}</li>
                          <li>{lang === 'ar' ? 'وجود كتالوج للكتب بأسعارها وساعات الرد المحددة.' : 'Active book catalog with prices and hours.'}</li>
                          <li>{lang === 'ar' ? 'التواصل المباشر مع صاحب المتجر للترحيب به والتأكد من هويته.' : 'Direct welcome call or voice note.'}</li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Pillar 3 */}
                    <Card className="border border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <span className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center text-xs font-black">3</span>
                          <span>{lang === 'ar' ? 'فيديو إثبات المخزون (Handwritten Note Video)' : 'Live Stock Proof Video'}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                        <p className="font-semibold text-foreground">
                          {lang === 'ar' ? 'الحل الحاسم لمنع السماسرة:' : 'The decisive anti-middleman test:'}
                        </p>
                        <p>
                          {lang === 'ar'
                            ? 'نطلب من صاحب المتجر إرسال فيديو 10 ثوانٍ يصور فيه رفوف كتبه ومستودعه حاملاً ورقة مكتوبة بخط اليد: "ورق كونكت + تاريخ اليوم".'
                            : 'Request a 10s video of bookshelves holding a handwritten note with "WaraqConnect + Today\'s Date".'}
                        </p>
                        <p className="text-[11px] text-primary font-bold">
                          {lang === 'ar' ? '👈 يمنع 100% من السماسرة الذين لا يملكون كتباً فعلية.' : '100% eliminates fake middlemen.'}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Pillar 4 */}
                    <Card className="border border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <span className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-black">4</span>
                          <span>{lang === 'ar' ? 'الهوية أو السجل (National ID / Commercial Reg)' : 'Legal Identity Check'}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                        <p className="font-semibold text-foreground">
                          {lang === 'ar' ? 'الوثائق المعتمدة في مصر:' : 'Accepted documents in Egypt:'}
                        </p>
                        <ul className="list-disc ps-4 space-y-1">
                          <li>{lang === 'ar' ? 'السجل التجاري أو البطاقة الضريبية للمكتبات الرسمية.' : 'Commercial register (CR) or tax card.'}</li>
                          <li>{lang === 'ar' ? 'توثيق منصة "معروف" للمتاجر الإلكترونية.' : 'Maroof or Freelance permit.'}</li>
                          <li>{lang === 'ar' ? 'صورة بطاقة الرقم القومي لصاحب المتجر الفردي.' : 'National ID for individual book curators.'}</li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Pillar 5 */}
                    <Card className="border border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <span className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center text-xs font-black">5</span>
                          <span>{lang === 'ar' ? 'فترة الاختبار بالدفع عند الاستلام (COD Pilot)' : 'Cash-on-Delivery Pilot'}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                        <p className="font-semibold text-foreground">
                          {lang === 'ar' ? 'حماية المشتري في البداية:' : 'Buyer protection phase:'}
                        </p>
                        <p>
                          {lang === 'ar'
                            ? 'أول 3 معاملات للمتجر الجديد تتم حصراً بنظام الدفع عند الاستلام (COD) مع متابعة آراء المشترين حتى يثبت جديته وخلوه من أي شكاوى.'
                            : 'First 3 customer purchases operate under Cash-on-Delivery escrow until proven reliable.'}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Script Card */}
                    <Card className="border border-primary/30 bg-primary/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                          <MessageCircle className="h-4 w-4" />
                          <span>{lang === 'ar' ? 'رسالة واتساب الجاهزة لطلب التحقق' : 'Ready WhatsApp Verification Script'}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs text-muted-foreground">
                        <div className="p-2.5 rounded-xl bg-card border border-border text-[11px] leading-relaxed text-foreground select-all font-mono" dir="rtl">
                          مرحباً أستاذ [الاسم]، لمتابعة توثيق واعتماد متجركم على ورق كونكت ومنحكم شارة الشريك الموثوق 🟢، برجاء التكرم بمشاركتنا:
                          1. رابط صفحة إنستغرام أو فيسبوك الرسمية.
                          2. فيديو سريع مدته 10 ثوانٍ يصور رفوف/مخزون الكتب مع ورقة تحمل اسم المنصة وتاريخ اليوم.
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {lang === 'ar' ? 'يمكن نسخها أو إرسالها بنقرة واحدة من جدول الطلبات.' : 'Can be sent with one click from requests table.'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics & Retention Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Header & GA4 Quick Action */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-primary/20 bg-primary/5">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span>{lang === 'ar' ? 'تحليلات المستخدمين النشطين ومعدل الاحتفاظ' : 'Active Users, Unique Users & Retention'}</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lang === 'ar'
                      ? 'مؤشرات حية للنشاط اليومي والأسبوعي والشهري، معدل الالتصاق، وتتبع تنزيل التطبيق عبر Google Analytics 4 (GA4)'
                      : 'Live DAU/WAU/MAU metrics, stickiness ratio, and app download tracking powered by Google Analytics 4 (GA4)'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://analytics.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all"
                  >
                    <span>{lang === 'ar' ? 'فتح Google Analytics 4' : 'Open Google Analytics 4'}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* 1. Active Users Overview (DAU / WAU / MAU) */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <span>{lang === 'ar' ? 'المستخدمون النشطون (Active Users)' : 'Active Users (DAU / WAU / MAU)'}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="border border-border/80">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {lang === 'ar' ? 'نشطون اليوم (DAU)' : 'Daily Active Users (DAU)'}
                        </span>
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-3xl font-extrabold text-foreground mt-2">
                        {(stats.dau || stats.active_users || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lang === 'ar' ? 'مستخدمون تفاعلوا خلال آخر 24 ساعة' : 'Users active within last 24 hours'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-border/80">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {lang === 'ar' ? 'نشطون أسبوعياً (WAU)' : 'Weekly Active Users (WAU)'}
                        </span>
                        <Calendar className="h-4 w-4 text-teal-500" />
                      </div>
                      <p className="text-3xl font-extrabold text-foreground mt-2">
                        {(stats.wau || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lang === 'ar' ? 'مستخدمون تفاعلوا خلال آخر 7 أيام' : 'Users active within last 7 days'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-border/80">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {lang === 'ar' ? 'نشطون شهرياً (MAU)' : 'Monthly Active Users (MAU)'}
                        </span>
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-3xl font-extrabold text-foreground mt-2">
                        {(stats.mau || stats.total_users || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lang === 'ar' ? 'مستخدمون تفاعلوا خلال آخر 30 يوماً' : 'Users active within last 30 days'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 2. Retention & Stickiness Index */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border border-border/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        <span>{lang === 'ar' ? 'معدل الالتصاق والاحتفاظ (Stickiness Ratio)' : 'User Stickiness Ratio (DAU / MAU)'}</span>
                      </span>
                      <Badge variant="outline" className="text-xs font-bold text-primary">
                        DAU / MAU
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-extrabold text-foreground">
                        {stats.stickiness_ratio || 0}%
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {(stats.stickiness_ratio || 0) >= 30
                          ? (lang === 'ar' ? 'تفاعل ممتاز 🚀' : 'Exceptional 🚀')
                          : (stats.stickiness_ratio || 0) >= 15
                          ? (lang === 'ar' ? 'جيد ومستقر ✅' : 'Healthy ✅')
                          : (lang === 'ar' ? 'قيد النمو والتحفيز 🌱' : 'Growing 🌱')}
                      </span>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2.5 mt-3 overflow-hidden">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, stats.stickiness_ratio || 0))}%` }}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                      {lang === 'ar'
                        ? 'معدل الالتصاق يوضح نسبة القراء الذين يعودون يومياً مقارنة بالمستخدمين النشطين شهرياً. المعيار الذهبي للتطبيقات الاجتماعية الناجحة يتراوح بين 20% و 50%.'
                        : 'Stickiness ratio calculates the percentage of monthly users returning daily. A ratio of 20%+ represents healthy habit-forming engagement.'}
                    </p>
                  </CardContent>
                </Card>

                {/* 3. Unique Users & Acquisition */}
                <Card className="border border-border/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>{lang === 'ar' ? 'المستخدمون الفريدون ونمو الحسابات' : 'Unique Users & Account Growth'}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {lang === 'ar' ? 'إجمالي المستخدمين الفريدين' : 'Total Unique Users'}
                        </span>
                        <p className="text-xl font-bold mt-1 text-foreground">
                          {stats.total_users.toLocaleString()}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {lang === 'ar' ? 'مستخدمون جدد اليوم' : 'New Users Today'}
                        </span>
                        <p className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                          +{stats.new_users_today || 0}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {lang === 'ar' ? 'جدد خلال 7 أيام' : 'New Users (7 Days)'}
                        </span>
                        <p className="text-xl font-bold mt-1 text-foreground">
                          +{stats.new_users_week || 0}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {lang === 'ar' ? 'جدد خلال 30 يوماً' : 'New Users (30 Days)'}
                        </span>
                        <p className="text-xl font-bold mt-1 text-foreground">
                          +{stats.new_users_month || 0}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-3">
                      {lang === 'ar'
                        ? 'يتم ربط كل مستخدم بحساب ثابت (User-ID) في Google Analytics 4 لمنع تكرار نفس المستخدم عند دخوله من أجهزة مختلفة.'
                        : 'Every user is tied to their User-ID in Google Analytics 4 for cross-device deduplication.'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 4. App Download & PWA Tracking Actions */}
              <Card className="border border-border/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Download className="h-4 w-4 text-primary" />
                    <span>{lang === 'ar' ? 'تتبع تثبيت وتنزيل التطبيق (Google Tag Actions)' : 'PWA App Install & Download Tracking'}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                      <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                        <Smartphone className="h-4 w-4 text-primary" />
                        <span>app_install</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {lang === 'ar'
                          ? 'حدث قياسي يتم إرساله إلى GA4 تلقائياً عند إتمام المستخدم تثبيت تطبيق وَرَق على شاشة هاتفه أو حاسوبه.'
                          : 'Standard GA4 event sent automatically when the user confirms app installation on their device.'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                      <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                        <Download className="h-4 w-4 text-emerald-500" />
                        <span>app_download</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {lang === 'ar'
                          ? 'حدث مخصص يسجل النقر على أزرار التنزيل وبانر الـ PWA لمعرفة نسبة تحول الزوار إلى مستخدمين للتطبيق.'
                          : 'Custom event tracking clicks on install buttons & PWA prompts to measure install conversion rate.'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                      <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>user_identified (User-ID)</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {lang === 'ar'
                          ? 'ربط جلسة الزائر بهويته الدائمة في GA4 لتتبع رحلة عودته ونسبة احتفاظه (Retention Cohorts).'
                          : 'Links sessions to unique User-ID in GA4 for persistent cohort retention analysis.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 5. Google Analytics 4 (GA4) Practical Guide */}
              <Card className="border border-primary/20 bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center justify-between">
                    <span>{lang === 'ar' ? 'دليل استخراج تقارير الاحتفاظ والمستخدمين من Google Analytics 4' : 'GA4 Step-by-Step Reporting Guide'}</span>
                    <Badge variant="outline" className="text-xs">GA4 Guide</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground">
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <p className="font-bold text-foreground mb-1">
                      {lang === 'ar' ? '1. تقرير الاحتفاظ بالدفعات (Cohort Retention):' : '1. Cohort Retention Report:'}
                    </p>
                    <p>
                      {lang === 'ar'
                        ? 'ادخل إلى GA4 > التقارير (Reports) > دورة الحياة (Lifecycle) > الاحتفاظ (Retention). ستجد رسماً بيانياً يوضح نسبة عودة المستخدمين في اليوم 1، اليوم 7، اليوم 14، واليوم 30.'
                        : 'Navigate to GA4 > Reports > Lifecycle > Retention to view cohort curves for Day 1, Day 7, Day 14, and Day 30.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border">
                    <p className="font-bold text-foreground mb-1">
                      {lang === 'ar' ? '2. توحيد المستخدمين الفريدين (User-ID Reporting Identity):' : '2. Deduplicate Unique Users (User-ID):'}
                    </p>
                    <p>
                      {lang === 'ar'
                        ? 'في GA4 ادخل إلى المسؤول (Admin) > هوية التقارير (Reporting Identity) > اختر "مدمج" (Blended). هذا يدمج زيارات نفس العضو عبر هاتفه والكمبيوتر كشخص فريد واحد.'
                        : 'In GA4 Admin > Reporting Identity, select "Blended" to stitch visits across mobile web, desktop, and installed PWA.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border">
                    <p className="font-bold text-foreground mb-1">
                      {lang === 'ar' ? '3. إحصائيات تنزيل التطبيق (App Download Events):' : '3. App Download & Install Conversions:'}
                    </p>
                    <p>
                      {lang === 'ar'
                        ? 'في GA4 ادخل إلى التقارير > المشاركة (Engagement) > الأحداث (Events) > ابحث عن حدث app_install أو app_download، ويمكنك تعيينه كـ "هدف / تحويل" (Conversion).'
                        : 'In GA4 Reports > Engagement > Events, inspect app_install and app_download events, and mark them as Key Events / Conversions.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Communities Tab */}
          {activeTab === 'communities' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <span>{lang === 'ar' ? 'إدارة المجتمعات ونقاط اللقاء الآمنة' : 'Manage Communities & Safe Hubs'}</span>
                    <Badge variant="muted" className="text-xs">{filteredCommunities.length}</Badge>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lang === 'ar'
                      ? 'تعديل وحذف وإدارة جميع مجتمعات القراءة والمكتبات والجامعات ونقاط اللقاء في مصر'
                      : 'Edit, delete, and oversee reading communities, clubs, and safe hub spots'}
                  </p>
                </div>
                <Link href="/communities">
                  <Button size="sm" className="font-bold text-xs gap-1.5 cursor-pointer">
                    <Plus className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'إنشاء مجتمع جديد' : 'New Community'}</span>
                  </Button>
                </Link>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'بحث بالاسم، الحي، أو نقطة اللقاء...' : 'Search communities, hubs, or areas...'}
                    value={commSearch}
                    onChange={e => setCommSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {commSearch && (
                    <button
                      type="button"
                      onClick={() => setCommSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { val: 'ALL', ar: 'الكل', en: 'All' },
                    { val: 'CLUB', ar: 'نوادي قراءة', en: 'Clubs' },
                    { val: 'NEIGHBORHOOD', ar: 'أحياء', en: 'Neighborhoods' },
                    { val: 'UNIVERSITY', ar: 'جامعات', en: 'Universities' },
                    { val: 'COMPANY', ar: 'شركات', en: 'Companies' },
                  ].map(tab => (
                    <button
                      key={tab.val}
                      type="button"
                      onClick={() => setCommTypeFilter(tab.val)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
                        commTypeFilter === tab.val
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      {lang === 'ar' ? tab.ar : tab.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Communities Table */}
              <div className="rounded-xl border overflow-hidden bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-start p-3 font-semibold text-xs">{lang === 'ar' ? 'المجتمع' : 'Community'}</th>
                      <th className="text-start p-3 font-semibold text-xs">{lang === 'ar' ? 'التصنيف' : 'Type'}</th>
                      <th className="text-start p-3 font-semibold text-xs">{lang === 'ar' ? 'نقطة اللقاء الآمنة' : 'Safe Hub'}</th>
                      <th className="text-start p-3 font-semibold text-xs">{lang === 'ar' ? 'الأعضاء' : 'Members'}</th>
                      <th className="text-start p-3 font-semibold text-xs">{lang === 'ar' ? 'الخصوصية' : 'Access'}</th>
                      <th className="text-start p-3 font-semibold text-xs">{lang === 'ar' ? 'إجراءات الإدارة' : 'Admin Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCommunities.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                          {lang === 'ar' ? 'لم يتم العثور على أي مجتمعات مطابقة' : 'No matching communities found'}
                        </td>
                      </tr>
                    ) : (
                      filteredCommunities.map(c => (
                        <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <Link
                                href={`/communities/${c.slug}`}
                                className="h-9 w-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-sm overflow-hidden border hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer"
                                title={c.name}
                              >
                                {c.avatar_url || c.logo_url ? (
                                  <img src={c.avatar_url || c.logo_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  '🌳'
                                )}
                              </Link>
                              <div className="min-w-0">
                                <Link
                                  href={`/communities/${c.slug}`}
                                  className="font-bold text-xs hover:text-primary transition-colors flex items-center gap-1 group"
                                >
                                  <span className="truncate">{lang === 'ar' ? c.name_ar || c.name : c.name || c.name_ar}</span>
                                  <Eye className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                </Link>
                                <p className="text-[11px] text-muted-foreground truncate font-mono">
                                  /communities/{c.slug}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="muted" className="text-[10px] uppercase font-bold">
                              {c.org_type || 'CLUB'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {c.hub_name ? (
                              <div className="text-xs max-w-[200px]">
                                <p className="font-semibold text-foreground flex items-center gap-1 truncate">
                                  <Coffee className="h-3 w-3 text-amber-600 shrink-0" />
                                  <span className="truncate">{c.hub_name}</span>
                                </p>
                                {c.hub_address && (
                                  <p className="text-[10px] text-muted-foreground truncate">{c.hub_address}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="text-xs font-semibold">{c.member_count ?? 1}</span>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={c.requires_approval || c.is_private ? 'warning' : 'success'}
                              className="text-[10px]"
                            >
                              {c.requires_approval || c.is_private
                                ? (lang === 'ar' ? 'خاص (موافقة)' : 'Approval')
                                : (lang === 'ar' ? 'عام' : 'Open')}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <Link href={`/communities/${c.slug}`}>
                                <Button size="icon-sm" variant="ghost" title={lang === 'ar' ? 'عرض المجتمع' : 'View'}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className="text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => handleOpenEdit(c)}
                                title={lang === 'ar' ? 'تعديل بيانات المجتمع' : 'Edit community'}
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={() => setDeletingComm(c)}
                                title={lang === 'ar' ? 'حذف المجتمع نهائياً' : 'Delete community'}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">{lang === 'ar' ? 'أحدث المستخدمين' : 'Recent Users'}</h2>
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-start p-3 font-semibold">{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                      <th className="text-start p-3 font-semibold">{lang === 'ar' ? 'الدور' : 'Role'}</th>
                      <th className="text-start p-3 font-semibold">{lang === 'ar' ? 'الكتب' : 'Books'}</th>
                      <th className="text-start p-3 font-semibold">{lang === 'ar' ? 'تاريخ الانضمام' : 'Joined'}</th>
                      <th className="text-start p-3 font-semibold">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((u: Record<string, unknown>) => (
                      <tr key={u.id as string} className="border-t hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <p className="font-medium">{u.full_name as string ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{u.email as string}</p>
                        </td>
                        <td className="p-3">
                          <Badge variant={u.role === 'ADMIN' ? 'default' : 'muted'} className="text-[10px]">
                            {u.role as string}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{u.total_listings as number ?? 0}</td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {formatRelativeTime(u.created_at as string, lang)}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {!(u.is_suspended as boolean) && (
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => suspendUser(u.id as string)}
                                disabled={actionLoading === u.id as string}
                                title="Suspend user"
                              >
                                <Shield className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {u.is_suspended as boolean && (
                              <Badge variant="destructive" className="text-[10px]">Suspended</Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">{lang === 'ar' ? 'أحدث الإعلانات' : 'Recent Listings'}</h2>
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-start p-3 font-semibold">Book</th>
                      <th className="text-start p-3 font-semibold">Seller</th>
                      <th className="text-start p-3 font-semibold">Type</th>
                      <th className="text-start p-3 font-semibold">Status</th>
                      <th className="text-start p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentListings.map((listing: Record<string, unknown>) => (
                      <tr key={listing.id as string} className="border-t hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <p className="font-medium">{(listing.book as Record<string, string>)?.title}</p>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {(listing.seller as Record<string, string>)?.full_name}
                        </td>
                        <td className="p-3">
                          <Badge variant="muted" className="text-[10px]">{listing.listing_type as string}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={listing.status === 'ACTIVE' ? 'success' : listing.status === 'HIDDEN' ? 'warning' : 'muted'}
                            className="text-[10px]"
                          >
                            {listing.status as string}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button size="icon-sm" variant="ghost" onClick={() => hideListing(listing.id as string)} disabled={actionLoading === listing.id as string}>
                              <EyeOff className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon-sm" variant="ghost" onClick={() => featureListing(listing.id as string)} disabled={actionLoading === listing.id as string}>
                              <Star className="h-3.5 w-3.5 text-amber-500" />
                            </Button>
                            <Link href={`/books/${listing.id as string}`}>
                              <Button size="icon-sm" variant="ghost">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">{lang === 'ar' ? 'البلاغات' : 'Reports'}</h2>
              {recentReports.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                  <p>{lang === 'ar' ? 'مفيش بلاغات معلقة 🎉' : 'No pending reports 🎉'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentReports.map((report: Record<string, unknown>) => (
                    <Card key={report.id as string} className="border-red-100 dark:border-red-900/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="destructive" className="text-[10px]">{report.report_type as string}</Badge>
                              <Badge variant="warning" className="text-[10px]">{report.report_reason as string}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{report.description as string}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {lang === 'ar' ? 'مُبلَّغ من: ' : 'Reported by: '}
                              {(report.reporter as Record<string, string>)?.full_name}
                              {' • '}{formatRelativeTime(report.created_at as string, lang)}
                            </p>
                          </div>
                          <div className="flex gap-2 ms-3">
                            <Button size="sm" variant="outline" className="text-green-600" onClick={() => resolveReport(report.id as string)} disabled={actionLoading === report.id as string}>
                              <CheckCircle2 className="h-4 w-4 me-1" />
                              {lang === 'ar' ? 'حل' : 'Resolve'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Admin Edit Community Modal */}
      {editingComm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-card border-2 border-border shadow-2xl overflow-hidden text-foreground">
            <div className="p-4 sm:p-5 border-b bg-muted/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-primary" />
                <h3 className="text-base font-black">
                  {lang === 'ar' ? 'تعديل بيانات المجتمع' : 'Edit Community Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingComm(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="m-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveCommunity} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    {lang === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name_ar}
                    onChange={e => setEditForm(prev => ({ ...prev, name_ar: e.target.value }))}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    {lang === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    {lang === 'ar' ? 'نوع الكيان التنظيمي' : 'Organization Type'}
                  </label>
                  <select
                    value={editForm.org_type}
                    onChange={e => setEditForm(prev => ({ ...prev, org_type: e.target.value as CommunityOrgType }))}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="CLUB">نادي قراءة (Reading Club)</option>
                    <option value="NEIGHBORHOOD">حي سكني (Neighborhood)</option>
                    <option value="UNIVERSITY">جامعة / طلاب (University)</option>
                    <option value="COMPANY">شركة (Company)</option>
                    <option value="SCHOOL">مدرسة (School)</option>
                    <option value="OTHER">أخرى (Other)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    {lang === 'ar' ? 'رابط صورة الغلاف' : 'Cover Image URL'}
                  </label>
                  <input
                    type="url"
                    value={editForm.cover_image_url}
                    onChange={e => setEditForm(prev => ({ ...prev, cover_image_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  {lang === 'ar' ? 'وصف المجتمع' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={editForm.description_ar}
                  onChange={e => setEditForm(prev => ({ ...prev, description_ar: e.target.value }))}
                  className="w-full rounded-xl border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    {lang === 'ar' ? 'المدينة والمنطقة العامة (الموقع)' : 'Location / Area'}
                  </label>
                  <input
                    type="text"
                    value={editForm.location_text}
                    onChange={e => setEditForm(prev => ({ ...prev, location_text: e.target.value }))}
                    placeholder={lang === 'ar' ? 'مثال: المعادي، القاهرة' : 'e.g., Maadi, Cairo'}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="border-t pt-3 space-y-3">
                  <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Coffee className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'نقطة اللقاء الآمنة (Safe Meetup Hub)' : 'Designated Safe Meetup Hub'}</span>
                  </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground block">
                      {lang === 'ar' ? 'اسم المكان (المقهى / المكتبة)' : 'Hub Name'}
                    </label>
                    <input
                      type="text"
                      value={editForm.hub_name}
                      onChange={e => setEditForm(prev => ({ ...prev, hub_name: e.target.value }))}
                      className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground block">
                      {lang === 'ar' ? 'عنوان المكان' : 'Hub Address'}
                    </label>
                    <input
                      type="text"
                      value={editForm.hub_address}
                      onChange={e => setEditForm(prev => ({ ...prev, hub_address: e.target.value }))}
                      className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground block">
                    {lang === 'ar' ? 'تعليمات وإرشادات المقابلة' : 'Hub Instructions'}
                  </label>
                  <input
                    type="text"
                    value={editForm.hub_instructions}
                    onChange={e => setEditForm(prev => ({ ...prev, hub_instructions: e.target.value }))}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="adminCommApproval"
                  checked={editForm.requires_approval}
                  onChange={e => setEditForm(prev => ({ ...prev, requires_approval: e.target.checked }))}
                  className="rounded accent-primary cursor-pointer"
                />
                <label htmlFor="adminCommApproval" className="text-xs font-semibold text-foreground cursor-pointer">
                  {lang === 'ar' ? 'يتطلب موافقة الأدمن لانضمام الأعضاء (مجتمع خاص)' : 'Requires admin approval for members (Private)'}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingComm(null)}
                  className="cursor-pointer text-xs"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={isSavingComm}
                  className="cursor-pointer text-xs font-bold gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Delete Community Modal */}
      {deletingComm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-card border-2 border-red-500/40 shadow-2xl p-6 text-foreground space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black">
                  {lang === 'ar' ? 'تأكيد حذف المجتمع نهائياً' : 'Confirm Delete Community'}
                </h3>
                <p className="text-xs text-muted-foreground">{deletingComm.name_ar || deletingComm.name}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === 'ar'
                ? 'هل أنت متأكد من رغبتك كمسؤول في حذف هذا المجتمع نهائياً؟ سيتم مسح المنشورات ورفوف الكتب وقائمة الأعضاء المرتبطة به.'
                : 'Are you sure you want to delete this community? All posts, shelf books, and member associations will be permanently removed.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingComm(null)}
                className="cursor-pointer text-xs"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                loading={isDeletingComm}
                onClick={handleDeleteCommunityAdmin}
                className="cursor-pointer text-xs font-bold gap-1 bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'تأكيد الحذف النهائي' : 'Confirm Delete'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Anti-Spam & Authenticity Verification Modal */}
      {inspectingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border shadow-2xl p-5 sm:p-6 text-foreground space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0">
                  {inspectingApp.is_online_only || inspectingApp.store_type === 'ONLINE' ? '🌐' : '🏪'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-foreground">
                      {inspectingApp.store_name_ar || inspectingApp.store_name || inspectingApp.business_name}
                    </h3>
                    {inspectingApp.is_online_only || inspectingApp.store_type === 'ONLINE' ? (
                      <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[10px] font-bold">
                        🌐 {lang === 'ar' ? 'متجر أونلاين فقط' : 'Online Only'}
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                        📍 {lang === 'ar' ? 'مقر فعلي' : 'Physical Store'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lang === 'ar' ? 'مقدم الطلب:' : 'Applicant:'} <span className="font-semibold text-foreground">{inspectingApp.owner_name || inspectingApp.applicant_name}</span> • <span dir="ltr" className="font-mono">{inspectingApp.phone}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingApp(null)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Application Overview Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
                <span className="text-muted-foreground font-medium block">
                  {lang === 'ar' ? 'المقر / نطاق الشحن والتوزيع:' : 'Location & Shipping:'}
                </span>
                <p className="font-bold text-foreground">
                  {inspectingApp.is_online_only || inspectingApp.store_type === 'ONLINE'
                    ? (lang === 'ar' ? '🚚 متجر إلكتروني — شحن لجميع المحافظات' : '🚚 E-Commerce — Nationwide Delivery')
                    : `${inspectingApp.city} — ${inspectingApp.address || ''}`}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
                <span className="text-muted-foreground font-medium block">
                  {lang === 'ar' ? 'تقدير المخزون والسجل:' : 'Inventory & CR:'}
                </span>
                <p className="font-bold text-foreground">
                  {inspectingApp.monthly_book_estimate || (lang === 'ar' ? 'غير محدد' : 'N/A')}
                  {inspectingApp.commercial_reg && ` • س.ت: ${inspectingApp.commercial_reg}`}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1">
                <span className="text-muted-foreground font-medium block">
                  {lang === 'ar' ? 'نوع الشراكة والنشاط:' : 'Partner Category:'}
                </span>
                <p className="font-bold text-foreground">
                  {inspectingApp.partner_type === 'BOOKSTORE'
                    ? (lang === 'ar' ? '📚 متجر ومكتبة كتب' : '📚 Bookstore')
                    : inspectingApp.partner_type === 'EVENT_ORGANIZER'
                    ? (lang === 'ar' ? '🎪 تنظيم فعاليات قراءة' : '🎪 Event Organizer')
                    : (lang === 'ar' ? '🛍️ مكتبة + تنظيم فعاليات' : '🛍️ Hybrid Partner')}
                </p>
              </div>
            </div>

            {/* Store Bio / Description */}
            {(inspectingApp.bio || inspectingApp.bio_ar || inspectingApp.details) && (
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-1.5 text-xs">
                <span className="text-[11px] font-bold text-muted-foreground block flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>{lang === 'ar' ? 'نبذة المتجر والأنشطة والكتب المعروضة:' : 'Store Bio & Books Overview:'}</span>
                </span>
                <p className="text-foreground leading-relaxed">
                  {inspectingApp.bio_ar || inspectingApp.bio || inspectingApp.details}
                </p>
              </div>
            )}

            {/* Social Media Channels Direct Audit (All Channels in Popup) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-primary" />
                  <span>{lang === 'ar' ? 'كافة قنوات التواصل والحسابات الرقمية' : 'All Digital & Social Channels'}</span>
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {lang === 'ar' ? 'اضغط لفتح ومراجعة أي حساب' : 'Click to inspect any profile'}
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {/* Facebook */}
                <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <span>🌐</span>
                      <span>Facebook</span>
                    </span>
                    {inspectingApp.social_links?.facebook ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                        {lang === 'ar' ? 'مرفق' : 'Linked'}
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold">
                        {lang === 'ar' ? 'غير متوفر' : 'Missing'}
                      </span>
                    )}
                  </div>
                  {inspectingApp.social_links?.facebook ? (
                    <a
                      href={inspectingApp.social_links.facebook.startsWith('http') ? inspectingApp.social_links.facebook : `https://facebook.com/${inspectingApp.social_links.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between text-xs font-semibold text-blue-600 hover:underline"
                    >
                      <span className="truncate">{inspectingApp.social_links.facebook}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 ms-1" />
                    </a>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      {lang === 'ar' ? 'اطلب رابط الصفحة لمراجعة التقييمات' : 'Request Facebook page link'}
                    </p>
                  )}
                </div>

                {/* Instagram */}
                <div className="p-3 rounded-xl border border-pink-500/20 bg-pink-500/5 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-pink-600 dark:text-pink-400">
                      <span>📸</span>
                      <span>Instagram</span>
                    </span>
                    {inspectingApp.social_links?.instagram ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                        {lang === 'ar' ? 'مرفق' : 'Linked'}
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold">
                        {lang === 'ar' ? 'غير متوفر' : 'Missing'}
                      </span>
                    )}
                  </div>
                  {inspectingApp.social_links?.instagram ? (
                    <a
                      href={inspectingApp.social_links.instagram.startsWith('http') ? inspectingApp.social_links.instagram : `https://instagram.com/${inspectingApp.social_links.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between text-xs font-semibold text-pink-600 hover:underline"
                    >
                      <span className="truncate">{inspectingApp.social_links.instagram}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 ms-1" />
                    </a>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      {lang === 'ar' ? 'اطلب رابط الإنستغرام عبر الواتساب' : 'Request Instagram via WhatsApp'}
                    </p>
                  )}
                </div>

                {/* WhatsApp */}
                <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                      {lang === 'ar' ? 'مباشر' : 'Direct'}
                    </span>
                  </div>
                  {(() => {
                    const cleanPhone = (inspectingApp.phone || '').replace(/[^0-9]/g, '')
                    const intlPhone = cleanPhone.startsWith('0') ? '20' + cleanPhone.slice(1) : cleanPhone
                    return (
                      <a
                        href={`https://wa.me/${intlPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-between text-xs font-semibold text-emerald-600 hover:underline"
                      >
                        <span dir="ltr" className="font-mono">{inspectingApp.phone}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 ms-1" />
                      </a>
                    )
                  })()}
                </div>

                {/* Email Verification Channel */}
                <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-primary">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'البريد الإلكتروني للإشعارات' : 'Notification Email'}</span>
                    </span>
                    {inspectingApp.email ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                        {lang === 'ar' ? 'متاح للإرسال ✉️' : 'Ready ✉️'}
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold">
                        {lang === 'ar' ? 'غير مسجل' : 'Missing'}
                      </span>
                    )}
                  </div>
                  {inspectingApp.email ? (
                    <a
                      href={`mailto:${inspectingApp.email}`}
                      className="inline-flex items-center justify-between text-xs font-semibold text-primary hover:underline font-mono"
                      dir="ltr"
                    >
                      <span className="truncate">{inspectingApp.email}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 ms-1" />
                    </a>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      {lang === 'ar' ? 'لم يسجل بريد إلكتروني بالطلب' : 'No email in application'}
                    </p>
                  )}
                </div>

                {/* Website */}
                <div className="p-3 rounded-xl border border-border bg-card flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                      <span>🔗</span>
                      <span>Website</span>
                    </span>
                    {inspectingApp.website_url ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                        {lang === 'ar' ? 'مرفق' : 'Linked'}
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">
                        {lang === 'ar' ? 'اختياري' : 'Optional'}
                      </span>
                    )}
                  </div>
                  {inspectingApp.website_url ? (
                    <a
                      href={inspectingApp.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between text-xs font-semibold text-primary hover:underline"
                    >
                      <span className="truncate">{inspectingApp.website_url}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 ms-1" />
                    </a>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      {lang === 'ar' ? 'متجر إلكتروني مستقل (إن وجد)' : 'Independent e-commerce site'}
                    </p>
                  )}
                </div>

                {/* TikTok */}
                <div className="p-3 rounded-xl border border-border bg-card flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                      <span>🎵</span>
                      <span>TikTok</span>
                    </span>
                    {inspectingApp.social_links?.tiktok ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                        {lang === 'ar' ? 'مرفق' : 'Linked'}
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">
                        {lang === 'ar' ? 'اختياري' : 'Optional'}
                      </span>
                    )}
                  </div>
                  {inspectingApp.social_links?.tiktok ? (
                    <a
                      href={inspectingApp.social_links.tiktok.startsWith('http') ? inspectingApp.social_links.tiktok : `https://tiktok.com/@${inspectingApp.social_links.tiktok.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between text-xs font-semibold text-primary hover:underline"
                    >
                      <span className="truncate">{inspectingApp.social_links.tiktok}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 ms-1" />
                    </a>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      {lang === 'ar' ? 'حساب مراجعات وتوصيات تيك توك' : 'BookTok profile'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Anti-Spam 4-Step Verification Checklist */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'قائمة التحقق من المصداقية ومكافحة السمسرة والسبام' : 'Anti-Spam & Authenticity Verification Checklist'}</span>
                </h4>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {lang === 'ar' ? 'إجراءات الأدمن' : 'Admin Audit'}
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <label className="flex items-start gap-2.5 p-2 rounded-xl bg-card border border-border/80 cursor-pointer hover:bg-muted/30">
                  <input type="checkbox" defaultChecked={Boolean(inspectingApp.social_links?.instagram || inspectingApp.verification_signals?.social_verified)} className="rounded mt-0.5 accent-primary" />
                  <div>
                    <p className="font-bold text-foreground">
                      {lang === 'ar' ? '1. فحص الحساب الرقمي (Instagram/Facebook Age & Real Engagement)' : '1. Social Footprint & Real Engagement'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {lang === 'ar'
                        ? 'عمر الحساب يتجاوز 3 أشهر، منشورات كتب حقيقية، تعليقات قراء حقيقيين وليست حسابات روبوت أو متابعين تم شراؤهم.'
                        : 'Account age > 3 months, legitimate book photos, genuine reader inquiries (not bought bot followers).'}
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 rounded-xl bg-card border border-border/80 cursor-pointer hover:bg-muted/30">
                  <input type="checkbox" defaultChecked={Boolean(inspectingApp.verification_signals?.whatsapp_business)} className="rounded mt-0.5 accent-primary" />
                  <div>
                    <p className="font-bold text-foreground">
                      {lang === 'ar' ? '2. واتساب تجاري موثق (WhatsApp Business Profile)' : '2. Active WhatsApp Business'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {lang === 'ar'
                        ? 'الرقم مسجل كنشاط تجاري، يمتلك كتالوج كتب معروضة بأسعارها، ومطابق للرقم المذكور في بايو الحسابات.'
                        : 'Number has WhatsApp Business catalog, listed book prices, matching bio contact info.'}
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 rounded-xl bg-card border border-border/80 cursor-pointer hover:bg-muted/30">
                  <input type="checkbox" defaultChecked={Boolean(inspectingApp.verification_signals?.sample_video_verified)} className="rounded mt-0.5 accent-primary" />
                  <div>
                    <p className="font-bold text-foreground flex items-center gap-1.5 text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? '3. فيديو إثبات المخزون الفعلي (10s Live Stock Video - الحاسم لمنع السماسرة)' : '3. Live Stock Video Proof (Decisive Anti-Spotter Test)'}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {lang === 'ar'
                        ? 'فيديو سريع مدته 10 ثوانٍ يصور فيه التاجر رفوف الكتب بيده حاملاً ورقة مكتوبة بخط اليد: "ورق كونكت + تاريخ اليوم". هذا يمنع أي وسيط لا يملك الكتب في يده.'
                        : '10s video showing actual bookshelves holding handwritten paper "WaraqConnect + Date". Eliminates 100% of middlemen without physical stock.'}
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 rounded-xl bg-card border border-border/80 cursor-pointer hover:bg-muted/30">
                  <input type="checkbox" defaultChecked={Boolean(inspectingApp.verification_signals?.national_id_or_cr || inspectingApp.commercial_reg)} className="rounded mt-0.5 accent-primary" />
                  <div>
                    <p className="font-bold text-foreground">
                      {lang === 'ar' ? '4. التحقق من الهوية القانونية (Commercial Reg / National ID)' : '4. Legal Identity Check'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {lang === 'ar'
                        ? 'سجل تجاري، بطاقة ضريبية، أو صورة بطاقة الرقم القومي لمسؤول المتجر لضمان وجود شخص مسؤول قانونياً.'
                        : 'Commercial register, Maroof permit, or national ID of the curator.'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border">
              {/* WhatsApp Verification Request Button */}
              {(() => {
                const cleanPhone = (inspectingApp.phone || '').replace(/[^0-9]/g, '')
                const intlPhone = cleanPhone.startsWith('0') ? '20' + cleanPhone.slice(1) : cleanPhone
                const waMessage = lang === 'ar'
                  ? `مرحباً أستاذ ${inspectingApp.owner_name || inspectingApp.applicant_name}، نتواصل معك من إدارة منصة ورق كونكت بخصوص اعتماد متجركم (${inspectingApp.store_name_ar || inspectingApp.store_name || inspectingApp.business_name}). لمتابعة منحكم شارة الشريك المعتمد 🟢، برجاء التكرم بمشاركتنا: 1. رابط حساب إنستغرام أو فيسبوك الرسمي. 2. فيديو سريع مدته 10 ثوانٍ لرفوف الكتب مع ورقة تحمل اسم المنصة وتاريخ اليوم.`
                  : `Hello ${inspectingApp.owner_name || inspectingApp.applicant_name}, contacting you from WaraqConnect regarding your partner application. To grant the Verified Partner badge, kindly provide: 1. Official Instagram/Facebook profile. 2. A quick 10-second video of your book collection with a handwritten note "WaraqConnect + Date".`

                return (
                  <a
                    href={`https://wa.me/${intlPhone}?text=${encodeURIComponent(waMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/25 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                    <span>{lang === 'ar' ? 'مراسلة واتساب لطلب الفيديو والحساب' : 'Request Video & Socials on WhatsApp'}</span>
                  </a>
                )
              })()}

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectingApp(null)}
                  className="text-xs cursor-pointer"
                >
                  {lang === 'ar' ? 'إغلاق' : 'Close'}
                </Button>

                {inspectingApp.status === 'APPROVED' && (
                  <div className="flex flex-wrap items-center gap-2">
                    {inspectingApp.phone && (
                      <a
                        href={`https://wa.me/${inspectingApp.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `🎉 مرحباً بك يا ${inspectingApp.owner_name || inspectingApp.applicant_name}! تم اعتماد وتوثيق متجركم (${inspectingApp.store_name_ar || inspectingApp.business_name}) رسمياً على منصة WaraqConnect.\n\n📚 يمكنك الآن الدخول إلى لوحة التحكم لإضافة الكتب وباقات العروض المجمعة (Bundle Packages):\n${typeof window !== 'undefined' ? window.location.origin : ''}/store-dashboard`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{lang === 'ar' ? 'إشعار بالواتساب' : 'WhatsApp Notification'}</span>
                      </a>
                    )}
                    {inspectingApp.email && (
                      <a
                        href={`mailto:${inspectingApp.email}?subject=${encodeURIComponent(
                          `🎉 تم اعتماد وتفعيل متجركم (${inspectingApp.store_name_ar || inspectingApp.business_name}) على منصة WaraqConnect`
                        )}&body=${encodeURIComponent(
                          `مرحباً ${inspectingApp.owner_name || inspectingApp.applicant_name}،\n\nيسعدنا إعلامك بأنه تم اعتماد وتوثيق متجركم رسمياً كشريك في منصة WaraqConnect!\n\nيمكنك الآن البدء بإضافة كتبك وإنشاء باقات عروض التوفير عبر لوحة التحكم:\n${typeof window !== 'undefined' ? window.location.origin : ''}/stores/dashboard\n\nمع تحيات فريق WaraqConnect.`
                        )}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <Mail className="h-4 w-4" />
                        <span>{lang === 'ar' ? 'إرسال إيميل التفعيل' : 'Send Email'}</span>
                      </a>
                    )}
                  </div>
                )}

                {inspectingApp.status === 'PENDING' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRejectStore(inspectingApp.id)}
                      className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold cursor-pointer"
                    >
                      {lang === 'ar' ? 'رفض' : 'Reject'}
                    </Button>
                    <Button
                      size="sm"
                      loading={approvingId === inspectingApp.id}
                      onClick={() => handleApproveStore(inspectingApp.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 cursor-pointer"
                    >
                      <CheckCheck className="h-4 w-4" />
                      <span>{lang === 'ar' ? 'اعتماد وتوثيق كشريك رسمي' : 'Approve & Verify Partner'}</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Bookstore Full Details & Channels Modal */}
      {inspectingStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border shadow-2xl p-5 sm:p-6 text-foreground space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center text-xl shrink-0">
                  {inspectingStore.logo_url ? (
                    <img src={inspectingStore.logo_url} alt="" className="h-full w-full object-cover" />
                  ) : inspectingStore.store_type === 'ONLINE' ? (
                    '🌐'
                  ) : (
                    '🏪'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-foreground">
                      {lang === 'ar' ? inspectingStore.name_ar || inspectingStore.name : inspectingStore.name || inspectingStore.name_ar}
                    </h3>
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{lang === 'ar' ? 'شريك موثق رسمي' : 'Verified Partner'}</span>
                    </Badge>
                    {inspectingStore.store_type === 'ONLINE' ? (
                      <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[10px] font-bold">
                        🌐 {lang === 'ar' ? 'متجر أونلاين فقط' : 'Online Only'}
                      </Badge>
                    ) : (
                      <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] font-bold">
                        📍 {lang === 'ar' ? 'مقر فعلي' : 'Physical Store'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    /stores/{inspectingStore.slug}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingStore(null)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/30 border border-border">
                <span className="text-muted-foreground font-medium block">
                  {lang === 'ar' ? 'التقييم العام:' : 'Rating:'}
                </span>
                <p className="font-extrabold text-amber-500 flex items-center gap-1 mt-0.5 text-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  <span>{inspectingStore.rating_average || 5.0}</span>
                  <span className="text-[10px] text-muted-foreground font-normal">({inspectingStore.rating_count || 1})</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border">
                <span className="text-muted-foreground font-medium block">
                  {lang === 'ar' ? 'الكتب المعروضة:' : 'Listings:'}
                </span>
                <p className="font-extrabold text-foreground mt-0.5 text-sm">
                  {inspectingStore.total_listings || 0} {lang === 'ar' ? 'كتاب' : 'books'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border">
                <span className="text-muted-foreground font-medium block">
                  {lang === 'ar' ? 'المبيعات المنفذة:' : 'Sales:'}
                </span>
                <p className="font-extrabold text-foreground mt-0.5 text-sm">
                  {inspectingStore.total_sales || 0} {lang === 'ar' ? 'طلب' : 'orders'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border">
                <span className="text-muted-foreground font-medium block">
                  {lang === 'ar' ? 'المتابعون:' : 'Followers:'}
                </span>
                <p className="font-extrabold text-foreground mt-0.5 text-sm">
                  {inspectingStore.follower_count || 0}
                </p>
              </div>
            </div>

            {/* Address & Scope */}
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-1 text-xs">
              <span className="text-[11px] font-bold text-muted-foreground block">
                {lang === 'ar' ? 'المقر والنطاق الجغرافي:' : 'Location & Coverage Scope:'}
              </span>
              <p className="font-bold text-foreground">
                {inspectingStore.store_type === 'ONLINE'
                  ? (lang === 'ar' ? '🌐 متجر إلكتروني — شحن وتوصيل لكافة المحافظات' : '🌐 E-Commerce — Nationwide Delivery')
                  : inspectingStore.address || 'القاهرة'}
              </p>
            </div>

            {/* Store Description */}
            {(inspectingStore.description || inspectingStore.description_ar) && (
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border space-y-1.5 text-xs">
                <span className="text-[11px] font-bold text-muted-foreground block flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>{lang === 'ar' ? 'وصف المتجر ومجموعات الكتب:' : 'Store Description:'}</span>
                </span>
                <p className="text-foreground leading-relaxed">
                  {lang === 'ar' ? inspectingStore.description_ar || inspectingStore.description : inspectingStore.description || inspectingStore.description_ar}
                </p>
              </div>
            )}

            {/* All Digital & Social Channels */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-primary" />
                <span>{lang === 'ar' ? 'كافة قنوات التواصل والروابط الرقمية' : 'All Digital & Social Channels'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {/* Facebook */}
                <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <span>🌐</span>
                      <span>Facebook</span>
                    </span>
                    {inspectingStore.social_links?.facebook ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                        {lang === 'ar' ? 'مفعل' : 'Live'}
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">
                        {lang === 'ar' ? 'غير مسجل' : 'N/A'}
                      </span>
                    )}
                  </div>
                  {inspectingStore.social_links?.facebook ? (
                    <a
                      href={inspectingStore.social_links.facebook.startsWith('http') ? inspectingStore.social_links.facebook : `https://facebook.com/${inspectingStore.social_links.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between text-xs font-semibold text-blue-600 hover:underline"
                    >
                      <span className="truncate">{inspectingStore.social_links.facebook}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 ms-1" />
                    </a>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      {lang === 'ar' ? 'غير مضاف' : 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Instagram */}
                <div className="p-3 rounded-xl border border-pink-500/20 bg-pink-500/5 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-pink-600 dark:text-pink-400">
                      <span>📸</span>
                      <span>Instagram</span>
                    </span>
                    {inspectingStore.social_links?.instagram ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                        {lang === 'ar' ? 'مفعل' : 'Live'}
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">
                        {lang === 'ar' ? 'غير مسجل' : 'N/A'}
                      </span>
                    )}
                  </div>
                  {inspectingStore.social_links?.instagram ? (
                    <a
                      href={inspectingStore.social_links.instagram.startsWith('http') ? inspectingStore.social_links.instagram : `https://instagram.com/${inspectingStore.social_links.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between text-xs font-semibold text-pink-600 hover:underline"
                    >
                      <span className="truncate">{inspectingStore.social_links.instagram}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 ms-1" />
                    </a>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      {lang === 'ar' ? 'غير مضاف' : 'Not provided'}
                    </p>
                  )}
                </div>

                {/* WhatsApp */}
                <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </span>
                    {inspectingStore.social_links?.whatsapp ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                        {lang === 'ar' ? 'مفعل' : 'Live'}
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">
                        {lang === 'ar' ? 'غير مسجل' : 'N/A'}
                      </span>
                    )}
                  </div>
                  {inspectingStore.social_links?.whatsapp ? (
                    <a
                      href={`https://wa.me/${inspectingStore.social_links.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between text-xs font-semibold text-emerald-600 hover:underline"
                    >
                      <span dir="ltr" className="font-mono">{inspectingStore.social_links.whatsapp}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 ms-1" />
                    </a>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      {lang === 'ar' ? 'غير مضاف' : 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Website */}
                <div className="p-3 rounded-xl border border-border bg-card flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                      <span>🔗</span>
                      <span>Website</span>
                    </span>
                    {inspectingStore.website_url ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                        {lang === 'ar' ? 'مفعل' : 'Live'}
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">
                        {lang === 'ar' ? 'غير مسجل' : 'N/A'}
                      </span>
                    )}
                  </div>
                  {inspectingStore.website_url ? (
                    <a
                      href={inspectingStore.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between text-xs font-semibold text-primary hover:underline"
                    >
                      <span className="truncate">{inspectingStore.website_url}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 ms-1" />
                    </a>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      {lang === 'ar' ? 'لا يوجد موقع مستقل' : 'No external site'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions & Admin Controls (Hide / Unhide / Delete / Open) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border">
              <div className="flex flex-wrap items-center gap-2">
                {/* Edit Store Details */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const s = inspectingStore
                    setInspectingStore(null)
                    handleOpenEditStore(s)
                  }}
                  className="text-xs font-bold gap-1.5 cursor-pointer text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'تعديل بيانات المتجر' : 'Edit Store'}</span>
                </Button>

                {/* Hide / Unhide Store */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleStoreActive(inspectingStore.id, inspectingStore.is_active !== false)}
                  className={cn(
                    "text-xs font-bold gap-1.5 cursor-pointer",
                    inspectingStore.is_active === false
                      ? "text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                      : "text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                  )}
                >
                  {inspectingStore.is_active === false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  <span>{inspectingStore.is_active === false ? (lang === 'ar' ? 'إظهار المتجر بالدليل' : 'Unhide') : (lang === 'ar' ? 'إخفاء من الدليل' : 'Hide')}</span>
                </Button>

                {/* Toggle Verified Badge */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleStoreVerified(inspectingStore.id, inspectingStore.is_verified)}
                  className="text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className={cn("h-3.5 w-3.5", inspectingStore.is_verified ? "text-emerald-600" : "text-muted-foreground")} />
                  <span>{inspectingStore.is_verified ? (lang === 'ar' ? 'إلغاء التوثيق' : 'Unverify') : (lang === 'ar' ? 'منح التوثيق 🟢' : 'Verify 🟢')}</span>
                </Button>

                {/* Delete Store */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteStore(inspectingStore.id, inspectingStore.name_ar || inspectingStore.name)}
                  className="text-xs font-bold gap-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'حذف المتجر نهائياً' : 'Delete Store'}</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/stores/${inspectingStore.slug}`} target="_blank">
                  <Button size="sm" className="text-xs font-bold gap-1.5 cursor-pointer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'فتح صفحة المتجر' : 'Public Storefront'}</span>
                  </Button>
                </Link>
                <Link href={`/stores/dashboard?store=${inspectingStore.id}`} target="_blank">
                  <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 cursor-pointer">
                    <span>{lang === 'ar' ? 'لوحة التاجر' : 'Merchant'}</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInspectingStore(null)}
                  className="text-xs cursor-pointer"
                >
                  {lang === 'ar' ? 'إغلاق' : 'Close'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bookstore Modal */}
      {editingStore && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-card border-2 border-border p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-black text-foreground text-sm flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-primary" />
                <span>{lang === 'ar' ? `تعديل بيانات: ${editingStore.name_ar || editingStore.name}` : `Edit Store: ${editingStore.name}`}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingStore(null)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStoreEdit} className="space-y-4 text-xs">
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">
                    {lang === 'ar' ? 'اسم المتجر (بالعربية) *' : 'Store Name (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editStoreForm.name_ar}
                    onChange={e => setEditStoreForm(prev => ({ ...prev, name_ar: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 font-bold text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">
                    {lang === 'ar' ? 'الاسم بالإنجليزية' : 'Store Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={editStoreForm.name}
                    onChange={e => setEditStoreForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 font-bold text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Format & Slogan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">
                    {lang === 'ar' ? 'طبيعة التواجد *' : 'Store Format *'}
                  </label>
                  <select
                    value={editStoreForm.store_type}
                    onChange={e => setEditStoreForm(prev => ({ ...prev, store_type: e.target.value as StoreType }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="ONLINE">{lang === 'ar' ? 'متجر إلكتروني أونلاين فقط' : 'Online Only'}</option>
                    <option value="OFFLINE">{lang === 'ar' ? 'مقر وفرع فعلي' : 'Physical Store'}</option>
                    <option value="BOTH">{lang === 'ar' ? 'مقر فعلي + بيع وشحن أونلاين' : 'Hybrid'}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">
                    {lang === 'ar' ? 'شعار المتجر (Slogan)' : 'Slogan / Tagline'}
                  </label>
                  <input
                    type="text"
                    value={editStoreForm.slogan}
                    onChange={e => setEditStoreForm(prev => ({ ...prev, slogan: e.target.value }))}
                    placeholder="وجهتك الأولى للروايات والكتب النادرة"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="font-bold text-foreground">
                  {lang === 'ar' ? 'العنوان / نطاق التغطية' : 'Address / Coverage'}
                </label>
                <input
                  type="text"
                  value={editStoreForm.address}
                  onChange={e => setEditStoreForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={editStoreForm.store_type === 'ONLINE' ? 'شحن لجميع المحافظات' : 'شارع 9، المعادي، القاهرة'}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Contacts: WhatsApp & Socials */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">WhatsApp</label>
                  <input
                    type="text"
                    value={editStoreForm.whatsapp}
                    onChange={e => setEditStoreForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="010..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Facebook</label>
                  <input
                    type="text"
                    value={editStoreForm.facebook}
                    onChange={e => setEditStoreForm(prev => ({ ...prev, facebook: e.target.value }))}
                    placeholder="fb.com/..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Instagram</label>
                  <input
                    type="text"
                    value={editStoreForm.instagram}
                    onChange={e => setEditStoreForm(prev => ({ ...prev, instagram: e.target.value }))}
                    placeholder="@..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-foreground">
                  {lang === 'ar' ? 'نبذة ووصف المتجر' : 'Store Bio / Description'}
                </label>
                <textarea
                  rows={3}
                  value={editStoreForm.description_ar}
                  onChange={e => setEditStoreForm(prev => ({ ...prev, description_ar: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Status Toggles: Active & Verified */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-muted/40 border border-border">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editStoreForm.is_active}
                    onChange={e => setEditStoreForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                  />
                  <div>
                    <span className="font-bold text-foreground block">
                      {lang === 'ar' ? 'المتجر نشط ومعروض للجمهور' : 'Store Active & Public'}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {lang === 'ar' ? 'إلغاء التحديد يخفي المتجر من الدليل العام والبحث' : 'Unchecking hides store from directory'}
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editStoreForm.is_verified}
                    onChange={e => setEditStoreForm(prev => ({ ...prev, is_verified: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-foreground block">
                      {lang === 'ar' ? 'شارة التوثيق الرسمي 🟢' : 'Verified Badge 🟢'}
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      {lang === 'ar' ? 'تظهر شارة التوثيق الأخضر للمتجر' : 'Grants official green checkmark'}
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingStore(null)}
                  className="rounded-xl font-bold cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingStore}
                  className="rounded-xl font-bold bg-primary text-primary-foreground cursor-pointer"
                >
                  {isSavingStore ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

