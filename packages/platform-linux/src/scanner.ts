import type { Category, DiskInfo, ScanResult, StorageOverview } from '@stash/core';
import { formatBytes, getDirectorySize, isToolAvailable, runCommand } from '@stash/core';
import { existsSync } from 'fs';
import { categories } from './categories.js';

/**
 * Get Linux disk info using df.
 */
async function getLinuxDrives(): Promise<DiskInfo[]> {
  const disks: DiskInfo[] = [];

  try {
    const { stdout } = await runCommand('df -k --output=source,fstype,size,used,avail,target');
    const lines = stdout.trim().split('\n').slice(1); // skip header

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 6) continue;

      const source = parts[0];
      const fstype = parts[1];
      const target = parts.slice(5).join(' ');

      // Skip virtual/pseudo filesystems
      if (
        !source.startsWith('/dev/') ||
        fstype === 'tmpfs' ||
        fstype === 'devtmpfs' ||
        fstype === 'squashfs' ||
        target.startsWith('/boot/efi') ||
        target.startsWith('/snap/')
      ) {
        continue;
      }

      const totalBytes = parseInt(parts[2]) * 1024;
      const usedBytes = parseInt(parts[3]) * 1024;
      const freeBytes = parseInt(parts[4]) * 1024;

      if (isNaN(totalBytes) || totalBytes === 0) continue;

      const name = target === '/' ? 'Root' : target.split('/').pop() || target;

      disks.push({
        name,
        mountPoint: target,
        totalBytes,
        usedBytes,
        freeBytes,
        totalHuman: formatBytes(totalBytes),
        usedHuman: formatBytes(usedBytes),
        freeHuman: formatBytes(freeBytes),
        usedPercent: Math.round((usedBytes / totalBytes) * 100),
      });
    }
  } catch {
    // Fallback: basic df
    try {
      const { stdout } = await runCommand('df -k');
      const lines = stdout.trim().split('\n').slice(1);

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 6) continue;

        const source = parts[0];
        const target = parts.slice(5).join(' ');

        if (!source.startsWith('/dev/')) continue;

        const totalBytes = parseInt(parts[1]) * 1024;
        const usedBytes = parseInt(parts[2]) * 1024;
        const freeBytes = parseInt(parts[3]) * 1024;

        if (isNaN(totalBytes) || totalBytes === 0) continue;

        const name = target === '/' ? 'Root' : target.split('/').pop() || target;

        disks.push({
          name,
          mountPoint: target,
          totalBytes,
          usedBytes,
          freeBytes,
          totalHuman: formatBytes(totalBytes),
          usedHuman: formatBytes(usedBytes),
          freeHuman: formatBytes(freeBytes),
          usedPercent: Math.round((usedBytes / totalBytes) * 100),
        });
      }
    } catch {
      // Return empty if both fail
    }
  }

  return disks;
}

export async function getStorageOverview(): Promise<StorageOverview> {
  const disks = await getLinuxDrives();

  // Primary disk is / or the first one
  const primary = disks.find((d) => d.mountPoint === '/') || disks[0];

  return { disks, primary };
}

export async function scanCategory(category: Category): Promise<ScanResult> {
  if (category.detectCommand) {
    const available = await isToolAvailable(category.detectCommand);
    if (!available) {
      return {
        id: category.id,
        name: category.name,
        risk: category.risk,
        description: category.description,
        sizeBytes: 0,
        sizeHuman: '0 B',
        available: false,
      };
    }
  }

  const pathsExist = category.paths.some((p) => existsSync(p));
  if (!pathsExist) {
    return {
      id: category.id,
      name: category.name,
      risk: category.risk,
      description: category.description,
      sizeBytes: 0,
      sizeHuman: '0 B',
      available: false,
    };
  }

  let totalBytes = 0;
  for (const path of category.paths) {
    totalBytes += await getDirectorySize(path);
  }

  return {
    id: category.id,
    name: category.name,
    risk: category.risk,
    description: category.description,
    sizeBytes: totalBytes,
    sizeHuman: formatBytes(totalBytes),
    available: true,
  };
}

export async function scanAll(onProgress?: (name: string) => void): Promise<ScanResult[]> {
  const results: ScanResult[] = [];

  for (const category of categories) {
    if (onProgress) onProgress(category.name);
    const result = await scanCategory(category);
    results.push(result);
  }

  return results.filter((r) => r.available && r.sizeBytes > 0);
}
