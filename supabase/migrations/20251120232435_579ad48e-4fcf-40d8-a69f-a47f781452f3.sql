-- Add attachments column to support_messages
ALTER TABLE support_messages 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for support attachments bucket
CREATE POLICY "Users can upload own attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'support-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'support-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Super admins can view all attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'support-attachments' AND
  has_role(auth.uid(), 'super_admin'::app_role)
);