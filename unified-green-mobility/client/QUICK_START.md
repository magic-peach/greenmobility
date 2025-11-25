# Quick Start Guide

## 🚀 How to Run the Project

### Step 1: Navigate to Client Directory

```bash
cd unified-green-mobility/client
```

### Step 2: Install Dependencies (if not already done)

```bash
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env.local` file in the `client` directory:

```bash
# In the client directory
touch .env.local
```

Or create it manually in your editor.

### Step 4: Add API Keys to .env.local

Open `.env.local` and add:

```env
# Existing Supabase keys (if you have them)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# NEW: MapTiler API Key (for MapView component)
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_key_here

# NEW: Google Gemini API Key (for ChatWidget component)
GEMINI_API_KEY=your_gemini_key_here
```

### Step 5: Run the Development Server

```bash
npm run dev
```

The app will start at: **http://localhost:3000**

---

## 🔑 Getting API Keys

### MapTiler API Key

1. Go to: https://cloud.maptiler.com/
2. Sign up or log in
3. Go to **Account** → **API Keys**
4. Copy your key
5. Add to `.env.local` as `NEXT_PUBLIC_MAPTILER_API_KEY`

### Google Gemini API Key

1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key
5. Add to `.env.local` as `GEMINI_API_KEY`

---

## 📁 File Locations

### Environment File
- **Location**: `unified-green-mobility/client/.env.local`
- **Note**: This file is gitignored (won't be committed)

### Example Environment File
- **Location**: `unified-green-mobility/client/.env.example`
- **Note**: This is a template, copy it to `.env.local` and fill in your keys

---

## ✅ Verify It's Working

1. **Start the server**: `npm run dev`
2. **Visit**: http://localhost:3000
3. **Test Map**: Visit http://localhost:3000/demo/map-chat (if demo page exists)
4. **Test Chat**: Click the chat button (bottom-right) - should open chat widget

---

## 🐛 Troubleshooting

### "MapTiler API key not configured"
- Make sure `.env.local` exists in the `client` directory
- Make sure the key is named `NEXT_PUBLIC_MAPTILER_API_KEY`
- Restart the dev server after adding keys

### "Chat not working"
- Check `GEMINI_API_KEY` is in `.env.local`
- Make sure it's NOT prefixed with `NEXT_PUBLIC_` (server-side only)
- Restart the dev server

### Port 3000 already in use
```bash
# Use a different port
npm run dev -- -p 3001
```

---

## 📝 Full Command Sequence

```bash
# 1. Navigate to client directory
cd unified-green-mobility/client

# 2. Install dependencies (first time only)
npm install

# 3. Create environment file
touch .env.local

# 4. Edit .env.local and add your keys
# (Use your preferred editor: nano, vim, VS Code, etc.)

# 5. Start development server
npm run dev
```

---

## 🎯 Quick Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 📍 Important Notes

- **`.env.local`** is gitignored - your keys won't be committed
- **Restart the server** after changing environment variables
- **`NEXT_PUBLIC_*`** variables are exposed to the browser
- **`GEMINI_API_KEY`** (without NEXT_PUBLIC) is server-side only

