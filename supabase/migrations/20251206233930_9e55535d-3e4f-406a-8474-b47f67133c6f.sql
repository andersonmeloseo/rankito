-- Add scroll depth and time on page fields to conversion_goals
ALTER TABLE public.conversion_goals 
ADD COLUMN IF NOT EXISTS min_scroll_depth integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS min_time_seconds integer DEFAULT NULL;

-- Add comment explaining the fields
COMMENT ON COLUMN public.conversion_goals.min_scroll_depth IS 'Minimum scroll depth percentage (25, 50, 75, 100) for scroll_depth goal type';
COMMENT ON COLUMN public.conversion_goals.min_time_seconds IS 'Minimum time in seconds on page for time_on_page goal type';