import { NextRequest, NextResponse } from 'next/server'
import { createInstantMeeting, endMeeting, endAllLiveMeetings } from '@/lib/zoom-api'
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

    // End ALL live meetings from Zoom API first (not just database)
    console.log('Ending all live meetings from Zoom...')
    await endAllLiveMeetings()

    // Also update database status
    if (supabase) {
      await supabase
        .from('meetings')
        .update({ status: 'ended' })
        .eq('status', 'live')
    }

    // Create instant meeting via Zoom API
    const zoomMeeting = await createInstantMeeting(title)

    // Save to database with status 'live'
    if (supabase) {
      console.log('Saving new meeting to database with status: live')
      const { data: insertedMeeting, error: dbError } = await supabase
        .from('meetings')
        .insert({
          zoom_meeting_id: String(zoomMeeting.id),
          zoom_password: zoomMeeting.password,
          title,
          host_id: host_username,
          status: 'live'
        })
        .select()
        .single()

      if (dbError) {
        console.error('Error saving meeting to database:', dbError)
      } else {
        console.log('Meeting saved successfully:', insertedMeeting)
      }
    } else {
      console.log('Supabase not configured, skipping database save')
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
