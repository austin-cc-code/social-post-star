/**
 * Brand Voice Ingestion API Route
 *
 * POST /api/brand-voice/ingest
 * Triggers ingestion of PDF documents from /documents directory
 */

import { NextResponse } from 'next/server';
import { ingestAllDocuments, showBrandVoiceStats } from '@/lib/ai/brand-voice-ingestion';

export async function POST(request: Request) {
  try {
    const { reIngest } = await request.json().catch(() => ({ reIngest: false }));

    console.log('🚀 Starting brand voice document ingestion...');

    const result = await ingestAllDocuments(undefined, {
      reIngest,
    });

    // Show updated stats
    await showBrandVoiceStats();

    return NextResponse.json({
      success: result.success,
      results: result.results,
      stats: result.totalStats,
    });
  } catch (error) {
    console.error('Brand voice ingestion error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
