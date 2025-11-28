'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardPage } from '@/views/DashboardPage';
import { DriverDashboard } from '@/components/dashboard/DriverDashboard';
import { PassengerDashboard } from '@/components/dashboard/PassengerDashboard';
import { Navbar } from '@/components/Navbar';
import type { User, AppContextType } from '@/types/AppContext';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // If user profile fetch failed, create fallback user from auth
  useEffect(() => {
    if (!user && accessToken) {
      let isMounted = true;
      supabase.auth.getUser().then(({ data: { user: authUser } }) => {
        if (authUser && isMounted) {
          const fallbackUser: User = {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            role: 'passenger',
            kyc_status: 'unverified',
            created_at: authUser.created_at,
          };
          setUser(fallbackUser);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [user, accessToken]);

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push('/login');
        setLoading(false);
        return;
      }
      setAccessToken(session.access_token);
      await fetchUserProfile(session.user.id, session.access_token);
      setLoading(false);
    } catch (error) {
      console.error('Session check error:', error);
      setLoading(false);
      router.push('/login');
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!accessToken) {
    return null; // Will redirect to login
  }

  if (!user) {
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
        currentPage="dashboard"
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
        {user.role === 'driver' ? (
          <DriverDashboard context={appContext} onNavigate={(page) => {
            const routes: Record<string, string> = {
              'ride-create': '/rides/create',
              'parking': '/parking',
              'history': '/history',
            };
            router.push(routes[page] || '/dashboard');
          }} />
        ) : (
          <PassengerDashboard context={appContext} onNavigate={(page) => {
            const routes: Record<string, string> = {
              'ride-search': '/rides/search',
              'parking': '/parking',
              'history': '/history',
            };
            router.push(routes[page] || '/dashboard');
          }} />
        )}
      </main>
    </>
  );
}
