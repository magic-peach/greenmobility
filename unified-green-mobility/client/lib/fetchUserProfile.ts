import { supabase } from '@/lib/supabase';
import type { User } from '@/types/AppContext';

export async function fetchUserProfile(userId: string): Promise<User | null> {
  try {
    // Try to get user from Supabase users table directly
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      // If table doesn't exist or user not found, create a basic user object from auth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        return {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          phone: authUser.user_metadata?.phone,
          role: authUser.email === 'akankshatrehun3108@gmail.com' ? 'admin' : 'passenger',
          kyc_status: 'not_submitted',
          created_at: authUser.created_at,
        };
      }
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Fallback: create user from auth data
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      return {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        phone: authUser.user_metadata?.phone,
        role: authUser.email === 'akankshatrehun3108@gmail.com' ? 'admin' : 'passenger',
        kyc_status: 'not_submitted',
        created_at: authUser.created_at,
      };
    }
    return null;
  }
}

