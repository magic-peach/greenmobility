import { useState } from 'react';
import { MapPin, Calendar, Clock, Users, Car, Bike, Zap, ArrowRight } from 'lucide-react';
import { formatINR } from '@/utils/currency';
import type { AppContextType } from '@/types/AppContext';
import { projectId } from '@/utils/supabase/info';

type RideCreatePageProps = {
  context: AppContextType;
  onNavigate: (page: 'dashboard') => void;
};

export function RideCreatePage({ context, onNavigate }: RideCreatePageProps) {
  const [formData, setFormData] = useState({
    start_location_name: '',
    start_lat: 37.7749,
    start_lng: -122.4194,
    end_location_name: '',
    end_lat: 37.7849,
    end_lng: -122.4094,
    departure_time: '',
    vehicle_type: 'car',
    total_seats: 3,
    max_passengers: 2, // Default to total_seats - 1 (driver occupies one seat)
    estimated_fare: 15,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1659ed12/rides`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${context.accessToken}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        alert('Ride created successfully!');
        onNavigate('dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create ride');
      }
    } catch (error) {
      console.error('Error creating ride:', error);
      setError('Failed to create ride');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const vehicleTypes = [
    { id: 'car', label: 'Car', icon: Car, color: 'from-blue-500 to-cyan-500', emission: '120g/km' },
    { id: 'bike', label: 'Bike', icon: Bike, color: 'from-green-500 to-emerald-500', emission: '0g/km' },
    { id: 'scooter', label: 'Scooter', icon: Zap, color: 'from-orange-500 to-yellow-500', emission: '30g/km' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 slide-in-up">
        <h1 className="text-4xl font-bold mb-2 gradient-text">Offer a Ride</h1>
        <p className="text-gray-400">Share your journey and earn rewards</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-pink-500/20 border border-pink-500/50 rounded-lg text-pink-400 text-sm slide-in-up">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Route Information */}
        <div className="glass-card p-6 mb-6 slide-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <MapPin className="mr-2 text-blue-400" size={20} />
            Route Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Starting Location</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
                <input
                  type="text"
                  value={formData.start_location_name}
                  onChange={(e) => handleChange('start_location_name', e.target.value)}
                  className="input-field pl-12"
                  placeholder="e.g., Downtown Station"
                  required
                />
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="text-gray-400" size={24} />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Destination</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-pink-500 rounded-full"></div>
                <input
                  type="text"
                  value={formData.end_location_name}
                  onChange={(e) => handleChange('end_location_name', e.target.value)}
                  className="input-field pl-12"
                  placeholder="e.g., Tech Park"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="glass-card p-6 mb-6 slide-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <Calendar className="mr-2 text-pink-400" size={20} />
            Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Departure Date</label>
              <input
                type="date"
                value={formData.departure_time.split('T')[0]}
                onChange={(e) => {
                  const time = formData.departure_time.split('T')[1] || '09:00';
                  handleChange('departure_time', `${e.target.value}T${time}`);
                }}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Departure Time</label>
              <input
                type="time"
                value={formData.departure_time.split('T')[1] || ''}
                onChange={(e) => {
                  const date = formData.departure_time.split('T')[0] || new Date().toISOString().split('T')[0];
                  handleChange('departure_time', `${date}T${e.target.value}`);
                }}
                className="input-field"
                required
              />
            </div>
          </div>
        </div>

        {/* Vehicle Type */}
        <div className="glass-card p-6 mb-6 slide-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <Car className="mr-2 text-green-400" size={20} />
            Vehicle Type
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehicleTypes.map((vehicle) => {
              const Icon = vehicle.icon;
              const isSelected = formData.vehicle_type === vehicle.id;
              return (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => handleChange('vehicle_type', vehicle.id)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${vehicle.color} rounded-xl flex items-center justify-center mx-auto mb-4 ${isSelected ? 'neon-glow-blue' : ''}`}>
                    <Icon size={28} className="text-white" />
                  </div>
                  <p className="font-bold text-lg mb-1">{vehicle.label}</p>
                  <p className="text-xs text-gray-400">{vehicle.emission}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Capacity & Pricing */}
        <div className="glass-card p-6 mb-6 slide-in-up" style={{ animationDelay: '0.4s' }}>
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <Users className="mr-2 text-orange-400" size={20} />
            Capacity & Pricing
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Available Seats</label>
              <input
                type="number"
                min="1"
                max="8"
                value={formData.total_seats}
                onChange={(e) => {
                  const newTotalSeats = parseInt(e.target.value);
                  const newMaxPassengers = Math.min(formData.max_passengers, newTotalSeats - 1);
                  setFormData(prev => ({
                    ...prev,
                    total_seats: newTotalSeats,
                    max_passengers: newMaxPassengers || 1,
                  }));
                }}
                className="input-field"
                required
              />
              <p className="text-xs text-gray-500 mt-2">Total seats in your vehicle (including driver)</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Maximum Passengers</label>
              <input
                type="number"
                min="1"
                max={formData.total_seats - 1}
                value={formData.max_passengers}
                onChange={(e) => {
                  const maxPassengers = parseInt(e.target.value);
                  const maxAllowed = formData.total_seats - 1;
                  handleChange('max_passengers', Math.min(maxPassengers, maxAllowed));
                }}
                className="input-field"
                required
              />
              <p className="text-xs text-gray-500 mt-2">Maximum number of passengers you want to accept (max: {formData.total_seats - 1})</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Fare per Passenger (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={formData.estimated_fare}
                  onChange={(e) => handleChange('estimated_fare', parseFloat(e.target.value))}
                  className="input-field pl-10"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Suggested: ₹100-200 per person</p>
            </div>
          </div>
        </div>

        {/* Impact Preview */}
        <div className="glass-card p-6 mb-6 bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/30 slide-in-up" style={{ animationDelay: '0.5s' }}>
          <h3 className="font-bold mb-4 flex items-center text-green-400">
            🌍 Estimated Environmental Impact
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {(formData.total_seats * 2.5).toFixed(1)}kg
              </p>
              <p className="text-xs text-gray-400">CO₂ Saved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">+{formData.total_seats * 50}</p>
              <p className="text-xs text-gray-400">Reward Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">
                {formatINR(formData.estimated_fare * formData.total_seats)}
              </p>
              <p className="text-xs text-gray-400">Potential Earnings</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex space-x-4 slide-in-up" style={{ animationDelay: '0.6s' }}>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Ride'}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Floating 3D Element */}
      <div className="fixed top-1/4 right-10 pointer-events-none hidden lg:block">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 to-orange-500/30 rounded-3xl rotate-12 float-animation blur-xl"></div>
        </div>
      </div>
    </div>
  );
}
