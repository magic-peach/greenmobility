# Setup Instructions - Map & Chat Integration

## 📍 Where to Add API Keys

**File Location**: `unified-green-mobility/client/.env.local`

You already have this file! Just add the new keys to it.

### Current .env.local (what you have):
```env
NEXT_PUBLIC_SUPABASE_URL=https://nwdljfxydzpljpgmqfvh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=placeholder
```

### Add These Two Lines:
```env
# Add these at the end of your .env.local file:

# MapTiler API Key (for MapView component)
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_key_here

# Google Gemini API Key (for ChatWidget component)
GEMINI_API_KEY=your_gemini_key_here
```

### Complete .env.local should look like:
```env
NEXT_PUBLIC_SUPABASE_URL=https://nwdljfxydzpljpgmqfvh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=placeholder

# MapTiler API Key (for MapView component)
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_key_here

# Google Gemini API Key (for ChatWidget component)
GEMINI_API_KEY=your_gemini_key_here
```

---

## 🔑 How to Get API Keys

### 1. MapTiler API Key

1. Visit: https://cloud.maptiler.com/
2. Sign up (free tier available) or log in
3. Go to **Account** → **API Keys**
4. Copy your key
5. Paste it as `NEXT_PUBLIC_MAPTILER_API_KEY` in `.env.local`

### 2. Google Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key
5. Paste it as `GEMINI_API_KEY` in `.env.local`

---

## 🚀 How to Run the Project

### Step 1: Open Terminal

Open your terminal/command prompt.

### Step 2: Navigate to Client Directory

```bash
cd /Users/akankshatrehun/Desktop/pbl/unified-green-mobility/client
```

Or if you're already in the `pbl` directory:
```bash
cd unified-green-mobility/client
```

### Step 3: Install Dependencies (First Time Only)

```bash
npm install
```

**Note**: This is only needed the first time or when dependencies change.

### Step 4: Add API Keys to .env.local

Edit the `.env.local` file and add your API keys (see above).

You can use any text editor:
- VS Code: `code .env.local`
- Nano: `nano .env.local`
- Vim: `vim .env.local`
- Or open in your preferred editor

### Step 5: Start the Development Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
```

### Step 6: Open in Browser

Visit: **http://localhost:3000**

---

## ✅ Verify Everything Works

1. **Map Component**: 
   - Visit http://localhost:3000/demo/map-chat
   - You should see a map with markers

2. **Chat Widget**:
   - Look for a floating chat button in the bottom-right corner
   - Click it to open the chat
   - Type a message and press Enter

---

## 🛑 Stop the Server

Press `Ctrl + C` in the terminal to stop the development server.

---

## 📝 Quick Command Reference

```bash
# Navigate to client directory
cd unified-green-mobility/client

# Install dependencies (first time)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

---

## ⚠️ Important Notes

1. **Restart Required**: After adding/changing API keys in `.env.local`, you MUST restart the server:
   - Press `Ctrl + C` to stop
   - Run `npm run dev` again

2. **File Location**: Make sure `.env.local` is in the `client` directory, not the root:
   ```
   ✅ Correct: unified-green-mobility/client/.env.local
   ❌ Wrong:   unified-green-mobility/.env.local
   ```

3. **No Quotes Needed**: Don't put quotes around the API key values:
   ```env
   ✅ Correct: NEXT_PUBLIC_MAPTILER_API_KEY=abc123xyz
   ❌ Wrong:   NEXT_PUBLIC_MAPTILER_API_KEY="abc123xyz"
   ```

4. **Server-Side vs Client-Side**:
   - `NEXT_PUBLIC_MAPTILER_API_KEY` - Exposed to browser (needs NEXT_PUBLIC_)
   - `GEMINI_API_KEY` - Server-side only (NO NEXT_PUBLIC_ prefix)

---

## 🐛 Troubleshooting

### "MapTiler API key not configured"
- ✅ Check `.env.local` exists in `client` directory
- ✅ Check key name is exactly `NEXT_PUBLIC_MAPTILER_API_KEY`
- ✅ Restart the server after adding keys

### "Chat not working" or "Gemini API key is not configured"
- ✅ Check `GEMINI_API_KEY` is in `.env.local` (no NEXT_PUBLIC_ prefix)
- ✅ Restart the server after adding keys
- ✅ Check browser console for errors

### Port 3000 already in use
```bash
# Use a different port
npm run dev -- -p 3001
```

### "Module not found" errors
```bash
# Reinstall dependencies
npm install
```

---

## 📞 Need Help?

- Check `MAP_CHAT_INTEGRATION.md` for detailed component usage
- Check `QUICK_START.md` for quick reference
- Check browser console for error messages
- Check terminal output for server errors

