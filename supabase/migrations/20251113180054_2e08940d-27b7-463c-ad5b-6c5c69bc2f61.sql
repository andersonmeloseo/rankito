-- Adicionar campos para sistema de aprovação manual
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS selected_plan_slug TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Criar índice para buscar cadastros pendentes
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

-- Modificar função handle_new_user para não criar subscription automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- PRIMEIRO: Criar profile com is_active = false (pendente aprovação)
  INSERT INTO public.profiles (id, email, full_name, is_active)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    false  -- Conta bloqueada até aprovação
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
  
  -- NÃO CRIAR SUBSCRIPTION - Será criado apenas após aprovação manual
  
  RETURN new;
END;
$$;