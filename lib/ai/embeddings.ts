/**
 * Embeddings Generation Service
 *
 * Generates vector embeddings for text using OpenAI's embedding models.
 * Used for brand voice RAG system and semantic search.
 */

import OpenAI from 'openai';

// Lazy-initialized OpenAI client
let _openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!_openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    _openaiClient = new OpenAI({ apiKey });
  }
  return _openaiClient;
}

export interface EmbeddingResult {
  embedding: number[];
  text: string;
  model: string;
  dimensions: number;
}

export interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[];
  totalTokens: number;
  model: string;
}

/**
 * OpenAI embedding models
 */
export const EMBEDDING_MODELS = {
  SMALL: 'text-embedding-3-small', // 1536 dimensions, lower cost
  LARGE: 'text-embedding-3-large', // 3072 dimensions, higher quality
  ADA: 'text-embedding-ada-002', // Legacy, 1536 dimensions
} as const;

export type EmbeddingModel = (typeof EMBEDDING_MODELS)[keyof typeof EMBEDDING_MODELS];

/**
 * Default model for embeddings
 * Using small model for cost efficiency - upgrade to large if quality issues
 */
const DEFAULT_MODEL: EmbeddingModel = EMBEDDING_MODELS.SMALL;

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(
  text: string,
  model: EmbeddingModel = DEFAULT_MODEL
): Promise<EmbeddingResult> {
  const client = getOpenAIClient();

  try {
    const response = await client.embeddings.create({
      model,
      input: text,
      encoding_format: 'float',
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding returned from OpenAI');
    }

    const embedding = response.data[0].embedding;

    return {
      embedding,
      text,
      model,
      dimensions: embedding.length,
    };
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate embeddings for multiple texts in batch
 *
 * OpenAI allows up to 2048 inputs per request, but we'll batch smaller
 * for better error handling and progress tracking.
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  model: EmbeddingModel = DEFAULT_MODEL,
  batchSize: number = 100
): Promise<BatchEmbeddingResult> {
  const client = getOpenAIClient();
  const allEmbeddings: EmbeddingResult[] = [];
  let totalTokens = 0;

  // Process in batches
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`Generating embeddings for batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (${batch.length} items)`);

    try {
      const response = await client.embeddings.create({
        model,
        input: batch,
        encoding_format: 'float',
      });

      // Map embeddings back to texts
      response.data.forEach((item, index) => {
        allEmbeddings.push({
          embedding: item.embedding,
          text: batch[index],
          model,
          dimensions: item.embedding.length,
        });
      });

      totalTokens += response.usage.total_tokens;
    } catch (error) {
      console.error(`Error generating embeddings for batch ${i}-${i + batch.length}:`, error);
      throw error;
    }
  }

  console.log(`✓ Generated ${allEmbeddings.length} embeddings (${totalTokens} tokens used)`);

  return {
    embeddings: allEmbeddings,
    totalTokens,
    model,
  };
}

/**
 * Calculate cosine similarity between two embeddings
 *
 * Returns value between -1 and 1, where:
 * - 1 means identical
 * - 0 means orthogonal (unrelated)
 * - -1 means opposite
 */
export function cosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
  if (embeddingA.length !== embeddingB.length) {
    throw new Error('Embeddings must have the same dimensions');
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
 * Find most similar embeddings to a query embedding
 *
 * Returns indices and similarity scores sorted by relevance (descending)
 */
export function findMostSimilar(
  queryEmbedding: number[],
  embeddings: number[][],
  topK: number = 5
): Array<{ index: number; similarity: number }> {
  const similarities = embeddings.map((embedding, index) => ({
    index,
    similarity: cosineSimilarity(queryEmbedding, embedding),
  }));

  // Sort by similarity descending
  similarities.sort((a, b) => b.similarity - a.similarity);

  return similarities.slice(0, topK);
}

/**
 * Normalize embedding vector (make magnitude = 1)
 *
 * Useful for some vector databases that require normalized vectors
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));

  if (magnitude === 0) {
    return embedding;
  }

  return embedding.map(val => val / magnitude);
}
