-- Atribuir role de super_admin para andersonmeloseo@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('a3e86497-f6ec-4c3f-a3d2-9f1c315ba41f', 'super_admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;