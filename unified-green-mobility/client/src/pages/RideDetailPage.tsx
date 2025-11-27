'use client';

import { useState, useEffect } from 'react';
import { MapPin, Calendar, Clock, Users, Car, Shield, CheckCircle, X, Navigation, AlertTriangle } from 'lucide-react';
import type { AppContextType } from '@/types/AppContext';
import { formatINR } from '@/utils/currency';
import SOSButton from '@/components/SOSButton';

interface Ride {
  id: string;
  driver_id: string;
  driver_name?: string;
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  departure_time: string;
  car_brand: string;
  car_model: string;
  car_category: string;
  total_seats: number;
  available_seats: number;
  status: string;
  distance_km?: number;
  co2_emitted_kg?: number;
  estimated_fare?: number;
}

interface Passenger {
  id: string;
  passenger_id: string;
  passenger_name?: string;
  status: string;
  otp_code?: string;
  otp_verified: boolean;
  payment_status: string;
  fare_amount_inr?: number;
}

interface RideLocation {
  lat: number;
  lng: number;
  timestamp: string;
}

type RideDetailPageProps = {
  context: AppContextType;
  rideId: string;
};

export function RideDetailPage({ context, rideId }: RideDetailPageProps) {
  const [ride, setRide] = useState<Ride | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [currentLocation, setCurrentLocation] = useState<RideLocation | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState<{ [key: string]: string }>({});
  const [verifying, setVerifying] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
  const isDriver = ride?.driver_id === context.user?.id;

  useEffect(() => {
    fetchRideDetails();
    if (ride?.status === 'ongoing') {
      const interval = setInterval(() => {
        fetchRideLocation();
        fetchETA();
      }, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [rideId, ride?.status]);

  const fetchRideDetails = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/rides/${rideId}`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRide(data);
        if (data.passengers) {
          setPassengers(data.passengers);
        }
      }
    } catch (error) {
      console.error('Error fetching ride details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRideLocation = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/rides/${rideId}/location`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });

      if (response.ok) {
        const locations = await response.json();
        if (locations.length > 0) {
          setCurrentLocation(locations[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching ride location:', error);
    }
  };

  const fetchETA = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/rides/${rideId}/eta`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEta(data.eta_minutes);
      }
    } catch (error) {
      console.error('Error fetching ETA:', error);
    }
  };

  const handleVerifyOTP = async (passengerId: string) => {
    const otp = otpInput[passengerId];
    if (!otp) {
      alert('Please enter OTP');
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch(`${apiBaseUrl}/rides/${rideId}/passengers/${passengerId}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`,
        },
        body: JSON.stringify({ otp }),
      });

      if (response.ok) {
        await fetchRideDetails();
        setOtpInput({ ...otpInput, [passengerId]: '' });
      } else {
        const error = await response.json();
        alert(error.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert('Failed to verify OTP');
    } finally {
      setVerifying(false);
    }
  };

  const handleStartRide = async () => {
    if (!confirm('Start the ride? All passengers must have verified OTP.')) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/rides/${rideId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });

      if (response.ok) {
        await fetchRideDetails();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to start ride');
      }
    } catch (error) {
      console.error('Error starting ride:', error);
      alert('Failed to start ride');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteRide = async () => {
    if (!confirm('Complete the ride? This will calculate distance, CO₂, and award points.')) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/rides/${rideId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });

      if (response.ok) {
        await fetchRideDetails();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to complete ride');
      }
    } catch (error) {
      console.error('Error completing ride:', error);
      alert('Failed to complete ride');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPayment = async (passengerId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/rides/${rideId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`,
        },
        body: JSON.stringify({ passenger_id: passengerId }),
      });

      if (response.ok) {
        await fetchRideDetails();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to mark payment');
      }
    } catch (error) {
      console.error('Error marking payment:', error);
      alert('Failed to mark payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async (passengerId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/rides/${rideId}/confirm-payment/${passengerId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });

      if (response.ok) {
        await fetchRideDetails();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to confirm payment');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Failed to confirm payment');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">Ride not found</p>
          <button onClick={() => window.history.back()} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const allPassengersVerified = passengers
    .filter(p => p.status === 'accepted')
    .every(p => p.otp_verified);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 slide-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 gradient-text">Ride Details</h1>
            <p className="text-gray-400">Manage your carpool ride</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`badge ${
              ride.status === 'upcoming' ? 'badge-info' :
              ride.status === 'ongoing' ? 'badge-warning' :
              ride.status === 'completed' ? 'badge-success' :
              'badge-secondary'
            }`}>
              {ride.status}
            </span>
            {ride.status === 'ongoing' && <SOSButton rideId={rideId} context={context} />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route Info */}
          <div className="glass-card p-6 slide-in-up">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Navigation className="mr-2 text-blue-400" size={20} />
              Route
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-bold">{ride.origin_name}</p>
                  <p className="text-sm text-gray-400">
                    {ride.origin_lat.toFixed(4)}, {ride.origin_lng.toFixed(4)}
                  </p>
                </div>
              </div>
              <div className="ml-1 border-l-2 border-dashed border-white/20 h-8"></div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                <div>
                  <p className="font-bold">{ride.destination_name}</p>
                  <p className="text-sm text-gray-400">
                    {ride.destination_lat.toFixed(4)}, {ride.destination_lng.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>

            {ride.distance_km && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-400">Distance</p>
                    <p className="text-lg font-bold text-green-400">{ride.distance_km.toFixed(1)} km</p>
                  </div>
                  {ride.co2_emitted_kg && (
                    <div>
                      <p className="text-sm text-gray-400">CO₂ Emitted</p>
                      <p className="text-lg font-bold text-blue-400">{ride.co2_emitted_kg.toFixed(2)} kg</p>
                    </div>
                  )}
                  {eta !== null && (
                    <div>
                      <p className="text-sm text-gray-400">ETA</p>
                      <p className="text-lg font-bold text-orange-400">{eta} min</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Passengers */}
          <div className="glass-card p-6 slide-in-up">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Users className="mr-2 text-pink-400" size={20} />
              Passengers ({passengers.filter(p => p.status === 'accepted').length} / {ride.total_seats - 1})
            </h2>
            <div className="space-y-4">
              {passengers.map((passenger) => (
                <div
                  key={passenger.id}
                  className="p-4 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold">{passenger.passenger_name || 'Passenger'}</p>
                      <p className="text-sm text-gray-400">
                        Status: <span className={`badge ${
                          passenger.status === 'accepted' ? 'badge-success' :
                          passenger.status === 'requested' ? 'badge-warning' :
                          'badge-secondary'
                        }`}>{passenger.status}</span>
                      </p>
                    </div>
                    {passenger.fare_amount_inr && (
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Fare</p>
                        <p className="text-lg font-bold text-green-400">
                          {formatINR(passenger.fare_amount_inr)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* OTP Verification (Driver only) */}
                  {isDriver && passenger.status === 'accepted' && !passenger.otp_verified && (
                    <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-sm text-yellow-400 mb-2">Verify OTP at pickup:</p>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={otpInput[passenger.id] || ''}
                          onChange={(e) => setOtpInput({ ...otpInput, [passenger.id]: e.target.value })}
                          className="input-field flex-1"
                          placeholder="Enter OTP"
                          maxLength={6}
                        />
                        <button
                          onClick={() => handleVerifyOTP(passenger.id)}
                          disabled={verifying}
                          className="btn-primary px-4"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  )}

                  {passenger.otp_verified && (
                    <div className="mt-2 flex items-center text-green-400 text-sm">
                      <CheckCircle size={16} className="mr-2" />
                      OTP Verified
                    </div>
                  )}

                  {/* Payment Status */}
                  {passenger.payment_status === 'pending' && passenger.fare_amount_inr && (
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm text-gray-400">
                        Payment: <span className="text-orange-400">Pending</span>
                      </p>
                      {!isDriver && (
                        <button
                          onClick={() => handleMarkPayment(passenger.id)}
                          disabled={actionLoading}
                          className="btn-primary text-sm px-4 py-2"
                        >
                          Mark as Paid
                        </button>
                      )}
                      {isDriver && (
                        <button
                          onClick={() => handleConfirmPayment(passenger.id)}
                          disabled={actionLoading}
                          className="btn-secondary text-sm px-4 py-2"
                        >
                          Confirm Payment
                        </button>
                      )}
                    </div>
                  )}

                  {passenger.payment_status === 'confirmed' && (
                    <div className="mt-2 flex items-center text-green-400 text-sm">
                      <CheckCircle size={16} className="mr-2" />
                      Payment Confirmed
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ride Info */}
          <div className="glass-card p-6 slide-in-up">
            <h3 className="font-bold mb-4">Ride Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Departure</p>
                <p className="font-medium">
                  {new Date(ride.departure_time).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Vehicle</p>
                <p className="font-medium">
                  {ride.car_brand} {ride.car_model} ({ride.car_category})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Seats</p>
                <p className="font-medium">
                  {ride.available_seats} available / {ride.total_seats} total
                </p>
              </div>
              {ride.estimated_fare && (
                <div>
                  <p className="text-sm text-gray-400">Estimated Fare</p>
                  <p className="font-medium text-green-400">
                    {formatINR(ride.estimated_fare)} per passenger
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions (Driver only) */}
          {isDriver && (
            <div className="glass-card p-6 slide-in-up">
              <h3 className="font-bold mb-4">Actions</h3>
              <div className="space-y-3">
                {ride.status === 'upcoming' && (
                  <button
                    onClick={handleStartRide}
                    disabled={!allPassengersVerified || actionLoading}
                    className="w-full btn-primary disabled:opacity-50"
                  >
                    {!allPassengersVerified
                      ? 'Verify All Passengers First'
                      : actionLoading
                      ? 'Starting...'
                      : 'Start Ride'}
                  </button>
                )}

                {ride.status === 'ongoing' && (
                  <button
                    onClick={handleCompleteRide}
                    disabled={actionLoading}
                    className="w-full btn-primary disabled:opacity-50"
                  >
                    {actionLoading ? 'Completing...' : 'Complete Ride'}
                  </button>
                )}

                {ride.status === 'completed' && passengers.every(p => p.payment_status === 'confirmed') && (
                  <button
                    onClick={async () => {
                      const response = await fetch(`${apiBaseUrl}/rides/${rideId}/close`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${context.accessToken}`,
                        },
                      });
                      if (response.ok) {
                        await fetchRideDetails();
                      }
                    }}
                    className="w-full btn-secondary"
                  >
                    Close Ride
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

