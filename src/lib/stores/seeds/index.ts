import type { StoreInventoryItem } from '@/types/store'

export const DIWAN_SEEDS: StoreInventoryItem[] = []
export const SHOROUK_SEEDS: StoreInventoryItem[] = []
export const AZBAKEYA_SEEDS: StoreInventoryItem[] = []
export const ALEX_SEEDS: StoreInventoryItem[] = []
export const BOOKISH_SEEDS: StoreInventoryItem[] = []

/**
 * Bookstore inventory presets (Purged of all fake data)
 */
export const REAL_STORE_INVENTORY_SEEDS: Record<string, StoreInventoryItem[]> = {}

/**
 * Get seed books for a specific bookstore
 */
export function getStoreSeeds(_storeId: string): StoreInventoryItem[] {
  return []
}

/**
 * Get all seed books
 */
export function getAllRealSeeds(): StoreInventoryItem[] {
  return []
}
