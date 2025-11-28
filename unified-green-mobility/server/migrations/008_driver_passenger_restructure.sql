-- Migration: Driver/Passenger Restructure
-- Adds max_passengers, points_awarded to rides
-- Updates payment_status to support split/full payment modes

-- Add max_passengers to rides table
ALTER TABLE rides
  ADD COLUMN IF NOT EXISTS max_passengers INTEGER NOT NULL DEFAULT 4;

-- Set max_passengers = total_seats - 1 for existing rides (driver occupies one seat)
UPDATE rides
SET max_passengers = GREATEST(1, total_seats - 1)
WHERE max_passengers IS NULL OR max_passengers = 4;

-- Add points_awarded flag to rides table
ALTER TABLE rides
  ADD COLUMN IF NOT EXISTS points_awarded BOOLEAN NOT NULL DEFAULT false;

-- Update payment_status constraint in ride_passengers to support new payment modes
ALTER TABLE ride_passengers
  DROP CONSTRAINT IF EXISTS ride_passengers_payment_status_check;

ALTER TABLE ride_passengers
  ADD CONSTRAINT ride_passengers_payment_status_check 
  CHECK (payment_status IN ('pending', 'split_pending', 'paid', 'paid_full', 'marked_paid', 'confirmed'));

-- Migrate existing payment_status values
UPDATE ride_passengers
SET payment_status = CASE
  WHEN payment_status = 'marked_paid' THEN 'paid'
  WHEN payment_status = 'confirmed' THEN 'paid'
  ELSE payment_status
END
WHERE payment_status IN ('marked_paid', 'confirmed');

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_rides_driver_id_status ON rides(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_rides_points_awarded ON rides(points_awarded);
CREATE INDEX IF NOT EXISTS idx_ride_passengers_payment_status ON ride_passengers(payment_status);
CREATE INDEX IF NOT EXISTS idx_ride_passengers_ride_status ON ride_passengers(ride_id, status);

