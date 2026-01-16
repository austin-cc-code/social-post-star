#!/usr/bin/env node
const path = require('path');
const { neon } = require('@neondatabase/serverless');

require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

const sql = neon(process.env.DATABASE_URL);

async function debug() {
  try {
    // Check current database
    const db = await sql`SELECT current_database()`;
    console.log('\n📍 Current database:', db[0].current_database);

    // Check current schema
    const schema = await sql`SELECT current_schema()`;
    console.log('📍 Current schema:', schema[0].current_schema);

    // List ALL tables across all schemas
    const allTables = await sql`
      SELECT schemaname, tablename
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schemaname, tablename
    `;

    console.log('\n📊 ALL tables in database:');
    if (allTables.length === 0) {
      console.log('   (none found)');
    } else {
      allTables.forEach(t => console.log(`   ${t.schemaname}.${t.tablename}`));
    }

    // List ALL types (enums)
    const allTypes = await sql`
      SELECT n.nspname as schema, t.typname as type_name
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typtype = 'e'
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY n.nspname, t.typname
    `;

    console.log('\n🏷️  ALL enums:');
    if (allTypes.length === 0) {
      console.log('   (none found)');
    } else {
      allTypes.forEach(t => console.log(`   ${t.schema}.${t.type_name}`));
    }

    // Try to list tables using a different query
    const tables2 = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_catalog = current_database()
      ORDER BY table_name
    `;

    console.log('\n📋 Tables via information_schema (all catalogs):');
    if (tables2.length === 0) {
      console.log('   (none found)');
    } else {
      const grouped = {};
      tables2.forEach(t => {
        if (!grouped[t.table_schema]) grouped[t.table_schema] = [];
        grouped[t.table_schema].push(t.table_name);
      });
      Object.keys(grouped).forEach(schema => {
        console.log(`   Schema: ${schema}`);
        grouped[schema].forEach(t => console.log(`     - ${t}`));
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

debug().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
