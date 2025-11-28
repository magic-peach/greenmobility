import { useState, useEffect } from 'react';
import { Car, ParkingSquare, Leaf, TrendingUp, Search, DollarSign } from 'lucide-react';
import type { AppContextType } from '@/types/AppContext';
import { projectId } from '@/utils/supabase/info';

type PassengerDashboardProps = {
  context: AppContextType;
  onNavigate: (page: 'ride-search' | 'parking') => void;
};

export function PassengerDashboard({ context, onNavigate }: PassengerDashboardProps) {
  const [stats, setStats] = useState({
    points: 0,
    total_co2_saved_kg: 0,
    total_distance_km: 0,
  });
  const [myJoinedRides, setMyJoinedRides] = useState<any[]>([]);
  const [activeReservations, setActiveReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingRide, setPayingRide] = useState<string | null>(null);

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

      // Fetch passenger's joined rides
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
      const ridesResponse = await fetch(`${apiBaseUrl}/rides/my-joined`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });
      if (ridesResponse.ok) {
        const ridesData = await ridesResponse.json();
        setMyJoinedRides(ridesData);
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
        setActiveReservations(allReservations.filter((r: any) => r.status === 'upcoming' || r.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (rideId: string, mode: 'split' | 'full' = 'split') => {
    if (!confirm(`Mark payment as ${mode === 'split' ? 'split fare' : 'full amount'}?`)) return;

    setPayingRide(rideId);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/rides/${rideId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`,
        },
        body: JSON.stringify({ mode }),
      });

      if (response.ok) {
        alert('Payment recorded. Your rewards will update shortly.');
        fetchDashboardData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
    } finally {
      setPayingRide(null);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => {
            if (context.user?.kyc_status !== 'verified') {
              alert('KYC approval required to join rides. Please complete KYC verification in your profile.');
              return;
            }
            onNavigate('ride-search');
          }}
          className={`glass-card p-6 text-left hover:scale-105 transition-all duration-300 slide-in-up ${
            context.user?.kyc_status !== 'verified'
              ? 'opacity-60 cursor-not-allowed'
              : ''
          }`}
          style={{ animationDelay: '0.1s' }}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 neon-glow-blue">
            <Search className="text-white" size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Find a Ride</h3>
          <p className="text-gray-400 text-sm">
            {context.user?.kyc_status !== 'verified'
              ? 'KYC approval required'
              : 'Search for available carpools'}
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

        <div className="stats-card slide-in-up" style={{ animationDelay: '0.4s' }}>
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

        {myJoinedRides.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="text-gray-400" size={32} />
            </div>
            <p className="text-gray-400 mb-4">No rides joined yet</p>
            <button
              onClick={() => onNavigate('ride-search')}
              className="btn-primary"
            >
              Find Your First Ride
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myJoinedRides.map((ride: any, index: number) => {
              const needsPayment = ride.ride?.status === 'completed' && 
                (ride.payment_status === 'pending' || ride.payment_status === 'split_pending');
              const isPaid = ride.payment_status === 'paid' || ride.payment_status === 'paid_full';

              return (
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
                          <p className="font-medium">
                            {ride.ride?.origin_name || ride.ride?.start_location_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-400">
                            → {ride.ride?.destination_name || ride.ride?.end_location_name || 'Unknown'}
                          </p>
                          {ride.ride?.driver && (
                            <p className="text-xs text-gray-500 mt-1">
                              Driver: {ride.ride.driver.name || ride.ride.driver.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-400">
                          {ride.ride?.departure_time ? new Date(ride.ride.departure_time).toLocaleString() : 'N/A'}
                        </span>
                        <span className={`badge ${
                          ride.ride?.status === 'completed' ? 'badge-success' :
                          ride.ride?.status === 'ongoing' ? 'badge-warning' :
                          'badge-info'
                        }`}>
                          {ride.ride?.status?.toUpperCase() || 'UNKNOWN'}
                        </span>
                        {needsPayment && (
                          <span className="badge badge-warning">Payment Required</span>
                        )}
                        {isPaid && (
                          <span className="badge badge-success">Paid</span>
                        )}
                      </div>
                      {needsPayment && ride.fare_amount_inr && (
                        <div className="mt-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                          <p className="text-sm text-yellow-400 mb-2">
                            Ride completed – payment required: ₹{ride.fare_amount_inr.toFixed(2)}
                          </p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handlePayment(ride.ride_id, 'split')}
                              disabled={payingRide === ride.ride_id}
                              className="btn-primary btn-sm"
                            >
                              {payingRide === ride.ride_id ? 'Processing...' : 'Pay & Split Fare'}
                            </button>
                            <button
                              onClick={() => handlePayment(ride.ride_id, 'full')}
                              disabled={payingRide === ride.ride_id}
                              className="btn-secondary btn-sm"
                            >
                              Pay Full Amount
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

