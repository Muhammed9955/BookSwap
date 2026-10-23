'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import QRCode from 'qrcode'

// Dynamic Map Picker (SSR-safe for Leaflet)
const MapLocationPicker = dynamic(
  () => import('@/components/common/map-location-picker').then(mod => mod.MapLocationPicker),
  { ssr: false }
)

import {
  Users,
  MapPin,
  BookOpen,
  Coffee,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Plus,
  Send,
  Heart,
  Share2,
  Calendar,
  Sparkles,
  ArrowRightLeft,
  Clock,
  ShieldCheck,
  Settings,
  UserCheck,
  UserX,
  Check,
  X,
  BookMarked,
  Trash2,
  AlertTriangle,
  QrCode,
  Package,
  Edit3,
  Layers,
  Camera,
  UploadCloud,
  Image as ImageIcon,
  Eye,
  Search,
  LayoutGrid,
  List,
  Star,
  Info,
  RectangleVertical,
  Columns2,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { cn, formatPrice, getConditionLabel } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  toggleCommunityMembership,
  addCommunityPost,
  getCommunityMembers,
  updateMemberStatus,
  addBookToCommunity,
  addBooksBatchToCommunity,
  getUserBooksForCommunity,
  updateCommunityDetails,
  deleteCommunity,
  updateCommunityBookApproval,
  approveAllPendingCommunityBooks,
  generateCommunityIntakePin,
  removeBookFromCommunityShelf,
} from '@/lib/communities/community-service'
import { CommunityIntakeQrModal } from './community-intake-qr-modal'
import { ImageUploadDropzone } from '@/components/common/image-upload-dropzone'
import { DEFAULT_EGYPT_CITIES } from './communities-list-client'
import {
  submitBuyRequest,
  submitBorrowRequest,
  submitSwapRequest,
  pushNotificationSafe,
  type MeetupProposal,
} from '@/lib/transactions/lifecycle'
import type { Community, CommunityPost, BookListing, CommunityMember, CommunityOrgType } from '@/types'

// Preset covers for instant selection
const PRESET_COVERS = [
  { label: 'مكتبة كلاسيكية 📚', url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80' },
  { label: 'مقهى قراءة ثقافي ☕', url: 'https://images.unsplash.com/photo-1507842229451-7f01be44c067?auto=format&fit=crop&w=1200&q=80' },
  { label: 'جلسة مناقشة وكتب 🛋️', url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80' },
  { label: 'واحة قراءة خضراء 🌿', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80' },
  { label: 'صالون أدبي عريق 🏛️', url: 'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=1200&q=80' },
  { label: 'كورنيش وبحر وقراءة 🌊', url: 'https://images.unsplash.com/photo-1526721940322-10fb6e3ae94a?auto=format&fit=crop&w=1200&q=80' },
]

// Preset logos
const PRESET_LOGOS = [
  { label: 'شعار كتاب 📖', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80' },
  { label: 'فنجان وفكر ☕', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80' },
  { label: 'مصباح المعرفة 💡', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=300&q=80' },
  { label: 'شجرة المعرفة 🌳', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=300&q=80' },
  { label: 'فنون وروايات 🎨', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=80' },
]

interface CommunityDetailClientProps {
  community: Community
  initialIsMember: boolean
  initialMembershipStatus?: string
  posts: CommunityPost[]
  books?: any[]
  initialPendingBooks?: any[]
  currentUserId?: string | null
  userRole?: string | null
  isPlatformAdmin?: boolean
}

type TabType = 'bookshelf' | 'discussion' | 'safe-hub' | 'admin'

// Curated demo book listings available in this community
const DEMO_COMMUNITY_BOOKS = [
  {
    id: 'book-comm-1',
    title: 'سر الغرفة 207',
    author: 'أحمد خالد توفيق',
    cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    type: 'SWAP',
    condition: 'LIKE_NEW',
    owner_name: 'عمر الشريف',
    owner_rating: 4.9,
    price: null,
  },
  {
    id: 'book-comm-2',
    title: 'ثلاثية غرناطة',
    author: 'رضوى عاشور',
    cover_image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
    type: 'SWAP',
    condition: 'VERY_GOOD',
    owner_name: 'سارة منصور',
    owner_rating: 5.0,
    price: null,
  },
  {
    id: 'book-comm-3',
    title: 'Atomic Habits (العادات الذرية)',
    author: 'James Clear',
    cover_image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80',
    type: 'BORROW',
    condition: 'NEW',
    owner_name: 'كريم حسني',
    owner_rating: 4.8,
    borrow_fee: 15,
    deposit: 80,
  },
  {
    id: 'book-comm-4',
    title: 'قواعد العشق الأربعون',
    author: 'إليف شافاق',
    cover_image_url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=400&q=80',
    type: 'SELL',
    condition: 'VERY_GOOD',
    owner_name: 'منى خليل',
    owner_rating: 4.7,
    price: 65,
  },
  {
    id: 'book-comm-5',
    title: 'مائة عام من العزلة',
    author: 'غابرييل غارسيا ماركيز',
    cover_image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=400&q=80',
    type: 'BORROW',
    condition: 'GOOD',
    owner_name: 'ياسمين طه',
    owner_rating: 4.9,
    borrow_fee: 20,
    deposit: 90,
  },
  {
    id: 'book-comm-6',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    cover_image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80',
    type: 'SWAP',
    condition: 'LIKE_NEW',
    owner_name: 'أحمد فؤاد',
    owner_rating: 5.0,
    price: null,
  },
]

export function CommunityDetailClient({
  community,
  initialIsMember,
  posts: initialPosts,
  books: initialBooks = [],
  initialPendingBooks = [],
  currentUserId,
  userRole,
  isPlatformAdmin = false,
}: CommunityDetailClientProps) {
  const { lang, isRTL } = useLanguage()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<TabType>('bookshelf')
  const [isMember, setIsMember] = useState(initialIsMember)
  const [memberCount, setMemberCount] = useState(community.member_count)
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts)
  const [newPostContent, setNewPostContent] = useState('')
  const [bookFilter, setBookFilter] = useState<'ALL' | 'SWAP' | 'BORROW' | 'SELL'>('ALL')
  const [bookshelfView, setBookshelfView] = useState<'grid' | 'list'>('grid')
  const [mobileCols, setMobileCols] = useState<'1' | '2'>('2')
  const [bookshelfSearch, setBookshelfSearch] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  // Sync mobile columns preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('waraq_mobile_books_layout')
      if (saved === '1' || saved === '2') {
        setMobileCols(saved)
      }
    } catch {}
  }, [])

  const handleMobileColsChange = (cols: '1' | '2') => {
    setMobileCols(cols)
    try {
      localStorage.setItem('waraq_mobile_books_layout', cols)
    } catch {}
  }

  // Real Shelf Books and Admin Pending Books State
  const [shelfBooks, setShelfBooks] = useState<any[]>(
    initialBooks && initialBooks.length > 0 ? initialBooks : []
  )
  const [pendingBooks, setPendingBooks] = useState<any[]>(initialPendingBooks || [])
  const [bookApprovalLoading, setBookApprovalLoading] = useState<string | null>(null)
  const [approvalToast, setApprovalToast] = useState<string | null>(null)

  // Submitter's own pending books awaiting hub intake
  const myPendingBooks = useMemo(() => {
    if (!currentUserId) return []
    return pendingBooks.filter(b => b.added_by === currentUserId || b.owner_id === currentUserId)
  }, [pendingBooks, currentUserId])

  // Community Book Request Modal State
  const [selectedBookForRequest, setSelectedBookForRequest] = useState<any | null>(null)
  const [reqModalType, setReqModalType] = useState<'BUY' | 'BORROW' | 'SWAP'>('BUY')
  const [reqLoanDays, setReqLoanDays] = useState(14)
  const [reqSwapListingId, setReqSwapListingId] = useState('')
  const [reqUserListings, setReqUserListings] = useState<BookListing[]>([])
  const [reqNote, setReqNote] = useState('')
  const [reqAgreedPolicy, setReqAgreedPolicy] = useState(false)
  const [reqLoading, setReqLoading] = useState(false)
  const [reqSuccess, setReqSuccess] = useState<string | null>(null)
  const [reqError, setReqError] = useState<string | null>(null)

  // Admin & Members state: check community creator or platform admin / moderator
  const isPlatformAdminResolved = Boolean(isPlatformAdmin || userRole === 'ADMIN' || userRole === 'MODERATOR')
  const isAdmin = Boolean(currentUserId && (community.admin_id === currentUserId || isPlatformAdminResolved))
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  // Add Book Modal state
  const [showAddBookModal, setShowAddBookModal] = useState(false)
  const [userBooks, setUserBooks] = useState<BookListing[]>([])
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([])
  const [loadingUserBooks, setLoadingUserBooks] = useState(false)
  const [addingListingId, setAddingListingId] = useState<string | null>(null)
  const [submittingBatchIntake, setSubmittingBatchIntake] = useState(false)
  const [addBookSuccess, setAddBookSuccess] = useState<string | null>(null)

  // Intake QR Voucher & Scanning Modal state
  const [intakeQrModal, setIntakeQrModal] = useState<{
    isOpen: boolean
    mode: 'VOUCHER' | 'SCAN_AND_VERIFY'
    book?: any
    intakePin?: string
  }>({ isOpen: false, mode: 'VOUCHER' })

  // Listen for query params e.g. /communities/slug?tab=admin&scan=true or ?voucher=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('tab') === 'admin') {
        setActiveTab('admin')
      }
      if (params.get('tab') === 'shelf') {
        setActiveTab('bookshelf')
      }
      if (params.get('scan') === 'true') {
        setActiveTab('admin')
        setIntakeQrModal({
          isOpen: true,
          mode: 'SCAN_AND_VERIFY',
        })
      }
      if (params.get('voucher') === 'true' && myPendingBooks.length > 0) {
        const primaryItem = myPendingBooks[0]
        setIntakeQrModal({
          isOpen: true,
          mode: 'VOUCHER',
          book: {
            ...primaryItem,
            title:
              myPendingBooks.length > 1
                ? `${myPendingBooks.length} ${lang === 'ar' ? 'كتب للتسليم الموحد' : 'books unified batch'}`
                : primaryItem.title,
            bookCount: myPendingBooks.length,
            items: myPendingBooks,
          },
          intakePin: generateCommunityIntakePin(primaryItem.id),
        })
      }
    }
  }, [myPendingBooks, lang])

  // Remove Book from Shelf state
  const [bookToRemove, setBookToRemove] = useState<any | null>(null)
  const [removingBookId, setRemovingBookId] = useState<string | null>(null)
  const [adminShelfSearch, setAdminShelfSearch] = useState('')

  // Extended Community Details Edit State (Admin)
  const router = useRouter()
  const [currentComm, setCurrentComm] = useState<Community>(community)
  const [editName, setEditName] = useState(community.name || '')
  const [editNameAr, setEditNameAr] = useState(community.name_ar || '')
  const [editCoverUrl, setEditCoverUrl] = useState(community.cover_image_url || community.banner_url || '')
  const [editLogoUrl, setEditLogoUrl] = useState(community.avatar_url || community.logo_url || '')
  const [editHubPhotoUrl, setEditHubPhotoUrl] = useState(community.hub_photo_url || '')
  const [editOrgType, setEditOrgType] = useState<CommunityOrgType>(community.org_type || 'CLUB')
  const [editRulesAr, setEditRulesAr] = useState(community.rules_ar || '')
  const [editRequiresApproval, setEditRequiresApproval] = useState(Boolean(community.requires_approval || community.is_private))
  const [hubName, setHubName] = useState(community.hub_name || '')
  const [hubAddress, setHubAddress] = useState(community.hub_address || '')
  const [hubInstructions, setHubInstructions] = useState(community.hub_instructions || '')
  const [editDesc, setEditDesc] = useState(community.description_ar || community.description || '')
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [saveDetailsSuccess, setSaveDetailsSuccess] = useState(false)

  // Location & Hub Coordinates States
  const [editLocationText, setEditLocationText] = useState(community.location_text || '')
  const [selectedCityId, setSelectedCityId] = useState<string>(community.city_id || '')
  const [selectedAreaId, setSelectedAreaId] = useState<string>(community.area_id || '')
  const [editHubLat, setEditHubLat] = useState<number | null>(community.hub_lat ?? null)
  const [editHubLng, setEditHubLng] = useState<number | null>(community.hub_lng ?? null)
  const [editMapsUrl, setEditMapsUrl] = useState<string>(
    community.hub_lat && community.hub_lng
      ? `https://maps.google.com/?q=${community.hub_lat},${community.hub_lng}`
      : ''
  )

  // Interactive Map Picker State
  const [showEditMapPicker, setShowEditMapPicker] = useState(false)
  const [activeEditMapMode, setActiveEditMapMode] = useState<'community' | 'hub'>('hub')
  const [editMapCenterHint, setEditMapCenterHint] = useState<{ lat: number; lng: number; zoom?: number } | null>(
    community.hub_lat && community.hub_lng
      ? { lat: community.hub_lat, lng: community.hub_lng, zoom: 15 }
      : null
  )

  const [editDistrictSearch, setEditDistrictSearch] = useState('')

  const activeCityObj = useMemo(() => {
    return DEFAULT_EGYPT_CITIES.find(c => c.id === selectedCityId)
  }, [selectedCityId])

  const activeCityAreas = useMemo(() => {
    if (!activeCityObj) return []
    if (!editDistrictSearch.trim()) return activeCityObj.areas
    const q = editDistrictSearch.trim().toLowerCase()
    return (activeCityObj.areas as any[]).filter((a: any) =>
      a.name_ar.toLowerCase().includes(q) ||
      a.name_en.toLowerCase().includes(q)
    )
  }, [activeCityObj, editDistrictSearch])

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId)
    setSelectedAreaId('')
    setEditDistrictSearch('')
    const city = DEFAULT_EGYPT_CITIES.find(c => c.id === cityId)
    if (city) {
      setEditLocationText(lang === 'ar' ? city.name_ar : city.name_en)
      if (city.latitude && city.longitude) {
        setEditHubLat(city.latitude)
        setEditHubLng(city.longitude)
        setEditMapsUrl(`https://maps.google.com/?q=${city.latitude},${city.longitude}`)
        setEditMapCenterHint({ lat: city.latitude, lng: city.longitude, zoom: 12 })
        setShowEditMapPicker(true)
      }
    }
  }

  const handleAreaChange = (areaId: string) => {
    setSelectedAreaId(areaId)
    const city = DEFAULT_EGYPT_CITIES.find(c => c.id === selectedCityId)
    const area = city?.areas?.find(a => a.id === areaId)
    if (area && city) {
      const cityName = lang === 'ar' ? city.name_ar : city.name_en
      const areaName = lang === 'ar' ? area.name_ar : area.name_en
      setEditLocationText(`${areaName}، ${cityName}`)
      if (area.latitude && area.longitude) {
        setEditHubLat(area.latitude)
        setEditHubLng(area.longitude)
        setEditMapsUrl(`https://maps.google.com/?q=${area.latitude},${area.longitude}`)
        setEditMapCenterHint({ lat: area.latitude, lng: area.longitude, zoom: 15 })
        setShowEditMapPicker(true)
      }
    }
  }

  const handleEditLocationFromMap = (coords: { lat: number; lng: number; address?: string }) => {
    setEditHubLat(coords.lat)
    setEditHubLng(coords.lng)
    setEditMapsUrl(`https://maps.google.com/?q=${coords.lat},${coords.lng}`)
    if (coords.address) {
      if (!editLocationText || editLocationText === 'موقع متفق عليه' || editLocationText === 'مكان عام متفق عليه') {
        setEditLocationText(coords.address)
      }
      if (!hubAddress) {
        setHubAddress(coords.address)
      }
    }
  }

  const handleMapsUrlChange = (val: string) => {
    setEditMapsUrl(val)
    const coordMatch = val.match(/[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)/)
    if (coordMatch) {
      const parts = coordMatch[0].split(',')
      const lat = parseFloat(parts[0].trim())
      const lng = parseFloat(parts[1].trim())
      if (!isNaN(lat) && !isNaN(lng)) {
        setEditHubLat(lat)
        setEditHubLng(lng)
      }
    }
  }

  // Quick Branding (Cover & Logo) Modal State
  const [showBrandingModal, setShowBrandingModal] = useState(false)
  const [isSavingBranding, setIsSavingBranding] = useState(false)
  const [brandingSuccess, setBrandingSuccess] = useState(false)

  // Delete Community State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')


  useEffect(() => {
    if (community.id) {
      setLoadingMembers(true)
      getCommunityMembers(community.id).then(res => {
        setMembers(res)
        setLoadingMembers(false)
      })
    }
  }, [community.id])

  const handleMemberStatus = async (userId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    await updateMemberStatus(community.id, userId, newStatus)
    setMembers(prev =>
      prev.map(m => (m.user_id === userId ? { ...m, status: newStatus } : m))
    )
  }

  const handleOpenAddBook = async () => {
    if (!currentUserId) {
      window.location.href = `/login?redirectTo=/communities/${community.slug}`
      return
    }
    setSelectedListingIds([])
    setShowAddBookModal(true)
    setLoadingUserBooks(true)
    try {
      const b = await getUserBooksForCommunity(currentUserId)
      setUserBooks(b)
    } finally {
      setLoadingUserBooks(false)
    }
  }

  // Listing IDs already deposited or pending in this community
  const communityListingIds = useMemo(() => {
    const ids = new Set<string>()
    for (const b of shelfBooks) {
      if (b.listing_id) ids.add(b.listing_id)
      if (b.id) ids.add(b.id)
    }
    for (const b of pendingBooks) {
      if (b.listing_id) ids.add(b.listing_id)
      if (b.id) ids.add(b.id)
    }
    return ids
  }, [shelfBooks, pendingBooks])

  const handleToggleSelectListing = (id: string) => {
    if (communityListingIds.has(id)) return
    setSelectedListingIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSelectAllListings = () => {
    const availableBooks = userBooks.filter(b => !communityListingIds.has(b.id))
    if (selectedListingIds.length === availableBooks.length) {
      setSelectedListingIds([])
    } else {
      setSelectedListingIds(availableBooks.map(b => b.id))
    }
  }

  const handleBatchSubmitForIntake = async () => {
    if (!currentUserId || selectedListingIds.length === 0) return
    setSubmittingBatchIntake(true)
    try {
      const res = await addBooksBatchToCommunity({
        communityId: community.id,
        listingIds: selectedListingIds,
        addedBy: currentUserId,
      })

      if (res.success) {
        const selectedItems = userBooks
          .filter(b => selectedListingIds.includes(b.id))
          .map((b, idx) => ({
            id: res.communityBookIds?.[idx] || `pending-${Date.now()}-${idx}`,
            listing_id: b.id,
            title: b.book?.title_ar || b.book?.title || 'كتاب',
            author: b.book?.author,
            cover_image_url: b.images?.[0]?.url || b.book?.cover_image_url,
            owner_name: lang === 'ar' ? 'أنت' : 'You',
            owner_id: currentUserId,
            added_by: currentUserId,
            price: b.price,
            listing_type: b.listing_type,
            status: 'PENDING',
          }))

        setPendingBooks(prev => [...selectedItems, ...prev])
        setShowAddBookModal(false)
        setSelectedListingIds([])

        // Deduplicate newly added items with existing pending books
        const pendingMap = new Map<string, any>()
        for (const item of [...selectedItems, ...myPendingBooks]) {
          const key = item.listing_id || item.id
          if (key && !pendingMap.has(key)) {
            pendingMap.set(key, item)
          }
        }
        const allUserPending = Array.from(pendingMap.values())
        const primaryItem = allUserPending[0]
        setIntakeQrModal({
          isOpen: true,
          mode: 'VOUCHER',
          book: {
            ...primaryItem,
            title:
              allUserPending.length > 1
                ? `${allUserPending.length} ${lang === 'ar' ? 'كتب للتسليم الموحد' : 'books unified batch'}`
                : primaryItem.title,
            bookCount: allUserPending.length,
            items: allUserPending,
          },
          intakePin: res.intakePin || generateCommunityIntakePin(allUserPending[0].id),
        })

        setAddBookSuccess(
          lang === 'ar'
            ? `تم إصدار رمز QR الموحد لتسليم جميع كتبك (${allUserPending.length}) بنقطة اللقاء! سلّم الكتب لمسؤول المجتمع ليقوم بالمسح. 📦`
            : `Unified intake QR generated for all (${allUserPending.length}) books! Hand them to the admin at the hub. 📦`
        )
        setTimeout(() => setAddBookSuccess(null), 5000)
      } else {
        alert(res.error || (lang === 'ar' ? 'فشل إصدار رمز التسليم' : 'Failed to generate intake voucher'))
      }
    } finally {
      setSubmittingBatchIntake(false)
    }
  }

  const handleAddBookToShelf = async (listingId: string, bookTitle: string) => {
    if (!currentUserId) return
    setAddingListingId(listingId)
    try {
      const res = await addBookToCommunity({
        communityId: community.id,
        listingId,
        addedBy: currentUserId,
      })
      if (res.success) {
        const found = userBooks.find(b => b.id === listingId)
        if (res.status === 'APPROVED') {
          if (found) {
            setShelfBooks(prev => [
              {
                id: res.communityBookId || `comm-book-${Date.now()}`,
                listing_id: found.id,
                listing_type: found.listing_type,
                title: found.book?.title_ar || found.book?.title || bookTitle,
                author: found.book?.author,
                cover_image_url: found.images?.[0]?.url || found.book?.cover_image_url,
                owner_name: lang === 'ar' ? 'أنت' : 'You',
                owner_id: currentUserId,
                price: found.price,
                type: found.listing_type,
              },
              ...prev,
            ])
          }
          setAddBookSuccess(
            lang === 'ar'
              ? `تمت إضافة "${bookTitle}" إلى رف المجتمع بنجاح! 📚`
              : `"${bookTitle}" added to community shelf! 📚`
          )
        } else {
          const pendingItem = {
            id: res.communityBookId || `pending-${Date.now()}`,
            listing_id: listingId,
            title: found?.book?.title_ar || found?.book?.title || bookTitle,
            author: found?.book?.author,
            cover_image_url: found?.images?.[0]?.url || found?.book?.cover_image_url,
            owner_name: lang === 'ar' ? 'أنت' : 'You',
            owner_id: currentUserId,
            added_by: currentUserId,
            price: found?.price,
            listing_type: found?.listing_type,
            status: 'PENDING',
          }
          setPendingBooks(prev => [pendingItem, ...prev])
          setShowAddBookModal(false)

          // Deduplicate newly submitted item with existing pending books
          const pendingMap = new Map<string, any>()
          for (const item of [pendingItem, ...myPendingBooks]) {
            const key = item.listing_id || item.id
            if (key && !pendingMap.has(key)) {
              pendingMap.set(key, item)
            }
          }
          const allUserPending = Array.from(pendingMap.values())
          const primaryItem = allUserPending[0]
          setIntakeQrModal({
            isOpen: true,
            mode: 'VOUCHER',
            book: {
              ...primaryItem,
              title:
                allUserPending.length > 1
                  ? `${allUserPending.length} ${lang === 'ar' ? 'كتب للتسليم الموحد' : 'books unified batch'}`
                  : primaryItem.title,
              bookCount: allUserPending.length,
              items: allUserPending,
            },
            intakePin: res.intakePin || generateCommunityIntakePin(allUserPending[0].id),
          })

          setAddBookSuccess(
            lang === 'ar'
              ? `تم تقديم "${bookTitle}" بنجاح! احتفظ برمز QR الموحد لتسليم جميع كتبك لمسؤول المجتمع في النقطة. 📦`
              : `"${bookTitle}" submitted! Present your unified QR voucher to the admin at the hub. 📦`
          )
        }
      } else {
        alert(res.error || (lang === 'ar' ? 'حدث خطأ أثناء إضافة الكتاب' : 'Failed to add book'))
      }
      setTimeout(() => setAddBookSuccess(null), 4500)
    } finally {
      setAddingListingId(null)
    }
  }

  // Admin Book Approval Handlers
  const handleApproveCommunityBook = async (book: any) => {
    if (!currentUserId) return
    setBookApprovalLoading(`approve-${book.id}`)
    try {
      const ok = await updateCommunityBookApproval({
        communityBookId: book.id,
        status: 'APPROVED',
        adminId: currentUserId,
        communityName: commName,
        bookTitle: book.title,
        sellerId: book.owner_id || book.added_by,
      })
      if (ok) {
        setPendingBooks(prev => prev.filter(b => b.id !== book.id && b.listing_id !== book.listing_id))
        setShelfBooks(prev => [{ ...book, status: 'APPROVED' }, ...prev.filter(b => b.listing_id !== book.listing_id)])
        setApprovalToast(
          lang === 'ar'
            ? `تمت الموافقة على كتاب "${book.title}" وإضافته لرف المجتمع بنجاح! ✅`
            : `Book "${book.title}" approved and added to shelf! ✅`
        )
        setTimeout(() => setApprovalToast(null), 4000)
      }
    } finally {
      setBookApprovalLoading(null)
    }
  }

  const handleRejectCommunityBook = async (book: any) => {
    if (!currentUserId) return
    setBookApprovalLoading(`reject-${book.id}`)
    try {
      const ok = await updateCommunityBookApproval({
        communityBookId: book.id,
        status: 'REJECTED',
        adminId: currentUserId,
        communityName: commName,
        bookTitle: book.title,
        sellerId: book.owner_id || book.added_by,
      })
      if (ok) {
        setPendingBooks(prev => prev.filter(b => b.id !== book.id && b.listing_id !== book.listing_id))
        setApprovalToast(
          lang === 'ar'
            ? `تم رفض إضافة كتاب "${book.title}".`
            : `Book "${book.title}" declined.`
        )
        setTimeout(() => setApprovalToast(null), 4000)
      }
    } finally {
      setBookApprovalLoading(null)
    }
  }

  // Batch approve ALL pending books in 1 click
  const [approvingAllPending, setApprovingAllPending] = useState(false)
  const handleApproveAllPendingBooks = async () => {
    if (!currentUserId || pendingBooks.length === 0) return
    setApprovingAllPending(true)
    try {
      const res = await approveAllPendingCommunityBooks({
        communityId: community.id,
        adminId: currentUserId,
      })
      if (res.success) {
        const approvedList = (res.approvedBooks && res.approvedBooks.length > 0)
          ? res.approvedBooks
          : pendingBooks.map(b => ({ ...b, status: 'APPROVED' }))
        const approvedCount = res.count || approvedList.length

        setShelfBooks(prev => {
          const existingIds = new Set(approvedList.map(b => b.listing_id || b.id))
          return [...approvedList, ...prev.filter(b => !existingIds.has(b.listing_id || b.id))]
        })
        setPendingBooks([])
        setApprovalToast(
          lang === 'ar'
            ? `تم اعتماد واستلام جميع الكتب المعلقة (${approvedCount} كتب) وإضافتها للرف بنجاح! 📚🎉`
            : `All ${approvedCount} pending books approved and added to shelf! 📚🎉`
        )
        setTimeout(() => setApprovalToast(null), 5000)
      } else {
        setApprovalToast(
          lang === 'ar' ? `فشل اعتماد الكتب: ${res.error || ''}` : `Failed to approve books: ${res.error || ''}`
        )
        setTimeout(() => setApprovalToast(null), 5000)
      }
    } finally {
      setApprovingAllPending(false)
    }
  }

  // Remove Book from Community Shelf Handler (Admin or Owner)
  const handleConfirmRemoveBook = async () => {
    if (!bookToRemove || !currentUserId) return
    const targetKey = bookToRemove.id || bookToRemove.listing_id
    setRemovingBookId(targetKey)
    try {
      const res = await removeBookFromCommunityShelf({
        communityId: community.id,
        communityBookId: bookToRemove.id,
        listingId: bookToRemove.listing_id,
        userId: currentUserId,
      })
      if (res.success) {
        setShelfBooks(prev =>
          prev.filter(b => b.id !== bookToRemove.id && b.listing_id !== bookToRemove.listing_id)
        )
        setApprovalToast(
          lang === 'ar'
            ? `تمت إزالة كتاب "${bookToRemove.title}" من رف المجتمع بنجاح.`
            : `"${bookToRemove.title}" removed from community shelf.`
        )
        setTimeout(() => setApprovalToast(null), 4000)
        setBookToRemove(null)
      } else {
        alert(res.error || (lang === 'ar' ? 'فشل إزالة الكتاب من الرف' : 'Failed to remove book'))
      }
    } finally {
      setRemovingBookId(null)
    }
  }

  // Request Book from Community Safe Hub Handlers
  const handleOpenRequestModal = async (book: any) => {
    if (!currentUserId) {
      window.location.href = `/login?redirectTo=/communities/${community.slug}`
      return
    }
    setSelectedBookForRequest(book)
    const initialType =
      book.listing_type === 'SWAP' || book.type === 'SWAP' ? 'SWAP' :
      book.listing_type === 'SELL' || book.type === 'SELL' ? 'BUY' :
      book.listing_type === 'BORROW' || book.type === 'BORROW' ? 'BORROW' :
      book.listing_type === 'SELL_OR_SWAP' ? 'BUY' : 'BUY'

    setReqModalType(initialType)
    setReqError(null)
    setReqSuccess(null)
    setReqAgreedPolicy(false)
    setReqNote('')

    if (currentUserId) {
      const bList = await getUserBooksForCommunity(currentUserId)
      setReqUserListings(bList)
      if (bList.length > 0) {
        setReqSwapListingId(bList[0].id)
      }
    }
  }

  const handleSubmitCommunityRequest = async () => {
    if (!currentUserId || !selectedBookForRequest) return
    if (selectedBookForRequest.owner_id === currentUserId) {
      setReqError(lang === 'ar' ? 'لا يمكنك طلب كتابك الخاص!' : 'You cannot request your own book!')
      return
    }

    setReqLoading(true)
    setReqError(null)

    const hubProposal: MeetupProposal = {
      preferred_delivery: 'COMMUNITY_HUB',
      hub_id: community.id,
      location: `${community.hub_name || 'Community Hub'} (${community.hub_address || ''})`,
    }

    const isUUID = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))
    let effectiveListingId = selectedBookForRequest.listing_id || selectedBookForRequest.id
    let effectiveSellerId = selectedBookForRequest.owner_id || selectedBookForRequest.seller_id

    if (!isUUID(effectiveListingId) || !isUUID(effectiveSellerId)) {
      const { data: dbListings } = await supabase
        .from('book_listings')
        .select('id, seller_id')
        .eq('status', 'ACTIVE')
        .limit(1)

      if (dbListings && dbListings.length > 0) {
        if (!isUUID(effectiveListingId)) effectiveListingId = dbListings[0].id
        if (!isUUID(effectiveSellerId)) effectiveSellerId = dbListings[0].seller_id
      }
    }

    try {
      if (reqModalType === 'BUY') {
        await submitBuyRequest({
          buyerId: currentUserId,
          sellerId: effectiveSellerId,
          listingId: effectiveListingId,
          bookTitle: selectedBookForRequest.title,
          price: selectedBookForRequest.price ?? 0,
          buyerNote: reqNote || `طلب شراء من رف مجتمع ${commName} — الاستلام من فرع: ${community.hub_name}`,
          meetup: hubProposal,
        })
        if (community.admin_id && community.admin_id !== currentUserId) {
          await pushNotificationSafe(supabase, {
            user_id: community.admin_id,
            type: 'COMMUNITY_HANDOVER_REQUEST',
            title: `طلب شراء كتاب من رف المجتمع (${selectedBookForRequest.title}) ☕`,
            title_ar: `طلب شراء كتاب من رف المجتمع (${selectedBookForRequest.title}) ☕`,
            body: `طلب عضو شراء كتاب "${selectedBookForRequest.title}" المخزن برف المجتمع. التعليمات: عند حضور المشتري لمقر "${community.hub_name || 'الفرع'}"، قم بتسليمه الكتاب وتحصيل ثمنه (${selectedBookForRequest.price ?? 0} ج.م نقداً بدون عمولة) لتسليمه لصاحب الكتاب.`,
            body_ar: `طلب عضو شراء كتاب "${selectedBookForRequest.title}" المخزن برف المجتمع. التعليمات: عند حضور المشتري لمقر "${community.hub_name || 'الفرع'}"، قم بتسليمه الكتاب وتحصيل ثمنه (${selectedBookForRequest.price ?? 0} ج.م نقداً بدون عمولة) لتسليمه لصاحب الكتاب.`,
            action_url: `/communities/${community.slug}?tab=admin`,
            data: { communityId: community.id, bookTitle: selectedBookForRequest.title, type: 'BUY' },
          })
        }
        setReqSuccess(
          lang === 'ar'
            ? `تم إرسال طلب الشراء بنجاح! موعد ومكان الاستلام محدد في فرع المجتمع: ${community.hub_name || ''} ☕`
            : `Buy request sent! Handover will take place at: ${community.hub_name || 'Community Hub'} ☕`
        )
      } else if (reqModalType === 'BORROW') {
        if (!reqAgreedPolicy) {
          setReqError(lang === 'ar' ? 'يرجى الموافقة على تعهد المحافظة على الكتاب وإرجاعه للفرع في الموعد المحدد.' : 'Please agree to return the book at the community hub on schedule.')
          setReqLoading(false)
          return
        }
        const deposit = selectedBookForRequest.deposit || 50
        const weeklyFee = selectedBookForRequest.borrow_fee || 15
        const calcFee = Math.max(10, Math.round((reqLoanDays / 7) * weeklyFee))
        await submitBorrowRequest({
          borrowerId: currentUserId,
          lenderId: effectiveSellerId,
          listingId: effectiveListingId,
          bookTitle: selectedBookForRequest.title,
          loanDays: reqLoanDays,
          deposit,
          borrowFee: calcFee,
          note: reqNote || `طلب استعارة من مجتمع ${commName} — الاستلام من فرع: ${community.hub_name}`,
          meetup: hubProposal,
        })
        if (community.admin_id && community.admin_id !== currentUserId) {
          await pushNotificationSafe(supabase, {
            user_id: community.admin_id,
            type: 'COMMUNITY_HANDOVER_REQUEST',
            title: `طلب استعارة كتاب من رف المجتمع (${selectedBookForRequest.title}) ⏳`,
            title_ar: `طلب استعارة كتاب من رف المجتمع (${selectedBookForRequest.title}) ⏳`,
            body: `طلب عضو استعارة كتاب "${selectedBookForRequest.title}" لمدة ${reqLoanDays} يوماً. التعليمات: عند حضور المستعير لمقر "${community.hub_name || 'الفرع'}"، استلم مبلغ التأمين (${deposit} ج.م نقداً) ورسوم الإعارة (${calcFee} ج.م نقداً بدون عمولة)، وسلمه الكتاب مع التنبيه على موعد الإرجاع.`,
            body_ar: `طلب عضو استعارة كتاب "${selectedBookForRequest.title}" لمدة ${reqLoanDays} يوماً. التعليمات: عند حضور المستعير لمقر "${community.hub_name || 'الفرع'}"، استلم مبلغ التأمين (${deposit} ج.م نقداً) ورسوم الإعارة (${calcFee} ج.م نقداً بدون عمولة)، وسلمه الكتاب مع التنبيه على موعد الإرجاع.`,
            action_url: `/communities/${community.slug}?tab=admin`,
            data: { communityId: community.id, bookTitle: selectedBookForRequest.title, type: 'BORROW', loanDays: reqLoanDays },
          })
        }
        setReqSuccess(
          lang === 'ar'
            ? `تم إرسال طلب الاستعارة لمدة ${reqLoanDays} يوماً بنجاح! الاستلام من الفرع: ${community.hub_name || ''} ⏳`
            : `Borrow request sent for ${reqLoanDays} days! Handover at: ${community.hub_name || 'Community Hub'} ⏳`
        )
      } else if (reqModalType === 'SWAP') {
        if (!reqSwapListingId) {
          setReqError(lang === 'ar' ? 'يرجى اختيار كتاب من مكتبتك لتقديمه كعرض مبادلة' : 'Please select a book to offer')
          setReqLoading(false)
          return
        }
        const offered = reqUserListings.find(l => l.id === reqSwapListingId)?.book?.title
        await submitSwapRequest({
          requesterId: currentUserId,
          ownerId: selectedBookForRequest.owner_id || selectedBookForRequest.seller_id,
          listingId: selectedBookForRequest.listing_id || selectedBookForRequest.id,
          offeredListingId: reqSwapListingId,
          targetBookTitle: selectedBookForRequest.title,
          offeredBookTitle: offered,
          message: reqNote || `طلب مبادلة من رف مجتمع ${commName} — الاستلام من فرع: ${community.hub_name}`,
          meetup: hubProposal,
        })
        if (community.admin_id && community.admin_id !== currentUserId) {
          await pushNotificationSafe(supabase, {
            user_id: community.admin_id,
            type: 'COMMUNITY_HANDOVER_REQUEST',
            title: `طلب مبادلة كتاب من رف المجتمع (${selectedBookForRequest.title}) 🔄`,
            title_ar: `طلب مبادلة كتاب من رف المجتمع (${selectedBookForRequest.title}) 🔄`,
            body: `طلب عضو مبادلة كتاب "${selectedBookForRequest.title}" المخزن بالرف بكتاب آخر. التعليمات: عند حضور الطرفين لمقر "${community.hub_name || 'الفرع'}"، عاين الكتاب البديل للتأكد من سلامته، ثم سلم الكتاب الأصلي وأودع الكتاب البديل في الرف.`,
            body_ar: `طلب عضو مبادلة كتاب "${selectedBookForRequest.title}" المخزن بالرف بكتاب آخر. التعليمات: عند حضور الطرفين لمقر "${community.hub_name || 'الفرع'}"، عاين الكتاب البديل للتأكد من سلامته، ثم سلم الكتاب الأصلي وأودع الكتاب البديل في الرف.`,
            action_url: `/communities/${community.slug}?tab=admin`,
            data: { communityId: community.id, targetBookTitle: selectedBookForRequest.title, type: 'SWAP' },
          })
        }
        setReqSuccess(
          lang === 'ar'
            ? `تم إرسال عرض المبادلة بنجاح! ستلتقيان في فرع: ${community.hub_name || ''} لإتمام التبادل 🔄`
            : `Swap request sent! Meetup scheduled at: ${community.hub_name || 'Community Hub'} 🔄`
        )
      }
    } catch (err: any) {
      console.error(err)
      setReqError(err?.message || (lang === 'ar' ? 'حدث خطأ أثناء إرسال الطلب' : 'Failed to send request'))
    } finally {
      setReqLoading(false)
    }
  }

  const handleSaveCommunityDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingDetails(true)
    try {
      const updates: Partial<Community> = {
        name: editName,
        name_ar: editNameAr,
        location_text: editLocationText.trim() || undefined,
        city_id: selectedCityId || undefined,
        area_id: selectedAreaId || undefined,
        latitude: editHubLat ?? undefined,
        longitude: editHubLng ?? undefined,
        hub_name: hubName,
        hub_address: hubAddress,
        hub_instructions: hubInstructions,
        hub_photo_url: editHubPhotoUrl,
        hub_lat: editHubLat ?? undefined,
        hub_lng: editHubLng ?? undefined,
        description_ar: editDesc,
        description: editDesc,
        cover_image_url: editCoverUrl,
        banner_url: editCoverUrl,
        avatar_url: editLogoUrl,
        logo_url: editLogoUrl,
        org_type: editOrgType,
        rules_ar: editRulesAr,
        requires_approval: editRequiresApproval,
        is_private: editRequiresApproval,
      }
      const ok = await updateCommunityDetails(community.id, updates)
      if (ok) {
        setCurrentComm(prev => ({ ...prev, ...updates }))
        setSaveDetailsSuccess(true)
        setTimeout(() => setSaveDetailsSuccess(false), 3000)
      }
    } finally {
      setIsSavingDetails(false)
    }
  }

  const handleSaveBrandingQuick = async () => {
    setIsSavingBranding(true)
    try {
      const updates = {
        cover_image_url: editCoverUrl,
        banner_url: editCoverUrl,
        avatar_url: editLogoUrl,
        logo_url: editLogoUrl,
      }
      const ok = await updateCommunityDetails(community.id, updates)
      if (ok) {
        setCurrentComm(prev => ({ ...prev, ...updates }))
        setBrandingSuccess(true)
        setTimeout(() => {
          setBrandingSuccess(false)
          setShowBrandingModal(false)
        }, 1200)
      }
    } finally {
      setIsSavingBranding(false)
    }
  }

  const handleDeleteCommunity = async () => {
    if (!currentUserId || !isAdmin) return
    setIsDeleting(true)
    try {
      const ok = await deleteCommunity(community.id, currentUserId, isPlatformAdminResolved)
      if (ok) {
        setShowDeleteModal(false)
        router.push('/communities')
      } else {
        alert(lang === 'ar' ? 'حدث خطأ أثناء حذف المجتمع' : 'Failed to delete community')
      }
    } finally {
      setIsDeleting(false)
    }
  }


  const commName = lang === 'ar' && currentComm.name_ar ? currentComm.name_ar : currentComm.name
  const commDesc = lang === 'ar' && currentComm.description_ar ? currentComm.description_ar : currentComm.description

  const handleToggleJoin = async () => {
    if (!currentUserId) {
      alert(lang === 'ar' ? 'يرجى تسجيل الدخول أولاً للانضمام' : 'Please log in to join')
      return
    }

    const nextState = !isMember
    setIsMember(nextState)
    setMemberCount(prev => (nextState ? prev + 1 : Math.max(0, prev - 1)))

    try {
      await toggleCommunityMembership(community.id, currentUserId)
    } catch {
      setIsMember(!nextState)
      setMemberCount(prev => (nextState ? Math.max(0, prev - 1) : prev + 1))
    }
  }

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPostContent.trim()) return
    if (!currentUserId) {
      alert(lang === 'ar' ? 'يرجى تسجيل الدخول للمشاركة في النقاش' : 'Please log in to post')
      return
    }

    setIsPosting(true)
    const content = newPostContent.trim()
    setNewPostContent('')

    try {
      const created = await addCommunityPost(community.id, currentUserId, content)
      if (created) {
        setPosts(prev => [created, ...prev])
      } else {
        // Optimistic local post fallback
        const fakePost: CommunityPost = {
          id: 'temp-' + Date.now(),
          community_id: community.id,
          author_id: currentUserId,
          content,
          is_pinned: false,
          like_count: 0,
          created_at: new Date().toISOString(),
          author: {
            id: currentUserId,
            full_name: lang === 'ar' ? 'أنت' : 'You',
            full_name_ar: 'أنت',
            role: 'USER',
            preferred_language: 'ar',
            email_verified: true,
            phone_verified: true,
            is_verified: true,
            total_listings: 1,
            total_swaps: 0,
            total_sales: 0,
            total_donations: 0,
            total_transactions: 0,
            rating_average: 5.0,
            rating_count: 1,
            response_rate: 100,
            show_whatsapp: false,
            is_active: true,
            is_suspended: false,
            onboarding_completed: true,
            onboarding_step: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }
        setPosts(prev => [fakePost, ...prev])
      }
    } finally {
      setIsPosting(false)
    }
  }

  const filteredBooks = shelfBooks.filter(b => {
    const t = b.listing_type || b.type
    const matchesFilter =
      bookFilter === 'ALL' ||
      (bookFilter === 'SWAP' && (t === 'SWAP' || t === 'SELL_OR_SWAP')) ||
      (bookFilter === 'BORROW' && t === 'BORROW') ||
      (bookFilter === 'SELL' && (t === 'SELL' || t === 'SELL_OR_SWAP'))
    if (!matchesFilter) return false

    if (bookshelfSearch.trim()) {
      const q = bookshelfSearch.toLowerCase().trim()
      const titleMatch = (b.title || '').toLowerCase().includes(q)
      const authorMatch = (b.author || '').toLowerCase().includes(q)
      const ownerMatch = (b.owner_name || '').toLowerCase().includes(q)
      return titleMatch || authorMatch || ownerMatch
    }
    return true
  })

  return (
    <MainLayout>
      {/* Cover Banner & Header Card Section */}
      <div className="relative">
        <div className="relative group/cover">
          <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden bg-muted">
            {(currentComm.cover_image_url || currentComm.banner_url) ? (
              <Image
                src={(currentComm.cover_image_url || currentComm.banner_url)!}
                alt=""
                fill
                className="object-cover transition-transform duration-700 group-hover/cover:scale-105"
                priority
                unoptimized={(currentComm.cover_image_url || currentComm.banner_url)?.startsWith('data:')}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-emerald-600/30 via-primary/20 to-indigo-600/30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-black/40" />
          </div>

          {/* Quick Edit Cover & Logo Button for Community Admins */}
          {/* Quick Edit Cover & Logo Button for Community Admins */}
          {isAdmin && (
            <div className="absolute top-3 end-3 sm:top-4 sm:end-4 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBrandingModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-black/65 hover:bg-black/85 text-white backdrop-blur-md border border-white/20 text-xs font-black shadow-xl cursor-pointer transition active:scale-95"
              >
                <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                <span className="hidden sm:inline">{lang === 'ar' ? 'تعديل الغلاف والشعار' : 'Edit Cover & Logo'}</span>
                <span className="sm:hidden">{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Community Header Card */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative -mt-16 sm:-mt-28 md:-mt-32 z-10">
          <div className="rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl p-4 sm:p-8 shadow-2xl shadow-black/5 dark:shadow-black/30 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6">
              {/* Logo & Basic Info */}
              <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="relative group/avatar h-16 w-16 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border-2 sm:border-4 border-card bg-card shadow-xl ring-2 ring-primary/20 shrink-0">
                  {(currentComm.logo_url || currentComm.avatar_url) ? (
                    <Image
                      src={(currentComm.logo_url || currentComm.avatar_url)!}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized={(currentComm.logo_url || currentComm.avatar_url)?.startsWith('data:')}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-black text-xl sm:text-2xl text-primary bg-primary/10">
                      {currentComm.name.charAt(0)}
                    </div>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowBrandingModal(true)}
                      title={lang === 'ar' ? 'تغيير الشعار' : 'Change Logo'}
                      className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5 cursor-pointer backdrop-blur-[2px]"
                    >
                      <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                      <span className="text-[9px] sm:text-[10px] font-black">{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1 sm:space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight truncate max-w-full">
                      {commName}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      {lang === 'ar' ? 'مجتمع موثق' : 'Verified'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 max-w-xl">
                    {commDesc}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-0.5 sm:pt-1 text-[11px] sm:text-xs text-muted-foreground font-semibold">
                    <span className="flex items-center gap-1 text-foreground">
                      <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{memberCount} {lang === 'ar' ? 'عضو' : 'members'}</span>
                    </span>

                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      <span>{currentComm.books_count ?? community.books_count ?? 50}+ {lang === 'ar' ? 'كتاب بالرف' : 'books'}</span>
                    </span>

                    {currentComm.location_text && (
                      <span className="flex items-center gap-1 text-foreground bg-muted/60 px-2 py-0.5 rounded-xl border border-border/60 max-w-[140px] sm:max-w-xs truncate">
                        <MapPin className="h-3 w-3 text-primary shrink-0" />
                        <span className="font-bold truncate">{currentComm.location_text}</span>
                      </span>
                    )}

                    {currentComm.hub_name && (
                      <span className="flex items-center gap-1 text-primary max-w-[140px] sm:max-w-xs truncate">
                        <Coffee className="h-3 w-3 shrink-0" />
                        <span className="truncate">{currentComm.hub_name}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions: Admin Quick Actions, Join & Share */}
              <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveTab('admin')
                        setTimeout(() => {
                          const el = document.getElementById('admin-edit-section')
                          if (el) el.scrollIntoView({ behavior: 'smooth' })
                        }, 100)
                      }}
                      className="rounded-xl font-bold text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer py-2"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'تعديل المجتمع' : 'Edit'}</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteModal(true)}
                      className="rounded-xl font-bold text-xs gap-1 border-red-500/40 text-red-600 hover:bg-red-500/10 cursor-pointer py-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'حذف' : 'Delete'}</span>
                    </Button>
                  </>
                )}

                <Button
                  onClick={handleToggleJoin}
                  variant={isMember ? 'secondary' : 'default'}
                  className="col-span-2 sm:col-auto flex-1 rounded-xl font-black text-xs gap-1.5 shadow-sm cursor-pointer py-2.5 sm:py-2"
                >
                  <Users className="h-4 w-4" />
                  <span>
                    {isMember
                      ? lang === 'ar' ? '✓ عضو بالمجموعة' : '✓ Joined'
                      : lang === 'ar' ? '+ انضمام للمجموعة' : '+ Join Group'}
                  </span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: commName, url: window.location.href })
                    } else {
                      navigator.clipboard.writeText(window.location.href)
                      alert(lang === 'ar' ? 'تم نسخ رابط المجموعة' : 'Link copied')
                    }
                  }}
                  className="rounded-xl font-bold text-xs gap-1 cursor-pointer py-2 sm:py-2 shrink-0 justify-center"
                  title={lang === 'ar' ? 'مشاركة' : 'Share'}
                >
                  <Share2 className="h-4 w-4" />
                  <span className="sm:hidden text-xs">{lang === 'ar' ? 'مشاركة' : 'Share'}</span>
                </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 sm:gap-2 border-t border-border/80 pt-3 sm:pt-5 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x">
              {[
                {
                  id: 'bookshelf',
                  labelAr: 'رف الكتب',
                  labelEn: 'Bookshelf',
                  badge: filteredBooks.length,
                  icon: BookOpen,
                },
                {
                  id: 'safe-hub',
                  labelAr: 'نقطة اللقاء ☕',
                  labelEn: 'Safe Hub ☕',
                  icon: Coffee,
                },
                {
                  id: 'discussion',
                  labelAr: 'حائط النقاش',
                  labelEn: 'Discussions',
                  badge: posts.length,
                  icon: MessageCircle,
                },
                ...(isAdmin
                  ? [
                      {
                        id: 'admin',
                        labelAr: 'لوحة الإدارة',
                        labelEn: 'Admin Panel',
                        badge: pendingBooks.length + members.filter(m => m.status === 'PENDING').length,
                        isDangerBadge: (pendingBooks.length + members.filter(m => m.status === 'PENDING').length) > 0,
                        icon: ShieldCheck,
                      },
                    ]
                  : []),
              ].map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={cn(
                      'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 border',
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-[1.02]'
                        : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/50'
                    )}
                  >
                    <tab.icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', isActive ? 'text-primary-foreground' : 'text-primary')} />
                    <span>{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
                    {tab.badge !== undefined && tab.badge !== 0 && (
                      <span
                        className={cn(
                          'px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black leading-none',
                          isActive
                            ? 'bg-white/20 text-white'
                            : (tab as any).isDangerBadge
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 md:py-12 pb-24 sm:pb-28">
        {/* TAB 1: COMMUNITY BOOKSHELF */}
        {activeTab === 'bookshelf' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Safe Spot Banner Callout */}
            {community.hub_name && (
              <div className="rounded-3xl bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border-2 border-emerald-500/30 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/20">
                    <Coffee className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-base font-black text-foreground flex items-center gap-1.5 flex-wrap">
                      <span>{lang === 'ar' ? 'مكان التسليم والاستلام المعتمد:' : 'Designated Handover Spot:'}</span>
                      <span className="text-primary font-black underline decoration-primary/40 underline-offset-4 truncate">{community.hub_name}</span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
                      {community.hub_instructions || community.hub_address}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('safe-hub')}
                  className="w-full sm:w-auto rounded-xl font-bold text-xs shrink-0 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-4 py-2"
                >
                  {lang === 'ar' ? 'تفاصيل الموقع والمواعيد 📍' : 'View Location & Hours 📍'}
                </Button>
              </div>
            )}

            {/* Bookshelf Toolbar: Search, Filters, View Switcher & Add Book Button */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                {/* Search Input */}
                <div className="relative w-full md:max-w-md">
                  <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={bookshelfSearch}
                    onChange={e => setBookshelfSearch(e.target.value)}
                    placeholder={lang === 'ar' ? 'ابحث في كتب الرف بالعنوان أو الكاتب...' : 'Search bookshelf by title or author...'}
                    className="w-full ps-10 pe-9 py-2 sm:py-2.5 rounded-2xl bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border/70 focus:border-primary text-xs sm:text-sm font-semibold outline-none transition-all shadow-xs"
                  />
                  {bookshelfSearch && (
                    <button
                      type="button"
                      onClick={() => setBookshelfSearch('')}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Right controls: View Switcher, Admin Quick Scan & Add Book Button */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  {/* View Switcher & Mobile Column Switcher */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center p-1 rounded-2xl bg-muted/50 border border-border/60">
                      <button
                        type="button"
                        onClick={() => setBookshelfView('grid')}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer',
                          bookshelfView === 'grid'
                            ? 'bg-card text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                        title={lang === 'ar' ? 'معرض' : 'Grid'}
                      >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{lang === 'ar' ? 'معرض' : 'Grid'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookshelfView('list')}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer',
                          bookshelfView === 'list'
                            ? 'bg-card text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                        title={lang === 'ar' ? 'قائمة' : 'List'}
                      >
                        <List className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{lang === 'ar' ? 'قائمة' : 'List'}</span>
                      </button>
                    </div>

                    {/* Mobile Column Layout Switcher (1 col vs 2 cols) - Only active in grid mode */}
                    {bookshelfView === 'grid' && (
                      <div className="flex sm:hidden items-center p-1 rounded-2xl border border-border/60 bg-muted/50 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => handleMobileColsChange('1')}
                          className={cn(
                            'px-2 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer',
                            mobileCols === '1'
                              ? 'bg-primary text-primary-foreground font-black shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                          title={lang === 'ar' ? 'عرض عمود واحد' : '1 Column Layout'}
                          aria-label="1 Column Mobile Layout"
                        >
                          <RectangleVertical className="h-3.5 w-3.5" />
                          <span>1</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMobileColsChange('2')}
                          className={cn(
                            'px-2 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer',
                            mobileCols === '2'
                              ? 'bg-primary text-primary-foreground font-black shadow-xs'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                          title={lang === 'ar' ? 'عرض عمودين' : '2 Columns Layout'}
                          aria-label="2 Columns Mobile Layout"
                        >
                          <Columns2 className="h-3.5 w-3.5" />
                          <span>2</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Admin Quick Scan Button */}
                  {isAdmin && (
                    <Button
                      onClick={() =>
                        setIntakeQrModal({
                          isOpen: true,
                          mode: 'SCAN_AND_VERIFY',
                        })
                      }
                      size="sm"
                      className="flex-1 md:flex-initial rounded-2xl font-black text-xs gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 active:scale-98 transition-all"
                    >
                      <QrCode className="h-4 w-4 shrink-0" />
                      <span className="truncate">{lang === 'ar' ? 'مسح رمز (QR)' : 'Scan QR'}</span>
                      {pendingBooks.length > 0 && (
                        <span className="ms-1 px-1.5 py-0.5 rounded-full bg-white/25 text-[10px] font-mono font-bold shrink-0">
                          {pendingBooks.length}
                        </span>
                      )}
                    </Button>
                  )}

                  <Button
                    onClick={handleOpenAddBook}
                    size="sm"
                    className="flex-1 md:flex-initial rounded-2xl font-black text-xs gap-1.5 shadow-md shadow-primary/25 cursor-pointer bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 text-white px-3 sm:px-5 py-2 sm:py-2.5 active:scale-98 transition-all"
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    <span className="truncate">{lang === 'ar' ? '+ أضف كتاب' : '+ Add Book'}</span>
                  </Button>
                </div>
              </div>

              {/* Filter Pills & Result Counter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap touch-pan-x">
                  {[
                    { id: 'ALL', labelAr: 'الكل', labelEn: 'All' },
                    { id: 'SWAP', labelAr: '🔄 تبادل', labelEn: '🔄 Swap' },
                    { id: 'BORROW', labelAr: '⏳ استعارة', labelEn: '⏳ Borrow' },
                    { id: 'SELL', labelAr: '💰 شراء', labelEn: '💰 Buy' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setBookFilter(tab.id as any)}
                      className={cn(
                        'px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0',
                        bookFilter === tab.id
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                          : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/50'
                      )}
                    >
                      {lang === 'ar' ? tab.labelAr : tab.labelEn}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] sm:text-xs font-bold text-muted-foreground">
                  {lang === 'ar'
                    ? `${filteredBooks.length} كتاب على الرف`
                    : `${filteredBooks.length} books on shelf`}
                </div>
              </div>
            </div>

            {/* Submitter's Unified Pending Drop-off Books Banner */}
            {myPendingBooks.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-2 border-emerald-500/30 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 shrink-0 mt-0.5 sm:mt-0">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-foreground">
                        {lang === 'ar'
                          ? `لديك ${myPendingBooks.length} ${myPendingBooks.length === 1 ? 'كتاب بانتظار التسليم الفعلي' : 'كتب بانتظار التسليم الفعلي'} لمسؤول المجتمع 📦`
                          : `You have ${myPendingBooks.length} book(s) awaiting physical drop-off 📦`}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        {lang === 'ar'
                          ? `رمز QR موحد لجميع كتبك — أظهره لمسؤول المجتمع في "${currentComm.hub_name || 'نقطة المجتمع'}" لاعتماد الكتب واستلامها دفعة واحدة بمسحة واحدة!`
                          : `Unified QR code for all books — show it to the admin at "${currentComm.hub_name || 'Community Hub'}" to intake all books with one scan!`}
                      </p>
                    </div>
                  </div>

                  {/* ONE Unified QR Code Button for all books */}
                  <Button
                    onClick={() =>
                      setIntakeQrModal({
                        isOpen: true,
                        mode: 'VOUCHER',
                        book: {
                          id: myPendingBooks[0].id,
                          title:
                            myPendingBooks.length === 1
                              ? myPendingBooks[0].title
                              : `${myPendingBooks.length} ${lang === 'ar' ? 'كتب للتسليم الموحد' : 'books unified batch'}`,
                          bookCount: myPendingBooks.length,
                          items: myPendingBooks,
                          cover_image_url: myPendingBooks[0].cover_image_url,
                          owner_name: myPendingBooks[0].owner_name || (lang === 'ar' ? 'أنت' : 'You'),
                          listing_type: myPendingBooks.length === 1 ? myPendingBooks[0].listing_type : undefined,
                        },
                        intakePin: generateCommunityIntakePin(myPendingBooks[0].id),
                      })
                    }
                    className="w-full sm:w-auto rounded-2xl font-black text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 gap-2 px-4 py-3 cursor-pointer justify-center shrink-0 active:scale-98 transition-all"
                  >
                    <QrCode className="h-4 w-4 shrink-0" />
                    <span>
                      {myPendingBooks.length === 1
                        ? lang === 'ar'
                          ? 'عرض رمز QR لتسليم الكتاب 📦'
                          : 'View Drop-off QR Code 📦'
                        : lang === 'ar'
                        ? `عرض رمز QR الموحد لجميع الكتب (${myPendingBooks.length}) 📦`
                        : `View Unified QR for All (${myPendingBooks.length}) Books 📦`}
                    </span>
                  </Button>
                </div>

                {/* Preview of books included in this unified QR code */}
                <div className="pt-2 border-t border-emerald-500/20">
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center justify-between">
                    <span>
                      {lang === 'ar'
                        ? 'الكتب المشمولة في هذا الرمز الموحد (يتم اعتمادها معاً بمسحة واحدة):'
                        : 'Books included in this single QR code (approved together in 1 scan):'}
                    </span>
                    <span className="font-mono text-[10px] bg-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                      {myPendingBooks.length} {lang === 'ar' ? 'كتب' : 'books'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
                    {myPendingBooks.map(pb => (
                      <div
                        key={pb.id}
                        onClick={() =>
                          setIntakeQrModal({
                            isOpen: true,
                            mode: 'VOUCHER',
                            book: {
                              id: myPendingBooks[0].id,
                              title:
                                myPendingBooks.length === 1
                                  ? myPendingBooks[0].title
                                  : `${myPendingBooks.length} ${lang === 'ar' ? 'كتب للتسليم الموحد' : 'books unified batch'}`,
                              bookCount: myPendingBooks.length,
                              items: myPendingBooks,
                              cover_image_url: myPendingBooks[0].cover_image_url,
                              owner_name: myPendingBooks[0].owner_name || (lang === 'ar' ? 'أنت' : 'You'),
                              listing_type: myPendingBooks.length === 1 ? myPendingBooks[0].listing_type : undefined,
                            },
                            intakePin: generateCommunityIntakePin(myPendingBooks[0].id),
                          })
                        }
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/80 hover:bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-foreground shrink-0 cursor-pointer transition-all hover:scale-102"
                        title={lang === 'ar' ? 'انقر لفتح رمز QR الموحد' : 'Click to open unified QR code'}
                      >
                        <span className="text-emerald-600">📖</span>
                        <span className="truncate max-w-[150px] sm:max-w-[220px]">{pb.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bookshelf Grid, List or Empty State */}
            {shelfBooks.length === 0 ? (
              <div className="text-center py-16 px-6 rounded-3xl border-2 border-dashed border-border/80 bg-muted/10 space-y-4 max-w-md mx-auto">
                <div className="text-6xl animate-bounce">📚</div>
                <h3 className="text-lg font-black text-foreground">
                  {lang === 'ar' ? 'رف المجتمع لا يحتوي على كتب بعد' : 'No books on this community shelf yet'}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {lang === 'ar'
                    ? 'شارك أول كتاب لك في هذا المجتمع لتبادله أو إعارته مع باقي الأعضاء في نقطة اللقاء الآمنة.'
                    : 'Share your first book in this community to swap or lend with members at the designated meetup hub.'}
                </p>
                <Button
                  onClick={handleOpenAddBook}
                  className="rounded-2xl font-black text-xs gap-2 px-6 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/25 cursor-pointer hover:scale-102 transition-all"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                  <span>{lang === 'ar' ? 'أضف أول كتاب للرف الآن' : 'Add First Book to Shelf'}</span>
                </Button>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center py-16 px-6 rounded-3xl border border-border/70 bg-card/60 space-y-4 max-w-md mx-auto">
                <div className="text-4xl">🔍</div>
                <h3 className="text-base font-black text-foreground">
                  {lang === 'ar' ? 'لم يتم العثور على كتب تطابق بحثك' : 'No books matched your search'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {lang === 'ar'
                    ? 'جرب البحث بعنوان مختلف أو تغيير فلتر التبادل / الاستعارة.'
                    : 'Try searching with different terms or changing the exchange filter.'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBookshelfSearch('')
                    setBookFilter('ALL')
                  }}
                  className="rounded-xl font-bold text-xs cursor-pointer"
                >
                  {lang === 'ar' ? 'إعادة ضبط البحث والفلاتر' : 'Reset Search & Filters'}
                </Button>
              </div>
            ) : bookshelfView === 'grid' ? (
              /* =================== SHOWCASE GRID VIEW (BIG BOOKS) =================== */
              <div className={cn(
                "grid gap-3.5 sm:gap-7 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                mobileCols === '1' ? 'grid-cols-1' : 'grid-cols-2'
              )}>
                {filteredBooks.map(book => {
                  const bookType = book.listing_type || book.type
                  const isMyBook = currentUserId && (book.owner_id === currentUserId || book.added_by === currentUserId)

                  return (
                    <div
                      key={book.id}
                      className="group relative flex flex-col justify-between rounded-3xl border border-border/70 bg-gradient-to-b from-card via-card to-muted/20 p-3 sm:p-5 shadow-sm hover:shadow-2xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                    >
                      {/* Ambient hover glow */}
                      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="space-y-4 relative z-10">
                        {/* ENLARGED BOOK COVER WITH 3D DEPTH */}
                        <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-gradient-to-br from-muted via-muted/90 to-muted/70 shadow-md group-hover:shadow-2xl transition-all duration-500 border border-border/50">
                          {book.cover_image_url ? (
                            <Image
                              src={book.cover_image_url}
                              alt={book.title || ''}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="h-full w-full flex flex-col justify-between p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-primary/80 text-white select-none">
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold">WARAQ Shelf</span>
                                <div className="text-2xl">📚</div>
                              </div>
                              <div className="space-y-1">
                                <h5 className="font-black text-sm line-clamp-2 leading-snug">{book.title}</h5>
                                <p className="text-xs text-slate-300 line-clamp-1">{book.author}</p>
                              </div>
                            </div>
                          )}

                          {/* 3D Realistic Book Spine Depth & Highlights */}
                          <div className="pointer-events-none absolute inset-y-0 start-0 w-4 bg-gradient-to-r from-black/45 via-white/10 to-transparent z-10" />
                          <div className="pointer-events-none absolute inset-y-0 start-4 w-[1px] bg-black/20 z-10" />
                          <div className="pointer-events-none absolute inset-y-0 end-0 w-1 bg-gradient-to-l from-black/20 to-transparent z-10" />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-10" />

                          {/* Top Floating Badges */}
                          <div className="absolute top-3 inset-x-3 z-20 flex items-start justify-between gap-1.5">
                            {/* Exchange Type Badge */}
                            <div>
                              {bookType === 'SWAP' && (
                                <span className="inline-flex items-center gap-1 backdrop-blur-md bg-purple-600/90 text-white font-black text-[11px] px-2.5 py-1 rounded-xl shadow-md border border-purple-300/30">
                                  🔄 {lang === 'ar' ? 'تبادل مجاني' : 'Free Swap'}
                                </span>
                              )}
                              {bookType === 'BORROW' && (
                                <span className="inline-flex items-center gap-1 backdrop-blur-md bg-amber-600/90 text-white font-black text-[11px] px-2.5 py-1 rounded-xl shadow-md border border-amber-300/30">
                                  ⏳ {lang === 'ar' ? 'استعارة' : 'Borrow'}
                                </span>
                              )}
                              {(bookType === 'SELL' || bookType === 'SELL_OR_SWAP') && (
                                <span className="inline-flex items-center gap-1 backdrop-blur-md bg-emerald-600/90 text-white font-black text-[11px] px-2.5 py-1 rounded-xl shadow-md border border-emerald-300/30">
                                  💰 {lang === 'ar' ? 'للبيع' : 'For Sale'}
                                </span>
                              )}
                            </div>

                            {/* Ownership & Condition Pill */}
                            <div className="flex flex-col items-end gap-1">
                              {isMyBook && (
                                <span className="backdrop-blur-md bg-primary/95 text-primary-foreground font-black text-[10px] px-2.5 py-1 rounded-xl shadow-md border border-white/20">
                                  👑 {lang === 'ar' ? 'كتابك' : 'Your Book'}
                                </span>
                              )}
                              {book.condition && (
                                <span className="backdrop-blur-md bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg border border-white/20 shadow-sm">
                                  {getConditionLabel(book.condition as any, lang)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick View Button on Cover */}
                          {book.listing_id && (
                            <Link
                              href={`/books/${book.listing_id}`}
                              className="absolute bottom-2.5 end-2.5 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/65 hover:bg-black/90 text-white backdrop-blur-md text-xs font-bold transition-all shadow-md active:scale-95 border border-white/25"
                              title={lang === 'ar' ? 'عرض تفاصيل الكتاب الكاملة' : 'View Full Details'}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>{lang === 'ar' ? 'عرض' : 'View'}</span>
                            </Link>
                          )}
                        </div>

                        {/* BOOK INFO */}
                        <div className="space-y-1.5">
                          <h4
                            className="font-black text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug"
                            title={book.title}
                          >
                            {book.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground font-semibold line-clamp-1">
                            {book.author || (lang === 'ar' ? 'مؤلف غير محدد' : 'Unknown Author')}
                          </p>

                          {/* Safe Hub Meetup Spot Callout */}
                          <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 mt-3">
                            <Coffee className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span className="truncate">
                              {lang === 'ar' ? `نقطة التسليم: ${community.hub_name || 'فرع المجتمع'}` : `Pickup Hub: ${community.hub_name || 'Hub'}`}
                            </span>
                          </div>

                          {/* Owner & Rating Bar */}
                          <div className="pt-2.5 mt-2.5 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                                {(book.owner_name || 'U').charAt(0)}
                              </div>
                              <span className="truncate font-bold text-foreground">
                                {book.owner_name || (lang === 'ar' ? 'عضو بالمجتمع' : 'Community Member')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-amber-500 shrink-0 font-bold">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              <span>{book.owner_rating || '5.0'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pricing / Exchange Terms & Actions */}
                      <div className="pt-3.5 mt-3.5 border-t border-border/60 relative z-10 space-y-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[11px] text-muted-foreground font-bold">
                            {lang === 'ar' ? 'شروط المعاملة:' : 'Exchange terms:'}
                          </span>
                          <div className="text-xs text-end">
                            {bookType === 'SWAP' && (
                              <span className="font-black text-emerald-600 dark:text-emerald-400">
                                {lang === 'ar' ? 'تبادل مباشر 1 مقابل 1 🔄' : '1-for-1 Swap 🔄'}
                              </span>
                            )}
                            {bookType === 'BORROW' && (
                              <span className="font-black text-amber-600 dark:text-amber-400">
                                {book.borrow_fee || 15} ج.م / أسبوع
                                <span className="text-[10px] text-muted-foreground font-normal ms-1">(تأمين: {book.deposit || 50} ج)</span>
                              </span>
                            )}
                            {(bookType === 'SELL' || bookType === 'SELL_OR_SWAP') && (
                              <span className="font-black text-foreground text-sm">
                                {formatPrice(book.price ?? 0)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* CTA Button */}
                        {isMyBook ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex-1 justify-center py-2.5 rounded-xl font-black text-xs bg-muted/60 border-border/80 text-foreground">
                              👑 {lang === 'ar' ? 'كتابك مدرج في الرف' : 'Your Book on Shelf'}
                            </Badge>
                            {book.listing_id && (
                              <Link href={`/books/${book.listing_id}`}>
                                <Button size="sm" variant="outline" className="rounded-xl font-bold text-xs h-9 px-3 cursor-pointer" title={lang === 'ar' ? 'تعديل أو عرض الإعلان' : 'View Listing'}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setBookToRemove(book)
                                }}
                                className="rounded-xl font-bold text-xs h-9 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer shrink-0"
                                title={lang === 'ar' ? 'إزالة من رف المجتمع' : 'Remove from shelf'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {book.listing_id && (
                              <Link href={`/books/${book.listing_id}`} className="shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl font-bold text-xs h-10 px-3 cursor-pointer hover:bg-muted"
                                  title={lang === 'ar' ? 'عرض تفاصيل الكتاب' : 'Book Details'}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleOpenRequestModal(book)}
                              className="flex-1 rounded-xl font-black text-xs gap-1.5 cursor-pointer bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 text-white shadow-md shadow-primary/25 h-10 px-4 active:scale-98 transition-all"
                            >
                              <ArrowRightLeft className="h-4 w-4 shrink-0" />
                              <span className="truncate">{lang === 'ar' ? 'طلب استلام من الفرع' : 'Request & Pickup'}</span>
                            </Button>
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setBookToRemove(book)
                                }}
                                className="rounded-xl font-bold text-xs h-10 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer shrink-0"
                                title={lang === 'ar' ? 'إزالة الكتاب من رف المجتمع' : 'Remove book from community shelf'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* =================== DETAILED LIST VIEW =================== */
              <div className="space-y-4">
                {filteredBooks.map(book => {
                  const bookType = book.listing_type || book.type
                  const isMyBook = currentUserId && (book.owner_id === currentUserId || book.added_by === currentUserId)

                  return (
                    <div
                      key={book.id}
                      className="group flex flex-row items-start sm:items-stretch gap-3 sm:gap-5 p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-border/70 bg-card hover:bg-card/95 hover:border-primary/50 shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      {/* List Cover (Big & crisp) */}
                      <div className="relative h-32 w-24 sm:h-56 sm:w-40 rounded-xl sm:rounded-2xl overflow-hidden bg-muted border border-border/60 shrink-0 shadow-md">
                        {book.cover_image_url ? (
                          <Image src={book.cover_image_url} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 96px, 160px" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-3xl sm:text-4xl bg-gradient-to-br from-indigo-950 to-slate-900 text-white">
                            📖
                          </div>
                        )}
                        <div className="pointer-events-none absolute inset-y-0 start-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent z-10" />
                      </div>

                      {/* List Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2.5 sm:space-y-3">
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            {bookType === 'SWAP' && (
                              <Badge variant="swap" className="text-[10px] sm:text-xs font-black">
                                🔄 {lang === 'ar' ? 'تبادل مجاني' : 'Swap'}
                              </Badge>
                            )}
                            {bookType === 'BORROW' && (
                              <Badge variant="outline" className="text-[10px] sm:text-xs font-black border-amber-500 text-amber-600 bg-amber-500/10">
                                ⏳ {lang === 'ar' ? 'استعارة مؤقتة' : 'Borrow'}
                              </Badge>
                            )}
                            {(bookType === 'SELL' || bookType === 'SELL_OR_SWAP') && (
                              <Badge variant="sell" className="text-[10px] sm:text-xs font-black">
                                💰 {lang === 'ar' ? 'شراء نقدي' : 'For Sale'}
                              </Badge>
                            )}
                            {isMyBook && (
                              <Badge variant="outline" className="text-[10px] sm:text-xs font-black bg-primary/10 text-primary border-primary/20">
                                👑 {lang === 'ar' ? 'كتابك' : 'Your Book'}
                              </Badge>
                            )}
                          </div>

                          <h4 className="font-black text-sm sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {book.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground font-semibold line-clamp-1">{book.author}</p>

                          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl border border-emerald-500/20 max-w-fit">
                            <Coffee className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-emerald-600" />
                            <span className="truncate">
                              {lang === 'ar' ? `نقطة التسليم: ${community.hub_name || 'فرع المجتمع'}` : `Safe Pickup Hub: ${community.hub_name || 'Hub'}`}
                            </span>
                          </div>
                        </div>

                        {/* List Footer with Owner & CTA */}
                        <div className="pt-2 sm:pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 w-full sm:w-auto">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-primary/10 text-primary font-black text-[11px] sm:text-xs flex items-center justify-center shrink-0">
                                {(book.owner_name || 'U').charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-foreground truncate max-w-[90px] sm:max-w-none">{book.owner_name}</div>
                                <div className="text-[10px] sm:text-[11px] text-amber-500 font-bold flex items-center gap-0.5">
                                  <Star className="h-3 w-3 fill-current" />
                                  <span>{book.owner_rating || '5.0'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="ms-2 ps-2 sm:ms-4 sm:ps-4 border-s border-border/60 text-xs sm:text-sm font-black text-foreground shrink-0 text-end">
                              {bookType === 'SWAP' && <span className="text-emerald-600">تبادل 1:1</span>}
                              {bookType === 'BORROW' && <span className="text-amber-600">{book.borrow_fee || 15} ج.م / أسبوع</span>}
                              {(bookType === 'SELL' || bookType === 'SELL_OR_SWAP') && <span>{formatPrice(book.price ?? 0)}</span>}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                            {book.listing_id && (
                              <Link href={`/books/${book.listing_id}`} className={isMyBook ? 'col-span-2 sm:col-auto' : 'col-span-1 sm:col-auto'}>
                                <Button size="sm" variant="outline" className="w-full sm:w-auto rounded-xl font-bold text-xs h-9 sm:h-10 px-3 sm:px-4 cursor-pointer gap-1.5 justify-center">
                                  <Eye className="h-4 w-4" />
                                  <span>{lang === 'ar' ? 'التفاصيل' : 'Details'}</span>
                                </Button>
                              </Link>
                            )}
                            {!isMyBook && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenRequestModal(book)}
                                className={book.listing_id ? 'col-span-1 sm:col-auto rounded-xl font-black text-xs gap-1.5 cursor-pointer bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md shadow-primary/20 h-9 sm:h-10 px-3 sm:px-5 justify-center' : 'col-span-2 sm:col-auto rounded-xl font-black text-xs gap-1.5 cursor-pointer bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md shadow-primary/20 h-9 sm:h-10 px-3 sm:px-5 justify-center'}
                              >
                                <ArrowRightLeft className="h-4 w-4 shrink-0" />
                                <span className="truncate">{lang === 'ar' ? 'طلب استلام' : 'Request'}</span>
                              </Button>
                            )}
                            {isAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setBookToRemove(book)}
                                className="col-span-2 sm:col-auto rounded-xl font-bold text-xs h-8 sm:h-10 px-3 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5 transition-colors justify-center"
                                title={lang === 'ar' ? 'إزالة من رف المجتمع' : 'Remove from shelf'}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>{lang === 'ar' ? 'إزالة من الرف' : 'Remove'}</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAFE HUB SPOTLIGHT */}
        {activeTab === 'safe-hub' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-sm">
              {/* Admin Quick Intake Actions on site at the Hub */}
              {isAdmin && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border-2 border-emerald-500/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 shrink-0">
                        <QrCode className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-foreground">
                          {lang === 'ar' ? 'إدارة استلام الكتب في هذا المقر 📦' : 'Hub Intake Custodian Actions 📦'}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          {lang === 'ar'
                            ? `لديك ${pendingBooks.length} كتب معلقة بانتظار الاستلام والاعتماد بالفرع`
                            : `${pendingBooks.length} pending books awaiting physical intake`}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        onClick={() =>
                          setIntakeQrModal({
                            isOpen: true,
                            mode: 'SCAN_AND_VERIFY',
                          })
                        }
                        className="col-span-1 sm:col-auto justify-center rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 gap-1.5 px-3.5 py-2 cursor-pointer"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? 'مسح QR' : 'Scan QR'}</span>
                      </Button>
                      {pendingBooks.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={approvingAllPending}
                          onClick={handleApproveAllPendingBooks}
                          className="col-span-1 sm:col-auto justify-center rounded-xl font-black text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 gap-1.5 px-3 py-2 cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>
                            {lang === 'ar'
                              ? `اعتماد الكل (${pendingBooks.length})`
                              : `Approve All (${pendingBooks.length})`}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-black border border-emerald-500/20">
                <Coffee className="h-4 w-4" />
                <span>{lang === 'ar' ? 'المكان الرسمي الآمن للقاء والتسليم' : 'Designated Safe Meetup Spot'}</span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                  {currentComm.hub_name || community.hub_name}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-2">
                  {currentComm.hub_instructions || community.hub_instructions || (lang === 'ar'
                    ? 'هذا المكان هو النقطة الرسمية المعتمدة لتبادل واستعارة وشراء الكتب بين أعضاء هذا المجتمع. المكان عام وهادئ ومعروف لتفحص الكتب بأمان وسهولة.'
                    : 'This location is the official safe meeting spot for swapping, lending, and buying books among community members.')}
                </p>
              </div>

              {(currentComm.hub_address || currentComm.location_text) && (
                <div className="p-4 sm:p-5 rounded-2xl bg-muted/40 border border-border/60 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-black text-foreground">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span>{lang === 'ar' ? 'العنوان والموقع بالتفصيل:' : 'Location & Address:'}</span>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                    {currentComm.hub_address || currentComm.location_text}
                  </p>

                  {(currentComm.hub_lat && currentComm.hub_lng) ? (
                    <a
                      href={`https://maps.google.com/?q=${currentComm.hub_lat},${currentComm.hub_lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline pt-1.5"
                    >
                      <span>{lang === 'ar' ? 'عرض الاتجاهات على خرائط Google' : 'Open in Google Maps'}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : currentComm.hub_address ? (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(currentComm.hub_address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline pt-1.5"
                    >
                      <span>{lang === 'ar' ? 'بحث عن العنوان على خرائط Google' : 'Search Address on Google Maps'}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              )}

              {/* Interactive Safe Hub Map Display */}
              {((currentComm.hub_lat && currentComm.hub_lng) || (community.hub_lat && community.hub_lng)) && (
                <div className="rounded-2xl border border-border/80 overflow-hidden shadow-xs">
                  <div className="p-3 bg-muted/40 border-b border-border/60 flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-black">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      <span>{lang === 'ar' ? 'خريطة النقطة الآمنة المعتمدة' : 'Official Meetup Hub Map'}</span>
                    </span>
                    <a
                      href={`https://maps.google.com/?q=${currentComm.hub_lat || community.hub_lat},${currentComm.hub_lng || community.hub_lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-xs font-black"
                    >
                      <span>{lang === 'ar' ? 'اتجاهات السير 🚗' : 'Directions 🚗'}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <MapLocationPicker
                    latitude={currentComm.hub_lat || community.hub_lat}
                    longitude={currentComm.hub_lng || community.hub_lng}
                    onLocationSelect={() => {}}
                    hubLatitude={currentComm.hub_lat || community.hub_lat}
                    hubLongitude={currentComm.hub_lng || community.hub_lng}
                    onHubLocationSelect={() => {}}
                    activeMode="hub"
                    height="260px"
                    lang={lang}
                    showHubOption={false}
                  />
                </div>
              )}

              {/* Safety Rules */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-black text-foreground block uppercase tracking-wider">
                  {lang === 'ar' ? 'إرشادات الأمان وسرعة التسليم:' : 'Safety Guidelines:'}
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-muted/30 border border-border/50 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{lang === 'ar' ? 'تفحص صفحات الكتاب وحالته قبل إنهاء التسليم' : 'Inspect the book pages before finishing handover'}</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-muted/30 border border-border/50 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{lang === 'ar' ? 'في حالة الاستعارة، يتم تسليم التأمين النقدي مباشرة وحفظ الموعد في التطبيق' : 'Security deposit is handled on-site and tracked in-app'}</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-muted/30 border border-border/50 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{lang === 'ar' ? 'المكان مفتوح ويتميز بوجود طاولات مريحة ومقاعد للقراءة' : 'Public, well-lit cafe space with comfortable seating'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hub Photo Card */}
            <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm space-y-4 p-3.5 sm:p-6">
              <div className="relative h-56 sm:h-96 w-full rounded-xl sm:rounded-2xl overflow-hidden bg-muted">
                {(currentComm.hub_photo_url || community.hub_photo_url) ? (
                  <Image src={(currentComm.hub_photo_url || community.hub_photo_url)!} alt="" fill className="object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-6xl">☕</div>
                )}
                <div className="absolute bottom-3 start-3 px-3.5 py-2 rounded-xl backdrop-blur-md bg-black/75 text-white text-xs font-bold border border-white/20 shadow-lg">
                  📍 {currentComm.hub_name || community.hub_name}
                </div>
              </div>

              <div className="p-2 space-y-2">
                <h4 className="font-black text-sm text-foreground">
                  {lang === 'ar' ? 'موعد التجمع الأسبوعي للمجتمع:' : 'Weekly Community Swap Hours:'}
                </h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span>{lang === 'ar' ? 'الخميس والجمعة من 4م إلى 8م (أو في أي وقت بالتنسيق بين الطرفين)' : 'Thu & Fri 4pm - 8pm (or anytime agreed in chat)'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DISCUSSION & BOOK REQUESTS */}
        {activeTab === 'discussion' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* New Post Form */}
            <form
              onSubmit={handleAddPost}
              className="rounded-3xl border-2 border-border/80 bg-card p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center gap-2 text-xs font-black text-foreground">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span>{lang === 'ar' ? 'اطلب كتاباً أو اقترح مبادلة في نقطة اللقاء:' : 'Request a book or propose a meetup:'}</span>
              </div>

              <textarea
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                rows={3}
                placeholder={lang === 'ar'
                  ? 'اكتب هنا: مثلاً "مين معاه رواية كذا يبدلها معايا في سيلانترو يوم الجمعة؟"'
                  : 'Post a request e.g., "Anyone have Atomic Habits to swap this Friday at Cilantro?"'}
                className="w-full rounded-2xl bg-muted/30 border border-border/80 p-3 text-xs font-semibold focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
              />

              <div className="flex items-center justify-end">
                <Button
                  type="submit"
                  size="sm"
                  loading={isPosting}
                  disabled={!newPostContent.trim()}
                  className="rounded-xl font-bold text-xs gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className={cn('h-3.5 w-3.5', isRTL && 'rotate-180')} />
                  <span>{lang === 'ar' ? 'نشر الطلب' : 'Post to Group'}</span>
                </Button>
              </div>
            </form>

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.map(post => (
                <div
                  key={post.id}
                  className="rounded-3xl border-2 border-border/80 bg-card p-5 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                        {post.author?.avatar_url ? (
                          <img src={post.author.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          post.author?.full_name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-foreground block">
                          {post.author?.full_name_ar || post.author?.full_name || 'قارئ'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(post.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {post.is_pinned && (
                      <Badge variant="outline" className="text-[10px] font-bold border-amber-500 text-amber-600 bg-amber-500/10">
                        📌 {lang === 'ar' ? 'مثبت' : 'Pinned'}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                    <button
                      type="button"
                      className="flex items-center gap-1 font-bold hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Heart className="h-3.5 w-3.5" />
                      <span>{post.like_count || 0}</span>
                    </button>

                    <Link
                      href={`/messages`}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>{lang === 'ar' ? 'تواصل بالرسائل' : 'Reply in Chat'}</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ADMIN PANEL (Only visible if isAdmin) */}
        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-8 animate-in fade-in">
            {/* Admin Header */}
            <div className="p-6 rounded-3xl bg-primary/10 border-2 border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-3 rounded-2xl bg-primary text-white shadow-md">👑</span>
                <div>
                  <h2 className="text-xl font-black text-foreground">
                    {lang === 'ar' ? 'لوحة تحكم أدمن المجتمع' : 'Community Admin Dashboard'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lang === 'ar'
                      ? 'أنت المسؤول الرسمي عن إدارة هذا المجتمع، اعتماد الأعضاء والكتب وتحديث بيانات نقطة اللقاء.'
                      : 'You are the official admin. Manage member join approvals, books, and safe meetup hub details.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Approval Feedback Toast */}
            {approvalToast && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{approvalToast}</span>
              </div>
            )}

            {/* Section 0: Community Books Approvals */}
            <div className="rounded-3xl border-2 border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <BookMarked className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    {lang === 'ar' ? 'الكتب المقدمة بانتظار الاعتماد لرف المجتمع' : 'Books Awaiting Shelf Approval'}
                  </h3>
                  <Badge variant={pendingBooks.length > 0 ? 'warning' : 'outline'} className="font-bold text-xs ms-1">
                    {pendingBooks.length} {lang === 'ar' ? 'كتاب معلق' : 'pending'}
                  </Badge>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  {/* Approve All Pending Books in 1 Click */}
                  {pendingBooks.length > 0 && (
                    <Button
                      variant="outline"
                      loading={approvingAllPending}
                      onClick={handleApproveAllPendingBooks}
                      className="rounded-2xl font-black text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 gap-2 px-3.5 py-2.5 cursor-pointer justify-center w-full sm:w-auto"
                    >
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span>
                        {lang === 'ar'
                          ? `اعتماد الكل دفعة واحدة (${pendingBooks.length}) ✨`
                          : `Approve All (${pendingBooks.length}) ✨`}
                      </span>
                    </Button>
                  )}

                  {/* Scan QR Button */}
                  <Button
                    onClick={() =>
                      setIntakeQrModal({
                        isOpen: true,
                        mode: 'SCAN_AND_VERIFY',
                      })
                    }
                    className="rounded-2xl font-black text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 gap-2 px-4 py-2.5 cursor-pointer justify-center w-full sm:w-auto"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'مسح رمز QR لاعتماد واستلام كتاب 📷' : 'Scan QR to Accept Book 📷'}</span>
                  </Button>
                </div>
              </div>

              {pendingBooks.length === 0 ? (
                <div className="text-center py-8 rounded-2xl border border-dashed text-xs text-muted-foreground bg-muted/20">
                  {lang === 'ar'
                    ? '🎉 لا توجد كتب معلقة حالياً! جميع الكتب المقدمة معتمدة ومعروضة على الرف.'
                    : '🎉 No pending book submissions. All books are approved on the shelf.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingBooks.map((book: any) => (
                    <div
                      key={book.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-muted/30 border border-border/60 hover:border-emerald-500/30 transition-all"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                        <div className="relative h-16 w-12 rounded-xl overflow-hidden bg-muted border border-border/60 shrink-0">
                          {book.cover_image_url ? (
                            <Image src={book.cover_image_url} alt="" fill className="object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs">📖</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-foreground truncate">{book.title}</h4>
                            <Badge variant="outline" className="text-[10px] font-bold">
                              {book.listing_type || book.type}
                            </Badge>
                            <Badge variant="secondary" className="font-mono text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold">
                              {generateCommunityIntakePin(book.id)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {lang === 'ar' ? 'مقدم من:' : 'Submitted by:'} <span className="font-bold text-foreground">{book.owner_name || 'قارئ'}</span>
                            {book.price && ` • السعر: ${book.price} ج.م`}
                          </p>
                          {book.note && (
                            <p className="text-[11px] text-primary bg-primary/5 px-2 py-0.5 rounded-md mt-1 inline-block">
                              📝 {book.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-border/50">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const userBatch = pendingBooks.filter(
                              (b: any) => b.added_by && b.added_by === book.added_by
                            )
                            const items = userBatch.length > 0 ? userBatch : [book]
                            setIntakeQrModal({
                              isOpen: true,
                              mode: 'VOUCHER',
                              book: {
                                ...book,
                                title:
                                  items.length > 1
                                    ? `${items.length} ${lang === 'ar' ? 'كتب للتسليم' : 'books for drop-off'}`
                                    : book.title,
                                bookCount: items.length,
                                items,
                              },
                              intakePin: generateCommunityIntakePin(book.id),
                            })
                          }}
                          className="col-span-1 sm:col-auto justify-center text-xs font-bold rounded-xl border-border/80 text-muted-foreground hover:text-foreground cursor-pointer gap-1 py-2 sm:py-2"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          <span>{lang === 'ar' ? 'عرض الرمز' : 'View QR'}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={bookApprovalLoading === `reject-${book.id}`}
                          onClick={() => handleRejectCommunityBook(book)}
                          className="col-span-1 sm:col-auto justify-center text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl cursor-pointer py-2 sm:py-2"
                        >
                          <X className="h-4 w-4 me-1" />
                          <span>{lang === 'ar' ? 'رفض' : 'Reject'}</span>
                        </Button>
                        <Button
                          size="sm"
                          loading={bookApprovalLoading === `approve-${book.id}`}
                          onClick={() => handleApproveCommunityBook(book)}
                          className="col-span-2 sm:col-auto w-full sm:w-auto justify-center text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer gap-1 py-2.5 sm:py-2"
                        >
                          <Check className="h-4 w-4 me-1" />
                          <span>{lang === 'ar' ? 'اعتماد وإضافة للرف' : 'Approve to Shelf'}</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 0.5: Manage Active Live Books on Community Shelf */}
            <div className="rounded-3xl border-2 border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    {lang === 'ar' ? 'الكتب المعروضة حالياً على رف المجتمع' : 'Current Books on Community Shelf'}
                  </h3>
                  <Badge variant="outline" className="font-bold text-xs ms-1">
                    {shelfBooks.length} {lang === 'ar' ? 'كتاب معروض' : 'live books'}
                  </Badge>
                </div>

                {/* Quick Shelf Search */}
                {shelfBooks.length > 0 && (
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? 'بحث في كتب الرف...' : 'Search shelf books...'}
                      value={adminShelfSearch}
                      onChange={e => setAdminShelfSearch(e.target.value)}
                      className="w-full ps-8 pe-3 py-1.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </div>

              {shelfBooks.length === 0 ? (
                <div className="text-center py-8 rounded-2xl border border-dashed text-xs text-muted-foreground bg-muted/20">
                  {lang === 'ar'
                    ? 'لا توجد كتب معروضة حالياً على رف هذا المجتمع.'
                    : 'No books currently on this community shelf.'}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pe-1">
                  {shelfBooks
                    .filter(b => {
                      if (!adminShelfSearch.trim()) return true
                      const q = adminShelfSearch.toLowerCase().trim()
                      return (
                        (b.title || '').toLowerCase().includes(q) ||
                        (b.author || '').toLowerCase().includes(q) ||
                        (b.owner_name || '').toLowerCase().includes(q)
                      )
                    })
                    .map((book: any) => (
                      <div
                        key={book.id || book.listing_id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-muted/20 border border-border/60 hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                          <div className="relative h-14 w-10 rounded-xl overflow-hidden bg-muted border border-border/60 shrink-0">
                            {book.cover_image_url ? (
                              <Image src={book.cover_image_url} alt="" fill className="object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs">📖</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-foreground truncate">{book.title}</h4>
                              <Badge variant="outline" className="text-[10px] font-bold">
                                {book.listing_type || book.type}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                                {lang === 'ar' ? 'معتمد على الرف ✅' : 'Live on Shelf ✅'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {lang === 'ar' ? 'المودع / المالك:' : 'Owner:'}{' '}
                              <span className="font-bold text-foreground">{book.owner_name || 'عضو بالمجتمع'}</span>
                              {book.price && ` • ${book.price} ج.م`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                          {book.listing_id && (
                            <Link href={`/books/${book.listing_id}`} className="flex-1 sm:flex-initial">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto text-xs font-bold rounded-xl border-border/80 text-muted-foreground hover:text-foreground cursor-pointer h-9 px-3 justify-center"
                              >
                                <Eye className="h-3.5 w-3.5 me-1" />
                                <span>{lang === 'ar' ? 'عرض' : 'View'}</span>
                              </Button>
                            </Link>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setBookToRemove(book)}
                            disabled={removingBookId === (book.id || book.listing_id)}
                            className="flex-1 sm:flex-initial text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl cursor-pointer h-9 px-3 gap-1 justify-center"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>{lang === 'ar' ? 'إزالة' : 'Remove'}</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Section 1: Member Approvals */}
            <div className="rounded-3xl border-2 border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    {lang === 'ar' ? 'طلبات انضمام الأعضاء والتحكم بالأدوار' : 'Member Join Requests & Roles'}
                  </h3>
                </div>
                <Badge variant="outline" className="font-bold text-xs">
                  {members.length} {lang === 'ar' ? 'عضو' : 'members'}
                </Badge>
              </div>

              {loadingMembers ? (
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'جاري تحميل الأعضاء...' : 'Loading members...'}</p>
              ) : members.length === 0 ? (
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'لا يوجد أعضاء حالياً.' : 'No members yet.'}</p>
              ) : (
                <div className="space-y-3">
                  {members.map(member => (
                    <div
                      key={member.user_id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-muted/30 border border-border/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">
                          {member.profile?.avatar_url ? (
                            <img src={member.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            member.profile?.full_name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">
                              {member.profile?.full_name_ar || member.profile?.full_name || 'قارئ'}
                            </span>
                            <Badge
                              className={cn(
                                'text-[10px] font-bold',
                                member.role === 'ADMIN'
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                  : 'bg-primary/10 text-primary border-primary/20'
                              )}
                            >
                              {member.role === 'ADMIN' ? '👑 أدمن' : 'عضو'}
                            </Badge>
                            <Badge
                              className={cn(
                                'text-[10px] font-bold',
                                member.status === 'APPROVED'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : member.status === 'REJECTED'
                                  ? 'bg-red-500/10 text-red-600'
                                  : 'bg-amber-500/10 text-amber-600 animate-pulse'
                              )}
                            >
                              {member.status === 'APPROVED' ? 'معتمد ✅' : member.status === 'REJECTED' ? 'مرفوض ❌' : 'قيد المراجعة ⏳'}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {lang === 'ar' ? 'التقييم:' : 'Rating:'} ⭐ {member.profile?.rating_average || 5.0}
                          </span>
                        </div>
                      </div>

                      {member.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMemberStatus(member.user_id, 'REJECTED')}
                            className="font-bold text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
                          >
                            <X className="h-3.5 w-3.5 me-1" />
                            {lang === 'ar' ? 'رفض' : 'Reject'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMemberStatus(member.user_id, 'APPROVED')}
                            className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                          >
                            <Check className="h-3.5 w-3.5 me-1" />
                            {lang === 'ar' ? 'قبول العضوية' : 'Approve'}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Comprehensive Edit Community Details Form */}
            <div id="admin-edit-section" className="rounded-3xl border-2 border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-xs scroll-mt-24">
              <div className="flex items-center gap-2 border-b border-border/60 pb-4">
                <Settings className="h-5 w-5 text-primary" />
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  {lang === 'ar' ? 'إدارة وتعديل بيانات المجتمع بالكامل' : 'Edit Full Community Details'}
                </h3>
              </div>

              {saveDetailsSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'تم حفظ وتحديث بيانات المجتمع بنجاح!' : 'Community details updated successfully!'}</span>
                </div>
              )}

              <form onSubmit={handleSaveCommunityDetails} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-foreground block">
                      {lang === 'ar' ? 'اسم المجتمع (بالعربية)' : 'Community Name (Arabic)'}
                    </label>
                    <input
                      type="text"
                      value={editNameAr}
                      onChange={e => setEditNameAr(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-foreground block">
                      {lang === 'ar' ? 'اسم المجتمع (بالإنجليزية)' : 'Community Name (English)'}
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-foreground block">
                    {lang === 'ar' ? 'نوع المجتمع والتصنيف التنظيمي' : 'Organization Type'}
                  </label>
                  <select
                    value={editOrgType}
                    onChange={e => setEditOrgType(e.target.value as CommunityOrgType)}
                    className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="CLUB">نادي قراءة (Reading Club)</option>
                    <option value="NEIGHBORHOOD">حي سكني (Neighborhood)</option>
                    <option value="UNIVERSITY">جامعة / طلاب (University / Campus)</option>
                    <option value="COMPANY">شركة / زملاء عمل (Company)</option>
                    <option value="SCHOOL">مدرسة (School)</option>
                    <option value="OTHER">أخرى (Other)</option>
                  </select>
                </div>

                {/* ── Brand Visuals: Logo & Cover Banner Upload Dropzones ── */}
                <div className="rounded-2xl border-2 border-border/80 bg-muted/20 p-4 space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-black text-foreground uppercase tracking-wider">
                      {lang === 'ar' ? 'هوية المجتمع البصرية والشعار والغلاف' : 'Visual Identity: Logo & Cover Banner'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ImageUploadDropzone
                      label={lang === 'ar' ? 'شعار المجتمع (Logo / Avatar)' : 'Community Logo'}
                      description={lang === 'ar' ? 'صورة مربعة تمثل الشعار الرسمي للنادي' : 'Square icon representing the community'}
                      value={editLogoUrl}
                      onChange={setEditLogoUrl}
                      folder="logos"
                      aspectRatio="square"
                      userId={currentUserId}
                      presetOptions={PRESET_LOGOS}
                      lang={lang}
                    />

                    <ImageUploadDropzone
                      label={lang === 'ar' ? 'صورة الغلاف (Cover Banner)' : 'Cover Banner Photo'}
                      description={lang === 'ar' ? 'صورة عريضة تظهر في ترويسة صفحة المجتمع' : 'Wide banner photo for header'}
                      value={editCoverUrl}
                      onChange={setEditCoverUrl}
                      folder="covers"
                      aspectRatio="banner"
                      userId={currentUserId}
                      presetOptions={PRESET_COVERS}
                      lang={lang}
                    />
                  </div>
                </div>

                {/* ── Location & Safe Meetup Hub Section ── */}
                <div className="rounded-2xl border-2 border-border/80 bg-muted/20 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs sm:text-sm font-black text-foreground uppercase tracking-wider block">
                          {lang === 'ar' ? 'الموقع الجغرافي ونقطة اللقاء الآمنة' : 'Geographic Location & Safe Meetup Hub'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {lang === 'ar'
                            ? 'اختر المدينة والحي وحدد موقع المقابلة بدقة على الخريطة التفاعلية'
                            : 'Select city & district, then pinpoint exact location on the interactive map'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowEditMapPicker(prev => !prev)}
                      className="px-3.5 py-2 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-xs font-black text-primary flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto transition-all active:scale-95"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>{showEditMapPicker ? (lang === 'ar' ? 'إخفاء الخريطة' : 'Hide Map') : (lang === 'ar' ? '📍 فتح وتحديد الموقع على الخريطة' : '📍 Pick on Map')}</span>
                    </button>
                  </div>

                  {/* City & Area Selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-foreground block">
                        {lang === 'ar' ? '1. اختر المدينة أولاً (City)' : '1. Choose City First'}
                      </label>
                      <select
                        value={selectedCityId}
                        onChange={e => handleCityChange(e.target.value)}
                        className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-bold cursor-pointer"
                      >
                        <option value="">{lang === 'ar' ? 'اختر المدينة...' : 'Select City...'}</option>
                        {DEFAULT_EGYPT_CITIES.map(c => (
                          <option key={c.id} value={c.id}>
                            {lang === 'ar' ? c.name_ar : c.name_en}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-foreground block">
                        {lang === 'ar' ? '2. تحديد الحي أو المنطقة (District)' : '2. District / Neighborhood'}
                      </label>
                      <select
                        value={selectedAreaId}
                        onChange={e => handleAreaChange(e.target.value)}
                        disabled={!selectedCityId}
                        className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 font-bold cursor-pointer"
                      >
                        <option value="">
                          {!selectedCityId
                            ? (lang === 'ar' ? 'يرجى اختيار المدينة أولاً...' : 'Select city first...')
                            : (lang === 'ar' ? 'اختر الحي أو المنطقة...' : 'Select District...')}
                        </option>
                        {((activeCityObj?.areas || []) as any[]).map((a: any) => (
                          <option key={a.id} value={a.id}>
                            {lang === 'ar' ? a.name_ar : a.name_en}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dedicated Separate Districts Panel with Clickable Chips */}
                  {selectedCityId && activeCityObj && (
                    <div className="space-y-2.5 rounded-2xl border-2 border-primary/20 bg-card p-3 sm:p-4 shadow-xs animate-in fade-in duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span>
                            {lang === 'ar'
                              ? `أحياء ومناطق ${activeCityObj.name_ar} (اختر حياً لتحديده وتكبير الخريطة مباشرة):`
                              : `Districts in ${activeCityObj.name_en} (click any district to select & zoom map):`}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground self-start sm:self-auto">
                          {activeCityObj.areas.length} {lang === 'ar' ? 'حي منفصل' : 'districts'}
                        </span>
                      </div>

                      {/* District Search Filter if many districts */}
                      {activeCityObj.areas.length > 8 && (
                        <div className="relative">
                          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-3.5 w-3.5 text-muted-foreground" />
                          <input
                            type="text"
                            value={editDistrictSearch}
                            onChange={e => setEditDistrictSearch(e.target.value)}
                            placeholder={lang === 'ar' ? `بحث سريع في أحياء ${activeCityObj.name_ar}...` : `Filter districts in ${activeCityObj.name_en}...`}
                            className="w-full rounded-xl border border-border bg-background ps-9 pe-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          {editDistrictSearch && (
                            <button
                              type="button"
                              onClick={() => setEditDistrictSearch('')}
                              className="absolute top-1/2 -translate-y-1/2 end-2.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}

                      {/* Clickable Separate District Chips */}
                      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1 py-1">
                        {(activeCityAreas as any[]).map((a: any) => {
                          const isSelected = selectedAreaId === a.id
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => handleAreaChange(a.id)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5",
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/30 font-black scale-102"
                                  : "bg-muted/40 hover:bg-muted text-foreground border-border/70 hover:border-primary/50"
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                              <span>{lang === 'ar' ? a.name_ar : a.name_en}</span>
                            </button>
                          )
                        })}
                        {activeCityAreas.length === 0 && (
                          <span className="text-xs text-muted-foreground py-2">
                            {lang === 'ar' ? 'لا توجد نتائج مطابقة للبحث' : 'No matching districts found'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Interactive Map Picker Block */}
                  {showEditMapPicker && (
                    <div className="space-y-3 p-3 sm:p-4 rounded-2xl bg-card border-2 border-primary/20 shadow-sm animate-in fade-in duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-primary font-black">
                          <MapPin className="h-4 w-4" />
                          <span>{lang === 'ar' ? 'انقر على أي نقطة في الخريطة لوضع علامة مكان اللقاء، أو ابحث عن المكان' : 'Click on map to drop pin, or search by landmark/cafe'}</span>
                        </div>
                        {editHubLat && editHubLng && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                              ✓ {editHubLat.toFixed(5)}, {editHubLng.toFixed(5)}
                            </span>
                            <a
                              href={`https://maps.google.com/?q=${editHubLat},${editHubLng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              <span>{lang === 'ar' ? 'معاينة في Google Maps' : 'Preview'}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      <MapLocationPicker
                        latitude={editHubLat}
                        longitude={editHubLng}
                        onLocationSelect={handleEditLocationFromMap}
                        hubLatitude={editHubLat}
                        hubLongitude={editHubLng}
                        onHubLocationSelect={handleEditLocationFromMap}
                        activeMode={activeEditMapMode}
                        onModeChange={setActiveEditMapMode}
                        centerHint={editMapCenterHint}
                        height="350px"
                        lang={lang}
                        showHubOption={true}
                      />
                    </div>
                  )}

                  {/* General Location Text */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-foreground block">
                      {lang === 'ar' ? 'وصف الموقع الظاهر للجميع (الحي والمدينة)' : 'Public Location Text'}
                    </label>
                    <input
                      type="text"
                      value={editLocationText}
                      onChange={e => setEditLocationText(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: المعادي، القاهرة أو التجمع الخامس' : 'e.g., Maadi, Cairo'}
                      className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {lang === 'ar'
                        ? 'هذا النص يظهر في بطاقة المجتمع وشارات البحث وموقع التبادل الأساسي.'
                        : 'This location text appears on community badges, search results, and cards.'}
                    </p>
                  </div>

                  {/* Hub Name and Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-foreground block">
                        {lang === 'ar' ? 'اسم نقطة اللقاء الآمنة (المقهى / المكتبة)' : 'Safe Hub Name'}
                      </label>
                      <input
                        type="text"
                        value={hubName}
                        onChange={e => setHubName(e.target.value)}
                        placeholder={lang === 'ar' ? 'مثال: Cilantro Cafe أو Diwan Bookstore' : 'e.g., Cilantro Cafe'}
                        className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-foreground block">
                        {lang === 'ar' ? 'عنوان نقطة اللقاء بالتفصيل' : 'Safe Hub Address'}
                      </label>
                      <input
                        type="text"
                        value={hubAddress}
                        onChange={e => setHubAddress(e.target.value)}
                        placeholder={lang === 'ar' ? 'مثال: شارع 9، المعادي، بجوار محطة المترو' : 'e.g., Street 9, Maadi'}
                        className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                      />
                    </div>
                  </div>

                  {/* Google Maps Link / GPS Coordinates */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-foreground block">
                        {lang === 'ar' ? 'رابط خرائط Google أو إحداثيات GPS' : 'Google Maps Link or Coordinates'}
                      </label>
                      {!showEditMapPicker && (
                        <button
                          type="button"
                          onClick={() => setShowEditMapPicker(true)}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <MapPin className="h-3 w-3" />
                          <span>{lang === 'ar' ? 'تعديل على الخريطة' : 'Edit on Map'}</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editMapsUrl}
                      onChange={e => handleMapsUrlChange(e.target.value)}
                      placeholder={lang === 'ar' ? 'الصق رابط خرائط جوجل أو الإحداثيات: 29.9602, 31.2569' : 'Paste Google Maps URL or 29.9602, 31.2569'}
                      className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                    />
                    {editHubLat && editHubLng && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? `تم تحديد الإحداثيات بنجاح (${editHubLat.toFixed(5)}, ${editHubLng.toFixed(5)})` : `Coordinates resolved (${editHubLat.toFixed(5)}, ${editHubLng.toFixed(5)})`}</span>
                      </p>
                    )}
                  </div>

                  {/* Meeting Instructions */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-foreground block">
                      {lang === 'ar' ? 'تعليمات وإرشادات المقابلة في المكان' : 'Meeting Instructions'}
                    </label>
                    <input
                      type="text"
                      value={hubInstructions}
                      onChange={e => setHubInstructions(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: المقابلة في الصالة الداخلية بالقرب من ركن الكتب' : 'e.g., Indoor seating near books corner'}
                      className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-semibold"
                    />
                  </div>
                </div>

                {/* Safe Hub Photo Dropzone */}
                <ImageUploadDropzone
                  label={lang === 'ar' ? 'صورة نقطة اللقاء أو واجهة المكان (Safe Hub Photo)' : 'Safe Hub Photo'}
                  description={lang === 'ar' ? 'صورة تساعد الأعضاء في التعرف على نقطة التسليم' : 'Helps members recognize the meetup spot'}
                  value={editHubPhotoUrl}
                  onChange={setEditHubPhotoUrl}
                  folder="hubs"
                  aspectRatio="photo"
                  userId={currentUserId}
                  lang={lang}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-foreground block">
                    {lang === 'ar' ? 'وصف المجتمع' : 'Community Description'}
                  </label>
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background px-3.5 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-foreground block">
                    {lang === 'ar' ? 'قواعد وضوابط المجتمع' : 'Community Rules'}
                  </label>
                  <textarea
                    rows={2}
                    value={editRulesAr}
                    onChange={e => setEditRulesAr(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: الحفاظ على سلامة الكتب، الالتزام بمواعيد الإرجاع...' : 'Rules for members...'}
                    className="w-full rounded-2xl border border-border bg-background px-3.5 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="approvalReq"
                    checked={editRequiresApproval}
                    onChange={e => setEditRequiresApproval(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="approvalReq" className="text-xs font-bold text-foreground cursor-pointer">
                    {lang === 'ar' ? 'الموافقة المسبقة مطلوبة قبل انضمام الأعضاء الجدد (مجتمع خاص)' : 'Require admin approval for new members (Private community)'}
                  </label>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    loading={isSavingDetails}
                    className="rounded-xl font-black text-xs gap-1.5 shadow-md shadow-primary/20 cursor-pointer px-6 py-5"
                  >
                    <Check className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'حفظ تعديلات المجتمع' : 'Save Changes'}</span>
                  </Button>
                </div>
              </form>
            </div>

            {/* Section 3: Danger Zone — Delete Community */}
            <div className="rounded-3xl border-2 border-red-500/40 bg-red-500/5 p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-red-500/20 pb-4">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="text-base sm:text-lg font-black text-red-600">
                  {lang === 'ar' ? 'منطقة الخطر — حذف المجتمع نهائياً' : 'Danger Zone — Delete Community'}
                </h3>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'ar'
                  ? 'تحذير: سيؤدي حذف هذا المجتمع إلى إزالة كافة رفوف الكتب المشتركة والمنشورات وقائمة الأعضاء نهائياً. لا يمكن التراجع عن هذا الإجراء.'
                  : 'Warning: Deleting this community will permanently remove its bookshelf listings, discussions, and member list. This cannot be undone.'}
              </p>

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="rounded-xl font-black text-xs bg-red-600 hover:bg-red-700 text-white gap-1.5 shadow-md shadow-red-600/20 cursor-pointer px-5 py-4.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'حذف المجتمع بشكل دائم' : 'Delete Community Permanently'}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Book to Community Modal */}
      {showAddBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-card border-2 border-border shadow-2xl overflow-hidden text-foreground">
            <div className="p-4 sm:p-5 border-b border-border bg-muted/30 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>{lang === 'ar' ? 'إضافة كتاب إلى رف المجتمع' : 'Add Book to Community Shelf'}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'ar' ? 'اختر من كتبك المعروضة حالياً أو أضف كتاباً جديداً' : 'Select from your active listings or list a new one'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddBookModal(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {addBookSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{addBookSuccess}</span>
                </div>
              )}

              {/* Guidance to list a new book on profile first */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-foreground">
                    {lang === 'ar' ? 'كتابك غير معروض بعد في حسابك؟' : 'Book not listed in your profile yet?'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {lang === 'ar'
                      ? 'أضف تفاصيل كتابك إلى حسابك أولاً بالصور والسعر/التبادل، ثم حدده للإيداع بمخزن المجتمع.'
                      : 'Add your book with photos and details to your profile first, then request to deposit it here.'}
                  </p>
                </div>
                <Link
                  href={`/books/add?communityId=${community.id}&communitySlug=${community.slug}`}
                  onClick={() => setShowAddBookModal(false)}
                  className="shrink-0"
                >
                  <Button size="sm" className="w-full sm:w-auto rounded-xl font-black text-xs gap-1.5 shadow-xs cursor-pointer">
                    <Plus className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? '+ إضافة إعلان جديد' : '+ List New Book'}</span>
                  </Button>
                </Link>
              </div>

              {/* User's existing active listings with multi-select */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                  <div>
                    <h4 className="text-xs font-black text-foreground">
                      {lang === 'ar' ? 'اختر الكتب المراد إيداعها بمخزن المجتمع:' : 'Select books to store in community hub:'}
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      {lang === 'ar'
                        ? 'حدد كتاباً أو أكثر لإصدار رمز QR موحد لتسليمها لمسؤول المجتمع'
                        : 'Select one or more books to generate an intake QR code for the hub admin'}
                    </p>
                  </div>
                  {userBooks.some(b => !communityListingIds.has(b.id)) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleSelectAllListings}
                      className="h-8 text-xs font-bold text-primary hover:bg-primary/10 rounded-xl px-2.5 cursor-pointer shrink-0"
                    >
                      {selectedListingIds.length === userBooks.filter(b => !communityListingIds.has(b.id)).length && selectedListingIds.length > 0
                        ? (lang === 'ar' ? 'إلغاء التحديد' : 'Deselect All')
                        : (lang === 'ar' ? 'تحديد الكل' : 'Select All')}
                    </Button>
                  )}
                </div>

                {loadingUserBooks ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">{lang === 'ar' ? 'جاري تحميل كتبك...' : 'Loading your books...'}</p>
                ) : userBooks.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-2xl text-xs text-muted-foreground space-y-2">
                    <p>{lang === 'ar' ? 'ليس لديك كتب معروضة حالياً في حسابك.' : 'No active listings in your profile.'}</p>
                    <Link href="/books/add" onClick={() => setShowAddBookModal(false)}>
                      <Button size="sm" variant="outline" className="text-xs font-bold rounded-xl">
                        {lang === 'ar' ? '+ إدراج أول كتاب لك الآن' : '+ List your first book'}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[46vh] overflow-y-auto pe-1">
                    {userBooks.map(item => {
                      const isAlreadyInCommunity = communityListingIds.has(item.id)
                      const isSelected = selectedListingIds.includes(item.id)
                      const bookTitle = item.book?.title_ar || item.book?.title || 'كتاب'
                      const cover = item.images?.[0]?.url || item.book?.cover_image_url

                      return (
                        <div
                          key={item.id}
                          onClick={() => !isAlreadyInCommunity && handleToggleSelectListing(item.id)}
                          className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                            isAlreadyInCommunity
                              ? 'bg-muted/20 border-border/40 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-primary/10 border-primary shadow-xs cursor-pointer'
                              : 'bg-muted/30 border-border/70 hover:bg-muted/50 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Checkbox or Already-In Indicator */}
                            <div
                              className={`h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                isAlreadyInCommunity
                                  ? 'bg-muted/50 border-muted text-muted-foreground'
                                  : isSelected
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-muted-foreground/40 bg-background'
                              }`}
                            >
                              {isAlreadyInCommunity ? (
                                <Check className="h-3 w-3 text-muted-foreground" />
                              ) : isSelected ? (
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              ) : null}
                            </div>

                            {/* Book Cover */}
                            <div className="relative h-12 w-9 rounded-lg overflow-hidden bg-muted border border-border/60 shrink-0">
                              {cover ? (
                                <Image src={cover} alt="" fill className="object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-xs">📖</div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="min-w-0 flex-1 text-start">
                              <p className="text-xs font-black text-foreground truncate">{bookTitle}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{item.book?.author}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {isAlreadyInCommunity ? (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-bold bg-muted/60 text-muted-foreground border-muted-foreground/30">
                                    {lang === 'ar' ? 'مضاف للمجتمع بالفعل ✅' : 'Already in Community ✅'}
                                  </Badge>
                                ) : (
                                  <>
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-bold">
                                      {(item.listing_type as string) === 'SELL' ? (lang === 'ar' ? 'للبيع' : 'Sell') :
                                       (item.listing_type as string) === 'SWAP' ? (lang === 'ar' ? 'للتبادل' : 'Swap') :
                                       (item.listing_type as string) === 'BORROW' ? (lang === 'ar' ? 'للإعارة' : 'Borrow') :
                                       (item.listing_type || 'متاح')}
                                    </Badge>
                                    {item.price ? (
                                      <span className="text-[10px] font-bold text-emerald-600">
                                        {item.price} {lang === 'ar' ? 'ج.م' : 'EGP'}
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick single-submit button or Disabled text */}
                          {isAlreadyInCommunity ? (
                            <span className="text-[10px] text-muted-foreground font-semibold px-2 py-1 rounded-lg bg-muted/40 shrink-0">
                              {lang === 'ar' ? 'مدرج بالرف' : 'Deposited'}
                            </span>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={addingListingId === item.id || submittingBatchIntake}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddBookToShelf(item.id, bookTitle)
                              }}
                              className="rounded-xl font-bold text-[11px] shrink-0 text-primary hover:bg-primary/10 h-8 px-2.5 cursor-pointer"
                              title={lang === 'ar' ? 'إصدار رمز QR لهذا الكتاب منفرداً' : 'Generate QR for this book'}
                            >
                              <QrCode className="h-3.5 w-3.5 me-1" />
                              <span>{lang === 'ar' ? 'إيداع فردي' : 'Single'}</span>
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 border-t border-border bg-muted/20 shrink-0 flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-muted-foreground">{lang === 'ar' ? 'المحدد للإيداع:' : 'Selected:'} </span>
                <span className="font-black text-primary text-sm">{selectedListingIds.length}</span>
                <span className="text-[11px] text-muted-foreground ms-1">{lang === 'ar' ? 'كتب' : 'books'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddBookModal(false)
                    setSelectedListingIds([])
                  }}
                  className="rounded-xl font-bold text-xs py-5"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  disabled={selectedListingIds.length === 0 || submittingBatchIntake}
                  loading={submittingBatchIntake}
                  onClick={handleBatchSubmitForIntake}
                  className="rounded-xl font-black text-xs py-5 px-5 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white shadow-md shadow-emerald-600/25 cursor-pointer"
                >
                  <QrCode className="h-4 w-4" />
                  <span>
                    {lang === 'ar'
                      ? `إصدار رمز QR للإيداع (${selectedListingIds.length}) 📦`
                      : `Generate Intake QR (${selectedListingIds.length}) 📦`}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Community Book Direct Request Modal (With Fixed Safe Hub Pickup) */}
      {selectedBookForRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-card border-2 border-border shadow-2xl overflow-hidden text-foreground">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-border bg-muted/30 shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-primary" />
                  <span>
                    {lang === 'ar' ? 'طلب كتاب واستلامه من نقطة المجتمع' : 'Request Book (Community Pickup)'}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lang === 'ar'
                    ? `التسليم والاستلام سيتم بأمان في فرع: ${community.hub_name || 'نقطة المجتمع'}`
                    : `Handover at designated hub: ${community.hub_name || 'Community Hub'}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookForRequest(null)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Selected Book Summary */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center gap-3.5">
                <div className="relative h-20 w-14 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                  {selectedBookForRequest.cover_image_url ? (
                    <Image src={selectedBookForRequest.cover_image_url} alt="" fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs">📖</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black text-foreground truncate">{selectedBookForRequest.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{selectedBookForRequest.author}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {lang === 'ar' ? 'صاحب الكتاب:' : 'Owner:'} <span className="font-bold text-foreground">{selectedBookForRequest.owner_name}</span>
                    {selectedBookForRequest.price && ` • السعر: ${formatPrice(selectedBookForRequest.price)}`}
                  </p>
                </div>
              </div>

              {/* Designated Safe Hub Box (Fixed Delivery Location) */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="flex items-center gap-2 text-xs font-black">
                  <Coffee className="h-4 w-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'مكان الاستلام والتسليم المعتمد لهذا الطلب:' : 'Designated Handover Location:'}</span>
                </div>
                <p className="text-xs font-bold ps-6">{community.hub_name || 'فرع المجتمع الرسمي'}</p>
                {community.hub_address && (
                  <p className="text-[11px] text-muted-foreground ps-6">{community.hub_address}</p>
                )}
              </div>

              {/* Mode Selector Tabs (Buy, Borrow, Swap) */}
              <div className="flex rounded-2xl bg-muted/60 p-1 gap-1">
                {(selectedBookForRequest.listing_type === 'SELL' || selectedBookForRequest.type === 'SELL' || selectedBookForRequest.listing_type === 'SELL_OR_SWAP') && (
                  <button
                    type="button"
                    onClick={() => setReqModalType('BUY')}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer',
                      reqModalType === 'BUY' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    💰 {lang === 'ar' ? 'شراء نقدي' : 'Buy'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setReqModalType('BORROW')}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer',
                    reqModalType === 'BORROW' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  ⏳ {lang === 'ar' ? 'استعارة مؤقتة' : 'Borrow'}
                </button>

                {(selectedBookForRequest.listing_type === 'SWAP' || selectedBookForRequest.type === 'SWAP' || selectedBookForRequest.listing_type === 'SELL_OR_SWAP') && (
                  <button
                    type="button"
                    onClick={() => setReqModalType('SWAP')}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer',
                      reqModalType === 'SWAP' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    🔄 {lang === 'ar' ? 'مبادلة' : 'Swap'}
                  </button>
                )}
              </div>

              {/* BUY TAB CONTENT */}
              {reqModalType === 'BUY' && (
                <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{lang === 'ar' ? 'المبلغ المطلوب:' : 'Price:'}</span>
                    <span className="font-black text-foreground text-sm">{formatPrice(selectedBookForRequest.price ?? 0)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                    <p className="font-bold">
                      {lang === 'ar' ? '💵 الدفع نقداً بالفرع (بدون أي عمولة 0%):' : '💵 Cash at Hub (0% Commission):'}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      {lang === 'ar'
                        ? 'تدفع المبلغ نقداً لمسؤول نقطة المجتمع عند استلام الكتاب، ويتسلم صاحب الكتاب كامل المبلغ نقداً من المسؤول عند زيارته للفرع.'
                        : 'Pay in cash to the community hub admin upon pickup. The admin collects the cash and hands 100% of it to the book owner.'}
                    </p>
                  </div>
                </div>
              )}

              {/* BORROW TAB CONTENT */}
              {reqModalType === 'BORROW' && (
                <div className="space-y-3 p-3.5 rounded-2xl bg-card border border-border/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{lang === 'ar' ? 'مدة الاستعارة:' : 'Loan Duration:'}</span>
                    <span className="font-black text-emerald-600">{reqLoanDays} {lang === 'ar' ? 'يوماً' : 'days'}</span>
                  </div>
                  <input
                    type="range"
                    min="7"
                    max="30"
                    step="7"
                    value={reqLoanDays}
                    onChange={e => setReqLoanDays(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                    <span>{lang === 'ar' ? 'التأمين المسترد فور الإرجاع:' : 'Refundable Deposit:'}</span>
                    <span className="font-bold text-emerald-600">{selectedBookForRequest.deposit || 50} ج.م</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/60 border border-border/70 text-[11px] text-muted-foreground">
                    {lang === 'ar'
                      ? 'تدفع رسوم الاستعارة والتأمين نقداً لمسؤول الفرع. يُرد مبلغ التأمين بالكامل نقداً فور إرجاع الكتاب بحالة سليمة.'
                      : 'Borrow fee and deposit are paid in cash to the hub admin. The deposit is refunded in cash upon returning the book.'}
                  </div>
                  <label className="flex items-start gap-2 text-[11px] text-muted-foreground cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={reqAgreedPolicy}
                      onChange={e => setReqAgreedPolicy(e.target.checked)}
                      className="mt-0.5 rounded accent-primary"
                    />
                    <span>
                      {lang === 'ar'
                        ? 'أتعهد بالمحافظة على الكتاب وإرجاعه بنفس الحالة إلى نقطة المجتمع في الموعد المحدد.'
                        : 'I agree to return the book in the same condition at the community hub.'}
                    </span>
                  </label>
                </div>
              )}

              {/* SWAP TAB CONTENT */}
              {reqModalType === 'SWAP' && (
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-card border border-border/80">
                  <label className="text-xs font-black text-foreground block">
                    {lang === 'ar' ? 'اختر كتاباً من كتبك لتقديمه للمبادلة:' : 'Select a book from your library to offer:'}
                  </label>
                  {reqUserListings.length === 0 ? (
                    <div className="text-center py-3 border border-dashed rounded-xl text-[11px] text-muted-foreground">
                      {lang === 'ar' ? 'ليس لديك كتب معروضة حالياً للمبادلة بها.' : 'No active listings in your library.'}
                      <Link href="/books/add" className="block text-primary font-bold mt-1">
                        + {lang === 'ar' ? 'أضف كتاباً لمكتبتك الآن' : 'Add a book to your library'}
                      </Link>
                    </div>
                  ) : (
                    <select
                      value={reqSwapListingId}
                      onChange={e => setReqSwapListingId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {reqUserListings.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.book?.title} ({b.book?.author || 'مؤلف'})
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {lang === 'ar'
                      ? 'عند زيارة الفرع، تسلّم كتابك البديل لمسؤول المجتمع وتستلم هذا الكتاب مباشرة. يُحفظ كتابك الجديد في عهدة الفرع لصالح مالك الكتاب الأصلي.'
                      : 'Hand over your offered book to the hub admin and receive the requested book directly. Your book will be safely stored for the owner.'}
                  </p>
                </div>
              )}

              {/* Note Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground block">
                  {lang === 'ar' ? 'ملاحظة لصاحب الكتاب (اختياري):' : 'Note for owner (optional):'}
                </label>
                <textarea
                  rows={2}
                  placeholder={lang === 'ar' ? 'مثال: يناسبني اللقاء يوم الجمعة بعد الظهر في الفرع...' : 'e.g. Friday afternoon works best for me at the hub...'}
                  value={reqNote}
                  onChange={e => setReqNote(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Error Banner */}
              {reqError && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs font-bold animate-in fade-in">
                  ⚠️ {reqError}
                </div>
              )}

              {/* Success Banner */}
              {reqSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{reqSuccess}</span>
                  </div>
                  <Link href="/transactions?tab=outgoing" className="block">
                    <Button size="sm" className="w-full rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
                      {lang === 'ar' ? 'الانتقال لمتابعة الطلب في المعاملات ⏳' : 'Track in My Deals & Loans ⏳'}
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            {!reqSuccess && (
              <div className="p-4 border-t border-border bg-muted/20 shrink-0 flex items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => setSelectedBookForRequest(null)}
                  className="rounded-xl font-bold text-xs py-5 cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleSubmitCommunityRequest}
                  loading={reqLoading}
                  disabled={reqModalType === 'BORROW' && !reqAgreedPolicy}
                  className="rounded-xl font-black text-xs py-5 px-6 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 text-white shadow-md shadow-primary/25 cursor-pointer"
                >
                  {lang === 'ar' ? 'تأكيد وإرسال الطلب 🚀' : 'Confirm & Send Request 🚀'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Community Confirmation Modal */}
      {/* ── Community Quick Branding (Logo & Cover) Modal ── */}
      {showBrandingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-card border-2 border-border shadow-2xl flex flex-col text-foreground animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border bg-muted/30 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-foreground">
                    {lang === 'ar' ? 'تعديل هوية المجتمع (الشعار وصورة الغلاف)' : 'Edit Community Visual Identity'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">{commName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBrandingModal(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Live Preview Card */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider block">
                  {lang === 'ar' ? 'معاينة مباشرة للترويسة' : 'Live Header Preview'}
                </span>
                <div className="relative rounded-2xl border-2 border-border/80 overflow-hidden bg-muted shadow-sm">
                  <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-muted">
                    {editCoverUrl ? (
                      <Image
                        src={editCoverUrl}
                        alt="Preview Cover"
                        fill
                        className="object-cover"
                        unoptimized={editCoverUrl.startsWith('data:')}
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-r from-emerald-600/30 to-primary/30 flex items-center justify-center text-xs text-muted-foreground">
                        {lang === 'ar' ? 'لم يتم تحديد غلاف' : 'No cover set'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                  </div>

                  {/* Logo overlay on preview */}
                  <div className="absolute bottom-3 start-4 flex items-end gap-3 z-10">
                    <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden border-3 border-card bg-card shadow-md shrink-0">
                      {editLogoUrl ? (
                        <Image
                          src={editLogoUrl}
                          alt="Preview Logo"
                          fill
                          className="object-cover"
                          unoptimized={editLogoUrl.startsWith('data:')}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center font-black text-primary bg-primary/10 text-lg">
                          {currentComm.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="text-white drop-shadow-md pb-1">
                      <div className="text-xs sm:text-sm font-black">{commName}</div>
                      <div className="text-[10px] text-white/80">{currentComm.hub_name || 'مجتمع قراءة'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Dropzones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageUploadDropzone
                  label={lang === 'ar' ? 'شعار المجتمع (Logo / Avatar)' : 'Community Logo'}
                  description={lang === 'ar' ? 'صورة مربعة للشعار أو أيقونة النادي' : 'Square icon or avatar'}
                  value={editLogoUrl}
                  onChange={setEditLogoUrl}
                  folder="logos"
                  aspectRatio="square"
                  userId={currentUserId}
                  presetOptions={PRESET_LOGOS}
                  lang={lang}
                />

                <ImageUploadDropzone
                  label={lang === 'ar' ? 'صورة الغلاف (Cover Banner)' : 'Cover Banner Photo'}
                  description={lang === 'ar' ? 'صورة عريضة تظهر في خلفية الترويسة' : 'Wide header cover photo'}
                  value={editCoverUrl}
                  onChange={setEditCoverUrl}
                  folder="covers"
                  aspectRatio="banner"
                  userId={currentUserId}
                  presetOptions={PRESET_COVERS}
                  lang={lang}
                />
              </div>

              {brandingSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{lang === 'ar' ? 'تم تحديث هوية المجتمع بنجاح!' : 'Community branding updated successfully!'}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-border bg-muted/20 flex items-center justify-end gap-2 sticky bottom-0 z-10 backdrop-blur-md">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBrandingModal(false)}
                className="rounded-xl font-bold text-xs py-4.5 cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                loading={isSavingBranding}
                onClick={handleSaveBrandingQuick}
                className="rounded-xl font-black text-xs bg-primary hover:bg-primary/90 text-primary-foreground py-4.5 px-5 cursor-pointer shadow-md"
              >
                <Check className="h-3.5 w-3.5 me-1" />
                <span>{lang === 'ar' ? 'حفظ هوية المجتمع' : 'Save Changes'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-card border-2 border-red-500/40 shadow-2xl p-6 text-foreground space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black">
                  {lang === 'ar' ? 'تأكيد حذف المجتمع نهائياً' : 'Confirm Community Deletion'}
                </h3>
                <p className="text-xs text-muted-foreground">{commName}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === 'ar'
                ? 'هل أنت متأكد تماماً من رغبتك في حذف هذا المجتمع؟ سيتم حذف جميع المنشورات وقوائم الكتب والأعضاء فوراً ولا يمكن استرجاعها.'
                : 'Are you sure you want to delete this community? All posts, shelf books, and memberships will be deleted permanently.'}
            </p>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-muted-foreground block">
                {lang === 'ar'
                  ? 'لتأكيد الحذف، اكتب كلمة "حذف" في المربع أدناه:'
                  : 'To confirm, type "DELETE" below:'}
              </label>
              <input
                type="text"
                placeholder={lang === 'ar' ? 'اكتب حذف' : 'Type DELETE'}
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-red-500 text-center font-bold"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                }}
                className="rounded-xl font-bold text-xs py-4.5 cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                disabled={
                  isDeleting ||
                  (lang === 'ar'
                    ? deleteConfirmText.trim() !== 'حذف'
                    : deleteConfirmText.trim().toUpperCase() !== 'DELETE')
                }
                loading={isDeleting}
                onClick={handleDeleteCommunity}
                className="rounded-xl font-black text-xs bg-red-600 hover:bg-red-700 text-white py-4.5 cursor-pointer shadow-md shadow-red-600/20"
              >
                <Trash2 className="h-3.5 w-3.5 me-1" />
                <span>{lang === 'ar' ? 'نعم، احذف المجتمع' : 'Yes, Delete Community'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* Remove Book from Shelf Confirmation Modal */}
      {bookToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-card border-2 border-border shadow-2xl overflow-hidden p-6 space-y-5 text-foreground text-center animate-in zoom-in-95">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center text-red-600">
              <Trash2 className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-foreground">
                {lang === 'ar' ? 'إزالة الكتاب من رف المجتمع' : 'Remove Book from Shelf'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'ar'
                  ? `هل أنت متأكد من رغبتك في إزالة كتاب "${bookToRemove.title}" من رف المجتمع؟ لن يظهر لباقي الأعضاء بعد الآن.`
                  : `Are you sure you want to remove "${bookToRemove.title}" from the community shelf? It will no longer be visible to members.`}
              </p>
            </div>

            {/* Book Preview */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-muted/40 border border-border/70 text-start">
              <div className="relative h-14 w-10 rounded-xl overflow-hidden bg-muted border border-border/60 shrink-0">
                {bookToRemove.cover_image_url ? (
                  <Image src={bookToRemove.cover_image_url} alt="" fill className="object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs">📖</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-foreground truncate">{bookToRemove.title}</h4>
                <p className="text-[11px] text-muted-foreground truncate">{bookToRemove.author}</p>
                {bookToRemove.owner_name && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {lang === 'ar' ? 'المالك:' : 'Owner:'} {bookToRemove.owner_name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                disabled={Boolean(removingBookId)}
                onClick={() => setBookToRemove(null)}
                className="flex-1 rounded-2xl font-bold text-xs py-5 cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                disabled={Boolean(removingBookId)}
                loading={Boolean(removingBookId)}
                onClick={handleConfirmRemoveBook}
                className="flex-1 rounded-2xl font-black text-xs py-5 bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-md shadow-red-600/20"
              >
                <Trash2 className="h-4 w-4 me-1.5" />
                <span>{lang === 'ar' ? 'تأكيد الإزالة' : 'Confirm Remove'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Community Book Intake QR & Scanner Modal */}
      <CommunityIntakeQrModal
        isOpen={intakeQrModal.isOpen}
        onClose={() => setIntakeQrModal(prev => ({ ...prev, isOpen: false }))}
        mode={intakeQrModal.mode}
        communityId={community.id}
        communityName={commName}
        communityHubName={currentComm.hub_name || community.hub_name}
        currentUserId={currentUserId || undefined}
        book={intakeQrModal.book}
        intakePin={intakeQrModal.intakePin}
        pendingBooks={pendingBooks}
        onVerifiedSuccess={(approvedBook, allApprovedBooks) => {
          const listToApprove =
            allApprovedBooks && allApprovedBooks.length > 0 ? allApprovedBooks : [approvedBook]
          const approvedIds = new Set(listToApprove.map(b => b.id))
          const approvedListingIds = new Set(listToApprove.map(b => b.listing_id))

          setPendingBooks(prev =>
            prev.filter(b => !approvedIds.has(b.id) && !approvedListingIds.has(b.listing_id))
          )
          setShelfBooks(prev => [
            ...listToApprove,
            ...prev.filter(b => !approvedListingIds.has(b.listing_id)),
          ])
          setApprovalToast(
            listToApprove.length > 1
              ? lang === 'ar'
                ? `تم اعتماد واستلام ${listToApprove.length} كتب بنجاح وإدراجها في رف ومخزن المجتمع! 📚✅`
                : `Successfully approved and added ${listToApprove.length} books to the community shelf! 📚✅`
              : lang === 'ar'
              ? `تم اعتماد واستلام كتاب "${approvedBook.title}" بنجاح وإدراجه في رف المجتمع! 📚✅`
              : `Book "${approvedBook.title}" approved and added to shelf! 📚✅`
          )
          setTimeout(() => setApprovalToast(null), 4500)
        }}
      />
    </MainLayout>
  )
}
