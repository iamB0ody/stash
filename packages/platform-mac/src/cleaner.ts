import type { CleanResult } from '@stash/core';
import { formatBytes, runCommand } from '@stash/core';
import { categories } from './categories.js';
import { scanCategory } from './scanner.js';

export async function cleanItem(id: string): Promise<CleanResult> {
  const category = categories.find((c) => c.id === id);
  if (!category) {
    return {
      id,
      name: id,
      success: false,
      freedBytes: 0,
      freedHuman: '0 B',
      error: 'Category not found',
    };
  }

  if (!category.cleanCommand) {
    return {
      id,
      name: category.name,
      success: false,
      freedBytes: 0,
      freedHuman: '0 B',
      error: 'No clean command available (use selective cleanup)',
    };
  }

  const before = await scanCategory(category);

  try {
    await runCommand(category.cleanCommand);
    const after = await scanCategory(category);
    const freedBytes = Math.max(0, before.sizeBytes - after.sizeBytes);

    return {
      id,
      name: category.name,
      success: true,
      freedBytes,
      freedHuman: formatBytes(freedBytes),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      id,
      name: category.name,
      success: false,
      freedBytes: 0,
      freedHuman: '0 B',
      error: message,
    };
  }
}

export async function cleanAllSafe(): Promise<CleanResult[]> {
  const safeCategories = categories.filter((c) => c.risk === 'safe' && c.cleanCommand);
  const results: CleanResult[] = [];

  for (const category of safeCategories) {
    const scan = await scanCategory(category);
    if (!scan.available || scan.sizeBytes === 0) continue;
    const result = await cleanItem(category.id);
    results.push(result);
  }

  return results;
}
