# Green Mobility Platform - Implementation Status

## ✅ Completed Backend Features

### Database Schema
- ✅ Enhanced schema with all required tables (002_enhanced_schema.sql)
- ✅ Mumbai parking lots seed data (003_mumbai_parking_seed.sql)
- ✅ INR fields added (fare_amount_inr)
- ✅ Knowledge base documents seeded for RAG chatbot

### Backend APIs
- ✅ Auth with admin MFA/OTP
- ✅ KYC submission and approval
- ✅ Ride creation, search, join, accept/reject
- ✅ OTP verification
- ✅ Ride start, complete, close
- ✅ Live tracking and ETA
- ✅ Payment simulation (INR)
- ✅ Rewards and leaderboard
- ✅ Coupons with INR values
- ✅ SOS and support tickets
- ✅ RAG chatbot with Gemini

### Utilities
- ✅ OTP generation/verification
- ✅ Google Maps distance/ETA
- ✅ CO₂ calculator with car categories
- ✅ Points management
- ✅ Currency formatting (INR)

## 🚧 Frontend Implementation Needed

### 1. Login Page - Role Selector & Admin MFA
**File**: `client/src/pages/LoginPage.tsx`
**Status**: Needs role selector and Admin MFA flow

**Required**:
- Add role radio buttons (Passenger / Driver / Admin)
- For Admin: show captcha + MFA OTP step
- Call `/api/auth/admin/request-otp` and `/api/auth/admin/verify-otp`

### 2. Profile Page - KYC Submission
**File**: `client/src/pages/ProfilePage.tsx`
**Status**: Needs KYC form

**Required**:
- Show KYC status badge
- KYC submission form (document_type, document_number, file upload)
- Call `/api/kyc/submit`
- Show "KYC approval required" messages for gated features

### 3. Ride Pages - Update to INR
**Files**: 
- `client/src/pages/RideCreatePage.tsx`
- `client/src/pages/RideSearchPage.tsx`
- `client/src/pages/DashboardPage.tsx`

**Required**:
- Replace all `$` with `₹`
- Use `formatINR()` utility
- Update fare displays to show ₹
- Add KYC check before allowing ride creation/join

### 4. Ride Detail Page - OTP & Live Tracking
**File**: `client/src/app/rides/[id]/page.tsx` (needs creation)

**Required**:
- Show ride details
- OTP verification interface (for driver)
- Live map with driver location
- ETA display
- Payment status (₹)
- SOS button

### 5. Parking Dashboard
**File**: `client/src/components/parking/ParkingDashboard.tsx`
**Status**: ✅ Created with MapTiler

**Needs**:
- Connect to backend API endpoints
- Update API calls to use correct base URL
- Test with Mumbai parking lots

### 6. Rewards & Leaderboard - INR
**File**: `client/src/pages/LeaderboardPage.tsx`
**Status**: Needs INR updates

**Required**:
- Update coupon displays to show ₹ values
- Use `formatINR()` for all monetary displays

### 7. Impact Dashboard
**File**: `client/src/app/impact/page.tsx` (needs creation)

**Required**:
- Total km traveled
- Total CO₂ saved
- Weekly/monthly charts
- Call `/api/stats/me`

### 8. Admin Dashboard - KYC Approval
**File**: `client/src/pages/AdminDashboardPage.tsx`
**Status**: Needs KYC section

**Required**:
- KYC Approval section
- List pending KYC submissions
- Approve/Reject buttons
- Call `/api/kyc/pending`, `/api/kyc/:id/approve`, `/api/kyc/:id/reject`

### 9. SOS Feature
**File**: `client/src/components/SOSButton.tsx` (needs creation)

**Required**:
- SOS button component
- Modal for SOS confirmation
- Call `/api/sos` with location and ride_id

### 10. ChatWidget Integration
**File**: `client/src/components/ChatWidget.tsx`
**Status**: ✅ Created

**Needs**:
- Add to root layout or key pages
- Test with Gemini API

## 📋 Quick Implementation Checklist

### High Priority
- [ ] Update login page with role selector + Admin MFA
- [ ] Add KYC form to profile page
- [ ] Replace all $ with ₹ in ride pages
- [ ] Create ride detail page with OTP verification
- [ ] Add KYC gating to ride creation/join
- [ ] Update parking dashboard API calls
- [ ] Create impact dashboard page
- [ ] Add KYC approval to admin dashboard

### Medium Priority
- [ ] Update all monetary displays to use formatINR()
- [ ] Add SOS button to active ride view
- [ ] Integrate ChatWidget into layout
- [ ] Add live tracking map to ride detail
- [ ] Update coupon displays with ₹

### Low Priority
- [ ] Add payment confirmation flows
- [ ] Enhance admin analytics
- [ ] Add more Mumbai parking locations
- [ ] Improve error handling

## 🔧 API Endpoints Reference

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/admin/request-otp`
- `POST /api/auth/admin/verify-otp`

### Users
- `GET /api/users/me`
- `PATCH /api/users/me`
- `GET /api/users/me/stats`

### KYC
- `POST /api/kyc/submit`
- `GET /api/kyc/pending` (admin)
- `POST /api/kyc/:id/approve` (admin)
- `POST /api/kyc/:id/reject` (admin)

### Rides
- `POST /api/rides` - Create (requires KYC approved)
- `GET /api/rides/search`
- `POST /api/rides/:rideId/request` - Request to join (requires KYC approved)
- `POST /api/rides/:rideId/passengers/:passengerId/accept`
- `POST /api/rides/:rideId/passengers/:passengerId/verify-otp`
- `POST /api/rides/:rideId/start`
- `POST /api/rides/:rideId/complete`
- `GET /api/rides/:rideId/eta`
- `POST /api/rides/:rideId/location`
- `POST /api/rides/:rideId/pay`
- `POST /api/rides/:rideId/confirm-payment/:passengerId`

### Parking
- `GET /api/parking/lots`
- `GET /api/parking/lots/:id/spots`
- `POST /api/parking/reservations`
- `GET /api/parking/reservations/me`

### Rewards
- `GET /api/rewards/me`
- `GET /api/rewards/leaderboard`
- `GET /api/coupons`
- `POST /api/coupons/:couponId/redeem`

### Stats
- `GET /api/stats/me`

### SOS & Support
- `POST /api/sos`
- `POST /api/support`
- `GET /api/support/my`

### Chatbot
- `POST /api/chatbot/query`

## 💰 Currency Formatting

Use the utility function:
```tsx
import { formatINR, formatFare } from '@/utils/currency';

// Examples:
formatINR(100) // "₹100"
formatINR(1000) // "₹1,000"
formatFare(150.50) // "₹151"
```

## 🗺️ Mumbai Parking Locations

1. **Phoenix Palladium Parking**
   - Address: Phoenix Palladium, Lower Parel, Mumbai, Maharashtra 400013
   - Coordinates: (18.9949, 72.8258)
   - 50 spots, EV charging available

2. **Jio World Drive Parking**
   - Address: Jio World Drive, Bandra Kurla Complex, Mumbai, Maharashtra 400051
   - Coordinates: (19.0625, 72.8673)
   - 75 spots, EV charging available

3. **R City Mall Parking**
   - Address: R City Mall, Ghatkopar West, Mumbai, Maharashtra 400086
   - Coordinates: (19.0870, 72.9090)
   - 60 spots

## 📝 Next Steps

1. Run database migrations:
   - `002_enhanced_schema.sql`
   - `003_mumbai_parking_seed.sql`

2. Update frontend components systematically:
   - Start with login (role selector)
   - Then profile (KYC)
   - Then ride pages (INR + KYC gating)
   - Then admin (KYC approval)

3. Test end-to-end flows:
   - Register → Submit KYC → Admin approves → Create ride → Join ride → Complete ride

4. Add ChatWidget to layout

5. Test parking dashboard with real Mumbai locations

