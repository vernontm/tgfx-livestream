'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Meeting } from '@/types/meeting'

function getDefaultMeetingTitle(): string {
  const baseTitle = process.env.NEXT_PUBLIC_DEFAULT_MEETING_TITLE || 'TGFX Livestream'
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const year = today.getFullYear()
  
  return `${baseTitle} ${month}-${day}-${year}`
}

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
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [startingMeeting, setStartingMeeting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check for live meetings
  const liveMeeting = meetings.find(m => m.status === 'live')

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true)

        if (!supabase) {
          setMeetings([])
          setLoading(false)
          return
        }

        const { data, error: fetchError } = await supabase
          .from('meetings')
          .select('*')
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setMeetings(data || [])
      } catch (err) {
        console.error('Error fetching meetings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMeetings()

    // Poll for updates every 10 seconds for viewers
    if (!user.isAdmin) {
      const interval = setInterval(fetchMeetings, 10000)
      return () => clearInterval(interval)
    }
  }, [user.isAdmin])

  const handleStartInstantMeeting = async () => {
    setStartingMeeting(true)
    setError(null)

    try {
      const response = await fetch('/api/zoom/create-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: getDefaultMeetingTitle()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start meeting')
      }

      router.push(`/experiences/${experienceId}/live?meetingNumber=${data.meeting.meetingNumber}&password=${data.meeting.password}&title=${encodeURIComponent(data.meeting.title)}&host=1`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start meeting')
      setStartingMeeting(false)
    }
  }

  const handleJoinLive = () => {
    if (liveMeeting) {
      const pwd = liveMeeting.zoom_password || liveMeeting.password || ''
      router.push(`/meeting/live?meetingNumber=${liveMeeting.zoom_meeting_id}&password=${pwd}&title=${encodeURIComponent(liveMeeting.title)}`)
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

  // VIEWER VIEW - Show only if live stream exists, otherwise show "no stream" message
  if (!user.isAdmin) {
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
              There's no active livestream at the moment. Check back later for upcoming streams!
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

  // ADMIN VIEW - Full dashboard
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">TGFX Livestream</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-white flex items-center gap-2">
                <span className="text-sm text-zinc-400">Welcome, </span>
                <span className="font-medium">{user.username}</span>
                <span className="px-2 py-0.5 bg-red-600 text-xs rounded">Admin</span>
              </div>
              
              <button 
                onClick={handleStartInstantMeeting}
                disabled={startingMeeting}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {startingMeeting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Starting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Go Live
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-4 bg-red-600 bg-opacity-20 border border-red-600 rounded text-red-400">
            {error}
            <button onClick={() => setError(null)} className="ml-4 text-red-300 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Start Card */}
        <div className="mb-8 p-6 bg-gradient-to-r from-green-900 to-green-800 rounded-lg border border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Ready to go live?</h3>
              <p className="text-green-200">
                Start an instant meeting: <span className="font-mono">{getDefaultMeetingTitle()}</span>
              </p>
            </div>
            <button 
              onClick={handleStartInstantMeeting}
              disabled={startingMeeting}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 font-semibold flex items-center gap-2"
            >
              {startingMeeting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Starting...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Go Live Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Meeting Alert */}
        {liveMeeting && (
          <div className="mb-8 p-4 bg-red-900 bg-opacity-30 border border-red-600 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-white font-semibold">Currently Live: {liveMeeting.title}</span>
              </div>
              <Link
                href={`/meeting/live?meetingNumber=${liveMeeting.zoom_meeting_id}&password=${liveMeeting.password || ''}&title=${encodeURIComponent(liveMeeting.title)}&host=1`}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Rejoin Stream
              </Link>
            </div>
          </div>
        )}

        {/* Past Meetings */}
        <h3 className="text-lg font-semibold text-white mb-4">Past Meetings</h3>
        
        {meetings.filter(m => m.status !== 'live').length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 rounded-lg border border-zinc-800">
            <p className="text-zinc-500">No past meetings yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.filter(m => m.status !== 'live').map((meeting) => (
              <div key={meeting.id} className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
                <h4 className="text-white font-medium mb-2">{meeting.title}</h4>
                <p className="text-zinc-500 text-sm">
                  {meeting.created_at && new Date(meeting.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
