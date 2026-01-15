import { NextRequest, NextResponse } from 'next/server'
import { endMeeting } from '@/lib/zoom-api'
import { isAdmin } from '@/lib/admin'

export async function POST(req: NextRequest) {
  try {
    const host_username = 'Rayvaughnfx'

    if (!isAdmin(host_username)) {
      return NextResponse.json(
        { error: 'Only admins can end meetings' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { meetingId } = body

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Meeting ID is required' },
        { status: 400 }
      )
    }

    await endMeeting(meetingId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error ending meeting:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to end meeting' },
      { status: 500 }
    )
  }
}
