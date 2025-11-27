-- Mumbai Parking Lots Seed Data
-- Run this after 002_enhanced_schema.sql

-- Insert Mumbai parking lots
INSERT INTO parking_lots (id, name, address, lat, lng, total_spots, has_ev_charging, created_at)
VALUES
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Phoenix Palladium Parking',
    'Phoenix Palladium, Lower Parel, Mumbai, Maharashtra 400013',
    18.9949,
    72.8258,
    50,
    true,
    NOW()
  ),
  (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'Jio World Drive Parking',
    'Jio World Drive, Bandra Kurla Complex, Mumbai, Maharashtra 400051',
    19.0625,
    72.8673,
    75,
    true,
    NOW()
  ),
  (
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'R City Mall Parking',
    'R City Mall, Ghatkopar West, Mumbai, Maharashtra 400086',
    19.0870,
    72.9090,
    60,
    false,
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Generate parking spots for Phoenix Palladium (50 spots)
INSERT INTO parking_spots (parking_lot_id, spot_number, is_ev_friendly, is_disabled_friendly, status)
SELECT
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  spot_num,
  CASE WHEN spot_num <= 10 THEN true ELSE false END, -- First 10 spots are EV-friendly
  CASE WHEN spot_num IN (1, 11, 21, 31, 41) THEN true ELSE false END, -- Every 10th spot is accessible
  CASE 
    WHEN spot_num % 7 = 0 THEN 'occupied'
    WHEN spot_num % 11 = 0 THEN 'reserved'
    ELSE 'available'
  END
FROM generate_series(1, 50) AS spot_num
ON CONFLICT (parking_lot_id, spot_number, level) DO NOTHING;

-- Generate parking spots for Jio World Drive (75 spots)
INSERT INTO parking_spots (parking_lot_id, spot_number, is_ev_friendly, is_disabled_friendly, status)
SELECT
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  spot_num,
  CASE WHEN spot_num <= 15 THEN true ELSE false END, -- First 15 spots are EV-friendly
  CASE WHEN spot_num IN (1, 16, 31, 46, 61) THEN true ELSE false END,
  CASE 
    WHEN spot_num % 8 = 0 THEN 'occupied'
    WHEN spot_num % 13 = 0 THEN 'reserved'
    ELSE 'available'
  END
FROM generate_series(1, 75) AS spot_num
ON CONFLICT (parking_lot_id, spot_number, level) DO NOTHING;

-- Generate parking spots for R City Mall (60 spots)
INSERT INTO parking_spots (parking_lot_id, spot_number, is_ev_friendly, is_disabled_friendly, status)
SELECT
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  spot_num,
  CASE WHEN spot_num <= 8 THEN true ELSE false END, -- First 8 spots are EV-friendly
  CASE WHEN spot_num IN (1, 12, 23, 34, 45, 56) THEN true ELSE false END,
  CASE 
    WHEN spot_num % 6 = 0 THEN 'occupied'
    WHEN spot_num % 9 = 0 THEN 'reserved'
    ELSE 'available'
  END
FROM generate_series(1, 60) AS spot_num
ON CONFLICT (parking_lot_id, spot_number, level) DO NOTHING;

-- Update coupons to include value_inr if not already present
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS value_inr DECIMAL(10, 2);

-- Seed some sample coupons with INR values
INSERT INTO coupons (id, category, title, description, points_required, value_inr, created_at)
VALUES
  (
    'd4e5f6a7-b8c9-0123-def4-567890123456',
    'food',
    'Zomato ₹100 Voucher',
    'Get ₹100 off on your next food order',
    50,
    100.00,
    NOW()
  ),
  (
    'e5f6a7b8-c9d0-1234-ef56-789012345678',
    'travel',
    'Uber ₹200 Credit',
    '₹200 credit for your next ride',
    100,
    200.00,
    NOW()
  ),
  (
    'f6a7b8c9-d0e1-2345-f678-901234567890',
    'food',
    'Starbucks ₹150 Gift Card',
    'Enjoy your favorite coffee',
    75,
    150.00,
    NOW()
  ),
  (
    'a7b8c9d0-e1f2-3456-789a-bcdef0123456',
    'other',
    'Amazon ₹500 Gift Card',
    'Shop anything on Amazon',
    250,
    500.00,
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Seed knowledge base documents for RAG chatbot
INSERT INTO kb_documents (id, title, content, tags, created_at)
VALUES
  (
    'a1b2c3d4-e5f6-7890-abcd-ef123456789a',
    'How Carpool Rides Work',
    'Carpool rides allow drivers to share their journey with passengers heading in the same direction. Drivers post rides with origin, destination, departure time, and available seats. Passengers can search and request to join. Once accepted, passengers receive an OTP that must be verified at pickup. Drivers earn 20 points per completed ride, passengers earn 10 points. All payments are handled in Indian Rupees (₹).',
    ARRAY['rides', 'carpool', 'how-to'],
    NOW()
  ),
  (
    'b2c3d4e5-f6a7-8901-bcde-f123456789ab',
    'KYC Requirements and Approval',
    'KYC (Know Your Customer) verification is required to create or join rides and earn rewards. Submit your document type (Aadhaar, PAN, Driving License) and document number. Upload a clear image of your ID. Admin review typically takes 24-48 hours. Once approved, you can participate in all platform features. KYC status can be checked in your profile.',
    ARRAY['kyc', 'verification', 'approval'],
    NOW()
  ),
  (
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'Points, Ranks, and Coupons',
    'Earn points by completing rides: 20 points as a driver, 10 points as a passenger. Points can be redeemed for coupons in Indian Rupees (₹). Available coupons include food vouchers, travel credits, and gift cards. Check the leaderboard to see your rank. Points accumulate over time and can be redeemed anytime.',
    ARRAY['rewards', 'points', 'coupons', 'leaderboard'],
    NOW()
  ),
  (
    'd4e5f6a7-b8c9-0123-def4-567890123456',
    'Smart Parking Usage Rules',
    'Smart parking allows you to reserve parking spots at major locations in Mumbai including Phoenix Palladium, Jio World Drive, and R City Mall. Select a lot from the map, choose an available spot, and reserve for your desired time window. EV-friendly and accessible spots are marked. Reservations can be cancelled up to 1 hour before start time.',
    ARRAY['parking', 'reservation', 'mumbai'],
    NOW()
  ),
  (
    'e5f6a7b8-c9d0-1234-ef56-789012345678',
    'SOS and Safety Policies',
    'Your safety is our priority. Use the SOS button during active rides to alert our support team with your location. Emergency contacts can be added in your profile. Support tickets can be filed for any issues. All SOS events are logged and reviewed by our safety team. In case of emergency, contact local authorities immediately.',
    ARRAY['safety', 'sos', 'emergency', 'support'],
    NOW()
  ),
  (
    'f6a7b8c9-d0e1-2345-f678-901234567890',
    'Payment in Indian Rupees',
    'All fares and payments are in Indian Rupees (₹). Fares are calculated based on distance and shared among passengers. After ride completion, passengers receive payment prompts. Mark yourself as paid, and the driver confirms. Payment confirmation closes the ride. All monetary values throughout the platform are displayed in ₹.',
    ARRAY['payment', 'fare', 'rupees', 'inr'],
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

