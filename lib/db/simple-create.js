#!/usr/bin/env node
const path = require('path');
const { neon } = require('@neondatabase/serverless');

require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

// Use direct connection (not pooled)
let connectionString = process.env.DATABASE_URL.replace('-pooler.', '.');
console.log('Using direct connection');

const sql = neon(connectionString);

async function test() {
  try {
    console.log('\n1. Creating simple test table...');
    await sql`
      CREATE TABLE IF NOT EXISTS simple_test (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      )
    `;
    console.log('✓ CREATE TABLE executed\n');

    console.log('2. Checking if table exists...');
    const check1 = await sql`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'simple_test'
      )
    `;
    console.log('✓ Exists:', check1[0].exists, '\n');

    console.log('3. Inserting test data...');
    await sql`INSERT INTO simple_test (name) VALUES ('test1')`;
    console.log('✓ INSERT executed\n');

    console.log('4. Reading data back...');
    const data = await sql`SELECT * FROM simple_test`;
    console.log('✓ Data:', data, '\n');

    console.log('5. Listing all tables...');
    const tables = await sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    console.log('✓ Tables:');
    tables.forEach(t => console.log(`   - ${t.tablename}`));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

test().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
