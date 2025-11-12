-- Fix RLS for live_vitals table (from warning)
ALTER TABLE public.live_vitals ENABLE ROW LEVEL SECURITY;

-- Allow public read access to live vitals (for demo purposes)
CREATE POLICY "Anyone can view live vitals"
  ON public.live_vitals FOR SELECT
  USING (true);

-- Allow authenticated users to insert/update live vitals
CREATE POLICY "Authenticated users can manage live vitals"
  ON public.live_vitals FOR ALL
  TO authenticated
  USING (true);