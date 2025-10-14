import pool from '../config/database.js';
import format from 'pg-format';
import fs from 'fs';
import archiver from 'archiver';

/**
 * Database Backup Service
 * Generates PostgreSQL dumps programmatically without requiring pg_dump binary
 */

/**
 * Get all table names from the database
 */
async function getAllTables() {
  const result = await pool.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);

  return result.rows.map(row => row.tablename);
}

/**
 * Get table schema (CREATE TABLE statement)
 */
async function getTableSchema(tableName) {
  // Get column definitions
  const columns = await pool.query(`
    SELECT
      column_name,
      data_type,
      character_maximum_length,
      column_default,
      is_nullable,
      udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);

  // Get constraints (primary keys, foreign keys, unique, check)
  const constraints = await pool.query(`
    SELECT
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.update_rule,
      rc.delete_rule,
      cc.check_clause
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    LEFT JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
    LEFT JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_schema = 'public' AND tc.table_name = $1
    ORDER BY tc.constraint_type, kcu.ordinal_position
  `, [tableName]);

  // Get indexes
  const indexes = await pool.query(`
    SELECT
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = $1
    ORDER BY indexname
  `, [tableName]);

  // Build CREATE TABLE statement
  let sql = `CREATE TABLE IF NOT EXISTS ${format.ident(tableName)} (\n`;

  // Add columns
  const columnDefs = columns.rows.map(col => {
    let def = `  ${format.ident(col.column_name)} `;

    // Data type
    if (col.data_type === 'character varying' && col.character_maximum_length) {
      def += `VARCHAR(${col.character_maximum_length})`;
    } else if (col.data_type === 'USER-DEFINED') {
      def += col.udt_name.toUpperCase();
    } else {
      def += col.data_type.toUpperCase();
    }

    // Default value
    if (col.column_default) {
      def += ` DEFAULT ${col.column_default}`;
    }

    // NOT NULL
    if (col.is_nullable === 'NO') {
      def += ' NOT NULL';
    }

    return def;
  });

  sql += columnDefs.join(',\n');

  // Add constraints
  const constraintGroups = {};
  constraints.rows.forEach(constraint => {
    if (!constraintGroups[constraint.constraint_name]) {
      constraintGroups[constraint.constraint_name] = {
        type: constraint.constraint_type,
        columns: [],
        foreignTable: constraint.foreign_table_name,
        foreignColumn: constraint.foreign_column_name,
        updateRule: constraint.update_rule,
        deleteRule: constraint.delete_rule,
        checkClause: constraint.check_clause
      };
    }
    if (constraint.column_name) {
      constraintGroups[constraint.constraint_name].columns.push(constraint.column_name);
    }
  });

  Object.entries(constraintGroups).forEach(([name, constraint]) => {
    if (constraint.type === 'PRIMARY KEY') {
      sql += `,\n  PRIMARY KEY (${constraint.columns.map(c => format.ident(c)).join(', ')})`;
    } else if (constraint.type === 'FOREIGN KEY') {
      sql += `,\n  FOREIGN KEY (${constraint.columns.map(c => format.ident(c)).join(', ')}) `;
      sql += `REFERENCES ${format.ident(constraint.foreignTable)}(${format.ident(constraint.foreignColumn)})`;
      if (constraint.deleteRule && constraint.deleteRule !== 'NO ACTION') {
        sql += ` ON DELETE ${constraint.deleteRule}`;
      }
      if (constraint.updateRule && constraint.updateRule !== 'NO ACTION') {
        sql += ` ON UPDATE ${constraint.updateRule}`;
      }
    } else if (constraint.type === 'UNIQUE') {
      sql += `,\n  UNIQUE (${constraint.columns.map(c => format.ident(c)).join(', ')})`;
    } else if (constraint.type === 'CHECK') {
      // Ensure CHECK clause is wrapped in parentheses if not already
      const clause = constraint.checkClause.trim();
      const wrappedClause = clause.startsWith('(') ? clause : `(${clause})`;
      sql += `,\n  CHECK ${wrappedClause}`;
    }
  });

  sql += '\n);\n\n';

  // Add indexes (excluding primary key indexes)
  indexes.rows.forEach(index => {
    if (!index.indexname.endsWith('_pkey')) {
      // Add IF NOT EXISTS to CREATE INDEX statements for idempotent restores
      let indexDef = index.indexdef;
      indexDef = indexDef.replace(/^CREATE UNIQUE INDEX/i, 'CREATE UNIQUE INDEX IF NOT EXISTS');
      indexDef = indexDef.replace(/^CREATE INDEX/i, 'CREATE INDEX IF NOT EXISTS');
      sql += `${indexDef};\n`;
    }
  });

  return sql;
}

/**
 * Get table data as INSERT statements
 */
async function getTableData(tableName) {
  const result = await pool.query(format('SELECT * FROM %I', tableName));

  if (result.rows.length === 0) {
    return '';
  }

  const columns = Object.keys(result.rows[0]);
  let sql = '';

  // Generate INSERT statements in batches
  const batchSize = 100;
  for (let i = 0; i < result.rows.length; i += batchSize) {
    const batch = result.rows.slice(i, i + batchSize);
    const values = batch.map(row => {
      const rowValues = columns.map(col => {
        const val = row[col];
        if (val === null) return 'NULL';
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'number') return val;
        if (val instanceof Date) return format.literal(val.toISOString());
        // Handle objects (JSON/JSONB columns) - serialize to JSON string
        if (typeof val === 'object') return format.literal(JSON.stringify(val));
        return format.literal(String(val));
      });
      return `(${rowValues.join(', ')})`;
    });

    sql += `INSERT INTO ${format.ident(tableName)} (${columns.map(c => format.ident(c)).join(', ')}) VALUES\n`;
    sql += values.join(',\n');
    sql += ';\n\n';
  }

  return sql;
}

/**
 * Get sequences and update their current values
 */
async function getSequences() {
  const result = await pool.query(`
    SELECT
      sequence_name,
      start_value,
      increment
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  `);

  let sql = '';
  for (const seq of result.rows) {
    const currentValue = await pool.query(`SELECT last_value FROM ${format.ident(seq.sequence_name)}`);
    if (currentValue.rows.length > 0) {
      sql += `SELECT setval('${seq.sequence_name}', ${currentValue.rows[0].last_value}, true);\n`;
    }
  }

  return sql;
}

/**
 * Generate complete database SQL dump
 * @returns {Promise<string>} SQL dump content
 */
export async function generateDatabaseDump() {
  let sql = '';

  // Header
  sql += '-- PostgreSQL Database Backup\n';
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += '-- Database: ' + (process.env.DB_NAME || 'ticketing_system') + '\n\n';

  // Get all tables
  const tables = await getAllTables();

  // Generate schema for each table
  sql += '-- =========================================\n';
  sql += '-- SCHEMA\n';
  sql += '-- =========================================\n\n';

  for (const table of tables) {
    sql += `-- Table: ${table}\n`;
    sql += await getTableSchema(table);
    sql += '\n';
  }

  // Generate data for each table
  sql += '-- =========================================\n';
  sql += '-- DATA\n';
  sql += '-- =========================================\n\n';

  for (const table of tables) {
    sql += `-- Data for table: ${table}\n`;
    sql += await getTableData(table);
  }

  // Update sequences
  sql += '-- =========================================\n';
  sql += '-- SEQUENCES\n';
  sql += '-- =========================================\n\n';
  sql += await getSequences();

  return sql;
}

/**
 * Create backup ZIP file with database dump and environment config
 * @param {string} outputPath - Path to save ZIP file
 * @returns {Promise<string>} Path to created ZIP file
 */
export async function createBackupZip(outputPath) {
  const timestamp = new Date().toISOString().replace(/:/g, '').replace(/\..+/, '').replace('T', '-').substring(0, 17);
  const tempDir = `/tmp/backup-${timestamp}`;

  // Create temp directory
  await fs.promises.mkdir(tempDir, { recursive: true });

  try {
    // Generate database dump
    const dumpContent = await generateDatabaseDump();
    const dumpFile = `${tempDir}/database.sql`;
    await fs.promises.writeFile(dumpFile, dumpContent);

    // Create sanitized environment config
    const sanitizedConfig = {
      XERO_CLIENT_ID: process.env.XERO_CLIENT_ID || '',
      XERO_CLIENT_SECRET: process.env.XERO_CLIENT_SECRET || '',
      XERO_REDIRECT_URI: process.env.XERO_REDIRECT_URI || '',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
      SESSION_SECRET: process.env.SESSION_SECRET || '',
      GOOGLE_DRIVE_CLIENT_ID: process.env.GOOGLE_DRIVE_CLIENT_ID || '',
      GOOGLE_DRIVE_CLIENT_SECRET: process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
      GOOGLE_DRIVE_REDIRECT_URI: process.env.GOOGLE_DRIVE_REDIRECT_URI || ''
    };

    const configFile = `${tempDir}/environment-config.json`;
    await fs.promises.writeFile(configFile, JSON.stringify(sanitizedConfig, null, 2));

    // Create ZIP archive
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', async () => {
        // Clean up temp directory
        await fs.promises.rm(tempDir, { recursive: true, force: true });
        resolve(outputPath);
      });

      archive.on('error', async (err) => {
        // Clean up temp directory
        await fs.promises.rm(tempDir, { recursive: true, force: true });
        reject(err);
      });

      archive.pipe(output);
      archive.file(dumpFile, { name: 'database.sql' });
      archive.file(configFile, { name: 'environment-config.json' });
      archive.finalize();
    });
  } catch (error) {
    // Clean up temp directory on error
    await fs.promises.rm(tempDir, { recursive: true, force: true });
    throw error;
  }
}
