import { describe, it, expect } from 'vitest';
import { categories } from '../categories.js';

describe('macOS categories', () => {
  it('has 25 categories', () => {
    expect(categories).toHaveLength(25);
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

  it('has the expected risk distribution', () => {
    const safe = categories.filter((c) => c.risk === 'safe');
    const selective = categories.filter((c) => c.risk === 'selective');
    const displayOnly = categories.filter((c) => c.risk === 'display-only');

    expect(safe.length).toBeGreaterThan(0);
    expect(selective.length).toBeGreaterThan(0);
    expect(displayOnly.length).toBeGreaterThan(0);
  });
});
