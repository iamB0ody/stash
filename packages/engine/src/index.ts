import type { Platform } from '@stash/core';
import { platform } from 'os';

export async function detectPlatform(): Promise<Platform> {
  const os = platform();

  switch (os) {
    case 'darwin': {
      const { MacPlatform } = await import('@stash/platform-mac');
      return new MacPlatform();
    }
    case 'win32': {
      const { WindowsPlatform } = await import('@stash/platform-windows');
      return new WindowsPlatform();
    }
    case 'linux': {
      const { LinuxPlatform } = await import('@stash/platform-linux');
      return new LinuxPlatform();
    }
    default:
      throw new Error(`Unsupported platform: ${os}`);
  }
}

export async function createEngine(): Promise<Platform> {
  return detectPlatform();
}

// Re-export core types for convenience
export type {
  Category,
  CleanResult,
  DevToolItem,
  DiskInfo,
  StorageOverview,
  Platform,
  RiskLevel,
  ScanResult,
} from '@stash/core';

export { formatBytes } from '@stash/core';
