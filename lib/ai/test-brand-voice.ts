#!/usr/bin/env node
/**
 * Brand Voice System Test Script
 *
 * Tests the complete brand voice ingestion and retrieval pipeline:
 * 1. Ingest documents from /documents directory
 * 2. Verify embeddings are stored
 * 3. Test RAG retrieval
 */

import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

import { ingestAllDocuments, showBrandVoiceStats } from './brand-voice-ingestion';
import {
  retrieveBrandVoiceContext,
  getBrandVoiceGuidelines,
  formatBrandVoiceForPrompt,
  isBrandVoiceInitialized,
} from './brand-voice-rag';

async function test() {
  console.log('🧪 Testing Brand Voice System\n');
  console.log('='.repeat(60));
  console.log('\n');

  try {
    // Check if initialized
    console.log('📊 Checking system status...');
    const initialized = await isBrandVoiceInitialized();
    console.log(`   System initialized: ${initialized ? '✅' : '❌'}`);

    if (!initialized) {
      console.log('\n📚 No embeddings found. Attempting to ingest documents...\n');

      const documentsDir = path.join(process.cwd(), 'documents');
      console.log(`   Documents directory: ${documentsDir}\n`);

      const result = await ingestAllDocuments(documentsDir, {
        reIngest: true,
      });

      if (!result.success) {
        console.log('\n⚠️  Ingestion completed with errors. See details above.');
      }

      if (result.results.length === 0) {
        console.log('\n⚠️  No PDF documents found in /documents directory.');
        console.log('   Please add brand voice documents to continue testing.');
        console.log('\n   Required documents:');
        console.log('   - style-guide.pdf (Centercode brand voice & style guide)');
        console.log('   - knowledge-guide.pdf (Centercode product/company knowledge)');
        console.log('\n');
        process.exit(0);
      }
    } else {
      console.log('\n📊 Current Stats:\n');
      await showBrandVoiceStats();
    }

    // Test RAG retrieval
    console.log('\n🔍 Testing RAG Retrieval...\n');
    console.log('='.repeat(60));
    console.log('\n');

    // Test 1: General brand voice query
    console.log('Test 1: General brand voice query');
    console.log('Query: "How should we write social media posts?"');
    const generalContext = await retrieveBrandVoiceContext(
      'How should we write social media posts?',
      { topK: 3 }
    );

    if (generalContext.length > 0) {
      console.log(`✓ Retrieved ${generalContext.length} relevant contexts:\n`);
      generalContext.forEach((ctx, i) => {
        console.log(`   ${i + 1}. [${ctx.source}${ctx.sourceFile ? ` - ${ctx.sourceFile}` : ''}]`);
        console.log(`      Similarity: ${(ctx.similarity * 100).toFixed(1)}%`);
        console.log(`      Text: ${ctx.text.substring(0, 100)}...`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  No relevant context found (try lowering minSimilarity threshold)');
    }

    // Test 2: Specific guidelines
    console.log('\nTest 2: Platform-specific guidelines');
    console.log('Query: Guidelines for blog posts on LinkedIn');
    const guidelines = await getBrandVoiceGuidelines('blog post', 'LinkedIn');

    if (guidelines.length > 0) {
      console.log(`✓ Retrieved ${guidelines.length} guidelines:\n`);
      guidelines.forEach((ctx, i) => {
        console.log(`   ${i + 1}. Similarity: ${(ctx.similarity * 100).toFixed(1)}%`);
        console.log(`      ${ctx.text.substring(0, 150)}...`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  No guidelines found');
    }

    // Test 3: Format for prompt
    console.log('\nTest 3: Formatted context for LLM prompt');
    const formatted = formatBrandVoiceForPrompt(generalContext);
    console.log('✓ Formatted context (first 500 chars):\n');
    console.log(formatted.substring(0, 500));
    console.log('...\n');

    console.log('\n');
    console.log('='.repeat(60));
    console.log('\n✅ Brand voice system test completed successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error);
    process.exit(1);
  }
}

test();
