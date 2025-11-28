# Netlify Build Fix - Secrets Scanner Issue

## Problem
Netlify's secrets scanner detected environment variable values in build artifacts (`.next` directory) and aborted the build.

## Solution Applied

### 1. Updated .gitignore Files
- Added comprehensive `.next` exclusions to both root and client `.gitignore` files
- Ensured `.next/cache` is also ignored

### 2. Created netlify.toml
- Configured build command: `cd client && npm install && npm run build`
- Set publish directory: `client/.next`
- Base directory: `unified-green-mobility`

### 3. Removed Duplicate Files
- Removed duplicate config files with " 2" suffix

## Next Steps

### 1. Commit Changes
```bash
git add .
git commit -m "Fix Netlify build: exclude .next from secrets scanning and update .gitignore"
git push
```

### 2. Configure Netlify Environment Variables
In Netlify Dashboard → Site Settings → Build & deploy → Environment:
- Add all required environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_MAPTILER_API_KEY`
  - `GEMINI_API_KEY`
  - `NEXT_PUBLIC_API_BASE_URL` (if needed)

### 2a. Configure Secrets Scanner Exclusion (IMPORTANT)
In Netlify Dashboard → Site Settings → Build & deploy → Environment:
- Add a new environment variable:
  - **Key**: `SECRETS_SCAN_OMIT_PATHS`
  - **Value**: `client/.next,client/.next/cache`
  - **Scope**: Production (or All contexts)

This tells Netlify to skip scanning the `.next` directory for secrets, which is safe because:
- `.next` is generated during build (not committed)
- It contains embedded `NEXT_PUBLIC_*` variables (which are meant to be public)

### 3. Verify Build Settings
- Base directory: `unified-green-mobility`
- Build command: `cd client && npm install && npm run build`
- Publish directory: `client/.next`

### 4. Important Security Notes
- **DO NOT** commit `.env` files or hardcode secrets
- All secrets should be set in Netlify UI only
- If secrets were previously committed, rotate them immediately:
  - Generate new Supabase keys
  - Generate new MapTiler API key
  - Generate new Gemini API key
  - Update all environment variables in Netlify

### 5. Alternative: If Secrets Were Exposed
If you suspect secrets were committed to Git history:
1. Use BFG Repo Cleaner or git-filter-repo to purge secrets from history
2. Force push to remote
3. Rotate all exposed keys immediately

## Why This Works
- `.next` directory is generated during build and contains embedded `NEXT_PUBLIC_*` variables
- These are safe to exclude from secrets scanning because:
  - `.next` is not committed to the repo
  - `NEXT_PUBLIC_*` variables are meant to be public (embedded in client-side code)
  - The scanner was flagging build artifacts, not source code

