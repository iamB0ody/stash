import type { Category, CleanResult, DevToolItem, Platform, ScanResult, StorageOverview } from '@stash/core';

/**
 * Linux platform — coming soon.
 * Will support: ~/.cache, ~/.local, snap, flatpak caches.
 */
export class LinuxPlatform implements Platform {
  readonly name = 'Linux';
  readonly id = 'linux' as const;

  async getStorageOverview(): Promise<StorageOverview> {
    throw new Error('Linux platform support coming soon');
  }

  getCategories(): Category[] {
    return [];
  }

  async scanCategory(_category: Category): Promise<ScanResult> {
    throw new Error('Linux platform support coming soon');
  }

  async scanAll(_onProgress?: (name: string) => void): Promise<ScanResult[]> {
    return [];
  }

  async cleanItem(_id: string): Promise<CleanResult> {
    throw new Error('Linux platform support coming soon');
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
