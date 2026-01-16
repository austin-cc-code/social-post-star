/**
 * API Route: GET /api/content/status
 *
 * Get content polling status and database statistics
 */

import { NextResponse } from 'next/server';
import { getPollStatus, getTimeUntilNextPoll } from '@/lib/utils/content-polling';
import { getContentStats } from '@/lib/db/queries/content';

export async function GET() {
  try {
    const [pollStatus, contentStats, timeUntilNextPoll] = await Promise.all([
      getPollStatus(),
      getContentStats(),
      getTimeUntilNextPoll(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        polling: {
          lastPoll: pollStatus.lastPoll,
          shouldPoll: pollStatus.shouldPoll,
          isPolling: pollStatus.isPolling,
          timeSinceLastPoll: pollStatus.timeSinceLastPoll,
          timeUntilNextPoll,
        },
        stats: contentStats,
      },
    });
  } catch (error) {
    console.error('❌ API: Status check failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get content status',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Disable caching for this endpoint
export const dynamic = 'force-dynamic';
