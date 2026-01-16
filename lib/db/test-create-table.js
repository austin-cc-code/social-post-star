#!/usr/bin/env node
const path = require('path');
const { neon } = require('@neondatabase/serverless');

require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function test() {
  try {
    console.log('Testing table creation...\n');

    // Try creating a simple enum
    console.log('Creating enum...');
    await sql`
      DO $$ BEGIN
        CREATE TYPE test_enum AS ENUM ('value1', 'value2');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('✓ Enum created\n');

    // Try creating a simple table
    console.log('Creating table...');
    await sql`
      CREATE TABLE IF NOT EXISTS test_table (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    console.log('✓ Table created\n');

    // Verify it exists
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'test_table'
    `;

    if (result.length > 0) {
      console.log('✓ Table verified in database\n');
    } else {
      console.log('✗ Table not found\n');
    }

    // Clean up
    console.log('Cleaning up...');
    await sql`DROP TABLE IF EXISTS test_table`;
    await sql`DROP TYPE IF EXISTS test_enum`;
    console.log('✓ Cleanup complete');

  } catch (error) {
    console.error('Error:', error);
  }
}

test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
