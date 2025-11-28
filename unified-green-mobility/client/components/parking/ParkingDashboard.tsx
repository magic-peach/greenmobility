'use client';

/**
 * ParkingDashboard Component
 * 
 * Complete parking dashboard with:
 * - MapTiler map (left)
 * - Parking lot list (bottom-left)
 * - Stats card (right)
 * - Spot grid (bottom-right)
 */

import { useState, useEffect } from 'react';
import { MapPin, Zap, Accessibility, Calendar, Clock } from 'lucide-react';
import ParkingMap from './ParkingMap';
import PaymentModal from './PaymentModal';
import type { AppContextType } from '@/types/AppContext';

interface ParkingLot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  total_spots: number;
  has_ev_charging?: boolean;
}

interface ParkingSpot {
  id: string;
  parking_lot_id: string;
  spot_number: number;
  is_ev_friendly: boolean;
  is_accessible: boolean;
  status: 'available' | 'occupied' | 'reserved';
}

interface ParkingStats {
  available: number;
  occupied: number;
  reserved: number;
}

interface ParkingDashboardProps {
  context: AppContextType;
}

export default function ParkingDashboard({ context }: ParkingDashboardProps) {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [stats, setStats] = useState<ParkingStats>({ available: 0, occupied: 0, reserved: 0 });
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [reservationTime, setReservationTime] = useState({
    start: '',
    end: '',
  });
  const [myReservations, setMyReservations] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingReservation, setPendingReservation] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchParkingLots();
  }, []);

  useEffect(() => {
    if (selectedLot) {
      fetchSpots(selectedLot.id);
    }
  }, [selectedLot]);

  useEffect(() => {
    fetchMyReservations();
    // Auto-refresh every 10 seconds to update statuses
    const interval = setInterval(() => {
      if (selectedLot) {
        fetchSpots(selectedLot.id);
      }
      fetchMyReservations();
    }, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [selectedLot]);

  useEffect(() => {
    if (spots.length > 0) {
      calculateStats();
    }
  }, [spots]);

  const fetchParkingLots = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/parking/lots`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched parking lots:', data.length, data);
        setParkingLots(Array.isArray(data) ? data : []);
        const lotsArray = Array.isArray(data) ? data : [];
        // Always select the first lot if available and none is selected
        if (lotsArray.length > 0) {
          if (!selectedLot) {
            console.log('Auto-selecting first parking lot:', lotsArray[0].name);
            setSelectedLot(lotsArray[0]);
          }
        } else {
          console.warn('No parking lots found in response');
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch parking lots:', response.status, errorText);
        setParkingLots([]);
      }
    } catch (error) {
      console.error('Error fetching parking lots:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpots = async (lotId: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/parking/lots/${lotId}/spots`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Backend returns array of spots
        const spotsArray = Array.isArray(data) ? data : (data.spots || []);
        // Ensure all spots have a status field (default to 'available' if missing)
        const spotsWithStatus = spotsArray.map((spot: any) => ({
          ...spot,
          status: spot.status || 'available',
        }));
        console.log('Fetched spots:', spotsWithStatus.length, 'spots with statuses');
        setSpots(spotsWithStatus);
      } else {
        console.error('Failed to fetch spots:', response.status);
        setSpots([]); // Set to empty array on error
      }
    } catch (error) {
      console.error('Error fetching spots:', error);
      setSpots([]); // Set to empty array on error
    }
  };

  const calculateStats = () => {
    const available = spots.filter(s => s.status === 'available').length;
    const occupied = spots.filter(s => s.status === 'occupied').length;
    const reserved = spots.filter(s => s.status === 'reserved').length;
    setStats({ available, occupied, reserved });
  };

  const handleSpotClick = (spot: ParkingSpot) => {
    if (spot.status === 'available') {
      setSelectedSpot(spot);
      // Set default times (now + 1 hour, now + 3 hours)
      const now = new Date();
      const start = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
      const end = new Date(now.getTime() + 3 * 60 * 60 * 1000); // +3 hours
      setReservationTime({
        start: start.toISOString().slice(0, 16),
        end: end.toISOString().slice(0, 16),
      });
    } else if (spot.status === 'reserved') {
      // Check if user can cancel (would need to check reservation ownership)
      // For now, just show info
      alert('This spot is already reserved');
    }
  };

  const handleReserve = async () => {
    if (!selectedSpot || !selectedLot || !reservationTime.start || !reservationTime.end) return;

    // Validate that end time is after start time
    const start = new Date(reservationTime.start);
    let end = new Date(reservationTime.end);
    
    // Handle case where end time appears to be before start (likely next day)
    if (end < start) {
      // Check if end time is very early (before 6 AM) and start is late (after 6 PM)
      // This likely means end is next day
      if (end.getHours() < 6 && start.getHours() >= 18) {
        end.setDate(end.getDate() + 1);
      } else {
        alert('End time must be after start time. Please select a valid time range.');
        return;
      }
    }

    // Ensure minimum 1 hour duration
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (hours < 1) {
      alert('Minimum reservation duration is 1 hour.');
      return;
    }

    setReserving(true);
    try {
      const response = await fetch(`${apiBaseUrl}/parking/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`,
        },
        body: JSON.stringify({
          parking_spot_id: selectedSpot.id,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        }),
      });

      if (response.ok) {
        const reservation = await response.json();
        // Calculate payment amount (using validated times)
        const start = new Date(reservationTime.start);
        let end = new Date(reservationTime.end);
        if (end < start) {
          end.setDate(end.getDate() + 1);
        }
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        const amount = Math.max(20, Math.ceil(hours * 20)); // Minimum ₹20, ₹20 per hour
        
        // Show payment modal
        setPendingReservation(reservation);
        setPaymentAmount(amount);
        setShowPaymentModal(true);
        setSelectedSpot(null);
        
        // Immediately refresh spots to show updated status
        if (selectedLot) {
          setTimeout(() => {
            fetchSpots(selectedLot.id);
          }, 300);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reserve spot');
      }
    } catch (error) {
      console.error('Error reserving spot:', error);
      alert('Failed to reserve spot');
    } finally {
      setReserving(false);
    }
  };

  const fetchMyReservations = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/parking/reservations/my`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMyReservations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const handlePaymentSuccess = async (paymentMethod: string, transactionId: string) => {
    if (!pendingReservation) return;

    try {
      // Update reservation with payment info
      const response = await fetch(`${apiBaseUrl}/parking/reservations/${pendingReservation.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`,
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
          transaction_id: transactionId,
          amount: paymentAmount,
        }),
      });

      if (response.ok) {
        // Refresh spots and reservations
        if (selectedLot) {
          // Add a small delay to ensure backend has updated
          setTimeout(() => {
            fetchSpots(selectedLot.id);
          }, 500);
        }
        fetchMyReservations();
        setPendingReservation(null);
        alert('Payment confirmed! Your reservation is active.');
      } else {
        const error = await response.json();
        console.error('Failed to update payment info:', error);
        alert(error.error || 'Failed to confirm payment');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const handleCompleteReservation = async (reservationId: string) => {
    if (!confirm('Mark this parking reservation as completed?')) return;

    setRefreshing(true);
    try {
      const response = await fetch(`${apiBaseUrl}/parking/reservations/${reservationId}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });

      if (response.ok) {
        alert('Parking reservation completed! Spot is now available.');
        if (selectedLot) {
          fetchSpots(selectedLot.id);
        }
        fetchMyReservations();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to complete reservation');
      }
    } catch (error) {
      console.error('Error completing reservation:', error);
      alert('Failed to complete reservation');
    } finally {
      setRefreshing(false);
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
        <h1 className="text-4xl font-bold mb-2 gradient-text">Smart Parking - Mumbai</h1>
        <p className="text-gray-400">Find and reserve parking spots at major locations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Map & Lot List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          <div className="glass-card p-6 slide-in-up">
            <ParkingMap
              lots={parkingLots}
              selectedLotId={selectedLot?.id || null}
              onLotSelect={setSelectedLot}
              height="500px"
            />
          </div>

          {/* Parking Lots List */}
          <div className="space-y-4 slide-in-up">
            <h2 className="text-xl font-bold mb-4">Parking Locations</h2>
            {loading ? (
              <div className="text-center py-8 text-gray-400">
                <p>Loading parking locations...</p>
              </div>
            ) : parkingLots.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No parking locations available</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {parkingLots.map((lot) => (
                  <button
                    key={lot.id}
                    onClick={() => {
                      console.log('Selecting parking lot:', lot.name);
                      setSelectedLot(lot);
                    }}
                    className={`w-full glass-card p-4 text-left transition-all hover:scale-105 ${
                      selectedLot?.id === lot.id ? 'border-2 border-blue-500 neon-glow-blue' : 'border border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                          <MapPin size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{lot.name}</p>
                          <p className="text-sm text-gray-400 flex items-center">
                            <MapPin size={14} className="mr-1" />
                            {lot.address}
                          </p>
                          {lot.has_ev_charging && (
                            <p className="text-xs text-yellow-400 mt-1 flex items-center">
                              <Zap size={12} className="mr-1" />
                              EV Charging Available
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Total Spots</p>
                        <p className="text-2xl font-bold text-green-400">{lot.total_spots}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Stats & Spot Grid */}
        <div className="space-y-6">
          {/* Stats Card */}
          {selectedLot && (
            <div className="glass-card p-6 slide-in-up">
              <h2 className="text-xl font-bold mb-4">{selectedLot.name}</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                  <span className="text-sm text-gray-300">Available</span>
                  <span className="font-bold text-green-400 text-xl">{stats.available}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-pink-500/10 rounded-lg border border-pink-500/30">
                  <span className="text-sm text-gray-300">Occupied</span>
                  <span className="font-bold text-pink-400 text-xl">{stats.occupied}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                  <span className="text-sm text-gray-300">Reserved</span>
                  <span className="font-bold text-orange-400 text-xl">{stats.reserved}</span>
                </div>
              </div>
            </div>
          )}

          {/* Spot Grid */}
          {selectedLot && (
            <div className="glass-card p-6 slide-in-up">
              <h3 className="font-bold mb-4">Select a Spot</h3>
              <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto">
                {Array.isArray(spots) && spots.length > 0 ? spots.map((spot) => {
                  const spotStatus = spot.status || 'available';
                  return (
                    <button
                      key={spot.id}
                      onClick={() => handleSpotClick(spot)}
                      disabled={spotStatus !== 'available'}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all ${
                        selectedSpot?.id === spot.id
                          ? 'bg-blue-500 neon-glow-blue'
                          : spotStatus === 'available'
                          ? 'bg-green-500/20 hover:bg-green-500/40 border border-green-500/50'
                          : spotStatus === 'occupied'
                          ? 'bg-pink-500/20 border border-pink-500/30 cursor-not-allowed opacity-60'
                          : spotStatus === 'reserved'
                          ? 'bg-orange-500/20 border border-orange-500/30 cursor-not-allowed opacity-60'
                          : 'bg-gray-500/20 border border-gray-500/30 cursor-not-allowed opacity-60'
                      }`}
                      title={`Spot ${spot.spot_number} - ${spotStatus}`}
                    >
                      <span className="font-bold">{spot.spot_number}</span>
                      <div className="flex space-x-1 mt-1">
                        {spot.is_ev_friendly && <Zap size={10} className="text-yellow-400" />}
                        {spot.is_accessible && <Accessibility size={10} className="text-blue-400" />}
                      </div>
                    </button>
                  );
                }) : (
                  <div className="col-span-5 text-center py-8 text-gray-400">
                    {Array.isArray(spots) && spots.length === 0 
                      ? 'No spots available for this parking lot'
                      : 'Loading spots...'}
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-1">
                  <Zap size={12} className="text-yellow-400" />
                  <span>EV</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Accessibility size={12} className="text-blue-400" />
                  <span>Accessible</span>
                </div>
              </div>
            </div>
          )}

          {/* Reservation Form - Always visible when lot is selected */}
          {selectedLot ? (
            <div className="glass-card p-6 slide-in-up border-2 border-blue-500/30">
              <h3 className="font-bold mb-4 text-xl">Reserve Parking</h3>
              {selectedSpot ? (
                <>
                  <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <p className="text-sm text-gray-300">Selected Spot</p>
                    <p className="text-lg font-bold text-blue-400">Spot #{selectedSpot.spot_number}</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Start Time</label>
                      <input
                        type="datetime-local"
                        value={reservationTime.start}
                        onChange={(e) => setReservationTime({ ...reservationTime, start: e.target.value })}
                        className="input-field w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">End Time</label>
                      <input
                        type="datetime-local"
                        value={reservationTime.end}
                        onChange={(e) => setReservationTime({ ...reservationTime, end: e.target.value })}
                        className="input-field w-full"
                        required
                      />
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">Estimated Cost</span>
                        <span className="text-2xl font-bold text-blue-400">
                          ₹{(() => {
                            if (!reservationTime.start || !reservationTime.end) return 0;
                            const start = new Date(reservationTime.start);
                            const end = new Date(reservationTime.end);
                            // Handle case where end time is on next day (e.g., 12:03 AM after 6:01 PM)
                            if (end < start) {
                              // End time is before start time, likely means it's next day
                              end.setDate(end.getDate() + 1);
                            }
                            const hours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
                            return Math.ceil(hours * 20);
                          })()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">₹20 per hour</p>
                      {reservationTime.start && reservationTime.end && new Date(reservationTime.end) < new Date(reservationTime.start) && (
                        <p className="text-xs text-red-400 mt-2">⚠️ End time must be after start time</p>
                      )}
                    </div>
                    <button
                      onClick={handleReserve}
                      disabled={reserving || !reservationTime.start || !reservationTime.end}
                      className="w-full btn-primary disabled:opacity-50"
                    >
                      {reserving ? 'Reserving...' : 'Reserve Spot'}
                    </button>
                    <button
                      onClick={() => setSelectedSpot(null)}
                      className="w-full btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-300 mb-4 font-medium">Select an available spot from the grid above to reserve</p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-400 mb-4">
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-green-500/20 border border-green-500/50 rounded"></div>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-pink-500/20 border border-pink-500/30 rounded"></div>
                      <span>Occupied</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-orange-500/20 border border-orange-500/30 rounded"></div>
                      <span>Reserved</span>
                    </div>
                  </div>
                  {selectedLot && (
                    <p className="text-xs text-gray-500">Parking Lot: <span className="text-blue-400">{selectedLot.name}</span></p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-6 slide-in-up">
              <div className="text-center py-8">
                <p className="text-gray-400 mb-2">Select a parking location to begin</p>
                <p className="text-sm text-gray-500">Choose from the list below or click on the map</p>
              </div>
            </div>
          )}

          {/* My Active Reservations */}
          {myReservations.filter((r: any) => r.status === 'upcoming' || r.status === 'active').length > 0 && (
            <div className="glass-card p-6 slide-in-up">
              <h3 className="font-bold mb-4 flex items-center">
                <Calendar className="mr-2 text-blue-400" size={20} />
                My Active Reservations
              </h3>
              <div className="space-y-3">
                {myReservations
                  .filter((r: any) => r.status === 'upcoming' || r.status === 'active')
                  .map((reservation: any) => (
                    <div
                      key={reservation.id}
                      className="p-4 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">
                            Spot #{reservation.parking_spot?.spot_number || 'N/A'} - {reservation.parking_spot?.parking_lot?.name || 'Unknown Lot'}
                          </p>
                          <p className="text-sm text-gray-400 mt-1 flex items-center">
                            <Clock size={14} className="mr-1" />
                            {new Date(reservation.start_time).toLocaleString()} - {new Date(reservation.end_time).toLocaleString()}
                          </p>
                          <span className={`badge mt-2 ${
                            reservation.status === 'active' ? 'badge-warning' : 'badge-info'
                          }`}>
                            {reservation.status}
                          </span>
                        </div>
                        {(reservation.status === 'active' || (new Date(reservation.start_time) <= new Date() && reservation.status === 'upcoming')) && (
                          <button
                            onClick={() => handleCompleteReservation(reservation.id)}
                            disabled={refreshing}
                            className="btn-primary btn-sm ml-3"
                          >
                            {refreshing ? '...' : 'Complete'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPendingReservation(null);
        }}
        amount={paymentAmount}
        reservationId={pendingReservation?.id}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

