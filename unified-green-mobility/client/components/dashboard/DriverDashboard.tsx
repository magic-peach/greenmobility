import { useState, useEffect } from 'react';
import { Car, ParkingSquare, Leaf, TrendingUp, Plus, CheckCircle } from 'lucide-react';
import type { AppContextType } from '@/types/AppContext';
import { projectId } from '@/utils/supabase/info';

type DriverDashboardProps = {
  context: AppContextType;
  onNavigate: (page: 'ride-create' | 'parking') => void;
};

export function DriverDashboard({ context, onNavigate }: DriverDashboardProps) {
  const [stats, setStats] = useState({
    points: 0,
    total_co2_saved_kg: 0,
    total_distance_km: 0,
  });
  const [driverRides, setDriverRides] = useState<any[]>([]);
  const [activeReservations, setActiveReservations] = useState<any[]>([]);
  const [recentParkings, setRecentParkings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingRide, setCompletingRide] = useState<string | null>(null);

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

      // Fetch driver rides
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
      const ridesResponse = await fetch(`${apiBaseUrl}/rides/driver`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });
      if (ridesResponse.ok) {
        const ridesData = await ridesResponse.json();
        setDriverRides(ridesData);
      }

      // Fetch parking reservations
      const reservationsResponse = await fetch(`${apiBaseUrl}/parking/reservations/my`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });
      if (reservationsResponse.ok) {
        const reservationsData = await reservationsResponse.json();
        const allReservations = Array.isArray(reservationsData) ? reservationsData : [];
        // Filter active reservations (upcoming/active)
        setActiveReservations(allReservations.filter((r: any) => r.status === 'upcoming' || r.status === 'active'));
        // Get recent parkings (last 5, including completed)
        setRecentParkings(allReservations.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRide = async (rideId: string) => {
    if (!confirm('Mark this ride as completed? Passengers will be notified to pay.')) return;

    setCompletingRide(rideId);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/rides/${rideId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });

      if (response.ok) {
        alert('Ride marked as completed. Passengers have been notified to pay.');
        fetchDashboardData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to complete ride');
      }
    } catch (error) {
      console.error('Error completing ride:', error);
      alert('Failed to complete ride');
    } finally {
      setCompletingRide(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const activeRides = driverRides.filter((r: any) => r.status === 'upcoming' || r.status === 'ongoing');
  const completedRides = driverRides.filter((r: any) => r.status === 'completed' || r.status === 'closed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="mb-8 slide-in-up">
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, <span className="gradient-text">{context.user?.name}</span>!
        </h1>
        <p className="text-gray-400">Manage your rides and earn rewards</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => {
            if (context.user?.kyc_status !== 'approved') {
              alert('KYC approval required to create rides. Please complete KYC verification in your profile.');
              return;
            }
            onNavigate('ride-create');
          }}
          className={`glass-card p-6 text-left hover:scale-105 transition-all duration-300 slide-in-up ${
            context.user?.kyc_status !== 'approved'
              ? 'opacity-60 cursor-not-allowed'
              : ''
          }`}
          style={{ animationDelay: '0.1s' }}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 neon-glow-pink">
            <Plus className="text-white" size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Create a Ride</h3>
          <p className="text-gray-400 text-sm">
            {context.user?.kyc_status !== 'approved'
              ? 'KYC approval required'
              : 'Offer a ride and share your journey'}
          </p>
        </button>

        <button
          onClick={() => onNavigate('parking')}
          className="glass-card p-6 text-left hover:scale-105 transition-all duration-300 slide-in-up"
          style={{ animationDelay: '0.2s' }}
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
        <div className="stats-card slide-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
              <Car className="text-blue-400" size={24} />
            </div>
            <div className="px-3 py-1 bg-blue-500/20 rounded-full">
              <span className="text-blue-400 text-xs font-bold">{activeRides.length}</span>
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Active Rides</p>
            <p className="text-3xl font-bold text-blue-400">
              {activeRides.length} <span className="text-lg">rides</span>
            </p>
          </div>
        </div>

        <div className="stats-card slide-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl flex items-center justify-center border border-green-500/30">
              <CheckCircle className="text-green-400" size={24} />
            </div>
            <div className="px-3 py-1 bg-green-500/20 rounded-full">
              <span className="text-green-400 text-xs font-bold">{completedRides.length}</span>
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Completed Rides</p>
            <p className="text-3xl font-bold text-green-400">
              {completedRides.length} <span className="text-lg">rides</span>
            </p>
          </div>
        </div>

        <div className="stats-card slide-in-up" style={{ animationDelay: '0.5s' }}>
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

      {/* Your Rides Section */}
      <div className="glass-card p-6 slide-in-up mb-8" style={{ animationDelay: '0.6s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Car className="mr-2 text-blue-400" size={24} />
            Your Rides
          </h2>
        </div>

        {driverRides.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="text-gray-400" size={32} />
            </div>
            <p className="text-gray-400 mb-4">No rides created yet</p>
            <button
              onClick={() => onNavigate('ride-create')}
              className="btn-primary"
            >
              Create Your First Ride
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {driverRides.map((ride: any, index: number) => (
              <div
                key={ride.id}
                className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/50 transition-all"
                style={{ animationDelay: `${0.7 + index * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Car size={16} />
                      </div>
                      <div>
                        <p className="font-medium">{ride.origin_name || ride.start_location_name}</p>
                        <p className="text-sm text-gray-400">→ {ride.destination_name || ride.end_location_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-400">
                        {new Date(ride.departure_time).toLocaleString()}
                      </span>
                      <span className="text-gray-400">
                        {ride.current_passenger_count || 0} / {ride.max_passengers || (ride.total_seats - 1)} passengers
                      </span>
                      <span className={`badge ${
                        ride.status === 'upcoming' ? 'badge-info' :
                        ride.status === 'ongoing' ? 'badge-warning' :
                        ride.status === 'completed' ? 'badge-success' :
                        'badge-info'
                      }`}>
                        {ride.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {(ride.status === 'upcoming' || ride.status === 'ongoing') && (
                    <button
                      onClick={() => handleCompleteRide(ride.id)}
                      disabled={completingRide === ride.id}
                      className="btn-primary btn-sm ml-3"
                    >
                      {completingRide === ride.id ? 'Completing...' : 'Mark as Completed'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Parking Reservations */}
      {activeReservations.length > 0 && (
        <div className="glass-card p-6 slide-in-up mb-8" style={{ animationDelay: '0.8s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <ParkingSquare className="mr-2 text-green-400" size={24} />
              Active Parking Reservations
            </h2>
          </div>
          <div className="space-y-3">
            {activeReservations.map((reservation: any) => (
              <div
                key={reservation.id}
                className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-green-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">
                      Spot #{reservation.parking_spot?.spot_number || 'N/A'} - {reservation.parking_spot?.parking_lot?.name || 'Unknown Lot'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(reservation.start_time).toLocaleString()} - {new Date(reservation.end_time).toLocaleString()}
                    </p>
                    <span className={`badge mt-2 ${
                      reservation.status === 'active' ? 'badge-warning' : 'badge-info'
                    }`}>
                      {reservation.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reserved Parking Spots */}
      <div className="glass-card p-6 slide-in-up mb-8" style={{ animationDelay: '0.9s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <ParkingSquare className="mr-2 text-green-400" size={24} />
            Reserved Parking Spots
          </h2>
          <button 
            onClick={() => onNavigate('parking')}
            className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
          >
            View All →
          </button>
        </div>

        {recentParkings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <ParkingSquare className="text-gray-400" size={32} />
            </div>
            <p className="text-gray-400 mb-4">No parking reservations yet</p>
            <button
              onClick={() => onNavigate('parking')}
              className="btn-primary"
            >
              Find Parking
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentParkings.map((reservation: any, index: number) => (
              <div
                key={reservation.id}
                className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-green-500/50 transition-all cursor-pointer"
                style={{ animationDelay: `${1.0 + index * 0.1}s` }}
                onClick={() => onNavigate('parking')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <ParkingSquare size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium">
                          Spot #{reservation.parking_spot?.spot_number || 'N/A'} - {reservation.parking_spot?.parking_lot?.name || 'Unknown Lot'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {reservation.parking_spot?.parking_lot?.address || 'Mumbai'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-400">
                        {new Date(reservation.start_time).toLocaleDateString()} - {new Date(reservation.end_time).toLocaleDateString()}
                      </span>
                      <span className={`badge ${
                        reservation.status === 'active' ? 'badge-warning' :
                        reservation.status === 'upcoming' ? 'badge-info' :
                        reservation.status === 'completed' ? 'badge-success' :
                        'badge-info'
                      }`}>
                        {reservation.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Amount</p>
                    <p className="text-2xl font-bold text-green-400">
                      ₹{reservation.amount_paid || 0}
                    </p>
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

