# Social Post Star

An AI-powered social media post generator for Centercode's marketing team. This tool uses intelligent agents and brand voice analysis to create unique, on-brand social media posts for LinkedIn, Facebook, and Twitter.

## Overview

Social Post Star helps automate social media content creation while maintaining Centercode's brand voice and messaging consistency. The tool can:

- **Batch generate** multiple posts from existing content (blogs, whitepapers, case studies)
- **Create ad-hoc posts** from any URL or custom context
- **Run campaigns** with multiple posts spread over time (content launches, events, feature spotlights)
- **Discover industry articles** for sharing relevant content
- **Suggest special days** for celebration/acknowledgment posts
- **Export to HubSpot** bulk upload format
- **Learn from feedback** to improve over time

## Features

### Post Types
1. Content Announcement (new content launch)
2. Content Promotion (existing content)
3. Social Proof (case studies)
4. Centercode Feature (platform features/services)
5. Company News
6. Event Announcement
7. Event Promotion
8. Sharing Industry Article
9. Centercode Labs App Launch
10. Centercode Labs App Promotion
11. Partnership Announcement
12. Holiday Celebration
13. Industry Day Celebration
14. Other (catch-all)

### Key Capabilities
- **Brand Voice Alignment**: Uses style guide and example posts to maintain consistent voice
- **Quality Checks**: Automated fact-checking and brand alignment verification
- **Platform Optimization**: Generates versions for LinkedIn/Facebook and Twitter
- **Smart Scheduling**: Suggests optimal posting times based on best practices
- **Duplication Prevention**: Tracks content usage to avoid over-promotion
- **Content Intelligence**: Analyzes content to understand topics and messaging

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Neon Database**: Account and connection string
- **API Keys**:
  - Webflow CMS API key
  - HubSpot API key
  - OpenAI or Anthropic API key (for AI generation)

## Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd social-post-star
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in all required API keys and configuration
   ```bash
   cp .env.example .env.local
   ```

4. **Add required documents**
   - Place the following files in the `/documents` folder:
     - `style-guide.pdf` or `style-guide.md` - Centercode brand guidelines
     - `knowledge-guide.pdf` or `knowledge-guide.md` - Company/industry information
     - `example-posts.md` - Collection of successful social posts
   - See `/documents/README.md` for detailed instructions

5. **Set up the database**
   ```bash
   npm run db:migrate
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open the application**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
social-post-star/
├── app/                    # Next.js app router pages
├── components/             # React components
│   ├── ui/                # Ditto design library components
│   ├── posts/             # Post-related components
│   └── campaigns/         # Campaign mode components
├── lib/                   # Core business logic
│   ├── ai/                # AI agents and generation logic
│   ├── db/                # Database models and queries
│   └── utils/             # Helper functions
├── types/                 # TypeScript type definitions
├── documents/             # Brand guides and reference docs (not in git)
├── public/                # Static assets
│   └── exports/           # Generated export files
└── HubSpot_Social_Bulk_Template.xls  # HubSpot import template
```

## Usage

### Batch Generation
1. Enter the number of posts you want to generate
2. Select post types from the multi-select checkboxes
3. Optionally add context/messaging guidance
4. Click "Generate Posts"
5. Review, edit, accept/reject posts
6. Click "Finalize" to export

### Ad-Hoc Posts
1. Click "Add Ad-Hoc Post"
2. Paste URL and select post type
3. Optionally add context
4. Posts are generated along with batch posts

### Campaign Mode
1. Navigate to Campaign Mode from the left menu
2. Select campaign type (Content Launch, Event Promotion, Feature Spotlight)
3. Enter URL and campaign details
4. Generate campaign posts with automatic scheduling

### Industry Articles
1. View discovered articles in the "Industry Articles" section
2. Select relevant articles with checkboxes
3. Selected articles generate "Sharing Industry Article" posts

### Special Days
1. View upcoming celebrations in "Upcoming Celebrations"
2. Select days to create celebration posts
3. System shows relevant days up to 2 months ahead

### Export to HubSpot
1. After finalizing posts, view in copy/paste format
2. Click "Export to File" for bulk upload
3. File downloads in HubSpot-compatible format
4. Upload to HubSpot's bulk import tool

## Configuration

### Environment Variables

See `.env.example` for all required configuration. Key variables:

- `DATABASE_URL` - Neon database connection string
- `WEBFLOW_API_KEY` - Webflow CMS API key
- `WEBFLOW_SITE_ID` - Webflow site identifier
- `HUBSPOT_API_KEY` - HubSpot API key
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` - AI service credentials
- `DUPLICATION_THRESHOLD_DAYS` - How long before content can be re-promoted (default: 180)
- `NEW_CONTENT_THRESHOLD_DAYS` - How many days content is considered "new" (default: 14)
- `POSTS_PER_WEEK` - Target posting cadence (default: 3)

## Development

### Running Tests
```bash
npm test
```

### Running Linter
```bash
npm run lint
```

### Database Migrations
```bash
# Create a new migration
npm run db:migrate:create migration-name

# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:down
```

### Building for Production
```bash
npm run build
npm start
```

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Neon (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Library**: Ditto Design Library (from agentic.centercode.com/ditto)
- **AI**: OpenAI GPT-4 or Anthropic Claude
- **Vector DB**: (TBD for RAG system)

## Troubleshooting

### "No documents found" error
- Ensure documents are placed in `/documents` folder
- Check filenames match expected patterns
- Verify files are readable (not corrupted)

### API connection errors
- Verify all API keys in `.env.local`
- Check API key permissions
- Ensure APIs are not rate-limited

### Database connection issues
- Verify `DATABASE_URL` is correct
- Ensure Neon database is accessible
- Check IP allowlist settings in Neon dashboard

### Posts sound repetitive
- Add more example posts to `/documents/example-posts.md`
- Review and reject repetitive posts (system learns)
- Check that style guide has diverse examples

## Support & Documentation

### Documentation Files

- **claude.md** - Configuration and workflow guidelines for Claude Code development
- **DEVELOPMENT.md** - Progress tracking, implementation notes, and technical context
- **EPIC_PLAN.md** - Complete feature roadmap with all epics
- **README.md** - This file - setup and usage instructions
- **Component READMEs** - Each major directory has its own documentation

### For Developers

If you're working on this project with Claude Code:
1. **Start by reading `claude.md`** - Contains critical workflow rules and guidelines
2. Then read `DEVELOPMENT.md` - Understand current project state
3. Follow the documentation workflow specified in `claude.md`

### Issues & Support

- **Issues**: Track in project management tool or GitHub issues
- **Context Recovery**: See `DEVELOPMENT.md` "Notes for Future Sessions" section

## License

Proprietary - Internal use only for Centercode

## Authors

Built for Centercode Marketing Team
