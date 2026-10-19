export type ChallengeType =
  | 'WEEKLY_SPRINT'    // e.g. Finish 1 book in 1 week or weekend sprint
  | 'MONTHLY_GOAL'     // e.g. 4 books in 1 month
  | 'YEARLY_TARGET'    // e.g. 24 or 50 books in a year
  | 'THEMED_QUEST'     // e.g. Nobel laureate marathon, translated literature
  | 'HABIT_STREAK'     // e.g. 15 minutes or 20 pages every day for 14 days
  | 'SWAP_CIRCULAR'    // Read 1 book and swap it at a local hub

export type ChallengeDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC'

export interface ChallengeBadge {
  id: string
  name: string
  name_ar: string
  description: string
  description_ar: string
  icon: string
  xp: number
}

export interface ReadingChallenge {
  id: string
  slug: string
  title: string
  title_ar: string
  description: string
  description_ar: string
  type: ChallengeType
  difficulty: ChallengeDifficulty
  duration_days: number
  target_books_count: number
  target_pages_count?: number
  daily_pages_goal?: number
  starts_at: string
  ends_at: string
  participant_count: number
  completion_rate_pct: number
  badge: ChallengeBadge
  tags: string[]
  cover_image_url: string
  is_featured: boolean
  is_active: boolean
}

export interface UserChallengeProgress {
  challenge_id: string
  user_id: string
  is_joined: boolean
  books_completed: number
  pages_read: number
  current_streak_days: number
  best_streak_days: number
  is_completed: boolean
  completed_at?: string
  last_activity_at: string
  notes?: string
}
