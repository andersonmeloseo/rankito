-- Criar tabela de notificações
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('conversion', 'contract_expiry', 'gsc_quota', 'gsc_indexed', 'limit_reached', 'payment_due', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Criar índices para performance
CREATE INDEX idx_notifications_user_unread ON user_notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_user_created ON user_notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_type ON user_notifications(type);

-- RLS policies
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON user_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON user_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON user_notifications FOR INSERT
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_user_notifications_updated_at
BEFORE UPDATE ON user_notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE user_notifications IS 'Store user notifications for conversions, contracts, GSC, limits, etc';
COMMENT ON COLUMN user_notifications.type IS 'Type of notification: conversion, contract_expiry, gsc_quota, gsc_indexed, limit_reached, payment_due, system';
COMMENT ON COLUMN user_notifications.metadata IS 'Additional data about the notification (site_id, client_id, etc)';

-- Criar tabela de views personalizadas
CREATE TABLE saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  view_name TEXT NOT NULL,
  view_type TEXT NOT NULL CHECK (view_type IN ('sites', 'pages', 'crm', 'clients', 'conversions')),
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  view_mode TEXT CHECK (view_mode IN ('list', 'grid', 'table', 'kanban')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX idx_saved_views_user ON saved_views(user_id, view_type);
CREATE INDEX idx_saved_views_default ON saved_views(user_id, view_type, is_default);

-- RLS policies
ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own views"
ON saved_views FOR ALL
USING (auth.uid() = user_id);

-- Trigger
CREATE TRIGGER update_saved_views_updated_at
BEFORE UPDATE ON saved_views
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE saved_views IS 'Store user custom views with filters and display preferences';
COMMENT ON COLUMN saved_views.filters IS 'JSON object with filter criteria (status, sort, search, etc)';
COMMENT ON COLUMN saved_views.view_mode IS 'Display mode: list, grid, table, or kanban';