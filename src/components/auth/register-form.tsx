'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react'
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

const registerSchema = z.object({
  full_name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirm_password'],
})

type RegisterData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const { lang, isRTL } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendDone, setResendDone] = useState(false)

  const redirectTo = searchParams.get('redirectTo') || searchParams.get('next') || '/'

  // Detect query errors
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      if (errorParam === 'oauth') {
        setError(
          lang === 'ar'
            ? 'تعذر إكمال التسجيل بواسطة Google. يرجى المحاولة مجدداً.'
            : 'Google authentication failed or was cancelled. Please try again.'
        )
      } else if (errorParam === 'access_denied') {
        setError(
          lang === 'ar'
            ? 'تم إلغاء التسجيل بواسطة Google.'
            : 'Google sign-up was cancelled.'
        )
      } else {
        setError(decodeURIComponent(errorParam))
      }
    }
  }, [searchParams, lang])

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterData) => {
    setLoading(true)
    setError(null)
    setResendDone(false)

    try {
      const email = data.email.trim()
      const referralCode = 'BOOK-' + Math.random().toString(36).substring(2, 8).toUpperCase()

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name.trim(),
            referral_code: referralCode,
          },
        },
      })

      if (signUpError) {
        const msg = signUpError.message.toLowerCase()
        if (msg.includes('already registered') || msg.includes('user already exists')) {
          setError(
            lang === 'ar'
              ? 'هذا البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول مباشرة.'
              : 'This email is already registered. Please sign in instead.'
          )
        } else if (msg.includes('password should be at least')) {
          setError(
            lang === 'ar'
              ? 'كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.'
              : 'Password must be at least 8 characters long.'
          )
        } else if (msg.includes('rate limit') || msg.includes('too many requests')) {
          setError(
            lang === 'ar'
              ? 'تم إرسال عدد كبير من الطلبات. يرجى الانتظار بضع دقائق والمحاولة ثانية.'
              : 'Too many signup requests. Please wait a few minutes and try again.'
          )
        } else {
          setError(
            lang === 'ar'
              ? `تعذر إنشاء الحساب: ${signUpError.message}`
              : `Could not create account: ${signUpError.message}`
          )
        }
        setLoading(false)
        return
      }

      // Check if user session exists immediately or if confirmation is needed
      if (signUpData.user && !signUpData.session) {
        // Email confirmation is required by Supabase!
        setRegisteredEmail(email)
        setEmailConfirmationSent(true)
        setLoading(false)
        return
      }

      // If session exists directly (email confirmation off in Supabase)
      if (signUpData.session && signUpData.user) {
        // Sync profile
        await supabase.from('profiles').upsert({
          id: signUpData.user.id,
          full_name: data.full_name.trim(),
          referral_code: referralCode,
          preferred_language: lang === 'en' ? 'en' : 'ar',
          onboarding_completed: false,
        })
        router.push('/onboarding')
      }
    } catch (err) {
      setError(
        lang === 'ar'
          ? 'حدث خطأ غير متوقع أثناء إنشاء الحساب. تأكد من اتصالك بالإنترنت.'
          : 'An unexpected error occurred during signup. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResendLink = async () => {
    if (!registeredEmail) return
    setResendLoading(true)
    try {
      await supabase.auth.resend({
        type: 'signup',
        email: registeredEmail,
      })
      setResendDone(true)
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
      const message = err instanceof Error ? err.message : 'Google sign-up failed'
      if (message.includes('provider is not enabled') || message.includes('Unsupported provider')) {
        setError(
          lang === 'ar'
            ? 'تسجيل الدخول بـ Google غير مفعّل في Supabase. يرجى تفعيل موفّر Google من لوحة تحكم Supabase > Authentication > Providers.'
            : 'Google sign-in is not enabled in your Supabase project. Enable it under Authentication > Providers > Google.'
        )
      } else {
        setError(
          lang === 'ar'
            ? `فشل التسجيل بـ Google: ${message}`
            : `Google sign-up error: ${message}`
        )
      }
      setGoogleLoading(false)
    }
  }

  // If email confirmation is sent, display verification screen
  if (emailConfirmationSent) {
    return (
      <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="h-16 w-16 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl shadow-sm border border-emerald-500/20">
          ✉️
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground">
            {lang === 'ar' ? 'تحقق من بريدك الإلكتروني' : 'Check your inbox'}
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            {lang === 'ar'
              ? 'أرسلنا رابط تفعيل الحساب إلى:'
              : 'We have sent an activation link to:'}
          </p>
          <p className="text-base font-bold text-primary font-mono bg-primary/5 py-1 px-3 rounded-lg inline-block border border-primary/20">
            {registeredEmail}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto pt-1 leading-relaxed">
            {lang === 'ar'
              ? 'يرجى الضغط على الرابط في الرسالة لتفعيل حسابك، ثم تسجيل الدخول.'
              : 'Please click the link in the email to activate your account and start swapping books.'}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link href="/login" className="block cursor-pointer">
            <Button size="lg" className="w-full font-bold shadow-md hover:shadow-lg cursor-pointer">
              <span>{lang === 'ar' ? 'الانتقال لصفحة تسجيل الدخول' : 'Go to Sign In'}</span>
              <ArrowRight className={cn('h-4 w-4 ms-1', isRTL && 'rotate-180')} />
            </Button>
          </Link>

          <div className="pt-2">
            {resendDone ? (
              <p className="text-xs text-emerald-600 font-semibold">
                ✓ {lang === 'ar' ? 'تم إرسال رابط تأكيد جديد!' : 'A new link was sent!'}
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendLink}
                disabled={resendLoading}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', resendLoading && 'animate-spin')} />
                <span>{lang === 'ar' ? 'لم تصلك الرسالة؟ إعادة الإرسال' : "Didn't receive email? Resend"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-black text-foreground">
          {lang === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account'}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {lang === 'ar' ? 'انضم لمجتمع القراء وتبادل الكتب حول العالم' : 'Join the reading & book swap community worldwide'}
        </p>
      </div>

      {/* Google Sign Up */}
      <Button
        id="google-register-btn"
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

      {/* Error message banner */}
      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3.5 text-sm text-destructive leading-relaxed flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>{error}</p>
            {error.includes('مسجل بالفعل') && (
              <Link href="/login" className="text-xs font-bold underline hover:opacity-80 block cursor-pointer">
                {lang === 'ar' ? 'اضغط هنا لتسجيل الدخول مباشرة' : 'Click here to sign in'}
              </Link>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="full_name" className="font-semibold text-xs text-foreground">
            {lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
          </Label>
          <div className="relative">
            <User className={cn('absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none', isRTL ? 'right-3' : 'left-3')} />
            <Input
              id="full_name"
              placeholder={lang === 'ar' ? 'اسمك الكريم' : 'Your full name'}
              className={cn(
                'h-11 rounded-xl transition-all focus:border-primary focus:ring-2 focus:ring-primary/10',
                isRTL ? 'pr-10' : 'pl-10'
              )}
              {...register('full_name')}
            />
          </div>
          {errors.full_name && <p className="text-xs text-destructive font-medium">{errors.full_name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="reg-email" className="font-semibold text-xs text-foreground">
            {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
          </Label>
          <div className="relative">
            <Mail className={cn('absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none', isRTL ? 'right-3' : 'left-3')} />
            <Input
              id="reg-email"
              type="email"
              placeholder="name@example.com"
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
          <Label htmlFor="reg-password" className="font-semibold text-xs text-foreground">
            {lang === 'ar' ? 'كلمة المرور' : 'Password'}
          </Label>
          <div className="relative">
            <Lock className={cn('absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none', isRTL ? 'right-3' : 'left-3')} />
            <Input
              id="reg-password"
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

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm_password" className="font-semibold text-xs text-foreground">
            {lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
          </Label>
          <div className="relative">
            <Lock className={cn('absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none', isRTL ? 'right-3' : 'left-3')} />
            <Input
              id="confirm_password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={cn(
                'h-11 rounded-xl transition-all focus:border-primary focus:ring-2 focus:ring-primary/10',
                isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'
              )}
              {...register('confirm_password')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(v => !v)}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-md transition-colors',
                isRTL ? 'left-2.5' : 'right-2.5'
              )}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirm_password && <p className="text-xs text-destructive font-medium">{errors.confirm_password.message}</p>}
        </div>

        <Button
          id="register-submit-btn"
          type="submit"
          size="lg"
          className="w-full font-bold py-3 shadow-md hover:shadow-lg cursor-pointer"
          loading={loading}
        >
          {lang === 'ar' ? 'إنشاء الحساب' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {lang === 'ar' ? 'عندك حساب بالفعل؟ ' : 'Already have an account? '}
        <Link href="/login" className="text-primary font-bold hover:underline cursor-pointer">
          {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
        </Link>
      </p>

      <p className="text-center text-xs text-muted-foreground/80 leading-relaxed">
        {lang === 'ar'
          ? 'بإنشائك الحساب، أنت موافق على شروط الاستخدام وسياسة الخصوصية الخاصة بمنصة وَرَق.'
          : 'By creating an account, you agree to WARAQ Terms of Service and Privacy Policy.'
        }
      </p>
    </div>
  )
}
