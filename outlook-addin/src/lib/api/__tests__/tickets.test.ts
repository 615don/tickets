import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { createTicket, CreateTicketPayload } from '../tickets.js';

describe('createTicket API', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should create ticket with existing contact', async () => {
    const mockTicketResponse = {
      id: 123,
      clientId: 5,
      contactId: 42,
      description: "Email support",
      notes: "Helped with email configuration",
      state: "open",
      createdAt: "2025-10-11T12:00:00Z",
      updatedAt: "2025-10-11T12:00:00Z",
    };

    const mockClosedTicketResponse = {
      ...mockTicketResponse,
      state: "closed",
    };

    global.fetch = mock.fn(async (url: string) => {
      // Mock CSRF token endpoint
      if (url.includes('/api/csrf-token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'mock-csrf-token' }),
        } as Response;
      }
      // Mock ticket creation
      if (url.includes('/api/tickets') && !url.match(/\/api\/tickets\/\d+/)) {
        return {
          ok: true,
          status: 201,
          json: async () => mockTicketResponse,
        } as Response;
      }
      // Mock ticket update (for closed state)
      if (url.match(/\/api\/tickets\/\d+/)) {
        return {
          ok: true,
          status: 200,
          json: async () => mockClosedTicketResponse,
        } as Response;
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      } as Response;
    }) as typeof global.fetch;

    const payload: CreateTicketPayload = {
      clientId: 5,
      contactId: 42,
      description: "Email support",
      notes: "Helped with email configuration",
      state: "closed",
      timeEntry: {
        workDate: "2025-10-11",
        duration: 0.5,
        billable: true,
      },
    };

    const result = await createTicket(payload);

    assert.strictEqual(result.id, 123);
    assert.strictEqual(result.contactId, 42);
    assert.strictEqual(result.state, "closed");
    assert.strictEqual(global.fetch.mock.calls.length, 3); // GET csrf-token + POST ticket + PUT state

    // Verify CSRF token was fetched
    const [csrfUrl] = global.fetch.mock.calls[0].arguments;
    assert.ok(csrfUrl.includes('/api/csrf-token'));

    // Verify ticket creation
    const [ticketUrl, ticketOptions] = global.fetch.mock.calls[1].arguments;
    assert.ok(ticketUrl.includes('/api/tickets'));
    assert.strictEqual(ticketOptions.method, 'POST');
    assert.strictEqual(ticketOptions.credentials, 'include');

    // Verify CSRF token included in headers
    assert.ok(ticketOptions.headers['X-CSRF-Token']);
  });

  it('should create ticket with new contact', async () => {
    const mockContactResponse = {
      id: 99,
      clientId: 5,
      name: "Jane Doe",
      email: "jane.doe@acme.com",
      isSystemContact: false,
      createdAt: "2025-10-11T12:00:00Z",
      updatedAt: "2025-10-11T12:00:00Z",
    };

    const mockTicketResponse = {
      id: 124,
      clientId: 5,
      contactId: 99,
      description: "Email support",
      notes: "New contact from email",
      state: "open",
      createdAt: "2025-10-11T12:00:00Z",
      updatedAt: "2025-10-11T12:00:00Z",
    };

    global.fetch = mock.fn(async (url: string) => {
      // Mock CSRF token endpoint
      if (url.includes('/api/csrf-token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'mock-csrf-token' }),
        } as Response;
      }
      // Mock contact creation
      if (url.includes('/api/contacts')) {
        return {
          ok: true,
          status: 201,
          json: async () => mockContactResponse,
        } as Response;
      }
      // Mock ticket creation
      return {
        ok: true,
        status: 201,
        json: async () => mockTicketResponse,
      } as Response;
    }) as typeof global.fetch;

    const payload: CreateTicketPayload = {
      clientId: 5,
      contactId: 0, // Signal new contact creation
      description: "Email support",
      notes: "New contact from email",
      state: "open",
      timeEntry: {
        workDate: "2025-10-11",
        duration: 0.5,
        billable: true,
      },
      newContact: {
        name: "Jane Doe",
        email: "jane.doe@acme.com",
        clientId: 5,
      },
    };

    const result = await createTicket(payload);

    assert.strictEqual(result.id, 124);
    assert.strictEqual(result.contactId, 99); // New contact ID from backend
    assert.strictEqual(global.fetch.mock.calls.length, 2); // POST contact + POST ticket

    const [contactUrl, contactOptions] = global.fetch.mock.calls[0].arguments;
    assert.ok(contactUrl.includes('/api/contacts'));
    const contactBody = JSON.parse(contactOptions.body);
    assert.strictEqual(contactBody.name, "Jane Doe");
  });

  it('should throw authentication error on 401', async () => {
    global.fetch = mock.fn(async (url: string) => {
      // Mock CSRF token endpoint success
      if (url.includes('/api/csrf-token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'mock-csrf-token' }),
        } as Response;
      }
      // Mock 401 on ticket creation
      return {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Session expired' }),
      } as Response;
    }) as typeof global.fetch;

    const payload: CreateTicketPayload = {
      clientId: 5,
      contactId: 42,
      description: "Test",
      notes: "",
      state: "open",
      timeEntry: {
        workDate: "2025-10-11",
        duration: 0.5,
        billable: true,
      },
    };

    await assert.rejects(
      async () => await createTicket(payload),
      {
        message: /Authentication required/,
      }
    );
  });

  it('should throw network error on fetch failure', async () => {
    global.fetch = mock.fn(async (url: string) => {
      // Mock CSRF token endpoint success
      if (url.includes('/api/csrf-token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'mock-csrf-token' }),
        } as Response;
      }
      // Throw network error on ticket creation
      throw new TypeError('Failed to fetch');
    }) as typeof global.fetch;

    const payload: CreateTicketPayload = {
      clientId: 5,
      contactId: 42,
      description: "Test",
      notes: "",
      state: "open",
      timeEntry: {
        workDate: "2025-10-11",
        duration: 0.5,
        billable: true,
      },
    };

    await assert.rejects(
      async () => await createTicket(payload),
      {
        message: /Network error/,
      }
    );
  });

  it('should throw validation error on 400', async () => {
    global.fetch = mock.fn(async (url: string) => {
      // Mock CSRF token endpoint success
      if (url.includes('/api/csrf-token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ csrfToken: 'mock-csrf-token' }),
        } as Response;
      }
      // Mock 400 validation error on ticket creation
      return {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Client ID is required' }),
      } as Response;
    }) as typeof global.fetch;

    const payload: CreateTicketPayload = {
      clientId: 0, // Invalid client ID
      contactId: 42,
      description: "Test",
      notes: "",
      state: "open",
      timeEntry: {
        workDate: "2025-10-11",
        duration: 0.5,
        billable: true,
      },
    };

    await assert.rejects(
      async () => await createTicket(payload),
      {
        message: /Client ID is required/,
      }
    );
  });
});
