-- MIGRATION 1: Atribuir planos aos usuários existentes

-- Atribuir plano Enterprise para Super Admin (andersonmeloseo@gmail.com)
INSERT INTO user_subscriptions (
  user_id,
  plan_id,
  status,
  current_period_start,
  current_period_end
)
SELECT 
  p.id,
  (SELECT id FROM subscription_plans WHERE slug = 'enterprise' AND is_active = true LIMIT 1),
  'active',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '999 years'
FROM profiles p
WHERE p.email = 'andersonmeloseo@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_subscriptions us 
    WHERE us.user_id = p.id AND us.status = 'active'
  );

-- Atribuir plano Free para todos os outros usuários sem assinatura
INSERT INTO user_subscriptions (
  user_id,
  plan_id,
  status,
  current_period_start,
  current_period_end
)
SELECT 
  p.id,
  (SELECT id FROM subscription_plans WHERE slug = 'free' AND is_active = true LIMIT 1),
  'active',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '999 years'
FROM profiles p
WHERE p.email != 'andersonmeloseo@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM user_subscriptions us 
    WHERE us.user_id = p.id AND us.status = 'active'
  );

-- MIGRATION 2: Atualizar trigger para auto-atribuir plano Free em novos signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  free_plan_id UUID;
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
  
  -- QUARTO: Atribuir plano Free automaticamente
  SELECT id INTO free_plan_id
  FROM subscription_plans
  WHERE slug = 'free' AND is_active = true
  LIMIT 1;
  
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO user_subscriptions (
      user_id,
      plan_id,
      status,
      current_period_start,
      current_period_end
    ) VALUES (
      new.id,
      free_plan_id,
      'active',
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '999 years'
    );
  END IF;
  
  RETURN new;
END;
$function$;

-- MIGRATION 3: Triggers de validação de limites

-- Função para validar limite de sites
CREATE OR REPLACE FUNCTION validate_site_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_max_sites INT;
  current_sites INT;
BEGIN
  -- Buscar limite do plano do usuário
  SELECT sp.max_sites INTO user_max_sites
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = NEW.owner_user_id
    AND us.status = 'active'
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- Se não tem assinatura ativa, verificar se é enterprise
  IF user_max_sites IS NULL AND NOT EXISTS (
    SELECT 1 FROM user_subscriptions us
    JOIN subscription_plans sp ON sp.id = us.plan_id
    WHERE us.user_id = NEW.owner_user_id
      AND us.status = 'active'
      AND sp.slug = 'enterprise'
  ) THEN
    RAISE EXCEPTION 'Você precisa de uma assinatura ativa para criar sites';
  END IF;
  
  -- Se max_sites é NULL, é ilimitado (Enterprise/Super Admin)
  IF user_max_sites IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Contar sites atuais do usuário
  SELECT COUNT(*) INTO current_sites
  FROM rank_rent_sites
  WHERE owner_user_id = NEW.owner_user_id;
  
  -- Validar limite
  IF current_sites >= user_max_sites THEN
    RAISE EXCEPTION 'Limite de % sites atingido. Faça upgrade do seu plano para criar mais sites.', user_max_sites;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger ANTES de INSERT em sites
DROP TRIGGER IF EXISTS check_site_limit_before_insert ON rank_rent_sites;
CREATE TRIGGER check_site_limit_before_insert
BEFORE INSERT ON rank_rent_sites
FOR EACH ROW
EXECUTE FUNCTION validate_site_limit();

-- Função para validar limite de páginas
CREATE OR REPLACE FUNCTION validate_page_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_max_pages INT;
  current_pages INT;
  site_owner_id UUID;
BEGIN
  -- Buscar dono do site
  SELECT owner_user_id INTO site_owner_id
  FROM rank_rent_sites
  WHERE id = NEW.site_id;
  
  -- Buscar limite do plano
  SELECT sp.max_pages_per_site INTO user_max_pages
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = site_owner_id
    AND us.status = 'active'
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- Se max_pages é NULL, é ilimitado (Enterprise)
  IF user_max_pages IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Contar páginas do site
  SELECT COUNT(*) INTO current_pages
  FROM rank_rent_pages
  WHERE site_id = NEW.site_id;
  
  -- Validar limite
  IF current_pages >= user_max_pages THEN
    RAISE EXCEPTION 'Limite de % páginas por site atingido. Faça upgrade para adicionar mais páginas.', user_max_pages;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger ANTES de INSERT em páginas
DROP TRIGGER IF EXISTS check_page_limit_before_insert ON rank_rent_pages;
CREATE TRIGGER check_page_limit_before_insert
BEFORE INSERT ON rank_rent_pages
FOR EACH ROW
EXECUTE FUNCTION validate_page_limit();