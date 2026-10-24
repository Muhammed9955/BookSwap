'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MainLayout } from '@/components/layout/main-layout'
import { useLanguage } from '@/i18n/language-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Store,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Globe,
  Sparkles,
  CheckCircle2,
  Send,
  Building,
  Upload,
  UploadCloud,
  Loader2,
  Check,
  X,
  ImageIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  Star,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Package,
  Layers,
  Truck,
  RefreshCw,
  FileCheck,
  FileText,
  AlertCircle,
  BookOpen,
  Smartphone,
  Download,
  Copy,
  Share2,
  Mail,
  User,
  Lock
} from 'lucide-react'
import { FastAuthModal } from '@/components/auth/fast-auth-modal'
import { GoogleIcon } from '@/components/ui/icons'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { compressImageFile } from '@/lib/image-utils'
import { uploadCommunityImage } from '@/lib/storage/upload-helper'
import { MapLocationPicker, type MapCoordinates } from '@/components/common/map-location-picker'
import { SquareImageUpload } from '@/components/stores/square-image-upload'

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}
import { submitStoreApplication } from '@/lib/stores/store-service'
import type { StoreType } from '@/types/store'
import {
  EGYPT_GOVERNORATES,
  getDistrictsForGovernorate,
  getTopDistricts,
} from '@/lib/constants/locations'

interface PartnerFormClientProps {
  user: { id: string; email?: string; profile?: Record<string, unknown> | null } | null
  isUnauthorized?: boolean
}

const DEFAULT_LOGOS = [
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=300&q=80',
]

const DEFAULT_COVERS = [
  'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1526721940322-10fb6e3ae94a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=1200&q=80',
]

export function PartnerFormClient({ user, isUnauthorized }: PartnerFormClientProps) {
  const { lang, isRTL } = useLanguage()

  // Authentication State with FastAuthModal Popup Support
  const [currentUser, setCurrentUser] = useState(user)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Fast Inline Login Gate State & Handlers (Force Fast Login First)
  const fastLoginRef = useRef<HTMLDivElement>(null)
  const [fastAuthMode, setFastAuthMode] = useState<'login' | 'register'>('login')
  const [fastAuthEmail, setFastAuthEmail] = useState('')
  const [fastAuthPassword, setFastAuthPassword] = useState('')
  const [fastAuthName, setFastAuthName] = useState('')
  const [showFastPassword, setShowFastPassword] = useState(false)
  const [fastAuthLoading, setFastAuthLoading] = useState(false)
  const [fastAuthGoogleLoading, setFastAuthGoogleLoading] = useState(false)
  const [fastAuthError, setFastAuthError] = useState<string | null>(null)

  const handleFastGoogleLogin = async () => {
    setFastAuthGoogleLoading(true)
    setFastAuthError(null)
    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/partner-form`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setFastAuthError(err?.message || 'فشل تسجيل الدخول عبر Google')
      setFastAuthGoogleLoading(false)
    }
  }

  const handleFastEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fastAuthEmail.trim() || !fastAuthPassword.trim()) {
      setFastAuthError(lang === 'ar' ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Email and password are required')
      return
    }
    if (fastAuthPassword.length < 6) {
      setFastAuthError(lang === 'ar' ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters')
      return
    }

    setFastAuthLoading(true)
    setFastAuthError(null)
    try {
      const supabase = createClient()
      const cleanEmail = fastAuthEmail.trim().toLowerCase()

      if (fastAuthMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: fastAuthPassword,
        })
        if (error) throw error
        if (data.user) {
          const u = {
            id: data.user.id,
            email: data.user.email,
            profile: data.user.user_metadata,
          }
          setCurrentUser(u)
          setEmail(data.user.email || '')
          if (data.user.user_metadata?.full_name && !ownerName) {
            setOwnerName(data.user.user_metadata.full_name)
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: fastAuthPassword,
          options: {
            data: {
              full_name: fastAuthName.trim() || 'Store Partner',
            },
          },
        })
        if (error) throw error
        if (data.user) {
          const u = {
            id: data.user.id,
            email: data.user.email,
            profile: { full_name: fastAuthName.trim() },
          }
          setCurrentUser(u)
          setEmail(data.user.email || '')
          if (fastAuthName.trim() && !ownerName) {
            setOwnerName(fastAuthName.trim())
          }
        }
      }
    } catch (err: any) {
      setFastAuthError(err?.message || 'فشل المصادقة، يرجى المحاولة مجدداً')
    } finally {
      setFastAuthLoading(false)
    }
  }

  // Seamless 1-Click Inline Account Password (No popup required if filled)
  const [accountPassword, setAccountPassword] = useState('')
  const [showQuickPassword, setShowQuickPassword] = useState(false)
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false)

  // Smart Device OS Detection ('android' | 'ios' | 'desktop')
  const [deviceOS, setDeviceOS] = useState<'android' | 'ios' | 'desktop'>('desktop')
  const [invitedStoreParam, setInvitedStoreParam] = useState<string | null>(null)

  // Form State - Focused 100% on Bookstore/Store Partners
  const [storeType, setStoreType] = useState<StoreType>('ONLINE')
  const [ownerName, setOwnerName] = useState('')
  const [storeNameAr, setStoreNameAr] = useState('')
  const [storeNameEn, setStoreNameEn] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || ''
      if (/android/i.test(ua)) {
        setDeviceOS('android')
      } else if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
        setDeviceOS('ios')
      } else {
        setDeviceOS('desktop')
      }

      // Check URL invitation query params (?store=...&name=...&phone=...)
      try {
        const params = new URLSearchParams(window.location.search)
        const invStore = params.get('store')
        const invName = params.get('name')
        const invPhone = params.get('phone')
        if (invStore) {
          setInvitedStoreParam(invStore)
          setStoreNameAr(prev => prev || invStore)
        }
        if (invName) {
          setOwnerName(prev => prev || invName)
        }
        if (invPhone) {
          setWhatsapp(prev => prev || invPhone)
          setPhone(prev => prev || invPhone)
        }
      } catch {}
    }
  }, [])
  const [slogan, setSlogan] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState(EGYPT_GOVERNORATES[0])
  const [district, setDistrict] = useState('')
  const [address, setAddress] = useState('')
  const [googleMapsUrl, setGoogleMapsUrl] = useState('')
  const [workingHours, setWorkingHours] = useState('يومياً: من 10:00 ص إلى 12:00 منتصف الليل')
  const [shippingScope, setShippingScope] = useState('شحن لجميع المحافظات (All Egypt)')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState<string>((user?.profile as any)?.email || user?.email || '')
  const [facebookPage, setFacebookPage] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [tiktokHandle, setTiktokHandle] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [monthlyVolume, setMonthlyVolume] = useState('500 - 1,500 كتاب')
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGOS[0])
  const [coverUrl, setCoverUrl] = useState(DEFAULT_COVERS[0])

  // Common Districts for current governorate (Cairo, Giza, Alex, etc.)
  const availableDistricts = useMemo(() => {
    return getDistrictsForGovernorate(city)
  }, [city])

  const topDistricts = useMemo(() => {
    return getTopDistricts(city, 8)
  }, [city])

  // Logo & Cover Upload + Compression State
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [isCompressingLogo, setIsCompressingLogo] = useState(false)
  const [logoStats, setLogoStats] = useState<{ origKb: number; compKb: number; savedPct: number } | null>(null)

  const coverInputRef = useRef<HTMLInputElement>(null)
  const [isCompressingCover, setIsCompressingCover] = useState(false)
  const [coverStats, setCoverStats] = useState<{ origKb: number; compKb: number; savedPct: number } | null>(null)

  // Working Hours Time Picker State (Default: 10:00 AM - 12:00 Midnight)
  const [openHour, setOpenHour] = useState('10:00')
  const [closeHour, setCloseHour] = useState('00:00')
  const [daysSchedule, setDaysSchedule] = useState<'DAILY' | 'SAT_THU' | 'SUN_THU' | '24_7' | 'CUSTOM'>('DAILY')
  const [customScheduleText, setCustomScheduleText] = useState('')
  const [isManualHoursEdit, setIsManualHoursEdit] = useState(false)

  // Format 24h to 12h with proper midnight & noon handling
  const formatHour12 = (timeStr: string, isAr: boolean) => {
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

  // Live formatted hours from picker
  const formattedWorkingHours = useMemo(() => {
    if (isManualHoursEdit && customScheduleText) {
      return customScheduleText
    }
    const open12 = formatHour12(openHour, lang === 'ar')
    const close12 = formatHour12(closeHour, lang === 'ar')

    if (daysSchedule === '24_7') {
      return lang === 'ar' ? 'على مدار الساعة 24/7 (أونلاين)' : '24/7 Round the Clock (Online)'
    }
    if (daysSchedule === 'SAT_THU') {
      return lang === 'ar'
        ? `السبت إلى الخميس: من ${open12} إلى ${close12} (الجمعة عطلة)`
        : `Sat to Thu: ${open12} to ${close12} (Fri Closed)`
    }
    if (daysSchedule === 'SUN_THU') {
      return lang === 'ar'
        ? `الأحد إلى الخميس: من ${open12} إلى ${close12} (الجمعة والسبت عطلة)`
        : `Sun to Thu: ${open12} to ${close12}`
    }
    return lang === 'ar'
      ? `يومياً: من ${open12} إلى ${close12}`
      : `Daily: ${open12} to ${close12}`
  }, [openHour, closeHour, daysSchedule, isManualHoursEdit, customScheduleText, lang])

  // Client-Side Image Compression & Upload for Logo
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsCompressingLogo(true)
    setLogoStats(null)

    try {
      const origSize = file.size
      // Compress to high-efficiency WebP, max 500x500
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

      // Try uploading to Supabase storage with graceful fallback
      const uploadRes = await uploadCommunityImage(compressed.file, 'logos', user?.id)
      if (uploadRes.url) {
        setLogoUrl(uploadRes.url)
      } else if (compressed.dataUrl) {
        setLogoUrl(compressed.dataUrl)
      }
    } catch (err) {
      console.error('Logo upload error:', err)
      alert(lang === 'ar' ? 'فشل معالجة وضغط الصورة، يرجى المحاولة مرة أخرى' : 'Failed to compress logo image')
    } finally {
      setIsCompressingLogo(false)
    }
  }

  // Client-Side Image Compression & Upload for Cover
  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsCompressingCover(true)
    setCoverStats(null)

    try {
      const origSize = file.size
      // Compress banner to max 1400x700
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

      // Try uploading to Supabase storage with graceful fallback
      const uploadRes = await uploadCommunityImage(compressed.file, 'covers', user?.id)
      if (uploadRes.url) {
        setCoverUrl(uploadRes.url)
      } else if (compressed.dataUrl) {
        setCoverUrl(compressed.dataUrl)
      }
    } catch (err) {
      console.error('Cover upload error:', err)
      alert(lang === 'ar' ? 'فشل معالجة وضغط صورة الغلاف' : 'Failed to compress cover image')
    } finally {
      setIsCompressingCover(false)
    }
  }

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1)
  const [sending, setSending] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Map & Offline Location State
  const [latitude, setLatitude] = useState<number | null>(30.0444)
  const [longitude, setLongitude] = useState<number | null>(31.2357)
  const [hasPickedOnMap, setHasPickedOnMap] = useState(false)

  // Online Partnership Contract Agreement State (10% sales commission, 1st month free)
  const [acceptedContract, setAcceptedContract] = useState(false)

  // Top of Form Ref for auto-scroll on Next/Back
  const formTopRef = useRef<HTMLDivElement>(null)

  // Granular Field Validation State & Top Banner
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)

  const clearFieldError = (fieldName: string) => {
    setFormErrors(prev => {
      if (!prev[fieldName]) return prev
      const next = { ...prev }
      delete next[fieldName]
      return next
    })
    setFormErrorMessage(null)
  }

  // Phone sanitization & validation helpers: strictly 11 digits only
  const sanitizePhoneInput = (val: string): string => {
    if (!val) return ''
    // Convert Arabic-Indic numerals (٠-٩) to standard (0-9)
    let converted = val.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()).trim()
    // If entered with Egyptian international prefix (+20 or 0020 or 201...), normalize to 01...
    converted = converted.replace(/^(\+20|0020|20)(1[0125]\d*)$/, '0$2')
    // Extract only digits
    const digitsOnly = converted.replace(/[^0-9]/g, '')
    // Strictly cap at 11 digits only
    return digitsOnly.slice(0, 11)
  }

  const validatePhone = (
    val: string
  ): {
    isValid: boolean
    message?: string
    isEgypt?: boolean
    network?: string
    cleanNumber?: string
    label?: string
  } => {
    if (!val || !val.trim()) {
      return {
        isValid: false,
        message: lang === 'ar' ? 'رقم الهاتف مطلوب (11 رقماً فقط)' : 'Phone number is required (11 digits only)',
      }
    }

    // Convert Arabic-Indic numerals (٠-٩) to standard (0-9)
    let normalized = val
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
      .trim()

    // Normalize Egyptian country code if pasted (+2010... -> 010...)
    normalized = normalized.replace(/^(\+20|0020|20)(1[0125]\d*)$/, '0$2')
    const rawDigits = normalized.replace(/[^0-9]/g, '')

    // Must be exactly 11 digits
    if (rawDigits.length !== 11) {
      return {
        isValid: false,
        message:
          lang === 'ar'
            ? `يجب أن يتكون رقم الهاتف من 11 رقماً فقط (${rawDigits.length}/11)`
            : `Phone number must be exactly 11 digits only (${rawDigits.length}/11)`,
      }
    }

    // Must start with 010, 011, 012, or 015
    const prefix = rawDigits.substring(0, 3)
    const networkMap: Record<string, string> = {
      '010': lang === 'ar' ? 'فودافون' : 'Vodafone',
      '011': lang === 'ar' ? 'إتصالات' : 'Etisalat',
      '012': lang === 'ar' ? 'أورنج' : 'Orange',
      '015': lang === 'ar' ? 'وي (WE)' : 'WE',
    }

    if (!networkMap[prefix]) {
      return {
        isValid: false,
        message:
          lang === 'ar'
            ? `كود الشبكة (${prefix}) غير صحيح. يجب أن يبدأ الرقم بـ 010 أو 011 أو 012 أو 015`
            : `Invalid prefix (${prefix}). Must start with 010, 011, 012, or 015`,
      }
    }

    return {
      isValid: true,
      isEgypt: true,
      network: networkMap[prefix],
      cleanNumber: rawDigits,
      label:
        lang === 'ar'
          ? `رقم معتمد (${networkMap[prefix]} - 11 رقماً)`
          : `Valid Mobile (${networkMap[prefix]} - 11 digits)`,
    }
  }

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {}
    if (!storeNameAr.trim() || storeNameAr.trim().length < 2) {
      errors.storeNameAr = lang === 'ar' ? 'يرجى إدخال اسم المكتبة بالعربية (حرفين على الأقل)' : 'Please enter bookstore name in Arabic (at least 2 chars)'
    }
    if (!ownerName.trim() || ownerName.trim().length < 2) {
      errors.ownerName = lang === 'ar' ? 'يرجى إدخال اسم المالك أو المسؤول المعتمد' : 'Please enter owner or manager name'
    }
    const cleanDesc = description.trim()
    if (!cleanDesc || cleanDesc.length < 15) {
      errors.description = lang === 'ar'
        ? 'يرجى كتابة نبذة تعريفية لا تقل عن 15 حرفاً عن المكتبة وتخصصاتها وأقسام الكتب'
        : 'Please enter a store description of at least 15 characters'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(prev => ({ ...prev, ...errors }))
      setFormErrorMessage(lang === 'ar' ? 'يرجى استكمال الحقول الإلزامية بالخطوة 1 (اسم المكتبة، المالك، ونبذة 15 حرفاً)' : 'Please fill all required fields in Step 1')
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return false
    }
    setFormErrorMessage(null)
    return true
  }

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {}
    if (storeType !== 'ONLINE') {
      if (!district.trim() && !address.trim()) {
        errors.district = lang === 'ar' ? 'يرجى تحديد الحي أو كتابة عنوان المقر الفعلي للمكتبة' : 'Please specify the district or street address for physical store'
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(prev => ({ ...prev, ...errors }))
      setFormErrorMessage(lang === 'ar' ? 'يرجى تحديد تفاصيل مقر المكتبة الفعلي للمتابعة' : 'Please complete physical store address in Step 2')
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return false
    }
    setFormErrorMessage(null)
    return true
  }

  // Social Links Validation (Facebook, Instagram, TikTok, Website)
  const validateSocialLinks = (): Record<string, string> => {
    const errors: Record<string, string> = {}

    const isUrlLike = (s: string) =>
      s.includes('/') ||
      s.startsWith('http') ||
      /\.(com|net|org|co|me|io|app|info|biz)/i.test(s)

    // 1. Facebook Validation
    if (facebookPage.trim()) {
      const val = facebookPage.trim()
      if (isUrlLike(val)) {
        const isFacebookUrl = /(^https?:\/\/)?(www\.|m\.|web\.)?(facebook\.com|fb\.com|fb\.me|fb\.watch)\/.+/i.test(val)
        if (!isFacebookUrl) {
          errors.facebookPage =
            lang === 'ar'
              ? 'رابط فيسبوك غير صحيح. يرجى إدخال رابط صفحة فيسبوك يبدأ بـ facebook.com أو fb.com'
              : 'Invalid Facebook link. Must be a facebook.com or fb.com link'
        }
      } else {
        const isHandle = /^@?[a-zA-Z0-9.]{3,50}$/.test(val)
        if (!isHandle) {
          errors.facebookPage =
            lang === 'ar'
              ? 'اسم صفحة فيسبوك غير صالح. يرجى إدخال رابط أو معرف صحيح (مثال: @yourstore)'
              : 'Invalid Facebook handle or URL'
        }
      }
    }

    // 2. Instagram Validation
    if (instagramHandle.trim()) {
      const val = instagramHandle.trim()
      if (isUrlLike(val)) {
        const isInstagramUrl = /(^https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/.+/i.test(val)
        if (!isInstagramUrl) {
          errors.instagramHandle =
            lang === 'ar'
              ? 'رابط إنستغرام غير صحيح. يرجى إدخال رابط إنستغرام يبدأ بـ instagram.com (وليس منصة أخرى)'
              : 'Invalid Instagram link. Must be an instagram.com link'
        }
      } else {
        const isHandle = /^@?[a-zA-Z0-9._]{2,30}$/.test(val)
        if (!isHandle) {
          errors.instagramHandle =
            lang === 'ar'
              ? 'معرف إنستغرام غير صالح. يرجى إدخال يوزر يبدأ بـ @ أو رابط إنستغرام'
              : 'Invalid Instagram handle. Example: @yourstore'
        }
      }
    }

    // 3. TikTok Validation
    if (tiktokHandle.trim()) {
      const val = tiktokHandle.trim()
      if (isUrlLike(val)) {
        const isTikTokUrl = /(^https?:\/\/)?(www\.)?tiktok\.com\/@?.+/i.test(val)
        if (!isTikTokUrl) {
          errors.tiktokHandle =
            lang === 'ar'
              ? 'رابط تيك توك غير صحيح. يرجى إدخال رابط تيك توك يبدأ بـ tiktok.com/@yourstore'
              : 'Invalid TikTok link. Must be a tiktok.com/@yourstore link'
        }
      } else {
        const isHandle = /^@?[a-zA-Z0-9._]{2,24}$/.test(val)
        if (!isHandle) {
          errors.tiktokHandle =
            lang === 'ar'
              ? 'معرف تيك توك غير صالح (مثال: @yourstore)'
              : 'Invalid TikTok handle'
        }
      }
    }

    // 4. Website Validation
    if (websiteUrl.trim()) {
      const val = websiteUrl.trim()
      const isWebsite = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/i.test(val)
      if (!isWebsite) {
        errors.websiteUrl =
          lang === 'ar'
            ? 'رابط موقع غير صالح. يرجى إدخال عنوان موقع إلكتروني صحيح (مثال: https://yourstore.com)'
            : 'Invalid website URL (e.g. https://yourstore.com)'
      }
    }

    return errors
  }

  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {}

    // WhatsApp validation
    const waCheck = validatePhone(whatsapp)
    if (!waCheck.isValid) {
      errors.whatsapp = waCheck.message || (lang === 'ar' ? 'يرجى إدخال رقم واتساب صحيح لاستقبال طلبات الكتب' : 'Please enter a valid WhatsApp number')
    }

    // Direct Phone validation
    const phCheck = validatePhone(phone)
    if (!phCheck.isValid) {
      errors.phone = phCheck.message || (lang === 'ar' ? 'يرجى إدخال رقم هاتف اتصال مباشر صحيح' : 'Please enter a valid direct contact phone number')
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح لاستلام رابط تفعيل لوحة التحكم' : 'Please enter a valid notification and dashboard email address'
    }

    // Social existence proof & link platform validation
    const socialErrors = validateSocialLinks()
    if (Object.keys(socialErrors).length > 0) {
      Object.assign(errors, socialErrors)
    }

    const hasAnyValidProof =
      (facebookPage.trim() && !socialErrors.facebookPage) ||
      (instagramHandle.trim() && !socialErrors.instagramHandle) ||
      (tiktokHandle.trim() && !socialErrors.tiktokHandle) ||
      (websiteUrl.trim() && !socialErrors.websiteUrl)

    if (!hasAnyValidProof) {
      errors.socialProof =
        lang === 'ar'
          ? 'يرجى إضافة رابط واحد صحيح على الأقل لإثبات وجود ونشاط المكتبة (فيسبوك، إنستغرام، تيك توك، أو موقع)'
          : 'Please provide at least one valid social presence link or website'
    }

    // Contract acceptance validation
    if (!acceptedContract) {
      errors.acceptedContract = lang === 'ar' ? 'يرجى الموافقة على شروط عقد الشراكة (عمولة 10%، والشهر الأول مجاناً 100%)' : 'Please accept the partnership contract terms'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(prev => ({ ...prev, ...errors }))
      setFormErrorMessage(lang === 'ar' ? 'يرجى استكمال قنوات التواصل والتحقق والتأكد من أرقام الهاتف وروابط التواصل والموافقة على العقد' : 'Please complete all required fields and accept the contract in Step 3')
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return false
    }
    setFormErrorMessage(null)
    return true
  }

  const goToStep = (step: 1 | 2 | 3) => {
    if (!currentUser) {
      setFormErrorMessage(
        lang === 'ar'
          ? 'يرجى تسجيل الدخول أولاً بالأعلى لملء بيانات المتجر والتقديم ⚡'
          : 'Please sign in first above to complete store registration ⚡'
      )
      fastLoginRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (step === 2) {
      if (!validateStep1()) return
    }
    if (step === 3) {
      if (!validateStep1()) {
        setActiveStep(1)
        return
      }
      if (!validateStep2()) {
        setActiveStep(2)
        return
      }
    }
    setActiveStep(step)
    setTimeout(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 40)
  }

  // Existence Proof Check (Must provide at least 1 verified social presence link)
  const hasSocialProof = useMemo(() => {
    return Boolean(
      (facebookPage.trim() && !formErrors.facebookPage) ||
      (instagramHandle.trim() && !formErrors.instagramHandle) ||
      (tiktokHandle.trim() && !formErrors.tiktokHandle) ||
      (websiteUrl.trim() && !formErrors.websiteUrl)
    )
  }, [facebookPage, instagramHandle, tiktokHandle, websiteUrl, formErrors])

  const whatsappAdmin = '201556252658'

  const executeApplicationSubmit = async (userToAttach?: { id: string; email?: string }) => {
    setSending(true)

    const formatLabel =
      storeType === 'ONLINE'
        ? lang === 'ar' ? 'متجر إلكتروني أونلاين فقط (شحن لكافة المحافظات)' : 'Online Only Store (Nationwide)'
        : storeType === 'OFFLINE'
        ? lang === 'ar' ? 'مقر وفرع فعلي' : 'Physical Bookstore'
        : lang === 'ar' ? 'مقر فعلي + بيع وشحن أونلاين' : 'Hybrid (Store + Online)'

    const isOnline = storeType === 'ONLINE'
    const activeWorkingHours = formattedWorkingHours || workingHours
    const effectiveDistrict = isOnline ? (lang === 'ar' ? 'أونلاين (Online)' : 'Online') : district
    const effectiveAddress = isOnline
      ? (lang === 'ar' ? 'متجر إلكتروني أونلاين — شحن لكافة المحافظات' : 'Online Store — Nationwide Delivery')
      : (address || `${city}، ${district}`)
    const effectiveGoogleMaps = isOnline
      ? undefined
      : (googleMapsUrl || (latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : undefined))

    const normalizeSocialUrl = (type: 'fb' | 'ig' | 'tt' | 'web', val: string): string | undefined => {
      const trimmed = val.trim()
      if (!trimmed) return undefined
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
      if (type === 'fb') {
        const handle = trimmed.replace(/^@/, '')
        return (trimmed.includes('facebook.com') || trimmed.includes('fb.com'))
          ? `https://${trimmed.replace(/^https?:\/\//, '')}`
          : `https://facebook.com/${handle}`
      }
      if (type === 'ig') {
        const handle = trimmed.replace(/^@/, '')
        return trimmed.includes('instagram.com')
          ? `https://${trimmed.replace(/^https?:\/\//, '')}`
          : `https://instagram.com/${handle}`
      }
      if (type === 'tt') {
        const handle = trimmed.replace(/^@/, '')
        return trimmed.includes('tiktok.com')
          ? `https://${trimmed.replace(/^https?:\/\//, '')}`
          : `https://tiktok.com/@${handle}`
      }
      if (type === 'web') {
        return `https://${trimmed.replace(/^https?:\/\//, '')}`
      }
      return trimmed
    }

    const finalFb = normalizeSocialUrl('fb', facebookPage)
    const finalIg = normalizeSocialUrl('ig', instagramHandle)
    const finalTt = normalizeSocialUrl('tt', tiktokHandle)
    const finalWeb = normalizeSocialUrl('web', websiteUrl)

    const summaryMessage =
      `🏪 *طلب تسجيل مكتبة شريكة جديد — منصة WaraqConnect (ورق كونكت)*\n\n` +
      `📌 *اسم المتجر:* ${storeNameAr} ${storeNameEn ? `(${storeNameEn})` : ''}\n` +
      `👤 *المالك / المسؤول:* ${ownerName}\n` +
      `🏷️ *طبيعة المتجر:* ${formatLabel}\n` +
      `💬 *شعار المتجر:* ${slogan || 'غير محدد'}\n` +
      (isOnline
        ? `📍 *مركز التوزيع والشحن الرئيسي:* ${city}\n🏢 *التواجد:* متجر إلكتروني أونلاين للشحن المباشر (بدون مقر فعلي للزيارة)\n`
        : `📍 *المحافظة والحي:* ${city} — ${district || 'غير محدد'}\n🏢 *العنوان الفعلي:* ${effectiveAddress}\n🗺️ *خرائط جوجل:* ${effectiveGoogleMaps || 'غير مضاف'}\n` +
          (latitude && longitude ? `🧭 *إحداثيات الخريطة:* ${latitude.toFixed(4)}, ${longitude.toFixed(4)}\n` : '')) +
      `⏰ *ساعات العمل:* ${activeWorkingHours}\n` +
      `🚚 *نطاق التوصيل:* ${shippingScope}\n` +
      `📱 *واتساب الطلبات:* ${whatsapp}\n` +
      `📞 *رقم الهاتف:* ${phone}\n` +
      `🌐 *فيسبوك:* ${finalFb || 'غير مسجل'}\n` +
      `📸 *إنستغرام:* ${finalIg || 'غير مسجل'}\n` +
      `🎵 *تيك توك:* ${finalTt || 'غير مسجل'}\n` +
      (finalWeb ? `💻 *الموقع الإلكتروني:* ${finalWeb}\n` : '') +
      `📦 *متوسط حجم الكتب شهرياً:* ${monthlyVolume}\n` +
      `📋 *عقد الشراكة:* تم قبول الشروط والأحكام (10% عمولة مبيعات، الشهر الأول مجاناً 100% يبدأ مع أول طلب)\n` +
      `📝 *نبذة عن المكتبة:*\n${description || 'متجر كتب ورقية معتمد'}\n\n` +
      `✨ تم إرسال الطلب عبر نموذج الشركاء بمنصة ورق كونكت.`

    const effectiveUserId = userToAttach?.id || currentUser?.id
    const effectiveEmail = email.trim() || userToAttach?.email || currentUser?.email || (currentUser?.profile as { email?: string } | undefined)?.email

    try {
      await submitStoreApplication({
        applicant_id: effectiveUserId,
        applicant_name: ownerName,
        owner_name: ownerName,
        business_name: storeNameAr,
        store_name: storeNameEn || storeNameAr,
        store_name_ar: storeNameAr,
        email: effectiveEmail,
        slogan,
        phone,
        city,
        district: effectiveDistrict,
        address: effectiveAddress,
        latitude: isOnline ? undefined : (latitude ?? undefined),
        longitude: isOnline ? undefined : (longitude ?? undefined),
        google_maps_url: effectiveGoogleMaps,
        working_hours: activeWorkingHours,
        shipping_scope: shippingScope,
        store_type: storeType,
        is_online_only: storeType === 'ONLINE',
        logo_url: logoUrl,
        cover_url: coverUrl,
        website_url: finalWeb,
        social_links: {
          whatsapp,
          facebook: finalFb,
          instagram: finalIg,
          tiktok: finalTt,
        },
        monthly_book_estimate: monthlyVolume,
        bio: description,
        bio_ar: description,
        details: description,
        contract_accepted: true,
        partner_type: 'BOOKSTORE',
      })
    } catch (err) {
      console.warn('Failed submitting store application:', err)
    }

    // Dispatch submission receipt confirmation email
    if (effectiveEmail) {
      try {
        fetch('/api/stores/notify-submitted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: effectiveEmail,
            ownerName: ownerName || 'شريكنا العزيز',
            storeName: storeNameAr || storeNameEn || 'المتجر الجديد',
            phone,
            whatsapp,
            city,
            storeType,
          }),
        }).catch(err => console.warn('Failed to send store submission email:', err))
      } catch {}
    }

    try {
      const whatsappUrl = `https://wa.me/${whatsappAdmin}?text=${encodeURIComponent(summaryMessage)}`
      window.open(whatsappUrl, '_blank')
    } catch {}

    setSending(false)
    setSubmitted(true)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Enforce step-by-step validations with automatic transition to the step with errors
    if (!validateStep1()) {
      setActiveStep(1)
      return
    }

    if (!validateStep2()) {
      setActiveStep(2)
      return
    }

    if (!validateStep3()) {
      setActiveStep(3)
      return
    }

    // If NOT logged in:
    if (!currentUser) {
      // 1. If user typed inline password in Step 3 (>= 6 chars), authenticate seamlessly in 1 click!
      if (accountPassword.trim() && accountPassword.trim().length >= 6) {
        setIsSubmittingAuth(true)
        setSending(true)
        try {
          const supabase = createClient()
          const cleanEmail = email.trim().toLowerCase()

          // Attempt sign in
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: accountPassword.trim(),
          })

          if (signInData?.user) {
            const formatted = {
              id: signInData.user.id,
              email: signInData.user.email,
              profile: signInData.user.user_metadata,
            }
            setCurrentUser(formatted)
            setIsSubmittingAuth(false)
            await executeApplicationSubmit(formatted)
            return
          }

          // Attempt sign up if user does not exist
          const { data: signUpData } = await supabase.auth.signUp({
            email: cleanEmail,
            password: accountPassword.trim(),
            options: {
              data: {
                full_name: ownerName.trim(),
              },
            },
          })

          if (signUpData?.user) {
            const formatted = {
              id: signUpData.user.id,
              email: signUpData.user.email,
              profile: signUpData.user.user_metadata,
            }
            setCurrentUser(formatted)
            setIsSubmittingAuth(false)
            await executeApplicationSubmit(formatted)
            return
          }
        } catch (e) {
          console.warn('Inline auth fallback to popup:', e)
        }
        setIsSubmittingAuth(false)
        setSending(false)
      }

      // 2. Fallback to FastAuthModal popup pre-filled with email and name
      setIsAuthModalOpen(true)
      return
    }

    await executeApplicationSubmit(currentUser)
  }

  if (submitted) {
    return (
      <MainLayout user={currentUser || user}>
        <div className="page-container py-20 flex flex-col items-center text-center max-w-lg mx-auto gap-6 animate-in fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-md">
            <CheckCircle2 className="h-10 w-10 animate-bounce" />
          </div>
          <div className="space-y-3">
            <span className="text-xs font-bold text-primary px-3 py-1 bg-primary/10 rounded-full">
              {lang === 'ar' ? 'طلب شراكة متجر معتمد' : 'Store Application Received'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              {lang === 'ar' ? `🎉 مرحباً بك يا ${ownerName} في شبكة ورق!` : `🎉 Welcome ${ownerName} to Waraq Network!`}
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {lang === 'ar'
                ? `تم تسجيل بيانات مكتبة (${storeNameAr}) بنجاح وإرسال إشعار مباشر لفريق إدارة المنصة. تم ربط الطلب بحسابك (${currentUser?.email || email}) وسيتم مراجعة الروابط واعتماد شارة التوثيق وتفعيل صفحة المتجر خلال 24 ساعة.`
                : `Store (${storeNameAr}) has been submitted for verification. Your application is linked to (${currentUser?.email || email}). Verification badge will be activated within 24 hours.`}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border w-full text-start text-xs space-y-3">
            <p className="font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>{lang === 'ar' ? 'ماذا سيحدث بعد ذلك؟' : 'What happens next?'}</span>
            </p>
            <ul className="text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>{lang === 'ar' ? 'تم تسجيل طلبك وربطه بحسابك بنجاح دون أي حاجة لإعادة التقديم.' : 'Application saved and linked to your account.'}</li>
              <li>{lang === 'ar' ? 'فحص حساب فيسبوك/إنستغرام للتأكد من نشاط المتجر ومنع الحسابات الوهمية.' : 'Verify store social media activity to ensure legitimacy.'}</li>
              <li>{lang === 'ar' ? 'تفعيل رابط المتجر العام ليتمكن القراء من تصفح كتبك وعروض الباكدجات.' : 'Public store link activated for catalog and mix & match bundles.'}</li>
              <li>{lang === 'ar' ? 'إرسال دليل إدارة لوحة المتجر وتلقي الطلبات عبر الواتساب.' : 'Receive store dashboard guide & direct WhatsApp customer order routing.'}</li>
            </ul>

            <a
              href={`https://wa.me/${whatsappAdmin}?text=${encodeURIComponent(
                `🏪 *تأكيد تقديم طلب شراكة مكتبة (${storeNameAr})*\n` +
                `👤 المسؤول: ${ownerName}\n` +
                `📱 الواتساب: ${whatsapp}\n` +
                `✉️ البريد: ${currentUser?.email || email}\n` +
                `✨ تم تقديم الطلب بنجاح عبر منصة ورق كونكت.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block pt-1"
            >
              <Button className="w-full rounded-xl font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm text-xs">
                <MessageCircle className="h-4 w-4" />
                <span>{lang === 'ar' ? 'تأكيد الطلب مع فريق الدعم عبر واتساب' : 'Chat with Partner Support on WhatsApp'}</span>
              </Button>
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link href="/stores" className="flex-1">
              <Button variant="outline" className="w-full rounded-xl font-bold cursor-pointer">
                {lang === 'ar' ? 'تصفح دليل المكتبات' : 'Browse Bookstore Directory'}
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full rounded-xl font-bold cursor-pointer bg-primary text-primary-foreground">
                {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout user={currentUser || user}>
      {/* Hero Header */}
      <section className="relative overflow-hidden hero-gradient text-white py-14 md:py-20">
        <div className="absolute -top-32 -start-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="page-container relative z-10 max-w-3xl text-center mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-emerald-300 backdrop-blur-xs">
            <Store className="h-4 w-4" />
            <span>{lang === 'ar' ? 'برنامج شركاء المكتبات ومتاجر الكتب 2026' : 'Bookstore & Shop Partner Program 2026'}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            {lang === 'ar' ? 'سجّل مكتبتك… وابدأ بيع كتبك لآلاف القراء 📚' : 'Register Your Bookstore… Reach Thousands of Readers 📚'}
          </h1>
          <p className="text-white/85 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            {lang === 'ar'
              ? 'سواء كنت متجراً أونلاين فقط تشحن للمحافظات، أو مكتبة بمقر وفرع فعلي — انضم مجاناً لشبكة WaraqConnect واعرض كتالوج كتبك، باقات التوفير، وتلقّ الطلبات مباشرة على الواتساب.'
              : 'Whether you run an online-only bookshop shipping nationwide or have a physical walk-in store — join WaraqConnect for free to feature your catalog, bundle packages, and receive direct customer orders.'}
          </p>

          {/* Real-world trust metrics */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-xs font-bold">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="block text-emerald-300 text-base font-black">0%</span>
              <span className="text-white/80">{lang === 'ar' ? 'عمولة تسجيل مجانية' : 'Free Registration'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="block text-emerald-300 text-base font-black">100%</span>
              <span className="text-white/80">{lang === 'ar' ? 'طلبات مباشرة على واتسابك' : 'Direct WhatsApp Orders'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="block text-emerald-300 text-base font-black">27</span>
              <span className="text-white/80">{lang === 'ar' ? 'محافظة تغطية شاملة' : 'Governorates Delivery'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="block text-emerald-300 text-base font-black">شارة موثقة</span>
              <span className="text-white/80">{lang === 'ar' ? 'حماية من الحسابات الوهمية' : 'Anti-Spam Verified'}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="page-container py-10 max-w-6xl mx-auto space-y-6">
        {isUnauthorized && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-950 dark:text-amber-200 flex items-start gap-3.5 shadow-sm">
            <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <h4 className="font-bold text-base">
                {lang === 'ar' ? 'لوحة إدارة المتاجر مخصصة فقط للمكتبات المعتمدة' : 'Store Dashboard Access Restricted'}
              </h4>
              <p className="leading-relaxed opacity-90 text-xs sm:text-sm">
                {lang === 'ar'
                  ? 'عفواً، لا يمتلك حسابك صلاحية شريك مكتبة للوصول إلى لوحة الإدارة. إذا كنت تدير مكتبة أو دار نشر أو متجر كتب، يرجى ملء طلب الشراكة التالي لاعتماد متجرك وتفعيل لوحة التحكم.'
                  : 'Your account does not have bookstore partner privileges. If you operate a bookstore or publisher, please fill out the partner application below to verify your store and activate your dashboard.'}
              </p>
            </div>
          </div>
        )}
        {/* ======================================================== */}
        {/* SMART INVITATION & DEVICE-AWARE ONBOARDING CARD */}
        {/* ======================================================== */}
        <section className="rounded-3xl border-2 border-primary/25 bg-card/95 backdrop-blur-md p-5 sm:p-7 shadow-sm space-y-4">
          {/* 1. If invited specifically */}
          {invitedStoreParam && (
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-primary text-primary-foreground text-sm font-black">
                ✨
              </span>
              <div>
                <p className="font-bold text-sm text-foreground">
                  {lang === 'ar' ? `دعوة شراكة خاصة: مرحباً بفريق ${invitedStoreParam} 🤝` : `Special Partnership Invite: Welcome ${invitedStoreParam}! 🤝`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lang === 'ar'
                    ? 'يسعدنا انضمامكم لشبكة المكتبات المعتمدة. تم تعبئة بعض بياناتكم مسبقاً لتسهيل التسجيل.'
                    : 'We are delighted to invite your store. Some details have been pre-filled for your convenience.'}
                </p>
              </div>
            </div>
          )}

          {/* 2. Device Guidance (Android vs iOS vs Desktop) */}
          {deviceOS === 'android' && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {lang === 'ar' ? '📱 متاح الآن للأندرويد: تطبيق ورق كونكت' : '📱 Available on Android: WaraqConnect App'}
                    </span>
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Android App</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {lang === 'ar'
                      ? 'حمّل التطبيق على هاتفك لتلقي إشعارات طلبات الكتب وإدارة متجرك، أو يمكنك إكمال نموذج الشراكة مباشرة هنا عبر المتصفح.'
                      : 'Install our app for real-time order alerts, or complete your bookstore onboarding directly here via browser.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Link href="/download" className="flex-1 sm:flex-none">
                  <Button size="sm" className="w-full sm:w-auto rounded-xl font-bold text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs">
                    <Download className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'تثبيت التطبيق للأندرويد' : 'Install Android App'}</span>
                  </Button>
                </Link>
                {!currentUser && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex-1 sm:flex-none rounded-xl font-bold text-xs gap-1.5 cursor-pointer text-primary border-primary/30 hover:bg-primary/10"
                  >
                    <span>{lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {deviceOS === 'ios' && (
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {lang === 'ar' ? '🍎 مستخدمي أجهزة Apple / iOS (آيفون وآيباد)' : '🍎 Apple iOS (iPhone & iPad) Notice'}
                    </span>
                    <Badge variant="outline" className="text-blue-600 border-blue-500/30 text-[10px] font-bold">App Store Soon</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {lang === 'ar'
                      ? 'تطبيق App Store قيد المراجعة الرسمية وقريباً على المتجر 🚀 — يمكنك إكمال طلب الشراكة واستخدام لوحة التحكم بالكامل وبكل كفاءة وسرعة عبر متصفح الويب (Safari / Chrome) بدون أي قيود.'
                      : 'Our iOS native app is currently under App Store review and coming soon 🚀 — you can complete onboarding and manage your store seamlessly right now via Safari Web App.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                {!currentUser ? (
                  <Button
                    size="sm"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full sm:w-auto rounded-xl font-bold text-xs gap-1.5 bg-primary text-primary-foreground cursor-pointer shadow-xs"
                  >
                    <span>{lang === 'ar' ? 'تسجيل الدخول ومتابعة النموذج' : 'Sign In & Continue'}</span>
                  </Button>
                ) : (
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1.5 font-bold text-xs py-1.5 px-3">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'حسابك مسجل الدخول' : 'Account Connected'}</span>
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* 3. Three-Step Onboarding Guidance Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className={cn(
              "p-3.5 rounded-2xl border transition-all flex items-center gap-3",
              currentUser ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-muted/40 border-border"
            )}>
              <div className={cn(
                "h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0",
                currentUser ? "bg-emerald-600 text-white" : "bg-primary/10 text-primary"
              )}>
                {currentUser ? <Check className="h-4 w-4" /> : '1'}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs block">
                  {lang === 'ar' ? '1. تسجيل الدخول' : '1. Sign In / Account'}
                </span>
                <span className="text-[11px] text-muted-foreground block truncate">
                  {currentUser ? (String((currentUser.profile as any)?.full_name || currentUser.email || '')) : (lang === 'ar' ? 'لربط المتجر بحسابك' : 'Links store to your email')}
                </span>
              </div>
              {!currentUser && (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="ms-auto text-xs font-bold text-primary hover:underline cursor-pointer shrink-0"
                >
                  {lang === 'ar' ? 'دخول' : 'Login'}
                </button>
              )}
            </div>

            <div className="p-3.5 rounded-2xl border border-border bg-muted/40 flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                2
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs block">
                  {lang === 'ar' ? '2. بيانات المتجر' : '2. Store Details'}
                </span>
                <span className="text-[11px] text-muted-foreground block truncate">
                  {lang === 'ar' ? 'الاسم، العنوان، والواتساب' : 'Name, address & WhatsApp'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-border bg-muted/40 flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                3
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs block">
                  {lang === 'ar' ? '3. الاعتماد وبدء البيع' : '3. Live Store & Sales'}
                </span>
                <span className="text-[11px] text-muted-foreground block truncate">
                  {lang === 'ar' ? 'تفعيل اللوحة وتلقي الطلبات' : 'Dashboard & orders live'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* INTERACTIVE FEATURE SHOWCASE: "كل ما تحتاجه لإدارة مكتبتك" */}
        {/* ======================================================== */}
        <section className="rounded-3xl border-2 border-emerald-500/25 bg-gradient-to-br from-card via-card to-emerald-500/5 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Sparkles className="h-5 w-5" />
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-foreground">
                  {lang === 'ar' ? 'مميزات حصرية لمكتبتك في منصة ورق كونكت 🚀' : 'Exclusive Bookstore Features on WaraqConnect 🚀'}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                {lang === 'ar'
                  ? 'صممنا المنصة خصيصاً لتناسب طبيعة عمل المكتبات ومتاجر الكتب: أضف كتبك بسهولة، فعّل عروض التوفير، وتلقّ الطلبات المباشرة دون تعقيد.'
                  : 'Built specifically for bookstores: effortlessly add single or bulk books, launch bundle deals, and receive direct WhatsApp customer orders.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="px-5 py-2.5 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
            >
              {lang === 'ar' ? 'سجّل مكتبتك في دقيقتين ✍️' : 'Register Store in 2 Mins ✍️'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Smart Single Book Add */}
            <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-emerald-500/40 hover:shadow-md transition-all space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="h-5 w-5" />
                </div>
                <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  {lang === 'ar' ? 'إدخال فوري ذكي' : 'Instant AI Fetch'}
                </Badge>
              </div>
              <h3 className="text-sm font-black text-foreground">
                {lang === 'ar' ? 'إضافة الكتب الفردية الذكية 📖' : 'Smart Single Book Search & Add 📖'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'ar'
                  ? 'ابحث باسم الكتاب أو الكاتب، وسيقوم النظام فوراً بملء تقييم ومراجعات Goodreads، نبذة الرواية، عدد الصفحات، والغلاف بدقة عالية دون إدخال يدوي.'
                  : 'Search any book to auto-fetch Goodreads reviews, synopsis, author details, genres, pages, and HD cover image.'}
              </p>
            </div>

            {/* 2. Bulk Book Catalog Import */}
            <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-primary/40 hover:shadow-md transition-all space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Layers className="h-5 w-5" />
                </div>
                <Badge className="bg-primary/15 text-primary border border-primary/30 text-[10px] font-bold">
                  {lang === 'ar' ? '20-50 كتاب بضغطة زر' : 'Bulk Import'}
                </Badge>
              </div>
              <h3 className="text-sm font-black text-foreground">
                {lang === 'ar' ? 'الاستيراد الجماعي السريع لقوائم الكتب ⚡' : '1-Click Bulk Catalog Import ⚡'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'ar'
                  ? 'استورد قوائم الكتب الأكثر مبيعاً (روايات، كتب دينية، تطوير ذات) بنقرة واحدة لتجهيز متجرك بالكامل في ثوانٍ مع أسعارها وأغلفتها المعتمدة.'
                  : 'Import 20-50 curated bestsellers in one click to populate your catalog with verified prices, covers, and ISBNs.'}
              </p>
            </div>

            {/* 3. Curated 2-5 Books Packages */}
            <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-orange-500/40 hover:shadow-md transition-all space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="h-5 w-5" />
                </div>
                <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30 text-[10px] font-bold">
                  {lang === 'ar' ? 'منتجات للسلة 🛒' : 'Orderable Packs'}
                </Badge>
              </div>
              <h3 className="text-sm font-black text-foreground">
                {lang === 'ar' ? 'باكدجات وحزم الكتب المجهزة (2-5 كتب) 📦' : 'Curated 2-5 Books Packages 📦'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'ar'
                  ? 'أنشئ باكدجات محددة بغلاف وسعر خاص وهدايا، وتظهر كمنتج معروض في متجرك وسلة المشتري وتضاف للطلب بنقرة واحدة.'
                  : 'Create 2-5 book bundles with uploaded cover & special pricing that sell as direct products in store and basket.'}
              </p>
            </div>

            {/* 4. Ready Series & Tier Ladders */}
            <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-purple-500/40 hover:shadow-md transition-all space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="h-5 w-5" />
                </div>
                <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                  {lang === 'ar' ? '21+ سلسلة وعروض توفير' : 'Series & Tiers'}
                </Badge>
              </div>
              <h3 className="text-sm font-black text-foreground">
                {lang === 'ar' ? 'عروض السلاسل وباقات التوفير الجاهزة 🌟' : 'Ready Novel Series & Tier Ladders 🌟'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'ar'
                  ? 'فعّل سلاسل روائية كاملة (ثلاثية نجيب محفوظ، أرض زيكولا، أبابيل...) وجدول مستويات توفير مرن ("اختار كتبك والهدايا والبوك مارك علينا").'
                  : 'Activate 21+ popular novel series and customize "Pick Your Books" volume discount ladders with free gift bookmarks.'}
              </p>
            </div>

            {/* 5. Custom Store URL & WhatsApp Orders */}
            <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-emerald-500/40 hover:shadow-md transition-all space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Globe className="h-5 w-5" />
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  {lang === 'ar' ? 'رابط مخصص + واتساب' : 'Custom URL & WhatsApp'}
                </Badge>
              </div>
              <h3 className="text-sm font-black text-foreground">
                {lang === 'ar' ? 'رابط متجر إلكتروني وتلقي طلبات الواتساب 💬' : 'Dedicated Store Link & WhatsApp Orders 💬'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'ar'
                  ? 'رابط مخصص لمكتبتك waraqconnect.com/stores/your-store تشاركه مع متابعيك، وتصلك طلبات الكتب مهيأة بالكامل على محادثة الواتساب.'
                  : 'Get a clean custom bookstore link to share on social media. Customer orders arrive organized on WhatsApp with addresses & totals.'}
              </p>
            </div>

            {/* 6. Production Order Tracking */}
            <div className="p-5 rounded-2xl bg-card border border-border/80 hover:border-blue-500/40 hover:shadow-md transition-all space-y-3 group">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Truck className="h-5 w-5" />
                </div>
                <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                  {lang === 'ar' ? 'تتبع طلبات حقيقي 🚚' : 'Live Order Tracking'}
                </Badge>
              </div>
              <h3 className="text-sm font-black text-foreground">
                {lang === 'ar' ? 'متابعة مراحل الشحن وروابط تتبع مباشرة 🚚' : 'Live Order Lifecycle & Tracking Links 🚚'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'ar'
                  ? 'تابع طلباتك من الاستلام والتجهيز حتى خروج المندوب، مع رابط تتبع إنتاج مباشر لكل عميل لمتابعة خط سير كتبه.'
                  : 'Manage order status (NEW, CONFIRMED, DISPATCHED, DELIVERED) with live tracking URLs for customers to monitor fulfillment.'}
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Onboarding Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* FAST LOGIN GATE FOR STORE REGISTRATION */}
            {currentUser ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground">
                        {lang === 'ar' ? 'تم تسجيل الدخول وتوثيق ملكية المتجر بنجاح' : 'Authenticated & Store Ownership Linked'}
                      </p>
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        {lang === 'ar' ? 'حساب نشط ✓' : 'Active Account ✓'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      <span className="font-semibold text-foreground">{(currentUser.profile as any)?.full_name || ownerName || 'شريك معتمد'}</span>{' '}
                      (<span className="font-mono text-emerald-600 dark:text-emerald-400">{currentUser.email}</span>)
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    setCurrentUser(null)
                  }}
                  className="text-[11px] text-muted-foreground hover:text-destructive h-8 px-2.5 rounded-xl cursor-pointer"
                >
                  {lang === 'ar' ? 'تبديل الحساب' : 'Switch Account'}
                </Button>
              </div>
            ) : (
              <div
                ref={fastLoginRef}
                className="scroll-mt-24 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-primary/10 via-card to-background border-2 border-primary/40 shadow-md space-y-4 animate-in fade-in"
              >
                <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-xl bg-primary text-primary-foreground">
                        <Lock className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-foreground">
                        {lang === 'ar' ? 'تسجيل الدخول السريع لتوثيق المتجر ⚡ (مطلوب أولاً)' : 'Fast Sign In Required to Register Store ⚡'}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {lang === 'ar'
                        ? 'لضمان حماية حقوق المكتبة وتفعيل صلاحيات لوحة التحكم فور الاعتماد، يرجى تسجيل الدخول أو إنشاء حسابك أولاً بنقرة واحدة:'
                        : 'To protect store ownership and grant instant merchant dashboard access upon approval, please sign in first:'}
                    </p>
                  </div>
                  <Badge className="bg-primary/15 text-primary border border-primary/30 text-[10px] font-bold shrink-0">
                    {lang === 'ar' ? 'خطوة أولى 🔑' : 'Step 1 of 2 🔑'}
                  </Badge>
                </div>

                {fastAuthError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{fastAuthError}</span>
                  </div>
                )}

                {/* 1-Click Google Sign In */}
                <Button
                  type="button"
                  onClick={handleFastGoogleLogin}
                  disabled={fastAuthGoogleLoading || fastAuthLoading}
                  className="w-full h-11 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-100 border-2 border-slate-200 dark:border-slate-700 font-black text-xs sm:text-sm shadow-sm gap-2.5 transition-all cursor-pointer"
                >
                  {fastAuthGoogleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <GoogleIcon className="h-5 w-5 shrink-0" />
                  )}
                  <span>{lang === 'ar' ? 'المتابعة بنقرة واحدة بحساب Google 🚀' : 'Continue in 1-Click with Google 🚀'}</span>
                </Button>

                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-border w-full" />
                  <span className="bg-card px-3 text-[11px] font-bold text-muted-foreground shrink-0">
                    {lang === 'ar' ? 'أو بالبريد الإلكتروني وكلمة المرور' : 'Or with Email & Password'}
                  </span>
                  <div className="border-t border-border w-full" />
                </div>

                {/* Mode Switcher Tabs */}
                <div className="flex p-1 rounded-xl bg-muted/60 border border-border">
                  <button
                    type="button"
                    onClick={() => { setFastAuthMode('login'); setFastAuthError(null); }}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer",
                      fastAuthMode === 'login' ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {lang === 'ar' ? 'تسجيل الدخول (حساب حالي)' : 'Log In (Existing)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFastAuthMode('register'); setFastAuthError(null); }}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer",
                      fastAuthMode === 'register' ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {lang === 'ar' ? 'إنشاء حساب جديد للمتجر' : 'Create New Account'}
                  </button>
                </div>

                {/* Inline Fast Email & Password Form */}
                <form onSubmit={handleFastEmailAuth} className="space-y-3 pt-1">
                  {fastAuthMode === 'register' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span>{lang === 'ar' ? 'اسم صاحب المتجر / المسؤول *' : 'Manager / Owner Full Name *'}</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fastAuthName}
                        onChange={e => setFastAuthName(e.target.value)}
                        placeholder={lang === 'ar' ? 'محمد خالد' : 'John Doe'}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      <span>{lang === 'ar' ? 'البريد الإلكتروني *' : 'Email Address *'}</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={fastAuthEmail}
                      onChange={e => setFastAuthEmail(e.target.value)}
                      placeholder="store@example.com"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-primary" />
                      <span>{lang === 'ar' ? 'كلمة المرور * (6 أحرف فأكثر)' : 'Password * (min 6 chars)'}</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showFastPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={fastAuthPassword}
                        onChange={e => setFastAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFastPassword(!showFastPassword)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                      >
                        {showFastPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={fastAuthLoading || fastAuthGoogleLoading}
                    className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs gap-2 shadow-xs cursor-pointer mt-1"
                  >
                    {fastAuthLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span>
                      {fastAuthMode === 'login'
                        ? (lang === 'ar' ? 'تسجيل الدخول وفتح نموذج المتجر ⚡' : 'Log In & Unlock Form ⚡')
                        : (lang === 'ar' ? 'إنشاء الحساب ومتابعة التسجيل 🚀' : 'Create Account & Continue 🚀')}
                    </span>
                  </Button>
                </form>
              </div>
            )}

            {/* Step Indicators */}
            <div ref={formTopRef} className="scroll-mt-24 flex items-center justify-between p-2 rounded-2xl bg-muted/40 border border-border">
              {[
                { step: 1, titleAr: '1. الهوية والبراند', titleEn: '1. Identity' },
                { step: 2, titleAr: '2. التواجد والموقع', titleEn: '2. Location & Hours' },
                { step: 3, titleAr: '3. التواصل والتوثيق والعقد', titleEn: '3. WhatsApp & Contract' },
              ].map(s => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => goToStep(s.step as any)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer",
                    activeStep === s.step
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {lang === 'ar' ? s.titleAr : s.titleEn}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-card border-2 border-border/80 shadow-sm space-y-6">
              {formErrorMessage && (
                <div className="p-4 rounded-2xl bg-destructive/10 border-2 border-destructive/30 text-destructive flex items-center gap-3 animate-in fade-in">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-black">{formErrorMessage}</p>
                    <p className="text-[11px] opacity-80">
                      {lang === 'ar' ? 'يرجى مراجعة الحقول المميزة باللون الأحمر وإكمالها للمتابعة.' : 'Please review and fill the highlighted fields in red below.'}
                    </p>
                  </div>
                </div>
              )}
              {/* STEP 1: STORE IDENTITY & BRANDING */}
              {activeStep === 1 && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="border-b pb-3">
                    <h2 className="text-base font-black text-foreground flex items-center gap-2">
                      <Store className="h-5 w-5 text-primary" />
                      <span>{lang === 'ar' ? 'الخطوة 1: هوية المكتبة والبيانات الأساسية' : 'Step 1: Store Identity & Branding'}</span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lang === 'ar' ? 'حدد اسم المكتبة والمسؤول وكيف ستظهر للجمهور' : 'Define your bookstore brand name, manager, and reader tagline'}
                    </p>
                  </div>

                  {/* Store Format Selection (Online vs Physical vs Both) */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-foreground block">
                      {lang === 'ar' ? 'طبيعة تواجد المتجر / المكتبة *' : 'Store Operating Format *'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        {
                          val: 'ONLINE',
                          titleAr: '🌐 متجر أونلاين فقط',
                          titleEn: '🌐 Online Only',
                          descAr: 'شحن وتوصيل لجميع المحافظات',
                          descEn: 'Ships to all governorates',
                        },
                        {
                          val: 'OFFLINE',
                          titleAr: '📍 فرع ومقر فعلي',
                          titleEn: '📍 Physical Store',
                          descAr: 'محل يستقبل الزوار والقراء',
                          descEn: 'Walk-in bookshop branch',
                        },
                        {
                          val: 'BOTH',
                          titleAr: '🛍️ كلاهما (فرع + أونلاين)',
                          titleEn: '🛍️ Hybrid Both',
                          descAr: 'فرع فعلي ومبيعات أونلاين',
                          descEn: 'Physical shop & online shipping',
                        },
                      ].map(opt => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setStoreType(opt.val as StoreType)}
                          className={cn(
                            "p-3.5 rounded-2xl border-2 text-start transition-all cursor-pointer flex flex-col gap-1",
                            storeType === opt.val
                              ? "border-primary bg-primary/10 text-primary shadow-xs font-black"
                              : "border-border bg-background hover:border-primary/40 text-foreground font-semibold"
                          )}
                        >
                          <span className="text-xs">{lang === 'ar' ? opt.titleAr : opt.titleEn}</span>
                          <span className="text-[10px] text-muted-foreground leading-tight">{lang === 'ar' ? opt.descAr : opt.descEn}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Names */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-foreground">
                        {lang === 'ar' ? 'اسم المكتبة بالعربية *' : 'Bookstore Name (Arabic) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={storeNameAr}
                        onChange={e => {
                          setStoreNameAr(e.target.value)
                          clearFieldError('storeNameAr')
                        }}
                        placeholder={lang === 'ar' ? 'مثال: مكتبة الحكمة، بوكستور القراء...' : 'e.g. Al-Hikma Bookstore'}
                        className={cn(
                          "w-full rounded-xl border px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2",
                          formErrors.storeNameAr
                            ? "border-destructive bg-destructive/5 focus:ring-destructive/30 ring-1 ring-destructive/30"
                            : "border-border bg-background focus:ring-primary/30"
                        )}
                      />
                      {formErrors.storeNameAr && (
                        <span className="text-[11px] font-bold text-destructive block mt-1">{formErrors.storeNameAr}</span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-foreground">
                        {lang === 'ar' ? 'اسم المكتبة بالإنجليزية (اختياري)' : 'Store Name (English / Handle)'}
                      </label>
                      <input
                        type="text"
                        value={storeNameEn}
                        onChange={e => setStoreNameEn(e.target.value)}
                        placeholder="e.g. Hikma Books / @hikmabooks"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-foreground">
                        {lang === 'ar' ? 'اسم المالك أو المسؤول المعتمد *' : 'Owner / Manager Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={ownerName}
                        onChange={e => {
                          setOwnerName(e.target.value)
                          clearFieldError('ownerName')
                        }}
                        placeholder={lang === 'ar' ? 'مثال: عمر خالد المنشاوي' : 'e.g. Omar Khaled'}
                        className={cn(
                          "w-full rounded-xl border px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2",
                          formErrors.ownerName
                            ? "border-destructive bg-destructive/5 focus:ring-destructive/30 ring-1 ring-destructive/30"
                            : "border-border bg-background focus:ring-primary/30"
                        )}
                      />
                      {formErrors.ownerName && (
                        <span className="text-[11px] font-bold text-destructive block mt-1">{formErrors.ownerName}</span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-foreground">
                        {lang === 'ar' ? 'شعار المتجر أو العبارة الترويجية (اختياري)' : 'Store Tagline / Slogan (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={slogan}
                        onChange={e => setSlogan(e.target.value)}
                        placeholder={lang === 'ar' ? 'مثال: كتبك المفضلة حتى باب بيتك' : 'e.g. Your gateway to rare reads'}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  {/* Description / Bio */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-primary" />
                        <span>{lang === 'ar' ? 'نبذة عن المكتبة وتخصصاتها ونوعية الكتب *' : 'Store Bio & Curated Categories *'}</span>
                      </label>
                      <span
                        className={cn(
                          "text-[11px] font-bold transition-colors",
                          description.trim().length >= 15
                            ? "text-emerald-600 dark:text-emerald-400"
                            : formErrors.description
                            ? "text-destructive"
                            : "text-muted-foreground"
                        )}
                      >
                        {description.trim().length} / 15 {lang === 'ar' ? 'حرف كحد أدنى' : 'chars min'}
                        {description.trim().length >= 15 ? ' ✓' : ''}
                      </span>
                    </div>
                    <textarea
                      required
                      value={description}
                      onChange={e => {
                        setDescription(e.target.value)
                        if (e.target.value.trim().length >= 15) {
                          clearFieldError('description')
                        }
                      }}
                      placeholder={lang === 'ar'
                        ? 'أخبر القراء عن متجرك: تاريخ التأسيس، نوعية الكتب (روايات، كتب دينية، تطوير ذات، كتب مستعملة نادرة، كتب أطفال)، وخدمات التوصيل...'
                        : 'Describe your store specialty: genres (fiction, spiritual, self-help, rare used editions, university books), dispatch times...'}
                      rows={3}
                      className={cn(
                        "w-full rounded-xl border p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 resize-none leading-relaxed transition-all",
                        formErrors.description
                          ? "border-destructive bg-destructive/5 focus:ring-destructive/30 ring-1 ring-destructive/30"
                          : "border-border bg-background focus:ring-primary/30"
                      )}
                    />
                    {formErrors.description && (
                      <span className="text-[11px] font-bold text-destructive block mt-1">
                        {formErrors.description}
                      </span>
                    )}
                  </div>

                  {/* Square & Catchy Visual Identity Upload Cards */}
                  <div className="space-y-4 p-5 sm:p-6 rounded-3xl bg-muted/20 border-2 border-border/80 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div>
                        <span className="text-xs sm:text-sm font-black text-foreground flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span>{lang === 'ar' ? 'هوية المتجر البصرية: الشعار والغلاف (مربع وجذاب 1:1)' : 'Store Visual Identity: Logo & Cover (Square & Catchy)'}</span>
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {lang === 'ar' ? 'بطاقات مربعة عصرية بنسبة 1:1 تدعم السحب والإفلات والضغط الفوري WebP لتسريع متجرك' : 'Modern 1:1 square cards with drag & drop and instant WebP optimization'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {/* <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          ⚡ ضغط فوري WebP
                        </span> */}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* CARD 1: SQUARE LOGO */}
                      <SquareImageUpload
                        label={lang === 'ar' ? 'شعار المتجر الرسمي' : 'Official Store Logo'}
                        subLabel={lang === 'ar' ? 'اسحب شعارك هنا أو اضغط للاختيار' : 'Drop store logo here or click to browse'}
                        value={logoUrl}
                        onChange={setLogoUrl}
                        onRemove={() => setLogoUrl('')}
                        folder="logos"
                        userId={user?.id}
                        theme="primary"
                        tagText={lang === 'ar' ? '✨ الشعار المربع (1:1)' : '✨ Square Logo (1:1)'}
                        resolutionHint="Square 1:1 (400×400+)"
                        presets={DEFAULT_LOGOS}
                        lang={lang}
                        required
                      />

                      {/* CARD 2: SQUARE COVER */}
                      <SquareImageUpload
                        label={lang === 'ar' ? 'غلاف واجهة المتجر' : 'Storefront Cover Banner'}
                        subLabel={lang === 'ar' ? 'اسحب صورة الغلاف هنا أو اضغط للاختيار' : 'Drop store cover here or click to browse'}
                        value={coverUrl}
                        onChange={setCoverUrl}
                        onRemove={() => setCoverUrl('')}
                        folder="covers"
                        userId={user?.id}
                        theme="emerald"
                        tagText={lang === 'ar' ? '🎨 الغلاف المربع (1:1)' : '🎨 Square Cover (1:1)'}
                        resolutionHint="Square 1:1 (800×800+)"
                        presets={DEFAULT_COVERS}
                        lang={lang}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="w-full rounded-xl font-black text-xs py-3 gap-2 cursor-pointer bg-primary text-primary-foreground"
                  >
                    <span>{lang === 'ar' ? 'المتابعة للخطوة 2: الفروع والموقع والمواعيد' : 'Next: Location & Working Hours'}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* STEP 2: LOCATION, MAP & WORKING HOURS */}
              {activeStep === 2 && (
                <div className="space-y-5 animate-in fade-in">
                  {storeType === 'ONLINE' ? (
                    <div className="border-b pb-3">
                      <h2 className="text-base font-black text-foreground flex items-center gap-2">
                        <Globe className="h-5 w-5 text-emerald-600" />
                        <span>{lang === 'ar' ? 'الخطوة 2: مركز التوزيع ونطاق الشحن وساعات الخدمة' : 'Step 2: Dispatch Hub, Shipping Scope & Hours'}</span>
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lang === 'ar'
                          ? 'بما أن متجرك إلكتروني أونلاين، لا حاجة لعنوان تفصيلي أو رابط خريطة. حدد مركز الانطلاق ونطاق التوصيل وساعات العمل.'
                          : 'Online boutique: no physical walk-in location or Google Maps pin needed.'}
                      </p>
                    </div>
                  ) : (
                    <div className="border-b pb-3">
                      <h2 className="text-base font-black text-foreground flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <span>{lang === 'ar' ? 'الخطوة 2: المقر الفعلي، خريطة جوجل، وساعات العمل' : 'Step 2: Physical Store, Google Map & Hours'}</span>
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lang === 'ar' ? 'حدد مقر المكتبة، رابط الخريطة، وأوقات استقبال واستقبال طلبات الزوار' : 'Define your store address, Google Maps pin, and working hours'}
                      </p>
                    </div>
                  )}

                  {/* Online store friendly callout banner */}
                  {storeType === 'ONLINE' && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-start gap-3">
                      <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div className="text-xs space-y-1">
                        <p className="font-black text-foreground">
                          {lang === 'ar' ? 'متجر إلكتروني أونلاين بالكامل — بدون مقر للزيارات' : '100% Online Store — No Walk-in Location Needed'}
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          {lang === 'ar'
                            ? 'تم إعفاء متجرك تلقائياً من إدخال الحي أو العنوان التفصيلي أو رابط خرائط جوجل. نكتفي فقط بمعرفة محافظة مركز الشحن الرئيسي لتنظيم مواعيد التوصيل للقراء.'
                            : 'District, street address, and Google Maps pin are waived for online stores. Only your shipping hub city is required.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Physical Store Location Inputs (HIDDEN for ONLINE stores) */}
                  {storeType !== 'ONLINE' ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Governorate / City */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-foreground">
                            {lang === 'ar' ? 'المحافظة / المدينة *' : 'Governorate / City *'}
                          </label>
                          <select
                            value={city}
                            onChange={e => {
                              setCity(e.target.value)
                              setDistrict('')
                            }}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          >
                            {EGYPT_GOVERNORATES.map(gov => (
                              <option key={gov} value={gov}>{gov}</option>
                            ))}
                          </select>
                        </div>

                        {/* District */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-foreground">
                              {lang === 'ar' ? 'الحي / المنطقة *' : 'District / Area *'}
                            </label>
                            {district && (
                              <span className="text-[10px] text-emerald-600 font-bold">
                                {district}
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            list="districts-autocomplete-list"
                            value={district}
                            onChange={e => {
                              setDistrict(e.target.value)
                              clearFieldError('district')
                            }}
                            placeholder={lang === 'ar' ? 'اختر من الاقتراحات أو اكتب الحي (المعادي، سموحة، الدقي...)' : 'Pick from list or type (Maadi, Smouha, Dokki...)'}
                            className={cn(
                              "w-full rounded-xl border px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2",
                              formErrors.district
                                ? "border-destructive bg-destructive/5 focus:ring-destructive/30 ring-1 ring-destructive/30"
                                : "border-border bg-background focus:ring-primary/30"
                            )}
                          />
                          {formErrors.district && (
                            <span className="text-[11px] font-bold text-destructive block mt-1">{formErrors.district}</span>
                          )}
                          <datalist id="districts-autocomplete-list">
                            {availableDistricts.map(dist => (
                              <option key={dist} value={dist} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      {/* Quick Select Popular Districts Chips */}
                      {topDistricts.length > 0 && (
                        <div className="space-y-1.5 p-3 rounded-2xl bg-muted/30 border border-border/60">
                          <div className="text-[11px] font-bold text-foreground flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                              <span>{lang === 'ar' ? `أشهر أحياء ${city.split(' ')[0]} (انقر للاختيار المباشر):` : `Popular ${city} districts (1-click select):`}</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground font-normal">
                              {lang === 'ar' ? 'أو اكتب حيك إذا لم يكن بالقائمة' : 'or type yours'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {topDistricts.map(dist => {
                              const isSelected = district === dist
                              return (
                                <button
                                  key={dist}
                                  type="button"
                                  onClick={() => setDistrict(dist)}
                                  className={cn(
                                    "text-xs px-2.5 py-1 rounded-lg border transition-all text-start cursor-pointer",
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary font-black shadow-xs scale-102"
                                      : "bg-background hover:bg-primary/10 hover:border-primary/40 border-border text-foreground font-medium"
                                  )}
                                >
                                  {dist}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Street Address */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-foreground">
                          {lang === 'ar' ? 'العنوان التفصيلي وأقرب معلم رئيسي' : 'Detailed Street Address & Landmark'}
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          placeholder={lang === 'ar' ? 'مثال: 15 شارع 9، بجوار محطة مترو المعادي' : 'e.g. 15 St 9, near Maadi Metro Station'}
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>

                      {/* Interactive Leaflet Map Location Picker */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-emerald-600" />
                            <span>{lang === 'ar' ? 'تحديد موقع المقر الفعلي على الخريطة التفاعلية (الموقع الدقيق) *' : 'Pin Exact Location on Interactive Map *'}</span>
                          </label>
                          {hasPickedOnMap && (
                            <Badge className="bg-emerald-600 text-white text-[10px] gap-1 font-bold">
                              <Check className="h-3 w-3" />
                              <span>{lang === 'ar' ? 'تم تثبيت الموقع GPS' : 'GPS Pinned'}</span>
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {lang === 'ar'
                            ? '💡 انقر على الخريطة لتثبيت دبوس موقع مكتبتك بدقة. هذا الإجراء يكفي 100% لتحديد إحداثيات GPS الدقيقة وحساب المسافة للقراء، ويقوم النظام بتوليد رابط التوجيه بخرائط Google تلقائياً دون الحاجة لإدخال رابط يدوي.'
                            : '💡 Drop a pin on the map. This is 100% sufficient to capture GPS coordinates, calculate reader distances, and auto-generate Google Maps navigation.'}
                        </p>
                        <div className="rounded-2xl overflow-hidden border-2 border-border shadow-xs">
                          <MapLocationPicker
                            latitude={latitude}
                            longitude={longitude}
                            showHubOption={false}
                            height="320px"
                            lang={lang}
                            onLocationSelect={(coords: MapCoordinates) => {
                              setLatitude(coords.lat)
                              setLongitude(coords.lng)
                              setHasPickedOnMap(true)
                              if (coords.address && !address) {
                                setAddress(coords.address)
                              }
                              setGoogleMapsUrl(`https://www.google.com/maps?q=${coords.lat},${coords.lng}`)
                            }}
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                          <span>{lang === 'ar' ? '📍 انقر على موقع مكتبتك أو ابحث في شريط الخريطة لتثبيت الدبوس.' : '📍 Click to drop a pin or search by street name.'}</span>
                          {latitude && longitude && (
                            <span className="font-mono text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md" dir="ltr">
                              {latitude.toFixed(4)}, {longitude.toFixed(4)}
                            </span>
                          )}
                        </div>

                        {latitude && longitude && (
                          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span className="font-bold">{lang === 'ar' ? 'رابط توجيه خرائط Google جاهز تلقائياً:' : 'Google Maps route ready:'}</span>
                            </div>
                            <a
                              href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors shadow-xs"
                            >
                              <span>{lang === 'ar' ? 'معاينة الموقع في خرائط Google' : 'Preview on Google Maps'}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Optional Google Business Profile Link */}
                      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-primary shrink-0" />
                            <div>
                              <label className="text-xs font-black text-foreground block">
                                {lang === 'ar' ? 'رابط صفحة Google Business المعتمدة (اختياري)' : 'Google Business Profile Link (Optional)'}
                              </label>
                              <span className="text-[10px] text-muted-foreground block">
                                {lang === 'ar'
                                  ? 'إذا كانت لمكتبتك صفحة موثقة على خرائط جوجل تحتوي على تقييمات وصور خاصة، يمكنك لصق الرابط هنا.'
                                  : 'If your bookstore has a verified Google Business listing with reviews and photos, paste it here.'}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0 font-medium">
                            {lang === 'ar' ? 'اختياري تماماً' : 'Optional'}
                          </Badge>
                        </div>

                        <input
                          type="url"
                          value={googleMapsUrl}
                          onChange={e => setGoogleMapsUrl(e.target.value)}
                          placeholder="https://maps.app.goo.gl/... أو https://google.com/maps/place/..."
                          className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                          dir="ltr"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          {lang === 'ar'
                            ? '✨ إذا تركت هذا الحقل فارغاً، فسيتم تلقائياً استخدام إحداثيات الخريطة التفاعلية أعلاه لتوجيه القراء لمكتبتك عبر تطبيق خرائط Google.'
                            : '✨ If left blank, the interactive map coordinates will be automatically used to route readers to your bookstore.'}
                        </p>
                      </div>
                    </>
                  ) : (
                    /* ONLINE STORE: Only Dispatch City */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                          <Building className="h-4 w-4 text-emerald-600" />
                          <span>{lang === 'ar' ? 'مركز التوزيع والشحن الرئيسي (المحافظة) *' : 'Dispatch Hub (Governorate) *'}</span>
                        </label>
                        <select
                          value={city}
                          onChange={e => setCity(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          {EGYPT_GOVERNORATES.map(gov => (
                            <option key={gov} value={gov}>{gov}</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-muted-foreground">
                          {lang === 'ar' ? 'المحافظة التي تنطلق منها شحنات الكتب للقراء لتحديد سرعة التوصيل' : 'Governorate from which packages are dispatched'}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                          <Truck className="h-4 w-4 text-blue-600" />
                          <span>{lang === 'ar' ? 'نطاق الشحن والتوصيل المتاح *' : 'Available Delivery Scope *'}</span>
                        </label>
                        <select
                          value={shippingScope}
                          onChange={e => setShippingScope(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="شحن لجميع المحافظات (All Egypt)">{lang === 'ar' ? 'شحن لجميع محافظات مصر (27 محافظة)' : 'Nationwide All Egypt (27 Govs)'}</option>
                          <option value="شحن محلي فقط داخل المحافظة">{lang === 'ar' ? 'توصيل محلي داخل المحافظة فقط' : 'Local City Delivery Only'}</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Physical Store Shipping Scope */}
                  {storeType !== 'ONLINE' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <span>{lang === 'ar' ? 'خيارات الشحن والاستلام' : 'Pickup & Delivery Scope'}</span>
                      </label>
                      <select
                        value={shippingScope}
                        onChange={e => setShippingScope(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="شحن لجميع المحافظات (All Egypt)">{lang === 'ar' ? 'شحن لجميع محافظات مصر + استلام من المقر' : 'Nationwide Delivery + Store Pickup'}</option>
                        <option value="شحن محلي فقط داخل المحافظة">{lang === 'ar' ? 'توصيل محلي داخل المحافظة فقط + استلام من الفرع' : 'Local Delivery Only + Pickup'}</option>
                        <option value="استلام من المقر فقط دون شحن">{lang === 'ar' ? 'استلام من المقر فقط دون شحن (Pickup Only)' : 'In-Store Pickup Only'}</option>
                      </select>
                    </div>
                  )}

                  {/* DEDICATED WORKING HOURS TIME PICKER (HOURS ONLY) */}
                  <div className="space-y-3 rounded-2xl border-2 border-border/80 bg-muted/20 p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>{lang === 'ar' ? 'مواعيد العمل واستقبال الطلبات (منتقي الساعات) *' : 'Operating Hours & Order Intake (Time Picker) *'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsManualHoursEdit(!isManualHoursEdit)}
                        className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        {isManualHoursEdit
                          ? (lang === 'ar' ? '↶ العودة لمنتقي الساعات' : '↶ Use Time Picker')
                          : (lang === 'ar' ? '✍️ كتابة صيغة مخصصة يدوياً' : '✍️ Custom Text')}
                      </button>
                    </div>

                    {!isManualHoursEdit ? (
                      <div className="space-y-3">
                        {/* Weekly Days Preset */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-muted-foreground">
                            {lang === 'ar' ? 'جدول أيام العمل الأسبوعية:' : 'Weekly Schedule Days:'}
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { id: 'DAILY', labelAr: 'يومياً طوال الأسبوع', labelEn: 'Daily All Week' },
                              { id: 'SAT_THU', labelAr: 'السبت إلى الخميس', labelEn: 'Sat - Thu (Fri off)' },
                              { id: 'SUN_THU', labelAr: 'الأحد إلى الخميس', labelEn: 'Sun - Thu' },
                              { id: '24_7', labelAr: '24/7 على مدار الساعة', labelEn: '24/7 Round Clock' },
                            ].map(opt => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setDaysSchedule(opt.id as any)}
                                className={cn(
                                  'rounded-xl px-2.5 py-2 text-xs font-bold transition-all text-center border cursor-pointer',
                                  daysSchedule === opt.id
                                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                                )}
                              >
                                {lang === 'ar' ? opt.labelAr : opt.labelEn}
                              </button>
                            ))}
                          </div>
                        </div>

                        {daysSchedule !== '24_7' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* Opening Hour */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
                                <span>{lang === 'ar' ? 'ساعة الفتح / بدء استقبال الطلبات:' : 'Opening / Start Hour:'}</span>
                                <span className="text-primary font-mono text-xs font-black">{formatHour12(openHour, lang === 'ar')}</span>
                              </label>
                              <input
                                type="time"
                                value={openHour}
                                onChange={e => setOpenHour(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                            </div>

                            {/* Closing Hour */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
                                <span>{lang === 'ar' ? 'ساعة الإغلاق / انتهاء العمل:' : 'Closing / End Hour:'}</span>
                                <span className="text-primary font-mono text-xs font-black">{formatHour12(closeHour, lang === 'ar')}</span>
                              </label>
                              <input
                                type="time"
                                value={closeHour}
                                onChange={e => setCloseHour(e.target.value)}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                            </div>
                          </div>
                        )}

                        {/* Live Formatted Badge */}
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs">
                          <Clock className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-muted-foreground">{lang === 'ar' ? 'الصيغة المعتمدة:' : 'Schedule Format:'}</span>
                          <span className="font-black text-foreground">{formattedWorkingHours}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={customScheduleText || workingHours}
                          onChange={e => {
                            setCustomScheduleText(e.target.value)
                            setWorkingHours(e.target.value)
                          }}
                          placeholder={lang === 'ar' ? 'مثال: السبت إلى الخميس: 10:00 ص - 11:00 م | الجمعة 2:00 م - 11:00 م' : 'e.g. Sat-Thu: 10 AM - 11 PM, Fri: 2 PM - 11 PM'}
                          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => goToStep(1)}
                      className="rounded-xl font-bold text-xs"
                    >
                      {lang === 'ar' ? 'السابق' : 'Back'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => goToStep(3)}
                      className="flex-1 rounded-xl font-black text-xs py-3 gap-2 cursor-pointer bg-primary text-primary-foreground"
                    >
                      <span>{lang === 'ar' ? 'المتابعة للخطوة 3: الواتساب والعقد وقنوات التواصل' : 'Next: WhatsApp, Social & Contract'}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: WHATSAPP, PHONE & SOCIAL CHANNELS */}
              {activeStep === 3 && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="border-b pb-3">
                    <h2 className="text-base font-black text-foreground flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-emerald-600" />
                      <span>{lang === 'ar' ? 'الخطوة 3: الواتساب للطلبات وقنوات التحقق ومكافحة السبام' : 'Step 3: WhatsApp & Social Verification'}</span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lang === 'ar' ? 'قنوات التواصل هي الرابط الأساسي بينك وبين القراء لتلقي الطلبات وتوثيق المتجر' : 'Direct customer ordering routing & anti-spam verification'}
                    </p>
                  </div>

                  {/* Primary WhatsApp & Phone */}
                  {/* Primary WhatsApp & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* WhatsApp */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                          <MessageCircle className="h-4 w-4 text-emerald-600" />
                          <span>{lang === 'ar' ? 'رقم واتساب الأعمال لاستقبال الطلبات *' : 'WhatsApp Business (Orders) *'}</span>
                        </label>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={11}
                        pattern="[0-9]{11}"
                        required
                        value={whatsapp}
                        onChange={e => {
                          const cleaned = sanitizePhoneInput(e.target.value)
                          setWhatsapp(cleaned)
                          if (validatePhone(cleaned).isValid) {
                            clearFieldError('whatsapp')
                          }
                        }}
                        placeholder="01012345678"
                        className={cn(
                          "w-full rounded-xl border px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 font-mono transition-all",
                          formErrors.whatsapp
                            ? "border-destructive bg-destructive/5 focus:ring-destructive/30 ring-1 ring-destructive/30"
                            : "border-border bg-background focus:ring-emerald-500/30"
                        )}
                        dir="ltr"
                      />
                      {formErrors.whatsapp ? (
                        <span className="text-[11px] font-bold text-destructive block mt-1">{formErrors.whatsapp}</span>
                      ) : (
                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {lang === 'ar' ? 'يتم تحويل طلبات القراء عليه مباشرة (11 رقماً)' : 'Customer orders routed here (11 digits)'}
                          </span>
                          {validatePhone(whatsapp).isValid && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              ✓ {validatePhone(whatsapp).label}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Direct Phone */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-primary" />
                          <span>{lang === 'ar' ? 'رقم هاتف الاتصال المباشر *' : 'Direct Phone Number *'}</span>
                        </label>
                        {whatsapp && whatsapp !== phone && (
                          <button
                            type="button"
                            onClick={() => {
                              setPhone(whatsapp)
                              clearFieldError('phone')
                            }}
                            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Copy className="h-3 w-3" />
                            {lang === 'ar' ? 'نفس رقم الواتساب' : 'Same as WhatsApp'}
                          </button>
                        )}
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={11}
                        pattern="[0-9]{11}"
                        required
                        value={phone}
                        onChange={e => {
                          const cleaned = sanitizePhoneInput(e.target.value)
                          setPhone(cleaned)
                          if (validatePhone(cleaned).isValid) {
                            clearFieldError('phone')
                          }
                        }}
                        placeholder="01099887766"
                        className={cn(
                          "w-full rounded-xl border px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 font-mono transition-all",
                          formErrors.phone
                            ? "border-destructive bg-destructive/5 focus:ring-destructive/30 ring-1 ring-destructive/30"
                            : "border-border bg-background focus:ring-primary/30"
                        )}
                        dir="ltr"
                      />
                      {formErrors.phone ? (
                        <span className="text-[11px] font-bold text-destructive block mt-1">{formErrors.phone}</span>
                      ) : (
                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {lang === 'ar' ? 'للتواصل الفوري من إدارة المنصة (11 رقماً)' : 'For admin direct contact (11 digits)'}
                          </span>
                          {validatePhone(phone).isValid && (
                            <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                              ✓ {validatePhone(phone).label}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notification & Verification Email */}
                  <div className="space-y-1.5 p-3.5 sm:p-4 rounded-2xl bg-primary/5 border border-primary/25">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-primary" />
                        <span>{lang === 'ar' ? 'البريد الإلكتروني المعتمد لإشعارات المتجر وتوثيقه *' : 'Official Store Notification & Approval Email *'}</span>
                      </label>
                      <span className="text-[10px] text-primary font-bold">
                        {lang === 'ar' ? 'ضروري لإرسال رابط التفعيل' : 'For Dashboard & Approval Email'}
                      </span>
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value)
                        clearFieldError('email')
                      }}
                      placeholder={lang === 'ar' ? 'store@example.com (ستصلك عليه رسالة الاعتماد الرسمية فور المراجعة)' : 'store@example.com'}
                      className={cn(
                        "w-full rounded-xl border px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 font-mono",
                        formErrors.email
                          ? "border-destructive bg-destructive/5 focus:ring-destructive/30 ring-1 ring-destructive/30"
                          : "border-border bg-background focus:ring-primary/30"
                      )}
                      dir="ltr"
                    />
                    {formErrors.email && (
                      <span className="text-[11px] font-bold text-destructive block mt-1">{formErrors.email}</span>
                    )}
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {lang === 'ar'
                        ? '✉️ فور اعتماد ومراجعة متجرك، ستصلك رسالة رسمية على هذا البريد برابط لوحة تحكم المتجر لإضافة الكتب، عروض التوفير، وباقات الكتب.'
                        : '✉️ Once verified, you will receive an official approval email here with direct access to your bookstore dashboard.'}
                    </p>

                    {/* Seamless Inline Account Password for 1-Click Submission */}
                    {!currentUser && (
                      <div className="pt-3 border-t border-primary/20 space-y-2 mt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-primary" />
                            <span>{lang === 'ar' ? 'كلمة مرور حساب المتجر (اختياري للتقديم الفوري ⚡)' : 'Store Account Password (Optional for 1-Click Submit ⚡)'}</span>
                          </label>
                          <span className="text-[10px] text-primary font-bold">
                            {lang === 'ar' ? 'تقديم فوري بنقرة واحدة' : 'Instant 1-Click Submit'}
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type={showQuickPassword ? 'text' : 'password'}
                            value={accountPassword}
                            onChange={e => setAccountPassword(e.target.value)}
                            placeholder={lang === 'ar' ? 'اختر كلمة مرور (6 أحرف فأكثر) للربط والإرسال المباشر' : 'Choose a password (min 6 chars) to submit in 1-click'}
                            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowQuickPassword(!showQuickPassword)}
                            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                          >
                            {showQuickPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {lang === 'ar'
                            ? '💡 بكتابة كلمة المرور هنا، سيتم إنشاء حسابك أو تسجيل دخولك تلقائياً وإرسال الطلب فوراً دون الحاجة لأي نوافذ منبثقة.'
                            : '💡 Entering a password here links your store and submits the application immediately without any popup.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Social Media Links for Anti-Spam Check & Existence Proof */}
                  <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span>{lang === 'ar' ? 'قنوات التحقق وإثبات وجود المكتبة (مهم للتوثيق)' : 'Store Existence Proof & Social Channels'}</span>
                      </span>
                      <span className="text-[10px] text-primary font-bold">{lang === 'ar' ? 'إثبات التواجد' : 'Existence Proof'}</span>
                    </div>

                    {formErrors.socialProof && (
                      <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{formErrors.socialProof}</span>
                      </div>
                    )}
                    {/* Existence Proof Notification Banner */}
                    <div className={cn(
                      "p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 transition-colors",
                      hasSocialProof
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold"
                    )}>
                      <div className="flex items-center gap-2">
                        {hasSocialProof ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                        )}
                        <span className="leading-snug">
                          {hasSocialProof
                            ? (lang === 'ar' ? '✓ ممتاز! تم إدخال رابط إثبات التواجد ونشاط المتجر بنجاح' : '✓ Store existence proof link provided.')
                            : (lang === 'ar' ? '⚠️ شرط إلزامي: يجب إضافة رابط واحد على الأقل (فيسبوك، إنستغرام، تيك توك، أو موقع إلكتروني) لإثبات وجود المكتبة وحماية القراء.' : '⚠️ Required: Add at least one social media link or website as proof of store existence.')}
                        </span>
                      </div>
                      <Badge variant={hasSocialProof ? "default" : "destructive"} className="text-[10px] shrink-0 font-bold">
                        {hasSocialProof ? (lang === 'ar' ? 'مستوفى' : 'Passed') : (lang === 'ar' ? 'مطلوب رابط' : 'Required')}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                        <FacebookIcon className="h-3.5 w-3.5 text-blue-600" />
                        <span>{lang === 'ar' ? 'رابط صفحة الفيسبوك (Facebook Page):' : 'Facebook Page URL:'}</span>
                      </label>
                      <input
                        type="text"
                        value={facebookPage}
                        onChange={e => {
                          setFacebookPage(e.target.value)
                          clearFieldError('facebookPage')
                          clearFieldError('socialProof')
                        }}
                        placeholder="https://facebook.com/your_bookstore or @your_bookstore"
                        className={cn(
                          "w-full rounded-xl border bg-background px-3 py-2 text-xs font-mono text-foreground transition-all",
                          formErrors.facebookPage
                            ? "border-destructive bg-destructive/5 ring-1 ring-destructive/30"
                            : "border-border"
                        )}
                        dir="ltr"
                      />
                      {formErrors.facebookPage && (
                        <span className="text-[11px] font-bold text-destructive block mt-1">{formErrors.facebookPage}</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                        <InstagramIcon className="h-3.5 w-3.5 text-rose-600" />
                        <span>{lang === 'ar' ? 'رابط أو يوزر إنستغرام (Instagram):' : 'Instagram Handle / URL:'}</span>
                      </label>
                      <input
                        type="text"
                        value={instagramHandle}
                        onChange={e => {
                          setInstagramHandle(e.target.value)
                          clearFieldError('instagramHandle')
                          clearFieldError('socialProof')
                        }}
                        placeholder="https://instagram.com/your_bookstore or @your_bookstore"
                        className={cn(
                          "w-full rounded-xl border bg-background px-3 py-2 text-xs font-mono text-foreground transition-all",
                          formErrors.instagramHandle
                            ? "border-destructive bg-destructive/5 ring-1 ring-destructive/30"
                            : "border-border"
                        )}
                        dir="ltr"
                      />
                      {formErrors.instagramHandle && (
                        <span className="text-[11px] font-bold text-destructive block mt-1">{formErrors.instagramHandle}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground block">TikTok (اختياري):</label>
                        <input
                          type="text"
                          value={tiktokHandle}
                          onChange={e => {
                            setTiktokHandle(e.target.value)
                            clearFieldError('tiktokHandle')
                            clearFieldError('socialProof')
                          }}
                          placeholder="@tiktok_store or https://tiktok.com/@..."
                          className={cn(
                            "w-full rounded-xl border bg-background px-3 py-1.5 text-xs font-mono text-foreground transition-all",
                            formErrors.tiktokHandle
                              ? "border-destructive bg-destructive/5 ring-1 ring-destructive/30"
                              : "border-border"
                          )}
                          dir="ltr"
                        />
                        {formErrors.tiktokHandle && (
                          <span className="text-[11px] font-bold text-destructive block mt-1">{formErrors.tiktokHandle}</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground block">Website (متجر إلكتروني):</label>
                        <input
                          type="url"
                          value={websiteUrl}
                          onChange={e => {
                            setWebsiteUrl(e.target.value)
                            clearFieldError('websiteUrl')
                            clearFieldError('socialProof')
                          }}
                          placeholder="https://yourbookstore.com"
                          className={cn(
                            "w-full rounded-xl border bg-background px-3 py-1.5 text-xs font-mono text-foreground transition-all",
                            formErrors.websiteUrl
                              ? "border-destructive bg-destructive/5 ring-1 ring-destructive/30"
                              : "border-border"
                          )}
                          dir="ltr"
                        />
                        {formErrors.websiteUrl && (
                          <span className="text-[11px] font-bold text-destructive block mt-1">{formErrors.websiteUrl}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Monthly Volume */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-amber-500" />
                      <span>{lang === 'ar' ? 'متوسط حجم وتداول الكتب شهرياً في مكتبتكم:' : 'Estimated Monthly Book Volume:'}</span>
                    </label>
                    <select
                      value={monthlyVolume}
                      onChange={e => setMonthlyVolume(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="100 - 500 كتاب شهرياً">100 – 500 كتاب شهرياً (متجر ناشئ)</option>
                      <option value="500 - 1,500 كتاب">500 – 1,500 كتاب شهرياً (متوسط ونشط)</option>
                      <option value="1,500 - 5,000 كتاب">1,500 – 5,000 كتاب شهرياً (مكتبة كبرى / دار نشر)</option>
                      <option value="أكثر من 5,000 كتاب">أكثر من 5,000 كتاب شهرياً (موزع رئيسي)</option>
                    </select>
                  </div>

                  {/* ONLINE CONTRACT & TERMS AGREEMENT */}
                  <div className="space-y-4 p-5 rounded-3xl bg-card border-2 border-emerald-500/30 shadow-xs">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shadow-xs">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-black text-foreground">
                            {lang === 'ar' ? 'عقد واتفاقية الشراكة مع منصة ورق كونكت' : 'WaraqConnect Partnership Contract & Agreement'}
                          </h3>
                          <p className="text-[10px] text-muted-foreground">
                            {lang === 'ar' ? 'الشروط والأحكام ونموذج العمل المالي للشركاء' : 'Terms, conditions & financial model'}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-600 text-white font-bold text-[10px] gap-1 shadow-xs">
                        <Sparkles className="h-3 w-3" />
                        <span>{lang === 'ar' ? 'أول شهر مجاناً يبدأ مع أول طلب' : '1st Month Free Starts With 1st Order'}</span>
                      </Badge>
                    </div>

                    {/* Key terms highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                        <span className="font-bold text-foreground flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                          <span>🎁</span>
                          <span>{lang === 'ar' ? 'الشهر المجاني يبدأ مع أول طلب' : '🎁 1st Month Free (Starts on 1st Order)'}</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground leading-relaxed block">
                          {lang === 'ar'
                            ? 'فترة تجريبية مجانية 100% (0% عمولة). لا يبدأ احتساب الـ 30 يوماً المجانية إلا فور وصول أول طلب شراء حقيقي لمتجركم، لضمان عدم ضياع أي يوم أثناء إعداد وتنسيق متجركم.'
                            : '100% free trial (0% commission). The 30 free days only begin when your store receives its very first real order, giving you zero pressure while setting up.'}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1">
                        <span className="font-bold text-foreground flex items-center gap-1.5 text-primary">
                          <span>💼</span>
                          <span>{lang === 'ar' ? 'عمولة المبيعات 10% لاحقاً' : '💼 10% Platform Sales Commission'}</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground leading-relaxed block">
                          {lang === 'ar'
                            ? 'بعد انقضاء الـ 30 يوماً من تاريخ أول طلب، تقتطع المنصة نسبة 10% فقط من المبيعات الناجحة لتغطية التسويق والتشغيل والدعم.'
                            : 'After 30 days from your first sale, platform takes 10% commission on completed sales for hosting & marketing.'}
                        </span>
                      </div>
                    </div>

                    {/* Terms details list */}
                    <div className="text-[11px] text-muted-foreground space-y-1.5 bg-muted/30 p-3.5 rounded-2xl border border-border/60 leading-relaxed">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{lang === 'ar' ? 'الشهر الأول المجاني بالكامل (0% عمولة) يبدأ رسمياً من تاريخ أول طلب شراء ناجح للمكتبة وليس من تاريخ التسجيل أو التفعيل.' : 'The 1st free month (0% commission) officially begins on the date of your store first successful order, not upon registration.'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{lang === 'ar' ? 'تحصل المنصة على نسبة 10% فقط من إجمالي قيمة المبيعات التي تتم بنجاح عبر المنصة بعد انتهاء شهر التجربة المحسوب من أول طلب.' : 'Platform takes 10% commission on orders placed via WaraqConnect after the 30-day trial period from your first order.'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{lang === 'ar' ? 'تحتفظ المكتبة بكامل الصلاحية لتحديد أسعار كتبها، إعداد عروض الباكدجات، وتلقي الطلبات مباشرة على الواتساب.' : 'Store retains full control over book pricing, bundles, and direct WhatsApp customer orders.'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{lang === 'ar' ? 'يلتزم المتجر بمطابقة وصف وحالة الكتب بدقة وسرعة التجهيز للحفاظ على شارة التوثيق وثقة القراء.' : 'Store guarantees accurate book condition descriptions and fast order fulfillment.'}</span>
                      </div>
                    </div>

                    {/* Required Agreement Checkbox */}
                    <label className={cn(
                      "flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                      acceptedContract
                        ? "border-emerald-500 bg-emerald-500/10 shadow-xs"
                        : "border-border/80 bg-muted/30 hover:border-emerald-500/50"
                    )}>
                      <input
                        type="checkbox"
                        required
                        checked={acceptedContract}
                        onChange={e => {
                          setAcceptedContract(e.target.checked)
                          clearFieldError('acceptedContract')
                        }}
                        className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="text-xs space-y-0.5">
                        <span className="font-black text-foreground block">
                          {lang === 'ar'
                            ? 'أقر وأوافق على عقد الشراكة (عمولة 10%، والشهر الأول مجاني 100% يبدأ مع أول طلب بيع) *'
                            : 'I agree to the Terms & Partnership Contract (10% sales commission, first month free starting on 1st order) *'}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {lang === 'ar'
                            ? 'الموافقة على الشروط تضمن تفعيل متجرك وبدء الشهر المجاني فور وصول أول طلب شراء حقيقي لمتجركم.'
                            : 'Acceptance activates your store, with the free month countdown starting only upon your first order.'}
                        </span>
                      </div>
                    </label>
                    {formErrors.acceptedContract && (
                      <span className="text-[11px] font-bold text-destructive block mt-1">{formErrors.acceptedContract}</span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => goToStep(2)}
                      className="rounded-xl font-bold text-xs"
                    >
                      {lang === 'ar' ? 'السابق' : 'Back'}
                    </Button>
                    <Button
                      type="submit"
                      loading={sending || isSubmittingAuth}
                      disabled={sending || isSubmittingAuth}
                      className="flex-1 rounded-xl font-black text-xs py-3 gap-2 cursor-pointer shadow-md transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                    >
                      <Send className="h-4 w-4" />
                      <span>{lang === 'ar' ? 'إرسال طلب تسجيل المكتبة واعتماد الشراكة' : 'Submit Store Partner Registration'}</span>
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Real-world Live Store Card Preview (5 cols) */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-primary" />
                <span>{lang === 'ar' ? 'معاينة حية: كيف ستظهر مكتبتك للقراء؟' : 'Live Reader Preview'}</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-full">
                /stores/{storeNameEn ? storeNameEn.toLowerCase().replace(/\s+/g, '-') : 'your-store'}
              </span>
            </div>

            {/* Simulated Live Store Card */}
            <div className="rounded-3xl border-2 border-border overflow-hidden bg-card shadow-lg transition-all hover:shadow-xl">
              {/* Cover Banner */}
              <div className="relative h-32 w-full bg-muted overflow-hidden">
                <img
                  src={coverUrl || '/images/cover-placeholder.svg'}
                  alt="Cover Preview"
                  onError={(e) => { e.currentTarget.src = '/images/cover-placeholder.svg' }}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 end-3">
                  <Badge className="bg-emerald-600/90 text-white font-bold text-[10px] gap-1 shadow-xs">
                    <ShieldCheck className="h-3 w-3" />
                    <span>{lang === 'ar' ? 'مكتبة موثقة' : 'Verified Store'}</span>
                  </Badge>
                </div>
              </div>

              {/* Logo & Info */}
              <div className="p-5 pt-0 relative space-y-3">
                <div className="flex items-end justify-between -mt-8 mb-2">
                  <div className="relative h-16 w-16 rounded-2xl overflow-hidden border-4 border-card bg-card shadow-md">
                    <img
                      src={logoUrl || DEFAULT_LOGOS[0]}
                      alt="Logo Preview"
                      onError={(e) => { e.currentTarget.src = '/images/avatar-placeholder.svg' }}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {storeType === 'ONLINE' ? '🌐 أونلاين فقط' : storeType === 'BOTH' ? '🛍️ فرع + أونلاين' : '📍 مقر فعلي'}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-black text-base text-foreground">
                    {storeNameAr || (lang === 'ar' ? 'اسم مكتبتك هنا' : 'Your Bookstore Name')}
                  </h3>
                  <p className="text-xs font-bold text-primary mt-0.5">
                    {slogan || (lang === 'ar' ? 'الشعار الترويجي للمكتبة' : 'Store Tagline here')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {description || (lang === 'ar' ? 'نبذة عن مكتبتك وتشكيلة الكتب والعروض التي تقدمها لجمهور منصة ورق...' : 'Store bio and literature offerings...')}
                  </p>
                </div>

                <div className="pt-2 border-t space-y-1.5 text-xs text-muted-foreground">
                  {storeType === 'ONLINE' ? (
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold truncate">
                      <Globe className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{lang === 'ar' ? `متجر إلكتروني أونلاين — الشحن من ${city}` : `Online Store — Dispatch Hub: ${city}`}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{city} {district ? `• ${district}` : ''} {address ? `• ${address}` : ''}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{formattedWorkingHours}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{shippingScope}</span>
                  </div>
                </div>

                {/* Simulated Action Buttons */}
                <div className="pt-3 border-t grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1 text-emerald-600 border-emerald-500/30">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'واتساب المتجر' : 'WhatsApp'}</span>
                  </Button>
                  <Button size="sm" className="rounded-xl text-xs font-bold gap-1 bg-primary text-primary-foreground">
                    <Package className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'عروض الباكدجات' : 'View Deals'}</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Merchant Guarantee Card */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                <span>{lang === 'ar' ? 'مزايا حصرية لشركاء المتاجر' : 'Exclusive Partner Perks'}</span>
              </span>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside text-[11px] leading-relaxed">
                <li>{lang === 'ar' ? 'صفحة متجر مخصصة تعرض كتالوج كتبك وباقات التوفير (Mix & Match).' : 'Custom store page displaying books and bundle package deals.'}</li>
                <li>{lang === 'ar' ? 'أزرار طلب بنقرة واحدة توجه القارئ فوراً لمحادثة واتساب مجهزة بالكتب المختارة.' : '1-Click order buttons that route book orders directly to your WhatsApp.'}</li>
                <li>{lang === 'ar' ? 'ظهور مميز في محرك بحث المنصة حسب المحافظة ونوع الكتب.' : 'Featured directory search ranking by governorate and book genres.'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Fast Auth Modal Popup for Quick Partner Login */}
      <FastAuthModal
        isOpen={isAuthModalOpen}
        defaultEmail={email.trim()}
        defaultName={ownerName.trim()}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={async (authUser) => {
          const formattedUser = {
            id: authUser.id,
            email: authUser.email,
            profile: authUser.user_metadata,
          }
          setCurrentUser(formattedUser)
          if (authUser.email && !email) {
            setEmail(authUser.email)
          }
          if ((authUser.user_metadata?.full_name || authUser.user_metadata?.name) && !ownerName) {
            setOwnerName(authUser.user_metadata.full_name || authUser.user_metadata.name)
          }

          // Immediately execute submission and transition straight to success screen!
          await executeApplicationSubmit(formattedUser)
        }}
        actionType="general"
        title={lang === 'ar' ? 'ربط المتجر بحسابك وإتمام التقديم' : 'Link Store Account & Submit'}
        subtitle={
          lang === 'ar'
            ? 'سجل دخولك أو أنشئ حسابك لإتمام إرسال الطلب فوراً وتفعيل لوحة التحكم'
            : 'Sign in or create account to instantly submit your application'
        }
      />
    </MainLayout>
  )
}
