-- Add scroll_depth and time_on_page to event_type enum
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'scroll_depth';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'time_on_page';