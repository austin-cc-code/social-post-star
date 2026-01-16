#!/usr/bin/env node
const path = require('path');
const { neon } = require('@neondatabase/serverless');

require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function reset() {
  try {
    console.log('Resetting migration 001_initial_schema...\n');

    await sql`DELETE FROM migrations WHERE name = '001_initial_schema'`;

    console.log('✓ Migration record deleted');
    console.log('You can now run: npm run db:migrate\n');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

reset().then(() => process.exit(0));
