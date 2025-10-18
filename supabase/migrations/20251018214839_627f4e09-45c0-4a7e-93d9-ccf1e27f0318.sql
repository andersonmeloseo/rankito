-- Criar tabela de pagamentos para controle de mensalidades
CREATE TABLE public.rank_rent_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES rank_rent_sites(id) ON DELETE CASCADE,
  client_id UUID REFERENCES rank_rent_clients(id) ON DELETE SET NULL,
  
  -- Dados do pagamento
  due_date DATE NOT NULL,
  payment_date DATE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, overdue, cancelled
  payment_method TEXT,
  
  -- Rastreabilidade
  reference_month TEXT NOT NULL, -- "2025-10" formato YYYY-MM
  notes TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_payments_user_id ON rank_rent_payments(user_id);
CREATE INDEX idx_payments_site_id ON rank_rent_payments(site_id);
CREATE INDEX idx_payments_status ON rank_rent_payments(status);
CREATE INDEX idx_payments_due_date ON rank_rent_payments(due_date);
CREATE INDEX idx_payments_reference_month ON rank_rent_payments(reference_month);

-- RLS Policies
ALTER TABLE rank_rent_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON rank_rent_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON rank_rent_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments"
  ON rank_rent_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments"
  ON rank_rent_payments FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_rank_rent_payments_updated_at
  BEFORE UPDATE ON rank_rent_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();