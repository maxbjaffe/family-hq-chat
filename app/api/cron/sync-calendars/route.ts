import { NextResponse } from 'next/server';
import { syncAllCalendars } from '@/lib/ical-sync';

// This endpoint is called by Vercel Cron
// See vercel.json for cron configuration
export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow if no secret set (dev), or if secret matches
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await syncAllCalendars();

    console.log('Calendar sync completed:', result);

    return NextResponse.json({
      success: true,
      ...result,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Calendar sync cron error:', error);
    return NextResponse.json({
      error: 'Sync failed',
      details: String(error),
    }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  // Check for shortcut key or cron secret
  const secretKey = request.headers.get('X-Shortcut-Key');
  const cronSecret = process.env.CRON_SECRET;

  if (secretKey !== process.env.SHORTCUTS_SECRET_KEY &&
      secretKey !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return GET(request);
}
