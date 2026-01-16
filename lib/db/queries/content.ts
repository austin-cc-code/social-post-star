/**
 * Database Queries for Content Items
 *
 * CRUD operations for content_items table
 */

import { sql } from '@/lib/db/client';
import {
  ContentItem,
  ContentItemInsert,
  ContentSource,
  ContentType,
} from '@/types/database';

/**
 * Insert or update a content item
 * Uses ON CONFLICT to handle duplicates by URL
 */
export async function upsertContentItem(
  content: Omit<ContentItemInsert, 'last_polled'>
): Promise<ContentItem> {
  const result = await sql`
    INSERT INTO content_items (
      source,
      url,
      title,
      content_type,
      excerpt,
      metadata,
      publication_date
    ) VALUES (
      ${content.source},
      ${content.url},
      ${content.title},
      ${content.content_type},
      ${content.excerpt || null},
      ${JSON.stringify(content.metadata || {})},
      ${content.publication_date || null}
    )
    ON CONFLICT (url) DO UPDATE SET
      title = EXCLUDED.title,
      content_type = EXCLUDED.content_type,
      excerpt = EXCLUDED.excerpt,
      metadata = EXCLUDED.metadata,
      publication_date = EXCLUDED.publication_date,
      last_polled = NOW(),
      updated_at = NOW()
    RETURNING *
  `;

  return result[0] as ContentItem;
}

/**
 * Bulk upsert content items
 */
export async function bulkUpsertContentItems(
  items: Omit<ContentItemInsert, 'last_polled'>[]
): Promise<ContentItem[]> {
  if (items.length === 0) {
    return [];
  }

  const results: ContentItem[] = [];

  // Process in batches to avoid overwhelming the database
  const batchSize = 50;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => upsertContentItem(item))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Get all content items
 */
export async function getAllContent(
  options?: {
    source?: ContentSource;
    contentType?: ContentType;
    limit?: number;
    offset?: number;
  }
): Promise<ContentItem[]> {
  let query = sql`SELECT * FROM content_items WHERE 1=1`;

  if (options?.source) {
    query = sql`${query} AND source = ${options.source}`;
  }

  if (options?.contentType) {
    query = sql`${query} AND content_type = ${options.contentType}`;
  }

  query = sql`${query} ORDER BY publication_date DESC NULLS LAST, created_at DESC`;

  if (options?.limit) {
    query = sql`${query} LIMIT ${options.limit}`;
  }

  if (options?.offset) {
    query = sql`${query} OFFSET ${options.offset}`;
  }

  const result = await query;
  return result as ContentItem[];
}

/**
 * Get content item by ID
 */
export async function getContentById(id: string): Promise<ContentItem | null> {
  const result = await sql`
    SELECT * FROM content_items WHERE id = ${id}
  `;

  return result[0] as ContentItem | null;
}

/**
 * Get content item by URL
 */
export async function getContentByUrl(url: string): Promise<ContentItem | null> {
  const result = await sql`
    SELECT * FROM content_items WHERE url = ${url}
  `;

  return result[0] as ContentItem | null;
}

/**
 * Get recently updated content (within last N days)
 */
export async function getRecentlyUpdatedContent(days: number = 14): Promise<ContentItem[]> {
  const result = await sql`
    SELECT * FROM content_items
    WHERE publication_date >= NOW() - INTERVAL '${days} days'
    ORDER BY publication_date DESC
  `;

  return result as ContentItem[];
}

/**
 * Get content that hasn't been polled recently
 */
export async function getStaleContent(hoursAgo: number = 24): Promise<ContentItem[]> {
  const result = await sql`
    SELECT * FROM content_items
    WHERE last_polled < NOW() - INTERVAL '${hoursAgo} hours'
    ORDER BY last_polled ASC
  `;

  return result as ContentItem[];
}

/**
 * Update last_polled timestamp for content items
 */
export async function updateLastPolled(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  await sql`
    UPDATE content_items
    SET last_polled = NOW()
    WHERE id = ANY(${ids})
  `;
}

/**
 * Delete content item
 */
export async function deleteContentItem(id: string): Promise<void> {
  await sql`
    DELETE FROM content_items WHERE id = ${id}
  `;
}

/**
 * Get content statistics
 */
export async function getContentStats(): Promise<{
  total: number;
  bySource: Record<ContentSource, number>;
  byType: Record<ContentType, number>;
  recentlyAdded: number; // Added in last 7 days
}> {
  const [totalResult, bySourceResult, byTypeResult, recentResult] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM content_items`,
    sql`SELECT source, COUNT(*) as count FROM content_items GROUP BY source`,
    sql`SELECT content_type, COUNT(*) as count FROM content_items GROUP BY content_type`,
    sql`
      SELECT COUNT(*) as count FROM content_items
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `,
  ]);

  const bySource: Record<string, number> = {};
  bySourceResult.forEach((row: any) => {
    bySource[row.source] = parseInt(row.count);
  });

  const byType: Record<string, number> = {};
  byTypeResult.forEach((row: any) => {
    byType[row.content_type] = parseInt(row.count);
  });

  return {
    total: parseInt(totalResult[0].count as string),
    bySource: bySource as Record<ContentSource, number>,
    byType: byType as Record<ContentType, number>,
    recentlyAdded: parseInt(recentResult[0].count as string),
  };
}
