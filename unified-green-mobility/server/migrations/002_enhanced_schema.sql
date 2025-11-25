-- Enhanced Database Schema for Green Mobility Platform
-- Run this in your Supabase SQL editor after 001_initial_schema.sql

-- Enable vector extension for RAG chatbot
CREATE EXTENSION IF NOT EXISTS vector;

-- Update users table to match requirements
-- Step 1: Drop old constraint FIRST (before updating data)
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_kyc_status_check;

-- Step 2: Add avatar_url column
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Step 3: Migrate existing kyc_status values to new format (no constraint blocking us now)
UPDATE users 
SET kyc_status = CASE 
  WHEN kyc_status = 'unverified' THEN 'not_submitted'
  WHEN kyc_status = 'verified' THEN 'approved'
  WHEN kyc_status = 'pending' THEN 'pending'
  WHEN kyc_status = 'approved' THEN 'approved'
  WHEN kyc_status = 'rejected' THEN 'rejected'
  WHEN kyc_status IS NULL THEN 'not_submitted'
  ELSE 'not_submitted'
END;

-- Step 4: Set default for new rows
ALTER TABLE users 
  ALTER COLUMN kyc_status SET DEFAULT 'not_submitted';

-- Step 5: Add new constraint (after data is migrated)
ALTER TABLE users 
  ADD CONSTRAINT users_kyc_status_check CHECK (kyc_status IN ('not_submitted', 'pending', 'approved', 'rejected'));

-- User KYC table
CREATE TABLE IF NOT EXISTS user_kyc (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_number TEXT NOT NULL,
  document_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Update rides table to match requirements
ALTER TABLE rides
  ADD COLUMN IF NOT EXISTS origin_name TEXT,
  ADD COLUMN IF NOT EXISTS origin_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS origin_lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS destination_name TEXT,
  ADD COLUMN IF NOT EXISTS destination_lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS destination_lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS car_brand TEXT,
  ADD COLUMN IF NOT EXISTS car_model TEXT,
  ADD COLUMN IF NOT EXISTS car_category TEXT CHECK (car_category IN ('hatchback', 'sedan', 'suv', 'ev', 'other')),
  ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS co2_emitted_kg DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  DROP CONSTRAINT IF EXISTS rides_status_check,
  ADD CONSTRAINT rides_status_check CHECK (status IN ('upcoming', 'ongoing', 'completed', 'closed', 'cancelled'));

-- Migrate existing ride data if needed
UPDATE rides 
SET origin_name = start_location_name,
    origin_lat = start_lat,
    origin_lng = start_lng,
    destination_name = end_location_name,
    destination_lat = end_lat,
    destination_lng = end_lng
WHERE origin_name IS NULL;

-- Update ride_passengers table
ALTER TABLE ride_passengers
  ADD COLUMN IF NOT EXISTS otp_code TEXT,
  ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'marked_paid', 'confirmed')),
  ADD COLUMN IF NOT EXISTS fare_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  DROP CONSTRAINT IF EXISTS ride_passengers_status_check,
  ADD CONSTRAINT ride_passengers_status_check CHECK (status IN ('requested', 'accepted', 'rejected', 'cancelled', 'completed'));

-- User points table (consolidate user_rewards and user_emissions_stats)
CREATE TABLE IF NOT EXISTS user_points (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  total_distance_km DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_co2_saved_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migrate existing data (only for users that exist)
INSERT INTO user_points (user_id, points, total_distance_km, total_co2_saved_kg)
SELECT 
  u.id,
  COALESCE(ur.points, 0),
  COALESCE(ues.total_distance_km, 0),
  COALESCE(ues.total_co2_saved_kg, 0)
FROM users u
LEFT JOIN user_rewards ur ON u.id = ur.user_id
LEFT JOIN user_emissions_stats ues ON u.id = ues.user_id
WHERE u.id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Update parking_lots table
ALTER TABLE parking_lots
  ADD COLUMN IF NOT EXISTS has_ev_charging BOOLEAN DEFAULT FALSE;

-- Update parking_spots table
ALTER TABLE parking_spots
  ADD COLUMN IF NOT EXISTS level TEXT,
  DROP CONSTRAINT IF EXISTS parking_spots_level_check;

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (category IN ('food', 'travel', 'entertainment', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL CHECK (points_required > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User coupons table
CREATE TABLE IF NOT EXISTS user_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, coupon_id)
);

-- Update SOS events table
ALTER TABLE sos_events
  ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS message TEXT;

-- Migrate existing SOS data
UPDATE sos_events
SET lat = location_lat,
    lng = location_lng
WHERE lat IS NULL AND location_lat IS NOT NULL;

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin sessions table (for MFA verification)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_code TEXT NOT NULL,
  otp_expires_at TIMESTAMPTZ NOT NULL,
  mfa_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- KB Documents table (for RAG chatbot)
CREATE TABLE IF NOT EXISTS kb_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- KB Embeddings table (for vector search)
CREATE TABLE IF NOT EXISTS kb_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
  embedding vector(768), -- Google text-embedding-004 dimension (768)
  chunk_text TEXT,
  chunk_index INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_kyc_user_id ON user_kyc(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kyc_status ON user_kyc(status);
CREATE INDEX IF NOT EXISTS idx_ride_passengers_otp ON ride_passengers(otp_code);
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_coupon_id ON user_coupons(coupon_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_embeddings_document_id ON kb_embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_kb_embeddings_vector ON kb_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  chunk_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb_embeddings.id,
    kb_embeddings.document_id,
    kb_documents.content,
    kb_embeddings.chunk_text,
    1 - (kb_embeddings.embedding <=> query_embedding) as similarity
  FROM kb_embeddings
  JOIN kb_documents ON kb_embeddings.document_id = kb_documents.id
  WHERE 1 - (kb_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY kb_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_kyc_updated_at BEFORE UPDATE ON user_kyc
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ride_passengers_updated_at BEFORE UPDATE ON ride_passengers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON user_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kb_documents_updated_at BEFORE UPDATE ON kb_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for new tables
ALTER TABLE user_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- User KYC policies
CREATE POLICY "Users can read own KYC" ON user_kyc
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own KYC" ON user_kyc
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Coupons policies (public read)
CREATE POLICY "Anyone can read coupons" ON coupons
  FOR SELECT USING (true);

-- User coupons policies
CREATE POLICY "Users can read own coupons" ON user_coupons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own coupons" ON user_coupons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Support tickets policies
CREATE POLICY "Users can read own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- User points policies
CREATE POLICY "Users can read own points" ON user_points
  FOR SELECT USING (auth.uid() = user_id);

-- KB documents policies (public read for now, can be restricted)
CREATE POLICY "Anyone can read KB documents" ON kb_documents
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read KB embeddings" ON kb_embeddings
  FOR SELECT USING (true);

