#!/usr/bin/env node
const path = require('path');
const { neon } = require('@neondatabase/serverless');

require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function test() {
  try {
    // Try to manually create enum and table from our schema
    console.log('Creating content_source enum...');
    await sql.unsafe(`
      CREATE TYPE content_source AS ENUM (
        'webflow',
        'hubspot',
        'youtube',
        'manual'
      )
    `);
    console.log('✓ Enum created');

    console.log('\nCreating content_items table...');
    await sql.unsafe(`
      CREATE TABLE content_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source content_source NOT NULL,
        url TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✓ Table created');

    // Verify
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('\n📊 All tables:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n✓ Objects already exist! That means the migration DID work!');
      console.log('Let me list all tables...');
      const tables = await sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      console.log('\n📊 All tables:');
      tables.forEach(t => console.log(`   - ${t.table_name}`));
    }
  }
}

test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
