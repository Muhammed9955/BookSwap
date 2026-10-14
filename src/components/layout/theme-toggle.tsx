'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Laptop } from 'lucide-react'
import { useLanguage } from '@/i18n/language-context'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { lang } = useLanguage()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 border border-border/60 text-muted-foreground',
          className
        )}
      >
        <span className="h-4 w-4 rounded-full bg-muted animate-pulse" />
      </div>
    )
  }

  const isDark = resolvedTheme === 'dark'

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  const label = isDark
    ? lang === 'ar' ? 'الوضع المضيء' : 'Light Mode'
    : lang === 'ar' ? 'الوضع الليلي' : 'Dark Mode'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer select-none',
        'border border-border/80 bg-slate-100 hover:bg-slate-200 text-slate-800',
        'dark:border-slate-700/80 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-300',
        'hover:scale-105 active:scale-95 shadow-2xs',
        showLabel ? 'px-3 py-1.5 text-xs font-bold' : 'h-9 w-9',
        className
      )}
      title={label}
      aria-label={label}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 rotate-0 scale-100 transition-all duration-300 animate-in spin-in-90" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 rotate-0 scale-100 transition-all duration-300 animate-in spin-in-90" />
      )}
      {showLabel && (
        <span className="text-xs font-bold text-foreground">
          {label}
        </span>
      )}
    </button>
  )
}
