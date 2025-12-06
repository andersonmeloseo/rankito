
-- Tabela de estratégias de marketing
CREATE TABLE public.marketing_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  channel TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'organic',
  budget_monthly NUMERIC DEFAULT 0,
  target_leads INTEGER DEFAULT 0,
  target_conversions INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned',
  responsible TEXT,
  start_date DATE,
  end_date DATE,
  kpis JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  learnings TEXT,
  priority INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de campanhas de marketing
CREATE TABLE public.marketing_campaigns_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID REFERENCES public.marketing_strategies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  channel TEXT NOT NULL,
  budget_total NUMERIC DEFAULT 0,
  budget_spent NUMERIC DEFAULT 0,
  leads INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cpa NUMERIC DEFAULT 0,
  roi NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  start_date DATE,
  end_date DATE,
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de calendário de conteúdo
CREATE TABLE public.marketing_content_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'blog',
  channel TEXT,
  status TEXT NOT NULL DEFAULT 'idea',
  scheduled_date DATE,
  published_date DATE,
  target_keywords TEXT[],
  url TEXT,
  metrics JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de metas mensais de marketing
CREATE TABLE public.marketing_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  target_leads INTEGER DEFAULT 0,
  target_conversions INTEGER DEFAULT 0,
  target_revenue NUMERIC DEFAULT 0,
  actual_leads INTEGER DEFAULT 0,
  actual_conversions INTEGER DEFAULT 0,
  actual_revenue NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(month, year)
);

-- Enable RLS
ALTER TABLE public.marketing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Super admins only
CREATE POLICY "Super admins can manage strategies" ON public.marketing_strategies
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage campaigns v2" ON public.marketing_campaigns_v2
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage content calendar" ON public.marketing_content_calendar
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage goals" ON public.marketing_goals
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_marketing_strategies_updated_at
  BEFORE UPDATE ON public.marketing_strategies
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_marketing_campaigns_v2_updated_at
  BEFORE UPDATE ON public.marketing_campaigns_v2
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_marketing_content_calendar_updated_at
  BEFORE UPDATE ON public.marketing_content_calendar
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER update_marketing_goals_updated_at
  BEFORE UPDATE ON public.marketing_goals
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Insert default goals for Dec 2025 - Mar 2026
INSERT INTO public.marketing_goals (month, year, target_leads, target_conversions, target_revenue, notes) VALUES
  (12, 2025, 150, 50, 9850, 'Lançamento + Early Adopters'),
  (1, 2026, 600, 200, 39400, 'Google Ads + LinkedIn'),
  (2, 2026, 1050, 350, 68950, 'SEO + Referral + Parcerias'),
  (3, 2026, 1200, 400, 78800, 'Escala Full + Automações');

-- Insert 7 pre-configured strategies
INSERT INTO public.marketing_strategies (name, channel, type, budget_monthly, target_leads, target_conversions, status, priority, kpis, notes) VALUES
  ('Google Ads - Performance', 'google_ads', 'paid', 4000, 150, 50, 'planned', 100, 
   '[{"name": "CTR", "target": "> 3%"}, {"name": "CPC", "target": "< R$ 5"}, {"name": "Taxa Conversão", "target": "> 25%"}]'::jsonb,
   'Campanhas: Search (software rank and rent, crm para seo), Performance Max (Remarketing + Discovery), YouTube (Tutoriais demonstrativos). CPA estimado: R$ 80-130.'),
  
  ('LinkedIn Organic + Ads', 'linkedin', 'hybrid', 1500, 40, 15, 'planned', 90,
   '[{"name": "Conexões/semana", "target": "100+"}, {"name": "Leads qualificados/semana", "target": "10+"}, {"name": "Engagement rate", "target": "> 5%"}]'::jsonb,
   'Táticas: Posts diários (cases, resultados, dicas SEO), Artigos semanais (thought leadership), Lives mensais (demonstração ao vivo), InMail para agências (50/dia), Grupos de SEO e Marketing Digital.'),
  
  ('SEO + Blog', 'seo', 'organic', 0, 500, 100, 'planned', 85,
   '[{"name": "Visitas orgânicas/mês", "target": "10.000"}, {"name": "Leads via SEO", "target": "500"}, {"name": "Posição keywords", "target": "Top 10"}]'::jsonb,
   'Conteúdo: 4 posts/mês no blog. Palavras-chave: rank and rent brasil, como monitorar sites, analytics simplificado. Guest posts em sites de marketing. Backlinks via parcerias.'),
  
  ('Programa de Referral', 'referral', 'automation', 0, 200, 80, 'planned', 80,
   '[{"name": "% conversões via referral", "target": "20%"}, {"name": "Assinantes indicados", "target": "200"}]'::jsonb,
   'Mecânica: Cliente indica → ganha 20% do primeiro mês. Indicado ganha 10% desconto. Dashboard de afiliados no sistema. Tracking automático via link único.'),
  
  ('Parcerias Estratégicas', 'partnerships', 'organic', 0, 100, 50, 'planned', 75,
   '[{"name": "Parcerias fechadas", "target": "10 até Jan/26"}, {"name": "Leads via parcerias", "target": "100"}]'::jsonb,
   'Alvos: Agências de marketing digital (white label), Consultores SEO independentes, Cursos de marketing digital (afiliados), Ferramentas complementares (integrações). Ações: Webinars conjuntos, Descontos exclusivos para alunos/clientes parceiros.'),
  
  ('Email Marketing Automático', 'email', 'automation', 0, 150, 60, 'planned', 70,
   '[{"name": "Open rate", "target": "> 40%"}, {"name": "CTR", "target": "> 8%"}, {"name": "% conversões via email", "target": "15%"}]'::jsonb,
   'Fluxos: Welcome sequence (7 emails), Nutrição de leads (14 dias), Recuperação de carrinho abandonado, Onboarding pós-assinatura, Upsell para planos superiores.'),
  
  ('Product-Led Growth', 'product', 'organic', 0, 300, 90, 'planned', 65,
   '[{"name": "Trial → Paid", "target": "30%"}, {"name": "Time to value", "target": "< 3 dias"}, {"name": "Feature adoption", "target": "> 60%"}]'::jsonb,
   'Táticas: Trial gratuito de 14 dias, Onboarding guiado no app, Feature gates para upsell, In-app prompts para upgrade, Health score de usuário.');
