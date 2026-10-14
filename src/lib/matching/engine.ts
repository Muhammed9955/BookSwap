/**
 * BookSwap Matching Engine
 * 
 * Deterministic scoring algorithm to match users with relevant book listings.
 * Architecture allows future AI/ML replacement without changing the interface.
 */

import type { BookListing, WishlistItem, Profile, MatchResult, MatchReason } from '@/types'

interface MatchingContext {
  userId: string
  userProfile: Profile
  userWishlist: WishlistItem[]
  userAreaId?: string
  userCityId?: string
}

const WEIGHTS = {
  WISHLIST_MATCH: 40,        // User wants this exact book
  CATEGORY_MATCH: 15,        // User likes this category
  AREA_MATCH: 20,            // Same area
  CITY_MATCH: 10,            // Same city (different area)
  PRICE_IN_RANGE: 10,        // Within wishlist max price
  CONDITION_ACCEPTABLE: 5,   // Condition meets wishlist preference
  HIGH_SELLER_RATING: 5,     // Seller rating > 4.0
  GIVEAWAY_BONUS: 5,         // Free books get bonus
  SWAP_PREFERENCE_MATCH: 5,  // Both prefer swap
} as const

export function calculateMatchScore(
  listing: BookListing,
  context: MatchingContext
): MatchResult {
  const reasons: MatchReason[] = []
  let score = 0

  const { userWishlist, userProfile, userAreaId, userCityId } = context

  // 1. Direct wishlist match (highest signal)
  const wishlistMatch = userWishlist.find(w =>
    w.book_id === listing.book_id ||
    (w.custom_title && listing.book?.title?.toLowerCase().includes(w.custom_title.toLowerCase()))
  )

  if (wishlistMatch) {
    score += WEIGHTS.WISHLIST_MATCH
    reasons.push({
      signal: 'WISHLIST_MATCH',
      weight: WEIGHTS.WISHLIST_MATCH,
      description_ar: '🔔 في قائمة أمنياتك',
      description_en: '🔔 In your wishlist',
    })

    // Price within wishlist range
    if (wishlistMatch.max_price && listing.price && listing.price <= wishlistMatch.max_price) {
      score += WEIGHTS.PRICE_IN_RANGE
      reasons.push({
        signal: 'PRICE_IN_RANGE',
        weight: WEIGHTS.PRICE_IN_RANGE,
        description_ar: '💰 في نطاق السعر',
        description_en: '💰 Within your price range',
      })
    }

    // Condition acceptable
    const conditionOrder = ['NEW', 'LIKE_NEW', 'VERY_GOOD', 'GOOD', 'ACCEPTABLE']
    if (wishlistMatch.preferred_condition) {
      const desiredIdx = conditionOrder.indexOf(wishlistMatch.preferred_condition)
      const listingIdx = conditionOrder.indexOf(listing.condition)
      if (listingIdx <= desiredIdx) {
        score += WEIGHTS.CONDITION_ACCEPTABLE
        reasons.push({
          signal: 'CONDITION_ACCEPTABLE',
          weight: WEIGHTS.CONDITION_ACCEPTABLE,
          description_ar: '📚 الحالة مناسبة',
          description_en: '📚 Condition acceptable',
        })
      }
    }

    // Swap preference
    if (wishlistMatch.prefer_swap && ['SWAP', 'SELL_OR_SWAP'].includes(listing.listing_type)) {
      score += WEIGHTS.SWAP_PREFERENCE_MATCH
      reasons.push({
        signal: 'SWAP_PREFERENCE_MATCH',
        weight: WEIGHTS.SWAP_PREFERENCE_MATCH,
        description_ar: '🔄 متاح للمبادلة',
        description_en: '🔄 Available for swap',
      })
    }
  }

  // 2. Category match
  const userGenreIds = userProfile.genres?.map(g => g.id) ?? []
  if (listing.book?.category_id && userGenreIds.includes(listing.book.category_id)) {
    score += WEIGHTS.CATEGORY_MATCH
    reasons.push({
      signal: 'CATEGORY_MATCH',
      weight: WEIGHTS.CATEGORY_MATCH,
      description_ar: `📖 من تصنيفاتك المفضلة`,
      description_en: `📖 From your favorite categories`,
    })
  }

  // 3. Location proximity
  if (listing.area_id && listing.area_id === userAreaId) {
    score += WEIGHTS.AREA_MATCH
    reasons.push({
      signal: 'AREA_MATCH',
      weight: WEIGHTS.AREA_MATCH,
      description_ar: '📍 في منطقتك',
      description_en: '📍 In your area',
    })
  } else if (listing.city_id && listing.city_id === userCityId) {
    score += WEIGHTS.CITY_MATCH
    reasons.push({
      signal: 'CITY_MATCH',
      weight: WEIGHTS.CITY_MATCH,
      description_ar: '🏙️ في مدينتك',
      description_en: '🏙️ In your city',
    })
  }

  // 4. Seller trust signal
  const sellerRating = (listing.seller as unknown as Profile)?.rating_average ?? 0
  if (sellerRating >= 4.0) {
    score += WEIGHTS.HIGH_SELLER_RATING
    reasons.push({
      signal: 'HIGH_SELLER_RATING',
      weight: WEIGHTS.HIGH_SELLER_RATING,
      description_ar: `⭐ بائع موثوق (${sellerRating.toFixed(1)})`,
      description_en: `⭐ Trusted seller (${sellerRating.toFixed(1)})`,
    })
  }

  // 5. Giveaway bonus
  if (listing.listing_type === 'GIVEAWAY') {
    score += WEIGHTS.GIVEAWAY_BONUS
    reasons.push({
      signal: 'GIVEAWAY_BONUS',
      weight: WEIGHTS.GIVEAWAY_BONUS,
      description_ar: '🎁 مجاني!',
      description_en: '🎁 Free!',
    })
  }

  // Cap at 100
  const finalScore = Math.min(100, score)

  return {
    listing,
    match_score: finalScore,
    match_reasons: reasons,
  }
}

export function rankListings(
  listings: BookListing[],
  context: MatchingContext
): MatchResult[] {
  return listings
    .map(listing => calculateMatchScore(listing, context))
    .filter(result => result.match_score > 0)
    .sort((a, b) => b.match_score - a.match_score)
}

export function getMatchLabel(score: number, lang: 'ar' | 'en' = 'ar'): string {
  if (score >= 90) return lang === 'ar' ? '🔥 Match قوي جداً' : '🔥 Very Strong Match'
  if (score >= 70) return lang === 'ar' ? '⚡ Match قوي' : '⚡ Strong Match'
  if (score >= 50) return lang === 'ar' ? '✨ Match كويس' : '✨ Good Match'
  if (score >= 30) return lang === 'ar' ? '💡 Match محتمل' : '💡 Possible Match'
  return lang === 'ar' ? 'كتاب قريب' : 'Nearby Book'
}

export function getMatchColor(score: number): string {
  if (score >= 90) return 'text-red-500'
  if (score >= 70) return 'text-orange-500'
  if (score >= 50) return 'text-amber-500'
  if (score >= 30) return 'text-blue-500'
  return 'text-muted-foreground'
}

/**
 * Detect potential direct swaps between two users.
 * User A has Book X, wants Book Y.
 * User B has Book Y, wants Book X.
 */
export function detectDirectSwap(
  userAListings: BookListing[],
  userAWishlist: WishlistItem[],
  userBListings: BookListing[],
  userBWishlist: WishlistItem[]
): Array<{ userAListing: BookListing; userBListing: BookListing }> {
  const swaps: Array<{ userAListing: BookListing; userBListing: BookListing }> = []

  for (const aListing of userAListings) {
    if (!['SWAP', 'SELL_OR_SWAP'].includes(aListing.listing_type)) continue

    // Check if B wants A's book
    const bWantsA = userBWishlist.some(w => w.book_id === aListing.book_id)
    if (!bWantsA) continue

    for (const bListing of userBListings) {
      if (!['SWAP', 'SELL_OR_SWAP'].includes(bListing.listing_type)) continue

      // Check if A wants B's book
      const aWantsB = userAWishlist.some(w => w.book_id === bListing.book_id)
      if (aWantsB) {
        swaps.push({ userAListing: aListing, userBListing: bListing })
      }
    }
  }

  return swaps
}
