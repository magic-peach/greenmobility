'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { AppContextType } from '@/types/AppContext';

interface SOSButtonProps {
  rideId?: string;
  context: AppContextType;
}

export default function SOSButton({ rideId, context }: SOSButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your location. SOS will be sent without coordinates.');
        }
      );
    }
  };

  const handleSOS = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${apiBaseUrl}/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`,
        },
        body: JSON.stringify({
          ride_id: rideId || null,
          lat: location?.lat || null,
          lng: location?.lng || null,
          message: message.trim(),
        }),
      });

      if (response.ok) {
        alert('SOS alert sent! Our support team has been notified.');
        setShowModal(false);
        setMessage('');
        setLocation(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send SOS');
      }
    } catch (error) {
      console.error('Error sending SOS:', error);
      alert('Failed to send SOS. Please try again or contact emergency services directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          getCurrentLocation();
          setShowModal(true);
        }}
        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center space-x-2 transition-all neon-glow-red"
      >
        <AlertTriangle size={18} />
        <span>SOS</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-md w-full slide-in-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-red-400 flex items-center">
                <AlertTriangle className="mr-2" size={24} />
                Emergency SOS
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">
                <strong>Emergency Alert:</strong> This will notify our support team with your location and message.
                For immediate emergencies, please contact local authorities (100/112).
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Describe the situation
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input-field w-full h-24"
                  placeholder="Enter details about the emergency..."
                  required
                />
              </div>

              {location && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-xs text-blue-400">
                    Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleSOS}
                  disabled={sending || !message.trim()}
                  className="flex-1 btn-primary bg-red-500 hover:bg-red-600 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send SOS Alert'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

