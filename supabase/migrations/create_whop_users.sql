-- Create whop_users table to store Whop user information
CREATE TABLE IF NOT EXISTS whop_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  whop_user_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on whop_user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_whop_users_whop_user_id ON whop_users(whop_user_id);

-- Enable RLS
ALTER TABLE whop_users ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role can do everything" ON whop_users
  FOR ALL
  USING (true)
  WITH CHECK (true);
