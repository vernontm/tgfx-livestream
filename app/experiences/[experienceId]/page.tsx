import { headers } from 'next/headers'
import { isAdmin } from '@/lib/admin'
import ExperienceClient from './ExperienceClient'

interface PageProps {
  params: Promise<{ experienceId: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ExperiencePage({ params, searchParams }: PageProps) {
  const { experienceId } = await params
  const query = await searchParams
  const headersList = await headers()
  
  // Get user info from Whop headers (Whop sends these when embedding apps)
  const userId = headersList.get('x-whop-user-id') || headersList.get('whop-user-id')
  const whopUsername = headersList.get('x-whop-username') || headersList.get('whop-username')
  const email = headersList.get('x-whop-user-email') || headersList.get('whop-user-email') || ''
  
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
