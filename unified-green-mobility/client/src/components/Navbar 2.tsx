'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <nav className="bg-green-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold">
              🌱 Green Mobility
            </Link>
            <div className="ml-10 flex space-x-4">
              {user && (
                <>
                  <Link href="/dashboard" className="px-3 py-2 rounded-md hover:bg-green-700">
                    Dashboard
                  </Link>
                  <Link href="/rides" className="px-3 py-2 rounded-md hover:bg-green-700">
                    Rides
                  </Link>
                  <Link href="/parking" className="px-3 py-2 rounded-md hover:bg-green-700">
                    Parking
                  </Link>
                  <Link href="/leaderboard" className="px-3 py-2 rounded-md hover:bg-green-700">
                    Leaderboard
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="px-3 py-2 rounded-md hover:bg-green-700">
                      Admin
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/profile" className="px-3 py-2 rounded-md hover:bg-green-700">
                  {user.name}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-green-700 rounded-md hover:bg-green-800"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-3 py-2 rounded-md hover:bg-green-700">
                  Login
                </Link>
                <Link href="/register" className="px-4 py-2 bg-green-700 rounded-md hover:bg-green-800">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

