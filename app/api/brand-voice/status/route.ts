/**
 * Brand Voice Status API Route
 *
 * GET /api/brand-voice/status
 * Returns the current state of the brand voice system
 */

import { NextResponse } from 'next/server';
import { getBrandVoiceDebugInfo } from '@/lib/ai/brand-voice-rag';

export async function GET() {
  try {
    const info = await getBrandVoiceDebugInfo();

    return NextResponse.json({
      ...info,
      message: info.initialized
        ? 'Brand voice system is initialized and ready'
        : 'Brand voice system not initialized - please ingest documents',
    });
  } catch (error) {
    console.error('Error getting brand voice status:', error);

    return NextResponse.json(
      {
        initialized: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
