import { describe, test, expect } from 'vitest';
import { extractDomain } from './extractDomain.js';

describe('extractDomain', () => {
  describe('Standard email formats', () => {
    test('extracts domain from standard email', () => {
      expect(extractDomain('user@example.com')).toBe('example.com');
    });

    test('handles subdomain emails', () => {
      expect(extractDomain('user@mail.example.com')).toBe('mail.example.com');
    });

    test('handles multi-level subdomains', () => {
      expect(extractDomain('user@secure.mail.example.com')).toBe('secure.mail.example.com');
    });
  });

  describe('Case handling', () => {
    test('converts uppercase domain to lowercase', () => {
      expect(extractDomain('USER@EXAMPLE.COM')).toBe('example.com');
    });

    test('converts mixed case domain to lowercase', () => {
      expect(extractDomain('User@Example.Com')).toBe('example.com');
    });

    test('preserves lowercase domain', () => {
      expect(extractDomain('user@example.com')).toBe('example.com');
    });
  });

  describe('Whitespace handling', () => {
    test('trims leading whitespace', () => {
      expect(extractDomain('  user@example.com')).toBe('example.com');
    });

    test('trims trailing whitespace', () => {
      expect(extractDomain('user@example.com  ')).toBe('example.com');
    });

    test('trims leading and trailing whitespace', () => {
      expect(extractDomain('  user@example.com  ')).toBe('example.com');
    });
  });

  describe('Invalid email formats', () => {
    test('returns null for email without @ symbol', () => {
      expect(extractDomain('notanemail')).toBe(null);
    });

    test('returns null for empty string', () => {
      expect(extractDomain('')).toBe(null);
    });

    test('returns null for multiple @ symbols', () => {
      expect(extractDomain('user@@example.com')).toBe(null);
    });

    test('trims spaces in domain part', () => {
      expect(extractDomain('user @ example.com')).toBe('example.com');
    });

    test('returns null for only @ symbol', () => {
      expect(extractDomain('@')).toBe(null);
    });

    test('returns null for @ at end (empty domain)', () => {
      expect(extractDomain('user@')).toBe(null);
    });

    test('returns null for @ with only whitespace domain', () => {
      expect(extractDomain('user@   ')).toBe(null);
    });

    test('returns null for @ at beginning (empty local part)', () => {
      expect(extractDomain('@example.com')).toBe('example.com');
    });

    test('returns null for whitespace-only string', () => {
      expect(extractDomain('   ')).toBe(null);
    });
  });

  describe('Edge cases', () => {
    test('handles numeric domains', () => {
      expect(extractDomain('user@123.456.789.0')).toBe('123.456.789.0');
    });

    test('handles hyphenated domains', () => {
      expect(extractDomain('user@my-company.com')).toBe('my-company.com');
    });

    test('handles single-character domain parts', () => {
      expect(extractDomain('user@a.b.c')).toBe('a.b.c');
    });

    test('handles long domain names', () => {
      expect(extractDomain('user@very-long-subdomain-name.example.com')).toBe('very-long-subdomain-name.example.com');
    });
  });
});
