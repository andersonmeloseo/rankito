-- Criar estágios padrão para usuários existentes que ainda não têm
INSERT INTO crm_pipeline_stages (user_id, stage_key, label, color, display_order, is_system, is_active)
SELECT 
  p.id as user_id,
  s.stage_key,
  s.label,
  s.color,
  s.display_order,
  s.is_system,
  s.is_active
FROM profiles p
CROSS JOIN (
  VALUES 
    ('lead', 'Lead', 'bg-slate-100', 1, true, true),
    ('contact', 'Contato', 'bg-blue-100', 2, true, true),
    ('proposal', 'Proposta', 'bg-purple-100', 3, true, true),
    ('negotiation', 'Negociação', 'bg-yellow-100', 4, true, true),
    ('won', 'Ganho', 'bg-green-100', 5, true, true),
    ('lost', 'Perdido', 'bg-red-100', 6, true, true)
) AS s(stage_key, label, color, display_order, is_system, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM crm_pipeline_stages cps 
  WHERE cps.user_id = p.id
);