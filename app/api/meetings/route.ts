import { NextResponse } from 'next/server'

// This endpoint is not used - meetings are detected directly from Zoom API
export async function GET() {
  return NextResponse.json({ error: 'Not implemented - use /api/zoom/live-meeting instead' }, { status: 501 })
}
