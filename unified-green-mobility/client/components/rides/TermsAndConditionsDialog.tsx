'use client';

import { useState } from 'react';
import { FileText, Check, X } from 'lucide-react';
import { rideTermsSections } from '@/config/terms';

type TermsAndConditionsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  isLoading?: boolean;
};

export function TermsAndConditionsDialog({ 
  isOpen, 
  onClose, 
  onAccept,
  isLoading = false 
}: TermsAndConditionsDialogProps) {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  const handleAccept = () => {
    if (agreed) {
      onAccept();
    }
  };

  const handleClose = () => {
    setAgreed(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="glass-card p-8 max-w-3xl w-full max-h-[90vh] flex flex-col slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-blue-500 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Terms & Conditions</h2>
              <p className="text-sm text-gray-400">Please read carefully before joining this ride</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            disabled={isLoading}
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2 custom-scrollbar">
          {rideTermsSections.map((section, index) => (
            <div
              key={index}
              className="bg-white/5 rounded-lg p-4 border border-white/10"
            >
              <h3 className="font-bold text-lg mb-2 gradient-text">
                {index + 1}. {section.title}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {section.body}
              </p>
            </div>
          ))}
        </div>

        {/* Agreement Checkbox */}
        <div className="mb-6">
          <label className="flex items-start space-x-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-white/30 bg-white/5 checked:bg-gradient-to-br checked:from-pink-500 checked:to-blue-500 appearance-none cursor-pointer transition-all"
                disabled={isLoading}
              />
              {agreed && (
                <Check
                  size={16}
                  className="absolute text-white pointer-events-none"
                />
              )}
            </div>
            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
              I have read and agree to the Terms & Conditions stated above. I understand my responsibilities as a passenger and the platform's policies regarding safety, payments, and data usage.
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleAccept}
            disabled={!agreed || isLoading}
            className={`flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed ${
              !agreed ? 'grayscale' : ''
            }`}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner inline-block w-4 h-4 mr-2"></div>
                Joining Ride...
              </>
            ) : (
              <>
                <Check size={18} className="inline mr-2" />
                Accept & Join Ride
              </>
            )}
          </button>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 btn-secondary disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        {/* Warning Notice */}
        {!agreed && (
          <p className="text-xs text-gray-500 text-center mt-4">
            You must check the box above to accept the terms and join this ride
          </p>
        )}
      </div>
    </div>
  );
}

