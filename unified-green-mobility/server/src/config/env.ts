import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
  },
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  nodeEnv: process.env.NODE_ENV || 'development',
};
