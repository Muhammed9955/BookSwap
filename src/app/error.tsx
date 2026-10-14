'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-background px-4 text-center py-16">
      <div className="h-20 w-20 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center text-4xl mb-6 border border-destructive/20 shadow-sm">
        ⚠️
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">
        حدث خطأ غير متوقع
      </h1>
      <p className="text-sm text-muted-foreground font-medium max-w-md mb-6">
        نعتذر عن هذا الخطأ المؤقت. يمكنك محاولة إعادة تحميل الصفحة أو العودة إلى الصفحة الرئيسية.
      </p>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => reset()}
          className="rounded-xl font-bold text-xs px-6 py-2.5 cursor-pointer"
        >
          إعادة المحاولة
        </Button>
        <Link href="/">
          <Button
            variant="outline"
            className="rounded-xl font-bold text-xs px-6 py-2.5 cursor-pointer"
          >
            الرئيسية
          </Button>
        </Link>
      </div>
    </div>
  )
}
