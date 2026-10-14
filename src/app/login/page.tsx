import { Suspense } from 'react'
import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'
import { WaraqLogo } from '@/components/ui/waraq-logo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'تسجيل الدخول — WARAQ | ورق',
  description: 'ادخل إلى حسابك في منصة ورق — عالم جديد بين كل صفحة والتانية.',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side — Decorative WARAQ Showcase */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 start-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute bottom-20 end-20 h-48 w-48 rounded-full bg-amber-500/15 blur-2xl" />
        </div>
        <div className="relative text-center text-white max-w-sm">
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 rounded-3xl bg-white p-3.5 flex items-center justify-center border border-white/80 shadow-2xl">
              <img
                src="/images/logo.png"
                alt="WARAQ Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-black mb-2 text-white">وَرَق | WARAQ</h1>
          <p className="text-lg text-emerald-200 font-semibold mb-3">
            عالم جديد بين كل صفحة والتانية.
          </p>
          <p className="text-sm text-white/75 leading-relaxed">
            مجتمع القراء لتبادل واستعارة وشراء الكتب المستعملة في مدينتك بكل أمان و0% عمولة.
          </p>
          <div className="mt-8 space-y-3">
            {[
              'كتابك القديم، كنز ينتظر قارئاً قريباً منك',
              'نوادي قراءة ولقاءات آمنة في كافيهات ومكتبات مدينتك',
              'مبادلة واستعارة مجانية بدون أي عمولات 100%',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 text-start text-white/80 text-sm">
                <span className="mt-0.5 flex-shrink-0 text-emerald-300">✓</span>
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
          <div className="text-center mb-8 lg:hidden flex justify-center">
            <WaraqLogo size="lg" showSlogan={true} />
          </div>
          <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
