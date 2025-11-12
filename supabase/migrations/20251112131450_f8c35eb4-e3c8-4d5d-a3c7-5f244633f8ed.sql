-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('hospital', 'ambulance', 'admin');

-- Create hospitals table
CREATE TABLE public.hospitals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  distance NUMERIC,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  address TEXT NOT NULL,
  contact TEXT,
  equipment TEXT[],
  specialties TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ambulances table
CREATE TABLE public.ambulances (
  id TEXT PRIMARY KEY,
  ambulance_number TEXT NOT NULL UNIQUE,
  contact TEXT,
  equipment TEXT[],
  current_latitude NUMERIC,
  current_longitude NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create app_users table (links auth users to entities)
CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  linked_entity TEXT, -- hospital_id or ambulance_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE public.alerts (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL REFERENCES public.hospitals(id),
  ambulance_id TEXT NOT NULL REFERENCES public.ambulances(id),
  patient_name TEXT NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT,
  patient_contact TEXT,
  patient_complaint TEXT,
  triage_level TEXT NOT NULL CHECK (triage_level IN ('critical', 'urgent', 'stable')),
  vitals JSONB NOT NULL,
  distance NUMERIC,
  eta INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'accepted', 'declined', 'completed', 'cancelled')),
  required_equipment TEXT[],
  decline_reason TEXT,
  previous_hospital_ids TEXT[],
  audit_log JSONB DEFAULT '[]'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hospitals (public read, authenticated write)
CREATE POLICY "Anyone can view hospitals"
  ON public.hospitals FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert hospitals"
  ON public.hospitals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update hospitals"
  ON public.hospitals FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for ambulances (public read, authenticated write)
CREATE POLICY "Anyone can view ambulances"
  ON public.ambulances FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage ambulances"
  ON public.ambulances FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for app_users (users can read their own data)
CREATE POLICY "Users can view their own data"
  ON public.app_users FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_uid);

CREATE POLICY "Admins can view all users"
  ON public.app_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users
      WHERE auth_uid = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for alerts
-- Hospitals can only view their own alerts
CREATE POLICY "Hospitals can view their own alerts"
  ON public.alerts FOR SELECT
  TO authenticated
  USING (
    hospital_id IN (
      SELECT linked_entity FROM public.app_users
      WHERE auth_uid = auth.uid() AND role = 'hospital'
    )
  );

-- Ambulances can view alerts they created
CREATE POLICY "Ambulances can view their own alerts"
  ON public.alerts FOR SELECT
  TO authenticated
  USING (
    ambulance_id IN (
      SELECT linked_entity FROM public.app_users
      WHERE auth_uid = auth.uid() AND role = 'ambulance'
    )
  );

-- Authenticated users can insert alerts
CREATE POLICY "Authenticated users can create alerts"
  ON public.alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update alerts they're involved with
CREATE POLICY "Users can update relevant alerts"
  ON public.alerts FOR UPDATE
  TO authenticated
  USING (
    hospital_id IN (
      SELECT linked_entity FROM public.app_users
      WHERE auth_uid = auth.uid() AND role = 'hospital'
    )
    OR
    ambulance_id IN (
      SELECT linked_entity FROM public.app_users
      WHERE auth_uid = auth.uid() AND role = 'ambulance'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_alerts_hospital_id ON public.alerts(hospital_id);
CREATE INDEX idx_alerts_ambulance_id ON public.alerts(ambulance_id);
CREATE INDEX idx_alerts_status ON public.alerts(status);
CREATE INDEX idx_alerts_timestamp ON public.alerts(timestamp DESC);
CREATE INDEX idx_app_users_auth_uid ON public.app_users(auth_uid);
CREATE INDEX idx_app_users_username ON public.app_users(username);
CREATE INDEX idx_app_users_linked_entity ON public.app_users(linked_entity);

-- Create triggers for updated_at
CREATE TRIGGER update_hospitals_updated_at
  BEFORE UPDATE ON public.hospitals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_ambulances_updated_at
  BEFORE UPDATE ON public.ambulances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_app_users_updated_at
  BEFORE UPDATE ON public.app_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- Enable realtime for alerts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;