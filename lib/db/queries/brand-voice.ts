/**
 * Brand Voice Database Queries
 *
 * Handles storage and retrieval of brand voice embeddings for RAG system.
 * Supports semantic search for finding relevant brand voice examples.
 */

import { sql } from '../client';
import type { BrandVoiceSource } from '@/types/database';

export interface BrandVoiceEmbedding {
  id: string;
  source: BrandVoiceSource;
  source_file?: string | null;
  text: string;
  embedding: number[];
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface InsertBrandVoiceEmbedding {
  source: BrandVoiceSource;
  source_file?: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

/**
 * Insert a single brand voice embedding
 */
export async function insertBrandVoiceEmbedding(
  data: InsertBrandVoiceEmbedding
): Promise<BrandVoiceEmbedding> {
  const result = await sql`
    INSERT INTO brand_voice_embeddings (source, source_file, text, embedding, metadata)
    VALUES (
      ${data.source},
      ${data.source_file || null},
      ${data.text},
      ${JSON.stringify(data.embedding)},
      ${data.metadata ? JSON.stringify(data.metadata) : null}
    )
    RETURNING *
  `;

  return result[0] as BrandVoiceEmbedding;
}

/**
 * Bulk insert brand voice embeddings
 *
 * More efficient for large batches (e.g., ingesting entire documents)
 */
export async function bulkInsertBrandVoiceEmbeddings(
  embeddings: InsertBrandVoiceEmbedding[]
): Promise<number> {
  if (embeddings.length === 0) {
    return 0;
  }

  // Process in batches of 50 to avoid query size limits
  const batchSize = 50;
  let totalInserted = 0;

  for (let i = 0; i < embeddings.length; i += batchSize) {
    const batch = embeddings.slice(i, i + batchSize);

    const values = batch
      .map(
        (item, index) => `(
        $${index * 5 + 1},
        $${index * 5 + 2},
        $${index * 5 + 3},
        $${index * 5 + 4},
        $${index * 5 + 5}
      )`
      )
      .join(', ');

    const params = batch.flatMap(item => [
      item.source,
      item.source_file || null,
      item.text,
      JSON.stringify(item.embedding),
      item.metadata ? JSON.stringify(item.metadata) : null,
    ]);

    const query = `
      INSERT INTO brand_voice_embeddings (source, source_file, text, embedding, metadata)
      VALUES ${values}
    `;

    await sql.unsafe(query, params);
    totalInserted += batch.length;
  }

  return totalInserted;
}

/**
 * Get all brand voice embeddings by source
 */
export async function getBrandVoiceEmbeddingsBySource(
  source: BrandVoiceSource
): Promise<BrandVoiceEmbedding[]> {
  const result = await sql`
    SELECT * FROM brand_voice_embeddings
    WHERE source = ${source}
    ORDER BY created_at DESC
  `;

  return result as BrandVoiceEmbedding[];
}

/**
 * Get all brand voice embeddings from a specific source file
 */
export async function getBrandVoiceEmbeddingsByFile(
  sourceFile: string
): Promise<BrandVoiceEmbedding[]> {
  const result = await sql`
    SELECT * FROM brand_voice_embeddings
    WHERE source_file = ${sourceFile}
    ORDER BY created_at DESC
  `;

  return result as BrandVoiceEmbedding[];
}

/**
 * Find similar brand voice embeddings using cosine similarity
 *
 * NOTE: This uses a JavaScript-based similarity calculation.
 * For production, consider using PostgreSQL pgvector extension for better performance.
 */
export async function findSimilarBrandVoice(
  queryEmbedding: number[],
  limit: number = 5,
  minSimilarity: number = 0.7,
  source?: BrandVoiceSource
): Promise<Array<BrandVoiceEmbedding & { similarity: number }>> {
  // Fetch all embeddings (with optional source filter)
  const query = source
    ? sql`SELECT * FROM brand_voice_embeddings WHERE source = ${source}`
    : sql`SELECT * FROM brand_voice_embeddings`;

  const allEmbeddings = (await query) as BrandVoiceEmbedding[];

  // Calculate similarity for each embedding
  const similarities = allEmbeddings.map(item => {
    const embedding = item.embedding;
    const similarity = cosineSimilarity(queryEmbedding, embedding);

    return {
      ...item,
      similarity,
    };
  });

  // Filter by minimum similarity and sort by relevance
  const filtered = similarities
    .filter(item => item.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return filtered;
}

/**
 * Calculate cosine similarity (matches embeddings.ts implementation)
 */
function cosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
  if (embeddingA.length !== embeddingB.length) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < embeddingA.length; i++) {
    dotProduct += embeddingA[i] * embeddingB[i];
    magnitudeA += embeddingA[i] * embeddingA[i];
    magnitudeB += embeddingB[i] * embeddingB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Delete all brand voice embeddings from a source file
 *
 * Useful when re-ingesting a document
 */
export async function deleteBrandVoiceEmbeddingsByFile(
  sourceFile: string
): Promise<number> {
  const result = await sql`
    DELETE FROM brand_voice_embeddings
    WHERE source_file = ${sourceFile}
  `;

  return result.count || 0;
}

/**
 * Delete all brand voice embeddings from a source
 */
export async function deleteBrandVoiceEmbeddingsBySource(
  source: BrandVoiceSource
): Promise<number> {
  const result = await sql`
    DELETE FROM brand_voice_embeddings
    WHERE source = ${source}
  `;

  return result.count || 0;
}

/**
 * Get statistics about brand voice embeddings
 */
export async function getBrandVoiceStats(): Promise<{
  total: number;
  bySource: Record<string, number>;
  byFile: Record<string, number>;
}> {
  const total = await sql`SELECT COUNT(*) as count FROM brand_voice_embeddings`;

  const bySource = await sql`
    SELECT source, COUNT(*) as count
    FROM brand_voice_embeddings
    GROUP BY source
  `;

  const byFile = await sql`
    SELECT source_file, COUNT(*) as count
    FROM brand_voice_embeddings
    WHERE source_file IS NOT NULL
    GROUP BY source_file
  `;

  return {
    total: Number(total[0].count),
    bySource: Object.fromEntries(bySource.map(row => [row.source, Number(row.count)])),
    byFile: Object.fromEntries(byFile.map(row => [row.source_file, Number(row.count)])),
  };
}
