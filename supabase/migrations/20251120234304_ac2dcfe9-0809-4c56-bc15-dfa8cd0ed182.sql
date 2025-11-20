-- Create training modules table
CREATE TABLE public.training_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training videos table
CREATE TABLE public.training_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_provider TEXT NOT NULL CHECK (video_provider IN ('wistia', 'youtube', 'vimeo')),
  video_id TEXT NOT NULL,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_free BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user video progress table
CREATE TABLE public.user_video_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.training_videos(id) ON DELETE CASCADE,
  last_position_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Enable RLS
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_video_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_modules
CREATE POLICY "Public can view active modules"
  ON public.training_modules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admins can manage modules"
  ON public.training_modules FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for training_videos
CREATE POLICY "Public can view active videos"
  ON public.training_videos FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admins can manage videos"
  ON public.training_videos FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for user_video_progress
CREATE POLICY "Users can view own progress"
  ON public.user_video_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_video_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_video_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all progress"
  ON public.user_video_progress FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create indexes
CREATE INDEX idx_training_videos_module_id ON public.training_videos(module_id);
CREATE INDEX idx_training_videos_display_order ON public.training_videos(display_order);
CREATE INDEX idx_training_modules_display_order ON public.training_modules(display_order);
CREATE INDEX idx_user_video_progress_user_id ON public.user_video_progress(user_id);
CREATE INDEX idx_user_video_progress_video_id ON public.user_video_progress(video_id);

-- Create updated_at trigger
CREATE TRIGGER update_training_modules_updated_at
  BEFORE UPDATE ON public.training_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_videos_updated_at
  BEFORE UPDATE ON public.training_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_video_progress_updated_at
  BEFORE UPDATE ON public.user_video_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();