import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { isAdmin } from '@/lib/admin'
import ExperienceClient from './ExperienceClient'

interface PageProps {
  params: Promise<{ experienceId: string }>
}

export default async function ExperiencePage({ params }: PageProps) {
  const { experienceId } = await params
  const headersList = await headers()
  
  // Get user info from Whop headers
  const userId = headersList.get('x-whop-user-id')
  const username = headersList.get('x-whop-username') || 'Guest'
  const email = headersList.get('x-whop-user-email') || ''
  
  // Check if user is authenticated
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">Please access this app through Whop.</p>
        </div>
      </div>
    )
  }
  
  const userIsAdmin = isAdmin(username)
  
  return (
    <ExperienceClient
      experienceId={experienceId}
      user={{
        id: userId,
        username,
        email,
        isAdmin: userIsAdmin
      }}
    />
  )
}
