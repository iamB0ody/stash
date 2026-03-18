import { exec } from 'child_process';
import { promisify } from 'util';
import type { UpdateInfo } from './types.js';

const execAsync = promisify(exec);

export async function checkForUpdate(currentVersion: string): Promise<UpdateInfo | null> {
  try {
    const { stdout } = await execAsync('npm view stashitnow version', { timeout: 5000 });
    const latestVersion = stdout.trim();
    return {
      currentVersion,
      latestVersion,
      updateAvailable: latestVersion !== currentVersion,
    };
  } catch {
    return null;
  }
}
