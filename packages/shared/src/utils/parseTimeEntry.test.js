import { describe, test, expect } from 'vitest';
import { parseTimeEntry } from './parseTimeEntry.js';

describe('parseTimeEntry', () => {
  describe('Hour formats', () => {
    test('parses "2h" as 2.0 hours', () => {
      const result = parseTimeEntry('2h');
      expect(result.success).toBe(true);
      expect(result.hours).toBe(2.0);
    });

    test('parses "2" as 2.0 hours', () => {
      const result = parseTimeEntry('2');
      expect(result.success).toBe(true);
      expect(result.hours).toBe(2.0);
    });

    test('parses "2.5h" as 2.5 hours', () => {
      const result = parseTimeEntry('2.5h');
      expect(result.success).toBe(true);
      expect(result.hours).toBe(2.5);
    });

    test('parses "2.5" as 2.5 hours', () => {
      const result = parseTimeEntry('2.5');
      expect(result.success).toBe(true);
      expect(result.hours).toBe(2.5);
    });
  });

  describe('Minute formats', () => {
    test('parses "45m" as 0.75 hours', () => {
      const result = parseTimeEntry('45m');
      expect(result.success).toBe(true);
      expect(result.hours).toBe(0.75);
    });

    test('parses "90m" as 1.5 hours', () => {
      const result = parseTimeEntry('90m');
      expect(result.success).toBe(true);
      expect(result.hours).toBe(1.5);
    });

    test('parses "30m" as 0.5 hours', () => {
      const result = parseTimeEntry('30m');
      expect(result.success).toBe(true);
      expect(result.hours).toBe(0.5);
    });
  });

  describe('Combined formats', () => {
    test('parses "1h30m" as 1.5 hours', () => {
      const result = parseTimeEntry('1h30m');
      expect(result.success).toBe(true);
      expect(result.hours).toBe(1.5);
    });

    test('parses "2h15m" as 2.25 hours', () => {
      const result = parseTimeEntry('2h15m');
      expect(result.success).toBe(true);
      expect(result.hours).toBe(2.25);
    });

    test('parses "0h45m" as 0.75 hours', () => {
      const result = parseTimeEntry('0h45m');
      expect(result.success).toBe(true);
      expect(result.hours).toBe(0.75);
    });
  });

  describe('Edge cases', () => {
    test('parses "0" as 0.0 hours', () => {
      const result = parseTimeEntry('0');
      expect(result.success).toBe(true);
      expect(result.hours).toBe(0.0);
    });

    test('parses "0.25" as 0.25 hours', () => {
      const result = parseTimeEntry('0.25');
      expect(result.success).toBe(true);
      expect(result.hours).toBe(0.25);
    });

    test('parses "24h" as 24.0 hours', () => {
      const result = parseTimeEntry('24h');
      expect(result.success).toBe(true);
      expect(result.hours).toBe(24.0);
    });
  });

  describe('Validation', () => {
    test('rejects non-numeric strings', () => {
      const result = parseTimeEntry('abc');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid time format');
    });

    test('rejects negative values', () => {
      const result = parseTimeEntry('-5');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid time format');
    });

    test('rejects values > 24 hours', () => {
      const result = parseTimeEntry('25h');
      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot exceed 24 hours');
    });

    test('rejects empty strings', () => {
      const result = parseTimeEntry('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    test('rejects whitespace strings', () => {
      const result = parseTimeEntry('  ');
      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });
  });

  describe('Decimal precision', () => {
    test('45m exactly equals 0.75', () => {
      const result = parseTimeEntry('45m');
      expect(result.success).toBe(true);
      expect(result.hours).toBe(0.75);
      expect(result.hours).not.toBe(0.7499999);
    });

    test('15m exactly equals 0.25', () => {
      const result = parseTimeEntry('15m');
      expect(result.success).toBe(true);
      expect(result.hours).toBe(0.25);
    });
  });
});
