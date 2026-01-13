import { NextRequest, NextResponse } from 'next/server'
import { endMeeting } from '@/lib/zoom-api'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/admin'

export async function POST(req: NextRequest) {
  try {
    // TODO: Get actual username from Whop auth
    const host_username = 'Rayvaughnfx'

    // Check if user is admin
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

    // End meeting via Zoom API
    await endMeeting(meetingId)

    // Update database status
    if (supabase) {
      await supabase
        .from('meetings')
        .update({ status: 'ended' })
        .eq('zoom_meeting_id', meetingId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error ending meeting:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to end meeting' },
      { status: 500 }
    )
  }
}
