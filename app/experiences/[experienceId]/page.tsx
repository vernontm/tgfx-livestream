import { headers } from 'next/headers'
import { isAdmin } from '@/lib/admin'
import ExperienceClient from './ExperienceClient'

interface PageProps {
  params: Promise<{ experienceId: string }>
}

export default async function ExperiencePage({ params }: PageProps) {
  const { experienceId } = await params
  const headersList = await headers()
  
  // Get user info from Whop headers (Whop sends these when embedding apps)
  const userId = headersList.get('x-whop-user-id') || headersList.get('whop-user-id')
  const username = headersList.get('x-whop-username') || headersList.get('whop-username') || 'Guest'
  const email = headersList.get('x-whop-user-email') || headersList.get('whop-user-email') || ''
  
  // For development/testing, allow access without Whop headers
  // In production within Whop iframe, headers will be present
  const effectiveUserId = userId || 'whop-user'
  const userIsAdmin = isAdmin(username)
  
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
