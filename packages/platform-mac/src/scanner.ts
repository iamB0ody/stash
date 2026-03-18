import type { Category, DiskInfo, ScanResult, StorageOverview } from '@stash/core';
import { formatBytes, getDirectorySize, isToolAvailable, runCommand } from '@stash/core';
import { existsSync } from 'fs';
import { categories } from './categories.js';

/**
 * Parse APFS container info from `diskutil apfs list` output.
 * Returns accurate container-level capacity (not per-volume like `df`).
 */
async function parseAPFSContainers(): Promise<
  { name: string; mountPoint: string; totalBytes: number; usedBytes: number; freeBytes: number }[]
> {
  const { stdout } = await runCommand('diskutil apfs list');
  const containers: {
    name: string;
    mountPoint: string;
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
  }[] = [];

  const containerBlocks = stdout.split(/\+-- Container /);

  for (const block of containerBlocks.slice(1)) {
    const sizeMatch = block.match(/Size \(Capacity Ceiling\):\s+(\d+)\s+B/);
    const usedMatch = block.match(/Capacity In Use By Volumes:\s+(\d+)\s+B/);
    const freeMatch = block.match(/Capacity Not Allocated:\s+(\d+)\s+B/);

    if (!sizeMatch || !usedMatch || !freeMatch) continue;

    const totalBytes = parseInt(sizeMatch[1]);
    const usedBytes = parseInt(usedMatch[1]);
    const freeBytes = parseInt(freeMatch[1]);

    // Find the Data volume name and mount point for this container
    const volumes = block.split(/\+-> Volume /);
    let name = 'Unknown';
    let mountPoint = '/';

    // Look for the Data role volume first, then any mounted volume
    for (const vol of volumes) {
      const roleMatch = vol.match(/Role\):\s+\S+\s+\((\w+)\)/);
      const nameMatch = vol.match(/Name:\s+(.+?)(?:\s+\(|$)/m);
      const mountMatch = vol.match(/Mount Point:\s+(.+)/m);

      if (roleMatch && roleMatch[1] === 'Data' && nameMatch) {
        name = nameMatch[1].trim();
        if (mountMatch && mountMatch[1] !== 'Not Mounted') {
          mountPoint = mountMatch[1].trim();
        }
        break;
      }

      // For non-system containers (external drives), use the first volume
      if (nameMatch && mountMatch && mountMatch[1] !== 'Not Mounted' && name === 'Unknown') {
        name = nameMatch[1].trim();
        mountPoint = mountMatch[1].trim();
      }
    }

    // Skip simulator runtime containers and tiny system containers
    const isSimulator = name.toLowerCase().includes('simulator');
    const isTinySystem = totalBytes < 5_000_000_000 && !mountPoint.startsWith('/Volumes/');

    if (isSimulator || isTinySystem) continue;

    containers.push({ name, mountPoint, totalBytes, usedBytes, freeBytes });
  }

  return containers;
}

/**
 * Fallback: parse non-APFS volumes from `df` (HFS+, ExFAT, FAT32, etc.)
 */
async function parseNonAPFSVolumes(apfsMountPoints: Set<string>): Promise<DiskInfo[]> {
  const { stdout } = await runCommand('df -k');
  const lines = stdout.trim().split('\n').slice(1); // skip header
  const disks: DiskInfo[] = [];

  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length < 9) continue;

    const mountPoint = parts.slice(8).join(' ');

    // Skip system/virtual mounts and APFS volumes we already have
    if (
      mountPoint.startsWith('/System') ||
      mountPoint === '/dev' ||
      mountPoint.startsWith('/private') ||
      apfsMountPoints.has(mountPoint) ||
      mountPoint === '/'
    ) {
      continue;
    }

    // Only include real external/user volumes
    if (!mountPoint.startsWith('/Volumes/')) continue;

    const totalBytes = parseInt(parts[1]) * 1024;
    const usedBytes = parseInt(parts[2]) * 1024;
    const freeBytes = parseInt(parts[3]) * 1024;
    const name = mountPoint.replace('/Volumes/', '');

    disks.push({
      name,
      mountPoint,
      totalBytes,
      usedBytes,
      freeBytes,
      totalHuman: formatBytes(totalBytes),
      usedHuman: formatBytes(usedBytes),
      freeHuman: formatBytes(freeBytes),
      usedPercent: totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0,
    });
  }

  return disks;
}

export async function getStorageOverview(): Promise<StorageOverview> {
  const disks: DiskInfo[] = [];

  // 1. Get APFS containers (accurate numbers)
  const containers = await parseAPFSContainers();
  const apfsMountPoints = new Set<string>();

  for (const c of containers) {
    apfsMountPoints.add(c.mountPoint);

    disks.push({
      name: c.name,
      mountPoint: c.mountPoint,
      totalBytes: c.totalBytes,
      usedBytes: c.usedBytes,
      freeBytes: c.freeBytes,
      totalHuman: formatBytes(c.totalBytes),
      usedHuman: formatBytes(c.usedBytes),
      freeHuman: formatBytes(c.freeBytes),
      usedPercent: c.totalBytes > 0 ? Math.round((c.usedBytes / c.totalBytes) * 100) : 0,
    });
  }

  // 2. Get non-APFS volumes (external drives, USB sticks, etc.)
  const nonApfs = await parseNonAPFSVolumes(apfsMountPoints);
  disks.push(...nonApfs);

  // Primary disk is the one containing root (/)
  const primary =
    disks.find((d) => d.mountPoint === '/' || d.mountPoint === '/System/Volumes/Data') || disks[0];

  return { disks, primary };
}

// ──── Category scanning (unchanged) ────

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
