/**
 * Unit Tests for Email Thread Processor Service
 *
 * Tests email selection logic, word/email limits, truncation, and edge cases
 * Note: Uses real sanitizeEmail function for integration testing
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { processEmailThread } from '../emailThreadProcessor.js';

// Test helper: Create test email with specified word count
function createTestEmail(wordCount, from = 'test@example.com', subject = 'Test Email') {
  const words = 'word '.repeat(wordCount).trim();
  return { from, subject, body: words };
}

// Test helper: Create array of test emails
function createTestEmails(count, wordsPerEmail) {
  return Array.from({ length: count }, (_, i) =>
    createTestEmail(wordsPerEmail, `user${i}@example.com`, `Test Email ${i + 1}`)
  );
}

describe('Email Thread Processor', () => {
  describe('Chronological Sorting', () => {
    it('should handle emails already in chronological order', () => {
      const emails = createTestEmails(3, 100);
      const result = processEmailThread(emails);

      assert.strictEqual(result.emailCount, 3);
      assert.strictEqual(result.selectedEmails.length, 3);
      assert.strictEqual(result.truncated, false);
    });

    it('should handle single email', () => {
      const emails = [createTestEmail(100)];
      const result = processEmailThread(emails);

      assert.strictEqual(result.emailCount, 1);
      assert.strictEqual(result.selectedEmails.length, 1);
      assert.strictEqual(result.truncated, false);
    });
  });

  describe('5-Email Limit', () => {
    it('should select all emails when count is 3', () => {
      const emails = createTestEmails(3, 300);
      const result = processEmailThread(emails);

      assert.strictEqual(result.emailCount, 3);
      assert.strictEqual(result.truncated, false);
    });

    it('should select all emails when count is exactly 5', () => {
      const emails = createTestEmails(5, 300);
      const result = processEmailThread(emails);

      assert.strictEqual(result.emailCount, 5);
      assert.strictEqual(result.truncated, false);
    });

    it('should select last 5 emails when count is 7', () => {
      const emails = createTestEmails(7, 300);
      const result = processEmailThread(emails);

      assert.strictEqual(result.emailCount, 5);
      assert.strictEqual(result.truncated, true);
      // Most recent email should be the last one
      assert.strictEqual(result.selectedEmails[result.selectedEmails.length - 1].from, 'user6@example.com');
    });

    it('should select last 5 emails when count is 10', () => {
      const emails = createTestEmails(10, 300);
      const result = processEmailThread(emails);

      assert.strictEqual(result.emailCount, 5);
      assert.strictEqual(result.truncated, true);
      // Most recent email should be the last one
      assert.strictEqual(result.selectedEmails[result.selectedEmails.length - 1].from, 'user9@example.com');
    });

    it('should always include most recent email', () => {
      const emails = createTestEmails(10, 300);
      const result = processEmailThread(emails);

      // Most recent email should always be last in selected emails
      assert.strictEqual(result.selectedEmails[result.selectedEmails.length - 1].from, 'user9@example.com');
    });
  });

  describe('4,000-Word Limit', () => {
    it('should select all emails when total is 2,000 words', () => {
      const emails = [
        createTestEmail(700),
        createTestEmail(600),
        createTestEmail(700)
      ];
      const result = processEmailThread(emails);

      assert.strictEqual(result.emailCount, 3);
      assert(result.wordCount <= 4000);
      assert.strictEqual(result.truncated, false);
    });

    it('should truncate thread when word limit exceeded', () => {
      const emails = [
        createTestEmail(1500, 'user1@example.com'),
        createTestEmail(1500, 'user2@example.com'),
        createTestEmail(2000, 'user3@example.com') // Would exceed 4000
      ];
      const result = processEmailThread(emails);

      // Should select first email + most recent only
      assert.strictEqual(result.emailCount, 2);
      assert(result.wordCount <= 4000);
      assert.strictEqual(result.truncated, true);
      // Verify most recent email is included
      assert.strictEqual(result.selectedEmails[result.selectedEmails.length - 1].from, 'user3@example.com');
    });

    it('should handle thread with 5 emails totaling 5,000 words', () => {
      const emails = createTestEmails(5, 1000); // 5,000 words total
      const result = processEmailThread(emails);

      // Should stop adding emails when word limit reached
      assert(result.emailCount < 5);
      assert(result.wordCount <= 4000);
      assert.strictEqual(result.truncated, true);
    });

    it('should calculate word count accurately', () => {
      const emails = [
        createTestEmail(500),
        createTestEmail(500),
        createTestEmail(500)
      ];
      const result = processEmailThread(emails);

      assert.strictEqual(result.wordCount, 1500);
      assert.strictEqual(result.truncated, false);
    });
  });

  describe('Most Recent Email Always Included (AC6)', () => {
    it('should truncate most recent email if alone it exceeds 5,000 words', () => {
      const emails = [createTestEmail(5000)];
      const result = processEmailThread(emails);

      assert.strictEqual(result.emailCount, 1);
      assert.strictEqual(result.wordCount, 4000); // Truncated to limit
      assert.strictEqual(result.truncated, true);
      assert(result.selectedEmails[0].body.endsWith('...')); // Truncation marker
    });

    it('should include most recent email in full if 3,000 words', () => {
      const emails = [
        createTestEmail(500, 'user0@example.com'),
        createTestEmail(500, 'user1@example.com'),
        createTestEmail(3000, 'user2@example.com') // Most recent
      ];
      const result = processEmailThread(emails);

      // Most recent email is 3000 words, leaving 1000 words for older emails
      // Both older emails (500 + 500 = 1000) fit exactly
      assert.strictEqual(result.emailCount, 3);
      assert.strictEqual(result.wordCount, 4000);
      assert.strictEqual(result.truncated, false);
      // Most recent should be last
      assert.strictEqual(result.selectedEmails[2].from, 'user2@example.com');
    });

    it('should always include most recent email even when other emails present', () => {
      const emails = createTestEmails(10, 500);
      const result = processEmailThread(emails);

      // Verify most recent email is last in selected emails
      const mostRecentSelected = result.selectedEmails[result.selectedEmails.length - 1];
      const mostRecentInput = emails[emails.length - 1];
      assert.strictEqual(mostRecentSelected.from, mostRecentInput.from);
    });
  });

  describe('Email Sanitization Integration', () => {
    it('should sanitize email bodies', () => {
      const emails = [
        {
          from: 'test@example.com',
          subject: 'Test',
          body: 'Email content\n--\nJohn Doe\nCEO'
        }
      ];

      const result = processEmailThread(emails);

      assert.strictEqual(result.emailCount, 1);
      // Sanitizer should remove signature
      assert.strictEqual(result.selectedEmails[0].body, 'Email content');
    });

    it('should handle empty email body after sanitization', () => {
      const emails = [
        {
          from: 'test@example.com',
          subject: 'Test',
          body: '--\nJohn Doe\nCEO' // Only signature, no content
        }
      ];

      const result = processEmailThread(emails);

      assert.strictEqual(result.emailCount, 1);
      assert.strictEqual(result.wordCount, 0);
      assert.strictEqual(result.selectedEmails[0].body, '');
    });

    it('should handle emails with quoted replies', () => {
      const emails = [
        {
          from: 'test@example.com',
          subject: 'Test',
          body: 'New content\n> Quoted reply\n> More quoted'
        }
      ];

      const result = processEmailThread(emails);

      assert.strictEqual(result.emailCount, 1);
      // Sanitizer should remove quoted replies
      assert.strictEqual(result.selectedEmails[0].body, 'New content');
    });
  });

  describe('Word Counting', () => {
    it('should count "Hello world" as 2 words', () => {
      const emails = [{ from: 'test@example.com', subject: 'Test', body: 'Hello world' }];
      const result = processEmailThread(emails);

      assert.strictEqual(result.wordCount, 2);
    });

    it('should handle multiple spaces correctly', () => {
      const emails = [{ from: 'test@example.com', subject: 'Test', body: 'Hello   world  test' }];
      const result = processEmailThread(emails);

      assert.strictEqual(result.wordCount, 3);
    });

    it('should count empty string as 0 words', () => {
      const emails = [{ from: 'test@example.com', subject: 'Test', body: '' }];
      const result = processEmailThread(emails);

      assert.strictEqual(result.wordCount, 0);
    });

    it('should count whitespace-only string as 0 words', () => {
      const emails = [{ from: 'test@example.com', subject: 'Test', body: '   \n\t  ' }];
      const result = processEmailThread(emails);

      assert.strictEqual(result.wordCount, 0);
    });
  });

  describe('Truncated Flag', () => {
    it('should set truncated: false for 3 emails, 1,000 words total', () => {
      const emails = createTestEmails(3, 333);
      const result = processEmailThread(emails);

      assert.strictEqual(result.truncated, false);
    });

    it('should set truncated: false for 5 emails, 3,500 words total', () => {
      const emails = createTestEmails(5, 700);
      const result = processEmailThread(emails);

      assert.strictEqual(result.truncated, false);
    });

    it('should set truncated: true for 7 emails (email limit)', () => {
      const emails = createTestEmails(7, 300);
      const result = processEmailThread(emails);

      assert.strictEqual(result.truncated, true);
      assert.strictEqual(result.emailCount, 5); // Limited to 5
    });

    it('should set truncated: true for 3 emails, 4,500 words total (word limit)', () => {
      const emails = [
        createTestEmail(1500),
        createTestEmail(1500),
        createTestEmail(1500)
      ];
      const result = processEmailThread(emails);

      assert.strictEqual(result.truncated, true);
      assert(result.wordCount <= 4000);
    });
  });

  describe('Length Classification', () => {
    it('should classify 100 words as "short"', () => {
      const emails = [createTestEmail(100)];
      const result = processEmailThread(emails);

      assert.strictEqual(result.lengthClass, 'short');
    });

    it('should classify 500 words as "medium"', () => {
      const emails = [createTestEmail(500)];
      const result = processEmailThread(emails);

      assert.strictEqual(result.lengthClass, 'medium');
    });

    it('should classify 2000 words as "long"', () => {
      const emails = [createTestEmail(2000)];
      const result = processEmailThread(emails);

      assert.strictEqual(result.lengthClass, 'long');
    });

    it('should classify 199 words as "short" (boundary)', () => {
      const emails = [createTestEmail(199)];
      const result = processEmailThread(emails);

      assert.strictEqual(result.lengthClass, 'short');
    });

    it('should classify 200 words as "medium" (boundary)', () => {
      const emails = [createTestEmail(200)];
      const result = processEmailThread(emails);

      assert.strictEqual(result.lengthClass, 'medium');
    });

    it('should classify 1001 words as "long" (boundary)', () => {
      const emails = [createTestEmail(1001)];
      const result = processEmailThread(emails);

      assert.strictEqual(result.lengthClass, 'long');
    });
  });

  describe('Edge Cases', () => {
    it('should throw error for empty thread', () => {
      assert.throws(
        () => processEmailThread([]),
        /Email thread is empty/
      );
    });

    it('should throw error for null input', () => {
      assert.throws(
        () => processEmailThread(null),
        /Email thread is empty/
      );
    });

    it('should throw error for undefined input', () => {
      assert.throws(
        () => processEmailThread(undefined),
        /Email thread is empty/
      );
    });

    it('should handle all emails with empty bodies', () => {
      const emails = [
        { from: 'user1@example.com', subject: 'Test 1', body: '--\nSignature only' },
        { from: 'user2@example.com', subject: 'Test 2', body: '___\nAnother signature' },
        { from: 'user3@example.com', subject: 'Test 3', body: 'Sent from my iPhone' }
      ];

      const result = processEmailThread(emails);

      assert.strictEqual(result.emailCount, 3);
      assert.strictEqual(result.wordCount, 0);
      assert.strictEqual(result.lengthClass, 'short');
    });

    it('should handle email with null body', () => {
      const emails = [{ from: 'test@example.com', subject: 'Test', body: null }];
      const result = processEmailThread(emails);

      assert.strictEqual(result.emailCount, 1);
      assert.strictEqual(result.wordCount, 0);
    });

    it('should handle malformed email object (null subject)', () => {
      const emails = [{ from: 'test@example.com', subject: null, body: 'Test content' }];
      const result = processEmailThread(emails);

      assert.strictEqual(result.emailCount, 1);
      assert.strictEqual(result.selectedEmails[0].subject, '');
      assert.strictEqual(result.wordCount, 2);
    });

    it('should handle malformed email object (missing from)', () => {
      const emails = [{ subject: 'Test', body: 'Test content' }];
      const result = processEmailThread(emails);

      assert.strictEqual(result.emailCount, 1);
      assert.strictEqual(result.selectedEmails[0].from, '');
      assert.strictEqual(result.wordCount, 2);
    });
  });

  describe('Performance', () => {
    it('should process 10 emails in under 100ms', () => {
      const emails = createTestEmails(10, 500);

      const startTime = performance.now();
      const result = processEmailThread(emails);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      assert.strictEqual(result.emailCount, 5); // Limited to 5
      assert(processingTime < 100, `Processing took ${processingTime}ms, expected <100ms`);
    });

    it('should process 5 emails with 800 words each in under 100ms', () => {
      const emails = createTestEmails(5, 800);

      const startTime = performance.now();
      const result = processEmailThread(emails);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      assert(result.wordCount <= 4000);
      assert(processingTime < 100, `Processing took ${processingTime}ms, expected <100ms`);
    });
  });
});
