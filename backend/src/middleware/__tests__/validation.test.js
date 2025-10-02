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
      const req = {
        body: {
          clientId: 1,
          contactId: 2,
          description: 'Test'
        }
      };
      const res = {};
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      const middleware = validateRequired(['clientId', 'contactId']);
      middleware(req, res, next);

      assert.strictEqual(nextCalled, true);
    });

    it('should fail when required fields are missing', () => {
      const req = {
        body: {
          clientId: 1
        }
      };
      const res = {
        status: (code) => {
          assert.strictEqual(code, 400);
          return {
            json: (body) => {
              assert.strictEqual(body.error, 'ValidationError');
              assert.ok(body.message.includes('contactId'));
            }
          };
        }
      };
      const next = () => {
        assert.fail('next should not be called');
      };

      const middleware = validateRequired(['clientId', 'contactId']);
      middleware(req, res, next);
    });

    it('should handle nested fields', () => {
      const req = {
        body: {
          timeEntry: {
            duration: '2h'
          }
        }
      };
      const res = {};
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      const middleware = validateRequired(['timeEntry.duration']);
      middleware(req, res, next);

      assert.strictEqual(nextCalled, true);
    });

    it('should fail when nested fields are missing', () => {
      const req = {
        body: {
          timeEntry: {}
        }
      };
      const res = {
        status: (code) => {
          assert.strictEqual(code, 400);
          return {
            json: (body) => {
              assert.strictEqual(body.error, 'ValidationError');
              assert.ok(body.message.includes('timeEntry.duration'));
            }
          };
        }
      };
      const next = () => {
        assert.fail('next should not be called');
      };

      const middleware = validateRequired(['timeEntry.duration']);
      middleware(req, res, next);
    });
  });

  describe('validateTypes', () => {
    it('should pass when types match', () => {
      const req = {
        body: {
          clientId: 1,
          description: 'Test',
          billable: true
        }
      };
      const res = {};
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      const middleware = validateTypes({
        clientId: 'number',
        description: 'string',
        billable: 'boolean'
      });
      middleware(req, res, next);

      assert.strictEqual(nextCalled, true);
    });

    it('should fail when types do not match', () => {
      const req = {
        body: {
          clientId: '1' // Should be number
        }
      };
      const res = {
        status: (code) => {
          assert.strictEqual(code, 400);
          return {
            json: (body) => {
              assert.strictEqual(body.error, 'ValidationError');
              assert.ok(body.message.includes('clientId'));
              assert.ok(body.message.includes('number'));
            }
          };
        }
      };
      const next = () => {
        assert.fail('next should not be called');
      };

      const middleware = validateTypes({ clientId: 'number' });
      middleware(req, res, next);
    });

    it('should validate integer type', () => {
      const req = {
        body: {
          clientId: 1.5 // Not an integer
        }
      };
      const res = {
        status: (code) => {
          assert.strictEqual(code, 400);
          return {
            json: (body) => {
              assert.strictEqual(body.error, 'ValidationError');
              assert.ok(body.message.includes('integer'));
            }
          };
        }
      };
      const next = () => {
        assert.fail('next should not be called');
      };

      const middleware = validateTypes({ clientId: 'integer' });
      middleware(req, res, next);
    });

    it('should validate array type', () => {
      const req = {
        body: {
          domains: ['test.com', 'example.com']
        }
      };
      const res = {};
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      const middleware = validateTypes({ domains: 'array' });
      middleware(req, res, next);

      assert.strictEqual(nextCalled, true);
    });
  });

  describe('validateEnum', () => {
    it('should pass when value is in allowed list', () => {
      const req = {
        query: {
          state: 'open'
        },
        body: {}
      };
      const res = {};
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      const middleware = validateEnum('state', ['open', 'closed']);
      middleware(req, res, next);

      assert.strictEqual(nextCalled, true);
    });

    it('should fail when value is not in allowed list', () => {
      const req = {
        query: {
          state: 'pending'
        },
        body: {}
      };
      const res = {
        status: (code) => {
          assert.strictEqual(code, 400);
          return {
            json: (body) => {
              assert.strictEqual(body.error, 'ValidationError');
              assert.ok(body.message.includes('open, closed'));
            }
          };
        }
      };
      const next = () => {
        assert.fail('next should not be called');
      };

      const middleware = validateEnum('state', ['open', 'closed']);
      middleware(req, res, next);
    });

    it('should pass when value is not present', () => {
      const req = {
        query: {},
        body: {}
      };
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
      const req = {
        params: {
          id: '123'
        }
      };
      const res = {};
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      const middleware = validateNumericParams(['id']);
      middleware(req, res, next);

      assert.strictEqual(nextCalled, true);
    });

    it('should fail when params are not positive integers', () => {
      const req = {
        params: {
          id: 'abc'
        }
      };
      const res = {
        status: (code) => {
          assert.strictEqual(code, 400);
          return {
            json: (body) => {
              assert.strictEqual(body.error, 'ValidationError');
              assert.ok(body.message.includes('positive integer'));
            }
          };
        }
      };
      const next = () => {
        assert.fail('next should not be called');
      };

      const middleware = validateNumericParams(['id']);
      middleware(req, res, next);
    });

    it('should fail when params are negative', () => {
      const req = {
        params: {
          id: '-5'
        }
      };
      const res = {
        status: (code) => {
          assert.strictEqual(code, 400);
          return {
            json: (body) => {
              assert.strictEqual(body.error, 'ValidationError');
              assert.ok(body.message.includes('positive integer'));
            }
          };
        }
      };
      const next = () => {
        assert.fail('next should not be called');
      };

      const middleware = validateNumericParams(['id']);
      middleware(req, res, next);
    });
  });
});
