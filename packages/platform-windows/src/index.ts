import type { Category, CleanResult, DevToolItem, Platform, ScanResult, StorageOverview } from '@stash/core';

/**
 * Windows platform — coming soon.
 * Will support: %APPDATA%, %TEMP%, Windows-specific caches.
 */
export class WindowsPlatform implements Platform {
  readonly name = 'Windows';
  readonly id = 'windows' as const;

  async getStorageOverview(): Promise<StorageOverview> {
    throw new Error('Windows platform support coming soon');
  }

  getCategories(): Category[] {
    return [];
  }

  async scanCategory(_category: Category): Promise<ScanResult> {
    throw new Error('Windows platform support coming soon');
  }

  async scanAll(_onProgress?: (name: string) => void): Promise<ScanResult[]> {
    return [];
  }

  async cleanItem(_id: string): Promise<CleanResult> {
    throw new Error('Windows platform support coming soon');
  }

  async cleanAllSafe(): Promise<CleanResult[]> {
    return [];
  }

  async listSelectiveItems(_id: string): Promise<DevToolItem[]> {
    return [];
  }

  async deleteSelectiveItems(_categoryId: string, _itemIds: string[]): Promise<CleanResult[]> {
    return [];
  }
}
