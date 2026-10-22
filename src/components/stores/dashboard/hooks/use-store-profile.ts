'use client'

import { useState, useEffect } from 'react'
import type { Bookstore, StoreType } from '@/types/store'
import { updateBookstore } from '@/lib/stores/store-service'
import { compressImageFile } from '@/lib/image-utils'
import { uploadCommunityImage } from '@/lib/storage/upload-helper'

interface UseStoreProfileProps {
  currentStore: Bookstore
  activeStoreId: string
  currentUserId?: string | null
  lang: 'ar' | 'en'
  onStoreUpdated: (updated: Bookstore) => void
}

export function useStoreProfile({
  currentStore,
  activeStoreId,
  currentUserId,
  lang,
  onStoreUpdated,
}: UseStoreProfileProps) {
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
    phone: (currentStore as any).phone || currentStore.social_links?.whatsapp || '',
    whatsapp: currentStore.social_links?.whatsapp || '',
    facebook: currentStore.social_links?.facebook || '',
    instagram: currentStore.social_links?.instagram || '',
    tiktok: currentStore.social_links?.tiktok || '',
    opening_weekdays: currentStore.opening_hours?.['السبت - الخميس'] || '10:00 ص - 12:00 منتصف الليل',
    opening_friday: currentStore.opening_hours?.['الجمعة'] || '1:00 م - 11:00 م',
    logo_url: currentStore.logo_url || '',
    cover_url: currentStore.cover_url || '',
  })

  // Synchronize profile form when active store changes
  useEffect(() => {
    setProfileForm({
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
      phone: (currentStore as any).phone || currentStore.social_links?.whatsapp || '',
      whatsapp: currentStore.social_links?.whatsapp || '',
      facebook: currentStore.social_links?.facebook || '',
      instagram: currentStore.social_links?.instagram || '',
      tiktok: currentStore.social_links?.tiktok || '',
      opening_weekdays: currentStore.opening_hours?.['السبت - الخميس'] || '10:00 ص - 12:00 منتصف الليل',
      opening_friday: currentStore.opening_hours?.['الجمعة'] || '1:00 م - 11:00 م',
      logo_url: currentStore.logo_url || '',
      cover_url: currentStore.cover_url || '',
    })
  }, [currentStore])

  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Hours Picker States
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

  // Handle Store Profile Save
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()

    // Form Validations
    const errors: Record<string, string> = {}
    if (!profileForm.name_ar.trim() || profileForm.name_ar.trim().length < 2) {
      errors.name_ar = lang === 'ar' ? 'اسم المكتبة بالعربية مطلوب (حرفين على الأقل)' : 'Arabic store name is required (min 2 chars)'
    }
    if (!profileForm.name.trim() || profileForm.name.trim().length < 2) {
      errors.name = lang === 'ar' ? 'اسم المكتبة بالإنجليزية مطلوب (حرفين على الأقل)' : 'English store name is required (min 2 chars)'
    }
    if (!profileForm.slug.trim()) {
      errors.slug = lang === 'ar' ? 'الرابط المخصص (Slug) مطلوب' : 'Slug is required'
    } else if (!/^[a-z0-9-]+$/i.test(profileForm.slug.trim())) {
      errors.slug = lang === 'ar' ? 'الرابط يجب أن يحتوي فقط على أحرف إنجليزية وأرقام وعلامة -' : 'Slug must contain only letters, numbers, and hyphens'
    }

    const cleanWhatsapp = profileForm.whatsapp.trim().replace(/[\s-]/g, '')
    if (!cleanWhatsapp) {
      errors.whatsapp = lang === 'ar' ? 'رقم الواتساب مطلوب لاستقبال طلبات الكتب' : 'WhatsApp number is required to receive orders'
    } else {
      const isPhoneValid = /^(010|011|012|015)[0-9]{8}$/.test(cleanWhatsapp) || /^(\+?20)(10|11|12|15)[0-9]{8}$/.test(cleanWhatsapp) || /^\+?[0-9]{8,15}$/.test(cleanWhatsapp)
      if (!isPhoneValid) {
        errors.whatsapp = lang === 'ar' ? 'يرجى إدخال رقم هاتف صحيح (مثال: 01012345678)' : 'Please enter a valid phone number (e.g. 01012345678)'
      }
    }

    const cleanPhone = profileForm.phone.trim().replace(/[\s-]/g, '')
    if (cleanPhone) {
      const isDirectPhoneValid =
        /^(010|011|012|015)[0-9]{8}$/.test(cleanPhone) ||
        /^(02|03|040|045|047|048|050|055|057|062|064|065|066|068|069|082|084|086|088|092|093|095|096|097)[0-9]{7,8}$/.test(cleanPhone) ||
        /^(\+?20)[0-9]{8,12}$/.test(cleanPhone) ||
        /^\+?[0-9]{7,15}$/.test(cleanPhone)
      if (!isDirectPhoneValid) {
        errors.phone = lang === 'ar' ? 'يرجى إدخال رقم هاتف أرضي أو محمول صحيح (مثال: 0227362140)' : 'Please enter a valid landline or mobile phone'
      }
    }

    if (profileForm.website_url.trim()) {
      const trimmedUrl = profileForm.website_url.trim()
      if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
        errors.website_url = lang === 'ar' ? 'يجب أن يبدأ رابط الموقع بـ https://' : 'Website URL must start with https://'
      }
    }

    if (profileForm.store_type !== 'ONLINE') {
      if (!profileForm.address.trim() || profileForm.address.trim().length < 4) {
        errors.address = lang === 'ar' ? 'العنوان التفصيلي مطلوب للفرع الفعلي (4 أحرف على الأقل)' : 'Detailed branch address is required (min 4 chars)'
      }
    }

    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      const firstErrorKey = Object.keys(errors)[0]
      const el = document.getElementById(`store-field-${firstErrorKey}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const input = el.querySelector('input, textarea') as HTMLElement | null
        if (input) input.focus()
      }
      return
    }

    setIsSaving(true)
    const isOnline = profileForm.store_type === 'ONLINE'
    try {
      const cleanPhoneVal = profileForm.phone.trim()

      const updated = await updateBookstore(activeStoreId, {
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
        phone: cleanPhoneVal || cleanWhatsapp,
        social_links: {
          facebook: profileForm.facebook,
          instagram: profileForm.instagram,
          whatsapp: cleanWhatsapp || cleanPhoneVal,
          tiktok: profileForm.tiktok,
        },
        opening_hours: {
          'السبت - الخميس': profileForm.opening_weekdays,
          'الجمعة': profileForm.opening_friday,
        },
        logo_url: profileForm.logo_url,
        cover_url: profileForm.cover_url,
      } as any)

      onStoreUpdated(updated)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  return {
    profileForm,
    setProfileForm,
    formErrors,
    setFormErrors,
    isSaving,
    saveSuccess,
    weekdayOpenHour,
    setWeekdayOpenHour,
    weekdayCloseHour,
    setWeekdayCloseHour,
    fridayOpenHour,
    setFridayOpenHour,
    fridayCloseHour,
    setFridayCloseHour,
    fridayClosed,
    setFridayClosed,
    is24Hours,
    setIs24Hours,
    isManualHours,
    setIsManualHours,
    syncHoursToProfile,
    handleProfileSave,
  }
}
