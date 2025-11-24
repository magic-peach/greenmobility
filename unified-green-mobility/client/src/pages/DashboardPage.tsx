import { useState, useEffect } from 'react';
import { Car, ParkingSquare, Leaf, TrendingUp, Plus, Search } from 'lucide-react';
import type { AppContextType } from '@/types/AppContext';
import { projectId } from '../utils/supabase/info';

type DashboardPageProps = {
  context: AppContextType;
  onNavigate: (page: 'ride-create' | 'ride-search' | 'parking') => void;
};

export function DashboardPage({ context, onNavigate }: DashboardPageProps) {
  const [stats, setStats] = useState({
    points: 0,
    total_co2_saved_kg: 0,
    total_distance_km: 0,
  });
  const [recentRides, setRecentRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch user stats
      const statsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1659ed12/rewards/my`,
        {
          headers: {
            'Authorization': `Bearer ${context.accessToken}`,
          },
        }
      );
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent rides
      const ridesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1659ed12/rides/my`,
        {
          headers: {
            'Authorization': `Bearer ${context.accessToken}`,
          },
        }
      );
      if (ridesResponse.ok) {
        const ridesData = await ridesResponse.json();
        setRecentRides(ridesData.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="mb-8 slide-in-up">
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, <span className="gradient-text">{context.user?.name}</span>!
        </h1>
        <p className="text-gray-400">Let's make today more sustainable</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => onNavigate('ride-search')}
          className="glass-card p-6 text-left hover:scale-105 transition-all duration-300 slide-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 neon-glow-blue">
            <Search className="text-white" size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Find a Ride</h3>
          <p className="text-gray-400 text-sm">Search for available carpools</p>
        </button>

        <button
          onClick={() => onNavigate('ride-create')}
          className="glass-card p-6 text-left hover:scale-105 transition-all duration-300 slide-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 neon-glow-pink">
            <Plus className="text-white" size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Offer a Ride</h3>
          <p className="text-gray-400 text-sm">Share your journey</p>
        </button>

        <button
          onClick={() => onNavigate('parking')}
          className="glass-card p-6 text-left hover:scale-105 transition-all duration-300 slide-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 neon-glow-green">
            <ParkingSquare className="text-white" size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Find Parking</h3>
          <p className="text-gray-400 text-sm">Reserve smart parking spots</p>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stats-card slide-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl flex items-center justify-center border border-green-500/30">
              <Leaf className="text-green-400" size={24} />
            </div>
            <div className="px-3 py-1 bg-green-500/20 rounded-full">
              <span className="text-green-400 text-xs font-bold">+12%</span>
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">CO₂ Saved</p>
            <p className="text-3xl font-bold text-green-400">
              {stats.total_co2_saved_kg.toFixed(1)} <span className="text-lg">kg</span>
            </p>
          </div>
        </div>

        <div className="stats-card slide-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Car className="text-blue-400" size={24} />
            </div>
            <div className="px-3 py-1 bg-blue-500/20 rounded-full">
              <span className="text-blue-400 text-xs font-bold">+8%</span>
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Distance Traveled</p>
            <p className="text-3xl font-bold text-blue-400">
              {stats.total_distance_km.toFixed(0)} <span className="text-lg">km</span>
            </p>
          </div>
        </div>

        <div className="stats-card slide-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl flex items-center justify-center border border-orange-500/30">
              <TrendingUp className="text-orange-400" size={24} />
            </div>
            <div className="px-3 py-1 bg-orange-500/20 rounded-full">
              <span className="text-orange-400 text-xs font-bold">+25</span>
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Reward Points</p>
            <p className="text-3xl font-bold text-orange-400">
              {stats.points} <span className="text-lg">pts</span>
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.7s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recent Rides</h2>
          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
            View All →
          </button>
        </div>

        {recentRides.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="text-gray-400" size={32} />
            </div>
            <p className="text-gray-400 mb-4">No rides yet</p>
            <button
              onClick={() => onNavigate('ride-search')}
              className="btn-primary"
            >
              Find Your First Ride
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentRides.map((ride: any, index: number) => (
              <div
                key={ride.id}
                className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/50 transition-all cursor-pointer"
                style={{ animationDelay: `${0.8 + index * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Car size={16} />
                      </div>
                      <div>
                        <p className="font-medium">{ride.start_location_name}</p>
                        <p className="text-sm text-gray-400">→ {ride.end_location_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-400">
                        {new Date(ride.departure_time).toLocaleDateString()}
                      </span>
                      <span className={`badge ${
                        ride.status === 'open' ? 'badge-success' :
                        ride.status === 'ongoing' ? 'badge-info' :
                        'badge-warning'
                      }`}>
                        {ride.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Available Seats</p>
                    <p className="text-2xl font-bold text-blue-400">{ride.available_seats}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating 3D Elements */}
      <div className="fixed bottom-10 right-10 pointer-events-none hidden lg:block">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-pink-500/30 rounded-3xl rotate-12 float-animation blur-xl"></div>
          <div className="absolute inset-4 bg-gradient-to-br from-green-500/30 to-orange-500/30 rounded-2xl -rotate-12 float-animation blur-xl" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    </div>
  );
}
