-- Add payment_status column to parking_reservations table
-- Run this in Supabase SQL Editor

-- Add payment_status column if it doesn't exist
ALTER TABLE parking_reservations
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
  CHECK (payment_status IN ('pending', 'confirmed', 'failed'));

-- Update existing reservations to have 'pending' status if NULL
UPDATE parking_reservations
SET payment_status = 'pending'
WHERE payment_status IS NULL;

-- Add payment_method and transaction_id columns for payment tracking
ALTER TABLE parking_reservations
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_parking_reservations_payment_status 
ON parking_reservations(payment_status);

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'parking_reservations'
  AND column_name IN ('payment_status', 'payment_method', 'transaction_id')
ORDER BY column_name;
