import { NextRequest, NextResponse } from 'next/server'
import { createInstantMeeting, endAllLiveMeetings } from '@/lib/zoom-api'
import { isAdmin, getDefaultMeetingTitle } from '@/lib/admin'

export async function POST(req: NextRequest) {
  try {
    // TODO: Get actual username from Whop auth
    const host_username = 'Rayvaughnfx'

    if (!isAdmin(host_username)) {
      return NextResponse.json(
        { error: 'Only admins can start meetings' },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const title = body.title || getDefaultMeetingTitle()

    // End all live meetings first
    await endAllLiveMeetings()

    // Create instant meeting via Zoom API
    const zoomMeeting = await createInstantMeeting(title)

    return NextResponse.json({
      success: true,
      meeting: {
        id: zoomMeeting.id,
        meetingNumber: String(zoomMeeting.id),
        password: zoomMeeting.password,
        joinUrl: zoomMeeting.join_url,
        startUrl: zoomMeeting.start_url,
        title
      }
    })
  } catch (error) {
    console.error('Error creating instant meeting:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create meeting' },
      { status: 500 }
    )
  }
}
