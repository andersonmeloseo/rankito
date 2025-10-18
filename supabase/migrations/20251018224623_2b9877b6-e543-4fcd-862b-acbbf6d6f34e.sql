-- Create enum for subscription status
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'canceled', 'expired');

-- Create enum for payment status
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  features JSONB DEFAULT '[]'::jsonb,
  max_sites INTEGER,
  max_pages_per_site INTEGER,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  status subscription_status NOT NULL DEFAULT 'trial',
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  trial_end_date DATE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create subscription_payments table
CREATE TABLE public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_date TIMESTAMPTZ,
  due_date DATE NOT NULL,
  reference_month TEXT NOT NULL,
  invoice_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscription_metrics view
CREATE OR REPLACE VIEW public.subscription_metrics AS
SELECT 
  DATE_TRUNC('month', sp.due_date) as month,
  COUNT(DISTINCT us.id) as total_subscriptions,
  COUNT(DISTINCT CASE WHEN us.status = 'active' THEN us.id END) as active_subscriptions,
  COUNT(DISTINCT CASE WHEN us.status = 'canceled' THEN us.id END) as canceled_subscriptions,
  SUM(CASE WHEN sp.status = 'paid' THEN sp.amount ELSE 0 END) as revenue,
  SUM(CASE WHEN sp.status = 'pending' THEN sp.amount ELSE 0 END) as pending_revenue,
  COUNT(CASE WHEN sp.status = 'paid' THEN 1 END) as paid_count,
  COUNT(CASE WHEN sp.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN sp.status = 'failed' THEN 1 END) as failed_count
FROM public.user_subscriptions us
LEFT JOIN public.subscription_payments sp ON sp.subscription_id = us.id
GROUP BY DATE_TRUNC('month', sp.due_date);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Super admins can manage plans"
ON public.subscription_plans FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscription"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all subscriptions"
ON public.user_subscriptions FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage all subscriptions"
ON public.user_subscriptions FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for subscription_payments
CREATE POLICY "Users can view own payments"
ON public.subscription_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all payments"
ON public.subscription_payments FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage all payments"
ON public.subscription_payments FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_payments_updated_at
BEFORE UPDATE ON public.subscription_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert 3 initial plans
INSERT INTO public.subscription_plans (name, slug, description, price, features, max_sites, max_pages_per_site, display_order) VALUES
('Starter', 'starter', 'Ideal para começar seu negócio de Rank & Rent', 97.00, 
 '["Até 3 sites", "10 páginas por site", "Suporte básico por email", "Dashboard de analytics", "Relatórios mensais"]'::jsonb, 
 3, 10, 1),
('Professional', 'professional', 'Para agências e profissionais', 297.00,
 '["Até 10 sites", "50 páginas por site", "Suporte prioritário", "Dashboard avançado", "Relatórios financeiros", "Gestão de clientes", "API access"]'::jsonb,
 10, 50, 2),
('Enterprise', 'enterprise', 'Solução completa para grandes operações', 697.00,
 '["Sites ilimitados", "Páginas ilimitadas", "Suporte dedicado 24/7", "White-label completo", "API access avançado", "Multi-usuários", "Consultoria mensal", "Integrações personalizadas"]'::jsonb,
 NULL, NULL, 3);