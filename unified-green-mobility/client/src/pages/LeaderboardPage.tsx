import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Leaf, Medal, Crown, Award } from 'lucide-react';
import type { AppContextType } from '@/types/AppContext';
import { projectId } from '../utils/supabase/info';

type LeaderboardPageProps = {
  context: AppContextType;
};

type LeaderboardEntry = {
  user_id: string;
  name: string;
  points: number;
  co2_saved: number;
  distance: number;
};

export function LeaderboardPage({ context }: LeaderboardPageProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    fetchMyStats();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1659ed12/rewards/leaderboard`,
        {
          headers: {
            'Authorization': `Bearer ${context.accessToken}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStats = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-1659ed12/rewards/my`,
        {
          headers: {
            'Authorization': `Bearer ${context.accessToken}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setMyStats(data);
      }
    } catch (error) {
      console.error('Error fetching my stats:', error);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-400" size={24} />;
      case 2:
        return <Medal className="text-gray-300" size={24} />;
      case 3:
        return <Medal className="text-orange-400" size={24} />;
      default:
        return <Award className="text-gray-500" size={24} />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-500 to-orange-500';
      case 2:
        return 'from-gray-400 to-gray-500';
      case 3:
        return 'from-orange-500 to-red-500';
      default:
        return 'from-blue-500 to-cyan-500';
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
      <div className="mb-8 text-center slide-in-up">
        <h1 className="text-4xl font-bold mb-2 gradient-text">Leaderboard</h1>
        <p className="text-gray-400">Top eco-warriors making a difference</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Top 3 Podium */}
          <div className="glass-card p-8 mb-6 slide-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-end justify-center space-x-4">
              {/* 2nd Place */}
              {leaderboard[1] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mb-2 float-animation" style={{ animationDelay: '1s' }}>
                    <Medal className="text-white" size={32} />
                  </div>
                  <div className="w-full h-32 bg-gradient-to-br from-gray-400/20 to-gray-500/20 rounded-t-xl flex flex-col items-center justify-center border-t-4 border-gray-400">
                    <p className="font-bold mb-1">{leaderboard[1].name}</p>
                    <p className="text-2xl font-bold text-gray-400">{leaderboard[1].points}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {leaderboard[0] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-2 neon-glow-orange float-animation">
                    <Crown className="text-white" size={40} />
                  </div>
                  <div className="w-full h-40 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-t-xl flex flex-col items-center justify-center border-t-4 border-yellow-400">
                    <p className="font-bold mb-1">{leaderboard[0].name}</p>
                    <p className="text-3xl font-bold text-yellow-400">{leaderboard[0].points}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {leaderboard[2] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-2 float-animation" style={{ animationDelay: '2s' }}>
                    <Medal className="text-white" size={32} />
                  </div>
                  <div className="w-full h-24 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-t-xl flex flex-col items-center justify-center border-t-4 border-orange-500">
                    <p className="font-bold mb-1">{leaderboard[2].name}</p>
                    <p className="text-2xl font-bold text-orange-400">{leaderboard[2].points}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full Leaderboard */}
          {leaderboard.map((entry, index) => (
            <div
              key={entry.user_id}
              className={`glass-card p-6 slide-in-up ${
                entry.user_id === context.user?.id ? 'border-blue-500 neon-glow-blue' : ''
              }`}
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <div className="flex items-center space-x-4">
                {/* Rank */}
                <div className="w-16 text-center">
                  {index < 3 ? (
                    getRankIcon(index + 1)
                  ) : (
                    <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className={`w-12 h-12 bg-gradient-to-br ${getRankColor(index + 1)} rounded-full flex items-center justify-center`}>
                  <span className="font-bold">{entry.name.charAt(0)}</span>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="font-bold text-lg">
                    {entry.name}
                    {entry.user_id === context.user?.id && (
                      <span className="ml-2 text-xs text-blue-400">(You)</span>
                    )}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <Leaf className="mr-1 text-green-400" size={14} />
                      {entry.co2_saved.toFixed(1)}kg CO₂
                    </span>
                    <span className="flex items-center">
                      <TrendingUp className="mr-1 text-blue-400" size={14} />
                      {entry.distance.toFixed(0)}km
                    </span>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-400">
                    {entry.points}
                  </p>
                  <p className="text-xs text-gray-400">points</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* My Stats Sidebar */}
        <div className="space-y-6">
          {/* My Rank Card */}
          <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <Trophy className="mr-2 text-yellow-400" size={20} />
              Your Stats
            </h2>

            {myStats && (
              <div className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-br from-blue-500/10 to-pink-500/10 rounded-xl border border-blue-500/30">
                  <p className="text-sm text-gray-400 mb-2">Your Points</p>
                  <p className="text-4xl font-bold gradient-text">{myStats.points}</p>
                </div>

                <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">CO₂ Saved</span>
                    <Leaf className="text-green-400" size={20} />
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    {myStats.total_co2_saved_kg.toFixed(1)} kg
                  </p>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Distance</span>
                    <TrendingUp className="text-blue-400" size={20} />
                  </div>
                  <p className="text-2xl font-bold text-blue-400">
                    {myStats.total_distance_km.toFixed(0)} km
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Rewards Info */}
          <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-xl font-bold mb-4">How to Earn Points</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-green-400">+50</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Join a carpool</p>
                  <p className="text-xs text-gray-400">Per ride as passenger</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400">+100</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Offer a ride</p>
                  <p className="text-xs text-gray-400">Per completed ride</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-pink-400">+10</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Use smart parking</p>
                  <p className="text-xs text-gray-400">Per reservation</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-400">+25</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Bike-pool</p>
                  <p className="text-xs text-gray-400">Eco-friendly bonus</p>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="glass-card p-6 slide-in-up" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-xl font-bold mb-4">Achievements</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="aspect-square bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
                <Leaf className="text-green-400" size={32} />
              </div>
              <div className="aspect-square bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                <Trophy className="text-blue-400" size={32} />
              </div>
              <div className="aspect-square bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-xl flex items-center justify-center border border-pink-500/30 opacity-30">
                <Award className="text-gray-400" size={32} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating 3D Element */}
      <div className="fixed top-1/3 left-10 pointer-events-none hidden lg:block">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-3xl rotate-45 float-animation blur-xl"></div>
        </div>
      </div>
    </div>
  );
}
