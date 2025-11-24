# How to Run the Unified Green Mobility Platform

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account with database set up

## Quick Start

### Option 1: Run Both Servers in Separate Terminals (Recommended)

**Terminal 1 - Backend Server:**
```bash
cd unified-green-mobility/server
npm install  # Only needed first time
npm run dev
```
Backend will run on: `http://localhost:5000`

**Terminal 2 - Frontend Client:**
```bash
cd unified-green-mobility/client
npm install  # Only needed first time
npm run dev
```
Frontend will run on: `http://localhost:3000`

---

### Option 2: Run Both in Background (Single Terminal)

**Run Backend:**
```bash
cd unified-green-mobility/server && npm run dev &
```

**Run Frontend:**
```bash
cd unified-green-mobility/client && npm run dev &
```

---

## Step-by-Step Instructions

### 1. Install Dependencies (First Time Only)

**Backend:**
```bash
cd unified-green-mobility/server
npm install
```

**Frontend:**
```bash
cd unified-green-mobility/client
npm install
```

### 2. Set Up Environment Variables

**Backend** (`server/.env`):
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

**Frontend** (`client/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### 3. Run the Servers

**Terminal 1 - Start Backend:**
```bash
cd unified-green-mobility/server
npm run dev
```

You should see:
```
Server running on port 5000
Environment: development
```

**Terminal 2 - Start Frontend:**
```bash
cd unified-green-mobility/client
npm run dev
```

You should see:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
```

### 4. Access the Application

- **Frontend**: Open `http://localhost:3000` in your browser
- **Backend API**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/health`

---

## Available Scripts

### Backend (`server/`)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server

### Frontend (`client/`)
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

---

## Troubleshooting

### Port Already in Use
If port 5000 or 3000 is already in use:
- **Backend**: Change `PORT` in `server/.env`
- **Frontend**: Change port with `npm run dev -- -p 3001`

### "Failed to fetch" Errors
- Make sure the backend server is running
- Check that `NEXT_PUBLIC_API_BASE_URL` in `client/.env.local` matches your backend URL

### Database Errors
- Ensure Supabase database is set up (run migration SQL)
- Verify environment variables are correct
- Check Supabase dashboard for connection issues

---

## Production Build

**Build Backend:**
```bash
cd unified-green-mobility/server
npm run build
npm start
```

**Build Frontend:**
```bash
cd unified-green-mobility/client
npm run build
npm start
```

