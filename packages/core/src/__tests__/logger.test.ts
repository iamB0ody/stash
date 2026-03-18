import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logAction, getHistory, clearHistory } from '../logger.js';
import * as fs from 'fs';
import * as os from 'os';

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
});

const mockExistsSync = vi.mocked(fs.existsSync);
const mockMkdirSync = vi.mocked(fs.mkdirSync);
const mockReadFileSync = vi.mocked(fs.readFileSync);
const mockWriteFileSync = vi.mocked(fs.writeFileSync);

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHistory', () => {
    it('returns empty array when log file does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      expect(getHistory()).toEqual([]);
    });

    it('returns parsed entries from log file', () => {
      const entries = [
        {
          timestamp: '2025-01-01T00:00:00.000Z',
          action: 'clean',
          categoryId: 'npm',
          categoryName: 'npm Cache',
          freedBytes: 1024,
          freedHuman: '1.0 KB',
          success: true,
          platform: 'mac',
        },
      ];
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(entries));
      expect(getHistory()).toEqual(entries);
    });

    it('returns empty array on parse error', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('invalid json');
      expect(getHistory()).toEqual([]);
    });

    it('respects limit parameter', () => {
      const entries = Array.from({ length: 10 }, (_, i) => ({
        timestamp: `2025-01-0${i + 1}T00:00:00.000Z`,
        action: 'clean',
        categoryId: 'npm',
        categoryName: 'npm Cache',
        freedBytes: 1024,
        freedHuman: '1.0 KB',
        success: true,
        platform: 'mac',
      }));
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify(entries));
      expect(getHistory(3)).toHaveLength(3);
    });
  });

  describe('logAction', () => {
    it('creates log directory if it does not exist', () => {
      mockExistsSync.mockReturnValueOnce(false).mockReturnValueOnce(false);
      mockReadFileSync.mockReturnValue('[]');

      logAction({
        action: 'clean',
        categoryId: 'npm',
        categoryName: 'npm Cache',
        freedBytes: 1024,
        freedHuman: '1.0 KB',
        success: true,
        platform: 'mac',
      });

      expect(mockMkdirSync).toHaveBeenCalled();
      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it('prepends new entry to history', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('[]');

      logAction({
        action: 'clean',
        categoryId: 'npm',
        categoryName: 'npm Cache',
        freedBytes: 2048,
        freedHuman: '2.0 KB',
        success: true,
        platform: 'mac',
      });

      const written = JSON.parse(mockWriteFileSync.mock.calls[0][1] as string);
      expect(written).toHaveLength(1);
      expect(written[0].categoryId).toBe('npm');
      expect(written[0].timestamp).toBeDefined();
    });
  });

  describe('clearHistory', () => {
    it('writes empty array to log file', () => {
      mockExistsSync.mockReturnValue(true);
      clearHistory();
      expect(mockWriteFileSync).toHaveBeenCalledWith(expect.any(String), '[]', 'utf-8');
    });

    it('does nothing if log file does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      clearHistory();
      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });
  });
});
