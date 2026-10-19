'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Trophy,
  Flame,
  Zap,
  Calendar,
  BookOpen,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Share2,
  Clock,
  Award,
  Plus,
  Compass,
  Bookmark,
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/i18n/language-context'
import { cn } from '@/lib/utils'
import type { ReadingChallenge, UserChallengeProgress, ChallengeType } from '@/types/challenge'
import {
  getUserChallengeProgress,
  saveUserChallengeProgress,
} from '@/lib/challenges/challenge-service'

interface ChallengesHubClientProps {
  initialChallenges: ReadingChallenge[]
  currentUserId?: string | null
}

export function ChallengesHubClient({
  initialChallenges,
  currentUserId,
}: ChallengesHubClientProps) {
  const { lang, isRTL } = useLanguage()
  const [activeFilter, setActiveFilter] = useState<ChallengeType | 'ALL'>('ALL')
  const [userProgressMap, setUserProgressMap] = useState<Record<string, UserChallengeProgress>>({})
  const [activeLoggingChallenge, setActiveLoggingChallenge] = useState<ReadingChallenge | null>(null)
  const [loggedPages, setLoggedPages] = useState<number>(20)
  const [celebrationBadge, setCelebrationBadge] = useState<any | null>(null)

  // Load user progress from local storage
  useEffect(() => {
    const map: Record<string, UserChallengeProgress> = {}
    initialChallenges.forEach(c => {
      map[c.id] = getUserChallengeProgress(c.id)
    })
    setUserProgressMap(map)
  }, [initialChallenges])

  const filteredChallenges =
    activeFilter === 'ALL'
      ? initialChallenges
      : initialChallenges.filter(c => c.type === activeFilter)

  // Handle Join Challenge
  const handleJoinChallenge = (challenge: ReadingChallenge) => {
    const current = userProgressMap[challenge.id] || getUserChallengeProgress(challenge.id)
    const updated: UserChallengeProgress = {
      ...current,
      is_joined: true,
      last_activity_at: new Date().toISOString(),
      current_streak_days: Math.max(1, current.current_streak_days),
    }
    saveUserChallengeProgress(updated)
    setUserProgressMap(prev => ({ ...prev, [challenge.id]: updated }))
  }

  // Handle Log Reading Progress
  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeLoggingChallenge) return

    const current = userProgressMap[activeLoggingChallenge.id]
    const newPages = (current?.pages_read || 0) + loggedPages
    const targetPages = activeLoggingChallenge.target_pages_count || activeLoggingChallenge.target_books_count * 200
    const newBooks = Math.min(
      activeLoggingChallenge.target_books_count,
      Math.floor((newPages / targetPages) * activeLoggingChallenge.target_books_count)
    )
    const isCompleted = newPages >= targetPages || newBooks >= activeLoggingChallenge.target_books_count

    const updated: UserChallengeProgress = {
      ...current,
      is_joined: true,
      pages_read: newPages,
      books_completed: newBooks,
      current_streak_days: (current?.current_streak_days || 0) + 1,
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : undefined,
      last_activity_at: new Date().toISOString(),
    }

    saveUserChallengeProgress(updated)
    setUserProgressMap(prev => ({ ...prev, [activeLoggingChallenge.id]: updated }))
    setActiveLoggingChallenge(null)

    if (isCompleted) {
      setCelebrationBadge(activeLoggingChallenge.badge)
    }
  }

  // Compute total user stats
  const totalJoined = Object.values(userProgressMap).filter(p => p.is_joined).length
  const totalCompleted = Object.values(userProgressMap).filter(p => p.is_completed).length
  const maxStreak = Math.max(
    0,
    ...Object.values(userProgressMap).map(p => p.current_streak_days || 0)
  )

  return (
    <MainLayout>
      <div className="page-container py-10 max-w-7xl">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-700 p-8 sm:p-12 text-white shadow-xl mb-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black border border-white/30">
              <Flame className="h-4 w-4 text-amber-300 fill-amber-300" />
              <span>{lang === 'ar' ? 'مجتمع قراء وَرَق • تحديات القراءة ومارثون الكتب' : 'WARAQ Reading Quests & Challenges'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {lang === 'ar'
                ? 'حوّل القراءة إلى عادة يومية ومغامرة شيقة 📚🔥'
                : 'Turn Reading into an Addictive Daily Adventure 📚🔥'}
            </h1>

            <p className="text-sm sm:text-base text-white/90 leading-relaxed font-medium">
              {lang === 'ar'
                ? 'سبرنتات عطلة نهاية الأسبوع، تحديات إنهاء 4 كتب شهرياً، وماراثون أدب نوبل. شارك آلاف القراء في مصر، اجمع الأوسمة والنقاط، واشعل شعلة القراءة المستمرة!'
                : 'Weekend sprints, 4-books-a-month quests, and Nobel heritage marathons. Join thousands of readers, collect badges, and never lose your reading flame.'}
            </p>

            {/* User Quick Stats Ribbon */}
            <div className="pt-4 grid grid-cols-3 gap-3 sm:gap-6 max-w-md">
              <div className="p-3 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20 text-center">
                <span className="text-xl sm:text-2xl font-black block">{totalJoined}</span>
                <span className="text-[11px] text-white/80 font-bold block">
                  {lang === 'ar' ? 'تحديات انضممت لها' : 'Active Quests'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20 text-center">
                <span className="text-xl sm:text-2xl font-black block text-amber-300 flex items-center justify-center gap-1">
                  <span>{maxStreak}</span>
                  <Flame className="h-4 w-4 fill-amber-300" />
                </span>
                <span className="text-[11px] text-white/80 font-bold block">
                  {lang === 'ar' ? 'أيام الستريك 🔥' : 'Streak Days 🔥'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20 text-center">
                <span className="text-xl sm:text-2xl font-black block text-emerald-300 flex items-center justify-center gap-1">
                  <span>{totalCompleted}</span>
                  <Trophy className="h-4 w-4" />
                </span>
                <span className="text-[11px] text-white/80 font-bold block">
                  {lang === 'ar' ? 'أوسمة منجزة 🏆' : 'Badges Won 🏆'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {[
            { id: 'ALL', labelAr: 'كل التحديات والماراثونات (7)', labelEn: 'All Challenges (7)' },
            { id: 'WEEKLY_SPRINT', labelAr: 'سبرنتات أسبوعية ⚡', labelEn: 'Weekly Sprints ⚡' },
            { id: 'MONTHLY_GOAL', labelAr: 'تحدي الشهر (4 كتب) 🏆', labelEn: 'Monthly Goals 🏆' },
            { id: 'HABIT_STREAK', labelAr: 'بناء العادة اليومية 🔥', labelEn: 'Daily Habit Streaks 🔥' },
            { id: 'THEMED_QUEST', labelAr: 'ماراثون أدب نوبل والمعرفة 🏛️', labelEn: 'Themed Heritage Quests 🏛️' },
            { id: 'SWAP_CIRCULAR', labelAr: 'تحدي التدوير: اقرأ وبادل 🔄', labelEn: 'Swap Circular Quest 🔄' },
            { id: 'YEARLY_TARGET', labelAr: 'تحدي عام 2026 📚', labelEn: 'Annual 2026 Target 📚' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as any)}
              className={cn(
                'px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shadow-xs',
                activeFilter === tab.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-102'
                  : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/70'
              )}
            >
              {lang === 'ar' ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map(challenge => {
            const progress = userProgressMap[challenge.id]
            const isJoined = progress?.is_joined
            const isCompleted = progress?.is_completed
            const targetPages = challenge.target_pages_count || challenge.target_books_count * 200
            const currentPages = progress?.pages_read || 0
            const progressPct = Math.min(100, Math.round((currentPages / targetPages) * 100))

            return (
              <div
                key={challenge.id}
                className={cn(
                  'group rounded-3xl border-2 bg-card overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between',
                  isCompleted
                    ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-500/5 via-card to-card'
                    : isJoined
                    ? 'border-primary/50'
                    : 'border-border/80 hover:border-primary/40'
                )}
              >
                <div>
                  {/* Challenge Cover */}
                  <div className="relative h-44 w-full overflow-hidden bg-muted">
                    <Image
                      src={challenge.cover_image_url}
                      alt=""
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Top Chips */}
                    <div className="absolute top-3 start-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black backdrop-blur-md bg-black/60 text-white border border-white/20">
                        {challenge.type}
                      </span>
                      <span className="px-2 py-0.5 rounded-xl text-[10px] font-black bg-amber-500 text-slate-950 font-bold shadow-xs">
                        +{challenge.badge.xp} XP
                      </span>
                    </div>

                    {/* Badge Icon on Cover */}
                    <div className="absolute bottom-3 start-3 flex items-center gap-2">
                      <div className="h-10 w-10 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-center text-xl shadow-lg border border-white/30">
                        {challenge.badge.icon}
                      </div>
                      <div className="text-white drop-shadow-md">
                        <span className="text-[10px] opacity-80 block font-semibold leading-none">
                          {lang === 'ar' ? 'وسام الإنجاز:' : 'Reward Badge:'}
                        </span>
                        <span className="text-xs font-black block">
                          {lang === 'ar' ? challenge.badge.name_ar : challenge.badge.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span>{challenge.duration_days} {lang === 'ar' ? 'يوماً' : 'days'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{challenge.participant_count} {lang === 'ar' ? 'مشارك' : 'readers'}</span>
                      </span>
                    </div>

                    <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                      {lang === 'ar' ? challenge.title_ar : challenge.title}
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {lang === 'ar' ? challenge.description_ar : challenge.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {challenge.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-lg bg-muted text-[10px] font-bold text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Active Progress Bar if Joined */}
                    {isJoined && (
                      <div className="pt-3 border-t border-border/60 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-black">
                          <span className="text-foreground flex items-center gap-1">
                            <span>{progressPct}% {lang === 'ar' ? 'مكتمل' : 'done'}</span>
                            {isCompleted && <span className="text-emerald-500 font-bold">✓</span>}
                          </span>
                          <span className="text-muted-foreground">
                            {currentPages} / {targetPages} {lang === 'ar' ? 'صفحة' : 'pages'}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              isCompleted ? 'bg-emerald-500' : 'bg-primary'
                            )}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-5 pt-0">
                  {isCompleted ? (
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xs text-center flex items-center justify-center gap-2">
                      <Trophy className="h-4 w-4" />
                      <span>{lang === 'ar' ? 'تم إنجاز التحدي والفوز بالوسام! 🎉' : 'Challenge Completed! 🎉'}</span>
                    </div>
                  ) : isJoined ? (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          setActiveLoggingChallenge(challenge)
                          setLoggedPages(challenge.daily_pages_goal || 25)
                        }}
                        className="flex-1 rounded-2xl font-black text-xs gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{lang === 'ar' ? 'تسجيل صفحات اليوم 📖' : 'Log Today’s Reading'}</span>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleJoinChallenge(challenge)}
                      variant="outline"
                      className="w-full rounded-2xl font-black text-xs gap-1.5 border-border hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
                    >
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span>{lang === 'ar' ? 'انضم إلى التحدي الآن' : 'Join Challenge'}</span>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal: Log Reading Progress */}
        {activeLoggingChallenge && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="rounded-3xl border-2 border-border bg-card p-6 w-full max-w-md shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-black text-foreground text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>{lang === 'ar' ? 'سجل تقدمك في القراءة اليوم' : 'Log Today’s Reading Progress'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveLoggingChallenge(null)}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveProgress} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    {lang === 'ar' ? 'التحدي النشط:' : 'Active Challenge:'}
                  </span>
                  <p className="text-xs font-black text-foreground mt-0.5">
                    {lang === 'ar' ? activeLoggingChallenge.title_ar : activeLoggingChallenge.title}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-foreground flex items-center justify-between">
                    <span>{lang === 'ar' ? 'كم عدد الصفحات التي قرأتها اليوم؟' : 'How many pages read today?'}</span>
                    <span className="text-primary font-mono text-sm">{loggedPages} {lang === 'ar' ? 'صفحة' : 'pages'}</span>
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    step={5}
                    value={loggedPages}
                    onChange={e => setLoggedPages(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>5 {lang === 'ar' ? 'صفحات' : 'pages'}</span>
                    <span>50 {lang === 'ar' ? 'صفحة' : 'pages'}</span>
                    <span>120+ {lang === 'ar' ? 'صفحة' : 'pages'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveLoggingChallenge(null)}
                    className="rounded-xl font-bold text-xs"
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" className="rounded-xl font-black text-xs gap-1.5 shadow-md shadow-primary/25">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'تأكيد وحفظ التقدم 🔥' : 'Confirm & Save 🔥'}</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Celebration Badge Unlocked */}
        {celebrationBadge && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95">
            <div className="rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-card to-card p-8 w-full max-w-sm text-center shadow-2xl space-y-4">
              <div className="h-20 w-20 rounded-3xl bg-amber-500/20 text-amber-500 border-2 border-amber-500/40 mx-auto flex items-center justify-center text-5xl shadow-xl animate-bounce">
                {celebrationBadge.icon}
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                  🎉 {lang === 'ar' ? 'وسام جديد مكتسب!' : 'New Badge Unlocked!'}
                </span>
                <h3 className="text-xl font-black text-foreground mt-2">
                  {lang === 'ar' ? celebrationBadge.name_ar : celebrationBadge.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {lang === 'ar' ? celebrationBadge.description_ar : celebrationBadge.description}
                </p>
                <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-primary text-primary-foreground font-black text-xs">
                  <span>+{celebrationBadge.xp} XP</span>
                </div>
              </div>

              <Button
                onClick={() => setCelebrationBadge(null)}
                className="w-full rounded-2xl font-black text-xs mt-2 cursor-pointer"
              >
                {lang === 'ar' ? 'متابعة القراءة الرائعة 📚' : 'Continue Great Reading 📚'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
