# Quick Start Guide - Green Mobility Platform

## 🚀 Setup Steps

### 1. Database Setup

Run these SQL migrations in your Supabase SQL Editor (in order):

1. `server/migrations/002_enhanced_schema.sql` - Main schema
2. `server/migrations/003_mumbai_parking_seed.sql` - Mumbai parking lots and KB documents

### 2. Environment Variables

#### Backend (`server/.env`)
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
JWT_SECRET=your_jwt_secret
GOOGLE_MAPS_API_KEY=your_google_maps_key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

#### Frontend (`client/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 4. Run the Application

#### Terminal 1 - Backend
```bash
cd server
npm run dev
```
Backend runs on `http://localhost:5000`

#### Terminal 2 - Frontend
```bash
cd client
npm run dev
```
Frontend runs on `http://localhost:3000`

## 🎯 Key Features Implemented

### ✅ Authentication
- Role-based login (Passenger / Driver / Admin)
- Admin MFA with OTP
- Google OAuth support

### ✅ KYC System
- KYC submission in profile page
- Admin approval workflow
- KYC gating for ride creation/joining

### ✅ Ride Sharing
- Create rides (requires KYC approval)
- Search and join rides
- OTP verification at pickup
- Live tracking and ETA
- Payment in ₹ (Indian Rupees)
- CO₂ tracking

### ✅ Smart Parking
- MapTiler map with Mumbai locations
- Real-time spot availability
- Reservation system
- EV and accessible spot indicators

### ✅ Rewards & Impact
- Points system (20 for driver, 10 for passenger)
- Leaderboard
- Coupons in ₹
- CO₂ savings tracking

### ✅ Safety
- SOS button (backend ready)
- Support tickets

### ✅ RAG Chatbot
- Gemini-powered chatbot
- Knowledge base seeded
- Answers questions about platform features

## 📍 Mumbai Parking Locations

1. **Phoenix Palladium Parking** - Lower Parel (50 spots, EV charging)
2. **Jio World Drive Parking** - BKC (75 spots, EV charging)
3. **R City Mall Parking** - Ghatkopar West (60 spots)

## 💰 Currency

All monetary values are displayed in **Indian Rupees (₹)**:
- Ride fares: ₹10 per km base rate
- Parking: ₹20 per hour
- Coupons: Values in ₹

## 🔐 KYC Flow

1. User registers/logs in
2. Goes to Profile page
3. Submits KYC (document type, number, optional image)
4. Admin reviews in Admin Dashboard
5. Once approved, user can:
   - Create rides
   - Join rides
   - Earn rewards

## 🚗 Ride Flow

1. **Driver creates ride** (requires KYC approval)
   - Enter origin/destination
   - Set departure time
   - Specify car details
   - Set available seats

2. **Passenger searches and requests** (requires KYC approval)
   - Search by origin/destination
   - Request to join

3. **Driver accepts**
   - OTP generated for passenger
   - Available seats decremented

4. **At pickup**
   - Driver verifies passenger OTP
   - All passengers verified → ride starts

5. **During ride**
   - Live location tracking
   - ETA updates

6. **Ride completion**
   - Distance and CO₂ calculated
   - Points awarded
   - Payment prompts (₹) for passengers

7. **Payment & closure**
   - Passengers mark as paid
   - Driver confirms
   - Ride closed

## 🗺️ Testing the Parking Dashboard

1. Navigate to `/parking`
2. See MapTiler map with Mumbai locations
3. Click a parking lot to see spots
4. Select an available spot
5. Reserve with time window
6. See stats update (Available/Occupied/Reserved)

## 🤖 Testing the Chatbot

1. ChatWidget is available (floating button)
2. Ask questions like:
   - "How does carpool work?"
   - "What is KYC?"
   - "How do I earn points?"
   - "Tell me about parking"

## 📊 Admin Dashboard

1. Login as Admin (requires MFA)
2. Navigate to `/admin`
3. View:
   - Analytics (rides, parking, CO₂)
   - KYC Approval section
   - Support tickets

## 🐛 Troubleshooting

### Backend not starting
- Check port 5000 is available
- Verify `.env` file has all required keys
- Check Supabase connection

### Frontend errors
- Clear `.next` folder: `rm -rf client/.next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check `.env.local` has all keys

### Map not showing
- Verify `NEXT_PUBLIC_MAPTILER_API_KEY` is set
- Check browser console for errors

### Chatbot not working
- Verify `GEMINI_API_KEY` is set in both backend and frontend
- Check API route `/api/chat` is accessible

### KYC not submitting
- Check backend is running
- Verify API endpoint `/api/kyc/submit`
- Check user is authenticated

## 📝 Next Steps

See `IMPLEMENTATION_STATUS.md` for detailed feature checklist and remaining tasks.

