-- Drop existing policies and table if they exist to start fresh
DROP TRIGGER IF EXISTS trigger_update_alert_on_hospital_change ON public.patients;
DROP FUNCTION IF EXISTS update_alert_on_hospital_change();
DROP TABLE IF EXISTS public.patients CASCADE;

-- 1. Create patients table with correct types to match existing schema
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  contact text NOT NULL,
  complaint text,
  triage_level text NOT NULL CHECK (triage_level IN ('critical', 'urgent', 'stable')),
  vitals jsonb NOT NULL,
  medical_history text[],
  current_hospital_id text REFERENCES public.hospitals(id) ON DELETE SET NULL,
  ambulance_id text REFERENCES public.ambulances(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- RLS policies for patients
CREATE POLICY "Ambulances can view their own patients"
  ON public.patients FOR SELECT
  USING (ambulance_id IN (
    SELECT linked_entity FROM app_users 
    WHERE auth_uid = auth.uid() AND role = 'ambulance'
  ));

CREATE POLICY "Hospitals can view their patients"
  ON public.patients FOR SELECT
  USING (current_hospital_id IN (
    SELECT linked_entity FROM app_users 
    WHERE auth_uid = auth.uid() AND role = 'hospital'
  ));

CREATE POLICY "Ambulances can manage their patients"
  ON public.patients FOR ALL
  USING (ambulance_id IN (
    SELECT linked_entity FROM app_users 
    WHERE auth_uid = auth.uid() AND role = 'ambulance'
  ));

CREATE POLICY "Admins can view all patients"
  ON public.patients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM app_users 
    WHERE auth_uid = auth.uid() AND role = 'admin'
  ));

-- Add updated_at trigger for patients
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- 2. Alter alerts table - add patient_id
ALTER TABLE public.alerts 
  ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE;

-- 3. Add device_id to ambulances (drop constraint first if exists)
ALTER TABLE public.ambulances DROP CONSTRAINT IF EXISTS ambulances_device_id_fkey;
ALTER TABLE public.ambulances 
  ADD COLUMN IF NOT EXISTS device_id text;

-- Make device_id unique only if not already
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ambulances_device_id_key'
  ) THEN
    ALTER TABLE public.ambulances ADD CONSTRAINT ambulances_device_id_key UNIQUE (device_id);
  END IF;
END $$;

-- Add foreign key constraint to reference live_vitals
ALTER TABLE public.ambulances 
  ADD CONSTRAINT ambulances_device_id_fkey 
  FOREIGN KEY (device_id) REFERENCES public.live_vitals(device_id) ON DELETE SET NULL;

-- 4. Add ambulance_id to live_vitals
ALTER TABLE public.live_vitals 
  ADD COLUMN IF NOT EXISTS ambulance_id text REFERENCES public.ambulances(id) ON DELETE SET NULL;

-- 5. Create trigger for hospital changes
CREATE OR REPLACE FUNCTION update_alert_on_hospital_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if hospital_id actually changed
  IF OLD.current_hospital_id IS DISTINCT FROM NEW.current_hospital_id THEN
    -- Update all pending/acknowledged alerts for this patient
    UPDATE public.alerts
    SET 
      hospital_id = NEW.current_hospital_id,
      updated_at = now(),
      audit_log = COALESCE(audit_log, '[]'::jsonb) || jsonb_build_object(
        'event', 'hospital_transfer',
        'from', OLD.current_hospital_id,
        'to', NEW.current_hospital_id,
        'timestamp', now(),
        'actor', 'system',
        'action', 'Hospital transfer'
      )
    WHERE patient_id = NEW.id
      AND status IN ('pending', 'acknowledged');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_alert_on_hospital_change
  AFTER UPDATE OF current_hospital_id ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_on_hospital_change();