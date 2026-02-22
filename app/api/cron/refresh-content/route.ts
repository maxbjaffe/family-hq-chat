import { NextResponse } from 'next/server';

// This endpoint is called by Vercel Cron every 15 minutes
// See vercel.json for cron configuration
export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the content POST endpoint to force-refresh all content
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const res = await fetch(`${baseUrl}/api/content`, { method: 'POST' });
    const data = await res.json();

    if (!res.ok) {
      console.error('Content refresh failed:', data);
      return NextResponse.json({ error: 'Content refresh failed' }, { status: 500 });
    }

    console.log('Cron: Content refreshed successfully');
    return NextResponse.json({ success: true, refreshedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Cron refresh-content error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
