/**
 * Content Ingestion Service
 *
 * Orchestrates fetching content from Webflow and HubSpot,
 * and storing it in the database.
 */

import { webflowClient } from '@/lib/utils/webflow';
import { hubspotClient } from '@/lib/utils/hubspot';
import { bulkUpsertContentItems, getContentStats } from '@/lib/db/queries/content';
import { ContentItemInsert } from '@/types/database';

export interface IngestionResult {
  success: boolean;
  webflowCount: number;
  hubspotCount: number;
  totalProcessed: number;
  errors: string[];
  stats?: {
    newItems: number;
    updatedItems: number;
    totalInDatabase: number;
  };
}

/**
 * Ingest content from all sources
 */
export async function ingestAllContent(): Promise<IngestionResult> {
  const result: IngestionResult = {
    success: false,
    webflowCount: 0,
    hubspotCount: 0,
    totalProcessed: 0,
    errors: [],
  };

  try {
    console.log('🔄 Starting content ingestion...\n');

    // Get initial database stats
    const initialStats = await getContentStats();
    const initialTotal = initialStats.total;

    // Fetch from Webflow
    console.log('📡 Fetching from Webflow...');
    let webflowContent: Awaited<ReturnType<typeof webflowClient.fetchAllContent>> = [];
    try {
      webflowContent = await webflowClient.fetchAllContent();
      result.webflowCount = webflowContent.length;
      console.log(`✓ Fetched ${webflowContent.length} items from Webflow\n`);
    } catch (error) {
      const errorMsg = `Webflow fetch failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`✗ ${errorMsg}`);
      result.errors.push(errorMsg);
    }

    // Fetch from HubSpot
    console.log('📡 Fetching from HubSpot...');
    let hubspotContent: Awaited<ReturnType<typeof hubspotClient.fetchAllContent>> = [];
    try {
      hubspotContent = await hubspotClient.fetchAllContent();
      result.hubspotCount = hubspotContent.length;
      console.log(`✓ Fetched ${hubspotContent.length} items from HubSpot\n`);
    } catch (error) {
      const errorMsg = `HubSpot fetch failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`✗ ${errorMsg}`);
      result.errors.push(errorMsg);
    }

    // Transform and combine all content
    const allContent: ContentItemInsert[] = [
      ...webflowContent.map(item => transformToContentItem(item, 'webflow')),
      ...hubspotContent.map(item => transformToContentItem(item, 'hubspot')),
    ];

    result.totalProcessed = allContent.length;

    if (allContent.length === 0) {
      console.log('⚠️  No content to process');
      result.success = result.errors.length === 0;
      return result;
    }

    // Store in database
    console.log(`💾 Storing ${allContent.length} items in database...`);
    try {
      await bulkUpsertContentItems(allContent);
      console.log(`✓ Successfully stored content\n`);
    } catch (error) {
      const errorMsg = `Database upsert failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`✗ ${errorMsg}`);
      result.errors.push(errorMsg);
      result.success = false;
      return result;
    }

    // Get final database stats
    const finalStats = await getContentStats();
    const finalTotal = finalStats.total;

    result.stats = {
      newItems: Math.max(0, finalTotal - initialTotal),
      updatedItems: Math.max(0, allContent.length - (finalTotal - initialTotal)),
      totalInDatabase: finalTotal,
    };

    console.log('📊 Ingestion Summary:');
    console.log(`   - Webflow: ${result.webflowCount} items`);
    console.log(`   - HubSpot: ${result.hubspotCount} items`);
    console.log(`   - Total processed: ${result.totalProcessed} items`);
    console.log(`   - New items: ${result.stats.newItems}`);
    console.log(`   - Updated items: ${result.stats.updatedItems}`);
    console.log(`   - Total in database: ${result.stats.totalInDatabase}`);

    if (result.errors.length > 0) {
      console.log(`\n⚠️  Completed with ${result.errors.length} error(s)`);
      result.success = false;
    } else {
      console.log(`\n✅ Content ingestion complete!`);
      result.success = true;
    }

    return result;
  } catch (error) {
    const errorMsg = `Ingestion failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`✗ ${errorMsg}`);
    result.errors.push(errorMsg);
    result.success = false;
    return result;
  }
}

/**
 * Transform Webflow/HubSpot content to database format
 */
function transformToContentItem(
  item: any,
  source: 'webflow' | 'hubspot'
): ContentItemInsert {
  return {
    source,
    url: item.url,
    title: item.title,
    content_type: item.contentType,
    excerpt: item.excerpt,
    metadata: item.metadata || {},
    publication_date: item.publishedDate,
  };
}

/**
 * Ingest content from Webflow only
 */
export async function ingestWebflowContent(): Promise<IngestionResult> {
  const result: IngestionResult = {
    success: false,
    webflowCount: 0,
    hubspotCount: 0,
    totalProcessed: 0,
    errors: [],
  };

  try {
    console.log('🔄 Fetching content from Webflow...\n');

    const webflowContent = await webflowClient.fetchAllContent();
    result.webflowCount = webflowContent.length;
    result.totalProcessed = webflowContent.length;

    const contentItems: ContentItemInsert[] = webflowContent.map(item =>
      transformToContentItem(item, 'webflow')
    );

    await bulkUpsertContentItems(contentItems);

    result.success = true;
    console.log(`✅ Ingested ${result.webflowCount} items from Webflow`);

    return result;
  } catch (error) {
    const errorMsg = `Webflow ingestion failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`✗ ${errorMsg}`);
    result.errors.push(errorMsg);
    result.success = false;
    return result;
  }
}

/**
 * Ingest content from HubSpot only
 */
export async function ingestHubSpotContent(): Promise<IngestionResult> {
  const result: IngestionResult = {
    success: false,
    webflowCount: 0,
    hubspotCount: 0,
    totalProcessed: 0,
    errors: [],
  };

  try {
    console.log('🔄 Fetching content from HubSpot...\n');

    const hubspotContent = await hubspotClient.fetchAllContent();
    result.hubspotCount = hubspotContent.length;
    result.totalProcessed = hubspotContent.length;

    const contentItems: ContentItemInsert[] = hubspotContent.map(item =>
      transformToContentItem(item, 'hubspot')
    );

    await bulkUpsertContentItems(contentItems);

    result.success = true;
    console.log(`✅ Ingested ${result.hubspotCount} items from HubSpot`);

    return result;
  } catch (error) {
    const errorMsg = `HubSpot ingestion failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`✗ ${errorMsg}`);
    result.errors.push(errorMsg);
    result.success = false;
    return result;
  }
}
