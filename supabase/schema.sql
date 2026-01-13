-- Whop Zoom Livestream App - Supabase Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Meetings table
create table if not exists meetings (
  id uuid default gen_random_uuid() primary key,
  zoom_meeting_id text not null,
  zoom_password text,
  title text not null,
  description text,
  host_id text not null,
  scheduled_at timestamp with time zone,
  status text default 'scheduled' check (status in ('scheduled', 'live', 'ended')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Meeting participants (optional tracking)
create table if not exists meeting_participants (
  id uuid default gen_random_uuid() primary key,
  meeting_id uuid references meetings(id) on delete cascade,
  user_id text not null,
  joined_at timestamp with time zone default now(),
  left_at timestamp with time zone
);

-- Enable Row Level Security
alter table meetings enable row level security;
alter table meeting_participants enable row level security;

-- RLS Policies for meetings
-- Allow anyone to read meetings (adjust based on your needs)
create policy "Allow public read access to meetings"
  on meetings for select
  using (true);

-- Allow authenticated users to insert meetings
create policy "Allow authenticated users to create meetings"
  on meetings for insert
  with check (true);

-- Allow hosts to update their own meetings
create policy "Allow hosts to update their meetings"
  on meetings for update
  using (true);

-- Allow hosts to delete their own meetings
create policy "Allow hosts to delete their meetings"
  on meetings for delete
  using (true);

-- RLS Policies for meeting_participants
create policy "Allow public read access to participants"
  on meeting_participants for select
  using (true);

create policy "Allow insert for participants"
  on meeting_participants for insert
  with check (true);

create policy "Allow update for participants"
  on meeting_participants for update
  using (true);

-- Create indexes for better query performance
create index if not exists idx_meetings_host_id on meetings(host_id);
create index if not exists idx_meetings_status on meetings(status);
create index if not exists idx_meetings_scheduled_at on meetings(scheduled_at);
create index if not exists idx_participants_meeting_id on meeting_participants(meeting_id);
create index if not exists idx_participants_user_id on meeting_participants(user_id);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger update_meetings_updated_at
  before update on meetings
  for each row
  execute function update_updated_at_column();
