# Unified Green Mobility Platform

A full-stack web application for discovering parking spots, sharing rides/bike-pooling, and tracking CO₂ savings with reward points.

## Tech Stack

- **Frontend**: Next.js 14 (React, TypeScript, TailwindCSS)
- **Backend**: Node.js + Express (TypeScript)
- **Database & Auth**: Supabase (PostgreSQL)
- **Maps**: Google Maps JavaScript API
- **Realtime**: Supabase Realtime

## Project Structure

```
unified-green-mobility/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and API clients
│   │   └── types/         # TypeScript types
├── server/                # Express backend
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   └── utils/         # Utility functions
│   └── migrations/        # Database migration files
└── shared/                # Shared types between client and server
    └── src/
        └── types.ts
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Google Maps API key (optional, for map features)

### 1. Clone and Install Dependencies

```bash
cd unified-green-mobility

# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get:
   - Project URL
   - `anon` key
   - `service_role` key

3. Run the database migration:
   - Go to SQL Editor in Supabase dashboard
   - Copy and run the contents of `server/migrations/001_initial_schema.sql`

### 3. Configure Environment Variables

#### Server (.env in `/server` directory)

```env
PORT=4000
NODE_ENV=development
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
JWT_SECRET=your_jwt_secret_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

#### Client (.env.local in `/client` directory)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 4. Run the Application

#### Development Mode

From the root directory:

```bash
# Run both client and server concurrently
npm run dev
```

Or run them separately:

```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

#### Production Build

```bash
# Build both
npm run build

# Start server
cd server
npm start

# Start client (in another terminal)
cd client
npm start
```

## Features

### 1. User Authentication
- Email/password signup and login
- User profiles with role management (driver, passenger, admin)
- KYC verification flow (mock implementation)

### 2. Ride Sharing & Bike-Pooling
- Create rides as a driver
- Search for rides by location and time
- Join rides as a passenger
- Live ride tracking (using Supabase Realtime)
- In-app chat for rides
- Fare sharing calculator

### 3. Smart Parking System
- Browse parking lots on a map
- View real-time spot availability
- Make parking reservations
- Navigation to parking spots

### 4. Sustainability & Rewards
- CO₂ savings calculator
- Reward points system
- Leaderboard showing top contributors
- Track distance traveled and emissions saved

### 5. Admin Dashboard
- User management
- Analytics (rides, parking usage, CO₂ saved)
- Traffic patterns and peak hours

### 6. Safety Features
- Rating system for rides
- SOS emergency alerts
- Emergency contacts management

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/kyc` - Submit KYC documents

### Rides
- `POST /api/rides` - Create a ride
- `GET /api/rides/search` - Search rides
- `GET /api/rides/my` - Get my created rides
- `GET /api/rides/my-joined` - Get rides I joined
- `GET /api/rides/:id` - Get ride details
- `POST /api/rides/:rideId/join` - Join a ride
- `PATCH /api/rides/:rideId/passengers/:passengerId` - Accept/reject passenger

### Parking
- `GET /api/parking/lots` - Get all parking lots
- `GET /api/parking/lots/:id/spots` - Get spots for a lot
- `POST /api/parking/reservations` - Create reservation
- `GET /api/parking/reservations/my` - Get my reservations
- `PATCH /api/parking/reservations/:id/cancel` - Cancel reservation

### Rewards
- `GET /api/rewards/leaderboard` - Get leaderboard
- `GET /api/rewards/my-stats` - Get my stats (requires auth)

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/rides` - Get all rides
- `GET /api/admin/analytics/traffic` - Traffic analytics
- `GET /api/admin/analytics/parking-usage` - Parking usage analytics
- `GET /api/admin/analytics/co2-saved` - CO₂ savings analytics

## Database Schema

The database includes tables for:
- `users` - User profiles
- `rides` - Ride listings
- `ride_passengers` - Passenger requests
- `parking_lots` - Parking lot information
- `parking_spots` - Individual parking spots
- `parking_reservations` - Parking bookings
- `ratings` - User ratings
- `user_emissions_stats` - CO₂ tracking
- `user_rewards` - Reward points
- And more...

See `server/migrations/001_initial_schema.sql` for the complete schema.

## Development Notes

### Authentication Flow
- Frontend uses Supabase client for auth
- Backend validates JWT tokens from Supabase
- Service role key is used on backend to bypass RLS

### Realtime Features
- Ride location updates use Supabase Realtime subscriptions
- Chat messages are pushed via Supabase Realtime

### Google Maps Integration
- Add your Google Maps API key to environment variables
- Maps component can be added to parking and ride pages
- Directions API for navigation

## Troubleshooting

### Common Issues

1. **CORS errors**: Make sure the backend CORS is configured to allow requests from `http://localhost:3000`

2. **Authentication errors**: 
   - Verify Supabase credentials are correct
   - Check that RLS policies allow necessary operations
   - Ensure service role key is used on backend

3. **Database errors**:
   - Run the migration SQL in Supabase SQL editor
   - Check that all tables are created correctly

4. **Port conflicts**:
   - Change ports in `.env` files if 3000 or 4000 are in use

## License

This project is for educational/demonstration purposes.

## Contributing

This is a demonstration project. Feel free to fork and extend it for your needs.

