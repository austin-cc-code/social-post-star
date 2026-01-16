/**
 * API Route: POST /api/content/refresh
 *
 * Manually trigger content refresh from Webflow and HubSpot
 */

import { NextResponse } from 'next/server';
import { forceRefresh } from '@/lib/utils/content-polling';

export async function POST() {
  try {
    console.log('📡 API: Manual content refresh triggered');

    const result = await forceRefresh();

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? 'Content refreshed successfully'
        : 'Content refresh completed with errors',
      data: {
        webflowCount: result.webflowCount,
        hubspotCount: result.hubspotCount,
        totalProcessed: result.totalProcessed,
        stats: result.stats,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('❌ API: Content refresh failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Content refresh failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Disable caching for this endpoint
export const dynamic = 'force-dynamic';
