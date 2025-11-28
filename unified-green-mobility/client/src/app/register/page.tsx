'use client';

import { RegisterPage } from '@/views/RegisterPage';
import { supabase } from '@/lib/supabase';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { useRouter } from 'next/navigation';

export default function Register() {
  const router = useRouter();

  const handleRegister = async (email: string, password: string, name: string, phone: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1659ed12/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password, name, phone }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Auto-login after registration
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;
      if (loginData.session) {
        router.push('/dashboard');
      }
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <RegisterPage
      onRegister={handleRegister}
      onNavigateToLogin={() => router.push('/login')}
    />
  );
}
