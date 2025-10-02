import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateRequired,
  validateTypes,
  validateEnum,
  validateNumericParams
} from '../validation.js';

describe('Validation Middleware', () => {
  describe('validateRequired', () => {
    it('should pass when all required fields are present', () => {
      const req = { body: { clientId: 1, contactId: 2 } };
      const res = {};
      let nextCalled = false;
      const next = () => { nextCalled = true; };
      
      const middleware = validateRequired(['clientId', 'contactId']);
      middleware(req, res, next);
      
      assert.strictEqual(nextCalled, true);
    });
    
    it('should handle nested fields', () => {
      const req = { body: { timeEntry: { duration: '2h' } } };
      const res = {};
      let nextCalled = false;
      const next = () => { nextCalled = true; };
      
      const middleware = validateRequired(['timeEntry.duration']);
      middleware(req, res, next);
      
      assert.strictEqual(nextCalled, true);
    });
  });
  
  describe('validateTypes', () => {
    it('should pass when types match', () => {
      const req = { body: { clientId: 1, description: 'Test' } };
      const res = {};
      let nextCalled = false;
      const next = () => { nextCalled = true; };
      
      const middleware = validateTypes({ clientId: 'number', description: 'string' });
      middleware(req, res, next);
      
      assert.strictEqual(nextCalled, true);
    });
  });
  
  describe('validateEnum', () => {
    it('should pass when value is in allowed list', () => {
      const req = { query: { state: 'open' }, body: {} };
      const res = {};
      let nextCalled = false;
      const next = () => { nextCalled = true; };
      
      const middleware = validateEnum('state', ['open', 'closed']);
      middleware(req, res, next);
      
      assert.strictEqual(nextCalled, true);
    });
  });
  
  describe('validateNumericParams', () => {
    it('should pass when params are positive integers', () => {
      const req = { params: { id: '123' } };
      const res = {};
      let nextCalled = false;
      const next = () => { nextCalled = true; };
      
      const middleware = validateNumericParams(['id']);
      middleware(req, res, next);
      
      assert.strictEqual(nextCalled, true);
    });
  });
});
