/**
 * Content Polling Mechanism
 *
 * Manages when and how content should be refreshed from external sources.
 * Implements the "first poll of the day" + manual refresh strategy.
 */

import { sql } from '@/lib/db/client';
import { ingestAllContent, IngestionResult } from '@/lib/ai/content-ingestion';

// Track last poll time in memory (resets on server restart)
let lastPollTime: Date | null = null;
let isPolling: boolean = false;

export interface PollStatus {
  lastPoll: Date | null;
  shouldPoll: boolean;
  isPolling: boolean;
  timeSinceLastPoll?: string;
}

/**
 * Get the last time content was polled
 */
async function getLastPollFromDatabase(): Promise<Date | null> {
  try {
    const result = await sql`
      SELECT MAX(last_polled) as last_poll
      FROM content_items
    `;

    if (result[0]?.last_poll) {
      return new Date(result[0].last_poll);
    }

    return null;
  } catch (error) {
    console.error('Error fetching last poll time:', error);
    return null;
  }
}

/**
 * Check if content should be polled
 * Returns true if:
 * - It's the first poll of the day (based on database), OR
 * - There's no content in the database yet
 */
export async function shouldPollContent(): Promise<boolean> {
  // Don't poll if already polling
  if (isPolling) {
    return false;
  }

  // Get last poll from database
  const dbLastPoll = await getLastPollFromDatabase();

  // If no content in database, should poll
  if (!dbLastPoll) {
    return true;
  }

  // Check if it's a new day since last poll
  const now = new Date();
  const lastPollDate = new Date(dbLastPoll);

  const isNewDay =
    now.getUTCFullYear() !== lastPollDate.getUTCFullYear() ||
    now.getUTCMonth() !== lastPollDate.getUTCMonth() ||
    now.getUTCDate() !== lastPollDate.getUTCDate();

  return isNewDay;
}

/**
 * Get current polling status
 */
export async function getPollStatus(): Promise<PollStatus> {
  const dbLastPoll = await getLastPollFromDatabase();
  const shouldPoll = await shouldPollContent();

  const status: PollStatus = {
    lastPoll: dbLastPoll,
    shouldPoll,
    isPolling,
  };

  if (dbLastPoll) {
    const timeDiff = Date.now() - dbLastPoll.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      status.timeSinceLastPoll = `${hours}h ${minutes}m ago`;
    } else {
      status.timeSinceLastPoll = `${minutes}m ago`;
    }
  }

  return status;
}

/**
 * Poll content from all sources
 * Manages polling state to prevent concurrent polls
 */
export async function pollContent(): Promise<IngestionResult> {
  if (isPolling) {
    throw new Error('Content polling is already in progress');
  }

  isPolling = true;
  lastPollTime = new Date();

  try {
    const result = await ingestAllContent();
    return result;
  } finally {
    isPolling = false;
  }
}

/**
 * Force a manual refresh regardless of polling schedule
 */
export async function forceRefresh(): Promise<IngestionResult> {
  return pollContent();
}

/**
 * Auto-poll if needed (call this on app initialization or generation request)
 */
export async function autoPollIfNeeded(): Promise<{
  polled: boolean;
  result?: IngestionResult;
}> {
  const shouldPoll = await shouldPollContent();

  if (!shouldPoll) {
    return { polled: false };
  }

  console.log('🔄 Auto-polling content (first poll of the day)...');
  const result = await pollContent();

  return { polled: true, result };
}

/**
 * Get time until next scheduled poll
 */
export async function getTimeUntilNextPoll(): Promise<string> {
  const dbLastPoll = await getLastPollFromDatabase();

  if (!dbLastPoll) {
    return 'Poll needed';
  }

  const now = new Date();
  const lastPollDate = new Date(dbLastPoll);

  // Calculate next poll time (next day at midnight UTC)
  const nextPoll = new Date(lastPollDate);
  nextPoll.setUTCHours(24, 0, 0, 0);

  if (now >= nextPoll) {
    return 'Poll ready';
  }

  const timeDiff = nextPoll.getTime() - now.getTime();
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}
