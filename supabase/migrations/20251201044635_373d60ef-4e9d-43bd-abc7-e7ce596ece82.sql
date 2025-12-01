-- Create ENUM types for product backlog
CREATE TYPE backlog_category AS ENUM ('new_feature', 'improvement', 'bugfix', 'security');
CREATE TYPE backlog_status AS ENUM ('planned', 'in_progress', 'testing', 'completed', 'cancelled');
CREATE TYPE backlog_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Create ENUM types for feature requests
CREATE TYPE request_category AS ENUM ('new_feature', 'improvement', 'integration', 'other');
CREATE TYPE request_status AS ENUM ('pending', 'under_review', 'accepted', 'rejected', 'implemented');

-- Create product_backlog table (Admin-managed features)
CREATE TABLE public.product_backlog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category backlog_category NOT NULL DEFAULT 'new_feature',
  status backlog_status NOT NULL DEFAULT 'planned',
  priority backlog_priority NOT NULL DEFAULT 'medium',
  estimated_start_date DATE,
  estimated_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  release_version VARCHAR(50),
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feature_requests table (User-submitted requests)
CREATE TABLE public.feature_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category request_category NOT NULL DEFAULT 'new_feature',
  status request_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  rejection_reason TEXT,
  linked_backlog_id UUID REFERENCES product_backlog(id) ON DELETE SET NULL,
  votes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feature_request_votes table (User votes on requests)
CREATE TABLE public.feature_request_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(request_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_product_backlog_status ON product_backlog(status);
CREATE INDEX idx_product_backlog_is_public ON product_backlog(is_public);
CREATE INDEX idx_feature_requests_user_id ON feature_requests(user_id);
CREATE INDEX idx_feature_requests_status ON feature_requests(status);
CREATE INDEX idx_feature_requests_linked_backlog ON feature_requests(linked_backlog_id);
CREATE INDEX idx_feature_request_votes_request_id ON feature_request_votes(request_id);
CREATE INDEX idx_feature_request_votes_user_id ON feature_request_votes(user_id);

-- Create trigger to update updated_at on product_backlog
CREATE TRIGGER update_product_backlog_updated_at
  BEFORE UPDATE ON product_backlog
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update updated_at on feature_requests
CREATE TRIGGER update_feature_requests_updated_at
  BEFORE UPDATE ON feature_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update votes_count on feature_requests
CREATE OR REPLACE FUNCTION update_feature_request_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feature_requests
    SET votes_count = votes_count + 1
    WHERE id = NEW.request_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feature_requests
    SET votes_count = votes_count - 1
    WHERE id = OLD.request_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_votes_count_on_vote
  AFTER INSERT OR DELETE ON feature_request_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_request_votes_count();

-- RLS Policies for product_backlog
ALTER TABLE product_backlog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all backlog items"
  ON product_backlog
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view public backlog items"
  ON product_backlog
  FOR SELECT
  USING (is_public = true);

-- RLS Policies for feature_requests
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feature requests"
  ON feature_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feature requests"
  ON feature_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all requests for voting"
  ON feature_requests
  FOR SELECT
  USING (status NOT IN ('rejected'));

CREATE POLICY "Super admins can manage all feature requests"
  ON feature_requests
  FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for feature_request_votes
ALTER TABLE feature_request_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can vote on feature requests"
  ON feature_request_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own votes"
  ON feature_request_votes
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view all votes"
  ON feature_request_votes
  FOR SELECT
  USING (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.feature_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feature_request_votes;