-- Create view with IndexNow status for each page
CREATE OR REPLACE VIEW pages_with_indexnow_status AS
SELECT 
  p.*,
  CASE 
    WHEN s_success.url IS NOT NULL THEN 'submitted'
    WHEN s_error.url IS NOT NULL THEN 'error'
    ELSE 'not_submitted'
  END as indexnow_status,
  COALESCE(s_success.last_submitted, s_error.last_submitted) as last_indexnow_submission
FROM rank_rent_pages p
LEFT JOIN LATERAL (
  SELECT p.page_url as url, MAX(s.created_at) as last_submitted
  FROM indexnow_submissions s
  WHERE s.site_id = p.site_id 
  AND s.request_payload->'urlList' ? p.page_url
  AND s.status = 'success'
  GROUP BY p.page_url
  LIMIT 1
) s_success ON true
LEFT JOIN LATERAL (
  SELECT p.page_url as url, MAX(s.created_at) as last_submitted
  FROM indexnow_submissions s
  WHERE s.site_id = p.site_id 
  AND s.request_payload->'urlList' ? p.page_url
  AND s.status IN ('error', 'failed')
  GROUP BY p.page_url
  LIMIT 1
) s_error ON true;

-- Add RLS policies for the view (same as rank_rent_pages)
ALTER VIEW pages_with_indexnow_status SET (security_invoker = true);

-- Enable RLS on the view
-- Note: Views inherit RLS from underlying tables, but we can add policies

-- Grant select permissions
GRANT SELECT ON pages_with_indexnow_status TO authenticated;
GRANT SELECT ON pages_with_indexnow_status TO anon;