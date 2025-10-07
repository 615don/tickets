# Epic 6: Database Backup & Restore - Brownfield Enhancement

## Epic Goal

Implement manual database backup and restore capabilities to enable disaster recovery, allowing users to download complete system backups (database + configuration) to their local PC and restore from backup files when needed.

## Epic Description

### Existing System Context

- **Current relevant functionality:** Application uses PostgreSQL database storing all critical data (clients, contacts, tickets, time_entries, invoice_locks, users, sessions). Environment variables in `.env` file contain critical secrets (Xero OAuth tokens, encryption keys, session secrets).
- **Technology stack:** Node.js/Express backend, PostgreSQL 14+, existing session management, Railway hosting with built-in database backups
- **Integration points:** Settings UI page (to be enhanced), PostgreSQL database connection pool, file download/upload handling

### Enhancement Details

- **What's being added/changed:**
  - Backend API endpoints to generate PostgreSQL dumps using `pg_dump` and package with sanitized environment configuration
  - Settings page UI with "Download Backup" button to trigger backup generation and download ZIP file
  - Settings page UI with "Restore from Backup" upload capability with confirmation dialogs
  - Backup package format: ZIP file containing `database.sql` (pg_dump output) and `environment-config.json` (sanitized .env variables)

- **How it integrates:**
  - New API routes under `/api/backup/*`
  - Extends existing Settings page (Story 4.7 Xero Connection Management UI location)
  - Uses existing database connection and authentication middleware
  - Leverages Node.js `child_process` to execute `pg_dump`/`psql` commands
  - File handling via `multer` or similar for backup upload

- **Success criteria:**
  - User can click "Download Backup" and receive complete backup ZIP file
  - User can upload backup ZIP and restore database to previous state
  - Critical Xero tokens and encryption keys preserved in backup
  - Restore process includes clear warnings about data loss
  - No data corruption during backup/restore cycle

## Stories

### Story 6.1: Backend Backup Generation API

Implement backend API endpoint to generate PostgreSQL database dump and package with sanitized environment configuration into downloadable ZIP file.

**Key Tasks:**
- Create `/api/backup/generate` POST endpoint
- Execute `pg_dump` using database credentials from environment
- Extract and sanitize `.env` file (include Xero tokens, encryption key, exclude passwords)
- Package `database.sql` + `environment-config.json` into ZIP
- Return ZIP file for download with timestamp filename
- Error handling for pg_dump failures

### Story 6.2: Backup Download UI

Create Settings page UI section with manual backup download capability.

**Key Tasks:**
- Add "Backup & Restore" section to Settings page
- "Download Backup Now" button triggers backup generation
- Loading indicator during backup generation (may take several seconds)
- Automatic file download on success
- Error messages for backup failures
- Display last backup timestamp if available
- Help text explaining what's included in backup

### Story 6.3: Database Restore API & UI

Implement backend restore capability and UI for uploading backup files with confirmation dialogs.

**Key Tasks:**
- Create `/api/backup/restore` POST endpoint accepting ZIP upload
- Extract and validate backup file structure
- Display confirmation dialog showing backup timestamp and warning about data loss
- Execute database restore using `psql` or `pg_restore`
- Restore environment configuration guidance (manual .env update needed)
- Success/error messaging
- Automatic logout after successful restore (sessions invalidated)
- File upload UI component on Settings page
- Multi-step confirmation to prevent accidental restore

## Compatibility Requirements

- [x] Existing APIs remain unchanged (new `/api/backup/*` routes only)
- [x] Database schema changes are backward compatible (no schema changes)
- [x] UI changes follow existing patterns (Settings page enhancement)
- [x] Performance impact is minimal (manual operation, no background load)

## Risk Mitigation

- **Primary Risk:** Accidental database restore causing data loss
- **Mitigation:** Multi-step confirmation dialog with explicit warnings, backup timestamp display, automatic test restore in development environment
- **Rollback Plan:** Restore from Railway's built-in automatic backups if user's manual backup fails

**Additional Risks:**
- **Risk:** pg_dump command failure due to permissions or missing PostgreSQL client tools
- **Mitigation:** Pre-flight check endpoint to validate pg_dump availability, clear error messages with troubleshooting steps

- **Risk:** Large database backups causing timeout or memory issues
- **Mitigation:** Stream backup file generation, configure appropriate timeout limits (5 minutes), document maximum practical database size

## Definition of Done

- [x] All stories completed with acceptance criteria met
- [x] Existing functionality verified through testing (no regression)
- [x] Integration points working correctly (Settings UI, database connection)
- [x] Documentation updated appropriately (backup/restore instructions in README)
- [x] No regression in existing features
- [x] Manual testing of full backup/restore cycle completed successfully
- [x] Error handling tested (invalid backup files, restore failures)

## Technical Notes

**PostgreSQL Backup Command:**
```bash
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -f database.dump
# or plain SQL format:
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > database.sql
```

**Environment Variables to Include in Backup:**
- XERO_CLIENT_ID
- XERO_CLIENT_SECRET
- XERO_REDIRECT_URI
- ENCRYPTION_KEY
- SESSION_SECRET (optional - can regenerate but logs everyone out)

**Environment Variables to EXCLUDE:**
- DB_PASSWORD (security risk)
- Any production-specific URLs/ports

**Node.js Libraries:**
- `archiver` - ZIP file creation
- `adm-zip` - ZIP extraction
- `child_process.exec` - pg_dump/psql execution
- `multer` - File upload handling

## Story Manager Handoff

**Story Manager Handoff:**

Please develop detailed user stories for this brownfield epic. Key considerations:

- This is an enhancement to an existing system running Node.js/Express + PostgreSQL
- Integration points: Settings page UI (existing from Story 4.7), PostgreSQL database connection, authentication middleware
- Existing patterns to follow: RESTful API design, express-validator for request validation, React Query for frontend API calls, shadcn/ui components for UI
- Critical compatibility requirements:
  - No changes to existing database schema
  - New API routes only (`/api/backup/*`)
  - Extend Settings page without breaking Xero connection UI
  - Must work with Railway hosting environment (pg_dump available)
- Each story must include verification that existing functionality remains intact
- Security considerations: Only authenticated admin users can backup/restore, validate backup file integrity before restore
- Error handling must be comprehensive with user-friendly messages

The epic should maintain system integrity while delivering disaster recovery capability through manual backup download and restore upload.
