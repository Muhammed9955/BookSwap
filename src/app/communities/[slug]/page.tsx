import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCommunityBySlug, getCommunityPosts, getCommunityBooks, getPendingCommunityBooks } from '@/lib/communities/community-service'
import { CommunityDetailClient } from '@/components/communities/community-detail-client'

interface CommunityPageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: CommunityPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { community } = await getCommunityBySlug(slug, null, supabase)
  if (!community) {
    return { title: 'المجتمع غير موجود — WARAQ | ورق' }
  }
  return {
    title: `${community.name_ar || community.name} — مجتمع القراء ونقطة اللقاء الآمنة | WARAQ | ورق`,
    description: community.description_ar || community.description,
  }
}

export default async function CommunityPage({ params }: CommunityPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { community, isMember, membershipStatus } = await getCommunityBySlug(
    slug,
    user?.id ?? null,
    supabase
  )

  if (!community) {
    notFound()
  }

  let userRole: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    userRole = profile?.role ?? null
  }

  const isPlatformAdmin = userRole === 'ADMIN' || userRole === 'MODERATOR'
  const isAdmin = Boolean(user?.id && (community.admin_id === user.id || isPlatformAdmin))

  const [posts, books, pendingBooks] = await Promise.all([
    getCommunityPosts(community.id, supabase),
    getCommunityBooks(community.id, supabase),
    isAdmin ? getPendingCommunityBooks(community.id, supabase) : Promise.resolve([]),
  ])

  return (
    <CommunityDetailClient
      community={community}
      initialIsMember={isMember}
      initialMembershipStatus={membershipStatus}
      posts={posts}
      books={books}
      initialPendingBooks={pendingBooks}
      currentUserId={user?.id ?? null}
      userRole={userRole}
      isPlatformAdmin={isPlatformAdmin}
    />
  )
}
