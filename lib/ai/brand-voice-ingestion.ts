/**
 * Brand Voice Document Ingestion Service
 *
 * Orchestrates the process of ingesting brand voice documents:
 * 1. Read PDF documents (style guide, knowledge guide, etc.)
 * 2. Chunk text into manageable pieces
 * 3. Generate embeddings for each chunk
 * 4. Store embeddings in database for RAG retrieval
 */

import path from 'path';
import { readPDF, readPDFsFromDirectory, fileExists } from '../utils/pdf-reader';
import { chunkTextWithMetadata, estimateTokenCount } from '../utils/text-chunker';
import { generateEmbeddingsBatch, EMBEDDING_MODELS } from './embeddings';
import {
  bulkInsertBrandVoiceEmbeddings,
  deleteBrandVoiceEmbeddingsByFile,
  getBrandVoiceStats,
} from '../db/queries/brand-voice';
import type { BrandVoiceSource } from '@/types/database';

export interface IngestionOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  source: BrandVoiceSource;
  reIngest?: boolean; // If true, delete existing embeddings for this file before ingesting
}

export interface IngestionResult {
  success: boolean;
  fileName: string;
  source: BrandVoiceSource;
  stats: {
    pages: number;
    characters: number;
    chunks: number;
    embeddings: number;
    tokens: number;
  };
  errors: string[];
}

/**
 * Ingest a single PDF document into the brand voice system
 */
export async function ingestDocument(
  filePath: string,
  options: IngestionOptions
): Promise<IngestionResult> {
  const fileName = path.basename(filePath);
  const errors: string[] = [];

  console.log(`\n📄 Ingesting document: ${fileName}`);
  console.log(`   Source: ${options.source}`);

  try {
    // Check if file exists
    if (!(await fileExists(filePath))) {
      throw new Error(`File not found: ${filePath}`);
    }

    // If re-ingesting, delete existing embeddings for this file
    if (options.reIngest) {
      console.log(`   Deleting existing embeddings for ${fileName}...`);
      const deleted = await deleteBrandVoiceEmbeddingsByFile(fileName);
      if (deleted > 0) {
        console.log(`   ✓ Deleted ${deleted} existing embeddings`);
      }
    }

    // Step 1: Read PDF
    console.log(`   Reading PDF...`);
    const pdfContent = await readPDF(filePath);
    console.log(`   ✓ Read ${pdfContent.numPages} pages, ${pdfContent.text.length} characters`);

    // Step 2: Chunk text
    console.log(`   Chunking text...`);
    const chunks = chunkTextWithMetadata(
      pdfContent.text,
      {
        fileName,
        source: options.source,
        title: pdfContent.metadata?.title,
        numPages: pdfContent.numPages,
      },
      {
        chunkSize: options.chunkSize || 1000,
        chunkOverlap: options.chunkOverlap || 200,
      }
    );
    console.log(`   ✓ Created ${chunks.length} chunks`);

    // Step 3: Generate embeddings
    console.log(`   Generating embeddings...`);
    const texts = chunks.map(chunk => chunk.text);
    const embeddingsResult = await generateEmbeddingsBatch(texts, EMBEDDING_MODELS.SMALL);
    console.log(
      `   ✓ Generated ${embeddingsResult.embeddings.length} embeddings (${embeddingsResult.totalTokens} tokens)`
    );

    // Step 4: Store in database
    console.log(`   Storing embeddings in database...`);
    const embeddingsToStore = embeddingsResult.embeddings.map((emb, index) => ({
      source: options.source,
      source_file: fileName,
      text: emb.text,
      embedding: emb.embedding,
      metadata: {
        ...chunks[index].metadata,
        chunkIndex: chunks[index].index,
        model: emb.model,
        dimensions: emb.dimensions,
        estimatedTokens: estimateTokenCount(emb.text),
      },
    }));

    const stored = await bulkInsertBrandVoiceEmbeddings(embeddingsToStore);
    console.log(`   ✓ Stored ${stored} embeddings`);

    return {
      success: true,
      fileName,
      source: options.source,
      stats: {
        pages: pdfContent.numPages,
        characters: pdfContent.text.length,
        chunks: chunks.length,
        embeddings: stored,
        tokens: embeddingsResult.totalTokens,
      },
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);
    console.error(`   ✗ Error ingesting ${fileName}:`, error);

    return {
      success: false,
      fileName,
      source: options.source,
      stats: {
        pages: 0,
        characters: 0,
        chunks: 0,
        embeddings: 0,
        tokens: 0,
      },
      errors,
    };
  }
}

/**
 * Ingest all PDF documents from the /documents directory
 */
export async function ingestAllDocuments(
  documentsDir: string = path.join(process.cwd(), 'documents'),
  options: Partial<IngestionOptions> = {}
): Promise<{
  success: boolean;
  results: IngestionResult[];
  totalStats: {
    pages: number;
    characters: number;
    chunks: number;
    embeddings: number;
    tokens: number;
  };
}> {
  console.log(`\n🔍 Scanning for PDF documents in: ${documentsDir}\n`);

  try {
    // Read all PDFs from directory
    const pdfs = await readPDFsFromDirectory(documentsDir);

    if (pdfs.size === 0) {
      console.log('⚠️  No PDF files found in documents directory');
      return {
        success: true,
        results: [],
        totalStats: {
          pages: 0,
          characters: 0,
          chunks: 0,
          embeddings: 0,
          tokens: 0,
        },
      };
    }

    console.log(`\n📚 Found ${pdfs.size} PDF documents\n`);

    // Ingest each document
    const results: IngestionResult[] = [];

    for (const [fileName, _content] of pdfs) {
      const filePath = path.join(documentsDir, fileName);

      // Determine source type from filename
      let source: BrandVoiceSource = 'other';
      if (fileName.toLowerCase().includes('style')) {
        source = 'style_guide';
      } else if (fileName.toLowerCase().includes('knowledge')) {
        source = 'knowledge_base';
      }

      const result = await ingestDocument(filePath, {
        ...options,
        source,
      });

      results.push(result);
    }

    // Calculate total stats
    const totalStats = results.reduce(
      (acc, result) => ({
        pages: acc.pages + result.stats.pages,
        characters: acc.characters + result.stats.characters,
        chunks: acc.chunks + result.stats.chunks,
        embeddings: acc.embeddings + result.stats.embeddings,
        tokens: acc.tokens + result.stats.tokens,
      }),
      { pages: 0, characters: 0, chunks: 0, embeddings: 0, tokens: 0 }
    );

    const allSuccessful = results.every(r => r.success);

    console.log(`\n${'='.repeat(60)}\n`);
    console.log(`📊 Ingestion Summary:`);
    console.log(`   Documents processed: ${results.length}`);
    console.log(`   Total pages: ${totalStats.pages}`);
    console.log(`   Total chunks: ${totalStats.chunks}`);
    console.log(`   Total embeddings: ${totalStats.embeddings}`);
    console.log(`   Total tokens used: ${totalStats.tokens}`);
    console.log(`   Success: ${allSuccessful ? '✅' : '⚠️'}`);

    if (!allSuccessful) {
      const failedDocs = results.filter(r => !r.success);
      console.log(`\n⚠️  Failed documents (${failedDocs.length}):`);
      failedDocs.forEach(doc => {
        console.log(`   - ${doc.fileName}: ${doc.errors.join(', ')}`);
      });
    }

    return {
      success: allSuccessful,
      results,
      totalStats,
    };
  } catch (error) {
    console.error('Error ingesting documents:', error);
    throw error;
  }
}

/**
 * Show brand voice database statistics
 */
export async function showBrandVoiceStats(): Promise<void> {
  const stats = await getBrandVoiceStats();

  console.log(`\n📊 Brand Voice Database Statistics:\n`);
  console.log(`   Total embeddings: ${stats.total}`);

  console.log(`\n   By source:`);
  Object.entries(stats.bySource).forEach(([source, count]) => {
    console.log(`      ${source}: ${count}`);
  });

  if (Object.keys(stats.byFile).length > 0) {
    console.log(`\n   By file:`);
    Object.entries(stats.byFile).forEach(([file, count]) => {
      console.log(`      ${file}: ${count}`);
    });
  }

  console.log('');
}
