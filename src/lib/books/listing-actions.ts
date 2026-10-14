import { createClient } from '@/lib/supabase/client'

/**
 * Removes a book listing from the user's shelf/listings.
 * Performs a hard delete if possible (cascades images & swap requests, updates triggers).
 * Gracefully falls back to soft delete (status = 'DELETED') if protected foreign keys exist.
 */
export async function deleteBookListing(listingId: string): Promise<{ success: boolean; mode: 'hard' | 'soft' }> {
  const supabase = createClient()

  // 1. First attempt hard delete
  const { error: hardDeleteError } = await supabase
    .from('book_listings')
    .delete()
    .eq('id', listingId)

  if (!hardDeleteError) {
    return { success: true, mode: 'hard' }
  }

  console.warn('Hard delete failed (likely due to existing transaction history), falling back to soft delete:', hardDeleteError)

  // 2. Fallback to soft delete
  const { error: softDeleteError } = await supabase
    .from('book_listings')
    .update({ status: 'DELETED' })
    .eq('id', listingId)

  if (softDeleteError) {
    throw new Error(softDeleteError.message || 'Failed to remove book listing')
  }

  return { success: true, mode: 'soft' }
}
