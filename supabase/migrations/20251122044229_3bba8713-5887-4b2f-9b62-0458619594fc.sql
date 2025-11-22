-- Add page_exit event type to support session tracking
-- This enables the WordPress plugin v2.0.2 to track page exits and calculate time spent

DO $$ 
BEGIN
  -- Add page_exit value to event_type enum if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'page_exit' 
    AND enumtypid = 'event_type'::regtype
  ) THEN
    ALTER TYPE event_type ADD VALUE 'page_exit';
    RAISE NOTICE 'Added page_exit to event_type enum';
  ELSE
    RAISE NOTICE 'page_exit already exists in event_type enum';
  END IF;
END $$;