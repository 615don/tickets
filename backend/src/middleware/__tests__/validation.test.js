import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateRequired,
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
      let statusCode;
      let responseBody;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (body) => {
              responseBody = body;
            }
          };
        }
      };
      const next = () => {
        assert.fail('next should not be called');
      };

      const middleware = validateRequired(['clientId', 'contactId']);
      middleware(req, res, next);

      assert.strictEqual(statusCode, 400);
      assert.ok(responseBody.errors);
      assert.strictEqual(responseBody.errors.length, 1);
      assert.strictEqual(responseBody.errors[0].field, 'contactId');
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
      let statusCode;
      let responseBody;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (body) => {
              responseBody = body;
            }
          };
        }
      };
      const next = () => {
        assert.fail('next should not be called');
      };

      const middleware = validateRequired(['timeEntry.duration']);
      middleware(req, res, next);

      assert.strictEqual(statusCode, 400);
      assert.ok(responseBody.errors);
      assert.strictEqual(responseBody.errors.length, 1);
      assert.strictEqual(responseBody.errors[0].field, 'timeEntry.duration');
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
      let statusCode;
      let responseBody;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (body) => {
              responseBody = body;
            }
          };
        }
      };
      const next = () => {
        assert.fail('next should not be called');
      };

      const middleware = validateEnum('state', ['open', 'closed']);
      middleware(req, res, next);

      assert.strictEqual(statusCode, 400);
      assert.ok(responseBody.errors);
      assert.ok(responseBody.errors[0].message.includes('open, closed'));
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

    it('should fail when params are not integers', () => {
      const req = {
        params: {
          id: 'abc'
        }
      };
      let statusCode;
      let responseBody;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (body) => {
              responseBody = body;
            }
          };
        }
      };
      const next = () => {
        assert.fail('next should not be called');
      };

      const middleware = validateNumericParams(['id']);
      middleware(req, res, next);

      assert.strictEqual(statusCode, 400);
      assert.ok(responseBody.errors);
      assert.ok(responseBody.errors[0].message.includes('integer'));
    });

    it('should fail when params are negative', () => {
      const req = {
        params: {
          id: '-5'
        }
      };
      const res = {};
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      const middleware = validateNumericParams(['id']);
      middleware(req, res, next);

      assert.strictEqual(nextCalled, true); // -5 is a valid integer
    });

    it('should fail when params are floats', () => {
      const req = {
        params: {
          id: '1.5'
        }
      };
      let statusCode;
      let responseBody;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (body) => {
              responseBody = body;
            }
          };
        }
      };
      const next = () => {
        assert.fail('next should not be called');
      };

      const middleware = validateNumericParams(['id']);
      middleware(req, res, next);

      assert.strictEqual(statusCode, 400);
      assert.ok(responseBody.errors);
      assert.ok(responseBody.errors[0].message.includes('integer'));
    });
  });
});
