'use client'

import React from 'react'
import {
  Store,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
  Globe,
  Building,
  Phone,
  MessageCircle,
  ExternalLink,
  Navigation,
  CheckCircle2,
  Save,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Bookstore, StoreType } from '@/types/store'
import { MapLocationPicker, type MapCoordinates } from '@/components/common/map-location-picker'
import { SquareImageUpload } from '@/components/stores/square-image-upload'
import { useStoreProfile } from '../hooks/use-store-profile'

interface StoreProfileTabProps {
  currentStore: Bookstore
  activeStoreId: string
  currentUserId?: string | null
  onStoreUpdated: (updated: Bookstore) => void
  lang: 'ar' | 'en'
}

export function StoreProfileTab({
  currentStore,
  activeStoreId,
  currentUserId,
  onStoreUpdated,
  lang,
}: StoreProfileTabProps) {
  const {
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
  } = useStoreProfile({
    currentStore,
    activeStoreId,
    currentUserId,
    lang,
    onStoreUpdated,
  })

  return (
    <form onSubmit={handleProfileSave} className="space-y-8 animate-in fade-in duration-200">
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{lang === 'ar' ? 'تم حفظ وتحديث بيانات المكتبة بنجاح!' : 'Store profile updated successfully!'}</span>
        </div>
      )}

      {/* 1. GENERAL & CONTACT INFO */}
      <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <h2 className="text-base font-black text-foreground flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              <span>{lang === 'ar' ? 'البيانات الأساسية ومعلومات التواصل' : 'General & Contact Information'}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === 'ar'
                ? 'بيانات المتجر الرسمية وأرقام استقبال الطلبات والتواصل المباشر مع القراء'
                : 'Official bookstore profile, WhatsApp order receiving desk, and contact details'}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold self-start sm:self-auto">
            {lang === 'ar' ? 'البيانات الرسمية' : 'Official Details'}
          </Badge>
        </div>

        {/* Arabic Name & English Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div id="store-field-name_ar" className="space-y-1.5">
            <label className="text-xs font-black text-foreground">
              {lang === 'ar' ? 'اسم المكتبة (بالعربية)' : 'Bookstore Name (Arabic)'} *
            </label>
            <input
              type="text"
              required
              value={profileForm.name_ar}
              onChange={e => {
                setProfileForm(prev => ({ ...prev, name_ar: e.target.value }))
                if (formErrors.name_ar) setFormErrors(prev => ({ ...prev, name_ar: '' }))
              }}
              className={cn(
                'w-full bg-muted/40 border-2 rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none transition-colors',
                formErrors.name_ar ? 'border-destructive bg-destructive/5 focus:border-destructive' : 'border-border focus:border-primary'
              )}
              placeholder="مثال: مكتبة ديوان — فرع الزمالك"
            />
            {formErrors.name_ar && (
              <p className="text-[11px] font-bold text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{formErrors.name_ar}</span>
              </p>
            )}
          </div>

          <div id="store-field-name" className="space-y-1.5">
            <label className="text-xs font-black text-foreground">
              {lang === 'ar' ? 'اسم المكتبة (بالإنجليزية)' : 'Bookstore Name (English)'} *
            </label>
            <input
              type="text"
              required
              value={profileForm.name}
              onChange={e => {
                setProfileForm(prev => ({ ...prev, name: e.target.value }))
                if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }))
              }}
              className={cn(
                'w-full bg-muted/40 border-2 rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none transition-colors',
                formErrors.name ? 'border-destructive bg-destructive/5 focus:border-destructive' : 'border-border focus:border-primary'
              )}
              placeholder="e.g. Diwan Bookstore Zamalek"
            />
            {formErrors.name && (
              <p className="text-[11px] font-bold text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{formErrors.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Slug URL & Store Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div id="store-field-slug" className="space-y-1.5">
            <label className="text-xs font-black text-foreground">
              {lang === 'ar' ? 'الرابط التعريفي المخصص (Slug)' : 'Unique Slug URL'} *
            </label>
            <div className={cn(
              'flex items-center bg-muted/40 border-2 rounded-xl px-3 py-2 text-xs font-bold text-muted-foreground transition-colors',
              formErrors.slug ? 'border-destructive bg-destructive/5' : 'border-border'
            )}>
              <span className="shrink-0 text-[11px] font-mono opacity-60 hidden sm:inline">waraqconnect.vercel.app/stores/</span>
              <span className="shrink-0 text-[11px] font-mono opacity-60 sm:hidden">/stores/</span>
              <input
                type="text"
                required
                value={profileForm.slug}
                onChange={e => {
                  setProfileForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))
                  if (formErrors.slug) setFormErrors(prev => ({ ...prev, slug: '' }))
                }}
                className="w-full bg-transparent border-none text-xs font-bold text-foreground focus:outline-none ps-1"
              />
            </div>
            {formErrors.slug && (
              <p className="text-[11px] font-bold text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{formErrors.slug}</span>
              </p>
            )}
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

        {/* WhatsApp Order Receiving Number & Hotline Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* WhatsApp Order Number */}
          <div id="store-field-whatsapp" className="space-y-1.5 p-3.5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span>{lang === 'ar' ? 'رقم الواتساب لاستقبال الطلبات' : 'WhatsApp Order Receiving'} *</span>
              </label>
              {profileForm.whatsapp && (
                <a
                  href={`https://wa.me/${profileForm.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-emerald-700 dark:text-emerald-300 underline font-black hover:opacity-80"
                >
                  {lang === 'ar' ? 'تجربة فتح 💬' : 'Test Chat 💬'}
                </a>
              )}
            </div>
            <input
              type="tel"
              required
              value={profileForm.whatsapp}
              onChange={e => {
                setProfileForm(prev => ({ ...prev, whatsapp: e.target.value }))
                if (formErrors.whatsapp) setFormErrors(prev => ({ ...prev, whatsapp: '' }))
              }}
              className={cn(
                'w-full bg-background border rounded-xl px-3.5 py-2 text-xs font-bold text-foreground focus:outline-none font-mono transition-colors',
                formErrors.whatsapp ? 'border-destructive focus:border-destructive' : 'border-emerald-500/40 focus:border-emerald-600'
              )}
              placeholder="مثال: 01032137085 أو +2010..."
            />
            {formErrors.whatsapp ? (
              <p className="text-[11px] font-bold text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{formErrors.whatsapp}</span>
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground leading-tight">
                {lang === 'ar'
                  ? 'تُرسل إليه رسائل طلبات الكتب الفورية من السلة مع كود الشحن تلقائياً.'
                  : 'Book purchase orders and shipping tracking codes are sent directly to this number.'}
              </p>
            )}
          </div>

          {/* Direct Phone / Hotline */}
          <div className="space-y-1.5 p-3.5 rounded-2xl bg-primary/5 border-2 border-primary/20">
            <label className="text-xs font-black text-foreground flex items-center gap-1.5">
              <Phone className="h-4 w-4 text-primary" />
              <span>{lang === 'ar' ? 'رقم الهاتف الأرضي أو المحمول' : 'Direct Phone / Hotline'}</span>
            </label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary font-mono"
              placeholder="مثال: 0227362140 أو 01012345678"
            />
            <p className="text-[10px] text-muted-foreground leading-tight">
              {lang === 'ar'
                ? 'للاتصال الهاتفي المباشر بالفرع واستفسارات القراء وخدمة العملاء.'
                : 'For direct reader telephone calls, voice inquiries, and branch support.'}
            </p>
          </div>
        </div>

        {/* About / Bio */}
        <div className="space-y-1.5 pt-1">
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
      </div>

      {/* 2. STORE VISUAL IDENTITY */}
      <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <h2 className="text-base font-black text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{lang === 'ar' ? 'الهوية البصرية والعلامة التجارية' : 'Store Visual Identity & Media'}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lang === 'ar'
                ? 'شعار المتجر وصورة الغلاف لإبراز مكتبتكم بشكل جذاب واحترافي في دليل المكتبات وصفحات البحث'
                : 'Bookstore logo and cover banner to professionally showcase your store in search and directory'}
            </p>
          </div>
        </div>

        {/* LOGO & COVER COMPACT IMAGE PICKERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SquareImageUpload
            label={lang === 'ar' ? 'شعار المكتبة الرسمي' : 'Official Bookstore Logo'}
            subLabel={lang === 'ar' ? 'الأيقونة الرمزية للمكتبة الظاهرة في نتائج البحث والبطاقات (مربع 1:1)' : 'Primary store avatar shown across book cards and search (Square 1:1)'}
            value={profileForm.logo_url}
            onChange={url => setProfileForm(prev => ({ ...prev, logo_url: url }))}
            onRemove={() => setProfileForm(prev => ({ ...prev, logo_url: '' }))}
            folder="logos"
            userId={currentUserId}
            theme="primary"
            tagText={lang === 'ar' ? 'شعار 1:1' : 'Logo 1:1'}
            resolutionHint="Square 1:1 (400×400+)"
            lang={lang}
            compact={true}
          />

          <SquareImageUpload
            label={lang === 'ar' ? 'غلاف واجهة المتجر' : 'Store Banner Cover'}
            subLabel={lang === 'ar' ? 'البانر الترويجي البارز أعلى واجهة المتجر وبطاقات العروض الحصرية (مربع 1:1)' : 'Featured header banner displayed on your store profile and offer cards (Square 1:1)'}
            value={profileForm.cover_url}
            onChange={url => setProfileForm(prev => ({ ...prev, cover_url: url }))}
            onRemove={() => setProfileForm(prev => ({ ...prev, cover_url: '' }))}
            folder="covers"
            userId={currentUserId}
            theme="emerald"
            tagText={lang === 'ar' ? 'غلاف 1:1' : 'Cover 1:1'}
            resolutionHint="Square 1:1 (800×800+)"
            presets={[
              '/images/cover-placeholder.svg',
              'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1526721940322-10fb6e3ae94a?auto=format&fit=crop&w=800&q=80',
            ]}
            lang={lang}
            compact={true}
          />
        </div>
      </div>

      {/* 3. PHYSICAL ADDRESS & GPS MAP PICKER */}
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
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>{lang === 'ar' ? 'موقع الفرع وخريطة الوصول' : 'Branch Location & GPS Navigation'}</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === 'ar'
                  ? 'العنوان الدقيق وتحديد موقع الـ GPS لتسهيل وصول القراء وزوار الفرع ونقاط الاستلام'
                  : 'Precise street address and interactive GPS pin for reader footfall and pickups'}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* PART 1: Physical Address Details, Quick Chips & Coordinates */}
            <div className="space-y-4 p-5 rounded-2xl bg-muted/20 border-2 border-border/80">
              <div id="store-field-address" className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-foreground">
                    {lang === 'ar' ? 'العنوان التفصيلي للفرع' : 'Detailed Branch Address'} *
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    {lang === 'ar' ? 'اسم الشارع والمعالم والحي' : 'Street name & landmark'}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={profileForm.address}
                  onChange={e => {
                    setProfileForm(prev => ({ ...prev, address: e.target.value }))
                    if (formErrors.address) setFormErrors(prev => ({ ...prev, address: '' }))
                  }}
                  className={cn(
                    'w-full bg-background border-2 rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground focus:outline-none transition-colors',
                    formErrors.address ? 'border-destructive bg-destructive/5 focus:border-destructive' : 'border-border focus:border-primary'
                  )}
                  placeholder="مثال: 159 شارع 26 يوليو، الزمالك، القاهرة"
                />
                {formErrors.address && (
                  <p className="text-[11px] font-bold text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{formErrors.address}</span>
                  </p>
                )}
              </div>

              {/* Common Districts Quick Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>{lang === 'ar' ? 'إضافة الحي بسرعة (القاهرة، الإسكندرية، الجيزة):' : 'Add district quickly (Cairo, Alex, Giza):'}</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5 max-h-32 overflow-y-auto p-1">
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
                      className="px-2.5 py-1 rounded-lg bg-background hover:bg-primary/10 hover:text-primary text-[10px] font-bold border border-border transition-colors cursor-pointer"
                    >
                      {dist}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coordinates Readout & Use Current Location Button */}
              <div className="pt-3 border-t border-border/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-foreground">
                    {lang === 'ar' ? 'إحداثيات GPS المحددة بدقة:' : 'Pinpoint GPS Coordinates:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          pos => {
                            setProfileForm(prev => ({
                              ...prev,
                              latitude: Number(pos.coords.latitude.toFixed(6)),
                              longitude: Number(pos.coords.longitude.toFixed(6)),
                            }))
                          },
                          () => alert(lang === 'ar' ? 'تعذر جلب إحداثيات موقعك' : 'Failed to retrieve current GPS location')
                        )
                      }
                    }}
                    className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Navigation className="h-3 w-3" />
                    <span>{lang === 'ar' ? 'موقعي الحالي 📍' : 'Use Current GPS 📍'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-background border border-border text-xs">
                    <span className="text-[10px] font-bold text-muted-foreground block">Latitude:</span>
                    <span className="font-mono font-bold text-primary">{profileForm.latitude}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-background border border-border text-xs">
                    <span className="text-[10px] font-bold text-muted-foreground block">Longitude:</span>
                    <span className="font-mono font-bold text-primary">{profileForm.longitude}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PART 2: Interactive Map Picker with drag pin */}
            <div className="space-y-2 p-5 rounded-2xl bg-muted/20 border-2 border-border/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>{lang === 'ar' ? 'الخريطة التفاعلية (حرّك الدبوس لتحديث الموقع)' : 'Interactive Map (Drag Pin)'}</span>
                </label>
                <span className="text-[10px] text-muted-foreground font-bold">
                  {lang === 'ar' ? 'تحديث تلقائي' : 'Auto updates'}
                </span>
              </div>

              <div className="rounded-2xl overflow-hidden border-2 border-border shadow-xs">
                <MapLocationPicker
                  latitude={profileForm.latitude}
                  longitude={profileForm.longitude}
                  height="310px"
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
        </div>
      )}

      {/* 4. WORKING HOURS & SOCIAL MEDIA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Working Hours Card */}
        <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>{lang === 'ar' ? 'ساعات ومواعيد العمل' : 'Opening Hours'}</span>
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
              {/* Quick 24/7 toggle */}
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
                  {/* Weekday Hours */}
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
                      <div className="grid grid-cols-2 gap-2 pt-1">
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
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'السبت - الخميس (يدوي)' : 'Weekdays (Manual)'}</label>
                <input
                  type="text"
                  value={profileForm.opening_weekdays}
                  onChange={e => setProfileForm(prev => ({ ...prev, opening_weekdays: e.target.value }))}
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">{lang === 'ar' ? 'الجمعة (يدوي)' : 'Friday (Manual)'}</label>
                <input
                  type="text"
                  value={profileForm.opening_friday}
                  onChange={e => setProfileForm(prev => ({ ...prev, opening_friday: e.target.value }))}
                  className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Social Media & External Channels */}
        <div className="rounded-3xl border-2 border-border/80 bg-card p-6 space-y-4">
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <span>{lang === 'ar' ? 'حسابات التواصل الاجتماعي والموقع' : 'Social Media & Website'}</span>
          </h2>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">الموقع الإلكتروني (Website)</label>
              <input
                type="url"
                value={profileForm.website_url}
                onChange={e => {
                  setProfileForm(prev => ({ ...prev, website_url: e.target.value }))
                  if (formErrors.website_url) setFormErrors(prev => ({ ...prev, website_url: '' }))
                }}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                placeholder="https://diwanegypt.com"
              />
              {formErrors.website_url && (
                <p className="text-[11px] font-bold text-destructive">{formErrors.website_url}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">صفحة الفيسبوك (Facebook Page)</label>
              <input
                type="url"
                value={profileForm.facebook}
                onChange={e => setProfileForm(prev => ({ ...prev, facebook: e.target.value }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                placeholder="https://facebook.com/..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">حساب الإنستغرام (Instagram)</label>
              <input
                type="text"
                value={profileForm.instagram}
                onChange={e => setProfileForm(prev => ({ ...prev, instagram: e.target.value }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                placeholder="https://instagram.com/... أو @username"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">تيك توك (TikTok)</label>
              <input
                type="text"
                value={profileForm.tiktok}
                onChange={e => setProfileForm(prev => ({ ...prev, tiktok: e.target.value }))}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                placeholder="https://tiktok.com/@..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="pt-2 flex items-center justify-end">
        <Button
          type="submit"
          disabled={isSaving}
          className="rounded-2xl font-black text-xs px-8 py-3 gap-2 shadow-lg shadow-primary/25 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{lang === 'ar' ? 'جاري حفظ التعديلات...' : 'Saving changes...'}</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>{lang === 'ar' ? 'حفظ وتحديث بيانات المكتبة 💾' : 'Save Store Profile 💾'}</span>
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
