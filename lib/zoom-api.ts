// Zoom API integration for creating instant meetings

interface ZoomTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface ZoomMeetingResponse {
  id: number
  topic: string
  password: string
  join_url: string
  start_url: string
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getZoomAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  const accountId = process.env.ZOOM_ACCOUNT_ID
  const clientId = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Zoom API credentials not configured')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get Zoom access token: ${error}`)
  }

  const data: ZoomTokenResponse = await response.json()
  
  // Cache the token (expire 5 minutes early to be safe)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000
  }

  return data.access_token
}

export async function createInstantMeeting(topic: string): Promise<ZoomMeetingResponse> {
  const accessToken = await getZoomAccessToken()

  const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      topic,
      type: 2, // Scheduled meeting (can be joined immediately)
      start_time: new Date().toISOString(),
      duration: 120, // 2 hours
      timezone: 'UTC',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true, // Allow joining before host
        mute_upon_entry: true,
        waiting_room: false,
        audio: 'both',
        auto_recording: 'none'
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Zoom API error:', error)
    throw new Error(`Failed to create Zoom meeting: ${error}`)
  }

  const meeting = await response.json()
  console.log('Created meeting:', meeting.id, meeting.topic)
  return meeting
}

export async function endMeeting(meetingId: string): Promise<void> {
  const accessToken = await getZoomAccessToken()

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'end'
    })
  })

  if (!response.ok && response.status !== 404) {
    const error = await response.text()
    throw new Error(`Failed to end Zoom meeting: ${error}`)
  }
}

export async function getMeetingStatus(meetingId: string): Promise<'waiting' | 'started' | 'ended' | 'notfound'> {
  const accessToken = await getZoomAccessToken()

  const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (response.status === 404) {
    return 'notfound'
  }

  if (!response.ok) {
    console.error('Failed to get meeting status')
    return 'notfound'
  }

  const data = await response.json()
  // Zoom meeting status: waiting, started
  return data.status || 'waiting'
}

export async function getLiveMeetingFromZoom(): Promise<{ id: string; topic: string; password?: string } | null> {
  const accessToken = await getZoomAccessToken()

  // First try to get live meetings directly
  const liveResponse = await fetch('https://api.zoom.us/v2/users/me/meetings?type=live', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (liveResponse.ok) {
    const liveData = await liveResponse.json()
    console.log('Zoom live meetings response:', JSON.stringify(liveData))
    const liveMeetings = liveData.meetings || []

    if (liveMeetings.length > 0) {
      const meeting = liveMeetings[0]
      console.log('Found live meeting:', meeting.id)
      return {
        id: String(meeting.id),
        topic: meeting.topic,
        password: meeting.password
      }
    }
  } else {
    const errorText = await liveResponse.text()
    console.error('Failed to get live meetings from Zoom:', liveResponse.status, errorText)
  }

  // Fallback: Check scheduled/upcoming meetings and see if any are "started"
  const scheduledResponse = await fetch('https://api.zoom.us/v2/users/me/meetings?type=scheduled&page_size=10', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (scheduledResponse.ok) {
    const scheduledData = await scheduledResponse.json()
    console.log('Zoom scheduled meetings count:', scheduledData.meetings?.length || 0)
    
    // Check each scheduled meeting's status
    for (const meeting of (scheduledData.meetings || [])) {
      const statusResponse = await fetch(`https://api.zoom.us/v2/meetings/${meeting.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        console.log(`Meeting ${meeting.id} status:`, statusData.status)
        
        if (statusData.status === 'started') {
          return {
            id: String(meeting.id),
            topic: meeting.topic,
            password: meeting.password || statusData.password
          }
        }
      }
    }
  }

  console.log('No live meetings found')
  return null
}

export async function endAllLiveMeetings(): Promise<void> {
  const accessToken = await getZoomAccessToken()

  // Get all live meetings for the user
  const response = await fetch('https://api.zoom.us/v2/users/me/meetings?type=live', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    console.error('Failed to get live meetings')
    return
  }

  const data = await response.json()
  const liveMeetings = data.meetings || []

  console.log(`Found ${liveMeetings.length} live meetings to end`)

  for (const meeting of liveMeetings) {
    try {
      await endMeeting(String(meeting.id))
      console.log(`Ended meeting: ${meeting.id}`)
    } catch (err) {
      console.error(`Failed to end meeting ${meeting.id}:`, err)
    }
  }
}
