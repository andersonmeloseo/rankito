-- Adicionar novos campos para perfil de usuário moderno
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Sao_Paulo',
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'light',
ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true;

-- Comentários descritivos
COMMENT ON COLUMN profiles.avatar_url IS 'URL da foto de perfil do usuário';
COMMENT ON COLUMN profiles.bio IS 'Biografia/descrição curta do usuário';
COMMENT ON COLUMN profiles.timezone IS 'Fuso horário preferido do usuário';
COMMENT ON COLUMN profiles.theme IS 'Tema visual: light, dark ou system';
COMMENT ON COLUMN profiles.notifications_enabled IS 'Habilitar notificações no sistema';
COMMENT ON COLUMN profiles.email_notifications IS 'Habilitar notificações por email';

-- Criar bucket de avatares (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para avatares
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);