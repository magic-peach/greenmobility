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
        setParkingLots(data);
        if (data.length > 0 && !selectedLot) {
          setSelectedLot(data[0]);
        }
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
        setSpots(data);
      }
    } catch (error) {
      console.error('Error fetching spots:', error);
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
          start_time: new Date(reservationTime.start).toISOString(),
          end_time: new Date(reservationTime.end).toISOString(),
        }),
      });

      if (response.ok) {
        alert('Parking spot reserved successfully!');
        setSelectedSpot(null);
        fetchSpots(selectedLot.id);
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
            <h2 className="text-xl font-bold">Parking Locations</h2>
            {parkingLots.map((lot) => (
              <button
                key={lot.id}
                onClick={() => setSelectedLot(lot)}
                className={`w-full glass-card p-6 text-left transition-all ${
                  selectedLot?.id === lot.id ? 'border-blue-500 neon-glow-blue' : ''
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
                {spots.map((spot) => (
                  <button
                    key={spot.id}
                    onClick={() => handleSpotClick(spot)}
                    disabled={spot.status !== 'available'}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all ${
                      selectedSpot?.id === spot.id
                        ? 'bg-blue-500 neon-glow-blue'
                        : spot.status === 'available'
                        ? 'bg-green-500/20 hover:bg-green-500/40 border border-green-500/50'
                        : spot.status === 'occupied'
                        ? 'bg-pink-500/20 border border-pink-500/30 cursor-not-allowed opacity-60'
                        : 'bg-orange-500/20 border border-orange-500/30 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span className="font-bold">{spot.spot_number}</span>
                    <div className="flex space-x-1 mt-1">
                      {spot.is_ev_friendly && <Zap size={10} className="text-yellow-400" />}
                      {spot.is_accessible && <Accessibility size={10} className="text-blue-400" />}
                    </div>
                  </button>
                ))}
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

          {/* Reservation Form */}
          {selectedSpot && (
            <div className="glass-card p-6 slide-in-up">
              <h3 className="font-bold mb-4">Reserve Spot #{selectedSpot.spot_number}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    value={reservationTime.start}
                    onChange={(e) => setReservationTime({ ...reservationTime, start: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    value={reservationTime.end}
                    onChange={(e) => setReservationTime({ ...reservationTime, end: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Estimated Cost</span>
                    <span className="text-2xl font-bold text-blue-400">
                      ₹{Math.ceil((new Date(reservationTime.end).getTime() - new Date(reservationTime.start).getTime()) / (1000 * 60 * 60) * 20)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">₹20 per hour</p>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

