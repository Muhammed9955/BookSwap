import { Suspense } from 'react'
import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'تسجيل الدخول — BookSwap',
  description: 'ادخل حسابك على BookSwap',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side — Decorative */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 start-20 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="absolute bottom-20 end-20 h-48 w-48 rounded-full bg-amber-500/20 blur-2xl" />
        </div>
        <div className="relative text-center text-white">
          <div className="text-7xl mb-6">📚</div>
          <h1 className="text-3xl font-bold mb-3">BookSwap</h1>
          <p className="text-xl text-white/80 mb-2">بدّلها</p>
          <p className="text-base text-white/60">
            اقرأ أكتر، بدّل أذكى.
          </p>
          <div className="mt-10 space-y-3">
            {[
              'كتابك القديم ممكن يبقى الكتاب اللي نفسك تقرأه',
              'ابحث عن كتب قريبة منك',
              'بادل وابيع بأمان وسهولة',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 text-start text-white/70 text-sm">
                <span className="mt-1 flex-shrink-0">✅</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white text-2xl shadow-lg mb-3">
              📚
            </div>
            <h1 className="text-2xl font-bold">BookSwap</h1>
          </div>
          <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
