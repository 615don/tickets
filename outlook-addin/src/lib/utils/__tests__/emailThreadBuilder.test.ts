/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { buildEmailThread } from '../emailThreadBuilder.ts';

describe('buildEmailThread', () => {
  let mockOffice: any;

  beforeEach(() => {
    // Mock Office.js global
    (global as any).Office = {
      CoercionType: {
        Text: 'text',
      },
      AsyncResultStatus: {
        Succeeded: 0,
        Failed: 1,
      },
    };
    mockOffice = (global as any).Office;
  });

  it('should extract email properties and return single-element array', async () => {
    const mockMailItem = {
      from: {
        emailAddress: 'john.smith@acme.com',
      },
      subject: 'Website down - urgent',
      body: {
        getAsync: (type: any, callback: any) => {
          callback({
            status: mockOffice.AsyncResultStatus.Succeeded,
            value: 'Our website has been showing 503 errors for the past hour...',
          });
        },
      },
      itemType: 1, // Office.MailboxEnums.ItemType.Message
    } as any;

    const result = await buildEmailThread(mockMailItem);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].from, 'john.smith@acme.com');
    assert.strictEqual(result[0].subject, 'Website down - urgent');
    assert.strictEqual(result[0].body.includes('503 errors'), true);
  });

  it('should use sender.emailAddress as fallback when from is missing', async () => {
    const mockMailItem = {
      from: undefined,
      sender: {
        emailAddress: 'jane.doe@example.com',
      },
      subject: 'Test',
      body: {
        getAsync: (type: any, callback: any) => {
          callback({
            status: mockOffice.AsyncResultStatus.Succeeded,
            value: 'Test body',
          });
        },
      },
    } as any;

    const result = await buildEmailThread(mockMailItem);

    assert.strictEqual(result[0].from, 'jane.doe@example.com');
  });

  it('should use "unknown" when both from and sender are missing', async () => {
    const mockMailItem = {
      from: undefined,
      sender: undefined,
      subject: 'Test',
      body: {
        getAsync: (type: any, callback: any) => {
          callback({
            status: mockOffice.AsyncResultStatus.Succeeded,
            value: 'Test body',
          });
        },
      },
    } as any;

    const result = await buildEmailThread(mockMailItem);

    assert.strictEqual(result[0].from, 'unknown');
  });

  it('should use "(no subject)" when subject is missing', async () => {
    const mockMailItem = {
      from: {
        emailAddress: 'test@test.com',
      },
      subject: undefined,
      body: {
        getAsync: (type: any, callback: any) => {
          callback({
            status: mockOffice.AsyncResultStatus.Succeeded,
            value: 'Test body',
          });
        },
      },
    } as any;

    const result = await buildEmailThread(mockMailItem);

    assert.strictEqual(result[0].subject, '(no subject)');
  });

  it('should return empty string for body when Office.js getAsync fails', async () => {
    const mockMailItem = {
      from: {
        emailAddress: 'test@test.com',
      },
      subject: 'Test',
      body: {
        getAsync: (type: any, callback: any) => {
          callback({
            status: mockOffice.AsyncResultStatus.Failed,
            error: {
              code: 9999,
              message: 'Failed to get body',
            },
          });
        },
      },
    } as any;

    const result = await buildEmailThread(mockMailItem);

    // Should gracefully handle error and return empty body
    assert.strictEqual(result[0].from, 'test@test.com');
    assert.strictEqual(result[0].subject, 'Test');
    assert.strictEqual(result[0].body, '');
  });

  it('should handle exception in getAsync gracefully', async () => {
    const mockMailItem = {
      from: {
        emailAddress: 'test@test.com',
      },
      subject: 'Test',
      body: {
        getAsync: (type: any, callback: any) => {
          throw new Error('Office.js API unavailable');
        },
      },
    } as any;

    const result = await buildEmailThread(mockMailItem);

    // Should gracefully handle exception and return empty body
    assert.strictEqual(result[0].from, 'test@test.com');
    assert.strictEqual(result[0].subject, 'Test');
    assert.strictEqual(result[0].body, '');
  });

  it('should extract all fields correctly for complete email', async () => {
    const mockMailItem = {
      from: {
        emailAddress: 'support@client.com',
      },
      subject: 'Database connection issue',
      body: {
        getAsync: (type: any, callback: any) => {
          callback({
            status: mockOffice.AsyncResultStatus.Succeeded,
            value: 'We are experiencing intermittent database connection timeouts in production environment.',
          });
        },
      },
    } as any;

    const result = await buildEmailThread(mockMailItem);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].from, 'support@client.com');
    assert.strictEqual(result[0].subject, 'Database connection issue');
    assert.strictEqual(result[0].body.includes('database connection timeouts'), true);
  });

  it('should call Office.js getAsync with Text coercion type', async () => {
    let capturedType: any;
    const mockMailItem = {
      from: {
        emailAddress: 'test@test.com',
      },
      subject: 'Test',
      body: {
        getAsync: (type: any, callback: any) => {
          capturedType = type;
          callback({
            status: mockOffice.AsyncResultStatus.Succeeded,
            value: 'Body text',
          });
        },
      },
    } as any;

    await buildEmailThread(mockMailItem);

    assert.strictEqual(capturedType, mockOffice.CoercionType.Text);
  });
});
