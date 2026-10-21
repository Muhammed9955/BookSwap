'use client'

import { useState, useRef, useMemo } from 'react'
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
  AlertCircle
} from 'lucide-react'
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
  user: { id: string; profile?: Record<string, unknown> | null } | null
}

const DEFAULT_LOGOS = [
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=250&q=80',
]

const DEFAULT_COVERS = [
  '/images/cover-placeholder.svg',
  'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80',
]

export function PartnerFormClient({ user }: PartnerFormClientProps) {
  const { lang, isRTL } = useLanguage()

  // Form State - Focused 100% on Bookstore/Store Partners
  const [storeType, setStoreType] = useState<StoreType>('ONLINE')
  const [ownerName, setOwnerName] = useState('')
  const [storeNameAr, setStoreNameAr] = useState('')
  const [storeNameEn, setStoreNameEn] = useState('')
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

  const goToStep = (step: 1 | 2 | 3) => {
    setActiveStep(step)
    setTimeout(() => {
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 40)
  }

  // Existence Proof Check (Must provide at least 1 verified social presence link)
  const hasSocialProof = useMemo(() => {
    return Boolean(
      facebookPage.trim() ||
      instagramHandle.trim() ||
      tiktokHandle.trim() ||
      websiteUrl.trim()
    )
  }, [facebookPage, instagramHandle, tiktokHandle, websiteUrl])

  const whatsappAdmin = '201556252658'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ownerName || !storeNameAr || !phone || !whatsapp) {
      alert(lang === 'ar' ? 'يرجى استكمال البيانات الإلزامية (اسم المالك، اسم المتجر، الهاتف، والواتساب)' : 'Please fill all required fields')
      return
    }

    if (!hasSocialProof) {
      alert(
        lang === 'ar'
          ? 'يرجى إضافة رابط واحد على الأقل لإثبات وجود ونشاط المكتبة (فيسبوك، إنستغرام، تيك توك، أو موقع إلكتروني) لحماية القراء من الحسابات غير المؤكدة.'
          : 'Please provide at least one active social presence link (Facebook, Instagram, TikTok, or Website) as proof of store existence.'
      )
      return
    }

    if (!acceptedContract) {
      alert(
        lang === 'ar'
          ? 'يرجى الموافقة على الشروط والأحكام وعقد الشراكة (نسبة عمولة 10% من المبيعات، مع شهر أول مجاناً 100%) لمتابعة تقديم الطلب.'
          : 'Please accept the partner contract terms (10% sales commission, first month free).'
      )
      return
    }

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
      `🌐 *فيسبوك:* ${facebookPage || 'غير مسجل'}\n` +
      `📸 *إنستغرام:* ${instagramHandle || 'غير مسجل'}\n` +
      `📦 *متوسط حجم الكتب شهرياً:* ${monthlyVolume}\n` +
      `📋 *عقد الشراكة:* تم قبول الشروط والأحكام (10% عمولة مبيعات، الشهر الأول مجاناً 100% يبدأ مع أول طلب)\n` +
      `📝 *نبذة عن المكتبة:*\n${description || 'متجر كتب ورقية معتمد'}\n\n` +
      `✨ تم إرسال الطلب عبر نموذج الشركاء بمنصة ورق كونكت.`

    try {
      await submitStoreApplication({
        applicant_id: user?.id,
        applicant_name: ownerName,
        owner_name: ownerName,
        business_name: storeNameAr,
        store_name: storeNameEn || storeNameAr,
        store_name_ar: storeNameAr,
        email: (user?.profile as { email?: string } | undefined)?.email,
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
        website_url: websiteUrl || undefined,
        social_links: {
          whatsapp,
          facebook: facebookPage || undefined,
          instagram: instagramHandle || undefined,
          tiktok: tiktokHandle || undefined,
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

    const whatsappUrl = `https://wa.me/${whatsappAdmin}?text=${encodeURIComponent(summaryMessage)}`
    window.open(whatsappUrl, '_blank')

    setTimeout(() => {
      setSending(false)
      setSubmitted(true)
    }, 800)
  }

  if (submitted) {
    return (
      <MainLayout user={user}>
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
                ? `تم تسجيل بيانات مكتبة (${storeNameAr}) بنجاح وإرسال إشعار مباشر لفريق إدارة المنصة. سيتم مراجعة الروابط واعتماد شارة التوثيق وتفعيل صفحة المتجر خلال 24 ساعة.`
                : `Store (${storeNameAr}) has been submitted for verification. Our partner success team will review social links and activate your verified badge within 24 hours.`}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border w-full text-start text-xs space-y-2">
            <p className="font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>{lang === 'ar' ? 'ماذا سيحدث بعد ذلك؟' : 'What happens next?'}</span>
            </p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>{lang === 'ar' ? 'فحص حساب فيسبوك/إنستغرام للتأكد من نشاط المتجر ومنع الحسابات الوهمية.' : 'Verify store social media activity to ensure legitimacy.'}</li>
              <li>{lang === 'ar' ? 'تفعيل رابط المتجر العام ليتمكن القراء من تصفح كتبك وعروض الباكدجات.' : 'Public store link activated for catalog and mix & match bundles.'}</li>
              <li>{lang === 'ar' ? 'إرسال دليل إدارة لوحة المتجر وتلقي الطلبات عبر الواتساب.' : 'Receive store dashboard guide & direct WhatsApp customer order routing.'}</li>
            </ul>
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
    <MainLayout user={user}>
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

      <div className="page-container py-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Onboarding Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
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
                        onChange={e => setStoreNameAr(e.target.value)}
                        placeholder={lang === 'ar' ? 'مثال: مكتبة الحكمة، بوكستور القراء...' : 'e.g. Al-Hikma Bookstore'}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
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
                        onChange={e => setOwnerName(e.target.value)}
                        placeholder={lang === 'ar' ? 'مثال: عمر خالد المنشاوي' : 'e.g. Omar Khaled'}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
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
                    <label className="text-xs font-black text-foreground">
                      {lang === 'ar' ? 'نبذة عن المكتبة ونوعية الكتب المتخصصة بها *' : 'Store Bio & Curated Categories *'}
                    </label>
                    <textarea
                      required
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder={lang === 'ar'
                        ? 'أخبر القراء عن متجرك: تاريخ التأسيس، نوعية الكتب (روايات، كتب دينية، تطوير ذات، كتب مستعملة نادرة، كتب أطفال)، وخدمات التوصيل...'
                        : 'Describe your store specialty: genres (fiction, spiritual, self-help, rare used editions, university books), dispatch times...'}
                      rows={3}
                      className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none leading-relaxed"
                    />
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
                    onClick={() => {
                      if (!storeNameAr || !ownerName) {
                        alert(lang === 'ar' ? 'يرجى إدخال اسم المتجر واسم المالك' : 'Please provide store name and owner name')
                        return
                      }
                      goToStep(2)
                    }}
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
                            onChange={e => setDistrict(e.target.value)}
                            placeholder={lang === 'ar' ? 'اختر من الاقتراحات أو اكتب الحي (المعادي، سموحة، الدقي...)' : 'Pick from list or type (Maadi, Smouha, Dokki...)'}
                            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <MessageCircle className="h-4 w-4 text-emerald-600" />
                        <span>{lang === 'ar' ? 'رقم واتساب الأعمال لاستقبال الطلبات *' : 'WhatsApp Business (Orders) *'}</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={whatsapp}
                        onChange={e => setWhatsapp(e.target.value)}
                        placeholder="01012345678"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-mono"
                        dir="ltr"
                      />
                      <span className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'يتم تحويل طلبات القراء عليه مباشرة' : 'Customer orders routed here'}</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <Phone className="h-4 w-4 text-primary" />
                        <span>{lang === 'ar' ? 'رقم هاتف الاتصال المباشر *' : 'Direct Phone Number *'}</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="01099887766"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                        dir="ltr"
                      />
                    </div>
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
                        onChange={e => setFacebookPage(e.target.value)}
                        placeholder="https://facebook.com/your_bookstore"
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                        <InstagramIcon className="h-3.5 w-3.5 text-rose-600" />
                        <span>{lang === 'ar' ? 'رابط أو يوزر إنستغرام (Instagram):' : 'Instagram Handle / URL:'}</span>
                      </label>
                      <input
                        type="text"
                        value={instagramHandle}
                        onChange={e => setInstagramHandle(e.target.value)}
                        placeholder="@your_bookstore or https://instagram.com/..."
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground"
                        dir="ltr"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground block">TikTok (اختياري):</label>
                        <input
                          type="text"
                          value={tiktokHandle}
                          onChange={e => setTiktokHandle(e.target.value)}
                          placeholder="@tiktok_store"
                          className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-mono text-foreground"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground block">Website (متجر إلكتروني):</label>
                        <input
                          type="url"
                          value={websiteUrl}
                          onChange={e => setWebsiteUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-mono text-foreground"
                          dir="ltr"
                        />
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
                        onChange={e => setAcceptedContract(e.target.checked)}
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
                      loading={sending}
                      disabled={sending || !acceptedContract || !hasSocialProof}
                      className={cn(
                        "flex-1 rounded-xl font-black text-xs py-3 gap-2 cursor-pointer shadow-md transition-all",
                        acceptedContract && hasSocialProof
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                          : "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                      )}
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
    </MainLayout>
  )
}
