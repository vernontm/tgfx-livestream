'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { useFullscreen } from '@/lib/fullscreen'
import { supabase } from '@/lib/supabase'
import { Meeting } from '@/types/meeting'

// Dynamically import ZoomMeeting to avoid SSR issues
const ZoomMeeting = dynamic(
  () => import('@/components/zoom/ZoomMeeting'),
  { ssr: false, loading: () => <MeetingLoader /> }
)

const ZoomChat = dynamic(
  () => import('@/components/zoom/ZoomChat'),
  { ssr: false }
)

function MeetingLoader() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-900">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading meeting...</p>
      </div>
    </div>
  )
}

export default function MeetingPage() {
  const params = useParams()
  const meetingId = params.id as string
  
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoomClient, setZoomClient] = useState<any>(null)
  const [user, setUser] = useState({ name: 'Guest User', email: 'guest@example.com' })
  
  const containerRef = useRef<HTMLDivElement>(null) as any
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef)

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        setLoading(true)
        
        if (!supabase) {
          setError('Database not configured')
          return
        }
        
        const { data, error } = await supabase
          .from('meetings')
          .select('*')
          .eq('id', meetingId)
          .single()

        if (error) throw error
        
        setMeeting(data)
        
        // TODO: Get actual user from Whop auth
        setUser({
          name: 'Demo User',
          email: 'demo@example.com'
        })
        
      } catch (err) {
        console.error('Error fetching meeting:', err)
        setError(err instanceof Error ? err.message : 'Failed to load meeting')
      } finally {
        setLoading(false)
      }
    }

    if (meetingId) {
      fetchMeeting()
    }
  }, [meetingId])

  const handleMeetingJoined = () => {
    console.log('Meeting joined')
  }

  const handleMeetingLeft = () => {
    console.log('Meeting left')
  }

  if (loading) {
    return <MeetingLoader />
  }

  if (error || !meeting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Meeting Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'This meeting does not exist or you do not have access.'}</p>
          <a
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">{meeting.title}</h1>
            {meeting.description && (
              <p className="text-gray-400 text-sm mt-1">{meeting.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              meeting.status === 'live' 
                ? 'bg-green-600 text-white' 
                : meeting.status === 'ended'
                ? 'bg-gray-600 text-white'
                : 'bg-blue-600 text-white'
            }`}>
              {meeting.status.toUpperCase()}
            </span>
            
            <button
              onClick={toggleFullscreen}
              className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 flex items-center gap-2"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isFullscreen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                )}
              </svg>
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Zoom Video (70% width) */}
        <div className={`${isFullscreen ? 'w-full' : 'w-[70%]'} relative bg-black`}>
          <ZoomMeeting
            meetingNumber={meeting.zoom_meeting_id}
            password={meeting.zoom_password}
            userName={user.name}
            userEmail={user.email}
            role={0} // Attendee role - change based on user permissions
            onFullscreenToggle={toggleFullscreen}
            onMeetingJoined={handleMeetingJoined}
            onMeetingLeft={handleMeetingLeft}
          />
        </div>

        {/* Chat Sidebar (30% width) */}
        {!isFullscreen && (
          <div className="w-[30%] flex-shrink-0">
            <ZoomChat client={zoomClient} userName={user.name} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div>
            Meeting ID: {meeting.zoom_meeting_id}
          </div>
          <div>
            {meeting.password && `Password: ${meeting.password}`}
          </div>
        </div>
      </footer>
    </div>
  )
}
