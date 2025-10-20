-- Atualizar handle_new_user() para criar estágios do pipeline junto com profile e role
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
  
  -- TERCEIRO: Criar estágios padrão do pipeline
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