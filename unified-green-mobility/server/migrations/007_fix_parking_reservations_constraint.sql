-- Fix parking_reservations check constraint
-- Run this in Supabase SQL Editor

-- Drop existing constraint if it exists (might be causing issues)
ALTER TABLE parking_reservations
  DROP CONSTRAINT IF EXISTS parking_reservations_check;

-- Add proper check constraint to ensure end_time is after start_time
ALTER TABLE parking_reservations
  ADD CONSTRAINT parking_reservations_check 
  CHECK (end_time > start_time);

-- Also add constraint for status values
ALTER TABLE parking_reservations
  DROP CONSTRAINT IF EXISTS parking_reservations_status_check;

ALTER TABLE parking_reservations
  ADD CONSTRAINT parking_reservations_status_check 
  CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled'));

-- Verify constraints
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'parking_reservations'::regclass
  AND contype = 'c'
ORDER BY conname;

