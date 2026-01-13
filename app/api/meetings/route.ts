import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { CreateMeetingRequest } from '@/types/meeting'
import { isAdmin, getDefaultMeetingTitle } from '@/lib/admin'

// GET all meetings
export async function GET(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const hostId = searchParams.get('host_id')

    let query = supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (hostId) {
      query = query.eq('host_id', hostId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ meetings: data })
  } catch (error) {
    console.error('Error fetching meetings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    )
  }
}

// POST create new meeting (Admin only)
export async function POST(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    const body: CreateMeetingRequest = await req.json()
    const { zoom_meeting_id, zoom_password, title, description, scheduled_at } = body

    // TODO: Get actual username from Whop auth
    const host_username = 'demo-user'

    // Check if user is admin by username
    if (!isAdmin(host_username)) {
      return NextResponse.json(
        { error: 'Only admins can create meetings' },
        { status: 403 }
      )
    }

    if (!zoom_meeting_id) {
      return NextResponse.json(
        { error: 'Missing required field: zoom_meeting_id' },
        { status: 400 }
      )
    }

    // Use default title with date if not provided
    const meetingTitle = title || getDefaultMeetingTitle()

    const { data, error } = await supabase
      .from('meetings')
      .insert({
        zoom_meeting_id,
        zoom_password,
        title: meetingTitle,
        description,
        host_id: host_username,
        scheduled_at,
        status: 'scheduled'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ meeting: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating meeting:', error)
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    )
  }
}
