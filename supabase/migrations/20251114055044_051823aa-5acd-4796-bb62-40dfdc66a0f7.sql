-- Enable real-time updates for live_vitals table
ALTER PUBLICATION supabase_realtime ADD TABLE live_vitals;

-- Set REPLICA IDENTITY FULL to ensure complete row data in updates
ALTER TABLE alerts REPLICA IDENTITY FULL;
ALTER TABLE live_vitals REPLICA IDENTITY FULL;