'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User,
  MapPin,
  BookOpen,
  Phone,
  Shield,
  Camera,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  AtSign,
  Globe,
  Lock,
  Mail,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MainLayout } from '@/components/layout/main-layout'
import { useLanguage } from '@/i18n/language-context'
import { useAuth } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/client'
import { getAvatarUrl, cn } from '@/lib/utils'
import type { Category, City, Area, Profile } from '@/types'

const CURATED_AVATARS = [
  { id: 'av1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', labelAr: 'القارئة الكلاسيكية' },
  { id: 'av2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', labelAr: 'الباحث الأدبي' },
  { id: 'av3', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80', labelAr: 'قهوة وكتاب' },
  { id: 'av4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', labelAr: 'المفكر الفلسفي' },
  { id: 'av5', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80', labelAr: 'الروائية المعاصرة' },
  { id: 'av6', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80', labelAr: 'عاشق الخيال' },
]

export interface ProfileSettingsClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any
  categories: Category[]
  cities: Array<City & { areas: Area[] }>
  initialGenreIds: string[]
}

export function ProfileSettingsClient({
  profile,
  categories,
  cities,
  initialGenreIds = [],
}: ProfileSettingsClientProps) {
  const { lang, setLang, isRTL } = useLanguage()
  const router = useRouter()
  const { user, refreshProfile, signOut } = useAuth()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<'profile' | 'location' | 'interests' | 'security'>('profile')

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [fullNameAr, setFullNameAr] = useState(profile?.full_name_ar || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [whatsappNumber, setWhatsappNumber] = useState(profile?.whatsapp_number || '')
  const [showWhatsapp, setShowWhatsapp] = useState(Boolean(profile?.show_whatsapp))

  const [selectedCityId, setSelectedCityId] = useState(profile?.city_id || '')
  const [selectedAreaId, setSelectedAreaId] = useState(profile?.area_id || '')
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>(initialGenreIds)

  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [passwordResetSent, setPasswordResetSent] = useState(false)

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
      const ext = file.name.split('.').pop() || 'jpg'
      const filePath = `${profile.id}/avatar-${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadErr) {
        console.warn('Storage upload error, using fallback reader:', uploadErr)
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setAvatarUrl(reader.result)
          }
        }
        reader.readAsDataURL(file)
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)
        setAvatarUrl(publicUrl)
      }
    } catch (err) {
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

  const handleSendPasswordReset = async () => {
    if (!user?.email) return
    setError(null)
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile/settings`,
      })
      if (resetErr) throw resetErr
      setPasswordResetSent(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email'
      setError(msg)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const cleanUsername = username.trim().toLowerCase()
      if (cleanUsername) {
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

      // Refresh global context
      await refreshProfile()

      setSuccessMsg(
        lang === 'ar'
          ? 'تم حفظ وتحديث إعدادات ملفك الشخصي بنجاح! ✨'
          : 'Profile settings saved successfully! ✨'
      )

      router.refresh()
    } catch (err: unknown) {
      console.error('Error updating settings:', err)
      const msg = err instanceof Error ? err.message : (lang === 'ar' ? 'فشل حفظ التعديلات' : 'Failed to save changes')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const profileLink = `/profile/${profile.username || profile.id}`

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={profileLink}
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
          >
            {isRTL ? <ArrowRight className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> : <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />}
            <span>{lang === 'ar' ? 'العودة إلى ملفي الشخصي' : 'Back to My Profile'}</span>
          </Link>
          <Link href={profileLink}>
            <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>{lang === 'ar' ? 'معاينة الملف' : 'View Public Profile'}</span>
            </Button>
          </Link>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {lang === 'ar' ? 'إعدادات الملف الشخصي والحساب ⚙️' : 'Profile & Account Settings ⚙️'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar'
              ? 'تحكم في معلوماتك الشخصية، صورتك، اهتماماتك الأدبية، وبيانات التواصل'
              : 'Manage your public details, avatar, reading interests and contact privacy'}
          </p>
        </div>

        {/* Global Feedback Banners */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold animate-in fade-in">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Sidebar Tabs */}
          <div className="md:col-span-4 space-y-2">
            {[
              { id: 'profile', icon: User, labelAr: 'البيانات الشخصية والصورة', labelEn: 'Profile & Avatar' },
              { id: 'location', icon: MapPin, labelAr: 'الموقع والحي الجغرافي', labelEn: 'Location & Area' },
              { id: 'interests', icon: BookOpen, labelAr: 'اهتمامات القراءة والتصنيفات', labelEn: 'Reading Interests' },
              { id: 'security', icon: Shield, labelAr: 'التواصل، الخصوصية والأمان', labelEn: 'Contact & Security' },
            ].map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-start cursor-pointer border',
                    active
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
                  {active && <ChevronRight className={cn("h-4 w-4", isRTL && "rotate-180")} />}
                </button>
              )
            })}

            {/* Quick Live Preview Card */}
            <div className="mt-6 p-4 rounded-2xl border border-border bg-card/60 shadow-xs space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {lang === 'ar' ? 'معاينة بطاقة ملفك:' : 'Live Profile Card Preview:'}
              </p>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-primary/20 shrink-0">
                  <Image
                    src={getAvatarUrl(avatarUrl, fullName)}
                    alt={fullName || 'Avatar'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-foreground truncate">{fullName || 'القارئ'}</h4>
                  <p className="text-[11px] text-primary font-bold truncate">@{username || 'username'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {selectedCity ? (lang === 'ar' ? selectedCity.name_ar : selectedCity.name_en) : 'مصر'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="md:col-span-8">
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              {/* TAB 1: PROFILE & AVATAR */}
              {activeTab === 'profile' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="border-b border-border pb-4">
                    <h2 className="text-base font-black text-foreground">
                      {lang === 'ar' ? 'البيانات الشخصية والصورة' : 'Personal Details & Avatar'}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lang === 'ar'
                        ? 'تظهر هذه المعلومات للعامة في مجتمع القرّاء وعلى بطاقات كتبك'
                        : 'This information is publicly visible on your library shelves'}
                    </p>
                  </div>

                  {/* Avatar Upload / Choice */}
                  <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                    <label className="block text-xs font-bold text-foreground">
                      {lang === 'ar' ? 'صورة الملف الشخصي' : 'Profile Avatar'}
                    </label>

                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      <div className="relative group shrink-0">
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary/40 shadow-sm">
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
                          <Camera className="h-4 w-4 mb-0.5" />
                          <span>{lang === 'ar' ? 'تغيير' : 'Change'}</span>
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
                            {lang === 'ar' ? 'رفع صورة من جهازك' : 'Upload photo'}
                          </Button>
                          {avatarUrl && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setAvatarUrl('')}
                              className="text-xs text-muted-foreground hover:text-destructive"
                            >
                              {lang === 'ar' ? 'استخدام الأحرف الأولى' : 'Reset to initials'}
                            </Button>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {lang === 'ar'
                            ? 'أو اختر شخصية أدبية مميزة من الخيارات التالية:'
                            : 'Or choose a literary character avatar below:'}
                        </p>

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
                        {lang === 'ar' ? 'الاسم بالكامل' : 'Full Name'}
                      </label>
                      <Input
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Layla Hassan أو كريم عبد العزيز"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">
                        {lang === 'ar' ? 'الاسم بالعربية (اختياري)' : 'Arabic Display Name'}
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
                        placeholder="username"
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
                          ? 'قارئ شغوف بالروايات والأدب العالمي. أهتم بالتبادل في الإسكندرية والقاهرة...'
                          : 'Book lover interested in historical fiction and science...'
                      }
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: LOCATION */}
              {activeTab === 'location' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="border-b border-border pb-4">
                    <h2 className="text-base font-black text-foreground">
                      {lang === 'ar' ? 'الموقع الجغرافي والحي' : 'Location & Neighborhood'}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lang === 'ar'
                        ? 'تحديد منطقتك يسهل اكتشاف الصفقات والتبادلات القريبة منك بدون شحن'
                        : 'Helps nearby readers discover your books for zero-cost street meetups'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-center gap-2.5">
                    <MapPin className="h-5 w-5 text-primary shrink-0" />
                    <span>
                      {lang === 'ar'
                        ? 'المدن والمناطق النشطة حالياً تشمل الإسكندرية (محطة الرمل، سان ستيفانو، سموحة) والقاهرة والجيزة (المعادي، وسط البلد، مدينة نصر، التجمع).'
                        : 'Active hubs include Alexandria and Cairo/Giza districts.'}
                    </span>
                  </div>

                  {/* City */}
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

                  {/* Area */}
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
                          ? (lang === 'ar' ? '-- اختر المحافظة أولاً --' : '-- Select City First --')
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

              {/* TAB 3: READING INTERESTS */}
              {activeTab === 'interests' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="border-b border-border pb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-black text-foreground">
                        {lang === 'ar' ? 'اهتمامات القراءة والتصنيفات' : 'Reading Interests & Genres'}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lang === 'ar'
                          ? 'اختر مجالاتك المفضلة لتلقي إشعارات بالكتب الجديدة التي يتم طرحها قربك'
                          : 'Select genres you read to receive radar alerts when new copies are listed'}
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
                            'flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer',
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

              {/* TAB 4: CONTACT & SECURITY */}
              {activeTab === 'security' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="border-b border-border pb-4">
                    <h2 className="text-base font-black text-foreground">
                      {lang === 'ar' ? 'التواصل، الخصوصية والأمان' : 'Contact, Privacy & Security'}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lang === 'ar'
                        ? 'إدارة رقم الواتساب، خصوصية الهاتف، وحسابك المسجل'
                        : 'Manage your WhatsApp number, phone privacy, and account security'}
                    </p>
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      {lang === 'ar' ? 'رقم الواتساب للتنسيق' : 'WhatsApp Number for Coordination'}
                    </label>
                    <div className="relative">
                      <Phone className={cn("absolute top-3 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                      <Input
                        value={whatsappNumber}
                        onChange={e => setWhatsappNumber(e.target.value)}
                        placeholder="01012345678"
                        className={isRTL ? "pe-9 ps-3" : "ps-9 pe-3"}
                      />
                    </div>
                  </div>

                  {/* WhatsApp Privacy Toggle */}
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/20">
                    <input
                      type="checkbox"
                      id="show_whatsapp_settings"
                      checked={showWhatsapp}
                      onChange={e => setShowWhatsapp(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded-md border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="show_whatsapp_settings" className="text-xs cursor-pointer select-none">
                      <span className="font-bold text-foreground block mb-0.5">
                        {lang === 'ar'
                          ? 'إظهار رقم الواتساب لشركاء الصفقات المقبولة فقط'
                          : 'Show WhatsApp to accepted transaction partners only'}
                      </span>
                      <span className="text-muted-foreground text-[11px] block">
                        {lang === 'ar'
                          ? 'يحمي رقمك من الظهور في العلن، ويكشفه فقط لمن توافق على مقابلته أو تبادل كتاب معه.'
                          : 'Keeps your phone hidden from the public and reveals it only upon accepted transactions.'}
                      </span>
                    </label>
                  </div>

                  {/* Account Email & Password */}
                  <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                    <h3 className="text-xs font-black text-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>{lang === 'ar' ? 'البريد الإلكتروني والأمان' : 'Email & Password'}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {lang === 'ar' ? 'البريد المسجل:' : 'Registered Email:'}{' '}
                      <span className="font-bold text-foreground">{user?.email || profile?.email || 'N/A'}</span>
                    </p>

                    <div className="pt-2">
                      {passwordResetSent ? (
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {lang === 'ar'
                            ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح! 📨'
                            : 'Password reset link sent to your email successfully! 📨'}
                        </p>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSendPasswordReset}
                          className="text-xs font-bold gap-1.5"
                        >
                          <Lock className="h-3.5 w-3.5 text-primary" />
                          <span>{lang === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Send Password Reset Email'}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="pt-6 border-t border-border flex items-center justify-between">
                <Link href={profileLink}>
                  <Button type="button" variant="ghost" size="sm" className="text-xs font-bold">
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                </Link>

                <Button
                  type="submit"
                  disabled={loading || uploadingAvatar}
                  className="gap-2 text-xs font-bold bg-primary shadow-xs px-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>{lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
