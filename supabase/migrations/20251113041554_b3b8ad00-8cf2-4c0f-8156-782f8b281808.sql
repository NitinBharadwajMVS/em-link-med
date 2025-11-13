-- Fix: Replace broad FOR ALL policy with explicit granular policies on patients table
-- This provides better security clarity and prevents accidental write access by hospitals

-- Drop the overly broad policy
DROP POLICY IF EXISTS "Ambulances can manage their patients" ON public.patients;

-- Create explicit INSERT policy for ambulances
CREATE POLICY "Ambulances can insert patients"
  ON public.patients 
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ambulance_id IN (
      SELECT linked_entity 
      FROM public.app_users
      WHERE auth_uid = auth.uid() 
        AND role = 'ambulance'
    )
  );

-- Create explicit UPDATE policy for ambulances
CREATE POLICY "Ambulances can update their patients"
  ON public.patients 
  FOR UPDATE
  TO authenticated
  USING (
    ambulance_id IN (
      SELECT linked_entity 
      FROM public.app_users
      WHERE auth_uid = auth.uid() 
        AND role = 'ambulance'
    )
  );

-- Allow admins to manage all patients
CREATE POLICY "Admins can manage all patients"
  ON public.patients 
  FOR ALL
  TO authenticated
  USING (public.check_user_role(auth.uid(), 'admin'::user_role));