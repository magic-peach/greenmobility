import { supabase } from '@/lib/supabase';

export type User = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'driver' | 'passenger' | 'admin';
  kyc_status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  created_at: string;
};

export type AppContextType = {
  user: User | null;
  accessToken: string | null;
  supabase: typeof supabase;
  refreshUser: () => Promise<void>;
};

