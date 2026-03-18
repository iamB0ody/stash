import { describe, it, expect } from 'vitest';
import { categories } from '../categories.js';

describe('Windows categories', () => {
  it('has 23 categories', () => {
    expect(categories).toHaveLength(23);
  });

  it('has no duplicate IDs', () => {
    const ids = categories.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every category has required fields', () => {
    for (const cat of categories) {
      expect(cat.id).toBeTruthy();
      expect(cat.name).toBeTruthy();
      expect(cat.description).toBeTruthy();
      expect(['safe', 'selective', 'display-only']).toContain(cat.risk);
      expect(cat.paths.length).toBeGreaterThan(0);
    }
  });

  it('safe categories have a cleanCommand', () => {
    const safe = categories.filter((c) => c.risk === 'safe');
    for (const cat of safe) {
      expect(cat.cleanCommand).toBeTruthy();
    }
  });

  it('display-only categories have no cleanCommand', () => {
    const displayOnly = categories.filter((c) => c.risk === 'display-only');
    for (const cat of displayOnly) {
      expect(cat.cleanCommand).toBeUndefined();
    }
  });

  it('uses Windows-style paths or environment variables', () => {
    for (const cat of categories) {
      for (const p of cat.paths) {
        // Should not contain macOS-specific paths
        expect(p).not.toContain('/Library/');
        expect(p).not.toContain('/.cache/');
      }
    }
  });
});
