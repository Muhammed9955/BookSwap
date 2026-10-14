'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MapPin,
  BookOpen,
  PlusCircle,
  Check,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'
import { Category, Profile } from '@/types'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/i18n/language-context'
import { useAuth } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface OnboardingClientProps {
  userId: string
  profile?: Partial<Profile> | null
  categories: Category[]
  cities: Array<{
    id: string
    name_ar: string
    name_en: string
    slug: string
    areas: Array<{ id: string; name_ar: string; name_en: string }>
  }>
  initialGenreIds?: string[]
}

export function OnboardingClient({
  userId,
  profile,
  categories,
  cities,
  initialGenreIds = [],
}: OnboardingClientProps) {
  const { lang, isRTL } = useLanguage()
  const router = useRouter()
  const { profile: ctxProfile, refreshProfile } = useAuth()
  const supabase = createClient()

  // Guard: if user has already completed onboarding, never repeat it
  useEffect(() => {
    if (profile?.onboarding_completed || ctxProfile?.onboarding_completed) {
      router.replace('/')
    }
  }, [profile?.onboarding_completed, ctxProfile?.onboarding_completed, router])

  const initialStep = Math.min(Math.max((profile?.onboarding_step ?? 0) + 1, 1), 3)
  const [step, setStep] = useState(initialStep > 3 ? 1 : initialStep)
  const [selectedCityId, setSelectedCityId] = useState(profile?.city_id || '')
  const [selectedAreaId, setSelectedAreaId] = useState(profile?.area_id || '')
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenreIds)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedCity = cities.find(c => c.id === selectedCityId)
  const areas = selectedCity?.areas ?? []

  const toggleGenre = (catId: string) => {
    setSelectedGenres(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    )
  }

  // Finalize onboarding in DB and refresh session so it's NEVER repeated
  const completeOnboarding = async (targetPath: string) => {
    setLoading(true)
    setError(null)
    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_step: 3,
        })
        .eq('id', userId)

      if (updateErr) {
        console.error('Failed to mark onboarding completed:', updateErr)
      }

      await refreshProfile()
      router.refresh()
      router.push(targetPath)
    } catch (err) {
      console.error('Error completing onboarding:', err)
      router.push(targetPath)
    } finally {
      setLoading(false)
    }
  }

  const saveAndNext = async () => {
    setLoading(true)
    setError(null)

    try {
      if (step === 1) {
        if (!selectedCityId) {
          setError(
            lang === 'ar' ? 'يرجى اختيار المحافظة أولاً للمتابعة' : 'Please select your city to continue'
          )
          setLoading(false)
          return
        }

        await supabase
          .from('profiles')
          .update({
            city_id: selectedCityId || null,
            area_id: selectedAreaId || null,
            onboarding_step: 1,
          })
          .eq('id', userId)

        await refreshProfile()
        setStep(2)
      } else if (step === 2) {
        // Save genres to profile_genres table
        if (selectedGenres.length > 0) {
          await supabase.from('profile_genres').delete().eq('profile_id', userId)
          await supabase.from('profile_genres').insert(
            selectedGenres.map(catId => ({ profile_id: userId, category_id: catId }))
          )
        }

        await supabase
          .from('profiles')
          .update({ onboarding_step: 2 })
          .eq('id', userId)

        await refreshProfile()
        setStep(3)
      } else if (step === 3) {
        await completeOnboarding('/')
      }
    } catch (err) {
      console.error('Onboarding step error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddFirstBook = async () => {
    await completeOnboarding('/books/add')
  }

  const skip = async () => {
    await completeOnboarding('/')
  }

  const steps = [
    { num: 1, icon: MapPin, labelAr: 'موقعك', labelEn: 'Location' },
    { num: 2, icon: BookOpen, labelAr: 'اهتماماتك', labelEn: 'Interests' },
    { num: 3, icon: PlusCircle, labelAr: 'أضف كتاب', labelEn: 'Add Book' },
  ]

  // Expanded book types & trading features for Step 3
  const bookFeatures = [
    { emoji: '🔄', titleAr: 'تبادل كتب', titleEn: 'Swap' },
    { emoji: '💰', titleAr: 'بيع وشراء', titleEn: 'Buy & Sell' },
    { emoji: '⏳', titleAr: 'إعارة واستعارة', titleEn: 'Borrow & Lend' },
    { emoji: '🎁', titleAr: 'تبرع وإهداء', titleEn: 'Donate' },
    { emoji: '🎓', titleAr: 'كتب جامعية ومراجع', titleEn: 'Textbooks' },
    { emoji: '📖', titleAr: 'روايات وأدب', titleEn: 'Novels' },
    { emoji: '🧠', titleAr: 'تطوير الذات', titleEn: 'Self-Help' },
    { emoji: '🎨', titleAr: 'مانجا وكوميكس', titleEn: 'Manga & Comics' },
    { emoji: '👶', titleAr: 'كتب أطفال', titleEn: 'Kids Books' },
    { emoji: '📜', titleAr: 'طبعات نادرة', titleEn: 'Rare & Vintage' },
  ]

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-muted/30 to-background flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl bg-card border-2 border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Progress Header */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
          {steps.map((s, i) => {
            const isDone = step > s.num
            const isCurrent = step === s.num
            const Icon = s.icon

            return (
              <div key={s.num} className="flex items-center">
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all',
                    isDone
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : isCurrent
                      ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 scale-105'
                      : 'border-border/80 text-muted-foreground bg-muted/40'
                  )}
                >
                  {isDone ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {lang === 'ar' ? s.labelAr : s.labelEn}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-6 sm:w-10 mx-1 transition-colors',
                      step > s.num ? 'bg-emerald-500' : 'bg-border'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-bold text-destructive text-center animate-in fade-in">
            {error}
          </div>
        )}

        {/* Step 1 — Location */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-1">
                <MapPin className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                {lang === 'ar' ? 'أنت فين؟' : 'Where are you?'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {lang === 'ar'
                  ? 'علشان نوريلك الكتب القريبة منك'
                  : 'So we can show you nearby books'}
              </p>
            </div>

            <div className="space-y-4">
              {/* City Selection */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 text-start">
                  {lang === 'ar' ? 'اختر المحافظة' : 'Select City'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {cities.map(city => {
                    const isSelected = selectedCityId === city.id
                    return (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => {
                          setSelectedCityId(city.id)
                          setSelectedAreaId('')
                          setError(null)
                        }}
                        className={cn(
                          'relative p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between text-start cursor-pointer select-none group',
                          isSelected
                            ? 'border-primary bg-primary text-white font-black shadow-lg shadow-primary/25 scale-[1.02] ring-2 ring-primary/30'
                            : 'border-border/80 bg-muted/20 hover:border-primary/50 text-foreground font-bold hover:bg-muted/50'
                        )}
                      >
                        <span className={cn('text-sm font-bold tracking-tight', isSelected ? 'text-white font-black' : 'text-foreground')}>
                          {lang === 'ar' ? city.name_ar : city.name_en}
                        </span>
                        {isSelected ? (
                          <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-white/25 border-2 border-white text-white shadow-xs">
                            <Check className="h-3.5 w-3.5 stroke-[4] text-white" />
                          </span>
                        ) : (
                          <span className="h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/40 group-hover:border-primary/60 transition-colors" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Area Selection */}
              {areas.length > 0 && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 text-start">
                    {lang === 'ar' ? 'اختار منطقتك (اختياري)' : 'Select Area (Optional)'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {areas.map(area => {
                      const isSelected = selectedAreaId === area.id
                      return (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => setSelectedAreaId(area.id)}
                          className={cn(
                            'p-2.5 rounded-xl border-2 transition-all flex items-center justify-between text-start cursor-pointer select-none group',
                            isSelected
                              ? 'border-primary bg-primary text-white font-black shadow-md shadow-primary/20 scale-[1.02] ring-2 ring-primary/30'
                              : 'border-border/70 bg-muted/20 hover:border-primary/40 text-foreground font-semibold hover:bg-muted/50'
                          )}
                        >
                          <span className={cn('text-xs font-bold', isSelected ? 'text-white font-black' : 'text-foreground')}>
                            {lang === 'ar' ? area.name_ar : area.name_en}
                          </span>
                          {isSelected && (
                            <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-white/25 border border-white text-white">
                              <Check className="h-3 w-3 stroke-[4] text-white" />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2 — Genres */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-1">
                <BookOpen className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                {lang === 'ar' ? 'إيه الكتب اللي بتحبها؟' : 'What books do you like?'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {lang === 'ar'
                  ? 'اختار التصنيفات اللي بتهمك'
                  : "Select genres you're interested in"}
              </p>
              {selectedGenres.length > 0 && (
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {lang === 'ar'
                      ? `تم اختيار ${selectedGenres.length} تصنيفات`
                      : `${selectedGenres.length} genres selected`}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {categories.map(cat => {
                const isSelected = selectedGenres.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleGenre(cat.id)}
                    className={cn(
                      'relative p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-2.5 text-start cursor-pointer select-none group',
                      isSelected
                        ? 'border-primary bg-primary text-white font-black shadow-lg shadow-primary/25 scale-[1.02] ring-2 ring-primary/30'
                        : 'border-border/80 bg-muted/20 hover:border-primary/40 text-foreground font-bold hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{cat.icon}</span>
                      <span className={cn(
                        'text-sm font-bold leading-tight break-words',
                        isSelected ? 'text-white font-black' : 'text-foreground'
                      )}>
                        {lang === 'ar' ? cat.name_ar : cat.name_en}
                      </span>
                    </div>
                    {isSelected ? (
                      <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-white/25 border-2 border-white text-white shadow-xs">
                        <Check className="h-3.5 w-3.5 stroke-[4] text-white" />
                      </span>
                    ) : (
                      <span className="h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/40 group-hover:border-primary/60 transition-colors" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3 — Previous UI Style with Expanded Book Types */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <div>
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-black text-foreground">
                {lang === 'ar' ? 'عندك كتب عايز تبيعها أو تبدلها؟' : 'Have books to sell or swap?'}
              </h2>
              <p className="text-muted-foreground mt-1 text-sm font-medium">
                {lang === 'ar' ? 'أضف أول كتاب وابدأ رحلتك على BookSwap' : 'Add your first book and start your journey'}
              </p>
            </div>

            <div className="space-y-4">
              <Button
                id="onboarding-add-book-btn"
                size="xl"
                className="w-full font-black text-base shadow-xl shadow-primary/25 cursor-pointer py-6 rounded-2xl gap-2"
                onClick={handleAddFirstBook}
                loading={loading}
              >
                📚 {lang === 'ar' ? 'أضف أول كتاب الآن' : 'Add First Book Now'}
              </Button>

              {/* Expanded Book Types & Features Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                {bookFeatures.map(item => (
                  <div
                    key={item.titleEn}
                    className="flex items-center gap-2.5 p-3.5 rounded-2xl border border-border/80 bg-muted/20 text-start transition-all hover:border-primary/40"
                  >
                    <span className="text-2xl shrink-0">{item.emoji}</span>
                    <span className="text-sm font-black text-foreground leading-snug">
                      {lang === 'ar' ? item.titleAr : item.titleEn}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-border/60 mt-8 gap-3">
          {step > 1 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(prev => prev - 1)}
              disabled={loading}
              className="font-bold text-xs sm:text-sm cursor-pointer gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className={cn('h-4 w-4', isRTL && 'rotate-180')} />
              {lang === 'ar' ? 'السابق' : 'Back'}
            </Button>
          ) : (
            <button
              type="button"
              onClick={skip}
              disabled={loading}
              className="text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {lang === 'ar' ? 'تخطي دلوقتي' : 'Skip for now'}
            </button>
          )}

          {step < 3 ? (
            <Button
              id={`onboarding-next-step-${step}`}
              type="button"
              onClick={saveAndNext}
              loading={loading}
              className="font-black text-sm px-6 py-2.5 rounded-xl shadow-md shadow-primary/20 gap-2 cursor-pointer"
            >
              {lang === 'ar' ? 'التالي' : 'Next'}
              <ArrowRight className={cn('h-4 w-4', isRTL && 'rotate-180')} />
            </Button>
          ) : (
            <Button
              id="onboarding-finish-btn"
              type="button"
              onClick={() => completeOnboarding('/')}
              loading={loading}
              className="font-black text-sm px-6 py-2.5 rounded-xl shadow-md shadow-primary/20 cursor-pointer"
            >
              {lang === 'ar' ? 'ابدأ التصفح' : 'Start Browsing'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
