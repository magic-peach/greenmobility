import { useState, useEffect } from 'react';
import { MapPin, ParkingSquare, Zap, Accessibility, Calendar, Clock, Search } from 'lucide-react';
import type { AppContextType } from '@/types/AppContext';
import { projectId } from '@/utils/supabase/info';

type ParkingMapPageProps = {
  context: AppContextType;
};

type ParkingLot = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  total_spots: number;
  created_at: string;
};

type ParkingSpot = {
  id: string;
  parking_lot_id: string;
  spot_number: string;
  level: number;
  is_ev_friendly: boolean;
  is_disabled_friendly: boolean;
  status: string;
};

export function ParkingMapPage({ context }: ParkingMapPageProps) {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [reservationData, setReservationData] = useState({
    start_time: '',
    end_time: '',
    amount_paid: 5,
  });
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    fetchParkingLots();
  }, []);

  useEffect(() => {
    if (selectedLot) {
      fetchSpots(selectedLot.id);
    }
  }, [selectedLot]);

  const fetchParkingLots = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1659ed12/parking/lots`,
        {
          headers: {
            'Authorization': `Bearer ${context.accessToken}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setParkingLots(data);
        if (data.length > 0) {
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
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1659ed12/parking/lots/${lotId}/spots`,
        {
          headers: {
            'Authorization': `Bearer ${context.accessToken}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSpots(data);
      }
    } catch (error) {
      console.error('Error fetching spots:', error);
    }
  };

  const handleReserve = async () => {
    if (!selectedSpot || !selectedLot) return;

    setReserving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1659ed12/parking/reservations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.accessToken}`,
          },
          body: JSON.stringify({
            parking_lot_id: selectedLot.id,
            parking_spot_id: selectedSpot.id,
            ...reservationData,
          }),
        }
      );

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

  const availableSpots = spots.filter(s => s.status === 'available').length;
  const occupiedSpots = spots.filter(s => s.status === 'occupied').length;
  const reservedSpots = spots.filter(s => s.status === 'reserved').length;

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
        <h1 className="text-4xl font-bold mb-2 gradient-text">Smart Parking</h1>
        <p className="text-gray-400">Find and reserve parking spots in real-time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map & Parking Lots List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mock Map */}
          <div className="glass-card p-6 slide-in-up">
            <div className="h-64 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0">
                {parkingLots.map((lot, index) => (
                  <div
                    key={lot.id}
                    className="absolute"
                    style={{
                      left: `${20 + index * 25}%`,
                      top: `${30 + (index % 2) * 30}%`,
                    }}
                  >
                    <button
                      onClick={() => setSelectedLot(lot)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all pulse-animation ${
                        selectedLot?.id === lot.id
                          ? 'bg-blue-500 neon-glow-blue'
                          : 'bg-green-500/50 hover:bg-green-500'
                      }`}
                    >
                      <ParkingSquare size={24} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-gray-500 text-sm">Interactive Parking Map</p>
            </div>
          </div>

          {/* Parking Lots List */}
          <div className="space-y-4 slide-in-up" style={{ animationDelay: '0.1s' }}>
            {parkingLots.map((lot, index) => (
              <button
                key={lot.id}
                onClick={() => setSelectedLot(lot)}
                className={`w-full glass-card p-6 text-left transition-all ${
                  selectedLot?.id === lot.id ? 'border-blue-500 neon-glow-blue' : ''
                }`}
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <ParkingSquare size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{lot.name}</p>
                      <p className="text-sm text-gray-400 flex items-center">
                        <MapPin size={14} className="mr-1" />
                        {lot.address}
                      </p>
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

        {/* Spot Details & Reservation */}
        <div className="space-y-6">
          {/* Availability Stats */}
          {selectedLot && (
            <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-xl font-bold mb-4">{selectedLot.name}</h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                  <span className="text-sm text-gray-300">Available</span>
                  <span className="font-bold text-green-400">{availableSpots}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-pink-500/10 rounded-lg border border-pink-500/30">
                  <span className="text-sm text-gray-300">Occupied</span>
                  <span className="font-bold text-pink-400">{occupiedSpots}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                  <span className="text-sm text-gray-300">Reserved</span>
                  <span className="font-bold text-orange-400">{reservedSpots}</span>
                </div>
              </div>
            </div>
          )}

          {/* Spot Grid */}
          {selectedLot && (
            <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.3s' }}>
              <h3 className="font-bold mb-4 flex items-center">
                <Search className="mr-2 text-blue-400" size={18} />
                Select a Spot
              </h3>

              <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto">
                {spots.slice(0, 50).map((spot) => (
                  <button
                    key={spot.id}
                    onClick={() => spot.status === 'available' && setSelectedSpot(spot)}
                    disabled={spot.status !== 'available'}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all ${
                      selectedSpot?.id === spot.id
                        ? 'bg-blue-500 neon-glow-blue'
                        : spot.status === 'available'
                        ? 'bg-green-500/20 hover:bg-green-500/40 border border-green-500/50'
                        : spot.status === 'occupied'
                        ? 'bg-pink-500/20 border border-pink-500/30 cursor-not-allowed'
                        : 'bg-orange-500/20 border border-orange-500/30 cursor-not-allowed'
                    }`}
                  >
                    <span className="font-bold">{spot.spot_number}</span>
                    {spot.is_ev_friendly && <Zap size={10} className="text-yellow-400 mt-1" />}
                    {spot.is_disabled_friendly && <Accessibility size={10} className="text-blue-400 mt-1" />}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-1">
                  <Zap size={12} className="text-yellow-400" />
                  <span>EV Charging</span>
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
            <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.4s' }}>
              <h3 className="font-bold mb-4">Reserve Spot #{selectedSpot.spot_number}</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    value={reservationData.start_time}
                    onChange={(e) =>
                      setReservationData({ ...reservationData, start_time: e.target.value })
                    }
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    value={reservationData.end_time}
                    onChange={(e) =>
                      setReservationData({ ...reservationData, end_time: e.target.value })
                    }
                    className="input-field"
                    required
                  />
                </div>

                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Estimated Cost</span>
                    <span className="text-2xl font-bold text-blue-400">
                      ${reservationData.amount_paid}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Based on duration and location</p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleReserve}
                    disabled={reserving || !reservationData.start_time || !reservationData.end_time}
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

                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-400 flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Earn +10 reward points
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating 3D Element */}
      <div className="fixed bottom-20 right-10 pointer-events-none hidden lg:block">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 to-blue-500/30 rounded-3xl rotate-45 float-animation blur-xl"></div>
        </div>
      </div>
    </div>
  );
}
