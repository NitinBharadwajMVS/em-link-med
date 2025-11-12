-- Fix infinite recursion in app_users RLS policies
-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all users" ON public.app_users;

-- Create a security definer function to check user roles
-- This function bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION public.check_user_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_users
    WHERE auth_uid = _user_id
      AND role = _role
  )
$$;

-- Recreate the admin policy using the security definer function
CREATE POLICY "Admins can view all users"
ON public.app_users
FOR SELECT
TO authenticated
USING (public.check_user_role(auth.uid(), 'admin'::user_role));