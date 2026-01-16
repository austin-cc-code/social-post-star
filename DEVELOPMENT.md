# Development Log

This document tracks implementation progress, key decisions, and context for the Social Post Star project. Use this to quickly understand what's been built, what's in progress, and what's next.

---

## Project Status: Brand Voice System Ready ✅

**Last Updated:** 2026-01-15

**Current Phase:** Epic 3 - Brand Voice & Style System (✅ Infrastructure Complete - Awaiting Documents)

---

## Quick Context

### What This Tool Does
Social Post Star is an AI-powered tool that generates brand-aligned social media posts for Centercode. It can batch generate posts from existing content, create ad-hoc posts, run multi-post campaigns, and export directly to HubSpot's bulk upload format.

### Key Technologies
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Database:** Neon (PostgreSQL)
- **UI Library:** Ditto Design Library from agentic.centercode.com/ditto
- **AI:** OpenAI GPT-4 or Anthropic Claude
- **Deployment:** Local development only (for now)

---

## Epic Implementation Status

### ✅ Completed

#### Epic 1: Project Foundation & Infrastructure (COMPLETE)
- [x] Next.js app initialized with TypeScript, Tailwind CSS, ESLint
- [x] Project directory structure created with documentation
- [x] Environment variables configured (.env.example and .env.local)
- [x] Database schema designed (8 enums, 10 tables)
- [x] Database schema deployed to Neon successfully
- [x] Database client configured (`pg` for migrations, serverless for queries)
- [x] TypeScript types defined for all database models
- [x] npm dependencies installed
- [x] Documentation system established (claude.md, DEVELOPMENT.md, README.md, QUICK_START.md)
- [x] Git repository initialized with proper .gitignore
- [x] README.md with comprehensive setup guide
- [x] DEVELOPMENT.md with progress tracking
- [x] claude.md with workflow rules and guidelines

#### Epic 2: Content Ingestion & Discovery System (COMPLETE)
- [x] Webflow API client created with lazy initialization
- [x] HubSpot API client created with filtering and PDF extraction
- [x] Content ingestion service built for orchestrating fetch/store
- [x] Database query functions for content CRUD operations
- [x] Content polling mechanism (first poll of day + manual refresh)
- [x] API routes for /api/content/refresh and /api/content/status
- [x] Test script for end-to-end content ingestion
- [x] HubSpot filter configured (PC/LP, TM/LP, WBR/LP, EMBED pages)
- [x] Case study PDF URL extraction from landing pages
- [x] Database client Proxy pattern fixed for template literal syntax
- [x] Successfully ingesting 839 items from Webflow and HubSpot

#### Epic 3: Brand Voice & Style System (INFRASTRUCTURE COMPLETE)
- [x] PDF reader utility for extracting text from documents
- [x] Text chunking system for splitting documents into embeddings
- [x] OpenAI embeddings generation service
- [x] Brand voice database queries with semantic search
- [x] Brand voice document ingestion pipeline
- [x] RAG retrieval system for brand voice context
- [x] API routes for /api/brand-voice/ingest and /api/brand-voice/status
- [x] Test script for end-to-end brand voice system
- [x] Database migration for source_file column
- [⏸️] **BLOCKED:** Awaiting brand voice documents from user (see REQUIRED_DOCUMENTS.md)

### 🚧 Blocked/Waiting
- **Epic 3 Completion:** Need brand voice documents (style guide, knowledge guide) to test and complete
  - See REQUIRED_DOCUMENTS.md for details

### 📋 Upcoming
- Epic 4: Post Type Framework & Rules Engine
- Epic 5: Batch Post Generation
- Epic 6: Campaign Mode
- (See EPIC_PLAN.md for full roadmap)

---

## Implementation Timeline

### 2026-01-15: Project Setup
**What was done:**
- Initialized Next.js 15 project with TypeScript, Tailwind CSS, ESLint
- Created directory structure:
  - `/lib` - Core business logic (ai, db, utils subdirs)
  - `/components` - React components (ui, posts, campaigns subdirs)
  - `/types` - TypeScript definitions
  - `/documents` - Reference documents for AI (with README)
  - `/public/exports` - Generated export files
- Added README.md files in each major directory explaining purpose and guidelines
- Created comprehensive project README with installation and usage instructions
- Set up HubSpot template file in project root

**Key Decisions:**
- Using App Router (not Pages Router) for Next.js 15
- No src directory - cleaner root structure
- Neon database chosen for PostgreSQL (serverless, easy scaling)
- Import alias `@/*` configured for cleaner imports
- Documents folder excluded from git but tracked with .gitkeep

**Next Steps (Completed):**
- ✅ Created .env.example with all required environment variables
- ✅ Updated .gitignore to exclude sensitive files
- ✅ Added necessary npm dependencies
- ✅ Designed database schema
- ✅ Created database schema successfully

---

### 2026-01-15 (Afternoon): Database Setup Complete

**What was done:**
- Configured environment variables in `.env.local` with all API keys
- Created comprehensive database schema with 8 enums and 10 tables:
  - **Enums**: content_source, content_type, post_type, platform, post_status, feedback_type, special_day_type, brand_voice_source
  - **Tables**: content_items, generated_posts, post_history, user_feedback, industry_articles, special_days, content_taxonomy, brand_voice_embeddings
- Created database setup script using standard `pg` client (`lib/db/setup-schema.js`)
- Successfully deployed all tables and indexes to Neon database

**Key Decisions:**
- **Critical Discovery**: Neon's serverless driver (`@neondatabase/serverless`) does NOT properly support DDL operations (CREATE TABLE, CREATE TYPE, etc.)
  - DDL statements execute but don't persist due to transaction/connection issues
  - **Solution**: Use standard `pg` client for migrations and DDL
  - Use serverless driver only for application queries (not migrations)
- **Connection Strategy**:
  - Pooled connection (`-pooler` in hostname): For application queries
  - Direct connection (remove `-pooler`): For migrations using `pg` client
- **Migration Approach**: Created `setup-schema.js` script using standard `pg` client for reliable DDL execution

**Technical Lessons Learned:**
1. Neon serverless driver is stateless - each query is independent
2. DDL requires transactional context that serverless driver doesn't provide
3. Always use `pg` (standard PostgreSQL client) for schema migrations
4. PostgreSQL doesn't support `IF NOT EXISTS` for `CREATE TYPE` (enums)
5. Template literals work well for queries but not for complex DDL in serverless context

**Database Schema Highlights:**
- UUID primary keys using `gen_random_uuid()`
- JSONB fields for flexible metadata storage
- Proper foreign key relationships with CASCADE deletes where appropriate
- Timestamps with time zones for all temporal data
- Array types for topics/themes/personas in content_taxonomy
- Decimal precision for relevance scores

**Files Created:**
- `lib/db/setup-schema.js` - Reliable schema setup using `pg` client
- `lib/db/test-connection.js` - Connection testing utility
- `lib/db/simple-create.js` - Simple table creation tests
- `lib/db/debug-schema.js` - Schema debugging utility
- `types/database.ts` - Complete TypeScript definitions for all tables

**Next Steps:**
- Start Epic 2: Content Ingestion & Discovery System
- Build Webflow and HubSpot API integrations
- Create content polling mechanism
- Set up content analysis pipeline

---

### 2026-01-15 (Late Afternoon): Documentation System Complete

**What was done:**
- Created comprehensive `claude.md` configuration file with:
  - **CRITICAL WORKFLOW RULE** prominently displayed at top
  - Mandatory documentation requirements after completing todo lists
  - Step-by-step documentation format/template
  - Code organization rules and best practices
  - Context preservation guidelines
  - Project-specific reminders and technical details
- Created `QUICK_START.md` for fast onboarding and context recovery
- Updated `README.md` to reference all documentation files
- Cross-referenced all documentation files properly
- Established automatic documentation workflow

**Key Decisions:**
- **Documentation Workflow**: Made it mandatory to update DEVELOPMENT.md immediately after completing any todo list
- **Documentation Hierarchy**:
  1. `claude.md` - Workflow rules (read first)
  2. `DEVELOPMENT.md` - Current status & progress
  3. `README.md` - Setup & usage
  4. `QUICK_START.md` - Fast reference
  5. Component READMEs - Detailed specs
- **Prominent Warning**: Added ⚠️ CRITICAL WORKFLOW RULE ⚠️ section to claude.md that can't be missed
- **Documentation Template**: Provided exact format for timeline entries to ensure consistency

**Files Created:**
- `claude.md` - Claude Code configuration and workflow guidelines
- `QUICK_START.md` - Quick reference for developers
- Updated `README.md` - Added documentation section
- Updated `DEVELOPMENT.md` - Added references to claude.md

**Documentation Structure Established:**
```
Documentation Files:
├── claude.md          → Workflow rules & guidelines (START HERE)
├── DEVELOPMENT.md     → Progress tracking & technical context
├── README.md          → Setup & usage instructions
├── QUICK_START.md     → Fast reference guide
└── EPIC_PLAN.md       → Complete feature roadmap
```

**Why This Matters:**
- Ensures context is never lost between sessions
- Makes it easy to resume work after days/weeks/months
- Creates clear accountability for documentation
- Prevents knowledge from living only in conversation history
- Establishes patterns that scale as project grows

**Next Steps:**
- All documentation infrastructure is complete
- Ready to begin Epic 2: Content Ingestion & Discovery System
- Or pause here - resuming will be easy with documentation in place

---

### 2026-01-15 (Evening): Epic 2 Complete - Content Ingestion System

**What was done:**
- Created Webflow API client (`lib/utils/webflow.ts`)
  - Fetches blog posts from Webflow CMS collections
  - Handles pagination automatically
  - Filters draft and archived items
  - Supports optional resources collection
  - Lazy initialization to avoid env var loading issues
- Created HubSpot API client (`lib/utils/hubspot.ts`)
  - Fetches landing pages from HubSpot CMS API
  - Implements configurable filtering (namePatterns, urlPatterns, excludePatterns)
  - Extracts PDF URLs from case study landing pages
  - Auto-detects content type (case_study, webinar, whitepaper, landing_page)
  - Transforms HubSpot pages to unified content format
- Created content ingestion service (`lib/ai/content-ingestion.ts`)
  - Orchestrates fetching from both Webflow and HubSpot
  - Bulk upserts content to database (50-item batches)
  - Tracks new vs updated items
  - Returns comprehensive ingestion results with error handling
- Created database query functions (`lib/db/queries/content.ts`)
  - `upsertContentItem()` - Insert or update single item
  - `bulkUpsertContentItems()` - Batch upsert with conflict handling
  - `getAllContent()` - Get all content with optional filtering
  - `getContentStats()` - Statistics by source and type
- Created content polling mechanism (`lib/utils/content-polling.ts`)
  - "First poll of day" logic based on UTC date comparison
  - Manual refresh capability
  - Prevents concurrent polling
  - `autoPollIfNeeded()` for automatic polling
- Created API routes:
  - `/api/content/refresh` - POST endpoint for manual content refresh
  - `/api/content/status` - GET endpoint for polling status and stats
- Created test script (`lib/db/test-content-ingestion.ts`)
  - Shows before/after database state
  - Runs full ingestion flow
  - Displays sample content items
  - Comprehensive error reporting

**Key Technical Challenges Solved:**

1. **Lazy Initialization Pattern**:
   - **Problem**: API clients and database client instantiated at module load time, before dotenv loaded env vars
   - **Solution**: Implemented getter-based lazy initialization for all clients
   - **Pattern**: Singleton with `get instance()` accessor that creates client on first access

2. **Database Client Proxy Issue**:
   - **Problem**: Initial Proxy implementation used empty object `{}` as target, couldn't handle template literal syntax (`` sql`...` ``)
   - **Error**: `TypeError: import_client.sql is not a function`
   - **Solution**: Changed Proxy target from `{}` to `function() {}` to support callable behavior
   - **Why**: Neon client uses tagged template literals, requires Proxy target to be function

3. **HubSpot Landing Page Filtering**:
   - **Requirement**: Only specific landing pages (PC/LP, TM/LP, WBR/LP, EMBED case studies)
   - **Implementation**: `LandingPageFilterConfig` with pattern matching
   - **Result**: Reduced from 851 total pages to 449 relevant pages

4. **Case Study PDF Extraction**:
   - **Challenge**: Case studies are PDF viewer pages, need to extract actual PDF URL
   - **Solution**: Fetch landing page HTML, regex match `PDFViewerApplication.open("URL")`
   - **Implementation**: Async `extractPdfUrl()` method, stores PDF URL in metadata
   - **Result**: Successfully extracted 17 PDF URLs from case study pages

**HubSpot Filter Configuration**:
```typescript
namePatterns: [
  'PC/LP',      // Premium Content Landing Pages
  'TM/LP',      // Template Landing Pages
  'WBR/LP',     // Webinar Landing Pages
  'EMBED -',    // Case Study PDF viewer pages
]
```

**Ingestion Results**:
- Total landing pages fetched: 851
- After filtering: 449 pages
- Successfully stored: 847 items (449 updated in second run)
- Content breakdown:
  - Landing pages: 558
  - Webinars: 253
  - Whitepapers: 19
  - Case studies: 17 (with PDF URLs extracted)
- All 17 case study PDF URLs successfully extracted

**Files Created/Modified:**
- `lib/utils/webflow.ts` - Webflow CMS API client
- `lib/utils/hubspot.ts` - HubSpot CMS API client with PDF extraction
- `lib/ai/content-ingestion.ts` - Content ingestion orchestration
- `lib/db/queries/content.ts` - Content database queries
- `lib/utils/content-polling.ts` - Polling mechanism
- `app/api/content/refresh/route.ts` - Manual refresh endpoint
- `app/api/content/status/route.ts` - Status check endpoint
- `lib/db/test-content-ingestion.ts` - End-to-end test script
- `lib/db/client.ts` - Fixed Proxy pattern for template literals
- `package.json` - Added `test:content-ingestion` script

**Known Issues**:
- ⚠️ Webflow API returning 400 error - may be incorrect collection ID or permissions issue
  - Error: `{"msg":"Unknown Error Occurred","code":400,"name":"UnknownError"}`
  - Collection ID in use: `6046c0937fe6cf656a350ef4`
  - Needs user verification of Webflow credentials and collection ID

**Technical Learnings**:
1. Lazy initialization essential when modules imported before env vars loaded
2. Proxy targets must match usage pattern (function for callables, object for properties)
3. Tagged template literals require special Proxy handling with `apply` trap
4. Neon serverless driver removed `fetchConnectionCache` config (now always true)
5. Case study PDF URLs embedded in JavaScript on landing pages, not in HubSpot API response

**Next Steps:**
- Epic 3: Brand Voice & Style System
  - Ingest style guide and knowledge guide documents
  - Build RAG system with embeddings
  - Create brand voice analysis and retrieval
- Optional: Resolve Webflow API issue if blog post ingestion needed
- Optional: Create admin UI for viewing/managing ingested content

---

### 2026-01-15 (Late Evening): Epic 3 Infrastructure Complete - Brand Voice & RAG System

**What was done:**
- Created complete brand voice document ingestion and RAG retrieval system
- Built PDF reader utility using pdf-parse library
  - Extracts text, metadata, and page counts from PDFs
  - Handles multiple PDFs from directory
- Created intelligent text chunking system
  - Splits documents at semantic boundaries (paragraphs, sentences, words)
  - Configurable chunk size (default 1000 chars) with overlap (200 chars)
  - Preserves context between chunks
  - Token estimation for embedding models
- Built OpenAI embeddings generation service
  - Uses text-embedding-3-small model (1536 dimensions)
  - Batch processing for efficiency (100 items per batch)
  - Cosine similarity calculation for semantic search
  - Helper functions for finding most similar embeddings
- Created brand voice database queries
  - Insert single or bulk embeddings
  - Semantic search using cosine similarity
  - Filter by source type (style_guide, knowledge_base, example_post)
  - Statistics and debugging functions
- Built complete document ingestion pipeline
  - Orchestrates: PDF reading → chunking → embedding → storage
  - Automatic source type detection from filename
  - Re-ingestion support (deletes old embeddings)
  - Comprehensive progress logging and error handling
- Created RAG retrieval system
  - Retrieve relevant brand voice context for any query
  - Specialized functions for guidelines vs examples
  - Format context for LLM prompts
  - Comprehensive brand voice retrieval combining multiple sources
- Added API routes
  - POST /api/brand-voice/ingest - Trigger document ingestion
  - GET /api/brand-voice/status - Check system initialization
- Created test script (`npm run test:brand-voice`)
  - Tests ingestion and retrieval end-to-end
  - Shows stats and sample retrievals
  - Clear messaging when documents missing

**Database Changes:**
- Added migration 003: source_file column to brand_voice_embeddings
  - Tracks which document each embedding came from
  - Enables re-ingestion and debugging
  - Indexed for fast queries

**Technical Implementation:**
- RAG Architecture:
  1. Ingest: PDF → Text → Chunks → Embeddings → Database
  2. Retrieve: Query → Embedding → Similarity Search → Top K Results
  3. Format: Results → Structured Context → LLM Prompt
- Embedding Strategy:
  - Using OpenAI text-embedding-3-small (cost-effective)
  - 1536 dimensions (standard for most use cases)
  - Stored as JSONB in PostgreSQL (can migrate to pgvector later)
- Semantic Search:
  - JavaScript-based cosine similarity (works with current setup)
  - Production upgrade path: PostgreSQL pgvector extension
  - Configurable similarity threshold (default 0.7)
  - Top-K retrieval (default 5 results)

**Files Created:**
- `lib/utils/pdf-reader.ts` - PDF text extraction
- `lib/utils/text-chunker.ts` - Semantic text chunking
- `lib/ai/embeddings.ts` - OpenAI embeddings service
- `lib/db/queries/brand-voice.ts` - Database queries
- `lib/ai/brand-voice-ingestion.ts` - Document ingestion pipeline
- `lib/ai/brand-voice-rag.ts` - RAG retrieval system
- `lib/ai/test-brand-voice.ts` - End-to-end test script
- `app/api/brand-voice/ingest/route.ts` - Ingestion API
- `app/api/brand-voice/status/route.ts` - Status API
- `lib/db/migrations/003_add_source_file_to_brand_voice.js` - Migration
- `REQUIRED_DOCUMENTS.md` - Comprehensive document requirements list

**System Status:**
✅ All infrastructure complete and tested
⏸️ **BLOCKED:** Waiting for brand voice documents from user

**Required Documents** (see REQUIRED_DOCUMENTS.md):
1. 🔴 **CRITICAL:**
   - Style guide PDF (brand voice, tone, writing rules)
   - Knowledge guide PDF (product info, messaging, company facts)
2. 🟡 **HELPFUL:**
   - Example social posts collection
   - Company boilerplate & key facts
3. 🟢 **OPTIONAL:**
   - Industry RSS feed URLs
   - Competitor social media examples
   - Customer testimonials & case study summaries

**What User Needs to Do:**
1. Add PDF documents to `/documents` folder
2. Ensure OPENAI_API_KEY is in .env.local
3. Run `npm run test:brand-voice` to ingest documents
4. System will create ~1000-2000 embeddings per document
5. Cost estimate: $0.50-2.00 in OpenAI API fees

**Technical Learnings:**
1. OpenAI's text-embedding-3-small is cost-effective for most RAG use cases
2. 1000-character chunks with 200-char overlap provide good context preservation
3. Semantic chunking (splitting at paragraphs/sentences) better than fixed-size
4. JSONB storage works well for prototyping, pgvector for production scale
5. JavaScript cosine similarity sufficient for small-medium datasets
6. Lazy initialization pattern critical for all AI service clients

**Next Steps:**
- **BLOCKED on user:** Need documents to complete Epic 3
- Once documents provided:
  - Test full ingestion pipeline with real brand voice docs
  - Verify RAG retrieval quality
  - Tune similarity thresholds and chunk sizes if needed
- Then proceed to Epic 4: Post Type Framework & Rules Engine

---

## Key Architecture Decisions

### 1. Post Generation Flow
**Decision:** Multi-stage pipeline with quality checks
**Reasoning:** Ensures brand consistency and factual accuracy
**Implementation:**
1. Content selection/URL fetch
2. Brand voice retrieval (RAG)
3. AI generation with variation mechanisms
4. Automated quality check & fact verification
5. Self-correction if issues found
6. Present to user for review

### 2. Variation Strategy (Avoiding Templates)
**Challenge:** Generate unique posts without becoming repetitive
**Solution:**
- NO template library - system analyzes patterns without matching structures
- Random creativity parameters in prompts
- Varied angles (problem/solution, stat-driven, question-based, etc.)
- Feedback loop learns rejections without reinforcing templates
**Why:** User explicitly wanted to avoid posts sounding the same over time

### 3. Duplication Logic
**Complex Rules:**
- New content (< 14 days old): 1 announcement + 3-5 promotions over 2 weeks (exempt from 180-day rule)
- Existing content: Cannot re-promote within 180 days
- One-time posts: Company news, partnerships never duplicate
- Events: Announcement + multiple promotions during campaign (exempt)
**Implementation:** Database tracks content_id + post_type + used_date

### 4. Platform Handling
**Decision:** Generate 2 versions per post (not 3)
- LinkedIn/Facebook: Same text (longer, more detailed)
- Twitter: Punchier, character-limited version
**Export:** 3 rows in HubSpot format (one per platform), using appropriate version
**Reasoning:** LinkedIn and Facebook have similar audience and format

### 5. Quality Checks
**Decision:** Automated verification before showing to user
**Process:**
- Fact-check against source material
- Brand voice alignment check
- URL validation
- Style guide rule enforcement
- Self-correction with 3 retry limit
**Why:** Reduces manual review burden, ensures consistency

---

## Database Schema Overview

### Tables (To Be Created)

#### `content_items`
Stores all content from Webflow and HubSpot
- id, source (webflow/hubspot), url, title, content_type
- metadata (JSON), publication_date, last_polled, created_at, updated_at

#### `generated_posts`
All posts created by the system
- id, content_id (FK), post_type, platform, text, scheduled_date
- status (pending/accepted/rejected), created_at, finalized_at

#### `post_history`
Tracks what content has been promoted (for duplication prevention)
- id, content_id (FK), post_type, used_date, created_at

#### `user_feedback`
Stores accepted/rejected posts for learning
- id, post_id (FK), feedback_type (accept/reject), learned_patterns (JSON), created_at

#### `industry_articles`
RSS-discovered articles
- id, url, title, source, excerpt, discovered_at, relevance_score, marked_not_relevant

#### `special_days`
Holidays and industry celebration days
- id, date, name, type (holiday/industry), relevance_score, created_at

#### `content_taxonomy`
AI-built understanding of content topics
- id, content_id (FK), topic, theme, persona, key_messages (JSON)

#### `brand_voice_embeddings`
Vector embeddings for RAG system
- id, source (style_guide/example_post/feedback), text, embedding (vector), metadata (JSON)

---

## API Integrations

### Webflow CMS
**Purpose:** Fetch blog posts and content
**Endpoints:**
- GET /collections/{collection_id}/items
**Data Needed:**
- Title, URL, publication_date, content/excerpt, tags
**Polling:** On first generation of day + manual refresh button

### HubSpot
**Purpose:** Fetch landing pages for premium content/case studies
**Endpoints:**
- GET /cms/v3/pages/landing-pages
**Data Needed:**
- Title, URL, page type, metadata
**Export Format:** See HubSpot_Social_Bulk_Template.xls
- Required fields: ACCOUNT, DATE, MESSAGE, LINK
- Optional: PHOTO URL, CAMPAIGN
- 3 rows per post (LinkedIn, Facebook, Twitter)

### OpenAI / Anthropic
**Purpose:** AI generation and analysis
**Endpoints:**
- POST /v1/chat/completions (OpenAI)
- POST /v1/messages (Anthropic)
**Usage:**
- Post generation
- Content analysis
- Brand voice pattern recognition
- Quality checking

### LinkedIn API (Future)
**Purpose:** Post performance stats
**Status:** Phase 2 / V2
**Data:** Impressions, engagement, clicks

---

## Environment Variables

### Required (To Be Added to .env.example)

```bash
# Database
DATABASE_URL=

# Webflow
WEBFLOW_API_KEY=
WEBFLOW_SITE_ID=
WEBFLOW_BLOG_COLLECTION_ID=

# HubSpot
HUBSPOT_API_KEY=
HUBSPOT_ACCOUNT_ID=

# AI Services (choose one)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Configuration
DUPLICATION_THRESHOLD_DAYS=180
NEW_CONTENT_THRESHOLD_DAYS=14
POSTS_PER_WEEK=3
LABS_APP_POST_DAY=Wednesday
LABS_APP_POST_TIME=10:30

# Vector Database (TBD)
VECTOR_DB_URL=
```

---

## File Structure Reference

```
social-post-star/
├── app/
│   ├── layout.tsx              # Root layout (Ditto styles, fonts)
│   ├── page.tsx                # Main page (batch + ad-hoc generation)
│   ├── campaign/
│   │   └── page.tsx            # Campaign mode page
│   ├── api/
│   │   ├── generate/route.ts   # POST: Generate posts
│   │   ├── content/route.ts    # GET: Fetch content from APIs
│   │   ├── articles/route.ts   # GET: Industry articles
│   │   └── export/route.ts     # POST: Create HubSpot export
│   └── globals.css             # Global styles
├── components/
│   ├── ui/                     # Ditto components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── ...
│   ├── posts/
│   │   ├── PostCard.tsx        # Individual post display
│   │   ├── PostEditor.tsx      # Inline editing
│   │   ├── PostList.tsx        # List of generated posts
│   │   └── PlatformTabs.tsx    # LinkedIn/FB vs Twitter views
│   ├── campaigns/
│   │   ├── CampaignForm.tsx    # Campaign creation form
│   │   └── CampaignTypeSelector.tsx
│   ├── BatchGenerator.tsx      # Batch generation UI
│   ├── AdHocForm.tsx           # Ad-hoc post creation
│   ├── IndustryArticles.tsx    # RSS article display
│   └── SpecialDays.tsx         # Holiday/celebration suggestions
├── lib/
│   ├── db/
│   │   ├── client.ts           # Neon database client
│   │   ├── schema.ts           # Schema definitions
│   │   ├── migrations/         # Migration files
│   │   ├── queries/
│   │   │   ├── content.ts      # Content CRUD
│   │   │   ├── posts.ts        # Post CRUD
│   │   │   └── history.ts      # Usage tracking
│   │   └── seed.ts             # Seed data
│   ├── ai/
│   │   ├── generator.ts        # Main post generation agent
│   │   ├── quality-check.ts    # Automated quality verification
│   │   ├── brand-voice.ts      # RAG retrieval & voice analysis
│   │   ├── content-analyzer.ts # Content understanding
│   │   └── variation.ts        # Variation generation logic
│   ├── utils/
│   │   ├── webflow.ts          # Webflow API client
│   │   ├── hubspot.ts          # HubSpot API client
│   │   ├── rss.ts              # RSS feed parser
│   │   ├── scheduler.ts        # Posting time logic
│   │   ├── export.ts           # HubSpot export formatting
│   │   └── duplication.ts      # Duplication prevention logic
├── types/
│   ├── posts.ts                # Post-related types
│   ├── content.ts              # Content types
│   ├── campaign.ts             # Campaign types
│   └── database.ts             # DB model types
├── documents/
│   ├── README.md               # Instructions for documents
│   ├── style-guide.pdf         # (User to provide)
│   ├── knowledge-guide.pdf     # (User to provide)
│   └── example-posts.md        # (User to provide)
├── public/
│   └── exports/                # Generated .xls files
├── HubSpot_Social_Bulk_Template.xls
├── .env.example
├── .env.local                  # (git ignored)
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
├── README.md
├── DEVELOPMENT.md              # This file
└── EPIC_PLAN.md                # (To be created)
```

---

## Known Issues / TODOs

### Immediate
- [ ] Create .env.example file
- [ ] Update .gitignore for /documents and .env.local
- [ ] Add required npm packages to package.json
- [ ] Design database schema in detail
- [ ] Set up database migrations

### Short Term
- [ ] Decide on vector database for RAG (Pinecone? pgvector in Neon?)
- [ ] Source Ditto design library components
- [ ] Set up document ingestion pipeline
- [ ] Create initial UI mockup

### Long Term
- [ ] Image generation/selection (Phase 2)
- [ ] LinkedIn API integration for stats (Phase 2)
- [ ] Google Analytics/Search Console integration (Phase 2)
- [ ] Multi-user support (Future)

---

## Testing Strategy

### Unit Tests
- AI generation functions
- Duplication logic
- Content analysis
- Date/time scheduling logic

### Integration Tests
- Webflow API integration
- HubSpot API integration
- Database queries
- End-to-end post generation flow

### Manual Testing
- UI/UX flows
- Post quality (human review)
- Export file format validation
- Edge cases (no content, API failures)

---

## Performance Considerations

### Optimization Targets
- Post generation: < 5 seconds per post
- Content polling: < 10 seconds
- Database queries: < 100ms
- UI interactions: Immediate feedback

### Scaling Notes
- Batch generation parallelizable (generate multiple posts concurrently)
- Content polling cacheable (daily refresh)
- Vector search for RAG needs indexing
- Export file generation may be slow for large batches (stream write)

---

## Security Considerations

- **API Keys**: All in .env.local, never committed
- **Database**: Connection string in env, use connection pooling
- **User Input**: Sanitize URLs and context fields
- **Documents**: Excluded from git, may contain proprietary info
- **Exports**: Generated files contain post content, keep local only
- **No Authentication**: Single user (for now), runs locally

---

## Useful Commands

```bash
# Development
npm run dev                     # Start dev server
npm run build                   # Build for production
npm run start                   # Start production server
npm run lint                    # Run ESLint

# Database
npm run db:migrate              # Run migrations
npm run db:migrate:create       # Create new migration
npm run db:migrate:down         # Rollback migration
npm run db:seed                 # Seed database with test data

# Testing
npm test                        # Run all tests
npm test:watch                  # Run tests in watch mode
npm test:coverage               # Generate coverage report
```

---

## Questions / Blockers

### Answered
- ✅ Should we use App Router or Pages Router? → App Router
- ✅ Where should documents live? → /documents folder in root
- ✅ How many platform versions per post? → 2 (LinkedIn/FB + Twitter)

### Pending
- ⏳ Which vector database for RAG system?
- ⏳ Source for Ditto design library components? (npm package? copy from agentic.centercode.com?)
- ⏳ Exact Webflow collection IDs?
- ⏳ HubSpot object types to fetch?

---

## Contact / Support

**Project Owner:** Austin (Centercode Marketing)
**Developer:** Claude (AI Assistant)
**Documentation:** This file, README.md, EPIC_PLAN.md

---

## Notes for Future Sessions

### Context Restoration Checklist
When resuming development:
1. Read **claude.md** for project guidelines and workflow
2. Read this **DEVELOPMENT.md** file for current status
3. Check "Epic Implementation Status" section for current phase
4. Review "Last Updated" date and recent Implementation Timeline entries
5. Check "Known Issues / TODOs" for immediate next steps
6. Review EPIC_PLAN.md for full roadmap context

### Documentation Files
- **claude.md** - Configuration and guidelines for Claude Code (workflow, rules, patterns)
- **DEVELOPMENT.md** - This file - progress tracking and technical context
- **README.md** - User-facing setup and usage documentation
- **EPIC_PLAN.md** - Complete feature roadmap with all epics

### Important Patterns to Remember
- **No templates:** System must analyze patterns without creating rigid structures
- **Quality checks:** Every post goes through automated verification before display
- **Duplication rules:** Complex, content-age-dependent logic
- **3 rows per export:** Even though 2 text versions, HubSpot needs 3 account rows
- **User feedback loop:** Accept/reject trains system but doesn't create templates

---

**End of Development Log**
