import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { platform } from 'os';

const execAsync = promisify(exec);

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(1)} ${units[i]}`;
}

export async function isToolAvailable(detectCommand: string): Promise<boolean> {
  try {
    await execAsync(detectCommand);
    return true;
  } catch {
    return false;
  }
}

export async function getDirectorySize(path: string): Promise<number> {
  if (!existsSync(path)) return 0;
  try {
    if (platform() === 'win32') {
      const { stdout } = await execAsync(
        `powershell -NoProfile -Command "(Get-ChildItem -Recurse -Force -ErrorAction SilentlyContinue '${path.replace(/'/g, "''")}' | Measure-Object -Property Length -Sum).Sum"`,
      );
      const bytes = parseInt(stdout.trim());
      return isNaN(bytes) ? 0 : bytes;
    }
    const { stdout } = await execAsync(`du -sk "${path}" 2>/dev/null`);
    const kb = parseInt(stdout.split('\t')[0]);
    return isNaN(kb) ? 0 : kb * 1024;
  } catch {
    return 0;
  }
}

export async function runCommand(
  command: string,
  timeoutMs = 120_000,
): Promise<{ stdout: string; stderr: string }> {
  const shell = platform() === 'win32' ? 'powershell.exe' : undefined;
  return execAsync(command, { timeout: timeoutMs, shell });
}
