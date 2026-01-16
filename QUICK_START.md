# Quick Start Guide

Get up and running with Social Post Star in 5 minutes.

## For First Time Setup

1. **Clone and Navigate**
   ```bash
   cd social-post-star
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your API keys
   ```

4. **Setup Database**
   ```bash
   node lib/db/setup-schema.js
   ```

5. **Add Documents**
   - Place brand documents in `/documents` folder:
     - `style-guide.pdf` - Brand voice guidelines
     - `knowledge-guide.pdf` - Company/industry info
     - `example-posts.md` - Sample successful posts
   - See `/documents/README.md` for details

6. **Start Development**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## For Resuming Development

### Quick Context Recovery (2 minutes)

1. **Read Documentation in Order:**
   ```bash
   # 1. Project guidelines (5 min read)
   cat claude.md

   # 2. Current status (scroll to "Implementation Timeline" for recent work)
   cat DEVELOPMENT.md

   # 3. Check epic status (find current epic)
   grep -A 5 "Epic Implementation Status" DEVELOPMENT.md
   ```

2. **Check What's Next:**
   - Look at "Next Steps" in the most recent DEVELOPMENT.md timeline entry
   - Check "Known Issues / TODOs" section
   - Review current epic in "Epic Implementation Status"

3. **Start Working:**
   ```bash
   npm run dev
   ```

### File Navigation Quick Reference

```
social-post-star/
├── claude.md              ⭐ READ FIRST - Workflow rules
├── DEVELOPMENT.md         ⭐ Current status & progress
├── README.md              📖 Setup & usage docs
├── EPIC_PLAN.md          📋 Full roadmap
├── QUICK_START.md        ⚡ This file
│
├── .env.local            🔐 Your API keys (git-ignored)
├── .env.example          📝 Template for env vars
│
├── app/                  🎨 Next.js pages
├── components/           🧩 React components
├── lib/                  ⚙️  Core logic
│   ├── ai/              🤖 AI generation
│   ├── db/              💾 Database code
│   └── utils/           🛠️  Helpers
├── types/               📘 TypeScript definitions
├── documents/           📄 Brand guides (add yours)
└── public/              🌐 Static assets
```

## Common Commands

### Development
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Check code style
npm run type-check   # Check TypeScript
```

### Database
```bash
node lib/db/setup-schema.js      # Create/reset schema
node lib/db/test-connection.js   # Test DB connection
```

### Git
```bash
git status           # Check what changed
git add .            # Stage all changes
git commit -m "msg"  # Commit with message
git push             # Push to remote
```

## Documentation Workflow

**IMPORTANT:** After completing any work session:

1. Mark todos complete with TodoWrite
2. **Update DEVELOPMENT.md** with new timeline entry:
   ```markdown
   ### YYYY-MM-DD: [Title]

   **What was done:**
   - Item 1
   - Item 2

   **Key Decisions:**
   - Decision 1

   **Next Steps:**
   - Next thing to do
   ```
3. Update "Project Status" and "Epic Implementation Status" sections
4. Commit changes

See `claude.md` for complete documentation requirements.

## Troubleshooting

### Database Issues
```bash
# Reset and recreate schema
node lib/db/setup-schema.js

# Test connection
node lib/db/test-connection.js
```

### Environment Issues
```bash
# Verify env vars are loaded
node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env.DATABASE_URL ? '✓ DB URL loaded' : '✗ DB URL missing')"
```

### Type Errors
```bash
npm run type-check
```

## Getting Help

1. Check `DEVELOPMENT.md` "Troubleshooting" section
2. Review `README.md` "Troubleshooting" section
3. Search `DEVELOPMENT.md` for similar issues (Ctrl+F)
4. Check "Technical Lessons Learned" in recent timeline entries

## Key Reminders

- ✅ Always document progress in DEVELOPMENT.md
- ✅ Use `pg` client for database migrations (not serverless driver)
- ✅ Use direct connection (no `-pooler`) for migrations
- ✅ Never commit `.env.local` or API keys
- ✅ Follow guidelines in `claude.md`

## Current Project Status

Check the top of `DEVELOPMENT.md` for:
- Current phase
- Last updated date
- What's completed
- What's next

---

**Ready to Start?** → Read `claude.md` then `DEVELOPMENT.md` and you're good to go! 🚀
