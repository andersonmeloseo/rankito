-- Inserir evento purchase faltante para pedido #13385 (Pix)
-- Este pedido foi processado antes do deploy da auto-detecção

INSERT INTO rank_rent_conversions (
  site_id,
  page_id,
  page_url,
  page_path,
  event_type,
  is_ecommerce_event,
  session_id,
  metadata,
  ip_address,
  user_agent,
  city,
  country,
  created_at
)
SELECT 
  site_id,
  page_id,
  page_url,
  '/finalizar-compra/pedido-recebido/13385/',
  'purchase',
  true,
  session_id,
  jsonb_build_object(
    'order_id', '13385',
    'detection_method', 'manual_migration',
    'device', metadata->>'device',
    'platform', 'woocommerce',
    'payment_method', 'pix',
    'detected_at', NOW()
  ),
  ip_address,
  user_agent,
  city,
  country,
  created_at
FROM rank_rent_conversions
WHERE id = '513370d8-3af8-4540-ad9e-4e13e58a604c'
AND NOT EXISTS (
  SELECT 1 FROM rank_rent_conversions 
  WHERE site_id = 'f7c3d41b-0548-4b3c-9db1-16dee6dc0a92' 
  AND event_type = 'purchase' 
  AND metadata->>'order_id' = '13385'
);