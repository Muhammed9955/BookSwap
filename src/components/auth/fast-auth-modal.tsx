'use client'

import React, { useState } from 'react'
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingBag,
  Star,
  Users,
  ArrowRightLeft,
  Clock,
  MessageCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/i18n/language-context'
import { Button } from '@/components/ui/button'
import { GoogleIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export type AuthActionType =
  | 'follow'
  | 'rate'
  | 'order'
  | 'bundle'
  | 'pack'
  | 'swap'
  | 'borrow'
  | 'buy'
  | 'chat'
  | 'general'

export interface FastAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (user: SupabaseUser) => Promise<void> | void
  actionType?: AuthActionType
  title?: string
  subtitle?: string
  targetName?: string
  targetTitle?: string
  defaultEmail?: string
  defaultName?: string
  defaultMode?: 'login' | 'register'
}

export function FastAuthModal({
  isOpen,
  onClose,
  onSuccess,
  actionType = 'general',
  title: customTitle,
  subtitle: customSubtitle,
  targetName,
  targetTitle,
  defaultEmail,
  defaultName,
  defaultMode,
}: FastAuthModalProps) {
  const { lang, isRTL } = useLanguage()
  const supabase = createClient()
  const target = targetTitle || targetName || ''

  const [mode, setMode] = useState<'login' | 'register'>(defaultMode || 'login')
  const [email, setEmail] = useState(defaultEmail || '')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState(defaultName || '')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isFinishingSuccess, setIsFinishingSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  React.useEffect(() => {
    if (defaultEmail && !email) setEmail(defaultEmail)
    if (defaultName && !fullName) setFullName(defaultName)
    if (defaultMode) setMode(defaultMode)
  }, [defaultEmail, defaultName, defaultMode, isOpen])

  if (!isOpen) return null

  // Action-specific icon and header details
  const getActionDetails = () => {
    switch (actionType) {
      case 'follow':
        return {
          icon: <Users className="h-5 w-5 text-primary" />,
          badge: lang === 'ar' ? 'متابعة وتنبيهات 🔔' : 'Follow & Updates',
          defaultTitle: lang === 'ar' ? `متابعة ${target || 'المتجر'}` : `Follow ${target || 'Store'}`,
          defaultSubtitle:
            lang === 'ar'
              ? 'سجل دخولك لتتابع أحدث عروض الكتب والخصومات الحصرية'
              : 'Log in to follow new book drops & discounts',
        }
      case 'rate':
        return {
          icon: <Star className="h-5 w-5 text-amber-500 fill-amber-500" />,
          badge: lang === 'ar' ? 'تقييم موثق ⭐' : 'Verified Review',
          defaultTitle: lang === 'ar' ? 'تقييم المتجر والمكتبة' : 'Rate Bookstore',
          defaultSubtitle:
            lang === 'ar'
              ? 'سجل دخولك لإضافة تقييمك ومساعدة مجتمع القراء'
              : 'Log in to submit your rating and help reader community',
        }
      case 'order':
      case 'bundle':
      case 'pack':
        return {
          icon: <ShoppingBag className="h-5 w-5 text-emerald-600" />,
          badge: lang === 'ar' ? 'إتمام الطلب 🚚' : 'Checkout & Shipping',
          defaultTitle: lang === 'ar' ? 'تأكيد طلب الكتب' : 'Complete Book Order',
          defaultSubtitle:
            lang === 'ar'
              ? `سجل دخولك لإتمام الطلب من ${target || 'المكتبة'} وتتبع الشحن`
              : 'Log in to confirm your order and track shipping',
        }
      case 'buy':
        return {
          icon: <ShoppingBag className="h-5 w-5 text-primary" />,
          badge: lang === 'ar' ? 'شراء فوري 🛒' : 'Instant Purchase',
          defaultTitle: lang === 'ar' ? 'طلب شراء الكتاب' : 'Buy Book',
          defaultSubtitle:
            lang === 'ar'
              ? `سجل دخولك لشراء "${target || 'الكتاب'}" ومراسلة البائع`
              : 'Log in to purchase this book and contact seller',
        }
      case 'swap':
        return {
          icon: <ArrowRightLeft className="h-5 w-5 text-purple-600" />,
          badge: lang === 'ar' ? 'مبادلة كتب 🔄' : 'Book Swap',
          defaultTitle: lang === 'ar' ? 'طلب مبادلة كتاب' : 'Swap Request',
          defaultSubtitle:
            lang === 'ar'
              ? 'سجل دخولك لاقتراح كتاب من مكتبتك وإتمام الصفقة مجاناً'
              : 'Log in to propose a book swap with zero fees',
        }
      case 'borrow':
        return {
          icon: <Clock className="h-5 w-5 text-emerald-600" />,
          badge: lang === 'ar' ? 'استعارة مؤقتة ⏱️' : 'Book Loan',
          defaultTitle: lang === 'ar' ? 'طلب استعارة مؤقتة' : 'Request Book Loan',
          defaultSubtitle:
            lang === 'ar'
              ? 'سجل دخولك لاستعارة الكتاب مع ضمان استرداد التأمين 100%'
              : 'Log in to borrow book with 100% refundable deposit',
        }
      case 'chat':
        return {
          icon: <MessageCircle className="h-5 w-5 text-indigo-600" />,
          badge: lang === 'ar' ? 'محادثة فورية 💬' : 'Instant Chat',
          defaultTitle: lang === 'ar' ? 'مراسلة البائع مباشرة' : 'Message Seller',
          defaultSubtitle:
            lang === 'ar'
              ? 'سجل دخولك لبدء المحادثة والتنسيق مع صاحب الكتاب'
              : 'Log in to chat directly with book owner',
        }
      default:
        return {
          icon: <Sparkles className="h-5 w-5 text-primary" />,
          badge: lang === 'ar' ? 'تسجيل سريع ⚡' : 'Quick Sign In',
          defaultTitle: lang === 'ar' ? 'سجل دخولك للمتابعة' : 'Sign in to continue',
          defaultSubtitle:
            lang === 'ar'
              ? 'انضم لمجتمع وَرَق لتبادل، استعارة وشراء الكتب بكل سهولة'
              : 'Join WARAQ reader community for books, clubs and events',
        }
    }
  }

  const details = getActionDetails()
  const displayTitle = customTitle || details.defaultTitle
  const displaySubtitle = customSubtitle || details.defaultSubtitle

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true)
      setError(null)
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const nextPath = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/'
      const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      })
      if (oauthError) throw oauthError
    } catch (err: any) {
      setError(
        lang === 'ar'
          ? 'تعذر الدخول بواسطة Google. يرجى المحاولة بالبريد وكلمة المرور.'
          : err.message || 'Google sign-in failed. Please try with email.'
      )
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError(lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address')
      return
    }

    if (!password || password.length < 6) {
      setError(lang === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      if (mode === 'login') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

        if (signInError) {
          const msg = signInError.message.toLowerCase()
          if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
            throw new Error(lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password')
          }
          throw signInError
        }

        if (data.user) {
          setIsFinishingSuccess(true)
          setSuccessMsg(lang === 'ar' ? 'تم تأكيد الحساب بنجاح! جاري إرسال الطلب...' : 'Signed in! Submitting application...')
          try {
            await onSuccess?.(data.user)
          } catch (e: any) {
            console.error('FastAuthModal onSuccess error:', e)
            setError(e?.message || (lang === 'ar' ? 'حدث خطأ أثناء المتابعة' : 'Error continuing after sign in'))
            setIsFinishingSuccess(false)
            return
          }
          setIsFinishingSuccess(false)
          onClose()
        }
      } else {
        // Register mode
        const cleanName = fullName.trim()
        if (!cleanName) {
          setError(lang === 'ar' ? 'يرجى كتابة اسمك' : 'Please enter your name')
          setLoading(false)
          return
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanName,
            },
          },
        })

        if (signUpError) {
          const msg = signUpError.message.toLowerCase()
          if (msg.includes('already registered') || msg.includes('user already exists')) {
            throw new Error(
              lang === 'ar'
                ? 'هذا البريد مسجل بالفعل، يرجى التبديل لتسجيل الدخول'
                : 'Email already registered. Please sign in.'
            )
          }
          throw signUpError
        }

        if (data.user) {
          const registeredUser = data.user
          setIsFinishingSuccess(true)
          setSuccessMsg(lang === 'ar' ? 'تم إنشاء الحساب بنجاح! جاري إرسال الطلب...' : 'Account created! Submitting application...')
          try {
            await onSuccess?.(registeredUser)
          } catch (e: any) {
            console.error('FastAuthModal onSuccess error:', e)
            setError(e?.message || (lang === 'ar' ? 'حدث خطأ أثناء المتابعة' : 'Error continuing after sign up'))
            setIsFinishingSuccess(false)
            return
          }
          setIsFinishingSuccess(false)
          onClose()
        }
      }
    } catch (err: any) {
      setError(err.message || (lang === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error occurred'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-foreground flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Full Finishing Overlay */}
        {isFinishingSuccess && (
          <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3 animate-in fade-in">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shadow-xs">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <p className="font-black text-sm text-foreground">
              {lang === 'ar' ? '✓ تم تأكيد الحساب بنجاح!' : '✓ Account Verified!'}
            </p>
            <p className="text-xs text-muted-foreground">
              {lang === 'ar' ? 'جاري إرسال طلب الشراكة واعتماد المتجر...' : 'Submitting your bookstore application...'}
            </p>
          </div>
        )}

        {/* Header Strip */}
        <div className="relative p-5 sm:p-6 pb-4 border-b border-border/80 bg-muted/30 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 end-4 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
              {details.icon}
              <span>{details.badge}</span>
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
            {displayTitle}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">
            {displaySubtitle}
          </p>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-muted rounded-2xl mt-4 border border-border/80">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError(null)
              }}
              className={cn(
                'py-2 rounded-xl text-xs font-black transition-all cursor-pointer',
                mode === 'login'
                  ? 'bg-white dark:bg-slate-800 text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setError(null)
              }}
              className={cn(
                'py-2 rounded-xl text-xs font-black transition-all cursor-pointer',
                mode === 'register'
                  ? 'bg-white dark:bg-slate-800 text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {lang === 'ar' ? 'حساب جديد' : 'New Account'}
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* 1-Tap Google Button */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-5 rounded-2xl border-2 border-border/80 hover:bg-muted font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer shadow-xs hover:border-primary/40 transition-all"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <GoogleIcon className="h-4 w-4" />
            )}
            <span>
              {mode === 'login'
                ? lang === 'ar'
                  ? 'المتابعة السريعة بحساب Google'
                  : 'Continue with Google'
                : lang === 'ar'
                ? 'إنشاء حساب فوري عبر Google'
                : 'Sign up with Google'}
            </span>
          </Button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-border w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold text-muted-foreground shrink-0">
              {lang === 'ar' ? 'أو بالبريد الإلكتروني' : 'or with email'}
            </span>
            <div className="border-t border-border w-full" />
          </div>

          {/* Error / Success Feedback */}
          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 stroke-[3]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-[11px] font-black text-muted-foreground block">
                  {lang === 'ar' ? 'الاسم الكامل:' : 'Full Name:'}
                </label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: أحمد محمود' : 'e.g. John Doe'}
                    className={cn(
                      'w-full bg-muted/50 border border-border focus:border-primary focus:bg-background rounded-xl py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all',
                      isRTL ? 'pe-3 ps-9' : 'ps-9 pe-3'
                    )}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-black text-muted-foreground block">
                {lang === 'ar' ? 'البريد الإلكتروني:' : 'Email Address:'}
              </label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={cn(
                    'w-full bg-muted/50 border border-border focus:border-primary focus:bg-background rounded-xl py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all',
                    isRTL ? 'pe-3 ps-9' : 'ps-9 pe-3'
                  )}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-muted-foreground block">
                {lang === 'ar' ? 'كلمة المرور:' : 'Password:'}
              </label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    'w-full bg-muted/50 border border-border focus:border-primary focus:bg-background rounded-xl py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all',
                    isRTL ? 'pe-9 ps-9' : 'ps-9 pe-9'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs sm:text-sm shadow-md shadow-primary/25 cursor-pointer mt-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : mode === 'login' ? (
                lang === 'ar' ? (
                  'تسجيل الدخول ومتابعة العمل 🚀'
                ) : (
                  'Sign In & Continue 🚀'
                )
              ) : lang === 'ar' ? (
                'إنشاء حساب ومتابعة العمل ✨'
              ) : (
                'Create Account & Continue ✨'
              )}
            </Button>
          </form>

          {/* Quick reassurance */}
          <p className="text-[10px] text-center text-muted-foreground/80 leading-normal pt-1">
            {lang === 'ar'
              ? '🔒 حسابك آمن 100%. لن يتم مشاركة بياناتك الشخصية مع أي طرف ثالث.'
              : '🔒 100% secure. Your personal information is never shared.'}
          </p>
        </div>
      </div>
    </div>
  )
}
