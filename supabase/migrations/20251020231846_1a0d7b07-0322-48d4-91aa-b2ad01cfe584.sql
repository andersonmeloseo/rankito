-- Criar bucket público para extensões
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'extensions',
  'extensions',
  true,
  10485760, -- 10MB
  ARRAY['application/zip', 'application/x-zip-compressed']
);

-- Política para permitir leitura pública de todos os arquivos
CREATE POLICY "Public access to extension files"
ON storage.objects FOR SELECT
USING (bucket_id = 'extensions');

-- Política para permitir upload apenas para usuários autenticados
CREATE POLICY "Authenticated users can upload extensions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'extensions');