import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir, platform } from 'os';
import { join } from 'path';
import type { ActionLogEntry } from './types.js';

function getLogDir(): string {
  const home = homedir();
  if (platform() === 'win32') {
    const appData = process.env.APPDATA || join(home, 'AppData', 'Roaming');
    return join(appData, 'stashit');
  }
  return join(home, '.stashit');
}

function getLogPath(): string {
  return join(getLogDir(), 'history.json');
}

function ensureLogDir(): void {
  const dir = getLogDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function logAction(entry: Omit<ActionLogEntry, 'timestamp'>): void {
  ensureLogDir();
  const logPath = getLogPath();

  const history = getHistory();
  history.unshift({ ...entry, timestamp: new Date().toISOString() });

  // Keep last 500 entries
  const trimmed = history.slice(0, 500);
  writeFileSync(logPath, JSON.stringify(trimmed, null, 2), 'utf-8');
}

export function getHistory(limit = 500): ActionLogEntry[] {
  const logPath = getLogPath();
  if (!existsSync(logPath)) return [];

  try {
    const raw = readFileSync(logPath, 'utf-8');
    const entries: ActionLogEntry[] = JSON.parse(raw);
    return entries.slice(0, limit);
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  const logPath = getLogPath();
  if (existsSync(logPath)) {
    writeFileSync(logPath, '[]', 'utf-8');
  }
}
