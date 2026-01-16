/**
 * Text Chunking Utility
 *
 * Splits large documents into smaller chunks suitable for embedding generation.
 * Uses intelligent splitting to preserve semantic meaning and context.
 */

export interface TextChunk {
  text: string;
  index: number;
  startPosition: number;
  endPosition: number;
  metadata?: Record<string, any>;
}

export interface ChunkingOptions {
  chunkSize?: number; // Target size in characters
  chunkOverlap?: number; // Overlap between chunks in characters
  separators?: string[]; // Preferred split points (paragraphs, sentences, etc.)
  preserveWhitespace?: boolean;
}

const DEFAULT_OPTIONS: Required<ChunkingOptions> = {
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' '],
  preserveWhitespace: false,
};

/**
 * Split text into chunks with semantic awareness
 *
 * Algorithm:
 * 1. Try to split at paragraph boundaries (\n\n)
 * 2. If chunk still too large, try sentence boundaries
 * 3. If still too large, split at word boundaries
 * 4. Add overlap between chunks for context preservation
 */
export function chunkText(text: string, options: ChunkingOptions = {}): TextChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: TextChunk[] = [];

  // Clean the text if needed
  let cleanText = text;
  if (!opts.preserveWhitespace) {
    // Normalize whitespace while preserving paragraph breaks
    cleanText = text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines to max 2
      .replace(/[ \t]+/g, ' ') // Collapse spaces/tabs to single space
      .trim();
  }

  if (cleanText.length === 0) {
    return chunks;
  }

  let startPos = 0;
  let chunkIndex = 0;

  while (startPos < cleanText.length) {
    // Calculate the end position for this chunk
    let endPos = Math.min(startPos + opts.chunkSize, cleanText.length);

    // If we're not at the end of the text, try to find a good split point
    if (endPos < cleanText.length) {
      let bestSplitPos = endPos;
      let foundSplit = false;

      // Try each separator in order of preference
      for (const separator of opts.separators) {
        // Look for separator within a window before the chunk size limit
        const searchStart = Math.max(startPos, endPos - 200);
        const searchEnd = Math.min(endPos + 100, cleanText.length);
        const segment = cleanText.substring(searchStart, searchEnd);

        // Find last occurrence of separator before chunk size limit
        const relativePos = segment.lastIndexOf(separator, endPos - searchStart);

        if (relativePos !== -1) {
          bestSplitPos = searchStart + relativePos + separator.length;
          foundSplit = true;
          break;
        }
      }

      // If no separator found, just use the chunk size limit
      endPos = foundSplit ? bestSplitPos : endPos;
    }

    // Extract the chunk text
    const chunkText = cleanText.substring(startPos, endPos).trim();

    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        index: chunkIndex,
        startPosition: startPos,
        endPosition: endPos,
      });
      chunkIndex++;
    }

    // Move start position forward, accounting for overlap
    startPos = endPos - opts.chunkOverlap;

    // Make sure we're making progress
    if (startPos <= chunks[chunks.length - 1]?.startPosition) {
      startPos = endPos;
    }
  }

  return chunks;
}

/**
 * Split text into chunks by section/heading
 *
 * Useful for documents with clear section structure.
 * Preserves section boundaries and doesn't split across sections.
 */
export function chunkBySection(
  text: string,
  sectionPattern: RegExp = /^#{1,3}\s+.+$/gm
): TextChunk[] {
  const chunks: TextChunk[] = [];
  const sections = text.split(sectionPattern);

  let currentPos = 0;
  sections.forEach((section, index) => {
    const trimmedSection = section.trim();
    if (trimmedSection.length > 0) {
      chunks.push({
        text: trimmedSection,
        index,
        startPosition: currentPos,
        endPosition: currentPos + trimmedSection.length,
        metadata: {
          isSection: true,
        },
      });
    }
    currentPos += section.length;
  });

  return chunks;
}

/**
 * Chunk text with metadata preservation
 *
 * Useful when you want to attach metadata to each chunk (e.g., source file, page number)
 */
export function chunkTextWithMetadata(
  text: string,
  metadata: Record<string, any>,
  options: ChunkingOptions = {}
): TextChunk[] {
  const chunks = chunkText(text, options);

  return chunks.map(chunk => ({
    ...chunk,
    metadata: {
      ...metadata,
      ...chunk.metadata,
    },
  }));
}

/**
 * Estimate number of tokens in text
 *
 * Rough approximation: 1 token ≈ 4 characters for English text
 * More accurate for GPT-style tokenization
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Chunk text to fit within token limit
 *
 * Ensures chunks don't exceed token limit for embedding models
 */
export function chunkByTokenLimit(
  text: string,
  maxTokens: number = 512,
  options: Omit<ChunkingOptions, 'chunkSize'> = {}
): TextChunk[] {
  // Convert token limit to approximate character limit
  const chunkSize = maxTokens * 4;

  return chunkText(text, {
    ...options,
    chunkSize,
  });
}
