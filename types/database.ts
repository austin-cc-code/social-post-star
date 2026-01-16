/**
 * Database Model Type Definitions
 *
 * This file contains TypeScript interfaces for all database tables.
 * These types ensure type safety when working with database records.
 */

// =============================================================================
// Enums
// =============================================================================

export enum ContentSource {
  WEBFLOW = 'webflow',
  HUBSPOT = 'hubspot',
  YOUTUBE = 'youtube',
  MANUAL = 'manual'
}

export enum ContentType {
  BLOG_POST = 'blog_post',
  WHITEPAPER = 'whitepaper',
  CASE_STUDY = 'case_study',
  WEBINAR = 'webinar',
  VIDEO = 'video',
  LANDING_PAGE = 'landing_page',
  LABS_APP = 'labs_app',
  OTHER = 'other'
}

export enum PostType {
  CONTENT_ANNOUNCEMENT = 'content_announcement',
  CONTENT_PROMOTION = 'content_promotion',
  SOCIAL_PROOF = 'social_proof',
  CENTERCODE_FEATURE = 'centercode_feature',
  COMPANY_NEWS = 'company_news',
  EVENT_ANNOUNCEMENT = 'event_announcement',
  EVENT_PROMOTION = 'event_promotion',
  SHARING_INDUSTRY_ARTICLE = 'sharing_industry_article',
  LABS_APP_LAUNCH = 'labs_app_launch',
  LABS_APP_PROMOTION = 'labs_app_promotion',
  PARTNERSHIP_ANNOUNCEMENT = 'partnership_announcement',
  HOLIDAY_CELEBRATION = 'holiday_celebration',
  INDUSTRY_DAY_CELEBRATION = 'industry_day_celebration',
  OTHER = 'other'
}

export enum Platform {
  LINKEDIN = 'linkedin',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter'
}

export enum PostStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export enum FeedbackType {
  ACCEPT = 'accept',
  REJECT = 'reject'
}

export enum SpecialDayType {
  HOLIDAY = 'holiday',
  INDUSTRY_DAY = 'industry_day'
}

// =============================================================================
// Table Interfaces
// =============================================================================

export interface ContentItem {
  id: string;
  source: ContentSource;
  url: string;
  title: string;
  content_type: ContentType;
  excerpt?: string;
  metadata?: Record<string, any>; // JSON field
  publication_date?: Date;
  last_polled: Date;
  created_at: Date;
  updated_at: Date;
}

export interface GeneratedPost {
  id: string;
  content_id?: string; // FK to content_items, nullable for ad-hoc/special posts
  post_type: PostType;
  platform: Platform;
  text: string;
  scheduled_date?: Date;
  status: PostStatus;
  campaign_id?: string; // For grouping campaign posts
  quality_check_passed: boolean;
  quality_check_details?: Record<string, any>; // JSON field
  created_at: Date;
  finalized_at?: Date;
}

export interface PostHistory {
  id: string;
  content_id: string; // FK to content_items
  post_id: string; // FK to generated_posts
  post_type: PostType;
  used_date: Date;
  created_at: Date;
}

export interface UserFeedback {
  id: string;
  post_id: string; // FK to generated_posts
  feedback_type: FeedbackType;
  learned_patterns?: Record<string, any>; // JSON field
  notes?: string;
  created_at: Date;
}

export interface IndustryArticle {
  id: string;
  url: string;
  title: string;
  source: string;
  excerpt?: string;
  discovered_at: Date;
  relevance_score: number; // 0-1
  marked_not_relevant: boolean;
  created_at: Date;
}

export interface SpecialDay {
  id: string;
  date: Date;
  name: string;
  type: SpecialDayType;
  description?: string;
  relevance_score: number; // 0-1
  created_at: Date;
  updated_at: Date;
}

export interface ContentTaxonomy {
  id: string;
  content_id: string; // FK to content_items
  topics: string[]; // Array of topic strings
  themes: string[]; // Array of theme strings
  personas: string[]; // Target personas
  key_messages?: Record<string, any>; // JSON field
  created_at: Date;
  updated_at: Date;
}

export interface BrandVoiceEmbedding {
  id: string;
  source: 'style_guide' | 'example_post' | 'feedback';
  text: string;
  embedding: number[]; // Vector embedding
  metadata?: Record<string, any>; // JSON field
  created_at: Date;
}

// =============================================================================
// Insert Types (without auto-generated fields)
// =============================================================================

export type ContentItemInsert = Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>;
export type GeneratedPostInsert = Omit<GeneratedPost, 'id' | 'created_at' | 'finalized_at'>;
export type PostHistoryInsert = Omit<PostHistory, 'id' | 'created_at'>;
export type UserFeedbackInsert = Omit<UserFeedback, 'id' | 'created_at'>;
export type IndustryArticleInsert = Omit<IndustryArticle, 'id' | 'created_at'>;
export type SpecialDayInsert = Omit<SpecialDay, 'id' | 'created_at' | 'updated_at'>;
export type ContentTaxonomyInsert = Omit<ContentTaxonomy, 'id' | 'created_at' | 'updated_at'>;
export type BrandVoiceEmbeddingInsert = Omit<BrandVoiceEmbedding, 'id' | 'created_at'>;

// =============================================================================
// Query Result Types
// =============================================================================

export interface PostWithContent extends GeneratedPost {
  content?: ContentItem;
}

export interface PostWithHistory extends GeneratedPost {
  history?: PostHistory[];
}

export interface ContentWithTaxonomy extends ContentItem {
  taxonomy?: ContentTaxonomy;
}

// =============================================================================
// Statistics & Analytics Types
// =============================================================================

export interface ContentUsageStats {
  content_id: string;
  title: string;
  url: string;
  times_promoted: number;
  last_promoted?: Date;
  post_types_used: PostType[];
}

export interface PostTypeDistribution {
  post_type: PostType;
  count: number;
  accepted_count: number;
  rejected_count: number;
}
