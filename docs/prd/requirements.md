# Requirements

## Functional Requirements

**FR1:** System shall support creating tickets with only three required fields at creation time: Client, Contact, and Time Entry.

**FR2:** System shall allow tickets to have optional Description and Notes fields that can be populated at creation or added/edited later before ticket closure.

**FR3:** System shall require a Description field to be populated before a ticket can be included in invoice generation, prompting the user to add descriptions to any tickets lacking them during the pre-invoice review process.

**FR4:** System shall support ticket states of Open and Closed, with ability to re-open closed tickets within 7 days of closure.

**FR5:** System shall maintain a Client database with fields for company name, one or more email domains (for auto-detection), Xero customer ID, and maintenance contract type.

**FR6:** System shall maintain a Contact database with fields for name and email address, with each contact associated with exactly one Client.

**FR7:** System shall support multiple time entries per ticket, each with a work date, duration, and billable/non-billable flag.

**FR8:** System shall allow users to add, edit, or delete time entries for any ticket until the associated month's invoice has been pushed to Xero (invoice lock).

**FR9:** System shall accept time input in flexible formats including hours ("2h", "2"), minutes ("45m", "45"), and decimal hours ("1.5h", "1.5").

**FR10:** System shall provide an Open Tickets view displaying all currently open tickets.

**FR11:** System shall provide a Recently Closed Tickets view displaying tickets closed within the last 7 days.

**FR12:** System shall provide search capability for historical closed tickets.

**FR13:** System shall support manual invoice generation for a specified month that pushes invoices to Xero via API integration.

**FR14:** System shall format Xero invoices with per-ticket line items using format "Ticket #[ID] - [Description]".

**FR15:** System shall include non-billable tickets as $0 line items in Xero invoices.

**FR16:** System shall display a pre-invoice review screen showing total billable hours, per-client breakdown, and any tickets missing descriptions before allowing invoice push to Xero.

**FR17:** System shall lock all time entries for a month after successful Xero invoice push to prevent accidental modification.

**FR18:** System shall support basic authentication with username and password for single-user access.

**FR19:** System shall allow deletion of contacts with automatic reassignment of their tickets to a system-generated "Deleted Contact" record per client, preserving ticket history.

**FR20:** System shall allow deletion of clients with cascade deletion of all related data (contacts, tickets, time entries), but prevent deletion if invoices have been generated for that client.

## Non-Functional Requirements

**NFR1:** Ticket creation form submission shall complete in under 500ms under normal operating conditions.

**NFR2:** Page load times shall not exceed 2 seconds for any view in the system.

**NFR3:** Search and filter operations shall return results in under 1 second.

**NFR4:** System shall use HTTPS for all client-server communication.

**NFR5:** System shall securely store Xero API credentials (OAuth tokens) using industry-standard encryption.

**NFR6:** System shall support modern browsers (Chrome, Edge, Safari, Firefox - last 2 major versions) with no requirement for IE11.

**NFR7:** System shall implement automated daily database backups with retention policy.

**NFR8:** System shall be responsive and usable on mobile browsers (tablet and phone sizes).

**NFR9:** System shall implement soft deletes for time entries to enable audit trail and recovery capability.

**NFR10:** System shall display confirmation dialogs for destructive actions (delete time entry, lock invoice).

**NFR11:** System shall use Xero's "Consulting Services" product/service item for invoice line items. User must have this product configured in their Xero account with appropriate rate and accounting code mappings before invoice generation.

---
