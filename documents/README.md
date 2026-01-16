# Documents Folder

This folder contains important reference documents that the AI system uses to generate brand-aligned social media posts.

## Required Documents

### 1. Centercode Style Guide
**Filename:** `style-guide.pdf` or `style-guide.md`
**Purpose:** Contains Centercode's brand voice, tone guidelines, approved/banned phrases, and social media posting rules.
**What to include:**
- Brand voice characteristics
- Tone guidelines
- Approved CTAs and phrases
- Phrases/patterns to avoid
- Social media specific rules (e.g., no hashtags, "→ " before links)

### 2. Centercode Knowledge Guide
**Filename:** `knowledge-guide.pdf` or `knowledge-guide.md`
**Purpose:** Comprehensive guide about Centercode's business, industry, products, and services. Used for content understanding and industry article relevance scoring.
**What to include:**
- Company overview
- Product/service descriptions
- Industry information (beta testing, product management, customer feedback)
- Target customer personas
- Key topics and themes
- Competitive landscape
- Industry terminology

### 3. Example Social Posts
**Filename:** `example-posts.md` or `example-posts.txt`
**Purpose:** Collection of successful social media posts that demonstrate good examples of Centercode's brand voice in action.
**Format:** Each post should be clearly separated with metadata
```
POST #1
Platform: LinkedIn
Type: Content Promotion
Date: 2024-01-15
Performance: High engagement

[Post text here]

---

POST #2
...
```

## Instructions for Adding Documents

1. Place your documents in this folder
2. Use the filenames specified above (or similar)
3. Supported formats: PDF, Markdown (.md), Plain text (.txt)
4. Ensure documents are up-to-date
5. After adding documents, the system will automatically ingest them on first run

## Document Updates

When you update these documents:
1. Replace the existing file
2. The system will re-ingest on next run
3. Previous learned patterns will be preserved but enhanced with new information

## Notes

- These documents are NOT committed to version control (.gitignore will exclude them)
- Keep sensitive information out of these documents
- Documents should be text-searchable (for PDFs, ensure OCR is applied)
