'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  username: string
  email: string
  isAdmin: boolean
}

interface ExperienceClientProps {
  experienceId: string
  user: User
}

export default function ExperienceClient({ experienceId, user }: ExperienceClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [liveMeeting, setLiveMeeting] = useState<{
    meetingNumber: string
    password: string
    title: string
  } | null>(null)

  useEffect(() => {
    const checkForLiveMeeting = async () => {
      try {
        const response = await fetch('/api/zoom/live-meeting')
        const data = await response.json()
        
        if (data.live && data.meeting) {
          setLiveMeeting({
            meetingNumber: data.meeting.meetingNumber,
            password: data.meeting.password || '',
            title: data.meeting.title
          })
        } else {
          setLiveMeeting(null)
        }
      } catch (err) {
        console.error('Error checking for live meeting:', err)
        setLiveMeeting(null)
      } finally {
        setLoading(false)
      }
    }

    checkForLiveMeeting()

    // Poll for updates every 10 seconds
    const interval = setInterval(checkForLiveMeeting, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleJoinLive = () => {
    if (liveMeeting) {
      router.push(`/meeting/live?meetingNumber=${liveMeeting.meetingNumber}&password=${liveMeeting.password}&title=${encodeURIComponent(liveMeeting.title)}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // No live stream - show waiting message
  if (!liveMeeting) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">No Livestream Right Now</h1>
          <p className="text-zinc-400 mb-6">
            There&apos;s no active livestream at the moment. Check back later for upcoming streams!
          </p>
          <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
            <div className="w-2 h-2 bg-zinc-600 rounded-full animate-pulse"></div>
            <span>Checking for streams...</span>
          </div>
        </div>
      </div>
    )
  }

  // Live stream exists - show join button
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
          </span>
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-red-500 font-semibold">LIVE NOW</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">{liveMeeting.title}</h1>
        <p className="text-zinc-400 mb-8">
          A livestream is currently in progress. Join now to watch!
        </p>
        <button
          onClick={handleJoinLive}
          className="w-full px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-lg flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Join Livestream
        </button>
      </div>
    </div>
  )
}
