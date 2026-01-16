/**
 * Brand Voice RAG (Retrieval-Augmented Generation) System
 *
 * Retrieves relevant brand voice examples and guidelines for post generation.
 * Uses semantic search to find the most relevant context from ingested documents.
 */

import { generateEmbedding } from './embeddings';
import { findSimilarBrandVoice } from '../db/queries/brand-voice';
import type { BrandVoiceSource } from '@/types/database';

export interface BrandVoiceContext {
  text: string;
  source: BrandVoiceSource;
  sourceFile?: string | null;
  similarity: number;
  metadata?: Record<string, any>;
}

export interface RAGOptions {
  topK?: number; // Number of results to retrieve
  minSimilarity?: number; // Minimum similarity threshold (0-1)
  sources?: BrandVoiceSource[]; // Filter by specific sources
  includeMetadata?: boolean; // Whether to include metadata in results
}

const DEFAULT_OPTIONS: Required<Omit<RAGOptions, 'sources'>> = {
  topK: 5,
  minSimilarity: 0.7,
  includeMetadata: true,
};

/**
 * Retrieve relevant brand voice context for a query
 *
 * Use this when generating posts to get brand-aligned examples and guidelines
 */
export async function retrieveBrandVoiceContext(
  query: string,
  options: RAGOptions = {}
): Promise<BrandVoiceContext[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Generate embedding for the query
    const queryEmbeddingResult = await generateEmbedding(query);

    // Search for similar brand voice embeddings
    const results = await findSimilarBrandVoice(
      queryEmbeddingResult.embedding,
      opts.topK,
      opts.minSimilarity
    );

    // Transform to context format
    return results.map(result => ({
      text: result.text,
      source: result.source,
      sourceFile: result.source_file,
      similarity: result.similarity,
      metadata: opts.includeMetadata ? result.metadata : undefined,
    }));
  } catch (error) {
    console.error('Error retrieving brand voice context:', error);
    throw new Error(
      `Failed to retrieve brand voice context: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get brand voice guidelines for specific content types
 *
 * Optimized for retrieving style guide rules for specific scenarios
 */
export async function getBrandVoiceGuidelines(
  contentType: string,
  platform?: string
): Promise<BrandVoiceContext[]> {
  const query = platform
    ? `Guidelines for ${contentType} on ${platform} social media`
    : `Guidelines for ${contentType}`;

  return retrieveBrandVoiceContext(query, {
    topK: 3,
    minSimilarity: 0.65,
    sources: ['style_guide'],
  });
}

/**
 * Get brand voice examples for inspiration
 *
 * Retrieves similar examples from the knowledge base or previous posts
 */
export async function getBrandVoiceExamples(
  topic: string,
  postType: string
): Promise<BrandVoiceContext[]> {
  const query = `Example ${postType} post about ${topic}`;

  return retrieveBrandVoiceContext(query, {
    topK: 5,
    minSimilarity: 0.7,
    sources: ['example_post', 'knowledge_base'],
  });
}

/**
 * Format brand voice context for LLM prompt
 *
 * Converts retrieved context into a formatted string for inclusion in prompts
 */
export function formatBrandVoiceForPrompt(contexts: BrandVoiceContext[]): string {
  if (contexts.length === 0) {
    return 'No specific brand voice guidelines found for this context.';
  }

  const sections = contexts.map((context, index) => {
    let section = `[Brand Voice Reference ${index + 1}]`;

    if (context.sourceFile) {
      section += ` (from ${context.sourceFile})`;
    }

    section += `\n${context.text}`;

    if (context.metadata?.section) {
      section += `\nSection: ${context.metadata.section}`;
    }

    return section;
  });

  return sections.join('\n\n---\n\n');
}

/**
 * Get comprehensive brand voice context for post generation
 *
 * Retrieves both guidelines and examples relevant to the content
 */
export async function getComprehensiveBrandVoice(params: {
  contentSummary: string;
  contentType: string;
  platform: string;
  postType: string;
}): Promise<{
  guidelines: BrandVoiceContext[];
  examples: BrandVoiceContext[];
  formattedContext: string;
}> {
  const [guidelines, examples] = await Promise.all([
    getBrandVoiceGuidelines(params.contentType, params.platform),
    getBrandVoiceExamples(params.contentSummary, params.postType),
  ]);

  // Combine and format for prompt
  const allContext = [...guidelines, ...examples];
  const formattedContext = formatBrandVoiceForPrompt(allContext);

  return {
    guidelines,
    examples,
    formattedContext,
  };
}

/**
 * Check if brand voice system is initialized
 *
 * Returns true if there are embeddings in the database
 */
export async function isBrandVoiceInitialized(): Promise<boolean> {
  const { getBrandVoiceStats } = await import('../db/queries/brand-voice');
  const stats = await getBrandVoiceStats();
  return stats.total > 0;
}

/**
 * Get statistics about brand voice embeddings for debugging
 */
export async function getBrandVoiceDebugInfo(): Promise<{
  initialized: boolean;
  totalEmbeddings: number;
  bySource: Record<string, number>;
  byFile: Record<string, number>;
}> {
  const { getBrandVoiceStats } = await import('../db/queries/brand-voice');
  const stats = await getBrandVoiceStats();

  return {
    initialized: stats.total > 0,
    totalEmbeddings: stats.total,
    bySource: stats.bySource,
    byFile: stats.byFile,
  };
}
