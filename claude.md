# Claude Code Configuration

This file contains instructions and guidelines for Claude Code when working on this project.

---

## ⚠️ CRITICAL WORKFLOW RULE ⚠️

**EVERY TIME you complete a todo list, you MUST:**

1. ✅ Mark all todos as completed with TodoWrite
2. 📝 **IMMEDIATELY update DEVELOPMENT.md** with a new timeline entry (see Section 1 below for format)
3. 🔄 Update project status and epic progress sections
4. 💾 Save and verify documentation is complete

**This is NON-NEGOTIABLE. Documentation happens as part of completing work, not after.**

---

## Project Context

**Project Name:** Social Post Star
**Purpose:** AI-powered social media post generator for Centercode's marketing team
**Tech Stack:** Next.js 15, TypeScript, Neon PostgreSQL, Anthropic Claude API
**Current Status:** See DEVELOPMENT.md for latest progress

## Critical Guidelines

### 1. Documentation Requirements

**MANDATORY: Whenever a todo list is completed, you MUST update DEVELOPMENT.md with:**

1. **Add a new dated section** to the "Implementation Timeline" with:
   - Date and time (e.g., "2026-01-15 (Afternoon): [Title]")
   - "What was done" - Bullet list of completed work
   - "Key Decisions" - Any important technical or architectural choices made
   - "Files Created/Modified" - List of significant files added or changed
   - "Next Steps" - What should be tackled next
   - "Technical Lessons Learned" (if applicable) - Important discoveries or gotchas

2. **Update the "Project Status" section** at the top:
   - Current phase/epic status
   - Last updated date
   - Mark completed epics as ✅

3. **Update the "Epic Implementation Status" section**:
   - Mark completed items with ✅
   - Update in-progress items
   - Add any new tasks discovered

**Example Documentation Pattern:**
```markdown
### 2026-01-15: [Short Title of Work Done]

**What was done:**
- Completed X feature
- Implemented Y functionality
- Fixed Z issue

**Key Decisions:**
- Chose approach A over B because...
- Decided to use library X for...

**Files Created:**
- `path/to/file.ts` - Description
- `path/to/other.ts` - Description

**Technical Lessons Learned:**
1. Discovery about how X works
2. Gotcha with Y that we solved by Z

**Next Steps:**
- Continue with Epic N
- Build feature X
```

### 2. Code Organization Rules

**Database Operations:**
- Use `pg` (standard PostgreSQL client) for ALL schema changes, migrations, DDL
- Use `@neondatabase/serverless` ONLY for application queries
- Never use serverless driver for CREATE TABLE, CREATE TYPE, ALTER TABLE, etc.
- Always use direct connection (without `-pooler`) for migrations

**File Structure:**
- `/lib/db` - Database clients, queries, migrations
- `/lib/ai` - AI generation logic, quality checks, RAG
- `/lib/utils` - Utility functions, API clients
- `/components/ui` - Reusable UI components from Ditto
- `/components/posts` - Post-specific components
- `/components/campaigns` - Campaign-specific components
- `/types` - TypeScript type definitions

**Import Aliases:**
- Use `@/` for imports from project root
- Example: `import { sql } from '@/lib/db/client'`

### 3. Development Workflow

**Before Starting Work:**
1. Read DEVELOPMENT.md to understand current state
2. Review the most recent "Implementation Timeline" entry
3. Check "Epic Implementation Status" for context
4. Note any "Technical Lessons Learned" that apply

**While Working:**
1. Use TodoWrite tool to track progress on multi-step tasks
2. Mark todos as in_progress when starting, completed when done
3. Keep exactly ONE todo as in_progress at a time
4. Document decisions as you make them (in comments if needed)

**After Completing Work:**
1. Mark all todos as completed
2. **IMMEDIATELY update DEVELOPMENT.md** following the pattern above
3. Commit changes with clear message
4. Ensure context is preserved for next session

### 4. Context Preservation

**For Long-Term Development:**
- DEVELOPMENT.md is the source of truth for project state
- README.md is for users/setup instructions
- In-code comments explain "why", not "what"
- Complex logic should have inline documentation

**For Resuming Work:**
- Start by reading DEVELOPMENT.md from top to bottom
- Focus on "Implementation Timeline" for recent changes
- Check "Questions / Blockers" section for open issues
- Review "Technical Lessons Learned" to avoid repeating mistakes

### 5. Testing & Quality

**Before Pushing Code:**
- Run `npm run type-check` to verify TypeScript
- Run `npm run lint` to check code style
- Test database connections if DB code changed
- Verify environment variables are not committed

**Database Changes:**
- Always test schema changes with `node lib/db/setup-schema.js`
- Verify tables created with test queries
- Document any schema changes in DEVELOPMENT.md

### 6. Security Best Practices

- Never commit `.env.local` or API keys
- Use environment variables for all sensitive data
- Validate user input before database queries
- Sanitize URLs in ad-hoc post creation
- Use parameterized queries to prevent SQL injection

### 7. AI & Brand Voice

**When Working on AI Features:**
- Brand voice consistency is paramount
- Avoid template-based generation (user explicitly doesn't want this)
- Implement variation mechanisms that don't become formulaic
- Quality checks must run before presenting posts to user
- Learning from feedback should not create templates

### 8. Common Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run type-check             # Check TypeScript

# Database
node lib/db/setup-schema.js    # Create/reset schema
node lib/db/test-connection.js # Test DB connection

# Git
git status                     # Check status
git add .                      # Stage changes
git commit -m "message"        # Commit with message
```

## Project-Specific Reminders

### Critical Technical Details

1. **Neon Database Connection:**
   - Pooled: `ep-xxx-pooler.xxx.neon.tech` - For app queries
   - Direct: `ep-xxx.xxx.neon.tech` - For migrations
   - Migrations must use direct connection and `pg` client

2. **Post Type Rules:**
   - New content (< 14 days): Exempt from 180-day duplication rule
   - One-time posts: Company news, partnerships (never duplicate)
   - Campaign posts: Events, content launches (exempt during campaign)
   - Existing content: 180-day threshold applies

3. **Platform Generation:**
   - Generate 2 versions: LinkedIn/Facebook (same) + Twitter (punchier)
   - Export has 3 rows: One per platform
   - No hashtags ever
   - CTAs preceded by "→ "

4. **HubSpot Export Format:**
   - Required fields: ACCOUNT, DATE, MESSAGE, LINK
   - Optional: PHOTO URL, CAMPAIGN
   - Date format: MM/DD/YY
   - Time format: 24-hour (HH:MM)
   - See `HubSpot_Social_Bulk_Template.xls` for reference

### User Preferences

- **No emojis** unless explicitly requested
- **No over-engineering** - solve the current problem, not hypothetical futures
- **No template libraries** - each post must be unique
- **Quality over speed** - automated checks before showing to user
- **Clear documentation** - always preserve context for future sessions

## Emergency Recovery

If you need to quickly restore context after a long break:

1. Read the most recent entry in DEVELOPMENT.md "Implementation Timeline"
2. Check "Project Status" to see current phase
3. Review "Epic Implementation Status" for todo list
4. Look at "Questions / Blockers" for known issues
5. Check "Technical Lessons Learned" for gotchas

## Notes

- This project uses meticulous documentation by design
- Context preservation is critical for jumping in/out of development
- DEVELOPMENT.md should always be up-to-date
- When in doubt, over-document rather than under-document
