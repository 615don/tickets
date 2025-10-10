# Database Maintenance Scripts

This directory contains utility scripts for database maintenance and cleanup.

## cleanup-duplicate-domains.js

Removes duplicate domain entries from the `client_domains` table while preserving the oldest entry for each client/domain pair.

### Prerequisites

1. Get your Railway database URL:
   - Go to your Railway project
   - Click on your PostgreSQL database
   - Copy the `DATABASE_URL` connection string

### Usage

**Preview mode (safe - no changes):**
```bash
DATABASE_URL="your-railway-database-url" node scripts/cleanup-duplicate-domains.js --dry-run
```

**Execute mode (deletes duplicates):**
```bash
DATABASE_URL="your-railway-database-url" node scripts/cleanup-duplicate-domains.js --execute
```

### What it does

1. Connects to the database using `DATABASE_URL`
2. Finds all duplicate domain entries (same domain + client_id combination)
3. Keeps the oldest entry (lowest ID)
4. Deletes all duplicate entries
5. Verifies cleanup was successful

### Safety Features

- **Dry run by default** - Always runs in preview mode unless `--execute` is specified
- **Preserves data** - Keeps the oldest entry for each domain/client pair
- **Verification** - Checks for remaining duplicates after cleanup
- **Detailed logging** - Shows exactly what will be or was deleted

### Example Output

```
🔍 DRY RUN MODE - No changes will be made

✅ Connected to database

Step 1: Finding duplicate domain entries...

Found 1 domain(s) with duplicates:

  - "cartergroupllc.com" for "Carter Group, LLC" (Client ID: 6): 4 entries
    IDs: 7, 8, 9, 10 (will keep ID 7)

Step 2: Removing duplicate entries...

  Would delete 3 duplicate(s) of "cartergroupllc.com" for "Carter Group, LLC" (Client ID: 6)
    Keeping ID: 7, Would delete IDs: 8, 9, 10

Would delete 3 duplicate domain entries

💡 To actually delete duplicates, run:

   node scripts/cleanup-duplicate-domains.js --execute
```
