-- Create table for client portal analytics
CREATE TABLE IF NOT EXISTS public.client_portal_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES rank_rent_clients(id) ON DELETE CASCADE,
  portal_token TEXT UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  report_config JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_id)
);

-- Enable RLS
ALTER TABLE public.client_portal_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own client analytics"
  ON public.client_portal_analytics
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view enabled analytics via token"
  ON public.client_portal_analytics
  FOR SELECT
  USING (enabled = true);

-- Trigger for updated_at
CREATE TRIGGER update_client_portal_analytics_updated_at
  BEFORE UPDATE ON public.client_portal_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_client_portal_analytics_token ON public.client_portal_analytics(portal_token);
CREATE INDEX idx_client_portal_analytics_client_id ON public.client_portal_analytics(client_id);