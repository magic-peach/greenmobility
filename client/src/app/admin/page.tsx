'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { Navbar } from '@/components/Navbar';
import type { User, AppContextType } from '@/types/AppContext';

export default function Admin() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push('/login');
        return;
      }

      setAccessToken(session.access_token);
      await fetchUserProfile(session.user.id);
    } catch (error) {
      console.error('Admin session check error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const userData = await import('@/lib/fetchUserProfile').then((m) =>
        m.fetchUserProfile(userId),
      );
      if (userData) {
        setUser(userData);
      }
    } catch (err) {
      console.error('Failed to load admin user profile:', err);
    }
  };

  const refreshUser = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  if (loading || !accessToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <p className="text-gray-300">Loading admin profile...</p>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">Access Denied</p>
          <p className="text-gray-400 mb-4">
            Your account does not have admin privileges.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Current role:{' '}
            <span className="text-yellow-400 capitalize">{user.role}</span>
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
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
        currentPage="admin"
        onNavigate={(page) => {
          const routes: Record<string, string> = {
            dashboard: '/dashboard',
            profile: '/profile',
            'ride-search': '/rides/search',
            'ride-create': '/rides/create',
            parking: '/parking',
            leaderboard: '/leaderboard',
            history: '/history',
            admin: '/admin',
          };
          router.push(routes[page] || '/dashboard');
        }}
        onLogout={async () => {
          await supabase.auth.signOut();
          router.push('/login');
        }}
      />
      <main className="pt-20">
        <AdminDashboardPage context={appContext} />
      </main>
    </>
  );
}


