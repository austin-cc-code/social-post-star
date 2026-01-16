#!/usr/bin/env node
/**
 * Test Database Connection
 *
 * Tests the database connection and shows table information
 */

const path = require('path');
const { neon } = require('@neondatabase/serverless');

require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...\n');

    // Test basic connection
    const time = await sql`SELECT NOW() as time`;
    console.log('✓ Database connected successfully');
    console.log(`  Server time: ${time[0].time}\n`);

    // Get version
    const version = await sql`SELECT version()`;
    console.log('📦 Database version:');
    console.log(`  ${version[0].version}\n`);

    // List all tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    console.log('📊 Tables in database:');
    if (tables.length === 0) {
      console.log('  (no tables found)');
    } else {
      tables.forEach(t => console.log(`  - ${t.table_name}`));
    }
    console.log('');

    // List all enums
    const enums = await sql`
      SELECT t.typname as enum_name
      FROM pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typtype = 'e'
      AND n.nspname = 'public'
      ORDER BY t.typname
    `;

    console.log('🏷️  Enums in database:');
    if (enums.length === 0) {
      console.log('  (no enums found)');
    } else {
      enums.forEach(e => console.log(`  - ${e.enum_name}`));
    }
    console.log('');

    // Check migrations
    const migrations = await sql`
      SELECT name, executed_at
      FROM migrations
      ORDER BY id
    `;

    console.log('📝 Executed migrations:');
    if (migrations.length === 0) {
      console.log('  (no migrations executed)');
    } else {
      migrations.forEach(m => console.log(`  - ${m.name} (${m.executed_at})`));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testConnection()
  .then(() => {
    console.log('\n✅ Connection test complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
