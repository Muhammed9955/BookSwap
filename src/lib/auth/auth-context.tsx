'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { setAnalyticsUser } from '@/lib/analytics/gtag'
import { playNotificationChime, showLocalPwaNotification } from '@/lib/notifications/pwa-push'

export interface UserProfile {
  id: string
  username?: string | null
  full_name?: string | null
  full_name_ar?: string | null
  avatar_url?: string | null
  bio?: string | null
  role?: 'USER' | 'MODERATOR' | 'ADMIN'
  city_id?: string | null
  area_id?: string | null
  email_verified?: boolean
  phone_verified?: boolean
  is_verified?: boolean
  total_listings?: number
  total_swaps?: number
  rating_average?: number
  onboarding_completed?: boolean
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  unreadNotifications: number
  unreadMessages: number
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  initialUser = null,
  initialProfile = null,
}: {
  children: React.ReactNode
  initialUser?: User | null
  initialProfile?: UserProfile | null
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile)
  const [loading, setLoading] = useState<boolean>(!initialUser)
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0)
  const [unreadMessages, setUnreadMessages] = useState<number>(0)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const fetchProfileAndCounts = useCallback(async (userId: string) => {
    try {
      const [profileRes, notifRes, convRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, full_name, full_name_ar, avatar_url, bio, role, city_id, area_id, email_verified, phone_verified, is_verified, total_listings, total_swaps, rating_average, onboarding_completed')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false),
        supabase
          .from('conversations')
          .select('unread_1, unread_2, participant_1, participant_2')
          .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      ])

      if (profileRes.data) {
        const p = { ...(profileRes.data as UserProfile) }
        if (!p.avatar_url) {
          const { data: { session } } = await supabase.auth.getSession()
          const meta = session?.user?.user_metadata || {}
          const googleAvatar = meta.avatar_url || meta.picture || ''
          if (googleAvatar) {
            p.avatar_url = googleAvatar
            supabase.from('profiles').update({ avatar_url: googleAvatar }).eq('id', userId).then()
          }
        }
        setProfile(p)
        setAnalyticsUser(userId, {
          role: p.role,
          city_id: p.city_id,
          is_verified: p.is_verified,
        })
      } else {
        setAnalyticsUser(userId)
      }
      setUnreadNotifications(notifRes.count ?? 0)

      let totalUnreadMsgs = 0
      if (convRes.data) {
        for (const c of convRes.data) {
          if (c.participant_1 === userId) totalUnreadMsgs += c.unread_1 || 0
          else if (c.participant_2 === userId) totalUnreadMsgs += c.unread_2 || 0
        }
      }
      setUnreadMessages(totalUnreadMsgs)
    } catch (err) {
      console.error('Failed to load profile details in AuthProvider:', err)
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfileAndCounts(user.id)
    }
  }, [user?.id, fetchProfileAndCounts])

  useEffect(() => {
    let isMounted = true

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfileAndCounts(currentUser.id).finally(() => {
          if (isMounted) setLoading(false)
        })
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    // Listen to auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          if (currentUser) {
            await fetchProfileAndCounts(currentUser.id)
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
          setUnreadNotifications(0)
          setUnreadMessages(0)
          setAnalyticsUser(null)
        }
        setLoading(false)
      }
    )

    // Realtime Notifications listener
    let notifChannel: ReturnType<typeof supabase.channel> | null = null
    if (user?.id) {
      notifChannel = supabase
        .channel(`user-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => {
            setUnreadNotifications(prev => prev + 1)
            playNotificationChime()
            if (payload?.new) {
              const n = payload.new
              const isStoreVerification =
                n.type === 'STORE_APPROVED' ||
                Boolean(
                  (n.title && (n.title.includes('توثيق') || n.title.includes('اعتماد') || n.title.includes('متجر'))) ||
                  (n.body && (n.body.includes('لوحة التحكم') || n.body.includes('تفعيل متجر') || n.body.includes('توثيق')))
                )
              const notifUrl = isStoreVerification ? '/stores/dashboard' : (n.action_url || '/notifications')
              showLocalPwaNotification(n.title_ar || n.title, {
                body: n.body_ar || n.body || undefined,
                url: notifUrl,
                tag: n.id,
              })
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            if (user?.id) fetchProfileAndCounts(user.id)
          }
        )
        .subscribe()
    }

    return () => {
      isMounted = false
      subscription.unsubscribe()
      if (notifChannel) {
        supabase.removeChannel(notifChannel)
      }
    }
  }, [supabase, fetchProfileAndCounts, user?.id])

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setUnreadNotifications(0)
      setUnreadMessages(0)
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Sign out error:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        unreadNotifications,
        unreadMessages,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
