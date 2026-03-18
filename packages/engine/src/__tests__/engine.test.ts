import { describe, it, expect, vi } from 'vitest';
import * as os from 'os';

vi.mock('os', async () => {
  const actual = await vi.importActual<typeof import('os')>('os');
  return {
    ...actual,
    platform: vi.fn(),
  };
});

describe('detectPlatform', () => {
  it('returns MacPlatform on darwin', async () => {
    vi.mocked(os.platform).mockReturnValue('darwin');
    vi.resetModules();

    const { detectPlatform } = await import('../index.js');
    const platform = await detectPlatform();

    expect(platform.name).toBe('macOS');
    expect(platform.id).toBe('mac');
  });

  it('throws on unsupported platform', async () => {
    vi.mocked(os.platform).mockReturnValue('freebsd' as NodeJS.Platform);
    vi.resetModules();

    const { detectPlatform } = await import('../index.js');

    await expect(detectPlatform()).rejects.toThrow('Unsupported platform');
  });
});

describe('createEngine', () => {
  it('returns a platform instance', async () => {
    vi.mocked(os.platform).mockReturnValue('darwin');
    vi.resetModules();

    const { createEngine } = await import('../index.js');
    const engine = await createEngine();

    expect(engine).toBeDefined();
    expect(typeof engine.getCategories).toBe('function');
    expect(typeof engine.scanAll).toBe('function');
    expect(typeof engine.cleanItem).toBe('function');
  });
});
