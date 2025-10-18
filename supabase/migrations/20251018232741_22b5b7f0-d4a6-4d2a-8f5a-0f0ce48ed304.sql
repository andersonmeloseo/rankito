-- Update handle_new_user function to automatically assign 'client' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  
  -- Automatically assign 'client' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'client'::app_role);
  
  RETURN new;
END;
$$;

-- Fix Lucas's missing role
INSERT INTO public.user_roles (user_id, role)
VALUES ('f5796ed3-a5a8-481c-a611-1cae9542f999', 'client'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;