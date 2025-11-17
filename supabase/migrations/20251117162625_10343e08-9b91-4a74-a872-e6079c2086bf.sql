-- Add new e-commerce event types to the event_type enum
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'product_view';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'add_to_cart';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'remove_from_cart';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'begin_checkout';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'purchase';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'search';