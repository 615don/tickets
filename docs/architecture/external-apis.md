# External APIs

## Xero API

- **Purpose:** Invoice generation, OAuth authentication, customer management
- **Documentation:** https://developer.xero.com/documentation/api/accounting/overview
- **Authentication:** OAuth 2.0 with PKCE, refresh token rotation
- **Rate Limits:** 60 calls/min, 5000 calls/day

**Key Endpoints:**
- `GET /connections` - Get authorized tenants
- `POST /Invoices` - Create invoices with line items
- `GET /Items` - Verify "Consulting Services" product exists

**Invoice Number Handling:**
- **Xero auto-generates invoice numbers** - system does not supply them
- Invoice numbers returned in API response and stored in `invoice_locks.xero_invoice_ids`
- No duplicate risk - Xero controls sequential numbering

**Token Management:**
- Access tokens encrypted at rest (Node.js crypto module)
- Automatic refresh before expiry (30-minute token lifetime)
- xero-node SDK handles token refresh automatically

---
