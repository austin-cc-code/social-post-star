#!/usr/bin/env node
/**
 * Migration Runner
 *
 * Executes all pending database migrations in order.
 * Usage: npm run db:migrate
 */

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.error('   Please create .env.local and add your database connection string');
  process.exit(1);
}

// For migrations, we need a direct (non-pooled) connection
// Replace -pooler with direct connection
let connectionString = process.env.DATABASE_URL;
if (connectionString.includes('-pooler.')) {
  connectionString = connectionString.replace('-pooler.', '.');
  console.log('ℹ️  Using direct (non-pooled) connection for migrations\n');
}

const sql = neon(connectionString);

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...\n');

    // Create migrations tracking table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Get list of already executed migrations
    const executedMigrations = await sql`
      SELECT name FROM migrations ORDER BY id
    `;
    const executedNames = executedMigrations.map(m => m.name);

    // Get all migration files (.sql and .js)
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') || f.endsWith('.js'))
      .filter(f => !f.includes('run.js') && !f.includes('rollback.js') && !f.includes('create.js'))
      .sort();

    if (files.length === 0) {
      console.log('✓ No migration files found');
      return;
    }

    let executedCount = 0;

    // Execute each migration that hasn't been run yet
    for (const file of files) {
      const migrationName = file.replace('.sql', '');

      if (executedNames.includes(migrationName)) {
        console.log(`⏭  Skipping ${migrationName} (already executed)`);
        continue;
      }

      console.log(`⚙️  Executing ${migrationName}...`);

      const filePath = path.join(migrationsDir, file);

      try {
        if (file.endsWith('.js')) {
          // Execute JavaScript migration
          const migration = require(filePath);
          if (!migration.up) {
            throw new Error('Migration file must export an "up" function');
          }
          await migration.up();
        } else {
          // Execute SQL migration
          const migrationSQL = fs.readFileSync(filePath, 'utf8');

          // Split the SQL into individual statements
          // Remove comments and split by semicolons
          const statements = migrationSQL
            .split('\n')
            .filter(line => !line.trim().startsWith('--')) // Remove SQL comments
            .join('\n')
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

          console.log(`   Found ${statements.length} statements to execute`);

          // Execute each statement
          for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            if (stmt) {
              try {
                await sql.unsafe(stmt);
                process.stdout.write(`\r   Progress: ${i + 1}/${statements.length}`);
              } catch (stmtError) {
                console.error(`\n   ❌ Failed at statement ${i + 1}:`);
                console.error(`   ${stmt.substring(0, 100)}...`);
                console.error(`   Error: ${stmtError.message}`);
                throw stmtError;
              }
            }
          }

          console.log(''); // New line after progress
        }

        // Record that it was executed
        await sql`
          INSERT INTO migrations (name) VALUES (${migrationName})
        `;

        console.log(`✓ Successfully executed ${migrationName}\n`);
        executedCount++;
      } catch (error) {
        console.error(`❌ Failed to execute ${migrationName}:`);
        console.error(error.message);
        throw error;
      }
    }

    if (executedCount === 0) {
      console.log('✓ All migrations up to date');
    } else {
      console.log(`\n✅ Successfully executed ${executedCount} migration(s)`);
    }

    // Show current database state
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    console.log('\n📊 Current database tables:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('\n✅ Migration process complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
