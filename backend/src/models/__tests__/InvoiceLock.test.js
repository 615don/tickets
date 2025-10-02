import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { InvoiceLock } from '../InvoiceLock.js';
import { query } from '../../config/database.js';

describe('InvoiceLock Model - Unit Tests', () => {
  // Clean up test data before and after tests
  before(async () => {
    await query("DELETE FROM invoice_locks WHERE month >= '2025-01-01'");
  });

  after(async () => {
    await query("DELETE FROM invoice_locks WHERE month >= '2025-01-01'");
  });

  describe('create()', () => {
    it('should create a lock for a month in YYYY-MM format', async () => {
      const lock = await InvoiceLock.create('2025-09', ['INV-001', 'INV-002']);

      assert.ok(lock.id, 'Lock should have an ID');
      const monthStr = lock.month.toISOString().substring(0, 10);
      assert.strictEqual(monthStr, '2025-09-01');
      assert.ok(lock.locked_at);

      // JSONB is returned as an object, not a string
      assert.deepStrictEqual(lock.xero_invoice_ids, ['INV-001', 'INV-002']);
    });

    it('should create a lock for a month in YYYY-MM-DD format', async () => {
      const lock = await InvoiceLock.create('2025-10-15', ['INV-003']);

      const monthStr = lock.month.toISOString().substring(0, 10);
      assert.strictEqual(monthStr, '2025-10-01');

      // JSONB is returned as an object, not a string
      assert.deepStrictEqual(lock.xero_invoice_ids, ['INV-003']);
    });

    it('should create a lock with empty invoice IDs array by default', async () => {
      const lock = await InvoiceLock.create('2025-11');

      const monthStr = lock.month.toISOString().substring(0, 10);
      assert.strictEqual(monthStr, '2025-11-01');

      // JSONB is returned as an object, not a string
      assert.deepStrictEqual(lock.xero_invoice_ids, []);
    });

    it('should fail with duplicate month (UNIQUE constraint)', async () => {
      await InvoiceLock.create('2025-12', ['INV-004']);

      await assert.rejects(
        async () => {
          await InvoiceLock.create('2025-12', ['INV-005']);
        },
        (error) => {
          // PostgreSQL unique violation error code
          return error.code === '23505';
        }
      );
    });

    it('should reject invalid month format', async () => {
      await assert.rejects(
        async () => {
          await InvoiceLock.create('invalid-date');
        },
        { message: 'Invalid month format. Expected YYYY-MM or YYYY-MM-DD' }
      );
    });
  });

  describe('isMonthLocked()', () => {
    it('should return true for locked month', async () => {
      await InvoiceLock.create('2025-08', ['INV-006']);

      const isLocked = await InvoiceLock.isMonthLocked('2025-08');
      assert.strictEqual(isLocked, true);
    });

    it('should return false for unlocked month', async () => {
      const isLocked = await InvoiceLock.isMonthLocked('2026-01');
      assert.strictEqual(isLocked, false);
    });

    it('should work with YYYY-MM-DD format', async () => {
      await InvoiceLock.create('2025-07', []);

      const isLocked = await InvoiceLock.isMonthLocked('2025-07-25');
      assert.strictEqual(isLocked, true);
    });
  });

  describe('getByMonth()', () => {
    it('should return lock record for locked month', async () => {
      await InvoiceLock.create('2025-06', ['INV-007', 'INV-008']);

      const lock = await InvoiceLock.getByMonth('2025-06');

      assert.ok(lock);
      const monthStr = lock.month.toISOString().substring(0, 10);
      assert.strictEqual(monthStr, '2025-06-01');

      // JSONB is returned as an object, not a string
      assert.deepStrictEqual(lock.xero_invoice_ids, ['INV-007', 'INV-008']);
    });

    it('should return null for unlocked month', async () => {
      const lock = await InvoiceLock.getByMonth('2026-02');
      assert.strictEqual(lock, null);
    });
  });

  describe('getAll()', () => {
    it('should return all invoice locks ordered by month DESC', async () => {
      // Clean up first
      await query("DELETE FROM invoice_locks WHERE month >= '2025-01-01'");

      // Create locks
      await InvoiceLock.create('2025-03', ['INV-A']);
      await InvoiceLock.create('2025-01', ['INV-B']);
      await InvoiceLock.create('2025-05', ['INV-C']);

      const locks = await InvoiceLock.getAll();

      assert.ok(Array.isArray(locks));
      assert.ok(locks.length >= 3);

      // Check ordering (DESC by month)
      const testLocks = locks.filter(l => {
        const monthStr = l.month.toISOString().substring(0, 7);
        return monthStr.startsWith('2025');
      });
      assert.strictEqual(testLocks[0].month.toISOString().substring(0, 10), '2025-05-01');
      assert.strictEqual(testLocks[1].month.toISOString().substring(0, 10), '2025-03-01');
      assert.strictEqual(testLocks[2].month.toISOString().substring(0, 10), '2025-01-01');
    });
  });

  describe('Month boundary edge cases', () => {
    it('should treat last day of month same as first day for lock check', async () => {
      await InvoiceLock.create('2025-04', []);

      const isLockedFirstDay = await InvoiceLock.isMonthLocked('2025-04-01');
      const isLockedLastDay = await InvoiceLock.isMonthLocked('2025-04-30');

      assert.strictEqual(isLockedFirstDay, true);
      assert.strictEqual(isLockedLastDay, true);
    });

    it('should not lock adjacent months', async () => {
      // Use a unique month for this test
      await InvoiceLock.create('2026-06', []);

      const isMonthBeforeLocked = await InvoiceLock.isMonthLocked('2026-05-31');
      const isMonthAfterLocked = await InvoiceLock.isMonthLocked('2026-07-01');

      assert.strictEqual(isMonthBeforeLocked, false);
      assert.strictEqual(isMonthAfterLocked, false);
    });
  });
});
