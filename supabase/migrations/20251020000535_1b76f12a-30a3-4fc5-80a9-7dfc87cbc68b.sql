-- Remover trigger e função antiga que criava estágios de forma redundante
DROP TRIGGER IF EXISTS trigger_create_default_pipeline_stages ON profiles;
DROP FUNCTION IF EXISTS public.create_default_pipeline_stages();