-- Fix: Restrict alert creation to ambulances only
-- Drop the overly permissive policy that allows any authenticated user to create alerts
DROP POLICY IF EXISTS "Authenticated users can create alerts" ON public.alerts;

-- Create new policy: Only ambulances can create alerts for themselves
CREATE POLICY "Only ambulances can create their own alerts"
  ON public.alerts 
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ambulance_id = (
      SELECT linked_entity 
      FROM public.app_users
      WHERE auth_uid = auth.uid() 
        AND role = 'ambulance'
      LIMIT 1
    )
  );