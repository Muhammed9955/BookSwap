import type {
  Community,
  CommunityMember,
  CommunityPost,
  BookListing,
  CommunityOrgType,
  CommunityShelfBook,
} from '@/types'
import { createClient } from '@/lib/supabase/client'

type SupabaseClient = any

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value?: string | null): value is string {
  return Boolean(value && UUID_RE.test(value))
}

function isDemoCommunityId(id?: string | null): boolean {
  return Boolean(id && id.startsWith('comm-') && !isUuid(id))
}

// ─────────────────────────────────────────────────────────────
// CURATED EGYPTIAN COMMUNITIES & SAFE HUBS (Demo / Fallback Data)
// ─────────────────────────────────────────────────────────────

export const DEMO_COMMUNITIES: Community[] = [
  {
    id: 'comm-maadi-degla',
    name: 'Maadi Degla Bookworms',
    name_ar: 'مجتمع قراء المعادي ودجلة 🌳',
    slug: 'maadi-degla-bookworms',
    description: 'Active community of readers in Maadi and Degla exchanging novels, philosophy, and history books. We meet weekly at our safe hub in Cilantro Degla.',
    description_ar: 'مجتمع نشط لقراء المعادي ودجلة لتبادل الروايات والكتب واستعارتها مجاناً. نقطة لقائنا وتسليم الكتب الرسمية في سيلانترو دجلة.',
    cover_image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
    avatar_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=250&q=80',
    admin_id: 'user-maadi-admin',
    member_count: 342,
    is_private: false,
    is_active: true,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    org_type: 'NEIGHBORHOOD',
    books_count: 128,
    hub_name: 'Cilantro Cafe Degla (سيلانترو دجلة)',
    hub_address: 'Street 218, Degla, Maadi, Cairo',
    hub_lat: 29.9602,
    hub_lng: 31.2825,
    hub_instructions: 'نقطة التبادل والتسليم في الطاولة الهادئة بالركن الداخلي بجوار رف الكتب. مفتوح يومياً من 8 ص إلى 12 منتصف الليل.',
    hub_photo_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'comm-auc-literature',
    name: 'AUC Literature & Reading Society',
    name_ar: 'نادي أدب وقراء الجامعة الأمريكية 🎓',
    slug: 'auc-reading-society',
    description: 'University reading society for students and alumni. Safe book exchanges, course literature sharing, and monthly contemporary book discussions on campus.',
    description_ar: 'ملتقى طلاب وخريجي الجامعة الأمريكية لمشاركة واستعارة المراجع الدراسية والروايات العالمية. نقطة التسليم الآمنة في بهو مكتبة الجامعة.',
    cover_image_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    avatar_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=250&q=80',
    admin_id: 'user-auc-admin',
    member_count: 512,
    is_private: false,
    is_active: true,
    created_at: '2025-01-20T12:00:00Z',
    updated_at: '2025-01-20T12:00:00Z',
    org_type: 'UNIVERSITY',
    books_count: 215,
    hub_name: 'AUC Campus Center & Library Lobby',
    hub_address: 'AUC Avenue, New Cairo, Cairo',
    hub_lat: 30.0194,
    hub_lng: 31.4988,
    hub_instructions: 'بهو مجمع الأنشطة الطلابية والمكتبة المركزية (الدور الأرضي)، مكان هادئ وآمن ومعروف لتسليم الكتب بين المحاضرات.',
    hub_photo_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'comm-alex-corniche',
    name: 'Alexandria Seafront Readers Circle',
    name_ar: 'حلقة قراء كورنيش الإسكندرية 🌊',
    slug: 'alexandria-seafront-readers',
    description: 'Mediterranean coastal reading club hosting book swaps, sunset reading circles, and lending collections across Alexandria.',
    description_ar: 'ملتقى عشاق القراءة في عروس البحر الأبيض. مبادلة واستعارة فورية للروايات والكتب مع لقاءات أسبوعية عند نقطة الكورنيش الآمنة.',
    cover_image_url: 'https://images.unsplash.com/photo-1526721940322-10fb6e3ae94a?auto=format&fit=crop&w=1200&q=80',
    avatar_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=250&q=80',
    admin_id: 'user-alex-admin',
    member_count: 286,
    is_private: false,
    is_active: true,
    created_at: '2025-02-01T09:00:00Z',
    updated_at: '2025-02-01T09:00:00Z',
    org_type: 'NEIGHBORHOOD',
    books_count: 94,
    hub_name: 'Costa Coffee Shatby Seafront (كوستا الشاطبي)',
    hub_address: '45 Corniche El Nile, Shatby, Alexandria',
    hub_lat: 31.2156,
    hub_lng: 29.9192,
    hub_instructions: 'الشرفة الخارجية المطلة على البحر. موعد التجمع والتبادل الأسبوعي: الخميس 4 عصراً، أو أي وقت بالاتفاق بين الطرفين.',
    hub_photo_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'comm-zamalek-arts',
    name: 'Zamalek Literary Salon & Fiction Circle',
    name_ar: 'صالون الزمالك الأدبي للروايات والفنون 🎨',
    slug: 'zamalek-literary-salon',
    description: 'Classic literature and art books society in the heart of Zamalek island. Lending, swapping, and in-depth novel critiques.',
    description_ar: 'مجتمع قراء جزيرة الزمالك. استعارة وتبادل الروايات المترجمة، كتب الفنون والتاريخ، مع مساحة لقاء آمنة في بيانوز شارع البرازيل.',
    cover_image_url: 'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=1200&q=80',
    avatar_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=250&q=80',
    admin_id: 'user-zamalek-admin',
    member_count: 198,
    is_private: false,
    is_active: true,
    created_at: '2025-02-10T14:00:00Z',
    updated_at: '2025-02-10T14:00:00Z',
    org_type: 'CLUB',
    books_count: 82,
    hub_name: 'Beano\'s Cafe Zamalek (بيانوز الزمالك)',
    hub_address: '8 Brazil St, Zamalek, Cairo',
    hub_lat: 30.0618,
    hub_lng: 31.2195,
    hub_instructions: 'الدور الثاني الهادئ في بيانوز شارع البرازيل. مساحة مريحة لتسليم الكتب وتفحص حالتها والتحدث عن القراءة.',
    hub_photo_url: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'comm-tech-geek',
    name: 'Cairo Tech, AI & Coding Bookworms',
    name_ar: 'نادي قراء التقنية والذكاء الاصطناعي 💻',
    slug: 'cairo-tech-bookworms',
    description: 'Engineers, developers, and tech founders sharing and lending expensive software engineering textbooks, system design guides, and AI research papers.',
    description_ar: 'مجتمع المهندسين والمطورين في مصر لمشاركة واستعارة المراجع التقنية وكتب هندسة البرمجيات والذكاء الاصطناعي المكلفة مجاناً.',
    cover_image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    avatar_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=250&q=80',
    admin_id: 'user-tech-admin',
    member_count: 425,
    is_private: false,
    is_active: true,
    created_at: '2025-01-25T16:00:00Z',
    updated_at: '2025-01-25T16:00:00Z',
    org_type: 'COMPANY',
    books_count: 165,
    hub_name: 'The GrEEK Campus Downtown (الجريك كامبس وسط البلد)',
    hub_address: '28 Falaki St, Bab El Louk, Downtown, Cairo',
    hub_lat: 30.0444,
    hub_lng: 31.2401,
    hub_instructions: 'اللوبي الرئيسي لمبنى الجريك كامبس، مكان حيوي ومركزي مألوف لمجتمع التقنية لتبادل الكتب البرمجية.',
    hub_photo_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
  },
]

// ─────────────────────────────────────────────────────────────
// DEMO COMMUNITY POSTS & DISCUSSIONS
// ─────────────────────────────────────────────────────────────

export const DEMO_COMMUNITY_POSTS: Record<string, CommunityPost[]> = {
  'comm-maadi-degla': [
    {
      id: 'post-1',
      community_id: 'comm-maadi-degla',
      author_id: 'user-1',
      content: 'مساء الخير يا شباب! معايا نسخة بحالة ممتازة من رواية "ثلاثية غرناطة" لرئيسة الأدب رضوى عاشور، حابب أبدلها برواية "عزازيل" أو روايات لأحمد خالد توفيق. هكون في سيلانترو دجلة يوم الجمعة الساعة 4م!',
      is_pinned: true,
      like_count: 14,
      created_at: '2026-10-03T18:00:00Z',
      author: {
        id: 'user-1',
        full_name: 'عمر الشريف',
        full_name_ar: 'عمر الشريف',
        role: 'USER',
        preferred_language: 'ar',
        email_verified: true,
        phone_verified: true,
        is_verified: true,
        total_listings: 6,
        total_swaps: 12,
        total_sales: 3,
        total_donations: 1,
        total_transactions: 16,
        rating_average: 4.9,
        rating_count: 15,
        response_rate: 98,
        show_whatsapp: true,
        is_active: true,
        is_suspended: false,
        onboarding_completed: true,
        onboarding_step: 3,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    },
    {
      id: 'post-2',
      community_id: 'comm-maadi-degla',
      author_id: 'user-2',
      content: 'حد قرأ كتاب "العادات الذرية" ومستعد يعيره لمدة أسبوعين؟ متكفل بالتأمين الكامل وسأتسلمه من رف سيلانترو.',
      is_pinned: false,
      like_count: 8,
      created_at: '2026-10-04T12:30:00Z',
      author: {
        id: 'user-2',
        full_name: 'سارة منصور',
        full_name_ar: 'سارة منصور',
        role: 'USER',
        preferred_language: 'ar',
        email_verified: true,
        phone_verified: true,
        is_verified: true,
        total_listings: 4,
        total_swaps: 8,
        total_sales: 1,
        total_donations: 2,
        total_transactions: 11,
        rating_average: 5.0,
        rating_count: 9,
        response_rate: 100,
        show_whatsapp: false,
        is_active: true,
        is_suspended: false,
        onboarding_completed: true,
        onboarding_step: 3,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    },
  ],
}

// ─────────────────────────────────────────────────────────────
// SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all communities / groups with optional search and org type filters.
 * Always pass a Supabase client from Server Components (`createClient` from server.ts).
 * Demo catalog is used only when the database is empty or unreachable — never mixed with real rows.
 */
export async function getCommunities(params?: {
  orgType?: string
  search?: string
  currentUserId?: string | null
  _client?: SupabaseClient
}): Promise<Community[]> {
  try {
    const supabase = params?._client ?? createClient()
    let q = supabase
      .from('communities')
      .select('*')
      .eq('is_active', true)
      .order('member_count', { ascending: false })

    if (params?.orgType && params.orgType !== 'ALL') {
      q = q.eq('org_type', params.orgType)
    }

    const { data, error } = await q
    if (error) {
      console.warn('[getCommunities] Database query returned error:', error)
      return []
    }
    if (!data || data.length === 0) {
      return []
    }

    const rows = data as Community[]
    if (params?.currentUserId) {
      const { data: mems } = await supabase
        .from('community_members')
        .select('community_id, status')
        .eq('user_id', params.currentUserId)
        .in(
          'community_id',
          rows.map(r => r.id)
        )

      const map = new Map<string, string>(
        (mems ?? []).map((m: { community_id: string; status?: string }) => [
          m.community_id,
          m.status || 'APPROVED',
        ])
      )

      for (const community of rows) {
        const status = map.get(community.id)
        community.membership_status =
          status === 'APPROVED' || status === 'PENDING' || status === 'REJECTED' || status === 'BANNED'
            ? status
            : 'NONE'
        community.is_member = status === 'APPROVED'
      }
    }

    return rows
  } catch (err) {
    console.error('[getCommunities] Unexpected error:', err)
    return []
  }
}

function filterDemoCommunities(params?: { orgType?: string; search?: string }): Community[] {
  let list = [...DEMO_COMMUNITIES]
  if (params?.orgType && params.orgType !== 'ALL') {
    list = list.filter(c => c.org_type === params.orgType)
  }
  if (params?.search?.trim()) {
    const s = params.search.toLowerCase()
    list = list.filter(
      c =>
        c.name.toLowerCase().includes(s) ||
        (c.name_ar && c.name_ar.includes(s)) ||
        (c.hub_name && c.hub_name.toLowerCase().includes(s)) ||
        (c.hub_address && c.hub_address.toLowerCase().includes(s))
    )
  }
  return list
}

/**
 * Get community by slug with membership state
 */
export async function getCommunityBySlug(
  slug: string,
  currentUserId?: string | null,
  _client?: SupabaseClient
): Promise<{
  community: Community | null
  isMember: boolean
  membershipStatus: Community['membership_status']
}> {
  try {
    const supabase = _client ?? createClient()
    const cleanSlug = decodeURIComponent(slug || '').trim().replace(/\/+$/, '')

    // Case-insensitive lookup on slug
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .ilike('slug', cleanSlug)
      .maybeSingle()

    if (error) {
      console.warn('[getCommunityBySlug] Error fetching slug:', cleanSlug, error)
      return { community: null, isMember: false, membershipStatus: 'NONE' }
    }
    if (!data) {
      return { community: null, isMember: false, membershipStatus: 'NONE' }
    }

    let membershipStatus: Community['membership_status'] = 'NONE'
    if (currentUserId && data?.id) {
      const { data: mem } = await supabase
        .from('community_members')
        .select('status')
        .eq('community_id', data.id)
        .eq('user_id', currentUserId)
        .maybeSingle()
      const status = (mem as { status?: string } | null)?.status
      if (status === 'APPROVED' || status === 'PENDING' || status === 'REJECTED' || status === 'BANNED') {
        membershipStatus = status
      } else if (mem) {
        membershipStatus = 'APPROVED'
      }
    }

    const community = data as Community
    community.membership_status = membershipStatus
    community.is_member = membershipStatus === 'APPROVED'
    return {
      community,
      isMember: membershipStatus === 'APPROVED',
      membershipStatus,
    }
  } catch (err) {
    console.error('[getCommunityBySlug] Unexpected error:', err)
    return { community: null, isMember: false, membershipStatus: 'NONE' }
  }
}

export type MembershipToggleResult = {
  status: 'NONE' | 'PENDING' | 'APPROVED'
  isMember: boolean
}

/**
 * Join, cancel a pending request, or leave a community.
 * Approval-gated communities insert PENDING; open communities insert APPROVED.
 */
export async function toggleCommunityMembership(
  communityId: string,
  userId: string
): Promise<MembershipToggleResult> {
  if (isDemoCommunityId(communityId)) {
    return { status: 'APPROVED', isMember: true }
  }

  const supabase = createClient()
  const { data: existing, error: existingError } = await supabase
    .from('community_members')
    .select('community_id, status, role')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingError) throw existingError

  if (existing) {
    const status = (existing as { status?: string }).status
    if (status === 'BANNED') {
      return { status: 'NONE', isMember: false }
    }
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId)
    if (error) throw error
    return { status: 'NONE', isMember: false }
  }

  const { data: community } = await supabase
    .from('communities')
    .select('requires_approval')
    .eq('id', communityId)
    .maybeSingle()

  const requiresApproval = Boolean((community as { requires_approval?: boolean } | null)?.requires_approval)
  const nextStatus = requiresApproval ? 'PENDING' : 'APPROVED'

  const { error } = await supabase.from('community_members').insert({
    community_id: communityId,
    user_id: userId,
    role: 'MEMBER',
    status: nextStatus,
    joined_at: requiresApproval ? null : new Date().toISOString(),
  })

  if (error) throw error
  return { status: nextStatus, isMember: nextStatus === 'APPROVED' }
}

/**
 * Get community discussions/posts
 */
export async function getCommunityPosts(
  communityId: string,
  _client?: SupabaseClient
): Promise<CommunityPost[]> {
  if (isDemoCommunityId(communityId)) {
    return DEMO_COMMUNITY_POSTS[communityId] || []
  }

  try {
    const supabase = _client ?? createClient()
    const { data, error } = await supabase
      .from('community_posts')
      .select('*, author:profiles(id, full_name, full_name_ar, avatar_url, rating_average)')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as CommunityPost[]
  } catch {
    return []
  }
}

/**
 * Post a message to community feed
 */
export async function addCommunityPost(
  communityId: string,
  authorId: string,
  content: string
): Promise<CommunityPost | null> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        community_id: communityId,
        author_id: authorId,
        content,
      })
      .select('*, author:profiles(id, full_name, full_name_ar, avatar_url)')
      .single()

    if (error) throw error
    return data as CommunityPost
  } catch {
    return null
  }
}

/**
 * Helper to slugify names
 */
function slugify(text: string): string {
  const ascii = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return ascii || `comm-${Date.now().toString(36)}`
}

/**
 * Create a new reading community / club
 * Creator automatically becomes ADMIN
 */
export async function createCommunity(payload: {
  name: string
  name_ar?: string
  description?: string
  description_ar?: string
  org_type?: CommunityOrgType
  hub_name?: string
  hub_address?: string
  hub_instructions?: string
  cover_image_url?: string
  admin_id: string
  // New profile fields (migration 005)
  logo_url?: string
  city_id?: string
  area_id?: string
  location_text?: string
  latitude?: number
  longitude?: number
  hub_lat?: number
  hub_lng?: number
  hub_photo_url?: string
  website_url?: string
  contact_email?: string
  contact_phone?: string
  tags?: string[]
  rules_ar?: string
  rules_en?: string
  requires_approval?: boolean
  social_links?: Record<string, string>
}): Promise<Community> {
  const supabase = createClient()
  const baseSlug = slugify(payload.name || payload.name_ar || 'community')
  const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`

  const newCommunity: Partial<Community> = {
    name: payload.name,
    name_ar: payload.name_ar || payload.name,
    slug,
    description: payload.description || '',
    description_ar: payload.description_ar || payload.description || '',
    cover_image_url:
      payload.cover_image_url ||
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80',
    avatar_url: payload.logo_url,
    logo_url: payload.logo_url,
    banner_url: payload.cover_image_url,
    admin_id: payload.admin_id,
    member_count: 1,
    is_private: Boolean(payload.requires_approval),
    is_active: true,
    org_type: payload.org_type || 'CLUB',
    books_count: 0,
    hub_name: payload.hub_name || 'مكان عام متفق عليه',
    hub_address: payload.hub_address || '',
    hub_instructions: payload.hub_instructions || '',
    ...(payload.logo_url && { logo_url: payload.logo_url, avatar_url: payload.logo_url }),
    ...(isUuid(payload.city_id) && { city_id: payload.city_id }),
    ...(isUuid(payload.area_id) && { area_id: payload.area_id }),
    ...(payload.location_text && { location_text: payload.location_text }),
    ...(payload.latitude != null && { latitude: payload.latitude }),
    ...(payload.longitude != null && { longitude: payload.longitude }),
    ...(payload.hub_lat != null && { hub_lat: payload.hub_lat }),
    ...(payload.hub_lng != null && { hub_lng: payload.hub_lng }),
    ...(payload.hub_photo_url && { hub_photo_url: payload.hub_photo_url }),
    ...(payload.website_url && { website_url: payload.website_url }),
    ...(payload.contact_email && { contact_email: payload.contact_email }),
    ...(payload.contact_phone && { contact_phone: payload.contact_phone }),
    ...(payload.tags?.length && { tags: payload.tags }),
    ...(payload.rules_ar && { rules_ar: payload.rules_ar }),
    ...(payload.rules_en && { rules_en: payload.rules_en }),
    ...(payload.requires_approval && { requires_approval: payload.requires_approval }),
    ...(payload.social_links && { social_links: payload.social_links }),
  }

  const coreInsert = {
    name: newCommunity.name,
    name_ar: newCommunity.name_ar,
    slug,
    description: newCommunity.description,
    description_ar: newCommunity.description_ar,
    cover_image_url: newCommunity.cover_image_url,
    avatar_url: newCommunity.avatar_url,
    admin_id: payload.admin_id,
    member_count: 1,
    is_private: Boolean(payload.requires_approval),
    is_active: true,
  }

  try {
    let { data, error } = await supabase.from('communities').insert(newCommunity).select('*').single()

    if (error) {
      const { data: retryData, error: retryError } = await supabase
        .from('communities')
        .insert(coreInsert)
        .select('*')
        .single()
      data = retryData
      error = retryError
    }

    if (!error && data) {
      await supabase.from('community_members').insert({
        community_id: data.id,
        user_id: payload.admin_id,
        role: 'ADMIN',
        status: 'APPROVED',
        joined_at: new Date().toISOString(),
      })

      DEMO_COMMUNITIES.unshift(data as Community)
      return data as Community
    }

    console.warn('Could not insert community to DB:', error)
  } catch (err) {
    console.warn('Could not insert community to DB, falling back to local memory:', err)
  }

  // Fallback in-memory community
  const fallbackComm: Community = {
    ...newCommunity,
    id: `comm-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as Community

  DEMO_COMMUNITIES.unshift(fallbackComm)
  return fallbackComm
}


/**
 * Fetch community members with roles and approval status
 */
export async function getCommunityMembers(communityId: string): Promise<CommunityMember[]> {
  if (isDemoCommunityId(communityId)) return []

  const supabase = createClient()
  try {
    let query = supabase
      .from('community_members')
      .select('*, profile:profiles(id, full_name, full_name_ar, avatar_url, rating_average)')
      .eq('community_id', communityId)

    const { data, error } = await query.order('joined_at', { ascending: false })

    if (error) {
      const retry = await supabase
        .from('community_members')
        .select('*, profile:profiles(id, full_name, full_name_ar, avatar_url, rating_average)')
        .eq('community_id', communityId)
      if (retry.error) throw retry.error
      return (retry.data ?? []) as CommunityMember[]
    }

    return (data ?? []) as CommunityMember[]
  } catch {
    return []
  }
}

/**
 * Admin action: Approve or reject a pending member
 */
export async function updateMemberStatus(
  communityId: string,
  userId: string,
  status: 'APPROVED' | 'REJECTED' | 'BANNED'
): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase
      .from('community_members')
      .update({ status, joined_at: status === 'APPROVED' ? new Date().toISOString() : null })
      .eq('community_id', communityId)
      .eq('user_id', userId)

    return !error
  } catch {
    return false
  }
}

export function generateCommunityIntakePin(id: string): string {
  if (!id) return 'COMM-8821'
  const clean = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const part = clean.slice(-6).padEnd(6, '9')
  return `COMM-${part}`
}

/**
 * Add a book listing to community shelf with status tracking
 */
export async function addBookToCommunity(params: {
  communityId: string
  listingId: string
  addedBy: string
  note?: string
}): Promise<{
  success: boolean
  status: 'APPROVED' | 'PENDING'
  communityBookId?: string
  intakePin?: string
  error?: string
}> {
  const supabase = createClient()
  try {
    // Check if submitter is the community admin or if community does not require approval
    const { data: comm } = await supabase
      .from('communities')
      .select('admin_id, requires_approval')
      .eq('id', params.communityId)
      .maybeSingle()

    const isAdmin = comm?.admin_id === params.addedBy
    const isAutoApproved = isAdmin || !comm?.requires_approval
    const initialStatus = isAutoApproved ? 'APPROVED' : 'PENDING'

    const { data: inserted, error } = await supabase
      .from('community_books')
      .insert({
        community_id: params.communityId,
        listing_id: params.listingId,
        added_by: params.addedBy,
        note: params.note || null,
        status: initialStatus,
        ...(isAutoApproved ? { approved_by: params.addedBy, approved_at: new Date().toISOString() } : {}),
      })
      .select('id')
      .maybeSingle()

    if (error) {
      // Fallback in case status column is not yet present
      if (error.message?.includes('status')) {
        const { data: fbData, error: fbErr } = await supabase
          .from('community_books')
          .insert({
            community_id: params.communityId,
            listing_id: params.listingId,
            added_by: params.addedBy,
            note: params.note || null,
          })
          .select('id')
          .maybeSingle()

        const fbId = fbData?.id || `cb-${Date.now()}`
        return {
          success: !fbErr,
          status: 'APPROVED',
          communityBookId: fbId,
          intakePin: generateCommunityIntakePin(fbId),
          error: fbErr?.message,
        }
      }
      return { success: false, status: initialStatus, error: error.message }
    }

    const bookId = inserted?.id || `cb-${Date.now()}`
    const intakePin = generateCommunityIntakePin(bookId)

    return {
      success: true,
      status: initialStatus,
      communityBookId: bookId,
      intakePin,
    }
  } catch (err: any) {
    return { success: false, status: 'PENDING', error: err?.message }
  }
}

function mapListingToShelfBook(row: {
  id: string
  listing_id: string
  status?: string | null
  added_by?: string | null
  community_id?: string | null
  note?: string | null
  listing?: any
}): CommunityShelfBook | null {
  const rawListing = row.listing
  const listing: BookListing | null = Array.isArray(rawListing) ? rawListing[0] : rawListing
  if (!listing) return null
  const book = listing.book
  const cover =
    listing.images?.find(img => img.is_primary)?.url ||
    listing.images?.[0]?.url ||
    book?.cover_image_url ||
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'

  return {
    id: row.id,
    listing_id: row.listing_id,
    listing_type: listing.listing_type,
    title: book?.title_ar || book?.title || 'كتاب',
    author: book?.author_ar || book?.author,
    cover_image_url: cover,
    owner_name: listing.seller?.full_name_ar || listing.seller?.full_name,
    owner_id: listing.seller?.id || listing.seller_id,
    owner_rating: listing.seller?.rating_average,
    price: listing.price ?? null,
    listing_slug: listing.id,
    status: (row.status as any) || 'APPROVED',
    added_by: row.added_by || undefined,
    condition: listing.condition,
    community_id: row.community_id || undefined,
    note: row.note || undefined,
  }
}

/**
 * Fetch approved books shared on a community shelf.
 * Only returns books that were explicitly submitted to this community's shelf
 * and approved by the admin with active listings.
 */
export async function getCommunityBooks(
  communityId: string,
  _client?: SupabaseClient
): Promise<CommunityShelfBook[]> {
  if (isDemoCommunityId(communityId)) return []

  try {
    const supabase = _client ?? createClient()
    const { data, error } = await supabase
      .from('community_books')
      .select(
        'id, listing_id, status, added_by, community_id, note, listing:book_listings(*, book:books(*), images:book_images(*), seller:profiles(id, full_name, full_name_ar, avatar_url, rating_average))'
      )
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })

    const booksMap = new Map<string, CommunityShelfBook>()

    if (!error && data && data.length > 0) {
      for (const row of data) {
        if (!row.status || row.status === 'APPROVED') {
          // Check that listing exists and is ACTIVE
          if (row.listing && (row.listing.status === 'ACTIVE' || !row.listing.status)) {
            const mapped = mapListingToShelfBook(row)
            if (mapped && mapped.listing_id) {
              booksMap.set(mapped.listing_id, mapped)
            }
          }
        }
      }
    }

    return Array.from(booksMap.values())
  } catch (err) {
    console.error('[getCommunityBooks] Error:', err)
    return []
  }
}

/**
 * Fetch pending books submitted to a community shelf for admin review
 * (or for submitter to review their own submissions)
 */
export async function getPendingCommunityBooks(
  communityId: string,
  _client?: SupabaseClient,
  userId?: string
): Promise<CommunityShelfBook[]> {
  if (isDemoCommunityId(communityId)) return []

  try {
    const supabase = _client ?? createClient()
    let query = supabase
      .from('community_books')
      .select(
        'id, listing_id, status, added_by, community_id, note, listing:book_listings(*, book:books(*), images:book_images(*), seller:profiles(id, full_name, full_name_ar, avatar_url, rating_average))'
      )
      .eq('community_id', communityId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('added_by', userId)
    }

    const { data, error } = await query

    if (error) throw error
    return (data ?? [])
      .map((row: any) => mapListingToShelfBook(row))
      .filter((row: CommunityShelfBook | null): row is CommunityShelfBook => Boolean(row))
  } catch {
    return []
  }
}

/**
 * Approve or Reject a submitted book in the community
 */
export async function updateCommunityBookApproval(params: {
  communityBookId: string
  status: 'APPROVED' | 'REJECTED'
  adminId: string
  adminNote?: string
  communityName?: string
  bookTitle?: string
  sellerId?: string
}): Promise<boolean> {
  const supabase = createClient()
  try {
    const { error } = await supabase
      .from('community_books')
      .update({
        status: params.status,
        approved_by: params.adminId,
        approved_at: new Date().toISOString(),
        admin_note: params.adminNote || null,
      })
      .eq('id', params.communityBookId)

    if (error) throw error

    return true
  } catch (err) {
    console.error('[updateCommunityBookApproval] error:', err)
    return false
  }
}

/**
 * Verify and approve a community book intake using QR payload or manual PIN code
 */
export async function verifyCommunityBookIntakeQr(params: {
  communityId: string
  adminId: string
  inputCodeOrPayload: string
}): Promise<{
  success: boolean
  messageAr: string
  messageEn: string
  book?: CommunityShelfBook
}> {
  const supabase = createClient()
  try {
    const raw = (params.inputCodeOrPayload || '').trim()
    if (!raw) {
      return {
        success: false,
        messageAr: 'الرجاء إدخال أو مسح رمز QR صالح',
        messageEn: 'Please scan or enter a valid QR code',
      }
    }

    let parsedPayload: any = null
    try {
      parsedPayload = JSON.parse(raw)
    } catch {
      parsedPayload = null
    }

    // If QR payload contains a specific communityId, verify it matches
    if (parsedPayload?.communityId && parsedPayload.communityId !== params.communityId) {
      return {
        success: false,
        messageAr: 'رمز QR هذا ينتمي إلى مجتمع قراءة آخر!',
        messageEn: 'This QR code belongs to a different reading community!',
      }
    }

    // Extract potential search identifiers
    const targetBookId = parsedPayload?.communityBookId || parsedPayload?.id
    const targetListingId = parsedPayload?.listingId
    const targetCode = (parsedPayload?.code || raw).replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

    // Fetch all pending books for this community
    const { data: pendingList, error: fetchErr } = await supabase
      .from('community_books')
      .select(
        'id, listing_id, status, added_by, community_id, note, listing:book_listings(*, book:books(*), images:book_images(*), seller:profiles(id, full_name, full_name_ar, avatar_url, rating_average))'
      )
      .eq('community_id', params.communityId)
      .eq('status', 'PENDING')

    if (fetchErr) {
      console.error('[verifyCommunityBookIntakeQr] Fetch error:', fetchErr)
      return {
        success: false,
        messageAr: 'حدث خطأ أثناء البحث عن الكتب المعلقة في قاعدة البيانات.',
        messageEn: 'Database error searching for pending community books.',
      }
    }

    if (!pendingList || pendingList.length === 0) {
      return {
        success: false,
        messageAr: 'لا توجد كتب معلقة بانتظار الاعتماد مطابقة لهذا الرمز. قد يكون الكتاب معتمداً بالفعل!',
        messageEn: 'No pending books found matching this code. It may already be approved!',
      }
    }

    // Find the matching book record
    const matched = pendingList.find(row => {
      // Direct ID match
      if (targetBookId && (row.id === targetBookId || row.listing_id === targetBookId)) return true
      if (targetListingId && row.listing_id === targetListingId) return true

      // Cleaned ID matches
      const cleanRowId = row.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
      const cleanListingId = (row.listing_id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

      // Generated PIN matches
      const expectedPin = generateCommunityIntakePin(row.id).replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
      const expectedPinListing = generateCommunityIntakePin(row.listing_id).replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

      if (targetCode) {
        if (expectedPin === targetCode || expectedPin.endsWith(targetCode) || targetCode.endsWith(expectedPin)) return true
        if (expectedPinListing === targetCode || expectedPinListing.endsWith(targetCode) || targetCode.endsWith(expectedPinListing)) return true
        if (cleanRowId.endsWith(targetCode) || targetCode.endsWith(cleanRowId.slice(-6))) return true
        if (cleanListingId.endsWith(targetCode) || targetCode.endsWith(cleanListingId.slice(-6))) return true
      }

      return false
    })

    if (!matched) {
      return {
        success: false,
        messageAr: 'لم يتم العثور على كتاب معلق يطابق هذا الرمز أو الباركود في هذا المجتمع.',
        messageEn: 'No pending book in this community matches this QR code or PIN.',
      }
    }

    // Update status to APPROVED
    const { error: updateErr } = await supabase
      .from('community_books')
      .update({
        status: 'APPROVED',
        approved_by: params.adminId,
        approved_at: new Date().toISOString(),
        admin_note: 'تم الاستلام والاعتماد الفعلي عبر مسح رمز QR',
      })
      .eq('id', matched.id)

    if (updateErr) {
      console.error('[verifyCommunityBookIntakeQr] Update error:', updateErr)
      return {
        success: false,
        messageAr: 'فشل اعتماد الكتاب في قاعدة البيانات.',
        messageEn: 'Failed to update approval status in database.',
      }
    }

    const mappedBook = mapListingToShelfBook(matched)
    const bookTitle = mappedBook?.title || 'الكتاب'

    return {
      success: true,
      messageAr: `تم اعتماد واستلام كتاب "${bookTitle}" بنجاح وإدراجه في رف المجتمع! 📚✅`,
      messageEn: `Book "${bookTitle}" has been verified and added to the community shelf! 📚✅`,
      book: mappedBook || undefined,
    }
  } catch (err: any) {
    console.error('[verifyCommunityBookIntakeQr] Exception:', err)
    return {
      success: false,
      messageAr: err?.message || 'حدث خطأ غير متوقع أثناء التحقق',
      messageEn: err?.message || 'An unexpected error occurred during verification',
    }
  }
}

/**
 * Fetch user's active book listings so they can pick one to share in community
 */
export async function getUserBooksForCommunity(userId: string): Promise<BookListing[]> {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('book_listings')
      .select('*, book:books(*), images:book_images(*)')
      .eq('seller_id', userId)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as BookListing[]
  } catch {
    return []
  }
}

/**
 * Admin action: Update community details
 */
export async function updateCommunityDetails(
  communityId: string,
  updates: Partial<Community>
): Promise<boolean> {
  const supabase = createClient()
  try {
    // Synchronize branding aliases so both legacy and modern columns get populated
    const normalizedUpdates: Record<string, any> = { ...updates }
    if (updates.cover_image_url || updates.banner_url) {
      const cover = updates.cover_image_url || updates.banner_url
      normalizedUpdates.cover_image_url = cover
      normalizedUpdates.banner_url = cover
    }
    if (updates.logo_url || updates.avatar_url) {
      const logo = updates.logo_url || updates.avatar_url
      normalizedUpdates.logo_url = logo
      normalizedUpdates.avatar_url = logo
    }

    // If it's a demo community (non-UUID), update in-memory catalog directly
    if (!isUuid(communityId)) {
      const idx = DEMO_COMMUNITIES.findIndex(c => c.id === communityId)
      if (idx !== -1) {
        DEMO_COMMUNITIES[idx] = { ...DEMO_COMMUNITIES[idx], ...normalizedUpdates }
      }
      return true
    }

    let { error } = await supabase
      .from('communities')
      .update(normalizedUpdates)
      .eq('id', communityId)

    // Fallback if newer columns from migration 005 aren't present yet on remote DB
    if (error && isUuid(communityId)) {
      console.warn('Full community update failed, retrying with core schema columns:', error.message)
      const coreOnly: Record<string, any> = {}
      if (normalizedUpdates.name) coreOnly.name = normalizedUpdates.name
      if (normalizedUpdates.name_ar) coreOnly.name_ar = normalizedUpdates.name_ar
      if (normalizedUpdates.description) coreOnly.description = normalizedUpdates.description
      if (normalizedUpdates.description_ar) coreOnly.description_ar = normalizedUpdates.description_ar
      if (normalizedUpdates.cover_image_url) coreOnly.cover_image_url = normalizedUpdates.cover_image_url
      if (normalizedUpdates.avatar_url) coreOnly.avatar_url = normalizedUpdates.avatar_url
      if (normalizedUpdates.location_text) coreOnly.location_text = normalizedUpdates.location_text
      if (normalizedUpdates.hub_name) coreOnly.hub_name = normalizedUpdates.hub_name
      if (normalizedUpdates.hub_address) coreOnly.hub_address = normalizedUpdates.hub_address
      if (normalizedUpdates.hub_instructions) coreOnly.hub_instructions = normalizedUpdates.hub_instructions
      if (normalizedUpdates.hub_photo_url) coreOnly.hub_photo_url = normalizedUpdates.hub_photo_url
      if (normalizedUpdates.hub_lat !== undefined) coreOnly.hub_lat = normalizedUpdates.hub_lat
      if (normalizedUpdates.hub_lng !== undefined) coreOnly.hub_lng = normalizedUpdates.hub_lng

      const retryRes = await supabase
        .from('communities')
        .update(coreOnly)
        .eq('id', communityId)

      if (!retryRes.error) {
        error = null
      }
    }

    // Always update in-memory fallback list
    const idx = DEMO_COMMUNITIES.findIndex(c => c.id === communityId)
    if (idx !== -1) {
      DEMO_COMMUNITIES[idx] = { ...DEMO_COMMUNITIES[idx], ...normalizedUpdates }
    }

    return !error
  } catch (err) {
    console.warn('updateCommunityDetails caught exception, falling back to local memory:', err)
    const idx = DEMO_COMMUNITIES.findIndex(c => c.id === communityId)
    if (idx !== -1) {
      DEMO_COMMUNITIES[idx] = { ...DEMO_COMMUNITIES[idx], ...updates }
      return true
    }
    return false
  }
}

/**
 * Admin/Owner action: Delete community
 */
export async function deleteCommunity(
  communityId: string,
  currentUserId?: string | null,
  isPlatformAdmin = false
): Promise<boolean> {
  const supabase = createClient()
  try {
    if (isUuid(communityId)) {
      // 1. Delete associated child records if needed
      await supabase.from('community_books').delete().eq('community_id', communityId)
      await supabase.from('community_members').delete().eq('community_id', communityId)
      await supabase.from('community_posts').delete().eq('community_id', communityId)

      // 2. Delete the community row
      let q = supabase
        .from('communities')
        .delete()
        .eq('id', communityId)

      // If not platform admin, ensure caller is creator/admin_id
      if (!isPlatformAdmin && currentUserId) {
        q = q.eq('admin_id', currentUserId)
      }

      const { error } = await q

      if (error) {
        console.warn('DB delete community error:', error)
      }
    }

    // Always remove from in-memory fallback list
    const idx = DEMO_COMMUNITIES.findIndex(c => c.id === communityId)
    if (idx !== -1) {
      DEMO_COMMUNITIES.splice(idx, 1)
    }

    return true
  } catch (err) {
    console.error('deleteCommunity error:', err)
    return false
  }
}

