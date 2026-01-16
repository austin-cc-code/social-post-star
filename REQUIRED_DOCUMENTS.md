# Required Documents for Social Post Star Development

This document lists all materials needed to complete development of the Social Post Star system.

---

## 🔴 CRITICAL - Needed to Complete Epic 3

These documents are required to finish the Brand Voice & Style System:

### 1. **Brand Voice & Style Guide** (PDF)
- **Filename:** `style-guide.pdf` or similar
- **Location:** Place in `/documents` folder
- **Purpose:** Used by RAG system to ensure all generated posts match Centercode's brand voice
- **Expected Contents:**
  - Tone and voice guidelines (professional, friendly, technical level)
  - Writing style rules (active vs passive voice, sentence structure)
  - Vocabulary preferences (approved/avoided terms)
  - Grammar and punctuation standards
  - Brand personality traits
  - Do's and don'ts for social media

### 2. **Knowledge & Messaging Guide** (PDF)
- **Filename:** `knowledge-guide.pdf` or similar
- **Location:** Place in `/documents` folder
- **Purpose:** Provides context about Centercode's products, services, and key messages
- **Expected Contents:**
  - Product descriptions and features
  - Key differentiators and value propositions
  - Common messaging themes
  - Industry terminology and definitions
  - Target audience characteristics
  - Competitor positioning
  - Common customer pain points and solutions

---

## 🟡 HELPFUL - Improves Post Quality

These documents would significantly improve post generation quality:

### 3. **Example Social Posts Collection** (PDF or Markdown)
- **Filename:** `example-posts.md` or `example-posts.pdf`
- **Location:** Place in `/documents` folder
- **Purpose:** Provides concrete examples of successful posts for the AI to learn from
- **Expected Contents:**
  - 10-20 high-performing social posts from each platform
  - Mix of different post types (content promotion, thought leadership, etc.)
  - Labeled with: platform, post type, performance metrics (optional)
  - Mix of topics covered

### 4. **Company Boilerplate & Key Facts** (PDF or Markdown)
- **Filename:** `company-facts.md` or similar
- **Location:** Place in `/documents` folder
- **Purpose:** Ensures consistent company information across all posts
- **Expected Contents:**
  - Official company description/boilerplate
  - Founding date and key milestones
  - Customer statistics and success metrics
  - Awards and recognition
  - Partner information
  - Office locations and team size

---

## 🟢 OPTIONAL - Nice to Have

These would enhance specific features:

### 5. **Industry RSS Feed URLs** (List)
- **Purpose:** For discovering relevant industry articles to share
- **Format:** Text file or JSON with URLs
- **Example sources:**
  - Product management blogs
  - Software testing publications
  - Beta testing industry news
  - Tech product launch news

### 6. **Competitor Social Media Examples** (PDF)
- **Purpose:** Understand competitive landscape and differentiate messaging
- **Contents:**
  - Examples of competitor posts
  - Analysis of what makes them effective/ineffective
  - Gaps in competitor messaging

### 7. **Customer Testimonials & Case Study Summaries** (PDF)
- **Purpose:** Raw material for social proof posts
- **Contents:**
  - Customer quotes and testimonials
  - Brief case study summaries
  - ROI statistics and success metrics

---

## 📋 Current Status

### What We Have:
✅ 839 content items from Webflow & HubSpot
- 639 blog posts
- 90 landing pages
- 87 webinars
- 17 case studies (with PDF URLs)
- 6 whitepapers

### What We Need:
❌ Brand voice documents (critical)
❌ Knowledge/messaging guide (critical)
❌ Example posts (helpful)
❌ Company facts (helpful)

---

## 🚀 How to Add Documents

1. **Place PDF files in the `/documents` folder**
   ```bash
   /documents
   ├── style-guide.pdf          # Brand voice & style
   ├── knowledge-guide.pdf       # Product/company knowledge
   ├── example-posts.pdf         # Social media examples
   └── company-facts.pdf         # Company boilerplate
   ```

2. **Run the ingestion command**
   ```bash
   npm run test:brand-voice
   ```

3. **Verify ingestion**
   - The script will show how many embeddings were created
   - Check for any errors in the output

---

## 🔍 What Happens After Upload

Once you provide the documents, the system will:

1. **Read** the PDF files and extract all text
2. **Chunk** the content into ~1000 character segments with overlap
3. **Embed** each chunk using OpenAI's embedding model
4. **Store** embeddings in PostgreSQL database
5. **Enable RAG** - Posts can now retrieve relevant brand voice context

### Estimated Processing Time:
- Style guide (50 pages): ~2-3 minutes
- Knowledge guide (100 pages): ~5-7 minutes
- Total embedding cost: ~$0.50-2.00 (OpenAI API)

---

## 📞 Questions About Documents

If you're unsure about:
- **What to include:** Include everything that helps writers create on-brand posts
- **Format:** PDF is preferred, but markdown (.md) works for text-only docs
- **Length:** No strict limits - the system handles documents of any size
- **Updating:** You can re-ingest documents anytime (set `reIngest: true`)

---

## ⚡ Quick Start Once You Have Documents

```bash
# 1. Add your PDFs to /documents folder

# 2. Make sure OpenAI API key is in .env.local
echo "OPENAI_API_KEY=sk-..." >> .env.local

# 3. Run ingestion test
npm run test:brand-voice

# 4. Verify in database
# Should see embeddings for style_guide and knowledge_base sources
```

---

## 🎯 Next Steps Without Documents

Without brand voice documents, we can still:
1. ✅ Build the UI for post generation
2. ✅ Implement post type logic and rules
3. ✅ Create export functionality for HubSpot
4. ✅ Build campaign mode
5. ⚠️ BUT generated posts won't match your brand voice until documents are provided

**Recommendation:** Provide at minimum the Style Guide and Knowledge Guide before proceeding to post generation features.
