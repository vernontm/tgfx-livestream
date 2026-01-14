import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Whop Zoom Livestream',
  description: 'Embedded Zoom meetings for Whop platforms',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link type="text/css" rel="stylesheet" href="https://source.zoom.us/3.9.0/css/bootstrap.css" />
        <link type="text/css" rel="stylesheet" href="https://source.zoom.us/3.9.0/css/react-select.css" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
