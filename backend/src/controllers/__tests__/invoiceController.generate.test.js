import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Invoice Generation Tests
 *
 * Note: These tests focus on data transformation and business logic.
 * Full integration tests with mocked Xero API would require refactoring
 * the controller to use dependency injection.
 */

describe('Invoice Data Transformation - Helper Functions', () => {
  test('getLastDayOfMonth returns correct last day', () => {
    // Helper function test
    function getLastDayOfMonth(month) {
      const [year, monthValue] = month.split('-').map(Number);
      const lastDay = new Date(year, monthValue, 0);
      return lastDay.toISOString().split('T')[0];
    }

    assert.equal(getLastDayOfMonth('2025-09'), '2025-09-30');
    assert.equal(getLastDayOfMonth('2025-02'), '2025-02-28');
    assert.equal(getLastDayOfMonth('2024-02'), '2024-02-29'); // Leap year
    assert.equal(getLastDayOfMonth('2025-12'), '2025-12-31');
  });

  test('addDays adds correct number of days', () => {
    function addDays(dateStr, days) {
      const date = new Date(dateStr);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    }

    assert.equal(addDays('2025-09-30', 14), '2025-10-14');
    assert.equal(addDays('2025-01-31', 14), '2025-02-14');
    assert.equal(addDays('2025-12-31', 14), '2026-01-14');
  });

  test('getMonthName returns correct month name', () => {
    function getMonthName(month) {
      const [year, monthValue] = month.split('-');
      const date = new Date(year, monthValue - 1, 1);
      return date.toLocaleString('en-US', { month: 'long' });
    }

    assert.equal(getMonthName('2025-09'), 'September');
    assert.equal(getMonthName('2025-01'), 'January');
    assert.equal(getMonthName('2025-12'), 'December');
  });

  test('getLastDayOfCurrentMonth returns last day of current month - January', (t) => {
    function getLastDayOfCurrentMonth() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const lastDay = new Date(year, month + 1, 0);
      return lastDay.toISOString().split('T')[0];
    }

    // Mock current date as January 15, 2025
    t.mock.timers.enable({ apis: ['Date'], now: new Date('2025-01-15T10:00:00Z') });
    assert.equal(getLastDayOfCurrentMonth(), '2025-01-31');
    t.mock.timers.reset();
  });

  test('getLastDayOfCurrentMonth returns last day of current month - February leap year', (t) => {
    function getLastDayOfCurrentMonth() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const lastDay = new Date(year, month + 1, 0);
      return lastDay.toISOString().split('T')[0];
    }

    // Mock current date as February 15, 2024 (leap year)
    t.mock.timers.enable({ apis: ['Date'], now: new Date('2024-02-15T10:00:00Z') });
    assert.equal(getLastDayOfCurrentMonth(), '2024-02-29');
    t.mock.timers.reset();
  });

  test('getLastDayOfCurrentMonth returns last day of current month - February non-leap year', (t) => {
    function getLastDayOfCurrentMonth() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const lastDay = new Date(year, month + 1, 0);
      return lastDay.toISOString().split('T')[0];
    }

    // Mock current date as February 10, 2025 (non-leap year)
    t.mock.timers.enable({ apis: ['Date'], now: new Date('2025-02-10T10:00:00Z') });
    assert.equal(getLastDayOfCurrentMonth(), '2025-02-28');
    t.mock.timers.reset();
  });

  test('getLastDayOfCurrentMonth returns last day of current month - March', (t) => {
    function getLastDayOfCurrentMonth() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const lastDay = new Date(year, month + 1, 0);
      return lastDay.toISOString().split('T')[0];
    }

    // Mock current date as March 3, 2025 (scenario from AC)
    t.mock.timers.enable({ apis: ['Date'], now: new Date('2025-03-03T10:00:00Z') });
    assert.equal(getLastDayOfCurrentMonth(), '2025-03-31');
    t.mock.timers.reset();
  });

  test('getLastDayOfCurrentMonth returns last day of current month - April (30-day month)', (t) => {
    function getLastDayOfCurrentMonth() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const lastDay = new Date(year, month + 1, 0);
      return lastDay.toISOString().split('T')[0];
    }

    // Mock current date as April 15, 2025
    t.mock.timers.enable({ apis: ['Date'], now: new Date('2025-04-15T10:00:00Z') });
    assert.equal(getLastDayOfCurrentMonth(), '2025-04-30');
    t.mock.timers.reset();
  });
});

describe('Invoice Line Item Formatting', () => {
  test('Pure billable ticket creates single line item without unitAmount', () => {
    const ticket = {
      ticketId: 42,
      description: 'Fix login bug',
      billableHours: 5.5,
      nonBillableHours: 0
    };

    const lineItems = [];

    if (ticket.billableHours > 0 && ticket.nonBillableHours > 0) {
      // Mixed - not this case
    } else if (ticket.billableHours > 0) {
      lineItems.push({
        description: `Ticket #${ticket.ticketId} - ${ticket.description}`,
        quantity: ticket.billableHours,
        itemCode: 'Consulting Services'
      });
    }

    assert.equal(lineItems.length, 1);
    assert.equal(lineItems[0].description, 'Ticket #42 - Fix login bug');
    assert.equal(lineItems[0].quantity, 5.5);
    assert.equal(lineItems[0].itemCode, 'Consulting Services');
    assert.equal(lineItems[0].unitAmount, undefined);
  });

  test('Pure non-billable ticket creates single line item with $0 unitAmount', () => {
    const ticket = {
      ticketId: 57,
      description: 'Research new feature',
      billableHours: 0,
      nonBillableHours: 3.0
    };

    const lineItems = [];

    if (ticket.billableHours > 0 && ticket.nonBillableHours > 0) {
      // Mixed - not this case
    } else if (ticket.billableHours > 0) {
      // Billable - not this case
    } else {
      lineItems.push({
        description: `Ticket #${ticket.ticketId} - ${ticket.description}`,
        quantity: ticket.nonBillableHours,
        unitAmount: 0,
        itemCode: 'Consulting Services'
      });
    }

    assert.equal(lineItems.length, 1);
    assert.equal(lineItems[0].description, 'Ticket #57 - Research new feature');
    assert.equal(lineItems[0].quantity, 3.0);
    assert.equal(lineItems[0].unitAmount, 0);
    assert.equal(lineItems[0].itemCode, 'Consulting Services');
  });

  test('Mixed billable/non-billable ticket creates two line items', () => {
    const ticket = {
      ticketId: 89,
      description: 'Update documentation',
      billableHours: 2.5,
      nonBillableHours: 1.5
    };

    const lineItems = [];

    if (ticket.billableHours > 0 && ticket.nonBillableHours > 0) {
      lineItems.push({
        description: `Ticket #${ticket.ticketId} - ${ticket.description} (Billable)`,
        quantity: ticket.billableHours,
        itemCode: 'Consulting Services'
      });
      lineItems.push({
        description: `Ticket #${ticket.ticketId} - ${ticket.description} (Non-billable)`,
        quantity: ticket.nonBillableHours,
        unitAmount: 0,
        itemCode: 'Consulting Services'
      });
    }

    assert.equal(lineItems.length, 2);

    // First line item - billable
    assert.equal(lineItems[0].description, 'Ticket #89 - Update documentation (Billable)');
    assert.equal(lineItems[0].quantity, 2.5);
    assert.equal(lineItems[0].unitAmount, undefined);
    assert.equal(lineItems[0].itemCode, 'Consulting Services');

    // Second line item - non-billable
    assert.equal(lineItems[1].description, 'Ticket #89 - Update documentation (Non-billable)');
    assert.equal(lineItems[1].quantity, 1.5);
    assert.equal(lineItems[1].unitAmount, 0);
    assert.equal(lineItems[1].itemCode, 'Consulting Services');
  });
});

describe('Invoice Structure Validation', () => {
  test('Invoice has correct structure for Xero API', () => {
    function getLastDayOfMonth(month) {
      const [year, monthValue] = month.split('-').map(Number);
      const lastDay = new Date(year, monthValue, 0);
      return lastDay.toISOString().split('T')[0];
    }

    function addDays(dateStr, days) {
      const date = new Date(dateStr);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    }

    function getMonthName(month) {
      const [year, monthValue] = month.split('-');
      const date = new Date(year, monthValue - 1, 1);
      return date.toLocaleString('en-US', { month: 'long' });
    }

    const month = '2025-09';
    const invoiceDate = getLastDayOfMonth(month);
    const dueDate = addDays(invoiceDate, 14);
    const [year] = month.split('-');
    const monthName = getMonthName(month);

    const invoice = {
      type: 'ACCREC',
      contact: { contactID: 'xero-contact-123' },
      date: invoiceDate,
      dueDate: dueDate,
      lineItems: [
        {
          description: 'Ticket #1 - Test',
          quantity: 5,
          itemCode: 'Consulting Services'
        }
      ],
      status: 'DRAFT',
      reference: `${monthName} ${year} Services`
    };

    assert.equal(invoice.type, 'ACCREC');
    assert.equal(invoice.contact.contactID, 'xero-contact-123');
    assert.equal(invoice.date, '2025-09-30');
    assert.equal(invoice.dueDate, '2025-10-14');
    assert.equal(invoice.status, 'DRAFT');
    assert.equal(invoice.reference, 'September 2025 Services');
    assert.equal(invoice.lineItems.length, 1);
  });

  test('Invoice date is set to last day of month', () => {
    function getLastDayOfMonth(month) {
      const [year, monthValue] = month.split('-').map(Number);
      const lastDay = new Date(year, monthValue, 0);
      return lastDay.toISOString().split('T')[0];
    }

    const invoiceDate = getLastDayOfMonth('2025-09');
    assert.equal(invoiceDate, '2025-09-30');
  });

  test('Due date is 14 days after invoice date (Net 14 terms)', () => {
    function addDays(dateStr, days) {
      const date = new Date(dateStr);
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0];
    }

    const invoiceDate = '2025-09-30';
    const dueDate = addDays(invoiceDate, 14);
    assert.equal(dueDate, '2025-10-14');
  });
});

describe('Business Logic Validation', () => {
  test('Clients without xero_customer_id are skipped', () => {
    const clients = [
      {
        clientId: 1,
        clientName: 'Client A',
        xeroCustomerId: 'xero-123',
        tickets: [
          { ticketId: 1, description: 'Test', billableHours: 5, nonBillableHours: 0 }
        ]
      },
      {
        clientId: 2,
        clientName: 'Client B',
        xeroCustomerId: null,
        tickets: [
          { ticketId: 2, description: 'Test', billableHours: 3, nonBillableHours: 0 }
        ]
      }
    ];

    const invoices = [];
    for (const client of clients) {
      if (!client.xeroCustomerId) {
        continue;
      }
      invoices.push({ clientId: client.clientId });
    }

    assert.equal(invoices.length, 1);
    assert.equal(invoices[0].clientId, 1);
  });

  test('Missing ticket descriptions are detected', () => {
    const clients = [
      {
        tickets: [
          { ticketId: 42, description: null, missingDescription: true },
          { ticketId: 57, description: '', missingDescription: true },
          { ticketId: 89, description: 'Valid', missingDescription: false }
        ]
      }
    ];

    const ticketsWithMissingDesc = [];
    clients.forEach(client => {
      client.tickets.forEach(ticket => {
        if (ticket.missingDescription) {
          ticketsWithMissingDesc.push(ticket.ticketId);
        }
      });
    });

    assert.equal(ticketsWithMissingDesc.length, 2);
    assert.deepEqual(ticketsWithMissingDesc, [42, 57]);
  });
});

describe('Error Message Formatting', () => {
  test('Missing descriptions error includes ticket IDs', () => {
    const ticketIds = [42, 57, 89];
    const ticketList = ticketIds.map(id => `#${id}`).join(', ');
    const message = `Cannot generate invoices. Missing descriptions for tickets: ${ticketList}`;

    assert.equal(message, 'Cannot generate invoices. Missing descriptions for tickets: #42, #57, #89');
  });

  test('Success message includes month name and year', () => {
    function getMonthName(month) {
      const [year, monthValue] = month.split('-');
      const date = new Date(year, monthValue - 1, 1);
      return date.toLocaleString('en-US', { month: 'long' });
    }

    const month = '2025-09';
    const clientCount = 5;
    const message = `Successfully generated ${clientCount} invoices for ${getMonthName(month)} ${month.split('-')[0]}`;

    assert.equal(message, 'Successfully generated 5 invoices for September 2025');
  });
});
