import { NextRequest, NextResponse } from 'next/server'
import { createInstantMeeting, endMeeting } from '@/lib/zoom-api'
import { supabase } from '@/lib/supabase'
import { isAdmin, getDefaultMeetingTitle } from '@/lib/admin'

export async function POST(req: NextRequest) {
  try {
    // TODO: Get actual username from Whop auth
    const host_username = 'Rayvaughnfx' // Temporarily hardcode for testing

    // Check if user is admin
    if (!isAdmin(host_username)) {
      return NextResponse.json(
        { error: 'Only admins can start meetings' },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const title = body.title || getDefaultMeetingTitle()

    // End any existing live meetings first
    if (supabase) {
      const { data: liveMeetings } = await supabase
        .from('meetings')
        .select('zoom_meeting_id')
        .eq('status', 'live')

      if (liveMeetings && liveMeetings.length > 0) {
        console.log(`Ending ${liveMeetings.length} existing live meetings...`)
        for (const meeting of liveMeetings) {
          try {
            await endMeeting(meeting.zoom_meeting_id)
          } catch (err) {
            console.error('Error ending meeting:', meeting.zoom_meeting_id, err)
          }
        }
        
        // Mark all as ended in database
        await supabase
          .from('meetings')
          .update({ status: 'ended' })
          .eq('status', 'live')
      }
    }

    // Create instant meeting via Zoom API
    const zoomMeeting = await createInstantMeeting(title)

    // Save to database
    if (supabase) {
      const { error: dbError } = await supabase
        .from('meetings')
        .insert({
          zoom_meeting_id: String(zoomMeeting.id),
          zoom_password: zoomMeeting.password,
          title,
          host_id: host_username,
          status: 'live'
        })

      if (dbError) {
        console.error('Error saving meeting to database:', dbError)
      }
    }

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
