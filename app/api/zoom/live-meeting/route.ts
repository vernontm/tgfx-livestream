import { NextResponse } from 'next/server'
import { getLiveMeetingFromZoom } from '@/lib/zoom-api'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Checking for live meeting...')
    console.log('Supabase configured:', !!supabase)
    
    // First check database for meetings marked as live
    // (This is more reliable than Zoom API which only shows "started" meetings)
    if (supabase) {
      const { data: dbLiveMeeting, error: dbError } = await supabase
        .from('meetings')
        .select('*')
        .eq('status', 'live')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      console.log('Database query result:', { dbLiveMeeting, dbError })

      if (dbError) {
        console.error('Database error:', dbError)
      }

      if (dbLiveMeeting) {
        console.log('Found live meeting in database:', dbLiveMeeting.zoom_meeting_id)
        return NextResponse.json({
          live: true,
          meeting: {
            id: dbLiveMeeting.id,
            meetingNumber: dbLiveMeeting.zoom_meeting_id,
            password: dbLiveMeeting.zoom_password || '',
            title: dbLiveMeeting.title
          }
        })
      }
    } else {
      console.log('Supabase not configured, skipping database check')
    }

    // Fallback: Check Zoom API for live meetings
    const zoomLiveMeeting = await getLiveMeetingFromZoom()

    if (zoomLiveMeeting) {
      console.log('Found live meeting from Zoom API:', zoomLiveMeeting.id)
      
      // Sync to database
      if (supabase) {
        const { data: existingMeeting } = await supabase
          .from('meetings')
          .select('*')
          .eq('zoom_meeting_id', zoomLiveMeeting.id)
          .single()

        if (existingMeeting) {
          await supabase
            .from('meetings')
            .update({ status: 'live' })
            .eq('zoom_meeting_id', zoomLiveMeeting.id)

          return NextResponse.json({
            live: true,
            meeting: {
              id: existingMeeting.id,
              meetingNumber: zoomLiveMeeting.id,
              password: existingMeeting.zoom_password || zoomLiveMeeting.password || '',
              title: existingMeeting.title || zoomLiveMeeting.topic
            }
          })
        }
      }

      return NextResponse.json({
        live: true,
        meeting: {
          meetingNumber: zoomLiveMeeting.id,
          password: zoomLiveMeeting.password || '',
          title: zoomLiveMeeting.topic
        }
      })
    }

    // No live meeting found
    console.log('No live meeting found')
    return NextResponse.json({
      live: false,
      meeting: null
    })
  } catch (error) {
    console.error('Error checking live meeting:', error)
    return NextResponse.json(
      { error: 'Failed to check live meeting status' },
      { status: 500 }
    )
  }
}
