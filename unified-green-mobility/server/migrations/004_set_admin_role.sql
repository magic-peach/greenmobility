-- Set Admin Role for Existing Users
-- Run this in Supabase SQL Editor to grant admin access to a user

-- Option 1: Update a specific user by email
UPDATE users
SET role = 'admin'
WHERE email = 'akankshatrehun@gmail.com';

-- Option 2: Update a specific user by ID (replace with your user ID)
-- UPDATE users
-- SET role = 'admin'
-- WHERE id = 'your-user-id-here';

-- Option 3: List all users to find your user ID
-- SELECT id, email, name, role FROM users ORDER BY created_at DESC;

-- Verify the update
SELECT id, email, name, role FROM users WHERE email = 'akankshatrehun@gmail.com';

