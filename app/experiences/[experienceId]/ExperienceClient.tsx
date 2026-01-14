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
      router.push(`/meeting/live?meetingNumber=${liveMeeting.meetingNumber}&password=${liveMeeting.password}&title=${encodeURIComponent(liveMeeting.title)}&username=${encodeURIComponent(user.username)}`)
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

  // No live stream - show enhanced waiting message
  if (!liveMeeting) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center max-w-lg mx-auto">
          {/* Subtle background effect */}
          <div className="relative mb-8">
            <div className="absolute inset-0 blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #5dc6ae 0%, transparent 70%)' }}></div>
            
            {/* Offline icon */}
            <div className="relative w-28 h-28 mx-auto mb-6 flex items-center justify-center">
              <svg className="w-14 h-14 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Offline badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-500"></span>
            <span className="text-sm font-medium text-zinc-400">OFFLINE</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-4">No Livestream Right Now</h1>
          
          {/* Description */}
          <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
            There&apos;s no active stream at the moment. This page will automatically update when a stream goes live.
          </p>

          {/* Status indicator */}
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: '#5dc6ae' }}></div>
            </div>
            <span className="text-zinc-400 text-sm">Checking for streams...</span>
          </div>
        </div>
      </div>
    )
  }

  // Live stream exists - show enhanced join page
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="text-center max-w-lg mx-auto">
        {/* Animated background glow */}
        <div className="relative mb-8">
          <div className="absolute inset-0 blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #5dc6ae 0%, transparent 70%)' }}></div>
          
          {/* Live indicator icon */}
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full animate-pulse opacity-30" style={{ backgroundColor: '#5dc6ae' }}></div>
            <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ backgroundColor: '#5dc6ae' }}>
              <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            {/* Pulsing live dot */}
            <span className="absolute top-0 right-0 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#5dc6ae' }}></span>
              <span className="relative inline-flex rounded-full h-5 w-5" style={{ backgroundColor: '#5dc6ae' }}></span>
            </span>
          </div>
        </div>

        {/* Live badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: 'rgba(93, 198, 174, 0.15)', border: '1px solid rgba(93, 198, 174, 0.3)' }}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#5dc6ae' }}></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: '#5dc6ae' }}></span>
          </span>
          <span className="text-sm font-semibold tracking-wide" style={{ color: '#5dc6ae' }}>LIVE NOW</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-4" style={{ color: '#ffffff' }}>{liveMeeting.title}</h1>
        
        {/* Description */}
        <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
          The stream is live! Click below to join and start watching.
        </p>

        {/* Join button - centered */}
        <div className="flex justify-center">
          <button
            onClick={handleJoinLive}
            className="px-8 py-4 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-200 hover:scale-105 hover:shadow-lg"
            style={{ 
              backgroundColor: '#5dc6ae',
              boxShadow: '0 4px 20px rgba(93, 198, 174, 0.3)'
            }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Join Livestream
          </button>
        </div>

        {/* Viewer count hint */}
        <p className="text-zinc-500 text-sm mt-6">
          You&apos;ll join with audio enabled
        </p>
      </div>
    </div>
  )
}
