import Link from 'next/link'
import type { Metadata } from 'next'
import { WaraqLogo } from '@/components/ui/waraq-logo'

export const metadata: Metadata = {
  title: '404 Not Found | WARAQ | ورق',
  description: 'الصفحة غير موجودة — WARAQ',
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <div className="relative mb-6">
        <div className="p-4 rounded-3xl bg-card border border-border shadow-xl">
          <WaraqLogo size="xl" showText={false} />
        </div>
        <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-black shadow-lg">
          404
        </span>
      </div>
      <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2 tracking-tight">
        الصفحة غير موجودة | Page Not Found
      </h1>
      <p className="text-sm md:text-base text-muted-foreground font-semibold mb-4">
        عالم جديد بين كل صفحة والتانية — لكن هذه الصفحة غير موجودة حالياً.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Back to Home
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl border-2 border-border bg-card hover:bg-muted text-foreground font-bold text-sm transition-all hover:border-primary/40"
        >
          Search Books
        </Link>
      </div>
    </div>
  )
}
