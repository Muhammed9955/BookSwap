import type { StoreInventoryItem } from '@/types/store'
import { DIWAN_SEEDS } from './diwan-seeds'
import { SHOROUK_SEEDS } from './shorouk-seeds'
import { AZBAKEYA_SEEDS } from './azbakeya-seeds'
import { ALEX_SEEDS } from './alex-seeds'
import { BOOKISH_SEEDS } from './bookish-seeds'

export { DIWAN_SEEDS } from './diwan-seeds'
export { SHOROUK_SEEDS } from './shorouk-seeds'
export { AZBAKEYA_SEEDS } from './azbakeya-seeds'
export { ALEX_SEEDS } from './alex-seeds'
export { BOOKISH_SEEDS } from './bookish-seeds'

/**
 * Authentic Real Bookstore Inventory Presets for Egyptian Partner Bookstores
 * Maps store IDs to their verified inventories.
 */
export const REAL_STORE_INVENTORY_SEEDS: Record<string, StoreInventoryItem[]> = {
  'store-diwan-zamalek': DIWAN_SEEDS,
  'store-shorouk-downtown': SHOROUK_SEEDS,
  'store-azbakeya-heritage': AZBAKEYA_SEEDS,
  'store-readers-corner-alex': ALEX_SEEDS,
  'store-bookish-online': BOOKISH_SEEDS,
}

/**
 * Get authentic seed books for a specific bookstore
 */
export function getStoreSeeds(storeId: string): StoreInventoryItem[] {
  return REAL_STORE_INVENTORY_SEEDS[storeId] || []
}

/**
 * Get a flat array of all authentic seed books across all partner bookstores
 */
export function getAllRealSeeds(): StoreInventoryItem[] {
  return Object.values(REAL_STORE_INVENTORY_SEEDS).flat()
}
