'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { WelcomePage } from '@/views/WelcomePage';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  };

  return <WelcomePage onNavigateToLogin={() => router.push('/login')} />;
}
