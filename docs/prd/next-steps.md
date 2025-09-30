# Next Steps

## UX Expert Prompt

Review the PRD's User Interface Design Goals section and create detailed wireframes/mockups for the following core screens:

1. Dashboard (home page with open tickets, recently closed, quick stats)
2. Ticket creation form (minimal, speed-optimized)
3. Pre-invoice review screen (grouped by client, inline editing)
4. Ticket detail/edit view

Focus on the "fast-form philosophy" and ensuring <10 second ticket creation workflow. Provide interaction specifications for inline editing and progressive disclosure patterns.

## Architect Prompt

Based on this PRD, create a detailed technical architecture document including:

1. Complete database schema with tables, relationships, indexes, and constraints
2. API endpoint specifications (request/response formats)
3. Xero integration architecture (OAuth flow, token management, invoice generation)
4. Frontend state management approach
5. Soft delete pattern implementation
6. Invoice lock mechanism and transaction handling
7. Time entry parsing and validation logic
8. Deployment architecture and CI/CD pipeline design

Begin with a technical spike on Xero API integration (OAuth flow, "Consulting Services" item usage, invoice creation with line items) using Xero sandbox environment. Document any API limitations or constraints discovered.