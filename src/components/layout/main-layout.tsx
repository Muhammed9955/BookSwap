'use client'

import { ReactNode } from 'react'
import { TopNav, BottomNav } from './navigation'
import { SiteFooter } from './footer'
import { useLanguage } from '@/i18n/language-context'
import { cn } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyUser = any

interface MainLayoutProps {
  children: ReactNode
  user?: AnyUser
  unreadNotifications?: number
  unreadMessages?: number
  hideFooter?: boolean
}

export function MainLayout({ children, user, unreadNotifications = 0, hideFooter = false }: MainLayoutProps) {
  const { isRTL } = useLanguage()

  return (
    <div className={cn('min-h-screen flex flex-col bg-background', isRTL ? 'font-arabic' : 'font-sans')}>
      <TopNav user={user} unreadCount={unreadNotifications} />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      {!hideFooter && <SiteFooter />}
      <BottomNav />
    </div>
  )
}
