import { useState } from 'react';
import { User, Phone, Mail, Shield, CheckCircle, Upload, Edit2 } from 'lucide-react';
import type { AppContextType } from '@/types/AppContext';

type ProfilePageProps = {
  context: AppContextType;
};

export function ProfilePage({ context }: ProfilePageProps) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: context.user?.name || '',
    phone: context.user?.phone || '',
  });
  const [kycForm, setKycForm] = useState({
    document_type: 'aadhaar',
    document_number: '',
    document_image_url: '',
  });
  const [submittingKYC, setSubmittingKYC] = useState(false);
  const [kycError, setKycError] = useState('');
  const [kycSuccess, setKycSuccess] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  const handleSave = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await context.refreshUser();
        setEditing(false);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleKYCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycError('');
    setKycSuccess(false);

    if (!kycForm.document_type || !kycForm.document_number) {
      setKycError('Please fill all required fields');
      return;
    }

    setSubmittingKYC(true);
    try {
      const response = await fetch(`${apiBaseUrl}/kyc/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.accessToken}`,
        },
        body: JSON.stringify(kycForm),
      });

      if (response.ok) {
        setKycSuccess(true);
        setKycForm({ document_type: 'aadhaar', document_number: '', document_image_url: '' });
        await context.refreshUser();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit KYC');
      }
    } catch (error: any) {
      setKycError(error.message || 'Failed to submit KYC');
    } finally {
      setSubmittingKYC(false);
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'verified':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'rejected':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  const getKycStatusText = (status: string) => {
    switch (status) {
      case 'approved':
      case 'verified':
        return 'Approved';
      case 'pending':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      case 'not_submitted':
        return 'Not Submitted';
      default:
        return 'Not Submitted';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'from-pink-500 to-orange-500';
      case 'driver':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-green-500 to-emerald-500';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="glass-card p-8 mb-6 slide-in-up">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          {/* Avatar */}
          <div className="relative group">
            <div className={`w-32 h-32 bg-gradient-to-br ${getRoleColor(context.user?.role || 'passenger')} rounded-2xl flex items-center justify-center float-animation`}>
              <User size={48} className="text-white" />
            </div>
            <button className="absolute bottom-2 right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity neon-glow-blue">
              <Edit2 size={16} />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
              <h1 className="text-3xl font-bold">{context.user?.name}</h1>
              {context.user?.kyc_status === 'verified' && (
                <CheckCircle className="text-green-400" size={24} />
              )}
            </div>
            <p className="text-gray-400 mb-4">{context.user?.email}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className={`badge capitalize ${getKycStatusColor(context.user?.kyc_status || 'not_submitted')}`}>
                {getKycStatusText(context.user?.kyc_status || 'not_submitted')}
              </span>
              <span className="badge badge-info capitalize">
                {context.user?.role}
              </span>
              <span className="badge" style={{ background: 'rgba(255, 149, 0, 0.2)', color: '#ff9500', border: '1px solid #ff9500' }}>
                Joined {new Date(context.user?.created_at || '').toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Edit Button */}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <User className="mr-2 text-blue-400" size={20} />
            Personal Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Full Name</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              ) : (
                <p className="text-lg">{context.user?.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Email Address</label>
              <div className="flex items-center space-x-2">
                <Mail className="text-gray-400" size={16} />
                <p className="text-lg">{context.user?.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
              {editing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <Phone className="text-gray-400" size={16} />
                  <p className="text-lg">{context.user?.phone || 'Not provided'}</p>
                </div>
              )}
            </div>
          </div>

          {editing && (
            <div className="mt-6 flex space-x-3">
              <button onClick={handleSave} className="btn-primary flex-1">
                Save Changes
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* KYC Verification */}
        <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <Shield className="mr-2 text-pink-400" size={20} />
            KYC Verification
          </h2>

          {context.user?.kyc_status === 'verified' ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 neon-glow-green">
                <CheckCircle className="text-green-400" size={40} />
              </div>
              <p className="text-lg font-medium text-green-400 mb-2">Verified Account</p>
              <p className="text-sm text-gray-400">Your identity has been verified. You can now create rides, join rides, and earn rewards.</p>
            </div>
          ) : context.user?.kyc_status === 'pending' ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-orange-400" size={40} />
              </div>
              <p className="text-lg font-medium text-orange-400 mb-2">Pending Review</p>
              <p className="text-sm text-gray-400">Your KYC submission is under review. You'll be notified once approved.</p>
            </div>
          ) : (
            <form onSubmit={handleKYCSubmit}>
              <p className="text-gray-400 text-sm mb-6">
                Complete KYC verification to unlock all features: create rides, join rides, and earn rewards.
              </p>

              {kycError && (
                <div className="mb-4 p-4 bg-pink-500/20 border border-pink-500/50 rounded-lg text-pink-400 text-sm">
                  {kycError}
                </div>
              )}

              {kycSuccess && (
                <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
                  KYC submitted successfully! Your submission is under review.
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Document Type *</label>
                  <select
                    value={kycForm.document_type}
                    onChange={(e) => setKycForm({ ...kycForm, document_type: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="aadhaar">Aadhaar Card</option>
                    <option value="pan">PAN Card</option>
                    <option value="driving_license">Driving License</option>
                    <option value="passport">Passport</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Document Number *</label>
                  <input
                    type="text"
                    value={kycForm.document_number}
                    onChange={(e) => setKycForm({ ...kycForm, document_number: e.target.value })}
                    className="input-field"
                    placeholder="Enter document number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Upload Document Image (Optional)</label>
                  <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors cursor-pointer">
                    <Upload className="mx-auto mb-3 text-gray-400" size={32} />
                    <p className="text-sm text-gray-400">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG or PDF (max. 5MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        // TODO: Upload to Supabase Storage and get URL
                        // For now, just store the file name
                        if (e.target.files?.[0]) {
                          setKycForm({ ...kycForm, document_image_url: e.target.files[0].name });
                        }
                      }}
                    />
                  </div>
                  {kycForm.document_image_url && (
                    <p className="text-xs text-green-400 mt-2">File: {kycForm.document_image_url}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingKYC}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {submittingKYC ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Account Settings */}
      <div className="glass-card p-6 mt-6 slide-in-up" style={{ animationDelay: '0.3s' }}>
        <h2 className="text-xl font-bold mb-6">Preferences</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-400">Receive ride updates via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="font-medium">SMS Alerts</p>
              <p className="text-sm text-gray-400">Get ride alerts via SMS</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="font-medium">Auto-share Location</p>
              <p className="text-sm text-gray-400">Share during active rides</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="font-medium">Eco Mode</p>
              <p className="text-sm text-gray-400">Prioritize green options</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
