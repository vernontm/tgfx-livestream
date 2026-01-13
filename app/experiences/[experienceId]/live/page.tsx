'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { useFullscreen } from '@/lib/fullscreen'

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

function LiveMeetingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const params = useParams()
  const experienceId = params.experienceId as string
  
  const meetingNumber = searchParams.get('meetingNumber') || ''
  const password = searchParams.get('password') || ''
  const title = searchParams.get('title') || 'TGFX Livestream'
  
  const [zoomClient, setZoomClient] = useState<any>(null)
  const [isJoined, setIsJoined] = useState(false)
  const user = { name: 'Host', email: 'host@tgfx.com' } // Will be replaced by Whop user
  
  const containerRef = useRef<HTMLDivElement>(null) as any
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef)

  const handleMeetingJoined = () => {
    setIsJoined(true)
  }

  const handleMeetingLeft = () => {
    router.push(`/experiences/${experienceId}`)
  }

  const handleEndMeeting = async () => {
    if (confirm('Are you sure you want to end this meeting for everyone?')) {
      try {
        await fetch('/api/zoom/end-meeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingId: meetingNumber })
        })
      } catch (err) {
        console.error('Error ending meeting:', err)
      }
      router.push(`/experiences/${experienceId}`)
    }
  }

  if (!meetingNumber) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Invalid Meeting</h1>
          <p className="text-gray-400 mb-6">No meeting number provided.</p>
          <a href={`/experiences/${experienceId}`} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Go Back
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-red-500 font-semibold">LIVE</span>
            </div>
            <h1 className="text-xl font-semibold text-white">{decodeURIComponent(title)}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleFullscreen}
              className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isFullscreen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                )}
              </svg>
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </button>
            
            <button
              onClick={handleEndMeeting}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              End Meeting
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Zoom Video (70% width) */}
        <div className={`${isFullscreen ? 'w-full' : 'w-[70%]'} relative bg-black`}>
          <ZoomMeeting
            meetingNumber={meetingNumber}
            password={password}
            userName={user.name}
            userEmail={user.email}
            role={1}
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
          <div className="flex items-center gap-4">
            <span>Meeting ID: {meetingNumber}</span>
            {password && <span>Password: {password}</span>}
          </div>
          <div>Host: {user.name}</div>
        </div>
      </footer>
    </div>
  )
}

export default function LiveMeetingPage() {
  return (
    <Suspense fallback={<MeetingLoader />}>
      <LiveMeetingContent />
    </Suspense>
  )
}
