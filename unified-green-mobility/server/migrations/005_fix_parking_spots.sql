-- Fix Parking Spots - Update existing spots with proper status values
-- Run this in Supabase SQL Editor

-- Step 1: Check for duplicate rows
SELECT 
  parking_lot_id, 
  spot_number, 
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY id) as spot_ids
FROM parking_spots
GROUP BY parking_lot_id, spot_number
HAVING COUNT(*) > 1;

-- Step 2: Remove duplicate rows (keep the one with the lowest id)
DELETE FROM parking_spots ps1
WHERE EXISTS (
  SELECT 1 FROM parking_spots ps2
  WHERE ps2.parking_lot_id = ps1.parking_lot_id
    AND ps2.spot_number = ps1.spot_number
    AND ps2.id < ps1.id
);

-- Step 3: Create unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'parking_spots_lot_spot_unique'
  ) THEN
    ALTER TABLE parking_spots 
    ADD CONSTRAINT parking_spots_lot_spot_unique 
    UNIQUE (parking_lot_id, spot_number);
  END IF;
END $$;

-- First, check current spot counts
SELECT 
  pl.name,
  COUNT(ps.id) as total_spots,
  COUNT(CASE WHEN ps.status = 'available' THEN 1 END) as available,
  COUNT(CASE WHEN ps.status = 'occupied' THEN 1 END) as occupied,
  COUNT(CASE WHEN ps.status = 'reserved' THEN 1 END) as reserved
FROM parking_lots pl
LEFT JOIN parking_spots ps ON pl.id = ps.parking_lot_id
GROUP BY pl.id, pl.name;

-- Update Phoenix Palladium spots (ensure we have a mix of statuses)
UPDATE parking_spots
SET status = CASE 
  WHEN spot_number::INTEGER % 7 = 0 THEN 'occupied'
  WHEN spot_number::INTEGER % 11 = 0 THEN 'reserved'
  ELSE 'available'
END
WHERE parking_lot_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND (status IS NULL OR status = 'out_of_service');

-- Update Jio World Drive spots
UPDATE parking_spots
SET status = CASE 
  WHEN spot_number::INTEGER % 8 = 0 THEN 'occupied'
  WHEN spot_number::INTEGER % 13 = 0 THEN 'reserved'
  ELSE 'available'
END
WHERE parking_lot_id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
  AND (status IS NULL OR status = 'out_of_service');

-- Update R City Mall spots
UPDATE parking_spots
SET status = CASE 
  WHEN spot_number::INTEGER % 6 = 0 THEN 'occupied'
  WHEN spot_number::INTEGER % 9 = 0 THEN 'reserved'
  ELSE 'available'
END
WHERE parking_lot_id = 'c3d4e5f6-a7b8-9012-cdef-123456789012'
  AND (status IS NULL OR status = 'out_of_service');

-- If spots don't exist, create them
-- Phoenix Palladium (50 spots)
INSERT INTO parking_spots (parking_lot_id, spot_number, is_ev_friendly, is_disabled_friendly, status)
SELECT
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  spot_num::TEXT,
  CASE WHEN spot_num <= 10 THEN true ELSE false END,
  CASE WHEN spot_num IN (1, 11, 21, 31, 41) THEN true ELSE false END,
  CASE 
    WHEN spot_num % 7 = 0 THEN 'occupied'
    WHEN spot_num % 11 = 0 THEN 'reserved'
    ELSE 'available'
  END
FROM generate_series(1, 50) AS spot_num
ON CONFLICT (parking_lot_id, spot_number) DO UPDATE
SET status = EXCLUDED.status;

-- Jio World Drive (75 spots)
INSERT INTO parking_spots (parking_lot_id, spot_number, is_ev_friendly, is_disabled_friendly, status)
SELECT
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  spot_num::TEXT,
  CASE WHEN spot_num <= 15 THEN true ELSE false END,
  CASE WHEN spot_num IN (1, 16, 31, 46, 61) THEN true ELSE false END,
  CASE 
    WHEN spot_num % 8 = 0 THEN 'occupied'
    WHEN spot_num % 13 = 0 THEN 'reserved'
    ELSE 'available'
  END
FROM generate_series(1, 75) AS spot_num
ON CONFLICT (parking_lot_id, spot_number) DO UPDATE
SET status = EXCLUDED.status;

-- R City Mall (60 spots)
INSERT INTO parking_spots (parking_lot_id, spot_number, is_ev_friendly, is_disabled_friendly, status)
SELECT
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  spot_num::TEXT,
  CASE WHEN spot_num <= 8 THEN true ELSE false END,
  CASE WHEN spot_num IN (1, 12, 23, 34, 45, 56) THEN true ELSE false END,
  CASE 
    WHEN spot_num % 6 = 0 THEN 'occupied'
    WHEN spot_num % 9 = 0 THEN 'reserved'
    ELSE 'available'
  END
FROM generate_series(1, 60) AS spot_num
ON CONFLICT (parking_lot_id, spot_number) DO UPDATE
SET status = EXCLUDED.status;

-- Verify the update
SELECT 
  pl.name,
  COUNT(ps.id) as total_spots,
  COUNT(CASE WHEN ps.status = 'available' THEN 1 END) as available,
  COUNT(CASE WHEN ps.status = 'occupied' THEN 1 END) as occupied,
  COUNT(CASE WHEN ps.status = 'reserved' THEN 1 END) as reserved
FROM parking_lots pl
LEFT JOIN parking_spots ps ON pl.id = ps.parking_lot_id
GROUP BY pl.id, pl.name
ORDER BY pl.name;

