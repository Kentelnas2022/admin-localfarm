-- =============================================================================
-- LOCALFARM PLATFORM - UNIFIED MASTER SUPABASE POSTGRESQL SCHEMA
-- Project URL : https://mfvepedmnsuwbcipfbgq.supabase.co
-- Compatible with:
--   1. React Native / Expo Mobile App (local-farm-app)
--   2. Next.js 16 Admin Web Portal (admin-localfarm)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. UTILITY FUNCTIONS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 2. USER PROFILES & AUTH SYNCHRONIZATION
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(200),
  username VARCHAR(100) UNIQUE,
  email VARCHAR(191) NOT NULL UNIQUE,
  phone_number VARCHAR(50),
  gender VARCHAR(20) DEFAULT 'Prefer not to say' CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'farmer', 'buyer', 'admin', 'super_admin')),
  role_id INT NOT NULL DEFAULT 2,
  avatar_url TEXT,
  cover_photo_url TEXT,
  bio TEXT,
  location VARCHAR(255) DEFAULT 'Iligan City, Philippines',
  farm_name VARCHAR(255),
  farm_location VARCHAR(255),
  primary_crops VARCHAR(255),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending', 'banned')),
  eula_accepted_at TIMESTAMPTZ,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_method VARCHAR(50) NOT NULL DEFAULT 'none',
  two_factor_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin check function (supports 'admin' and 'super_admin')
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 3. FARMER PROFILES & RSBSA ACCREDITATION
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.farmer_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  farmer_code VARCHAR(50) UNIQUE,
  rsbsa_number VARCHAR(100),
  farm_name VARCHAR(150) NOT NULL,
  crops VARCHAR(255) NOT NULL,
  farm_location VARCHAR(255) NOT NULL,
  hectares DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  yield_trend VARCHAR(50) NOT NULL DEFAULT '+20% YoY',
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  certifications VARCHAR(255),
  document_uri TEXT,
  rejection_reason TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farmer_profiles_user ON public.farmer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_status ON public.farmer_profiles(verification_status);

DROP TRIGGER IF EXISTS trg_farmer_profiles_updated_at ON public.farmer_profiles;
CREATE TRIGGER trg_farmer_profiles_updated_at
  BEFORE UPDATE ON public.farmer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 4. USER PRIVACY SETTINGS, SESSIONS & OTPS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_visibility VARCHAR(50) NOT NULL DEFAULT 'Public',
  post_audience VARCHAR(50) NOT NULL DEFAULT 'Public',
  story_audience VARCHAR(50) NOT NULL DEFAULT 'Public',
  tagging_permission VARCHAR(50) NOT NULL DEFAULT 'Everyone',
  connections_list_visibility VARCHAR(50) NOT NULL DEFAULT 'Public',
  pricing_visibility VARCHAR(50) NOT NULL DEFAULT 'Public',
  precise_location BOOLEAN NOT NULL DEFAULT TRUE,
  map_discovery BOOLEAN NOT NULL DEFAULT TRUE,
  messaging_scope VARCHAR(50) NOT NULL DEFAULT 'everyone',
  show_online_status BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_name VARCHAR(150) NOT NULL,
  device_type VARCHAR(50) NOT NULL DEFAULT 'phone',
  os_name VARCHAR(50),
  os_version VARCHAR(50),
  browser_or_app VARCHAR(100) DEFAULT 'LocalFarm App',
  ip_address VARCHAR(50) DEFAULT '127.0.0.1',
  location VARCHAR(150) DEFAULT 'Iligan City, Lanao Del Norte',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.otps (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(191) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otps_email ON public.otps(email);

-- =============================================================================
-- 5. CONNECTIONS, BLOCKED & RESTRICTED USERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.connections (
  id BIGSERIAL PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'connected', 'rejected', 'blocked')),
  collection_name VARCHAR(100) NOT NULL DEFAULT 'All Connections',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_connection_pair UNIQUE (sender_id, receiver_id)
);

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_block UNIQUE (user_id, blocked_user_id)
);

CREATE TABLE IF NOT EXISTS public.restricted_users (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restricted_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_restriction UNIQUE (user_id, restricted_user_id)
);

-- =============================================================================
-- 6. CHAT CONVERSATIONS & MESSAGES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id BIGSERIAL PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_conversation_participants UNIQUE (user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL DEFAULT 'text',
  image_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_delivered BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_conversation_settings (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id BIGINT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_spam BOOLEAN NOT NULL DEFAULT FALSE,
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  is_accepted BOOLEAN NOT NULL DEFAULT TRUE,
  last_read_message_id BIGINT REFERENCES public.messages(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, conversation_id)
);

-- =============================================================================
-- 7. POSTS & PRODUCE LISTINGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_post_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  category VARCHAR(50) NOT NULL DEFAULT 'General',
  privacy VARCHAR(50) NOT NULL DEFAULT 'Public',
  location VARCHAR(255) DEFAULT 'Iligan City, Philippines',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  tagged_user_ids JSONB DEFAULT '[]'::jsonb,
  likes_count INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  shares_count INT NOT NULL DEFAULT 0,
  is_pre_harvest BOOLEAN NOT NULL DEFAULT FALSE,
  expected_harvest_date DATE,
  available_quantity DECIMAL(10,2),
  reserved_quantity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  crop_name VARCHAR(150),
  unit VARCHAR(20) DEFAULT 'kg',
  price_per_unit DECIMAL(10,2),
  pickup_hub VARCHAR(255) DEFAULT 'Bogo City Public Market Hub',
  is_live_replay BOOLEAN NOT NULL DEFAULT FALSE,
  viewer_count INT NOT NULL DEFAULT 0,
  duration_seconds INT NOT NULL DEFAULT 0,
  duration_label VARCHAR(50),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_posts_updated_at ON public.posts;
CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.tagged_users (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_post_tag UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.post_likes (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_post_like UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.post_comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id BIGINT REFERENCES public.post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  comment TEXT,
  likes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sync comment and content for query compatibility
CREATE OR REPLACE FUNCTION public.sync_comment_content()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content IS NULL AND NEW.comment IS NOT NULL THEN
    NEW.content := NEW.comment;
  ELSIF NEW.comment IS NULL AND NEW.content IS NOT NULL THEN
    NEW.comment := NEW.content;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_comment_content ON public.post_comments;
CREATE TRIGGER trg_sync_comment_content
  BEFORE INSERT OR UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_comment_content();

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_comment_like UNIQUE (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.post_shares (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_type VARCHAR(50) NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saved_posts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  collection_name VARCHAR(100) NOT NULL DEFAULT 'All Saved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_saved_post UNIQUE (user_id, post_id)
);

-- Auto-update likes count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_likes_count ON public.post_likes;
CREATE TRIGGER trg_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- Auto-update comments count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_post_comments_count ON public.post_comments;
CREATE TRIGGER trg_post_comments_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- =============================================================================
-- 8. HARVEST RESERVATIONS (DIGITAL PICKUP RECEIPTS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.harvest_reservations (
  id BIGSERIAL PRIMARY KEY,
  reservation_code VARCHAR(30) NOT NULL UNIQUE,
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  crop_name VARCHAR(150) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'kg',
  price_per_unit DECIMAL(10,2) NOT NULL,
  total_estimated_amount DECIMAL(10,2) NOT NULL,
  actual_weighed_quantity DECIMAL(10,2),
  final_settled_amount DECIMAL(10,2),
  harvest_date DATE NOT NULL,
  pickup_location VARCHAR(255) NOT NULL DEFAULT 'Bogo City Public Market Hub',
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'ready_for_pickup', 'completed', 'cancelled')),
  qr_token VARCHAR(100) NOT NULL UNIQUE,
  buyer_notes TEXT,
  seller_notes TEXT,
  admin_notes TEXT,
  weighed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure admin_notes column is present if table already exists
ALTER TABLE public.harvest_reservations ADD COLUMN IF NOT EXISTS admin_notes TEXT;

DROP TRIGGER IF EXISTS trg_harvest_reservations_updated_at ON public.harvest_reservations;
CREATE TRIGGER trg_harvest_reservations_updated_at
  BEFORE UPDATE ON public.harvest_reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 9. STORIES & LIVE STREAMS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.stories (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_type VARCHAR(20) NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'text')),
  media_url TEXT,
  text_content TEXT,
  caption TEXT,
  background_color VARCHAR(20),
  music_title VARCHAR(150),
  privacy VARCHAR(50) NOT NULL DEFAULT 'Public',
  views_count INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  expired_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.story_views (
  id BIGSERIAL PRIMARY KEY,
  story_id BIGINT NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  view_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_story_view UNIQUE (story_id, viewer_id)
);

CREATE TABLE IF NOT EXISTS public.story_reactions (
  id BIGSERIAL PRIMARY KEY,
  story_id BIGINT NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type VARCHAR(50) NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.live_streams (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id BIGINT REFERENCES public.posts(id) ON DELETE SET NULL,
  title VARCHAR(255) DEFAULT 'Live Stream',
  viewer_count INT NOT NULL DEFAULT 0,
  duration_seconds INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ended' CHECK (status IN ('live', 'ended', 'scheduled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 10. NOTIFICATIONS, ANNOUNCEMENTS & MODERATION REPORTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_type VARCHAR(50) DEFAULT 'user',
  type VARCHAR(50) NOT NULL,
  title VARCHAR(150),
  content TEXT NOT NULL,
  message TEXT,
  entity_name VARCHAR(50),
  target_id BIGINT,
  reference_id BIGINT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(64) UNIQUE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'General Notice' CHECK (
    category IN ('Scam Alert', 'New Feature', 'Platform Maintenance', 'Community Guidelines', 'General Notice')
  ),
  priority VARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Urgent', 'High', 'Normal')),
  target_audience VARCHAR(100) NOT NULL DEFAULT 'All Farmers & Buyers',
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  reach_count INT NOT NULL DEFAULT 0,
  read_count INT NOT NULL DEFAULT 0,
  author VARCHAR(100) DEFAULT 'System Admin',
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id BIGSERIAL PRIMARY KEY,
  announcement_id BIGINT NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_announcement_read UNIQUE (announcement_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.reports (
  id BIGSERIAL PRIMARY KEY,
  report_code VARCHAR(50) NOT NULL UNIQUE,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_name VARCHAR(150) NOT NULL,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_user_name VARCHAR(150) NOT NULL,
  report_type VARCHAR(20) NOT NULL DEFAULT 'content' CHECK (report_type IN ('chat', 'content', 'user')),
  target_id BIGINT,
  target_type VARCHAR(50) DEFAULT 'post',
  reason VARCHAR(150) NOT NULL,
  statement TEXT NOT NULL,
  date_reported VARCHAR(50) NOT NULL,
  url VARCHAR(255) NOT NULL DEFAULT 'www.link123',
  attachment TEXT,
  attachment_url TEXT,
  conversation_id BIGINT,
  severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'high_risk', 'escalated', 'resolved', 'dismissed', 'suspended', 'banned')),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 11. COMMODITY PRICES, SUPPORT TICKETS, SETTINGS & AUDIT LOGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.commodity_prices (
  id BIGSERIAL PRIMARY KEY,
  commodity_name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'Vegetables' CHECK (
    category IN ('Vegetables', 'Fruits', 'Grains & Rice', 'Fish & Aquaculture', 'Herbs & Spices', 'Commercial Crops')
  ),
  min_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  max_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  suggested_srp DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  unit VARCHAR(50) NOT NULL DEFAULT 'kg',
  price_trend VARCHAR(20) NOT NULL DEFAULT 'stable' CHECK (price_trend IN ('stable', 'increasing', 'decreasing', 'alert')),
  change_percentage VARCHAR(20) NOT NULL DEFAULT '0%',
  market_source VARCHAR(150) NOT NULL DEFAULT 'Metro Agritrade & Local Cooperatives',
  notes VARCHAR(255),
  updated_by VARCHAR(150) DEFAULT 'admin@localfarm.com',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id VARCHAR(50) PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category VARCHAR(100) NOT NULL CHECK (
    category IN ('App Glitch', 'Fake Produce Listing', 'Buyer No-Show', 'Payment Dispute', 'Harassment', 'RSBSA / Verification', 'Other')
  ),
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Under Review' CHECK (
    status IN ('Under Review', 'Resolved', 'Received', 'Approved / Verified', 'Rejected')
  ),
  priority VARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Urgent')),
  related_user_or_listing VARCHAR(255),
  attachments JSONB DEFAULT '[]'::jsonb,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
  id INT PRIMARY KEY DEFAULT 1,
  system_name VARCHAR(150) NOT NULL DEFAULT 'LocalFarm AgroGuard Marketplace',
  org_name VARCHAR(150) NOT NULL DEFAULT 'Department of Agriculture Region X',
  email_address VARCHAR(150) NOT NULL DEFAULT 'admin@localfarm.com',
  contact_number VARCHAR(50) NOT NULL DEFAULT '+63 912 345 6789',
  language VARCHAR(50) NOT NULL DEFAULT 'English',
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Manila',
  theme_preference VARCHAR(20) NOT NULL DEFAULT 'dark' CHECK (theme_preference IN ('light', 'dark', 'system')),
  logo_url TEXT,
  two_factor_auth BOOLEAN NOT NULL DEFAULT TRUE,
  session_timeout_minutes INT NOT NULL DEFAULT 120,
  notify_scam_reports BOOLEAN NOT NULL DEFAULT TRUE,
  notify_farmer_verifications BOOLEAN NOT NULL DEFAULT TRUE,
  notify_security_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  app_version VARCHAR(20) NOT NULL DEFAULT 'v1.0.0',
  environment VARCHAR(50) NOT NULL DEFAULT 'Production',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  action VARCHAR(150) NOT NULL,
  detail TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'system' CHECK (type IN ('auth', 'announcements', 'system', 'security')),
  user_email VARCHAR(150) NOT NULL DEFAULT 'admin@localfarm.com',
  ip VARCHAR(45) NOT NULL DEFAULT '127.0.0.1',
  status VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'warning')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 12. AUTOMATIC PROFILE PROVISIONING TRIGGER (auth.users -> profiles)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name VARCHAR(100);
  v_last_name VARCHAR(100);
  v_username VARCHAR(100);
  v_role VARCHAR(20);
BEGIN
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'firstName', 'Local');
  v_last_name  := COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'lastName', 'Farmer');
  v_username   := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 4)
  );
  v_role       := COALESCE(NEW.raw_user_meta_data->>'role', 'user');

  INSERT INTO public.profiles (
    id, first_name, last_name, full_name, username, email, phone_number, role, avatar_url, location, is_verified, status
  ) VALUES (
    NEW.id, v_first_name, v_last_name, v_first_name || ' ' || v_last_name, v_username, NEW.email,
    NEW.phone, v_role, NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'location', 'Iligan City, Philippines'), FALSE, 'active'
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();

  INSERT INTO public.user_privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 13. STORAGE BUCKETS CONFIGURATION
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('posts', 'posts', true),
  ('stories', 'stories', true),
  ('documents', 'documents', false),
  ('evidence', 'evidence', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Storage policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Avatars') THEN
    CREATE POLICY "Public Read Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Posts Images') THEN
    CREATE POLICY "Public Read Posts Images" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Stories') THEN
    CREATE POLICY "Public Read Stories" ON storage.objects FOR SELECT USING (bucket_id = 'stories');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Uploads') THEN
    CREATE POLICY "Authenticated Uploads" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin Full Access Storage') THEN
    CREATE POLICY "Admin Full Access Storage" ON storage.objects FOR ALL USING (public.is_admin());
  END IF;
END $$;

-- =============================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restricted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_conversation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tagged_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commodity_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles & Settings
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Admin can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Anyone can view verified farmer profiles" ON public.farmer_profiles FOR SELECT USING (true);
CREATE POLICY "Farmers can manage own farm profile" ON public.farmer_profiles FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users manage own privacy settings" ON public.user_privacy_settings FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users manage own sessions" ON public.user_sessions FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users verify own OTP" ON public.otps FOR ALL USING (true);

-- Social & Chat
CREATE POLICY "Users view own connections" ON public.connections FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());
CREATE POLICY "Users manage own connections" ON public.connections FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());
CREATE POLICY "Users manage own blocks" ON public.blocked_users FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users manage own restrictions" ON public.restricted_users FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id OR public.is_admin());
CREATE POLICY "Users create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id OR public.is_admin());
CREATE POLICY "Users view messages in their conversations" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());
CREATE POLICY "Users send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users update messages (mark read)" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id OR auth.uid() = sender_id OR public.is_admin());
CREATE POLICY "Users manage conversation settings" ON public.user_conversation_settings FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Feed & Listings
CREATE POLICY "Posts viewable by everyone" ON public.posts FOR SELECT USING (privacy = 'Public' OR auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Authenticated users create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users modify own posts" ON public.posts FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Anyone view post likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users toggle likes" ON public.post_likes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone view comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users add comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users modify own comments" ON public.post_comments FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users manage saves" ON public.saved_posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage shares" ON public.post_shares FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone view tags" ON public.tagged_users FOR SELECT USING (true);

-- Reservations & Stories
CREATE POLICY "Parties view their reservations" ON public.harvest_reservations FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = buyer_id OR public.is_admin());
CREATE POLICY "Buyers create reservations" ON public.harvest_reservations FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Parties update reservations" ON public.harvest_reservations FOR UPDATE USING (auth.uid() = seller_id OR auth.uid() = buyer_id OR public.is_admin());
CREATE POLICY "Admin delete reservations" ON public.harvest_reservations FOR DELETE USING (public.is_admin());
CREATE POLICY "Anyone view active stories" ON public.stories FOR SELECT USING (expires_at > NOW() OR auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users create stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users view and react stories" ON public.story_views FOR ALL USING (auth.uid() = viewer_id OR public.is_admin());
CREATE POLICY "Users react stories" ON public.story_reactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone view live streams" ON public.live_streams FOR SELECT USING (true);
CREATE POLICY "Users manage live streams" ON public.live_streams FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Notifications, Announcements & Reports
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System/Admin insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone view active announcements" ON public.announcements FOR SELECT USING (is_archived = false OR public.is_admin());
CREATE POLICY "Admin manage announcements" ON public.announcements FOR ALL USING (public.is_admin());
CREATE POLICY "Users log announcement reads" ON public.announcement_reads FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id OR reporter_id IS NULL OR public.is_admin());
CREATE POLICY "Users view submitted reports" ON public.reports FOR SELECT USING (auth.uid() = reporter_id OR public.is_admin());
CREATE POLICY "Admin manage reports" ON public.reports FOR ALL USING (public.is_admin());

-- Prices, Tickets, Settings & Logs
CREATE POLICY "Anyone view commodity prices" ON public.commodity_prices FOR SELECT USING (true);
CREATE POLICY "Admin manage commodity prices" ON public.commodity_prices FOR ALL USING (public.is_admin());
CREATE POLICY "Users view own support tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users submit support tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admin manage support tickets" ON public.support_tickets FOR ALL USING (public.is_admin());
CREATE POLICY "Admin manage system settings" ON public.system_settings FOR ALL USING (public.is_admin());
CREATE POLICY "Admin manage activity logs" ON public.admin_activity_logs FOR ALL USING (public.is_admin());

-- =============================================================================
-- 15. SEED DATA
-- =============================================================================
INSERT INTO public.system_settings (
  id, system_name, org_name, email_address, contact_number, language, timezone, theme_preference,
  two_factor_auth, session_timeout_minutes, notify_scam_reports, notify_farmer_verifications, notify_security_alerts, app_version, environment
) VALUES (
  1, 'LocalFarm AgroGuard Marketplace', 'Department of Agriculture Region X', 'admin@localfarm.com',
  '+63 912 345 6789', 'English', 'Asia/Manila', 'dark', TRUE, 120, TRUE, TRUE, TRUE, 'v1.0.0', 'Production'
)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

INSERT INTO public.commodity_prices (commodity_name, category, min_price, max_price, suggested_srp, unit, price_trend, change_percentage, market_source, notes)
VALUES
  ('Sweet Yellow Corn', 'Grains & Rice', 28.00, 38.00, 35.00, 'kg', 'stable', '+0%', 'Metro Agritrade & Local Cooperatives', 'High demand in regional trading hubs'),
  ('Highland Red Tomatoes', 'Vegetables', 35.00, 50.00, 45.00, 'kg', 'decreasing', '-10%', 'Nailon Farm Gate Hub', 'Fresh harvest arrival'),
  ('Native Red Onion', 'Vegetables', 120.00, 160.00, 140.00, 'kg', 'increasing', '+15%', 'Regional Bagsakan Terminal', 'Buffer stock alert'),
  ('Carabao Mango (Export Grade)', 'Fruits', 90.00, 130.00, 110.00, 'kg', 'stable', '+2%', 'Northern Cebu Orchards', 'Peak season ongoing'),
  ('Bangus (Milkfish medium)', 'Fish & Aquaculture', 160.00, 200.00, 180.00, 'kg', 'stable', '+0%', 'Iligan Fishery Port', 'Stable daily supply')
ON CONFLICT DO NOTHING;

INSERT INTO public.announcements (slug, title, content, category, priority, target_audience, is_pinned, is_archived, reach_count)
VALUES
  ('ann-welcome-2026', 'Welcome to LocalFarm Cloud Marketplace', 'Connect directly with certified farmers, reserve crops before harvest, and verify fair trade benchmark prices.', 'General Notice', 'Normal', 'All Farmers & Buyers', true, false, 150),
  ('ann-scam-alert-gcash', 'Security Advisory: Verify Farm Gate Pickup Tokens', 'Never send advance wire transfers to unverified accounts. Always inspect the QR token receipt upon delivery.', 'Scam Alert', 'Urgent', 'All Farmers & Buyers', true, false, 320)
ON CONFLICT DO NOTHING;
