-- Corrigir cores dos estágios padrão (de -500 para -100)
UPDATE crm_pipeline_stages 
SET color = CASE stage_key
  WHEN 'lead' THEN 'bg-slate-100'
  WHEN 'contact' THEN 'bg-blue-100'
  WHEN 'proposal' THEN 'bg-purple-100'
  WHEN 'negotiation' THEN 'bg-yellow-100'
  WHEN 'won' THEN 'bg-green-100'
  WHEN 'lost' THEN 'bg-red-100'
END
WHERE stage_key IN ('lead', 'contact', 'proposal', 'negotiation', 'won', 'lost')
  AND is_system = true;

-- Corrigir display_order (de 0-5 para 1-6)
UPDATE crm_pipeline_stages 
SET display_order = CASE stage_key
  WHEN 'lead' THEN 1
  WHEN 'contact' THEN 2
  WHEN 'proposal' THEN 3
  WHEN 'negotiation' THEN 4
  WHEN 'won' THEN 5
  WHEN 'lost' THEN 6
END
WHERE stage_key IN ('lead', 'contact', 'proposal', 'negotiation', 'won', 'lost')
  AND is_system = true;

-- Atualizar a função handle_new_user para usar cores corretas
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- PRIMEIRO: Criar profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  
  -- SEGUNDO: Atribuir role 'client'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'client'::app_role);
  
  -- TERCEIRO: Criar estágios padrão do pipeline com cores corretas
  INSERT INTO crm_pipeline_stages (user_id, stage_key, label, color, display_order, is_system, is_active)
  VALUES 
    (new.id, 'lead', 'Lead', 'bg-slate-100', 1, true, true),
    (new.id, 'contact', 'Contato', 'bg-blue-100', 2, true, true),
    (new.id, 'proposal', 'Proposta', 'bg-purple-100', 3, true, true),
    (new.id, 'negotiation', 'Negociação', 'bg-yellow-100', 4, true, true),
    (new.id, 'won', 'Ganho', 'bg-green-100', 5, true, true),
    (new.id, 'lost', 'Perdido', 'bg-red-100', 6, true, true);
  
  RETURN new;
END;
$function$;