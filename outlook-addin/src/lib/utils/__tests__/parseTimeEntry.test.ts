import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseTimeEntry } from '../parseTimeEntry.ts';

describe('parseTimeEntry', () => {
  describe('Hour formats (AC 2)', () => {
    it('should parse "2h" as 2.0 hours', () => {
      const result = parseTimeEntry('2h');
      assert.deepStrictEqual(result, { success: true, hours: 2.0 });
    });

    it('should parse "2" as 2.0 hours', () => {
      const result = parseTimeEntry('2');
      assert.deepStrictEqual(result, { success: true, hours: 2.0 });
    });

    it('should parse "2.5h" as 2.5 hours', () => {
      const result = parseTimeEntry('2.5h');
      assert.deepStrictEqual(result, { success: true, hours: 2.5 });
    });

    it('should parse "2.5" as 2.5 hours', () => {
      const result = parseTimeEntry('2.5');
      assert.deepStrictEqual(result, { success: true, hours: 2.5 });
    });

    it('should parse "0h" as 0 hours', () => {
      const result = parseTimeEntry('0h');
      assert.deepStrictEqual(result, { success: true, hours: 0 });
    });

    it('should parse "0.5h" as 0.5 hours', () => {
      const result = parseTimeEntry('0.5h');
      assert.deepStrictEqual(result, { success: true, hours: 0.5 });
    });
  });

  describe('Minute formats (AC 3)', () => {
    it('should parse "45m" as 0.75 hours', () => {
      const result = parseTimeEntry('45m');
      assert.deepStrictEqual(result, { success: true, hours: 0.75 });
    });

    it('should parse "90m" as 1.5 hours', () => {
      const result = parseTimeEntry('90m');
      assert.deepStrictEqual(result, { success: true, hours: 1.5 });
    });

    it('should parse "2m" as approximately 0.0333 hours', () => {
      const result = parseTimeEntry('2m');
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.ok(Math.abs(result.hours - 0.0333) < 0.001);
      }
    });

    it('should parse "60m" as 1.0 hours', () => {
      const result = parseTimeEntry('60m');
      assert.deepStrictEqual(result, { success: true, hours: 1.0 });
    });

    it('should parse "30m" as 0.5 hours', () => {
      const result = parseTimeEntry('30m');
      assert.deepStrictEqual(result, { success: true, hours: 0.5 });
    });
  });

  describe('Combined format (AC 4)', () => {
    it('should parse "1h30m" as 1.5 hours', () => {
      const result = parseTimeEntry('1h30m');
      assert.deepStrictEqual(result, { success: true, hours: 1.5 });
    });

    it('should parse "0h15m" as 0.25 hours', () => {
      const result = parseTimeEntry('0h15m');
      assert.deepStrictEqual(result, { success: true, hours: 0.25 });
    });

    it('should parse "2h45m" as 2.75 hours', () => {
      const result = parseTimeEntry('2h45m');
      assert.deepStrictEqual(result, { success: true, hours: 2.75 });
    });

    it('should parse "0h0m" as 0 hours', () => {
      const result = parseTimeEntry('0h0m');
      assert.deepStrictEqual(result, { success: true, hours: 0 });
    });
  });

  describe('Validation errors', () => {
    it('should reject empty string', () => {
      const result = parseTimeEntry('');
      assert.deepStrictEqual(result, {
        success: false,
        error: 'Time entry cannot be empty'
      });
    });

    it('should reject whitespace-only string', () => {
      const result = parseTimeEntry('   ');
      assert.deepStrictEqual(result, {
        success: false,
        error: 'Time entry cannot be empty'
      });
    });

    it('should reject invalid format "abc"', () => {
      const result = parseTimeEntry('abc');
      assert.deepStrictEqual(result, {
        success: false,
        error: "Invalid time format. Use formats like '2h', '90m', or '1h30m'"
      });
    });

    it('should reject invalid format "1h2h"', () => {
      const result = parseTimeEntry('1h2h');
      assert.deepStrictEqual(result, {
        success: false,
        error: "Invalid time format. Use formats like '2h', '90m', or '1h30m'"
      });
    });

    it('should reject exceeding 24 hours in hour format', () => {
      const result = parseTimeEntry('25h');
      assert.deepStrictEqual(result, {
        success: false,
        error: 'Time entry cannot exceed 24 hours'
      });
    });

    it('should reject exceeding 24 hours in minute format', () => {
      const result = parseTimeEntry('1500m');
      assert.deepStrictEqual(result, {
        success: false,
        error: 'Time entry cannot exceed 24 hours'
      });
    });

    it('should reject exceeding 24 hours in combined format', () => {
      const result = parseTimeEntry('24h1m');
      assert.deepStrictEqual(result, {
        success: false,
        error: 'Time entry cannot exceed 24 hours'
      });
    });

    it('should accept exactly 24 hours', () => {
      const result = parseTimeEntry('24h');
      assert.deepStrictEqual(result, { success: true, hours: 24 });
    });

    it('should accept exactly 24 hours in minutes', () => {
      const result = parseTimeEntry('1440m');
      assert.deepStrictEqual(result, { success: true, hours: 24 });
    });
  });

  describe('Whitespace handling', () => {
    it('should trim leading whitespace', () => {
      const result = parseTimeEntry('  2h');
      assert.deepStrictEqual(result, { success: true, hours: 2 });
    });

    it('should trim trailing whitespace', () => {
      const result = parseTimeEntry('2h  ');
      assert.deepStrictEqual(result, { success: true, hours: 2 });
    });

    it('should trim both leading and trailing whitespace', () => {
      const result = parseTimeEntry('  2h  ');
      assert.deepStrictEqual(result, { success: true, hours: 2 });
    });
  });
});
