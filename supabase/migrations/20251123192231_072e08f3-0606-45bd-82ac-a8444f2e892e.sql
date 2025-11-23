-- Extend google_business_profiles table with comprehensive fields
ALTER TABLE google_business_profiles
ADD COLUMN IF NOT EXISTS is_mock boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS business_email text,
ADD COLUMN IF NOT EXISTS business_website text,
ADD COLUMN IF NOT EXISTS business_hours jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS service_area jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS profile_photo_url text,
ADD COLUMN IF NOT EXISTS cover_photo_url text,
ADD COLUMN IF NOT EXISTS total_reviews integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_photos integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS attributes jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS business_description text,
ADD COLUMN IF NOT EXISTS opening_date date;

-- Create gbp_photos table
CREATE TABLE IF NOT EXISTS gbp_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES google_business_profiles(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  photo_type text NOT NULL DEFAULT 'interior',
  caption text,
  uploaded_at timestamp with time zone DEFAULT now(),
  view_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Create gbp_questions table
CREATE TABLE IF NOT EXISTS gbp_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES google_business_profiles(id) ON DELETE CASCADE,
  site_id uuid NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  answer_text text,
  asked_by text,
  answered_at timestamp with time zone,
  is_answered boolean DEFAULT false,
  upvotes integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create gbp_notifications table
CREATE TABLE IF NOT EXISTS gbp_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES google_business_profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Extend gbp_analytics table with more metrics
ALTER TABLE gbp_analytics
ADD COLUMN IF NOT EXISTS local_post_views integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS local_post_actions integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS queries_chain integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS queries_direct integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS booking_clicks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS food_orders integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS food_menu_clicks integer DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE gbp_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gbp_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gbp_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gbp_photos
CREATE POLICY "Users can view own profile photos" ON gbp_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM google_business_profiles gbp
      WHERE gbp.id = gbp_photos.profile_id
      AND gbp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own profile photos" ON gbp_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM google_business_profiles gbp
      WHERE gbp.id = gbp_photos.profile_id
      AND gbp.user_id = auth.uid()
    )
  );

-- RLS Policies for gbp_questions
CREATE POLICY "Users can view own profile questions" ON gbp_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM google_business_profiles gbp
      WHERE gbp.id = gbp_questions.profile_id
      AND gbp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own profile questions" ON gbp_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM google_business_profiles gbp
      WHERE gbp.id = gbp_questions.profile_id
      AND gbp.user_id = auth.uid()
    )
  );

-- RLS Policies for gbp_notifications
CREATE POLICY "Users can view own notifications" ON gbp_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM google_business_profiles gbp
      WHERE gbp.id = gbp_notifications.profile_id
      AND gbp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own notifications" ON gbp_notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM google_business_profiles gbp
      WHERE gbp.id = gbp_notifications.profile_id
      AND gbp.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gbp_photos_profile_id ON gbp_photos(profile_id);
CREATE INDEX IF NOT EXISTS idx_gbp_questions_profile_id ON gbp_questions(profile_id);
CREATE INDEX IF NOT EXISTS idx_gbp_notifications_profile_id ON gbp_notifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_gbp_notifications_is_read ON gbp_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_google_business_profiles_is_mock ON google_business_profiles(is_mock);