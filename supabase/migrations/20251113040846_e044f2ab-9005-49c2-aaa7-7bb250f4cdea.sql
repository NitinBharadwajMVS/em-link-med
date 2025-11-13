-- Fix: Restrict live_vitals access - Patient PHI must be protected
-- Current policies allow ANYONE to view real-time patient vital signs without authentication
-- This is a severe HIPAA/privacy violation

-- Remove overly permissive public access policies
DROP POLICY IF EXISTS "Anyone can view live vitals" ON public.live_vitals;
DROP POLICY IF EXISTS "Authenticated users can manage live vitals" ON public.live_vitals;

-- Only ambulances can view their own vitals
CREATE POLICY "Ambulances can view their own vitals"
  ON public.live_vitals 
  FOR SELECT
  TO authenticated
  USING (
    ambulance_id IN (
      SELECT linked_entity 
      FROM public.app_users
      WHERE auth_uid = auth.uid() 
        AND role = 'ambulance'
    )
  );

-- Only ambulances can update their own vitals (for IoT devices linked to ambulances)
CREATE POLICY "Ambulances can update their own vitals"
  ON public.live_vitals 
  FOR ALL
  TO authenticated
  USING (
    ambulance_id IN (
      SELECT linked_entity 
      FROM public.app_users
      WHERE auth_uid = auth.uid() 
        AND role = 'ambulance'
    )
  );

-- Hospitals can view vitals only for their active alerts
CREATE POLICY "Hospitals can view vitals for active alerts"
  ON public.live_vitals 
  FOR SELECT
  TO authenticated
  USING (
    ambulance_id IN (
      SELECT a.ambulance_id 
      FROM public.alerts a
      INNER JOIN public.app_users u ON a.hospital_id = u.linked_entity
      WHERE u.auth_uid = auth.uid() 
        AND u.role = 'hospital'
        AND a.status IN ('pending', 'acknowledged', 'accepted')
    )
  );