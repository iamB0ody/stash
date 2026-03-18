import { describe, it, expect, vi } from 'vitest';
import { formatBytes } from '../utils.js';

describe('formatBytes', () => {
  it('returns "0 B" for zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes correctly', () => {
    expect(formatBytes(500)).toBe('500.0 B');
  });

  it('formats kilobytes correctly', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('formats megabytes correctly', () => {
    expect(formatBytes(1048576)).toBe('1.0 MB');
    expect(formatBytes(5242880)).toBe('5.0 MB');
  });

  it('formats gigabytes correctly', () => {
    expect(formatBytes(1073741824)).toBe('1.0 GB');
    expect(formatBytes(2684354560)).toBe('2.5 GB');
  });

  it('formats terabytes correctly', () => {
    expect(formatBytes(1099511627776)).toBe('1.0 TB');
  });
});
