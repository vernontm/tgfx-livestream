'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// This page redirects to the experience page
// Users should access the app through Whop at /experiences/[experienceId]
export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to a default experience page or show info
  }, [router])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(93, 198, 174, 0.2)' }}>
          <svg className="w-8 h-8" style={{ color: '#5dc6ae' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">TGFX Live Trading Stream</h1>
        <p className="text-zinc-400 mb-6">
          Access this app through your Whop dashboard to join the livestream.
        </p>
        <a 
          href="https://whop.com" 
          className="inline-block px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
          style={{ backgroundColor: '#5dc6ae' }}
        >
          Go to Whop
        </a>
      </div>
    </div>
  )
}
