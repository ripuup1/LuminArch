-- ===== LUMINARCH CLIENT HUB — SCHEMA + RLS =====
-- Run this in Supabase SQL Editor or via CLI migration

-- 1. Support Tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name text,
  website_url text,
  request_type text NOT NULL DEFAULT 'other'
    CHECK (request_type IN ('content_update','design_change','bug_report','other')),
  subject     text NOT NULL,
  description text NOT NULL,
  priority    text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('normal','urgent')),
  status      text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','in_review','in_progress','deployed')),
  admin_notes text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_support_tickets_updated
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Ticket Attachments table
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name   text NOT NULL,
  file_path   text NOT NULL,
  file_size   bigint DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies — support_tickets
-- Clients can only see their own tickets
CREATE POLICY "Users can view own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Clients can insert tickets (user_id must match)
CREATE POLICY "Users can create own tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Clients cannot update or delete (admin does this via dashboard / service role)
-- No UPDATE or DELETE policies for authenticated users

-- 5. RLS Policies — ticket_attachments
CREATE POLICY "Users can view own attachments"
  ON public.ticket_attachments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attachments"
  ON public.ticket_attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_ticket_id ON public.ticket_attachments(ticket_id);

-- 7. User Profiles table (approval system)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  approved  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile (to check approval status)
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE INDEX IF NOT EXISTS idx_user_profiles_approved ON public.user_profiles(approved);

-- 8. Storage bucket (run separately in Supabase Dashboard > Storage > New Bucket)
-- Bucket name: ticket-files
-- Public: false (private)
-- File size limit: 10MB
-- Allowed MIME types: image/*, application/pdf, text/plain,
--   application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- Storage RLS policies (apply after creating bucket):
-- INSERT: (bucket_id = 'ticket-files') AND (auth.uid()::text = (storage.foldername(name))[1])
-- SELECT: (bucket_id = 'ticket-files') AND (auth.uid()::text = (storage.foldername(name))[1])
-- DELETE: (bucket_id = 'ticket-files') AND (auth.uid()::text = (storage.foldername(name))[1])
