import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 Not Found | BookSwap',
  description: 'Page not found.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <div className="relative mb-8">
        <div className="h-28 w-28 rounded-3xl bg-gradient-to-tr from-primary via-indigo-600 to-violet-500 flex items-center justify-center text-5xl shadow-2xl shadow-primary/30 animate-bounce">
          <span role="img" aria-label="books">📚</span>
        </div>
        <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white text-xs font-black shadow-lg">
          404
        </span>
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-foreground mb-3 tracking-tight">
        Page Not Found
      </h1>
      <p className="text-base text-muted-foreground font-semibold mb-4">
        This page does not exist or has been moved.
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
