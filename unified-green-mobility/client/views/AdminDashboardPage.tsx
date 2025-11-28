import { useState, useEffect } from 'react';
import { Users, Car, ParkingSquare, Leaf, TrendingUp, Activity, BarChart3, Shield, CheckCircle, X } from 'lucide-react';
import type { AppContextType } from '@/types/AppContext';
import { projectId } from '@/utils/supabase/info';

type AdminDashboardPageProps = {
  context: AppContextType;
};

interface PendingKYC {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  document_type: string;
  document_number: string;
  document_image_url: string | null;
  status: string;
  created_at: string;
}

export function AdminDashboardPage({ context }: AdminDashboardPageProps) {
  const [analytics, setAnalytics] = useState({
    total_users: 0,
    total_rides: 0,
    active_rides: 0,
    total_reservations: 0,
    total_co2_saved: 0,
  });
  const [pendingKYC, setPendingKYC] = useState<PendingKYC[]>([]);
  const [loading, setLoading] = useState(true);
  const [kycLoading, setKycLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchPendingKYC();
  }, []);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingKYC = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/kyc/pending`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('[ADMIN] Pending KYC data:', data);
        // Transform the data to match the expected format
        const transformedData = data.map((kyc: any) => ({
          id: kyc.id,
          user_id: kyc.user_id,
          user_name: kyc.user?.name || 'Unknown',
          user_email: kyc.user?.email || 'Unknown',
          document_type: kyc.document_type,
          document_number: kyc.document_number,
          document_image_url: kyc.document_image_url,
          status: kyc.status,
          created_at: kyc.created_at,
        }));
        setPendingKYC(transformedData);
      } else {
        const errorData = await response.json();
        console.error('[ADMIN] Failed to fetch pending KYC:', errorData);
        alert(`Failed to fetch pending KYC: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[ADMIN] Error fetching pending KYC:', error);
      alert('Failed to fetch pending KYC. Check console for details.');
    }
  };

  const handleKYCApprove = async (kycId: string) => {
    setKycLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/kyc/${kycId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });
      if (response.ok) {
        await fetchPendingKYC();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to approve KYC');
      }
    } catch (error) {
      console.error('Error approving KYC:', error);
      alert('Failed to approve KYC');
    } finally {
      setKycLoading(false);
    }
  };

  const handleKYCReject = async (kycId: string) => {
    setKycLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/kyc/${kycId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });
      if (response.ok) {
        await fetchPendingKYC();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to reject KYC');
      }
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      alert('Failed to reject KYC');
    } finally {
      setKycLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Mock data for charts
  const ridesPerDay = [
    { day: 'Mon', rides: 45 },
    { day: 'Tue', rides: 52 },
    { day: 'Wed', rides: 48 },
    { day: 'Thu', rides: 61 },
    { day: 'Fri', rides: 70 },
    { day: 'Sat', rides: 38 },
    { day: 'Sun', rides: 35 },
  ];

  const parkingUsage = [
    { lot: 'Downtown', usage: 85 },
    { lot: 'Tech Park', usage: 72 },
    { lot: 'Green Valley', usage: 65 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 slide-in-up">
        <h1 className="text-4xl font-bold mb-2 gradient-text">Admin Dashboard</h1>
        <p className="text-gray-400">Platform analytics and monitoring</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="stats-card slide-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30">
            <Users className="text-blue-400" size={24} />
          </div>
          <p className="text-gray-400 text-sm mb-1">Total Users</p>
          <p className="text-3xl font-bold text-blue-400">{analytics.total_users}</p>
          <p className="text-xs text-green-400 mt-2">+12% this week</p>
        </div>

        <div className="stats-card slide-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-xl flex items-center justify-center mb-4 border border-pink-500/30">
            <Car className="text-pink-400" size={24} />
          </div>
          <p className="text-gray-400 text-sm mb-1">Total Rides</p>
          <p className="text-3xl font-bold text-pink-400">{analytics.total_rides}</p>
          <p className="text-xs text-green-400 mt-2">+8% this week</p>
        </div>

        <div className="stats-card slide-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl flex items-center justify-center mb-4 border border-orange-500/30">
            <Activity className="text-orange-400" size={24} />
          </div>
          <p className="text-gray-400 text-sm mb-1">Active Rides</p>
          <p className="text-3xl font-bold text-orange-400">{analytics.active_rides}</p>
          <p className="text-xs text-blue-400 mt-2">Live now</p>
        </div>

        <div className="stats-card slide-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl flex items-center justify-center mb-4 border border-green-500/30">
            <ParkingSquare className="text-green-400" size={24} />
          </div>
          <p className="text-gray-400 text-sm mb-1">Parking Sessions</p>
          <p className="text-3xl font-bold text-green-400">{analytics.total_reservations}</p>
          <p className="text-xs text-green-400 mt-2">+15% this week</p>
        </div>

        <div className="stats-card slide-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl flex items-center justify-center mb-4 border border-cyan-500/30">
            <Leaf className="text-cyan-400" size={24} />
          </div>
          <p className="text-gray-400 text-sm mb-1">CO₂ Saved</p>
          <p className="text-3xl font-bold text-cyan-400">
            {analytics.total_co2_saved.toFixed(0)}<span className="text-lg">kg</span>
          </p>
          <p className="text-xs text-green-400 mt-2">+18% this week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Rides Per Day Chart */}
        <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center">
              <BarChart3 className="mr-2 text-blue-400" size={20} />
              Rides This Week
            </h2>
            <button className="text-sm text-blue-400 hover:text-blue-300">
              View Details →
            </button>
          </div>

          <div className="space-y-4">
            {ridesPerDay.map((day) => (
              <div key={day.day}>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-gray-400">{day.day}</span>
                  <span className="font-bold text-blue-400">{day.rides} rides</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${(day.rides / 70) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Parking Usage Chart */}
        <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.7s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center">
              <ParkingSquare className="mr-2 text-green-400" size={20} />
              Parking Lot Usage
            </h2>
            <button className="text-sm text-green-400 hover:text-green-300">
              View Details →
            </button>
          </div>

          <div className="space-y-6">
            {parkingUsage.map((lot, index) => (
              <div key={lot.lot}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        index === 0
                          ? 'bg-green-400'
                          : index === 1
                          ? 'bg-blue-400'
                          : 'bg-pink-400'
                      }`}
                    ></div>
                    <span className="font-medium">{lot.lot}</span>
                  </div>
                  <span className="font-bold text-green-400">{lot.usage}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      index === 0
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : index === 1
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        : 'bg-gradient-to-r from-pink-500 to-red-500'
                    }`}
                    style={{ width: `${lot.usage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Environmental Impact */}
      <div className="glass-card p-6 mb-8 bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/30 slide-in-up" style={{ animationDelay: '0.8s' }}>
        <h2 className="text-xl font-bold mb-6 flex items-center text-green-400">
          <Leaf className="mr-2" size={20} />
          Environmental Impact Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-green-500/50">
              <Leaf className="text-green-400" size={28} />
            </div>
            <p className="text-3xl font-bold text-green-400 mb-1">
              {analytics.total_co2_saved.toFixed(0)}kg
            </p>
            <p className="text-sm text-gray-400">Total CO₂ Saved</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-blue-500/50">
              <Car className="text-blue-400" size={28} />
            </div>
            <p className="text-3xl font-bold text-blue-400 mb-1">
              {(analytics.total_co2_saved / 2.3).toFixed(0)}
            </p>
            <p className="text-sm text-gray-400">Cars Off Road (equiv.)</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-pink-500/50">
              <TrendingUp className="text-pink-400" size={28} />
            </div>
            <p className="text-3xl font-bold text-pink-400 mb-1">
              {((analytics.total_co2_saved / 2.3) * 15000).toFixed(0)}km
            </p>
            <p className="text-sm text-gray-400">Miles Not Driven</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-orange-500/50">
              <Leaf className="text-orange-400" size={28} />
            </div>
            <p className="text-3xl font-bold text-orange-400 mb-1">
              {(analytics.total_co2_saved * 0.05).toFixed(0)}
            </p>
            <p className="text-sm text-gray-400">Trees Planted (equiv.)</p>
          </div>
        </div>
      </div>

      {/* KYC Approval Section */}
      <div className="glass-card p-6 mb-8 slide-in-up" style={{ animationDelay: '0.85s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center">
            <Shield className="mr-2 text-pink-400" size={20} />
            KYC Approval Queue
          </h2>
          <span className="badge badge-warning">{pendingKYC.length} Pending</span>
        </div>

        {pendingKYC.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto mb-3 text-green-400" size={48} />
            <p className="text-gray-400">No pending KYC submissions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingKYC.map((kyc) => (
              <div
                key={kyc.id}
                className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-pink-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-bold">{kyc.user_name}</h3>
                      <span className="badge badge-info">{kyc.document_type}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{kyc.user_email}</p>
                    <p className="text-xs text-gray-500 mb-2">
                      Document: {kyc.document_number}
                    </p>
                    <p className="text-xs text-gray-500">
                      Submitted: {new Date(kyc.created_at).toLocaleString()}
                    </p>
                    {kyc.document_image_url && (
                      <a
                        href={kyc.document_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block"
                      >
                        View Document →
                      </a>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleKYCApprove(kyc.id)}
                      disabled={kycLoading}
                      className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-lg text-green-400 transition-all disabled:opacity-50 flex items-center space-x-2"
                    >
                      <CheckCircle size={16} />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to reject this KYC submission?')) {
                          handleKYCReject(kyc.id);
                        }
                      }}
                      disabled={kycLoading}
                      className="px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/50 rounded-lg text-pink-400 transition-all disabled:opacity-50 flex items-center space-x-2"
                    >
                      <X size={16} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Rides */}
        <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.9s' }}>
          <h2 className="text-xl font-bold mb-4">Recent Rides</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">Downtown → Tech Park</p>
                  <span className="badge badge-success">Open</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>2 passengers</span>
                  <span>Just now</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Alerts */}
        <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '1s' }}>
          <h2 className="text-xl font-bold mb-4">System Alerts</h2>
          <div className="space-y-3">
            <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-sm">All systems operational</p>
                  <p className="text-xs text-gray-400">Last checked: 2 minutes ago</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 pulse-animation"></div>
                <div>
                  <p className="font-medium text-sm">New user registrations +15%</p>
                  <p className="text-xs text-gray-400">Trending upward this week</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-sm">Tech Park lot nearing capacity</p>
                  <p className="text-xs text-gray-400">85% occupied</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating 3D Element */}
      <div className="fixed top-1/4 right-10 pointer-events-none hidden lg:block">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-pink-500/30 rounded-3xl rotate-12 float-animation blur-xl"></div>
          <div className="absolute inset-4 bg-gradient-to-br from-green-500/30 to-orange-500/30 rounded-2xl -rotate-12 float-animation blur-xl" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    </div>
  );
}
