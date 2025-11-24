'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { HistoryPage } from '@/pages/HistoryPage';
import { Navbar } from '@/components/Navbar';
import type { User, AppContextType } from '@/types/AppContext';

export default function History() {
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
    const userData = await import("@/lib/fetchUserProfile").then(m => m.fetchUserProfile(userId));
    if (userData) {
      setUser(userData);
    }
  };

  const refreshUser = async () => {
    if (user?.id && accessToken) {
      await fetchUserProfile(user.id, accessToken);
    }
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
        currentPage="history"
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
        onLogout={async () => {
          await supabase.auth.signOut();
          router.push('/login');
        }}
      />
      <main className="pt-20">
        <HistoryPage context={appContext} />
      </main>
    </>
  );
}
