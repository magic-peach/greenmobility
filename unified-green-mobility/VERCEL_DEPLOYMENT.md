# Vercel Deployment Guide

## Important Notes

⚠️ **The Express backend server cannot run on Vercel directly.** Vercel is designed for serverless functions and Next.js apps. You have two options:

### Option 1: Deploy Frontend Only (Recommended for now)
Deploy only the Next.js frontend to Vercel, and keep the backend running separately (e.g., on Railway, Render, or a VPS).

### Option 2: Convert Backend to Vercel Serverless Functions
Convert your Express routes to Vercel serverless functions (more complex, requires refactoring).

---

## Step 1: Deploy Frontend to Vercel

### 1.1. Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

### 1.2. Navigate to Client Directory
```bash
cd client
```

### 1.3. Deploy to Vercel
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (Select your account)
- Link to existing project? **No** (for first deployment)
- Project name? (Press Enter for default or enter a name)
- Directory? **./** (current directory)
- Override settings? **No**

### 1.4. Configure Environment Variables in Vercel Dashboard

Go to your project on Vercel Dashboard → Settings → Environment Variables

Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com/api
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_key
GEMINI_API_KEY=your_gemini_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

**Important:** 
- Replace `NEXT_PUBLIC_API_BASE_URL` with your backend server URL (deployed separately)
- All `NEXT_PUBLIC_*` variables are exposed to the browser
- Never put sensitive keys in `NEXT_PUBLIC_*` variables

### 1.5. Update Build Settings

In Vercel Dashboard → Settings → General:
- **Root Directory:** `client`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

---

## Step 2: Deploy Backend Separately

The Express backend needs to be deployed on a platform that supports long-running processes:

### Option A: Railway (Recommended)
1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Select your repository
4. Set root directory to `server`
5. Add environment variables:
   ```
   PORT=5000
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_ANON_KEY=your_anon_key
   GOOGLE_MAPS_API_KEY=your_google_maps_key
   GEMINI_API_KEY=your_gemini_key
   ```
6. Railway will auto-detect Node.js and deploy
7. Update `NEXT_PUBLIC_API_BASE_URL` in Vercel with Railway's URL

### Option B: Render
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repository
4. Set:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run dev` (or `npm start` for production)
5. Add environment variables (same as Railway)
6. Update `NEXT_PUBLIC_API_BASE_URL` in Vercel

### Option C: VPS/Cloud Server
Deploy the backend on a VPS (DigitalOcean, AWS EC2, etc.) and run it with PM2 or similar.

---

## Step 3: Update CORS Settings

After deploying the backend, update CORS in `server/src/index.ts` to include your Vercel domain:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://your-app.vercel.app', // Add your Vercel URL
  ],
  credentials: true,
}));
```

---

## Step 4: Update Frontend API Base URL

After deploying the backend, update the environment variable in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_BASE_URL` to your backend URL:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.railway.app/api
   ```
   or
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com/api
   ```

3. Redeploy the frontend (or wait for automatic redeploy)

---

## Troubleshooting

### 404 NOT_FOUND Error
- Make sure you're deploying from the `client` directory
- Check that `vercel.json` is in the `client` directory
- Verify build settings in Vercel dashboard

### API Connection Errors
- Check that `NEXT_PUBLIC_API_BASE_URL` is set correctly
- Verify backend is running and accessible
- Check CORS settings in backend
- Test backend URL directly in browser: `https://your-backend-url.com/health`

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation passes locally: `npm run build`

---

## Quick Deploy Commands

```bash
# From project root
cd client
vercel --prod
```

---

## Environment Variables Checklist

### Frontend (Vercel):
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXT_PUBLIC_API_BASE_URL` (your backend URL)
- ✅ `NEXT_PUBLIC_MAPTILER_API_KEY`
- ✅ `GEMINI_API_KEY` (optional, for chatbot)
- ✅ `GOOGLE_MAPS_API_KEY` (optional)

### Backend (Railway/Render):
- ✅ `PORT` (usually 5000 or auto-assigned)
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `GOOGLE_MAPS_API_KEY`
- ✅ `GEMINI_API_KEY`

---

## Next Steps After Deployment

1. Test all features on the deployed site
2. Set up custom domain (optional)
3. Configure SSL certificates (usually automatic)
4. Set up monitoring and error tracking
5. Configure database backups

