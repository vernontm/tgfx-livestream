import { headers } from 'next/headers'
import { isAdmin } from '@/lib/admin'
import { saveWhopUser, getWhopUser as getWhopUserFromDb } from '@/lib/whop-users'
import ExperienceClient from './ExperienceClient'

interface PageProps {
  params: Promise<{ experienceId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// Decode JWT without verification (just to read payload)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = Buffer.from(parts[1], 'base64').toString('utf-8')
    return JSON.parse(payload)
  } catch {
    return null
  }
}

// Fetch user info from Whop API using the user token
async function getWhopUserFromToken(userToken: string): Promise<{ username: string; email: string } | null> {
  try {
    console.log('Fetching Whop user with token')
    // Use the /me endpoint with the user's token
    const response = await fetch('https://api.whop.com/api/v5/me', {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Whop /me API error:', response.status, errorText)
      return null
    }
    
    const data = await response.json()
    console.log('Whop /me API response:', JSON.stringify(data))
    return {
      username: data.username || data.name || data.id || 'Viewer',
      email: data.email || ''
    }
  } catch (err) {
    console.error('Failed to fetch Whop user from token:', err)
    return null
  }
}

export default async function ExperiencePage({ params, searchParams }: PageProps) {
  const { experienceId } = await params
  const query = await searchParams
  const headersList = await headers()
  
  // Get Whop user token from headers
  const whopUserToken = headersList.get('x-whop-user-token')
  
  let userId: string | null = null
  let whopUsername: string | null = null
  let email = ''
  
  // Decode the JWT to get user ID
  if (whopUserToken) {
    const payload = decodeJwtPayload(whopUserToken)
    if (payload && payload.sub) {
      userId = payload.sub as string
      console.log('Decoded Whop user ID from token:', userId)
      
      // First try to get from database (cached)
      const cachedUser = await getWhopUserFromDb(userId)
      if (cachedUser) {
        whopUsername = cachedUser.username
        email = cachedUser.email || ''
        console.log('Got username from database:', whopUsername)
      } else if (whopUserToken) {
        // Fetch user details from Whop API using the token
        const whopUser = await getWhopUserFromToken(whopUserToken)
        if (whopUser) {
          whopUsername = whopUser.username
          email = whopUser.email
          console.log('Fetched Whop username from API:', whopUsername)
          
          // Save to database for future use
          await saveWhopUser(userId, whopUsername, email)
        }
      }
    }
  }
  
  // Use Whop username, or check for admin query param for testing
  const isAdminMode = query.admin === '1' || query.admin === 'true'
  // Generate a unique viewer name if no Whop username is available
  const defaultViewerName = `Viewer_${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  const username = whopUsername || (isAdminMode ? 'Rayvaughnfx' : defaultViewerName)
  
  // For development/testing, allow access without Whop headers
  const effectiveUserId = userId || 'whop-user'
  const userIsAdmin = isAdmin(username) || isAdminMode
  
  console.log('User info:', { userId, username, whopUsername, isAdminMode, userIsAdmin })
  
  return (
    <ExperienceClient
      experienceId={experienceId}
      user={{
        id: effectiveUserId,
        username,
        email,
        isAdmin: userIsAdmin
      }}
    />
  )
}
