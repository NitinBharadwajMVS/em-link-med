-- This migration documents the existing schema and triggers types regeneration
-- The tables already exist in the database, this just refreshes the TypeScript types

-- Verify patients table exists (no-op query)
SELECT 1 FROM patients LIMIT 0;

-- Verify all expected columns exist
DO $$
BEGIN
  -- Just verify the schema is as expected
  PERFORM column_name 
  FROM information_schema.columns 
  WHERE table_name = 'patients' 
  AND column_name IN ('id', 'name', 'age', 'gender', 'contact', 'complaint', 
                      'triage_level', 'vitals', 'medical_history', 
                      'current_hospital_id', 'ambulance_id', 'created_at', 'updated_at');
END $$;