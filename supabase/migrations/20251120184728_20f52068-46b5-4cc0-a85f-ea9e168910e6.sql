
-- Popula gsc_url_indexing_requests com dados históricos dos jobs já executados
INSERT INTO gsc_url_indexing_requests (site_id, integration_id, url, status, response_data, created_at, updated_at)
SELECT 
  j.site_id,
  j.integration_id,
  url_data->>'url' as url,
  CASE 
    WHEN url_data->>'gsc' = 'success' THEN 'success'
    ELSE 'failed'
  END as status,
  url_data as response_data,
  j.created_at,
  j.created_at as updated_at
FROM gsc_indexing_jobs j
CROSS JOIN LATERAL jsonb_array_elements(j.results->'urls') as url_data
WHERE j.status = 'completed'
  AND j.integration_id IS NOT NULL
  AND j.results IS NOT NULL
  AND j.results->'urls' IS NOT NULL
ON CONFLICT DO NOTHING;
