'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  X,
  Upload,
  Camera,
  Check,
  AlertCircle,
  Loader2,
  MapPin,
  Sparkles,
  Phone,
  User,
  AtSign,
  BookOpen,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { useAuth } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/client'
import { getAvatarUrl, cn } from '@/lib/utils'
import { compressImageForAvatar } from '@/lib/image-utils'
import type { Category, City, Area } from '@/types'

// Curated literary avatar choices
const CURATED_AVATARS = [
  { id: 'av1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', labelAr: 'القارئة الكلاسيكية' },
  { id: 'av2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', labelAr: 'الباحث الأدبي' },
  { id: 'av3', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80', labelAr: 'قهوة وكتاب' },
  { id: 'av4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', labelAr: 'المفكر الفلسفي' },
  { id: 'av5', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80', labelAr: 'الروائية المعاصرة' },
  { id: 'av6', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80', labelAr: 'عاشق الخيال' },
]

export interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onProfileUpdated?: (updatedProfile: any) => void
}

export function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}: EditProfileModalProps) {
  const { lang, isRTL } = useLanguage()
  const { refreshProfile } = useAuth()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<'info' | 'location' | 'genres' | 'privacy'>('info')
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [fullNameAr, setFullNameAr] = useState(profile?.full_name_ar || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [whatsappNumber, setWhatsappNumber] = useState(profile?.whatsapp_number || '')
  const [showWhatsapp, setShowWhatsapp] = useState(Boolean(profile?.show_whatsapp))

  const [cities, setCities] = useState<Array<City & { areas: Area[] }>>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCityId, setSelectedCityId] = useState(profile?.city_id || '')
  const [selectedAreaId, setSelectedAreaId] = useState(profile?.area_id || '')
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([])

  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Load cities, categories, and initial genres
  useEffect(() => {
    if (!isOpen) return

    async function loadData() {
      try {
        const [{ data: citiesData }, { data: categoriesData }, { data: genresData }, { data: authData }] =
          await Promise.all([
            supabase
              .from('cities')
              .select('*, areas(*)')
              .eq('is_active', true)
              .order('sort_order'),
            supabase
              .from('categories')
              .select('*')
              .eq('is_active', true)
              .order('sort_order'),
            supabase
              .from('profile_genres')
              .select('category_id')
              .eq('profile_id', profile.id),
            supabase.auth.getUser(),
          ])

        if (citiesData) setCities(citiesData as Array<City & { areas: Area[] }>)
        if (categoriesData) setCategories(categoriesData as Category[])
        if (genresData) setSelectedGenreIds(genresData.map(g => g.category_id))

        const meta = authData?.user?.user_metadata || {}
        const gAvatar = meta.avatar_url || meta.picture || null
        if (gAvatar) {
          setGoogleAvatarUrl(gAvatar)
          if (!profile?.avatar_url) {
            setAvatarUrl(gAvatar)
          }
        }
      } catch (err) {
        console.error('Failed to load edit profile options:', err)
      }
    }

    loadData()
  }, [isOpen, profile?.id, profile?.avatar_url, supabase])

  // Sync state if profile prop changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setFullNameAr(profile.full_name_ar || '')
      setUsername(profile.username || '')
      setBio(profile.bio || '')
      setAvatarUrl(profile.avatar_url || '')
      setWhatsappNumber(profile.whatsapp_number || '')
      setShowWhatsapp(Boolean(profile.show_whatsapp))
      setSelectedCityId(profile.city_id || '')
      setSelectedAreaId(profile.area_id || '')
    }
  }, [profile])

  if (!isOpen) return null

  const selectedCity = cities.find(c => c.id === selectedCityId)
  const areas = selectedCity?.areas ?? []

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError(lang === 'ar' ? 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت' : 'Image size must be under 5MB')
      return
    }

    setUploadingAvatar(true)
    setError(null)
    try {
      // Compress avatar to lightweight 400x400 WebP (<25KB)
      const { file: compressedFile, dataUrl } = await compressImageForAvatar(file)
      const ext = 'webp'
      const filePath = `${profile.id}/avatar-${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/webp',
        })

      if (uploadErr) {
        // If storage bucket is not configured yet or fails, fallback to compact compressed Data URL
        console.warn('Storage upload error, using compact compressed dataUrl:', uploadErr)
        setAvatarUrl(dataUrl)
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)
        setAvatarUrl(publicUrl)
      }
    } catch (err: unknown) {
      console.error('Avatar upload exception:', err)
      setError(lang === 'ar' ? 'حدث خطأ أثناء رفع الصورة' : 'Failed to upload photo')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const toggleGenre = (catId: string) => {
    setSelectedGenreIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const cleanUsername = username.trim().toLowerCase()
      if (cleanUsername) {
        // Validate username format
        const validRegex = /^[a-z0-9_]{3,30}$/
        if (!validRegex.test(cleanUsername)) {
          setError(
            lang === 'ar'
              ? 'اسم المستخدم يجب أن يحتوي على حروف إنجليزية، أرقام، أو شرطة سفلية فقط (3-30 حرف)'
              : 'Username must contain letters, numbers, or underscores (3-30 chars)'
          )
          setLoading(false)
          return
        }

        // Validate uniqueness if changed
        if (cleanUsername !== (profile.username || '').toLowerCase()) {
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', cleanUsername)
            .neq('id', profile.id)
            .maybeSingle()

          if (existingUser) {
            setError(
              lang === 'ar'
                ? 'اسم المستخدم مأخوذ بالفعل، يرجى اختيار اسم آخر'
                : 'Username is already taken, please choose another'
            )
            setLoading(false)
            return
          }
        }
      }

      // Update profiles row
      const updates = {
        full_name: fullName.trim() || null,
        full_name_ar: fullNameAr.trim() || null,
        username: cleanUsername || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        city_id: selectedCityId || null,
        area_id: selectedAreaId || null,
        whatsapp_number: whatsappNumber.trim() || null,
        show_whatsapp: showWhatsapp,
        updated_at: new Date().toISOString(),
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)

      if (updateErr) throw updateErr

      // Update profile_genres table
      await supabase.from('profile_genres').delete().eq('profile_id', profile.id)
      if (selectedGenreIds.length > 0) {
        await supabase.from('profile_genres').insert(
          selectedGenreIds.map(catId => ({
            profile_id: profile.id,
            category_id: catId,
          }))
        )
      }

      // Refresh global auth profile state
      await refreshProfile()

      // Notify parent component with updated profile
      const updatedProfile = {
        ...profile,
        ...updates,
        city: selectedCity ? { name_ar: selectedCity.name_ar, name_en: selectedCity.name_en } : profile.city,
        area: areas.find(a => a.id === selectedAreaId)
          ? {
              name_ar: areas.find(a => a.id === selectedAreaId)?.name_ar,
              name_en: areas.find(a => a.id === selectedAreaId)?.name_en,
            }
          : profile.area,
        genres: categories
          .filter(c => selectedGenreIds.includes(c.id))
          .map(c => ({ category: c })),
      }

      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile)
      }

      setSuccessMsg(lang === 'ar' ? 'تم تحديث ملفك الشخصي بنجاح! ✨' : 'Profile updated successfully! ✨')

      setTimeout(() => {
        onClose()
      }, 900)
    } catch (err: unknown) {
      console.error('Error saving profile:', err)
      const msg = err instanceof Error ? err.message : (lang === 'ar' ? 'فشل حفظ التعديلات، يرجى المحاولة لاحقاً' : 'Failed to save changes')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground">
                {lang === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {lang === 'ar'
                  ? 'حدّث معلوماتك وصورتك واهتماماتك الأدبية'
                  : 'Update your details, avatar and reading interests'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-border px-6 gap-2 bg-card overflow-x-auto scrollbar-none">
          {[
            { id: 'info', icon: User, labelAr: 'البيانات الشخصية', labelEn: 'Basic Info' },
            { id: 'location', icon: MapPin, labelAr: 'الموقع والمدينة', labelEn: 'Location' },
            { id: 'genres', icon: BookOpen, labelAr: 'اهتمامات القراءة', labelEn: 'Reading Interests' },
            { id: 'privacy', icon: Phone, labelAr: 'التواصل والخصوصية', labelEn: 'Contact' },
          ].map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer',
                  active
                    ? 'border-primary text-primary font-black'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
              </button>
            )
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: BASIC INFO & AVATAR */}
          {activeTab === 'info' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-3">
                  {lang === 'ar' ? 'صورة الملف الشخصي' : 'Profile Avatar'}
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-border bg-muted/20">
                  <div className="relative group shrink-0">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30 shadow-md">
                      <Image
                        src={getAvatarUrl(avatarUrl, fullName)}
                        alt={fullName || 'Avatar'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute inset-0 bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Camera className="h-4 w-4 mb-0.5" />
                          <span>{lang === 'ar' ? 'تغيير' : 'Change'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                  />

                  <div className="flex-1 space-y-2 text-center sm:text-start">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="gap-1.5 text-xs font-bold"
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5 text-primary" />
                        )}
                        {lang === 'ar' ? 'رفع صورة من جهازك' : 'Upload from device'}
                      </Button>
                      {googleAvatarUrl && avatarUrl !== googleAvatarUrl && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setAvatarUrl(googleAvatarUrl)}
                          className="gap-1.5 text-xs font-bold border-primary/40 text-primary hover:bg-primary/5"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          {lang === 'ar' ? 'استخدام صورة حساب Google' : 'Use Google photo'}
                        </Button>
                      )}
                      {avatarUrl && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setAvatarUrl('')}
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          {lang === 'ar' ? 'استخدام الحروف الافتراضية' : 'Use Initials'}
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {lang === 'ar'
                        ? 'أو اختر شخصية أدبية مميزة من الخيارات بالأسفل:'
                        : 'Or choose a literary character avatar below:'}
                    </p>

                    {/* Curated avatars row */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 overflow-x-auto">
                      {CURATED_AVATARS.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          title={item.labelAr}
                          onClick={() => setAvatarUrl(item.url)}
                          className={cn(
                            'relative w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 shrink-0',
                            avatarUrl === item.url
                              ? 'border-primary ring-2 ring-primary/30 scale-105'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          )}
                        >
                          <Image src={item.url} alt={item.labelAr} fill className="object-cover" unoptimized />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    {lang === 'ar' ? 'الاسم بالكامل (عربي أو إنجليزي)' : 'Full Name'}
                  </label>
                  <Input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. كريم عبد العزيز أو Layla Hassan"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    {lang === 'ar' ? 'الاسم بالعربية (اختياري)' : 'Arabic Name (Optional)'}
                  </label>
                  <Input
                    value={fullNameAr}
                    onChange={e => setFullNameAr(e.target.value)}
                    placeholder="مثال: ليلى حسن"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  {lang === 'ar' ? 'اسم المستخدم (معرّف الرابط @)' : 'Username (@ handle)'}
                </label>
                <div className="relative">
                  <AtSign className={cn("absolute top-3 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                  <Input
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="username_example"
                    className={isRTL ? "pe-9 ps-3" : "ps-9 pe-3"}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {lang === 'ar'
                    ? `رابط ملفك سيكون: bookswap.eg/profile/${username || 'username'}`
                    : `Your profile URL: bookswap.eg/profile/${username || 'username'}`}
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-foreground">
                    {lang === 'ar' ? 'نبذة عنك وعن شغفك بالقراءة (Bio)' : 'Bio / About You'}
                  </label>
                  <span className="text-[11px] text-muted-foreground">{bio.length}/250</span>
                </div>
                <Textarea
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 250))}
                  placeholder={
                    lang === 'ar'
                      ? 'قارئ مهتم بالروايات التاريخية والفلسفة. أحب تبادل الكتب في المعادي ومحطة الرمل...'
                      : 'Avid reader interested in historical fiction and philosophy...'
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* TAB 2: LOCATION */}
          {activeTab === 'location' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-center gap-2.5">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>
                  {lang === 'ar'
                    ? 'تحديد مدينتك ومنطقتك يساعد القراء في حيك على العثور على كتبك وتبادلها دون تكاليف شحن.'
                    : 'Setting your city and area helps nearby readers discover your books for local meetups.'}
                </span>
              </div>

              {/* City Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  {lang === 'ar' ? 'المحافظة / المدينة' : 'City / Governorate'}
                </label>
                <select
                  value={selectedCityId}
                  onChange={e => {
                    setSelectedCityId(e.target.value)
                    setSelectedAreaId('')
                  }}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                >
                  <option value="">{lang === 'ar' ? '-- اختر المحافظة --' : '-- Select City --'}</option>
                  {cities.map(c => (
                    <option key={c.id} value={c.id}>
                      {lang === 'ar' ? c.name_ar : c.name_en}
                    </option>
                  ))}
                </select>
              </div>

              {/* Area Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  {lang === 'ar' ? 'المنطقة / الحي' : 'Area / Neighborhood'}
                </label>
                <select
                  value={selectedAreaId}
                  onChange={e => setSelectedAreaId(e.target.value)}
                  disabled={!selectedCityId}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer disabled:opacity-50"
                >
                  <option value="">
                    {!selectedCityId
                      ? (lang === 'ar' ? '-- اختر المحافظة أولاً --' : '-- Select city first --')
                      : (lang === 'ar' ? '-- اختر المنطقة --' : '-- Select Area --')}
                  </option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>
                      {lang === 'ar' ? a.name_ar : a.name_en}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* TAB 3: READING GENRES */}
          {activeTab === 'genres' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-foreground">
                    {lang === 'ar' ? 'ما هي تصنيفات الكتب المفضلة لديك؟' : 'Favorite Book Categories'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {lang === 'ar'
                      ? 'اختر التصنيفات التي تستهويك لتلقي ترشيحات كتب وإشعارات مخصصة لاهتماماتك'
                      : 'Select genres you love to receive matching recommendations'}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-bold">
                  {selectedGenreIds.length} {lang === 'ar' ? 'محدد' : 'selected'}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {categories.map(cat => {
                  const isSelected = selectedGenreIds.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleGenre(cat.id)}
                      className={cn(
                        'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer',
                        isSelected
                          ? 'border-primary bg-primary text-white shadow-xs'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      <span>{cat.icon || '📖'}</span>
                      <span>{lang === 'ar' ? cat.name_ar : cat.name_en}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 ms-1" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 4: CONTACT & PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  {lang === 'ar' ? 'رقم الواتساب للتواصل' : 'WhatsApp Contact Number'}
                </label>
                <div className="relative">
                  <Phone className={cn("absolute top-3 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                  <Input
                    value={whatsappNumber}
                    onChange={e => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. 01012345678 أو +201012345678"
                    className={isRTL ? "pe-9 ps-3" : "ps-9 pe-3"}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {lang === 'ar'
                    ? 'يستخدم لتسهيل تنسيق المقابلات واستلام الكتب مع الأطراف الأخرى'
                    : 'Used to coordinate meetups and drop-offs smoothly'}
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/20">
                <input
                  type="checkbox"
                  id="show_whatsapp"
                  checked={showWhatsapp}
                  onChange={e => setShowWhatsapp(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-md border-border text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="show_whatsapp" className="text-xs cursor-pointer select-none">
                  <span className="font-bold text-foreground block mb-0.5">
                    {lang === 'ar'
                      ? 'إظهار رقم الواتساب لشركاء الصفقات المقبولة فقط'
                      : 'Show WhatsApp number to accepted trading partners only'}
                  </span>
                  <span className="text-muted-foreground text-[11px] block">
                    {lang === 'ar'
                      ? 'لن يظهر رقمك للعامة على ملفك، بل فقط للشخص الذي تقبل مقابلته أو تبادل كتاب معه.'
                      : 'Keeps your number private from the public; only revealed once a transaction is agreed.'}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="text-xs font-bold"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadingAvatar}
              className="gap-2 text-xs font-bold bg-primary shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
