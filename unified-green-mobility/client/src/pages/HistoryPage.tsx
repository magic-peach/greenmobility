import { useState, useEffect } from 'react';
import { Car, ParkingSquare, Calendar, MapPin, Clock } from 'lucide-react';
import { formatINR } from '@/utils/currency';
import type { AppContextType } from '@/types/AppContext';
import { projectId } from '../utils/supabase/info';

type HistoryPageProps = {
  context: AppContextType;
};

export function HistoryPage({ context }: HistoryPageProps) {
  const [activeTab, setActiveTab] = useState<'rides' | 'parking'>('rides');
  const [rides, setRides] = useState([]);
  const [parkingReservations, setParkingReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      // Fetch rides
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
        setRides(ridesData);
      }

      // Fetch parking reservations
      const parkingResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1659ed12/parking/reservations/my`,
        {
          headers: {
            'Authorization': `Bearer ${context.accessToken}`,
          },
        }
      );
      if (parkingResponse.ok) {
        const parkingData = await parkingResponse.json();
        setParkingReservations(parkingData);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
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
      {/* Header */}
      <div className="mb-8 slide-in-up">
        <h1 className="text-4xl font-bold mb-2 gradient-text">Activity History</h1>
        <p className="text-gray-400">Track your sustainable journey</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6 slide-in-up" style={{ animationDelay: '0.1s' }}>
        <button
          onClick={() => setActiveTab('rides')}
          className={`flex-1 py-4 rounded-xl font-medium transition-all ${
            activeTab === 'rides'
              ? 'bg-gradient-to-r from-blue-500 to-pink-500 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Car className="inline mr-2" size={20} />
          Rides ({rides.length})
        </button>
        <button
          onClick={() => setActiveTab('parking')}
          className={`flex-1 py-4 rounded-xl font-medium transition-all ${
            activeTab === 'parking'
              ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <ParkingSquare className="inline mr-2" size={20} />
          Parking ({parkingReservations.length})
        </button>
      </div>

      {/* Rides Tab */}
      {activeTab === 'rides' && (
        <div className="space-y-4">
          {rides.length === 0 ? (
            <div className="glass-card p-12 text-center slide-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-400 mb-2">No ride history yet</p>
              <p className="text-sm text-gray-500">Start sharing rides to see your history</p>
            </div>
          ) : (
            rides.map((ride: any, index: number) => (
              <div
                key={ride.id}
                className="glass-card p-6 hover:scale-102 transition-all slide-in-up"
                style={{ animationDelay: `${0.2 + index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${
                      ride.status === 'completed' ? 'from-green-500 to-emerald-500' :
                      ride.status === 'ongoing' ? 'from-blue-500 to-cyan-500' :
                      ride.status === 'cancelled' ? 'from-pink-500 to-red-500' :
                      'from-orange-500 to-yellow-500'
                    } rounded-xl flex items-center justify-center`}>
                      <Car size={24} />
                    </div>
                    <div>
                      <span className={`badge ${
                        ride.status === 'completed' ? 'badge-success' :
                        ride.status === 'ongoing' ? 'badge-info' :
                        ride.status === 'cancelled' ? 'badge-danger' :
                        'badge-warning'
                      }`}>
                        {ride.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Ride ID</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {ride.id.substring(0, 8)}...
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Route */}
                  <div className="flex items-start space-x-3">
                    <MapPin className="text-blue-400 flex-shrink-0 mt-1" size={18} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <p className="font-medium">{ride.start_location_name}</p>
                      </div>
                      <div className="ml-3 border-l-2 border-dashed border-white/20 h-4"></div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        <p className="font-medium">{ride.end_location_name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-white/10">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Date & Time</p>
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} className="text-gray-500" />
                        <p className="text-sm font-medium">
                          {new Date(ride.departure_time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Vehicle</p>
                      <p className="text-sm font-medium capitalize">{ride.vehicle_type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Seats</p>
                      <p className="text-sm font-medium">
                        {ride.total_seats - ride.available_seats} / {ride.total_seats}
                      </p>
                    </div>
                    {ride.estimated_fare && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Fare</p>
                        <p className="text-sm font-medium text-green-400">
                          {formatINR(ride.estimated_fare)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Parking Tab */}
      {activeTab === 'parking' && (
        <div className="space-y-4">
          {parkingReservations.length === 0 ? (
            <div className="glass-card p-12 text-center slide-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <ParkingSquare className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-400 mb-2">No parking history yet</p>
              <p className="text-sm text-gray-500">Reserve a parking spot to see your history</p>
            </div>
          ) : (
            parkingReservations.map((reservation: any, index: number) => (
              <div
                key={reservation.id}
                className="glass-card p-6 hover:scale-102 transition-all slide-in-up"
                style={{ animationDelay: `${0.2 + index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${
                      reservation.status === 'completed' ? 'from-green-500 to-emerald-500' :
                      reservation.status === 'active' ? 'from-blue-500 to-cyan-500' :
                      reservation.status === 'cancelled' ? 'from-pink-500 to-red-500' :
                      'from-orange-500 to-yellow-500'
                    } rounded-xl flex items-center justify-center`}>
                      <ParkingSquare size={24} />
                    </div>
                    <div>
                      <span className={`badge ${
                        reservation.status === 'completed' ? 'badge-success' :
                        reservation.status === 'active' ? 'badge-info' :
                        reservation.status === 'cancelled' ? 'badge-danger' :
                        'badge-warning'
                      }`}>
                        {reservation.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Reservation ID</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {reservation.id.substring(0, 8)}...
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Parking Lot</p>
                      <p className="text-sm font-medium">{reservation.parking_lot_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Spot</p>
                      <p className="text-sm font-medium">#{reservation.parking_spot_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Duration</p>
                      <div className="flex items-center space-x-1">
                        <Clock size={14} className="text-gray-500" />
                        <p className="text-sm font-medium">
                          {Math.round(
                            (new Date(reservation.end_time).getTime() -
                              new Date(reservation.start_time).getTime()) /
                              (1000 * 60 * 60)
                          )}h
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Cost</p>
                      <div className="flex items-center space-x-1">
                        <DollarSign size={14} className="text-green-400" />
                        <p className="text-sm font-medium text-green-400">
                          {reservation.amount_paid}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Start</p>
                        <p className="font-medium">
                          {new Date(reservation.start_time).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-xs mb-1">End</p>
                        <p className="font-medium">
                          {new Date(reservation.end_time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 slide-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="glass-card p-6">
          <p className="text-gray-400 text-sm mb-2">Total Rides</p>
          <p className="text-3xl font-bold text-blue-400">{rides.length}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-gray-400 text-sm mb-2">Total Parking Sessions</p>
          <p className="text-3xl font-bold text-green-400">{parkingReservations.length}</p>
        </div>
        <div className="glass-card p-6">
          <p className="text-gray-400 text-sm mb-2">Total Activities</p>
          <p className="text-3xl font-bold text-pink-400">
            {rides.length + parkingReservations.length}
          </p>
        </div>
      </div>
    </div>
  );
}
