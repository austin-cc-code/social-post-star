/**
 * Migration: 002 - Re-attempt schema creation using proper method
 *
 * This migration creates the same schema as 001 but using code instead of SQL file
 * to avoid parsing issues with sql.unsafe()
 */

const path = require('path');
const { neon } = require('@neondatabase/serverless');

require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

// Use direct connection
let connectionString = process.env.DATABASE_URL.replace('-pooler.', '.');
const sql = neon(connectionString);

async function up() {
  console.log('Creating database schema...\n');

  // Create all enum types
  console.log('Creating enum types...');

  try {

  await sql`
    CREATE TYPE IF NOT EXISTS content_source AS ENUM (
      'webflow', 'hubspot', 'youtube', 'manual'
    )
  `;

  await sql`
    CREATE TYPE IF NOT EXISTS content_type AS ENUM (
      'blog_post', 'whitepaper', 'case_study', 'webinar', 'video',
      'landing_page', 'labs_app', 'other'
    )
  `;

  await sql`
    CREATE TYPE IF NOT EXISTS post_type AS ENUM (
      'content_announcement', 'content_promotion', 'social_proof',
      'centercode_feature', 'company_news', 'event_announcement',
      'event_promotion', 'sharing_industry_article', 'labs_app_launch',
      'labs_app_promotion', 'partnership_announcement',
      'holiday_celebration', 'industry_day_celebration', 'other'
    )
  `;

  await sql`
    CREATE TYPE IF NOT EXISTS platform AS ENUM ('linkedin', 'facebook', 'twitter')
  `;

  await sql`
    CREATE TYPE IF NOT EXISTS post_status AS ENUM ('pending', 'accepted', 'rejected')
  `;

  await sql`
    CREATE TYPE IF NOT EXISTS feedback_type AS ENUM ('accept', 'reject')
  `;

  await sql`
    CREATE TYPE IF NOT EXISTS special_day_type AS ENUM ('holiday', 'industry_day')
  `;

  await sql`
    CREATE TYPE IF NOT EXISTS brand_voice_source AS ENUM ('style_guide', 'example_post', 'feedback')
  `;

  console.log('✓ Enums created\n');

  // Create tables
  console.log('Creating tables...');

  await sql`
    CREATE TABLE IF NOT EXISTS content_items (
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
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS generated_posts (
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
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS post_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
      post_id UUID NOT NULL REFERENCES generated_posts(id) ON DELETE CASCADE,
      post_type post_type NOT NULL,
      used_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_feedback (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES generated_posts(id) ON DELETE CASCADE,
      feedback_type feedback_type NOT NULL,
      learned_patterns JSONB DEFAULT '{}',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS industry_articles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      url TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      excerpt TEXT,
      discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      relevance_score DECIMAL(3, 2) NOT NULL DEFAULT 0.5 CHECK (relevance_score >= 0 AND relevance_score <= 1),
      marked_not_relevant BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS special_days (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL,
      name TEXT NOT NULL,
      type special_day_type NOT NULL,
      description TEXT,
      relevance_score DECIMAL(3, 2) NOT NULL DEFAULT 0.5 CHECK (relevance_score >= 0 AND relevance_score <= 1),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS content_taxonomy (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content_id UUID NOT NULL UNIQUE REFERENCES content_items(id) ON DELETE CASCADE,
      topics TEXT[] DEFAULT '{}',
      themes TEXT[] DEFAULT '{}',
      personas TEXT[] DEFAULT '{}',
      key_messages JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS brand_voice_embeddings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source brand_voice_source NOT NULL,
      text TEXT NOT NULL,
      embedding JSONB NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `;

  console.log('✓ Tables created\n');

  console.log('Creating indexes...');
  // Create indexes (sample - add more as needed)
  await sql`CREATE INDEX IF NOT EXISTS idx_content_items_source ON content_items(source)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_content_items_content_type ON content_items(content_type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_generated_posts_content_id ON generated_posts(content_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_generated_posts_post_type ON generated_posts(post_type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_post_history_content_id ON post_history(content_id)`;

  console.log('✓ Indexes created\n');

  console.log('✅ Schema creation complete!');
}

module.exports = { up };
