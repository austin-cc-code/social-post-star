#!/usr/bin/env node
/**
 * Setup Database Schema
 *
 * Uses standard pg client for proper DDL support
 */

const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

// Use direct connection (not pooled) and standard pg client for DDL
const connectionString = process.env.DATABASE_URL.replace('-pooler.', '.');

async function setup() {
  const client = new Client({ connectionString });

  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✓ Connected\n');

    console.log('🗑️  Dropping existing schema objects...');
    await client.query('DROP TABLE IF EXISTS user_feedback CASCADE');
    await client.query('DROP TABLE IF EXISTS post_history CASCADE');
    await client.query('DROP TABLE IF EXISTS generated_posts CASCADE');
    await client.query('DROP TABLE IF EXISTS content_taxonomy CASCADE');
    await client.query('DROP TABLE IF EXISTS brand_voice_embeddings CASCADE');
    await client.query('DROP TABLE IF EXISTS content_items CASCADE');
    await client.query('DROP TABLE IF EXISTS industry_articles CASCADE');
    await client.query('DROP TABLE IF EXISTS special_days CASCADE');

    await client.query('DROP TYPE IF EXISTS content_source CASCADE');
    await client.query('DROP TYPE IF EXISTS content_type CASCADE');
    await client.query('DROP TYPE IF EXISTS post_type CASCADE');
    await client.query('DROP TYPE IF EXISTS platform CASCADE');
    await client.query('DROP TYPE IF EXISTS post_status CASCADE');
    await client.query('DROP TYPE IF EXISTS feedback_type CASCADE');
    await client.query('DROP TYPE IF EXISTS special_day_type CASCADE');
    await client.query('DROP TYPE IF EXISTS brand_voice_source CASCADE');
    console.log('✓ Cleanup complete\n');

    console.log('📝 Creating schema...\n');

    // Create enums
    console.log('Creating enums...');
    await client.query("CREATE TYPE content_source AS ENUM ('webflow', 'hubspot', 'youtube', 'manual')");
    await client.query("CREATE TYPE content_type AS ENUM ('blog_post', 'whitepaper', 'case_study', 'webinar', 'video', 'landing_page', 'labs_app', 'other')");
    await client.query("CREATE TYPE post_type AS ENUM ('content_announcement', 'content_promotion', 'social_proof', 'centercode_feature', 'company_news', 'event_announcement', 'event_promotion', 'sharing_industry_article', 'labs_app_launch', 'labs_app_promotion', 'partnership_announcement', 'holiday_celebration', 'industry_day_celebration', 'other')");
    await client.query("CREATE TYPE platform AS ENUM ('linkedin', 'facebook', 'twitter')");
    await client.query("CREATE TYPE post_status AS ENUM ('pending', 'accepted', 'rejected')");
    await client.query("CREATE TYPE feedback_type AS ENUM ('accept', 'reject')");
    await client.query("CREATE TYPE special_day_type AS ENUM ('holiday', 'industry_day')");
    await client.query("CREATE TYPE brand_voice_source AS ENUM ('style_guide', 'example_post', 'feedback')");
    console.log('✓ Enums created\n');

    // Create tables
    console.log('Creating tables...');

    await client.query(`
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
      )
    `);

    await client.query(`
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
      )
    `);

    await client.query(`
      CREATE TABLE post_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
        post_id UUID NOT NULL REFERENCES generated_posts(id) ON DELETE CASCADE,
        post_type post_type NOT NULL,
        used_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE user_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES generated_posts(id) ON DELETE CASCADE,
        feedback_type feedback_type NOT NULL,
        learned_patterns JSONB DEFAULT '{}',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
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
      )
    `);

    await client.query(`
      CREATE TABLE special_days (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL,
        name TEXT NOT NULL,
        type special_day_type NOT NULL,
        description TEXT,
        relevance_score DECIMAL(3, 2) NOT NULL DEFAULT 0.5,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE content_taxonomy (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_id UUID NOT NULL UNIQUE REFERENCES content_items(id) ON DELETE CASCADE,
        topics TEXT[] DEFAULT '{}',
        themes TEXT[] DEFAULT '{}',
        personas TEXT[] DEFAULT '{}',
        key_messages JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE brand_voice_embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source brand_voice_source NOT NULL,
        text TEXT NOT NULL,
        embedding JSONB NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);

    console.log('✓ Tables created\n');

    // Create indexes
    console.log('Creating indexes...');
    await client.query('CREATE INDEX idx_content_items_source ON content_items(source)');
    await client.query('CREATE INDEX idx_content_items_content_type ON content_items(content_type)');
    await client.query('CREATE INDEX idx_generated_posts_content_id ON generated_posts(content_id)');
    await client.query('CREATE INDEX idx_post_history_content_id ON post_history(content_id)');
    console.log('✓ Indexes created\n');

    // Verify
    console.log('📊 Verification:');
    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
    console.log('\nTables:');
    tables.rows.forEach(t => console.log(`   - ${t.tablename}`));

    const types = await client.query("SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e' ORDER BY typname");
    console.log('\nEnums:');
    types.rows.forEach(t => console.log(`   - ${t.typname}`));

    console.log('\n✅ Database schema created successfully!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setup();
