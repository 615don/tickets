import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { extractDomain } from '../domainExtractor.ts';

describe('extractDomain', () => {
  it('should extract domain from standard email', () => {
    const result = extractDomain('john@acme.com');
    assert.equal(result, 'acme.com');
  });

  it('should normalize uppercase email to lowercase domain', () => {
    const result = extractDomain('JOHN@ACME.COM');
    assert.equal(result, 'acme.com');
  });

  it('should return null for email without @ symbol', () => {
    const result = extractDomain('johnacme.com');
    assert.equal(result, null);
  });

  it('should return null for email with multiple @ symbols', () => {
    const result = extractDomain('john@@acme.com');
    assert.equal(result, null);
  });

  it('should return null for empty string', () => {
    const result = extractDomain('');
    assert.equal(result, null);
  });

  it('should trim whitespace and extract domain correctly', () => {
    const result = extractDomain('  john@acme.com  ');
    assert.equal(result, 'acme.com');
  });

  it('should return null for email with @ but no domain', () => {
    const result = extractDomain('john@');
    assert.equal(result, null);
  });

  it('should return null for non-string input', () => {
    // @ts-expect-error Testing invalid input
    const result = extractDomain(null);
    assert.equal(result, null);
  });
});
