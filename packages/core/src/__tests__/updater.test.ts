import { describe, it, expect, vi } from 'vitest';
import { checkForUpdate } from '../updater.js';
import * as child_process from 'child_process';
import * as util from 'util';

vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

vi.mock('util', async () => {
  const actual = await vi.importActual<typeof import('util')>('util');
  return {
    ...actual,
    promisify: vi.fn(() => vi.fn()),
  };
});

describe('checkForUpdate', () => {
  it('returns update info when a newer version is available', async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: '1.0.0\n' });
    vi.mocked(util.promisify).mockReturnValue(mockExec as never);

    // Re-import to pick up the mock
    vi.resetModules();
    const { checkForUpdate: check } = await import('../updater.js');

    const result = await check('0.3.0');
    expect(result).toEqual({
      currentVersion: '0.3.0',
      latestVersion: '1.0.0',
      updateAvailable: true,
    });
  });

  it('returns updateAvailable false when versions match', async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: '0.3.0\n' });
    vi.mocked(util.promisify).mockReturnValue(mockExec as never);

    vi.resetModules();
    const { checkForUpdate: check } = await import('../updater.js');

    const result = await check('0.3.0');
    expect(result).toEqual({
      currentVersion: '0.3.0',
      latestVersion: '0.3.0',
      updateAvailable: false,
    });
  });

  it('returns null when npm command fails', async () => {
    const mockExec = vi.fn().mockRejectedValue(new Error('command not found'));
    vi.mocked(util.promisify).mockReturnValue(mockExec as never);

    vi.resetModules();
    const { checkForUpdate: check } = await import('../updater.js');

    const result = await check('0.3.0');
    expect(result).toBeNull();
  });
});
