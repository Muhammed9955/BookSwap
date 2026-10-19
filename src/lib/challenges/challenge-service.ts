import type { ReadingChallenge, UserChallengeProgress, ChallengeType } from '@/types/challenge'

export const DEMO_CHALLENGES: ReadingChallenge[] = [
  {
    id: 'challenge-weekend-sprint',
    slug: 'weekend-48h-sprint',
    title: 'Weekend 48-Hour Sprint: Finish 1 Novella',
    title_ar: 'سبرنت عطلة نهاية الأسبوع: كتاب في 48 ساعة ⚡',
    description: 'Dedicate your Friday and Saturday to devouring one short novel or novella (<180 pages). Perfect for resetting your reading habit.',
    description_ar: 'خصّص يومي الجمعة والسبت لإنهاء رواية قصيرة أو كتاب مكثف (أقل من 180 صفحة). التحدي الأنسب لكسر الروتين واستعادة شغف القراءة السريع.',
    type: 'WEEKLY_SPRINT',
    difficulty: 'EASY',
    duration_days: 2,
    target_books_count: 1,
    target_pages_count: 160,
    daily_pages_goal: 80,
    starts_at: '2026-10-23T00:00:00Z',
    ends_at: '2026-10-24T23:59:59Z',
    participant_count: 342,
    completion_rate_pct: 78,
    badge: {
      id: 'badge-weekend-sprinter',
      name: 'Weekend Sprinter',
      name_ar: 'عدّاء الويك إند الروائي',
      description: 'Completed a full book in under 48 hours during the weekend.',
      description_ar: 'أنهى قراءة كتاب بالكامل خلال عطلة نهاية الأسبوع في أقل من 48 ساعة.',
      icon: '⚡',
      xp: 150,
    },
    tags: ['سبرنت سريع', 'روايات قصيرة', 'ويك إند'],
    cover_image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    is_featured: true,
    is_active: true,
  },
  {
    id: 'challenge-monthly-4-books',
    slug: 'monthly-4-books-challenge',
    title: 'October 30-Day Goal: 1 Book Every Week',
    title_ar: 'تحدي الشهر: 4 أسابيع، 4 كتب 🏆',
    description: 'The golden classic reading rhythm: Read 1 book per week for 4 consecutive weeks. Build your deep focus muscle.',
    description_ar: 'الإيقاع الذهبي لعشاق المطالعة: قراءة كتاب واحد كل أسبوع على مدار 4 أسابيع متتالية. ابنِ عضلات التركيز العميق وتذوق التنوع المعرفي.',
    type: 'MONTHLY_GOAL',
    difficulty: 'MEDIUM',
    duration_days: 30,
    target_books_count: 4,
    target_pages_count: 1000,
    daily_pages_goal: 33,
    starts_at: '2026-10-01T00:00:00Z',
    ends_at: '2026-10-31T23:59:59Z',
    participant_count: 890,
    completion_rate_pct: 64,
    badge: {
      id: 'badge-monthly-master',
      name: 'Monthly Master',
      name_ar: 'فارس الشهر الذهبي',
      description: 'Finished 4 books in 30 days.',
      description_ar: 'أتم قراءة 4 كتب متكاملة في 30 يوماً.',
      icon: '🏆',
      xp: 500,
    },
    tags: ['تحدي شهري', 'كتاب كل أسبوع', 'تركيز'],
    cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    is_featured: true,
    is_active: true,
  },
  {
    id: 'challenge-14day-streak',
    slug: '14-day-daily-reading-streak',
    title: '14-Day Micro Habit: 20 Pages Daily',
    title_ar: 'عادة القراءة اليومية: 20 صفحة لمدة 14 يوماً 🔥',
    description: 'Small steps create life-changing habits. Read just 20 pages every single day without breaking the chain.',
    description_ar: 'الخطوات الصغيرة تصنع فارقاً هائلاً! اقرأ 20 صفحة فقط يومياً لمدة 14 يوماً متواصلة دون انقطاع، وثبّت شعلة القراءة كجزء من يومك.',
    type: 'HABIT_STREAK',
    difficulty: 'EASY',
    duration_days: 14,
    target_books_count: 1,
    target_pages_count: 280,
    daily_pages_goal: 20,
    starts_at: '2026-10-10T00:00:00Z',
    ends_at: '2026-10-24T23:59:59Z',
    participant_count: 1240,
    completion_rate_pct: 71,
    badge: {
      id: 'badge-habit-flame',
      name: 'Unstoppable Flame',
      name_ar: 'شعلة العادة الثابتة',
      description: 'Maintained a 14-day uninterrupted reading streak.',
      description_ar: 'حافظ على سلسلة قراءة يومية متصلة لمدة 14 يوماً دون انقطاع.',
      icon: '🔥',
      xp: 300,
    },
    tags: ['بناء عادات', 'ستريك يومي', 'تنمية'],
    cover_image_url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80',
    is_featured: true,
    is_active: true,
  },
  {
    id: 'challenge-mahfouz-trilogy',
    slug: 'naguib-mahfouz-cairo-trilogy',
    title: 'Nobel Laureate Marathon: Cairo Trilogy',
    title_ar: 'ماراثون أدب نوبل: ثلاثية القاهرة لنجيب محفوظ 🏛️',
    description: 'Immerse yourself in authentic Egyptian literature by reading Bayn al-Qasrayn, Qasr al-Shawq, and Al-Sukkariyya.',
    description_ar: 'رحلة خالدة في قلب القاهرة الفاطمية وعوالم أديب نوبل نجيب محفوظ. اقرأ ثلاثية بين القصرين وقصر الشوق والسكرية وعش تفاصيل الحارة المصرية.',
    type: 'THEMED_QUEST',
    difficulty: 'HARD',
    duration_days: 45,
    target_books_count: 3,
    target_pages_count: 1450,
    daily_pages_goal: 32,
    starts_at: '2026-10-01T00:00:00Z',
    ends_at: '2026-11-15T23:59:59Z',
    participant_count: 420,
    completion_rate_pct: 53,
    badge: {
      id: 'badge-cairo-sage',
      name: 'Cairo Heritage Sage',
      name_ar: 'حكيم الحارة المصرية',
      description: 'Completed the legendary Cairo Trilogy by Naguib Mahfouz.',
      description_ar: 'أتم قراءة ثلاثية القاهرة الأيقونية لأديب نوبل نجيب محفوظ.',
      icon: '🏛️',
      xp: 600,
    },
    tags: ['أدب مصري', 'نجيب محفوظ', 'كلاسيكيات'],
    cover_image_url: 'https://images.unsplash.com/photo-1507842229451-7f01be7ac102?auto=format&fit=crop&w=800&q=80',
    is_featured: false,
    is_active: true,
  },
  {
    id: 'challenge-circular-swap',
    slug: 'read-one-swap-one-challenge',
    title: 'Circular Economy Quest: Read 1 Book & Swap It',
    title_ar: 'تحدي التدوير الذكي: اقرأ كتاباً وبادله مع قارئ آخر! 🔄',
    description: 'Do not let great stories collect dust! Finish a book sitting on your shelf, then swap it at a partner safe hub (Cilantro or Diwan) with a local reader.',
    description_ar: 'لا تدع الكتب القيمة تحبس على الرف! أنهِ قراءة كتاب، ثم اعرضه للمبادلة في أحد نقاط التبادل الآمنة (مثل كافيه سيلانترو أو ديوان) لتمنحه حياة جديدة.',
    type: 'SWAP_CIRCULAR',
    difficulty: 'EASY',
    duration_days: 14,
    target_books_count: 1,
    starts_at: '2026-10-15T00:00:00Z',
    ends_at: '2026-10-31T23:59:59Z',
    participant_count: 670,
    completion_rate_pct: 82,
    badge: {
      id: 'badge-circular-ambassador',
      name: 'Circular Reader Ambassador',
      name_ar: 'سفير التدوير المستدام',
      description: 'Finished a book and completed a free community swap.',
      description_ar: 'أنهى قراءة كتاب وبادله بنجاح مع قارئ آخر في مجتمعه المحلي.',
      icon: '🔄',
      xp: 400,
    },
    tags: ['تدوير الكتب', 'تبادل مجاني', 'نقاط آمنة'],
    cover_image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    is_featured: true,
    is_active: true,
  },
  {
    id: 'challenge-genre-voyager',
    slug: 'genre-voyager-5-categories',
    title: 'Genre Voyager: 5 Books Across 5 Different Genres',
    title_ar: 'مستكشف العوالم: 5 كتب في 5 تصنيفات مختلفة 🧭',
    description: 'Expand your intellectual horizons by reading 1 Fiction, 1 History, 1 Psychology/Growth, 1 Tech/Science, and 1 Biography/Memoir.',
    description_ar: 'وسّع آفاقك الفكرية بقراءة 5 كتب في 5 تصنيفات متنوعة: رواية، كتاب تاريخي، علم نفس/تطوير ذات، علوم وتقنية، وسيرة ذاتية ملهمة.',
    type: 'THEMED_QUEST',
    difficulty: 'HARD',
    duration_days: 60,
    target_books_count: 5,
    target_pages_count: 1400,
    daily_pages_goal: 24,
    starts_at: '2026-09-15T00:00:00Z',
    ends_at: '2026-11-15T23:59:59Z',
    participant_count: 310,
    completion_rate_pct: 58,
    badge: {
      id: 'badge-genre-voyager',
      name: 'Genre Voyager',
      name_ar: 'سندباد المعرفة الموسوعي',
      description: 'Read 5 books in 5 completely distinct genres.',
      description_ar: 'أنهى قراءة 5 كتب في 5 تصنيفات معرفية متباينة.',
      icon: '🧭',
      xp: 750,
    },
    tags: ['تنوع فكري', 'علوم', 'تاريخ', 'روايات'],
    cover_image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
    is_featured: false,
    is_active: true,
  },
  {
    id: 'challenge-annual-2026',
    slug: 'annual-reading-challenge-2026',
    title: 'Annual 2026 Reading Milestone: 24 Books',
    title_ar: 'تحدي قراءة 2026 السنوي: 24 كتاباً في العام 📚',
    description: 'Your long-term reading resolution: Complete 24 books across the year (averaging 2 books a month) and join our reader hall of fame.',
    description_ar: 'عهد القراءة السنوي: إتمام 24 كتاباً على مدار العام (بمعدل كتابين شهرياً). تتبع تقدمك شهراً بشهر وادخل قائمة شرف قراء وَرَق المميزين.',
    type: 'YEARLY_TARGET',
    difficulty: 'EPIC',
    duration_days: 365,
    target_books_count: 24,
    target_pages_count: 6500,
    daily_pages_goal: 18,
    starts_at: '2026-01-01T00:00:00Z',
    ends_at: '2026-12-31T23:59:59Z',
    participant_count: 2150,
    completion_rate_pct: 46,
    badge: {
      id: 'badge-annual-crown',
      name: 'Annual Reader Crown',
      name_ar: 'تاج قارئ العام 2026',
      description: 'Achieved the 24-book milestone in 2026.',
      description_ar: 'حقّق إنجاز قراءة 24 كتاباً في عام 2026.',
      icon: '👑',
      xp: 1200,
    },
    tags: ['تحدي سنوي', 'هدف العام', 'نادي النخبة'],
    cover_image_url: 'https://images.unsplash.com/photo-1526721940322-10fb6e3ae94a?auto=format&fit=crop&w=800&q=80',
    is_featured: true,
    is_active: true,
  },
]

export async function getChallenges(filter?: {
  type?: ChallengeType | 'ALL'
  featuredOnly?: boolean
}): Promise<ReadingChallenge[]> {
  let list = [...DEMO_CHALLENGES]
  if (filter?.type && filter.type !== 'ALL') {
    list = list.filter(c => c.type === filter.type)
  }
  if (filter?.featuredOnly) {
    list = list.filter(c => c.is_featured)
  }
  return list
}

export async function getChallengeBySlug(slug: string): Promise<ReadingChallenge | null> {
  return DEMO_CHALLENGES.find(c => c.slug === slug) ?? null
}

const STORAGE_KEY = 'waraq_user_challenges_progress_v1'

export function getUserChallengeProgress(challengeId: string): UserChallengeProgress {
  if (typeof window === 'undefined') {
    return {
      challenge_id: challengeId,
      user_id: 'guest',
      is_joined: false,
      books_completed: 0,
      pages_read: 0,
      current_streak_days: 0,
      best_streak_days: 0,
      is_completed: false,
      last_activity_at: new Date().toISOString(),
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        challenge_id: challengeId,
        user_id: 'guest',
        is_joined: false,
        books_completed: 0,
        pages_read: 0,
        current_streak_days: 0,
        best_streak_days: 0,
        is_completed: false,
        last_activity_at: new Date().toISOString(),
      }
    }
    const parsed = JSON.parse(raw)
    return (
      parsed[challengeId] ?? {
        challenge_id: challengeId,
        user_id: 'guest',
        is_joined: false,
        books_completed: 0,
        pages_read: 0,
        current_streak_days: 0,
        best_streak_days: 0,
        is_completed: false,
        last_activity_at: new Date().toISOString(),
      }
    )
  } catch {
    return {
      challenge_id: challengeId,
      user_id: 'guest',
      is_joined: false,
      books_completed: 0,
      pages_read: 0,
      current_streak_days: 0,
      best_streak_days: 0,
      is_completed: false,
      last_activity_at: new Date().toISOString(),
    }
  }
}

export function saveUserChallengeProgress(progress: UserChallengeProgress): void {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const map = raw ? JSON.parse(raw) : {}
    map[progress.challenge_id] = progress
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {}
}
