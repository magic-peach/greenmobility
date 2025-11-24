# Supabase Setup Instructions

## Quick Setup Guide

### Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: unified-green-mobility (or any name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for the project to be created

### Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** (gear icon)
2. Click **API** in the left sidebar
3. You'll see:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (long string)
   - **service_role** key (long string - keep this secret!)

### Step 3: Update Environment Variables

#### Server (.env file)
Edit `/server/.env`:
```env
PORT=4000
NODE_ENV=development
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here
JWT_SECRET=your-random-secret-key-here
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

#### Client (.env.local file)
Edit `/client/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

### Step 4: Run Database Migration

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Open the file: `server/migrations/001_initial_schema.sql`
4. Copy the **entire contents** of that file
5. Paste it into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for "Success. No rows returned" message

### Step 5: Restart Servers

After updating environment variables:

```bash
# Stop current servers
pkill -f "tsx watch"
pkill -f "next dev"

# Restart server
cd server
npm run dev

# In another terminal, restart client
cd client
npm run dev
```

### Step 6: Test Registration

1. Go to http://localhost:3000/register
2. Fill in the form and click "Sign up"
3. You should be redirected to the dashboard!

## Troubleshooting

### "Could not find the table 'public.users'"
- Make sure you ran the SQL migration (Step 4)
- Check that the migration completed successfully
- Verify your SUPABASE_URL is correct

### "Invalid API key"
- Double-check you copied the correct keys
- Make sure you're using `service_role` key in server/.env
- Make sure you're using `anon` key in client/.env.local

### "Connection refused" or "Failed to fetch"
- Make sure both servers are running
- Check that ports 3000 and 4000 are not blocked
- Verify NEXT_PUBLIC_API_BASE_URL matches your server port

## Optional: Create an Admin User

After setting up, you can create an admin user manually:

1. Go to Supabase dashboard → **Authentication** → **Users**
2. Create a user manually or use SQL:

```sql
-- First, create the auth user (you'll need to do this via Supabase Auth UI or API)
-- Then update their role:
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Check server logs: `tail -f /tmp/server.log`
- Check client logs in the terminal where you ran `npm run dev`

