import type {
  Category,
  CleanResult,
  DevToolItem,
  Platform,
  ScanResult,
  StorageOverview,
} from '@stash/core';
import { categories } from './categories.js';
import { cleanAllSafe, cleanItem } from './cleaner.js';
import {
  deleteAVDs,
  deleteAndroidSDKVersions,
  listAVDs,
  listAndroidSDKVersions,
} from './devtools.js';
import { getStorageOverview, scanAll, scanCategory } from './scanner.js';

export class LinuxPlatform implements Platform {
  readonly name = 'Linux';
  readonly id = 'linux' as const;

  getStorageOverview(): Promise<StorageOverview> {
    return getStorageOverview();
  }

  getCategories(): Category[] {
    return categories;
  }

  scanCategory(category: Category): Promise<ScanResult> {
    return scanCategory(category);
  }

  scanAll(onProgress?: (name: string) => void): Promise<ScanResult[]> {
    return scanAll(onProgress);
  }

  cleanItem(id: string): Promise<CleanResult> {
    return cleanItem(id);
  }

  cleanAllSafe(): Promise<CleanResult[]> {
    return cleanAllSafe();
  }

  async listSelectiveItems(id: string): Promise<DevToolItem[]> {
    switch (id) {
      case 'android-sdk':
        return listAndroidSDKVersions();
      case 'android-emulators':
        return listAVDs();
      default:
        return [];
    }
  }

  async deleteSelectiveItems(categoryId: string, itemIds: string[]): Promise<CleanResult[]> {
    switch (categoryId) {
      case 'android-sdk':
        return deleteAndroidSDKVersions(itemIds);
      case 'android-emulators':
        return deleteAVDs(itemIds);
      default:
        return [];
    }
  }
}
