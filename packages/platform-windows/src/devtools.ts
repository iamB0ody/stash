import type { CleanResult, DevToolItem } from '@stash/core';
import { formatBytes, getDirectorySize, runCommand } from '@stash/core';
import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const HOME = homedir();
const LOCALAPPDATA = process.env.LOCALAPPDATA || join(HOME, 'AppData', 'Local');

// ──── Android SDK ────

export function listAndroidSDKVersions(): DevToolItem[] {
  const sdkPath = join(LOCALAPPDATA, 'Android', 'Sdk', 'platforms');
  if (!existsSync(sdkPath)) return [];

  const items: DevToolItem[] = [];
  for (const dir of readdirSync(sdkPath)) {
    const fullPath = join(sdkPath, dir);
    try {
      const stdout = execSync(
        `powershell -NoProfile -Command "(Get-ChildItem -Recurse -Force -ErrorAction SilentlyContinue '${fullPath.replace(/'/g, "''")}' | Measure-Object -Property Length -Sum).Sum"`,
        { encoding: 'utf-8' },
      );
      const sizeBytes = parseInt(stdout.trim()) || 0;
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
      await runCommand(
        `powershell -NoProfile -Command "Remove-Item -Recurse -Force '${path.replace(/'/g, "''")}'"`,
      );
      results.push({ id: path, name: path, success: true, freedBytes: 0, freedHuman: '0 B' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        id: path,
        name: path,
        success: false,
        freedBytes: 0,
        freedHuman: '0 B',
        error: message,
      });
    }
  }
  return results;
}

// ──── Android Emulators ────

export async function listAVDs(): Promise<DevToolItem[]> {
  const avdPath = join(HOME, '.android', 'avd');
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
  const avdPath = join(HOME, '.android', 'avd');
  const results: CleanResult[] = [];

  for (const avdName of avdNames) {
    try {
      await runCommand(`avdmanager delete avd -n "${avdName}"`);
      results.push({ id: avdName, name: avdName, success: true, freedBytes: 0, freedHuman: '0 B' });
    } catch {
      try {
        const avdDir = join(avdPath, avdName + '.avd').replace(/'/g, "''");
        const avdIni = join(avdPath, avdName + '.ini').replace(/'/g, "''");
        await runCommand(
          `powershell -NoProfile -Command "Remove-Item -Recurse -Force '${avdDir}', '${avdIni}'"`,
        );
        results.push({
          id: avdName,
          name: avdName,
          success: true,
          freedBytes: 0,
          freedHuman: '0 B',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({
          id: avdName,
          name: avdName,
          success: false,
          freedBytes: 0,
          freedHuman: '0 B',
          error: message,
        });
      }
    }
  }
  return results;
}
