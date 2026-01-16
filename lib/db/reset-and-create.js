#!/usr/bin/env node
/**
 * Reset and Create Database Schema
 *
 * WARNING: This drops ALL tables and types! Only use for development.
 */

const path = require('path');
const { neon } = require('@neondatabase/serverless');
const readline = require('readline');

require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

// Use direct connection
let connectionString = process.env.DATABASE_URL.replace('-pooler.', '.');
const sql = neon(connectionString);

async function confirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function resetAndCreate() {
  console.log('\n⚠️  WARNING: This will DROP ALL TABLES AND TYPES!\n');

  const confirmed = await confirm('Are you sure you want to continue? (y/n): ');

  if (!confirmed) {
    console.log('\n❌ Aborted');
    return;
  }

  try {
    console.log('\n🗑️  Dropping existing tables and types...\n');

    // Drop tables (in reverse dependency order)
    const tables = [
      'user_feedback',
      'post_history',
      'generated_posts',
      'content_taxonomy',
      'brand_voice_embeddings',
      'content_items',
      'industry_articles',
      'special_days',
      'simple_test',
      'test_table'
    ];

    for (const table of tables) {
      try {
        await sql.unsafe(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✓ Dropped table: ${table}`);
      } catch (e) {
        console.log(`  Skip: ${table} (doesn't exist)`);
      }
    }

    // Drop types
    const types = [
      'content_source',
      'content_type',
      'post_type',
      'platform',
      'post_status',
      'feedback_type',
      'special_day_type',
      'brand_voice_source',
      'test_enum'
    ];

    for (const type of types) {
      try {
        await sql.unsafe(`DROP TYPE IF EXISTS ${type} CASCADE`);
        console.log(`✓ Dropped type: ${type}`);
      } catch (e) {
        console.log(`  Skip: ${type} (doesn't exist)`);
      }
    }

    console.log('\n✅ Cleanup complete\n');
    console.log('📝 Creating fresh schema...\n');

    // Create all schema objects in one big transaction using unsafe
    await sql.unsafe(`
      -- Create enums
      CREATE TYPE content_source AS ENUM ('webflow', 'hubspot', 'youtube', 'manual');
      CREATE TYPE content_type AS ENUM ('blog_post', 'whitepaper', 'case_study', 'webinar', 'video', 'landing_page', 'labs_app', 'other');
      CREATE TYPE post_type AS ENUM ('content_announcement', 'content_promotion', 'social_proof', 'centercode_feature', 'company_news', 'event_announcement', 'event_promotion', 'sharing_industry_article', 'labs_app_launch', 'labs_app_promotion', 'partnership_announcement', 'holiday_celebration', 'industry_day_celebration', 'other');
      CREATE TYPE platform AS ENUM ('linkedin', 'facebook', 'twitter');
      CREATE TYPE post_status AS ENUM ('pending', 'accepted', 'rejected');
      CREATE TYPE feedback_type AS ENUM ('accept', 'reject');
      CREATE TYPE special_day_type AS ENUM ('holiday', 'industry_day');
      CREATE TYPE brand_voice_source AS ENUM ('style_guide', 'example_post', 'feedback');

      -- Create tables
      CREATE TABLE content_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source content_source NOT NULL,
        url TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        content_type content_type NOT NULL,
        excerpt TEXT,
        metadata JSONB DEFAULT '{}',
        publication_date TIMESTAMP WITH TIME ZONE,
        last_polled TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE TABLE generated_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_id UUID REFERENCES content_items(id) ON DELETE SET NULL,
        post_type post_type NOT NULL,
        platform platform NOT NULL,
        text TEXT NOT NULL,
        scheduled_date TIMESTAMP WITH TIME ZONE,
        status post_status NOT NULL DEFAULT 'pending',
        campaign_id UUID,
        quality_check_passed BOOLEAN NOT NULL DEFAULT false,
        quality_check_details JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        finalized_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE post_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES generated_posts(id) ON DELETE CASCADE,
        post_type post_type NOT NULL,
        used_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE TABLE user_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES generated_posts(id) ON DELETE CASCADE,
        feedback_type feedback_type NOT NULL,
        learned_patterns JSONB DEFAULT '{}',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE TABLE industry_articles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        url TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        source TEXT NOT NULL,
        excerpt TEXT,
        discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        relevance_score DECIMAL(3, 2) NOT NULL DEFAULT 0.5,
        marked_not_relevant BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE TABLE special_days (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL,
        name TEXT NOT NULL,
        type special_day_type NOT NULL,
        description TEXT,
        relevance_score DECIMAL(3, 2) NOT NULL DEFAULT 0.5,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE TABLE content_taxonomy (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_id UUID NOT NULL UNIQUE REFERENCES content_items(id) ON DELETE CASCADE,
        topics TEXT[] DEFAULT '{}',
        themes TEXT[] DEFAULT '{}',
        personas TEXT[] DEFAULT '{}',
        key_messages JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE TABLE brand_voice_embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source brand_voice_source NOT NULL,
        text TEXT NOT NULL,
        embedding JSONB NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX idx_content_items_source ON content_items(source);
      CREATE INDEX idx_content_items_content_type ON content_items(content_type);
      CREATE INDEX idx_generated_posts_content_id ON generated_posts(content_id);
      CREATE INDEX idx_post_history_content_id ON post_history(content_id);
    `);

    console.log('✓ Schema created successfully\n');

    console.log('📊 Final state:');
    const tables_result = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
    tables_result.forEach(t => console.log(`   - ${t.tablename}`));

    const types_result = await sql`SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e' ORDER BY typname`;
    console.log('\n🏷️  Enums:');
    types_result.forEach(t => console.log(`   - ${t.typname}`));

    console.log('\n✅ Database schema created successfully!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

resetAndCreate().then(() => process.exit(0));
