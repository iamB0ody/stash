import type { Category, CleanResult, DevToolItem, StorageOverview, ScanResult } from './types.js';

/**
 * Platform interface — each OS implements this to provide
 * platform-specific scanning and cleaning capabilities.
 */
export interface Platform {
  /** Human-readable platform name (e.g., "macOS", "Windows", "Linux") */
  readonly name: string;

  /** Platform identifier */
  readonly id: 'mac' | 'windows' | 'linux';

  /** Get storage overview for all disks */
  getStorageOverview(): Promise<StorageOverview>;

  /** Get all categories available on this platform */
  getCategories(): Category[];

  /** Scan a single category for its current size */
  scanCategory(category: Category): Promise<ScanResult>;

  /** Scan all categories, with optional progress callback */
  scanAll(onProgress?: (name: string) => void): Promise<ScanResult[]>;

  /** Clean a single safe category */
  cleanItem(id: string): Promise<CleanResult>;

  /** Clean all safe categories */
  cleanAllSafe(): Promise<CleanResult[]>;

  /** List items for selective cleanup (e.g., iOS simulators) */
  listSelectiveItems(id: string): Promise<DevToolItem[]>;

  /** Delete specific selective items by their IDs */
  deleteSelectiveItems(categoryId: string, itemIds: string[]): Promise<CleanResult[]>;
}
