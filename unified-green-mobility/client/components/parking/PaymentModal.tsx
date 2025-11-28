'use client';

/**
 * PaymentModal Component
 * 
 * Displays payment options: QR code for UPI, bank details, and dummy payment interface
 */

import { useState } from 'react';
import { X, QrCode, CreditCard, Building2, CheckCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  reservationId?: string;
  onPaymentSuccess: (paymentMethod: string, transactionId: string) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  reservationId,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank' | 'card'>('upi');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success'>('pending');
  const [transactionId, setTransactionId] = useState('');

  if (!isOpen) return null;

  const handlePayment = () => {
    setPaymentStatus('processing');
    // Simulate payment processing
    setTimeout(() => {
      const txId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setTransactionId(txId);
      setPaymentStatus('success');
      
      // Call success callback after a moment
      setTimeout(() => {
        onPaymentSuccess(paymentMethod, txId);
        handleClose();
      }, 2000);
    }, 2000);
  };

  const handleClose = () => {
    setPaymentStatus('pending');
    setTransactionId('');
    setPaymentMethod('upi');
    onClose();
  };

  // Generate a dummy QR code data (UPI payment string)
  const upiPaymentString = `upi://pay?pa=greenmobility@paytm&pn=Green%20Mobility&am=${amount}&cu=INR&tn=Parking%20Reservation`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-card p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold gradient-text">Complete Payment</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Amount Display */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
          <p className="text-sm text-gray-400 mb-1">Total Amount</p>
          <p className="text-3xl font-bold text-white">₹{amount}</p>
        </div>

        {paymentStatus === 'pending' && (
          <>
            {/* Payment Method Selection */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-3">Select Payment Method</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <QrCode size={24} className="mx-auto mb-2" />
                  <p className="text-xs">UPI</p>
                </button>
                <button
                  onClick={() => setPaymentMethod('bank')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'bank'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <Building2 size={24} className="mx-auto mb-2" />
                  <p className="text-xs">Bank</p>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <CreditCard size={24} className="mx-auto mb-2" />
                  <p className="text-xs">Card</p>
                </button>
              </div>
            </div>

            {/* Payment Details */}
            {paymentMethod === 'upi' && (
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-3">Scan QR Code to Pay</p>
                <div className="bg-white p-6 rounded-lg flex items-center justify-center mb-3">
                  {/* Dummy QR Code - In production, use a QR code library */}
                  <div className="w-48 h-48 bg-gray-100 grid grid-cols-8 gap-1 p-2">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div
                        key={i}
                        className={`${
                          Math.random() > 0.5 ? 'bg-black' : 'bg-white'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">UPI ID</p>
                  <p className="font-mono text-sm">greenmobility@paytm</p>
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Or use any UPI app to scan and pay
                </p>
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div className="mb-6 space-y-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">Bank Details</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Name:</span>
                      <span className="font-medium">Green Mobility Platform</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Number:</span>
                      <span className="font-mono">1234567890123</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">IFSC Code:</span>
                      <span className="font-mono">HDFC0001234</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bank Name:</span>
                      <span>HDFC Bank</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-xs text-yellow-400">
                    Please include your reservation ID in the payment remarks: {reservationId?.substring(0, 8) || 'N/A'}
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Card Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="input-field"
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Expiry</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="input-field"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      className="input-field"
                      maxLength={3}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="input-field"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handlePayment}
              className="w-full btn-primary"
            >
              Pay ₹{amount}
            </button>
          </>
        )}

        {paymentStatus === 'processing' && (
          <div className="text-center py-8">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-400">Processing payment...</p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="text-center py-8">
            <CheckCircle size={64} className="mx-auto mb-4 text-green-400" />
            <p className="text-2xl font-bold mb-2">Payment Successful!</p>
            <p className="text-sm text-gray-400 mb-4">Transaction ID: {transactionId}</p>
            <p className="text-xs text-gray-500">Redirecting...</p>
          </div>
        )}
      </div>
    </div>
  );
}

