/**
 * Migration: Add source_file column to brand_voice_embeddings
 *
 * Adds source_file column to track which document each embedding came from.
 * Useful for re-ingestion and debugging.
 */

const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

async function up() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Use direct connection (remove -pooler)
  const directUrl = dbUrl.replace('-pooler.', '.');

  const client = new Client({ connectionString: directUrl });

  try {
    await client.connect();

    console.log('Adding source_file column to brand_voice_embeddings...');

    await client.query(`
      ALTER TABLE brand_voice_embeddings
      ADD COLUMN IF NOT EXISTS source_file TEXT;
    `);

    console.log('✓ Added source_file column');

    // Add index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_brand_voice_embeddings_source_file
      ON brand_voice_embeddings(source_file);
    `);

    console.log('✓ Added index on source_file');

    await client.end();
    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    await client.end();
    throw error;
  }
}

async function down() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const directUrl = dbUrl.replace('-pooler.', '.');
  const client = new Client({ connectionString: directUrl });

  try {
    await client.connect();

    console.log('Removing source_file column from brand_voice_embeddings...');

    await client.query(`
      DROP INDEX IF EXISTS idx_brand_voice_embeddings_source_file;
    `);

    await client.query(`
      ALTER TABLE brand_voice_embeddings
      DROP COLUMN IF EXISTS source_file;
    `);

    console.log('✓ Rollback completed');

    await client.end();
  } catch (error) {
    console.error('Rollback failed:', error);
    await client.end();
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  up()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { up, down };
