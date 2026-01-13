import { NextResponse } from 'next/server'
import { getLiveMeetingFromZoom } from '@/lib/zoom-api'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Get the actual live meeting from Zoom API
    const zoomLiveMeeting = await getLiveMeetingFromZoom()

    if (!zoomLiveMeeting) {
      // No live meeting on Zoom - update database to reflect this
      if (supabase) {
        await supabase
          .from('meetings')
          .update({ status: 'ended' })
          .eq('status', 'live')
      }

      return NextResponse.json({
        live: false,
        meeting: null
      })
    }

    // There's a live meeting on Zoom - make sure database is in sync
    if (supabase) {
      // Mark any other meetings as ended
      await supabase
        .from('meetings')
        .update({ status: 'ended' })
        .eq('status', 'live')
        .neq('zoom_meeting_id', zoomLiveMeeting.id)

      // Check if this meeting exists in database
      const { data: existingMeeting } = await supabase
        .from('meetings')
        .select('*')
        .eq('zoom_meeting_id', zoomLiveMeeting.id)
        .single()

      if (existingMeeting) {
        // Update status to live if not already
        if (existingMeeting.status !== 'live') {
          await supabase
            .from('meetings')
            .update({ status: 'live' })
            .eq('zoom_meeting_id', zoomLiveMeeting.id)
        }

        return NextResponse.json({
          live: true,
          meeting: {
            id: existingMeeting.id,
            meetingNumber: zoomLiveMeeting.id,
            password: existingMeeting.zoom_password || zoomLiveMeeting.password || '',
            title: existingMeeting.title || zoomLiveMeeting.topic
          }
        })
      } else {
        // Meeting exists on Zoom but not in database - add it
        const { data: newMeeting } = await supabase
          .from('meetings')
          .insert({
            zoom_meeting_id: zoomLiveMeeting.id,
            zoom_password: zoomLiveMeeting.password,
            title: zoomLiveMeeting.topic,
            host_id: 'admin',
            status: 'live'
          })
          .select()
          .single()

        return NextResponse.json({
          live: true,
          meeting: {
            id: newMeeting?.id,
            meetingNumber: zoomLiveMeeting.id,
            password: zoomLiveMeeting.password || '',
            title: zoomLiveMeeting.topic
          }
        })
      }
    }

    // No database - just return Zoom data
    return NextResponse.json({
      live: true,
      meeting: {
        meetingNumber: zoomLiveMeeting.id,
        password: zoomLiveMeeting.password || '',
        title: zoomLiveMeeting.topic
      }
    })
  } catch (error) {
    console.error('Error checking live meeting:', error)
    return NextResponse.json(
      { error: 'Failed to check live meeting status' },
      { status: 500 }
    )
  }
}
