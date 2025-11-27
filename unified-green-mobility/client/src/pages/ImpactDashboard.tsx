'use client';

import { useState, useEffect } from 'react';
import { Leaf, TrendingUp, MapPin, Award } from 'lucide-react';
import type { AppContextType } from '@/types/AppContext';

type ImpactDashboardProps = {
  context: AppContextType;
};

interface ImpactStats {
  total_distance_km: number;
  total_co2_saved_kg: number;
  points: number;
  rides_completed: number;
  weekly_data?: { week: string; distance: number; co2: number }[];
  monthly_data?: { month: string; distance: number; co2: number }[];
}

export function ImpactDashboard({ context }: ImpactDashboardProps) {
  const [stats, setStats] = useState<ImpactStats>({
    total_distance_km: 0,
    total_co2_saved_kg: 0,
    points: 0,
    rides_completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('all');

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchStats();
  }, [timeframe]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/stats/me`, {
        headers: {
          'Authorization': `Bearer ${context.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching impact stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Mock chart data (replace with real data from API)
  const weeklyData = stats.weekly_data || [
    { week: 'Week 1', distance: 45, co2: 12.5 },
    { week: 'Week 2', distance: 62, co2: 17.2 },
    { week: 'Week 3', distance: 38, co2: 10.5 },
    { week: 'Week 4', distance: 55, co2: 15.3 },
  ];

  const monthlyData = stats.monthly_data || [
    { month: 'Jan', distance: 180, co2: 50 },
    { month: 'Feb', distance: 220, co2: 61 },
    { month: 'Mar', distance: 195, co2: 54 },
  ];

  const chartData = timeframe === 'week' ? weeklyData : monthlyData;
  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d.distance, d.co2 * 10)),
    100
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 slide-in-up">
        <h1 className="text-4xl font-bold mb-2 gradient-text">Your Environmental Impact</h1>
        <p className="text-gray-400">Track your contribution to a greener planet</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center mb-4 border border-green-500/30">
            <MapPin className="text-green-400" size={24} />
          </div>
          <p className="text-gray-400 text-sm mb-1">Total Distance</p>
          <p className="text-3xl font-bold text-green-400">
            {stats.total_distance_km.toFixed(1)} km
          </p>
        </div>

        <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30">
            <Leaf className="text-blue-400" size={24} />
          </div>
          <p className="text-gray-400 text-sm mb-1">CO₂ Saved</p>
          <p className="text-3xl font-bold text-blue-400">
            {stats.total_co2_saved_kg.toFixed(2)} kg
          </p>
        </div>

        <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-4 border border-pink-500/30">
            <Award className="text-pink-400" size={24} />
          </div>
          <p className="text-gray-400 text-sm mb-1">Reward Points</p>
          <p className="text-3xl font-bold text-pink-400">{stats.points}</p>
        </div>

        <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-xl flex items-center justify-center mb-4 border border-yellow-500/30">
            <TrendingUp className="text-yellow-400" size={24} />
          </div>
          <p className="text-gray-400 text-sm mb-1">Rides Completed</p>
          <p className="text-3xl font-bold text-yellow-400">{stats.rides_completed}</p>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="mb-6 flex space-x-2">
        <button
          onClick={() => setTimeframe('week')}
          className={`px-4 py-2 rounded-lg transition-all ${
            timeframe === 'week'
              ? 'bg-blue-500 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setTimeframe('month')}
          className={`px-4 py-2 rounded-lg transition-all ${
            timeframe === 'month'
              ? 'bg-blue-500 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setTimeframe('all')}
          className={`px-4 py-2 rounded-lg transition-all ${
            timeframe === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          All Time
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Distance Chart */}
        <div className="glass-card p-6 slide-in-up">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <MapPin className="mr-2 text-green-400" size={20} />
            Distance Traveled
          </h3>
          <div className="space-y-3">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-20 text-sm text-gray-400">
                  {timeframe === 'week' ? item.week : item.month}
                </div>
                <div className="flex-1 bg-gray-800 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(item.distance / maxValue) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-right text-sm font-medium text-green-400">
                  {item.distance} km
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CO₂ Chart */}
        <div className="glass-card p-6 slide-in-up">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <Leaf className="mr-2 text-blue-400" size={20} />
            CO₂ Saved
          </h3>
          <div className="space-y-3">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-20 text-sm text-gray-400">
                  {timeframe === 'week' ? item.week : item.month}
                </div>
                <div className="flex-1 bg-gray-800 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(item.co2 * 10 / maxValue) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-right text-sm font-medium text-blue-400">
                  {item.co2.toFixed(1)} kg
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="glass-card p-6 bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/30 slide-in-up">
        <h3 className="text-xl font-bold mb-4 flex items-center text-green-400">
          <Leaf className="mr-2" size={24} />
          Your Impact Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-400 mb-2">
              {((stats.total_co2_saved_kg / 20) * 100).toFixed(0)}%
            </p>
            <p className="text-sm text-gray-400">
              Reduction vs. solo trips
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-400 mb-2">
              {Math.floor(stats.total_co2_saved_kg / 0.5)}
            </p>
            <p className="text-sm text-gray-400">
              Trees equivalent saved
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-pink-400 mb-2">
              {Math.floor(stats.total_distance_km / 10)}
            </p>
            <p className="text-sm text-gray-400">
              Cars taken off the road
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

