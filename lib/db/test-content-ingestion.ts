#!/usr/bin/env node
/**
 * Test Content Ingestion
 *
 * Tests the complete content ingestion flow from Webflow and HubSpot
 */

import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

import { ingestAllContent } from '../ai/content-ingestion';
import { getContentStats, getAllContent } from './queries/content';

async function test() {
  console.log('🧪 Testing Content Ingestion\n');
  console.log('=' .repeat(60));
  console.log('\n');

  try {
    // Show initial state
    console.log('📊 Initial Database State:');
    const initialStats = await getContentStats();
    console.log(`   Total items: ${initialStats.total}`);
    console.log(`   By source:`, initialStats.bySource);
    console.log(`   By type:`, initialStats.byType);
    console.log(`   Recently added (7 days): ${initialStats.recentlyAdded}`);
    console.log('\n');

    // Run ingestion
    console.log('🔄 Running Ingestion...\n');
    console.log('='.repeat(60));
    console.log('\n');

    const result = await ingestAllContent();

    console.log('\n');
    console.log('='.repeat(60));
    console.log('\n');

    // Show results
    console.log('📋 Ingestion Results:');
    console.log(`   Success: ${result.success ? '✅' : '❌'}`);
    console.log(`   Webflow items: ${result.webflowCount}`);
    console.log(`   HubSpot items: ${result.hubspotCount}`);
    console.log(`   Total processed: ${result.totalProcessed}`);

    if (result.stats) {
      console.log(`   New items added: ${result.stats.newItems}`);
      console.log(`   Items updated: ${result.stats.updatedItems}`);
      console.log(`   Total in database: ${result.stats.totalInDatabase}`);
    }

    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors (${result.errors.length}):`);
      result.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }

    console.log('\n');

    // Show final state
    console.log('📊 Final Database State:');
    const finalStats = await getContentStats();
    console.log(`   Total items: ${finalStats.total}`);
    console.log(`   By source:`, finalStats.bySource);
    console.log(`   By type:`, finalStats.byType);
    console.log(`   Recently added (7 days): ${finalStats.recentlyAdded}`);
    console.log('\n');

    // Show sample content
    console.log('📄 Sample Content Items:');
    const sampleContent = await getAllContent({ limit: 5 });

    if (sampleContent.length === 0) {
      console.log('   (no items found)');
    } else {
      sampleContent.forEach((item, i) => {
        console.log(`\n   ${i + 1}. ${item.title}`);
        console.log(`      Source: ${item.source}`);
        console.log(`      Type: ${item.content_type}`);
        console.log(`      URL: ${item.url}`);
        console.log(`      Published: ${item.publication_date || 'N/A'}`);
        console.log(`      Last polled: ${item.last_polled}`);
      });
    }

    console.log('\n');
    console.log('='.repeat(60));
    console.log('\n');

    if (result.success) {
      console.log('✅ Test completed successfully!\n');
      process.exit(0);
    } else {
      console.log('⚠️  Test completed with errors\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error);
    process.exit(1);
  }
}

test();
