-- ============================================
-- FASE 1: CRIAÇÃO DE ENUM E TABELAS
-- ============================================

-- Criar enum de roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'client', 'end_client');

-- Criar tabela de roles de usuários
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Criar tabela de profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    company TEXT,
    phone TEXT,
    parent_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FASE 2: TRIGGERS E FUNCTIONS
-- ============================================

-- Function para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Security Definer Functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_parent_user_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT parent_user_id
  FROM public.profiles
  WHERE id = _user_id;
$$;

-- ============================================
-- FASE 3: MODIFICAR rank_rent_sites
-- ============================================

-- Adicionar owner_user_id
ALTER TABLE rank_rent_sites 
ADD COLUMN owner_user_id UUID;

-- Migrar dados existentes (user_id atual vira owner)
UPDATE rank_rent_sites 
SET owner_user_id = user_id;

-- Renomear user_id para created_by_user_id
ALTER TABLE rank_rent_sites 
RENAME COLUMN user_id TO created_by_user_id;

-- ============================================
-- FASE 4: ATUALIZAR RLS - rank_rent_sites
-- ============================================

-- Drop políticas antigas
DROP POLICY IF EXISTS "Users can view own sites" ON rank_rent_sites;
DROP POLICY IF EXISTS "Users can insert own sites" ON rank_rent_sites;
DROP POLICY IF EXISTS "Users can update own sites" ON rank_rent_sites;
DROP POLICY IF EXISTS "Users can delete own sites" ON rank_rent_sites;

-- Super Admin: Acesso total
CREATE POLICY "Super admins can view all sites"
ON rank_rent_sites FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert sites"
ON rank_rent_sites FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update all sites"
ON rank_rent_sites FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete all sites"
ON rank_rent_sites FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Clientes: Apenas próprios sites
CREATE POLICY "Clients can view own sites"
ON rank_rent_sites FOR SELECT
USING (
  public.has_role(auth.uid(), 'client') 
  AND owner_user_id = auth.uid()
);

CREATE POLICY "Clients can insert own sites"
ON rank_rent_sites FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'client') 
  AND owner_user_id = auth.uid()
);

CREATE POLICY "Clients can update own sites"
ON rank_rent_sites FOR UPDATE
USING (
  public.has_role(auth.uid(), 'client') 
  AND owner_user_id = auth.uid()
);

CREATE POLICY "Clients can delete own sites"
ON rank_rent_sites FOR DELETE
USING (
  public.has_role(auth.uid(), 'client') 
  AND owner_user_id = auth.uid()
);

-- Clientes Finais: Apenas sites alugados do parent
CREATE POLICY "End clients can view rented sites"
ON rank_rent_sites FOR SELECT
USING (
  public.has_role(auth.uid(), 'end_client')
  AND owner_user_id = public.get_parent_user_id(auth.uid())
  AND is_rented = true
);

-- ============================================
-- FASE 5: ATUALIZAR RLS - rank_rent_clients
-- ============================================

DROP POLICY IF EXISTS "Users can view own clients" ON rank_rent_clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON rank_rent_clients;
DROP POLICY IF EXISTS "Users can update own clients" ON rank_rent_clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON rank_rent_clients;

-- Super Admin: Todos os clientes
CREATE POLICY "Super admins can manage all clients"
ON rank_rent_clients FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Clientes: Apenas próprios
CREATE POLICY "Clients can view own clients"
ON rank_rent_clients FOR SELECT
USING (
  public.has_role(auth.uid(), 'client') 
  AND user_id = auth.uid()
);

CREATE POLICY "Clients can insert own clients"
ON rank_rent_clients FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'client') 
  AND user_id = auth.uid()
);

CREATE POLICY "Clients can update own clients"
ON rank_rent_clients FOR UPDATE
USING (
  public.has_role(auth.uid(), 'client') 
  AND user_id = auth.uid()
);

CREATE POLICY "Clients can delete own clients"
ON rank_rent_clients FOR DELETE
USING (
  public.has_role(auth.uid(), 'client') 
  AND user_id = auth.uid()
);

-- ============================================
-- FASE 6: ATUALIZAR RLS - rank_rent_pages
-- ============================================

DROP POLICY IF EXISTS "Users can view pages from own sites" ON rank_rent_pages;
DROP POLICY IF EXISTS "Users can insert pages to own sites" ON rank_rent_pages;
DROP POLICY IF EXISTS "Users can update pages from own sites" ON rank_rent_pages;
DROP POLICY IF EXISTS "Users can delete pages from own sites" ON rank_rent_pages;

-- Super Admin: Todas as páginas
CREATE POLICY "Super admins can manage all pages"
ON rank_rent_pages FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Clientes: Páginas dos próprios sites
CREATE POLICY "Clients can view own pages"
ON rank_rent_pages FOR SELECT
USING (
  public.has_role(auth.uid(), 'client')
  AND EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = rank_rent_pages.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Clients can insert own pages"
ON rank_rent_pages FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'client')
  AND EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = rank_rent_pages.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Clients can update own pages"
ON rank_rent_pages FOR UPDATE
USING (
  public.has_role(auth.uid(), 'client')
  AND EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = rank_rent_pages.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Clients can delete own pages"
ON rank_rent_pages FOR DELETE
USING (
  public.has_role(auth.uid(), 'client')
  AND EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = rank_rent_pages.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
);

-- Clientes Finais: Apenas páginas alugadas
CREATE POLICY "End clients can view rented pages"
ON rank_rent_pages FOR SELECT
USING (
  public.has_role(auth.uid(), 'end_client')
  AND EXISTS (
    SELECT 1 FROM rank_rent_sites s
    WHERE s.id = rank_rent_pages.site_id
    AND s.owner_user_id = public.get_parent_user_id(auth.uid())
    AND s.is_rented = true
    AND rank_rent_pages.is_rented = true
  )
);

-- ============================================
-- FASE 7: ATUALIZAR RLS - rank_rent_conversions
-- ============================================

DROP POLICY IF EXISTS "Users can view conversions from own sites" ON rank_rent_conversions;

-- Super Admin: Todas as conversões
CREATE POLICY "Super admins can view all conversions"
ON rank_rent_conversions FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Clientes: Conversões dos próprios sites
CREATE POLICY "Clients can view own conversions"
ON rank_rent_conversions FOR SELECT
USING (
  public.has_role(auth.uid(), 'client')
  AND EXISTS (
    SELECT 1 FROM rank_rent_sites
    WHERE rank_rent_sites.id = rank_rent_conversions.site_id
    AND rank_rent_sites.owner_user_id = auth.uid()
  )
);

-- Clientes Finais: Apenas conversões dos sites alugados
CREATE POLICY "End clients can view rented conversions"
ON rank_rent_conversions FOR SELECT
USING (
  public.has_role(auth.uid(), 'end_client')
  AND EXISTS (
    SELECT 1 FROM rank_rent_sites s
    WHERE s.id = rank_rent_conversions.site_id
    AND s.owner_user_id = public.get_parent_user_id(auth.uid())
    AND s.is_rented = true
  )
);

-- ============================================
-- FASE 8: ATUALIZAR RLS - rank_rent_payments
-- ============================================

DROP POLICY IF EXISTS "Users can view own payments" ON rank_rent_payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON rank_rent_payments;
DROP POLICY IF EXISTS "Users can update own payments" ON rank_rent_payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON rank_rent_payments;

-- Super Admin: Todos os pagamentos
CREATE POLICY "Super admins can manage all payments"
ON rank_rent_payments FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Clientes: Apenas próprios pagamentos
CREATE POLICY "Clients can view own payments"
ON rank_rent_payments FOR SELECT
USING (
  public.has_role(auth.uid(), 'client') 
  AND user_id = auth.uid()
);

CREATE POLICY "Clients can insert own payments"
ON rank_rent_payments FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'client') 
  AND user_id = auth.uid()
);

CREATE POLICY "Clients can update own payments"
ON rank_rent_payments FOR UPDATE
USING (
  public.has_role(auth.uid(), 'client') 
  AND user_id = auth.uid()
);

CREATE POLICY "Clients can delete own payments"
ON rank_rent_payments FOR DELETE
USING (
  public.has_role(auth.uid(), 'client') 
  AND user_id = auth.uid()
);

-- ============================================
-- FASE 9: RLS - profiles e user_roles
-- ============================================

-- Profiles: Usuários veem próprio profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Super Admin vê todos os profiles
CREATE POLICY "Super admins can view all profiles"
ON profiles FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage all profiles"
ON profiles FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Clientes veem profiles dos seus end_clients
CREATE POLICY "Clients can view their end clients profiles"
ON profiles FOR SELECT
USING (
  public.has_role(auth.uid(), 'client')
  AND parent_user_id = auth.uid()
);

-- user_roles: Usuários veem própria role
CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Super Admin gerencia todas as roles
CREATE POLICY "Super admins can manage all roles"
ON user_roles FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));