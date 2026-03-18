import type { Category, DiskInfo, ScanResult, StorageOverview } from '@stash/core';
import { formatBytes, getDirectorySize, isToolAvailable, runCommand } from '@stash/core';
import { existsSync } from 'fs';
import { categories } from './categories.js';

/**
 * Get Windows disk info using PowerShell Get-PSDrive.
 */
async function getWindowsDrives(): Promise<DiskInfo[]> {
  const disks: DiskInfo[] = [];

  try {
    const { stdout } = await runCommand(
      'powershell -NoProfile -Command "Get-CimInstance Win32_LogicalDisk -Filter \'DriveType=3\' | Select-Object DeviceID, VolumeName, Size, FreeSpace | ConvertTo-Json"',
    );

    const parsed = JSON.parse(stdout);
    const drives = Array.isArray(parsed) ? parsed : [parsed];

    for (const drive of drives) {
      if (!drive.Size) continue;

      const totalBytes = Number(drive.Size);
      const freeBytes = Number(drive.FreeSpace);
      const usedBytes = totalBytes - freeBytes;
      const name = drive.VolumeName || drive.DeviceID;
      const mountPoint = drive.DeviceID + '\\';

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
  } catch {
    // Fallback: try wmic
    try {
      const { stdout } = await runCommand(
        'wmic logicaldisk where "DriveType=3" get DeviceID,VolumeName,Size,FreeSpace /format:csv',
      );

      const lines = stdout
        .trim()
        .split('\n')
        .filter((l) => l.trim());
      // Skip header
      for (const line of lines.slice(1)) {
        const parts = line.trim().split(',');
        if (parts.length < 5) continue;

        const deviceId = parts[1];
        const freeBytes = parseInt(parts[2]);
        const totalBytes = parseInt(parts[3]);
        const volumeName = parts[4] || deviceId;

        if (isNaN(totalBytes) || totalBytes === 0) continue;

        const usedBytes = totalBytes - freeBytes;
        disks.push({
          name: volumeName,
          mountPoint: deviceId + '\\',
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
  const disks = await getWindowsDrives();

  // Primary disk is C:\ or the first one
  const primary = disks.find((d) => d.mountPoint.toUpperCase().startsWith('C:')) || disks[0];

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
