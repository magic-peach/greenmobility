'use client';

import { LoginPage } from '@/pages/LoginPage';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string, role?: 'passenger' | 'driver' | 'admin') => {
    try {
      console.log('[DEBUG] ===== LOGIN START =====');
      console.log('[DEBUG] Starting login for role:', role);
      console.log('[DEBUG] Email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[DEBUG] Supabase response received');
      console.log('[DEBUG] Has data:', !!data);
      console.log('[DEBUG] Has error:', !!error);

      if (error) {
        console.error('[DEBUG] Supabase auth error:', error);
        console.error('[DEBUG] Error message:', error.message);
        console.error('[DEBUG] Error code:', error.status);
        throw error;
      }

      if (data.session) {
        console.log('[DEBUG] Login successful, session created');
        console.log('[DEBUG] Role selected:', role);
        console.log('[DEBUG] User ID:', data.user.id);
        console.log('[DEBUG] Session token exists:', !!data.session.access_token);
        
        // Small delay to ensure session is set
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Redirect based on role
        if (role === 'admin') {
          console.log('[DEBUG] ===== REDIRECTING TO ADMIN =====');
          console.log('[DEBUG] Using window.location.href');
          // Use window.location for more reliable redirect
          window.location.href = '/admin';
          // Fallback after 1 second
          setTimeout(() => {
            console.log('[DEBUG] Fallback redirect triggered');
            window.location.href = '/admin';
          }, 1000);
        } else {
          console.log('[DEBUG] Redirecting to dashboard');
          router.push('/dashboard');
        }
      } else {
        console.error('[DEBUG] No session created after login');
        throw new Error('No session created');
      }
    } catch (err: any) {
      console.error('[DEBUG] ===== LOGIN ERROR =====');
      console.error('[DEBUG] Login error:', err);
      console.error('[DEBUG] Error type:', typeof err);
      console.error('[DEBUG] Error message:', err?.message);
      console.error('[DEBUG] Error stack:', err?.stack);
      setError(err?.message || 'Login failed');
      throw err;
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return (
    <LoginPage
      onLogin={handleLogin}
      onGoogleLogin={handleGoogleLogin}
      onNavigateToRegister={() => router.push('/register')}
    />
  );
}
