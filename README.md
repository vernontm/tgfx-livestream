# TGFX Livestream - Whop Zoom App

An embedded Whop app using Next.js 14+, Supabase, and Zoom Meeting SDK for livestreaming within the Whop platform.

## Features

- **Whop Integration** - Embedded app with user authentication
- **Instant Meetings** - One-click "Go Live" button (admin only)
- **Zoom Meeting SDK** - Component View for embedded meetings
- **Split-Screen Layout** - Video (70%) + Chat sidebar (30%)
- **Fullscreen Mode** - Toggle to expand video and hide chat
- **Auto-dated Titles** - Format: `TGFX Livestream MM-DD-YYYY`
- **Admin Controls** - Only `Rayvaughnfx` can start meetings

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Whop SDK (@whop-apps/sdk)
- **Video**: Zoom Meeting SDK (@zoom/meetingsdk)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Whop App Setup

1. Create a Whop App on your [Whop Developer Dashboard](https://whop.com/dashboard/developer/)

2. In the **Hosting** section, set:
   - **Base URL**: Your deployed domain (e.g., `https://your-app.vercel.app`)
   - **App path**: `/experiences/[experienceId]`

3. Get your credentials from the dashboard and add to `.env.local`

## Environment Variables

```env
# Zoom SDK (for joining meetings)
ZOOM_SDK_KEY=your_sdk_key
ZOOM_SDK_SECRET=your_sdk_secret
NEXT_PUBLIC_ZOOM_SDK_KEY=your_sdk_key

# Zoom Server-to-Server OAuth (for creating meetings)
ZOOM_ACCOUNT_ID=your_account_id
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Whop
WHOP_API_KEY=your_whop_api_key
NEXT_PUBLIC_WHOP_APP_ID=your_whop_app_id

# App Config
NEXT_PUBLIC_DEFAULT_MEETING_TITLE=TGFX Livestream
ADMIN_USERNAMES=Rayvaughnfx
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home page (standalone) |
| `/experiences/[experienceId]` | Whop embedded app entry |
| `/experiences/[experienceId]/live` | Live meeting page |
| `/api/zoom/create-meeting` | Create instant Zoom meeting |
| `/api/zoom/signature` | Generate JWT for SDK |
| `/api/zoom/end-meeting` | End a meeting |

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment

1. Deploy to Vercel
2. Update Whop app **Base URL** to your Vercel domain
3. Add environment variables in Vercel dashboard

## Admin Access

Only users with username `Rayvaughnfx` (configured in `ADMIN_USERNAMES`) can:
- Start instant meetings
- End meetings

Regular users can only join active meetings.
