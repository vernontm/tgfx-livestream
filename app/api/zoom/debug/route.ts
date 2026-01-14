import { NextResponse } from 'next/server'

export async function GET() {
  // Check if Zoom credentials are configured
  const hasAccountId = !!process.env.ZOOM_ACCOUNT_ID
  const hasClientId = !!process.env.ZOOM_CLIENT_ID
  const hasClientSecret = !!process.env.ZOOM_CLIENT_SECRET
  
  // Try to get an access token
  let tokenStatus = 'not_attempted'
  let liveMeetingsResponse = null
  
  if (hasAccountId && hasClientId && hasClientSecret) {
    try {
      const credentials = Buffer.from(
        `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
      ).toString('base64')

      const tokenResponse = await fetch(
        `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      if (tokenResponse.ok) {
        tokenStatus = 'success'
        const tokenData = await tokenResponse.json()
        
        // Try to get live meetings
        const meetingsResponse = await fetch('https://api.zoom.us/v2/users/me/meetings?type=live', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (meetingsResponse.ok) {
          liveMeetingsResponse = await meetingsResponse.json()
        } else {
          liveMeetingsResponse = { error: await meetingsResponse.text(), status: meetingsResponse.status }
        }
      } else {
        tokenStatus = `failed: ${tokenResponse.status}`
      }
    } catch (error) {
      tokenStatus = `error: ${error instanceof Error ? error.message : 'unknown'}`
    }
  }

  return NextResponse.json({
    credentials: {
      hasAccountId,
      hasClientId,
      hasClientSecret
    },
    tokenStatus,
    liveMeetings: liveMeetingsResponse
  })
}
