'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function MeetingLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-zinc-950">
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
  
  const meetingNumber = searchParams.get('meetingNumber') || ''
  const password = searchParams.get('password') || ''
  const title = searchParams.get('title') || 'TGFX Livestream'
  const username = searchParams.get('username') || 'Viewer'
  const isHost = searchParams.get('host') === '1'
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const initStarted = useRef(false)

  // Load Zoom SDK and join meeting
  useEffect(() => {
    if (!meetingNumber || initStarted.current) return
    initStarted.current = true

    const initZoomSDK = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Dynamically import the Zoom SDK
        const { ZoomMtg } = await import('@zoom/meetingsdk')
        
        ZoomMtg.preLoadWasm()
        ZoomMtg.prepareWebSDK()

        // Get signature from our API
        const signatureResponse = await fetch('/api/zoom/signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meetingNumber: meetingNumber,
            role: 0 // 0 = attendee, 1 = host
          })
        })

        if (!signatureResponse.ok) {
          throw new Error('Failed to get meeting signature')
        }

        const { signature } = await signatureResponse.json()
        const sdkKey = process.env.NEXT_PUBLIC_ZOOM_SDK_KEY

        if (!sdkKey) {
          throw new Error('Zoom SDK key not configured')
        }

        // Initialize the SDK with viewer-only settings (no mic/video)
        ZoomMtg.init({
          leaveUrl: window.location.origin + '/experiences/test',
          patchJsMedia: true,
          disablePreview: true,
          disableJoinAudio: false,
          disableCallOut: true,
          disableRecord: true,
          disableVoIP: true,
          audioPanelAlwaysOpen: false,
          showMeetingHeader: false,
          disableInvite: true,
          meetingInfo: ['topic', 'host'],
          success: () => {
            console.log('Zoom SDK initialized')
            
            // Join the meeting as view-only (no audio/video)
            ZoomMtg.join({
              signature: signature,
              sdkKey: sdkKey,
              meetingNumber: meetingNumber,
              userName: username,
              passWord: password,
              success: () => {
                console.log('Joined meeting successfully')
                setIsLoading(false)
                setSdkReady(true)
              },
              error: (err: Error) => {
                console.error('Failed to join meeting:', err)
                setError('Failed to join meeting. Please try again.')
                setIsLoading(false)
              }
            })
          },
          error: (err: Error) => {
            console.error('Failed to initialize Zoom SDK:', err)
            setError('Failed to initialize Zoom. Please try again.')
            setIsLoading(false)
          }
        })
      } catch (err) {
        console.error('Error setting up Zoom:', err)
        setError(err instanceof Error ? err.message : 'Failed to load Zoom')
        setIsLoading(false)
      }
    }

    initZoomSDK()
  }, [meetingNumber, password, username])

  const handleEndMeeting = async () => {
    if (confirm('Are you sure you want to end this meeting?')) {
      try {
        await fetch('/api/zoom/end-meeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingId: meetingNumber })
        })
      } catch (err) {
        console.error('Error ending meeting:', err)
      }
      router.push('/')
    }
  }

  if (!meetingNumber) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Invalid Meeting</h1>
          <p className="text-zinc-400 mb-6">No meeting number provided.</p>
          <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Go Home
          </a>
        </div>
      </div>
    )
  }

  // Host view - show controls while Zoom opens in new tab
  if (isHost) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-red-500 font-semibold">LIVE</span>
              </div>
              <h1 className="text-lg font-semibold text-white">{decodeURIComponent(title)}</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <a href="/" className="px-3 py-1.5 bg-zinc-700 text-white text-sm rounded hover:bg-zinc-600">
                Back
              </a>
              <button
                onClick={handleEndMeeting}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                End Meeting
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg w-full bg-zinc-900 rounded-lg border border-zinc-800 p-8 text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Zoom Desktop App Launching</h2>
            <p className="text-zinc-400 mb-6">
              Your Zoom desktop app should open automatically. Start your livestream there. Viewers will join via the web client.
            </p>
            <p className="text-zinc-500 text-sm mb-6">
              If Zoom didn&apos;t open, <a href={`https://zoom.us/j/${meetingNumber}?pwd=${password}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">click here to join manually</a>.
            </p>
            
            <div className="bg-zinc-800 rounded-lg p-4 text-left mb-6">
              <h3 className="text-white font-semibold mb-3">Meeting Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Meeting ID:</span>
                  <span className="text-white font-mono">{meetingNumber}</span>
                </div>
                {password && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Password:</span>
                    <span className="text-white font-mono">{password}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => window.open(`https://zoom.us/wc/${meetingNumber}/start?pwd=${password}`, '_blank')}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Reopen Zoom
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Viewer view - Zoom SDK Client View
  // The SDK will render its own UI when initialized
  if (error) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Unable to Join Meeting</h2>
          <p className="text-zinc-400 mb-6">{error}</p>
          <a href="/experiences/test" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Go Back
          </a>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Joining {decodeURIComponent(title)}...</p>
          <p className="text-zinc-500 text-sm mt-2">Connecting as {username}</p>
        </div>
      </div>
    )
  }

  // When SDK is ready, it takes over the page - return empty div
  // The Zoom SDK Client View renders its own full-page UI
  return <div id="zmmtg-root"></div>
}

export default function LiveMeetingPage() {
  return (
    <Suspense fallback={<MeetingLoader />}>
      <LiveMeetingContent />
    </Suspense>
  )
}
