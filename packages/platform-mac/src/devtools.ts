import type { CleanResult, DevToolItem } from '@stash/core';
import { formatBytes, getDirectorySize, runCommand } from '@stash/core';
import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const HOME = homedir();

// ──── iOS Simulators ────

export async function listSimulators(): Promise<DevToolItem[]> {
  try {
    const { stdout } = await runCommand('xcrun simctl list devices -j');
    const data = JSON.parse(stdout);
    const items: DevToolItem[] = [];

    for (const [runtime, devices] of Object.entries(data.devices) as [string, any[]][]) {
      for (const device of devices) {
        const runtimeName = runtime
          .replace('com.apple.CoreSimulator.SimRuntime.', '')
          .replace(/-/g, ' ');
        const dataPath = device.dataPath || '';
        let sizeBytes = 0;

        if (dataPath && existsSync(dataPath)) {
          sizeBytes = await getDirectorySize(dataPath);
        }

        items.push({
          name: `${device.name} (${runtimeName}) — ${device.state}`,
          id: device.udid,
          size: formatBytes(sizeBytes),
          sizeBytes,
        });
      }
    }

    return items.sort((a, b) => b.sizeBytes - a.sizeBytes);
  } catch {
    return [];
  }
}

export async function deleteSimulators(udids: string[]): Promise<CleanResult[]> {
  const results: CleanResult[] = [];
  for (const udid of udids) {
    try {
      await runCommand(`xcrun simctl delete "${udid}"`);
      results.push({ id: udid, name: udid, success: true, freedBytes: 0, freedHuman: '0 B' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ id: udid, name: udid, success: false, freedBytes: 0, freedHuman: '0 B', error: message });
    }
  }
  return results;
}

// ──── Android SDK ────

export function listAndroidSDKVersions(): DevToolItem[] {
  const sdkPath = join(HOME, 'Library/Android/sdk/platforms');
  if (!existsSync(sdkPath)) return [];

  const items: DevToolItem[] = [];
  for (const dir of readdirSync(sdkPath)) {
    const fullPath = join(sdkPath, dir);
    try {
      const stdout = execSync(`du -sk "${fullPath}" 2>/dev/null`, { encoding: 'utf-8' });
      const sizeBytes = parseInt(stdout.split('\t')[0]) * 1024;
      items.push({ name: dir, id: fullPath, size: formatBytes(sizeBytes), sizeBytes });
    } catch {
      items.push({ name: dir, id: fullPath, size: 'unknown', sizeBytes: 0 });
    }
  }

  return items.sort((a, b) => b.sizeBytes - a.sizeBytes);
}

export async function deleteAndroidSDKVersions(paths: string[]): Promise<CleanResult[]> {
  const results: CleanResult[] = [];
  for (const path of paths) {
    try {
      await runCommand(`rm -rf "${path}"`);
      results.push({ id: path, name: path, success: true, freedBytes: 0, freedHuman: '0 B' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ id: path, name: path, success: false, freedBytes: 0, freedHuman: '0 B', error: message });
    }
  }
  return results;
}

// ──── Android Emulators ────

export async function listAVDs(): Promise<DevToolItem[]> {
  const avdPath = join(HOME, '.android/avd');
  if (!existsSync(avdPath)) return [];

  const items: DevToolItem[] = [];
  for (const entry of readdirSync(avdPath)) {
    if (!entry.endsWith('.avd')) continue;
    const fullPath = join(avdPath, entry);
    const sizeBytes = await getDirectorySize(fullPath);
    items.push({
      name: entry.replace('.avd', ''),
      id: entry.replace('.avd', ''),
      size: formatBytes(sizeBytes),
      sizeBytes,
    });
  }

  return items.sort((a, b) => b.sizeBytes - a.sizeBytes);
}

export async function deleteAVDs(avdNames: string[]): Promise<CleanResult[]> {
  const avdPath = join(HOME, '.android/avd');
  const results: CleanResult[] = [];

  for (const avdName of avdNames) {
    try {
      await runCommand(`avdmanager delete avd -n "${avdName}"`);
      results.push({ id: avdName, name: avdName, success: true, freedBytes: 0, freedHuman: '0 B' });
    } catch {
      try {
        await runCommand(
          `rm -rf "${join(avdPath, avdName + '.avd')}" "${join(avdPath, avdName + '.ini')}"`,
        );
        results.push({ id: avdName, name: avdName, success: true, freedBytes: 0, freedHuman: '0 B' });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({ id: avdName, name: avdName, success: false, freedBytes: 0, freedHuman: '0 B', error: message });
      }
    }
  }
  return results;
}
