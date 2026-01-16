-- Migration: 001_initial_schema
-- Description: Create all initial tables, indexes, and database objects
-- Date: 2026-01-15

-- Enable UUID extension for generating IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE content_source AS ENUM (
  'webflow',
  'hubspot',
  'youtube',
  'manual'
);

CREATE TYPE content_type AS ENUM (
  'blog_post',
  'whitepaper',
  'case_study',
  'webinar',
  'video',
  'landing_page',
  'labs_app',
  'other'
);

CREATE TYPE post_type AS ENUM (
  'content_announcement',
  'content_promotion',
  'social_proof',
  'centercode_feature',
  'company_news',
  'event_announcement',
  'event_promotion',
  'sharing_industry_article',
  'labs_app_launch',
  'labs_app_promotion',
  'partnership_announcement',
  'holiday_celebration',
  'industry_day_celebration',
  'other'
);

CREATE TYPE platform AS ENUM (
  'linkedin',
  'facebook',
  'twitter'
);

CREATE TYPE post_status AS ENUM (
  'pending',
  'accepted',
  'rejected'
);

CREATE TYPE feedback_type AS ENUM (
  'accept',
  'reject'
);

CREATE TYPE special_day_type AS ENUM (
  'holiday',
  'industry_day'
);

CREATE TYPE brand_voice_source AS ENUM (
  'style_guide',
  'example_post',
  'feedback'
);

-- =============================================================================
-- TABLES
-- =============================================================================

CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES generated_posts(id) ON DELETE CASCADE,
  post_type post_type NOT NULL,
  used_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES generated_posts(id) ON DELETE CASCADE,
  feedback_type feedback_type NOT NULL,
  learned_patterns JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE industry_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  excerpt TEXT,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  relevance_score DECIMAL(3, 2) NOT NULL DEFAULT 0.5 CHECK (relevance_score >= 0 AND relevance_score <= 1),
  marked_not_relevant BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE special_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  name TEXT NOT NULL,
  type special_day_type NOT NULL,
  description TEXT,
  relevance_score DECIMAL(3, 2) NOT NULL DEFAULT 0.5 CHECK (relevance_score >= 0 AND relevance_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE content_taxonomy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  topics TEXT[] NOT NULL DEFAULT '{}',
  themes TEXT[] NOT NULL DEFAULT '{}',
  personas TEXT[] NOT NULL DEFAULT '{}',
  key_messages JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(content_id)
);

CREATE TABLE brand_voice_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source brand_voice_source NOT NULL,
  text TEXT NOT NULL,
  embedding JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- content_items indexes
CREATE INDEX idx_content_items_source ON content_items(source);
CREATE INDEX idx_content_items_content_type ON content_items(content_type);
CREATE INDEX idx_content_items_publication_date ON content_items(publication_date DESC);
CREATE INDEX idx_content_items_last_polled ON content_items(last_polled);
CREATE INDEX idx_content_items_url ON content_items(url);

-- generated_posts indexes
CREATE INDEX idx_generated_posts_content_id ON generated_posts(content_id);
CREATE INDEX idx_generated_posts_post_type ON generated_posts(post_type);
CREATE INDEX idx_generated_posts_platform ON generated_posts(platform);
CREATE INDEX idx_generated_posts_status ON generated_posts(status);
CREATE INDEX idx_generated_posts_campaign_id ON generated_posts(campaign_id);
CREATE INDEX idx_generated_posts_scheduled_date ON generated_posts(scheduled_date);
CREATE INDEX idx_generated_posts_created_at ON generated_posts(created_at DESC);

-- post_history indexes
CREATE INDEX idx_post_history_content_id ON post_history(content_id);
CREATE INDEX idx_post_history_post_id ON post_history(post_id);
CREATE INDEX idx_post_history_used_date ON post_history(used_date DESC);
CREATE INDEX idx_post_history_content_post_type ON post_history(content_id, post_type);
CREATE INDEX idx_post_history_duplication_check ON post_history(content_id, used_date DESC);

-- user_feedback indexes
CREATE INDEX idx_user_feedback_post_id ON user_feedback(post_id);
CREATE INDEX idx_user_feedback_feedback_type ON user_feedback(feedback_type);
CREATE INDEX idx_user_feedback_created_at ON user_feedback(created_at DESC);

-- industry_articles indexes
CREATE INDEX idx_industry_articles_url ON industry_articles(url);
CREATE INDEX idx_industry_articles_source ON industry_articles(source);
CREATE INDEX idx_industry_articles_relevance_score ON industry_articles(relevance_score DESC);
CREATE INDEX idx_industry_articles_marked_not_relevant ON industry_articles(marked_not_relevant);
CREATE INDEX idx_industry_articles_discovered_at ON industry_articles(discovered_at DESC);

-- special_days indexes
CREATE UNIQUE INDEX idx_special_days_date_name ON special_days(date, name);
CREATE INDEX idx_special_days_date ON special_days(date);
CREATE INDEX idx_special_days_type ON special_days(type);
CREATE INDEX idx_special_days_relevance_score ON special_days(relevance_score DESC);

-- content_taxonomy indexes
CREATE INDEX idx_content_taxonomy_content_id ON content_taxonomy(content_id);
CREATE INDEX idx_content_taxonomy_topics ON content_taxonomy USING GIN (topics);
CREATE INDEX idx_content_taxonomy_themes ON content_taxonomy USING GIN (themes);
CREATE INDEX idx_content_taxonomy_personas ON content_taxonomy USING GIN (personas);

-- brand_voice_embeddings indexes
CREATE INDEX idx_brand_voice_embeddings_source ON brand_voice_embeddings(source);
CREATE INDEX idx_brand_voice_embeddings_created_at ON brand_voice_embeddings(created_at DESC);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_special_days_updated_at
  BEFORE UPDATE ON special_days
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_taxonomy_updated_at
  BEFORE UPDATE ON content_taxonomy
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- VIEWS
-- =============================================================================

CREATE OR REPLACE VIEW posts_with_content AS
SELECT
  gp.*,
  ci.title AS content_title,
  ci.url AS content_url,
  ci.content_type,
  ci.publication_date
FROM generated_posts gp
LEFT JOIN content_items ci ON gp.content_id = ci.id;

CREATE OR REPLACE VIEW content_usage_stats AS
SELECT
  ci.id AS content_id,
  ci.title,
  ci.url,
  ci.content_type,
  COUNT(ph.id) AS times_promoted,
  MAX(ph.used_date) AS last_promoted,
  ARRAY_AGG(DISTINCT ph.post_type) AS post_types_used
FROM content_items ci
LEFT JOIN post_history ph ON ci.id = ph.content_id
GROUP BY ci.id, ci.title, ci.url, ci.content_type;
