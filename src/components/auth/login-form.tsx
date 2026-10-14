'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleIcon } from '@/components/ui/icons'
import { useLanguage } from '@/i18n/language-context'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور 6 أحرف على الأقل'),
})

type LoginData = z.infer<typeof loginSchema>

export function LoginForm() {
  const { lang, isRTL } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null)

  const redirectTo = searchParams.get('redirectTo') || searchParams.get('next') || '/'

  // Detect query errors (e.g. redirected from OAuth failure)
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      if (errorParam === 'oauth') {
        setError(
          lang === 'ar'
            ? 'تعذر إكمال تسجيل الدخول بواسطة Google. يرجى المحاولة مجدداً.'
            : 'Google authentication failed or was cancelled. Please try again.'
        )
      } else if (errorParam === 'access_denied') {
        setError(
          lang === 'ar'
            ? 'تم إلغاء تسجيل الدخول بواسطة Google.'
            : 'Google sign-in was cancelled.'
        )
      } else {
        setError(decodeURIComponent(errorParam))
      }
    }
  }, [searchParams, lang])

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginData) => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    setUnconfirmedEmail(null)
    setResendSuccess(false)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email.trim(),
        password: data.password,
      })

      if (authError) {
        const msg = authError.message.toLowerCase()
        if (msg.includes('email not confirmed')) {
          setUnconfirmedEmail(data.email.trim())
          setError(
            lang === 'ar'
              ? 'لم يتم تأكيد بريدك الإلكتروني بعد. يرجى فحص صندوق الوارد والضغط على رابط التفعيل.'
              : 'Your email address has not been confirmed yet. Please check your inbox for the confirmation link.'
          )
        } else if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
          setError(
            lang === 'ar'
              ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات والمحاولة مجدداً.'
              : 'Invalid email or password. Please verify your credentials and try again.'
          )
        } else if (msg.includes('too many requests') || msg.includes('rate limit')) {
          setError(
            lang === 'ar'
              ? 'تم تجاوز عدد المحاولات المسموح بها مؤقتاً. يرجى الانتظار دقيقة ثم المحاولة مجدداً.'
              : 'Too many requests. Please wait a moment before trying again.'
          )
        } else if (msg.includes('user not found')) {
          setError(
            lang === 'ar'
              ? 'هذا البريد غير مسجل على المنصة. يمكنك إنشاء حساب جديد مجاناً.'
              : 'No account found with this email. You can create a free account.'
          )
        } else {
          setError(
            lang === 'ar'
              ? `فشل تسجيل الدخول: ${authError.message}`
              : `Sign-in failed: ${authError.message}`
          )
        }
        setLoading(false)
        return
      }

      if (authData.user) {
        // Check if user has completed onboarding
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', authData.user.id)
          .maybeSingle()

        const isCompleted = userProfile?.onboarding_completed === true
        const destination = isCompleted
          ? (redirectTo.startsWith('/') ? redirectTo : '/')
          : '/onboarding'

        setSuccess(
          lang === 'ar'
            ? 'تم تسجيل الدخول بنجاح! جاري تحويلك...'
            : 'Signed in successfully! Redirecting...'
        )
        setTimeout(() => {
          router.push(destination)
          router.refresh()
        }, 400)
      }
    } catch (err) {
      setError(
        lang === 'ar'
          ? 'حدث خطأ غير متوقع في الاتصال. يرجى المحاولة لاحقاً.'
          : 'An unexpected connection error occurred. Please try again.'
      )
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!unconfirmedEmail) return
    setResendLoading(true)
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email: unconfirmedEmail,
      })
      if (!resendErr) {
        setResendSuccess(true)
      } else {
        setError(resendErr.message)
      }
    } catch {
      setError('Failed to resend confirmation email')
    } finally {
      setResendLoading(false)
    }
  }

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true)
      setError(null)

      const callbackUrl = `${window.location.origin}/auth/callback${
        redirectTo && redirectTo !== '/' ? `?next=${encodeURIComponent(redirectTo)}` : ''
      }`

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (oauthError) {
        throw oauthError
      }

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed'
      if (message.includes('provider is not enabled') || message.includes('Unsupported provider')) {
        setError(
          lang === 'ar'
            ? 'تسجيل الدخول بـ Google غير مفعّل في Supabase. يرجى تفعيل موفّر Google من لوحة تحكم Supabase > Authentication > Providers.'
            : 'Google sign-in is not enabled in your Supabase project. Enable it under Authentication > Providers > Google.'
        )
      } else {
        setError(
          lang === 'ar'
            ? `فشل تسجيل الدخول بـ Google: ${message}`
            : `Google sign-in error: ${message}`
        )
      }
      setGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-foreground">
          {lang === 'ar' ? 'أهلاً بعودتك 👋' : 'Welcome Back 👋'}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {lang === 'ar' ? 'ادخل حسابك في منصة وَرَق' : 'Sign in to your WARAQ account'}
        </p>
      </div>

      {/* Google Sign In */}
      <Button
        id="google-login-btn"
        type="button"
        variant="outline"
        size="lg"
        className="w-full flex items-center justify-center gap-3 border-border hover:bg-accent/80 hover:border-primary/50 transition-all font-semibold py-5 shadow-xs hover:shadow-md cursor-pointer"
        onClick={handleGoogle}
        loading={googleLoading}
      >
        <GoogleIcon className="h-5 w-5 shrink-0" />
        <span className="text-sm">
          {lang === 'ar' ? 'المتابعة باستخدام Google' : 'Continue with Google'}
        </span>
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/80" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground font-semibold">
            {lang === 'ar' ? 'أو بالبريد الإلكتروني' : 'or with email'}
          </span>
        </div>
      </div>

      {/* Success banner */}
      {success && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 flex items-center gap-2.5 text-sm text-emerald-700 dark:text-emerald-300 font-semibold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Error message banner */}
      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-sm text-destructive leading-relaxed space-y-2 animate-in fade-in">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>

          {/* Resend confirmation button if email was unconfirmed */}
          {unconfirmedEmail && (
            <div className="pt-1 ps-6">
              {resendSuccess ? (
                <p className="text-xs text-emerald-600 font-semibold">
                  ✓ {lang === 'ar' ? 'تم إرسال رابط تأكيد جديد إلى بريدك!' : 'New confirmation link sent to your email!'}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  className="text-xs font-bold underline hover:opacity-80 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={cn('h-3 w-3', resendLoading && 'animate-spin')} />
                  <span>{lang === 'ar' ? 'إعادة إرسال رابط التفعيل الآن' : 'Resend confirmation link'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="font-semibold text-xs text-foreground">
            {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
          </Label>
          <div className="relative">
            <Mail className={cn(
              'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none',
              isRTL ? 'right-3' : 'left-3'
            )} />
            <Input
              id="email"
              type="email"
              placeholder={lang === 'ar' ? 'name@example.com' : 'name@example.com'}
              className={cn(
                'h-11 rounded-xl transition-all focus:border-primary focus:ring-2 focus:ring-primary/10',
                isRTL ? 'pr-10' : 'pl-10'
              )}
              {...register('email')}
            />
          </div>
          {errors.email && <p className="text-xs text-destructive font-medium">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="font-semibold text-xs text-foreground">
              {lang === 'ar' ? 'كلمة المرور' : 'Password'}
            </Label>
            <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline cursor-pointer">
              {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
            </Link>
          </div>
          <div className="relative">
            <Lock className={cn(
              'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none',
              isRTL ? 'right-3' : 'left-3'
            )} />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={cn(
                'h-11 rounded-xl transition-all focus:border-primary focus:ring-2 focus:ring-primary/10',
                isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'
              )}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-md transition-colors',
                isRTL ? 'left-2.5' : 'right-2.5'
              )}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive font-medium">{errors.password.message}</p>}
        </div>

        <Button
          id="login-submit-btn"
          type="submit"
          size="lg"
          className="w-full font-bold py-3 shadow-md hover:shadow-lg cursor-pointer"
          loading={loading}
        >
          {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {lang === 'ar' ? 'مش عندك حساب؟ ' : "Don't have an account? "}
        <Link href="/register" className="text-primary font-bold hover:underline cursor-pointer">
          {lang === 'ar' ? 'إنشاء حساب جديد' : 'Create Account'}
        </Link>
      </p>
    </div>
  )
}
