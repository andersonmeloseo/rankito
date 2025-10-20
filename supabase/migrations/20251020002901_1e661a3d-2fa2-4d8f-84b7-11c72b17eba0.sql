-- Criar perfis para usuários que não têm
INSERT INTO profiles (id, full_name, email, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
  u.email,
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Criar estágios padrão para usuários sem estágios
INSERT INTO crm_pipeline_stages (user_id, stage_key, label, color, display_order, is_active, is_system)
SELECT 
  u.id as user_id,
  s.stage_key,
  s.label,
  s.color,
  s.display_order,
  true as is_active,
  true as is_system
FROM auth.users u
CROSS JOIN (
  VALUES 
    ('lead', 'Lead', 'bg-blue-500', 0),
    ('contact', 'Contato', 'bg-yellow-500', 1),
    ('proposal', 'Proposta', 'bg-purple-500', 2),
    ('negotiation', 'Negociação', 'bg-orange-500', 3),
    ('won', 'Ganho', 'bg-green-500', 4),
    ('lost', 'Perdido', 'bg-red-500', 5)
) AS s(stage_key, label, color, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM crm_pipeline_stages 
  WHERE crm_pipeline_stages.user_id = u.id
);