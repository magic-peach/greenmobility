'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RideCreatePage } from '@/pages/RideCreatePage';
import { Navbar } from '@/components/Navbar';
import type { User, AppContextType } from '@/types/AppContext';

export default function RideCreate() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push('/login');
        return;
      }
      setAccessToken(session.access_token);
      await fetchUserProfile(session.user.id, session.access_token);
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string, token: string) => {
    try {
      const { projectId } = await import('@/utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1659ed12/users/${userId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      if (response.ok) {
        setUser(await response.json());
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const refreshUser = async () => {
    if (user?.id && accessToken) {
      await fetchUserProfile(user.id, accessToken);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading || !user || !accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const appContext: AppContextType = {
    user,
    accessToken,
    supabase,
    refreshUser,
  };

  return (
    <>
      <Navbar
        user={user}
        currentPage="ride-create"
        onNavigate={(page) => {
          const routes: Record<string, string> = {
            'dashboard': '/dashboard',
            'profile': '/profile',
            'ride-search': '/rides/search',
            'ride-create': '/rides/create',
            'parking': '/parking',
            'leaderboard': '/leaderboard',
            'history': '/history',
            'admin': '/admin',
          };
          router.push(routes[page] || '/dashboard');
        }}
        onLogout={handleLogout}
      />
      <main className="pt-20">
        <RideCreatePage context={appContext} onNavigate={(page) => {
          const routes: Record<string, string> = {
            'ride-search': '/rides/search',
            'dashboard': '/dashboard',
          };
          router.push(routes[page] || '/dashboard');
        }} />
      </main>
    </>
  );
}
