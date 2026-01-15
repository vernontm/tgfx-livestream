import { NextRequest, NextResponse } from 'next/server'

// This endpoint is not used - meetings are detected directly from Zoom API
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return NextResponse.json({ error: 'Not implemented - use /api/zoom/live-meeting instead', meetingId: id }, { status: 501 })
}
