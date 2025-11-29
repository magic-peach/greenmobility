import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Users, Car, Bike, Zap } from 'lucide-react';
import { formatINR } from '@/utils/currency';
import type { AppContextType } from '@/types/AppContext';
import { projectId } from '@/utils/supabase/info';
import { TermsAndConditionsDialog } from '@/components/rides/TermsAndConditionsDialog';

type RideSearchPageProps = {
  context: AppContextType;
};

type Ride = {
  id: string;
  driver_id: string;
  start_location_name: string;
  end_location_name: string;
  departure_time: string;
  vehicle_type: string;
  available_seats: number;
  estimated_fare?: number;
  status: string;
};

export function RideSearchPage({ context }: RideSearchPageProps) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [rideToJoin, setRideToJoin] = useState<Ride | null>(null);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1659ed12/rides/search`,
        {
          headers: {
            'Authorization': `Bearer ${context.accessToken}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setRides(data);
      }
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchRides();
  };

  const handleJoinRide = (ride: Ride) => {
    // Show terms dialog first
    setRideToJoin(ride);
    setShowTermsDialog(true);
  };

  const handleAcceptTerms = async () => {
    if (!rideToJoin) return;

    setJoinLoading(true);
    setShowTermsDialog(false);
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1659ed12/rides/${rideToJoin.id}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.accessToken}`,
          },
          body: JSON.stringify({
            pickup_location_name: rideToJoin.start_location_name,
            pickup_lat: 0,
            pickup_lng: 0,
            drop_location_name: rideToJoin.end_location_name,
            drop_lat: 0,
            drop_lng: 0,
            distance_km: 0,
            fare_share: rideToJoin.estimated_fare || 0,
            // Explicitly signal that the user has accepted the Terms & Conditions.
            // The backend edge function might be expecting one of several flag names,
            // so we send a few safe variants (it will ignore the extras it doesn't use).
            accepted_terms: true,
            acceptedTerms: true,
            accepted_terms_and_conditions: true,
            accepted_tnc: true,
          }),
        }
      );

      if (response.ok) {
        alert('Ride request sent successfully!');
        setSelectedRide(null);
        setRideToJoin(null);
        fetchRides();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to join ride');
      }
    } catch (error) {
      console.error('Error joining ride:', error);
      alert('Failed to join ride');
    } finally {
      setJoinLoading(false);
      setRideToJoin(null);
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'bike':
        return <Bike size={20} />;
      case 'scooter':
        return <Zap size={20} />;
      default:
        return <Car size={20} />;
    }
  };

  const getVehicleColor = (type: string) => {
    switch (type) {
      case 'bike':
        return 'from-green-500 to-emerald-500';
      case 'scooter':
        return 'from-orange-500 to-yellow-500';
      default:
        return 'from-blue-500 to-cyan-500';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 slide-in-up">
        <h1 className="text-4xl font-bold mb-2 gradient-text">Find Your Perfect Ride</h1>
        <p className="text-gray-400">Share journeys, save money, reduce emissions</p>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-6 mb-8 slide-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">From</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchParams.from}
                onChange={(e) => setSearchParams({ ...searchParams, from: e.target.value })}
                className="input-field pl-12"
                placeholder="Starting location"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">To</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchParams.to}
                onChange={(e) => setSearchParams({ ...searchParams, to: e.target.value })}
                className="input-field pl-12"
                placeholder="Destination"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Date</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={searchParams.date}
                onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                className="input-field pl-12"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50"
            >
              <Search size={18} className="inline mr-2" />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rides.length === 0 ? (
            <div className="glass-card p-12 text-center slide-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-400 mb-2">No rides found</p>
              <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
            </div>
          ) : (
            rides.map((ride, index) => (
              <div
                key={ride.id}
                className="glass-card p-6 hover:scale-102 transition-all cursor-pointer slide-in-up"
                style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                onClick={() => setSelectedRide(ride)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Vehicle Icon */}
                    <div className={`w-16 h-16 bg-gradient-to-br ${getVehicleColor(ride.vehicle_type)} rounded-xl flex items-center justify-center float-animation`}>
                      {getVehicleIcon(ride.vehicle_type)}
                    </div>

                    {/* Route Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <p className="font-bold text-lg">{ride.start_location_name}</p>
                        <div className="flex-1 border-t-2 border-dashed border-white/20"></div>
                        <p className="font-bold text-lg">{ride.end_location_name}</p>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {new Date(ride.departure_time).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Users size={14} className="mr-1" />
                          {ride.available_seats} seats
                        </span>
                        <span className="badge badge-success capitalize">
                          {ride.vehicle_type}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    {ride.estimated_fare && (
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Estimated</p>
                        <p className="text-2xl font-bold text-green-400">
                          {formatINR(ride.estimated_fare)}
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinRide(ride);
                      }}
                      disabled={joinLoading}
                      className="btn-primary disabled:opacity-50"
                    >
                      Join Ride
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Ride Detail Modal */}
      {selectedRide && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedRide(null)}
        >
          <div
            className="glass-card p-8 max-w-2xl w-full slide-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6">Ride Details</h2>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Route</p>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <p className="font-bold">{selectedRide.start_location_name}</p>
                </div>
                <div className="ml-1 border-l-2 border-dashed border-white/20 h-8"></div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                  <p className="font-bold">{selectedRide.end_location_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Departure Time</p>
                  <p className="font-medium">
                    {new Date(selectedRide.departure_time).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Available Seats</p>
                  <p className="font-medium">{selectedRide.available_seats}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Vehicle Type</p>
                  <p className="font-medium capitalize">{selectedRide.vehicle_type}</p>
                </div>
                {selectedRide.estimated_fare && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Fare Share</p>
                    <p className="font-medium text-green-400">
                      {formatINR(selectedRide.estimated_fare)}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleJoinRide(selectedRide)}
                  disabled={joinLoading}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {joinLoading ? 'Joining...' : 'Join This Ride'}
                </button>
                <button
                  onClick={() => setSelectedRide(null)}
                  className="flex-1 btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms and Conditions Dialog */}
      <TermsAndConditionsDialog
        isOpen={showTermsDialog}
        onClose={() => {
          setShowTermsDialog(false);
          setRideToJoin(null);
        }}
        onAccept={handleAcceptTerms}
        isLoading={joinLoading}
      />

      {/* Floating 3D Element */}
      <div className="fixed bottom-20 left-10 pointer-events-none hidden lg:block">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 to-blue-500/30 rounded-2xl rotate-45 float-animation blur-xl"></div>
        </div>
      </div>
    </div>
  );
}
