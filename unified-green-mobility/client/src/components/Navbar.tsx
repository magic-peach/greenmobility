import { Menu, X, User, Car, ParkingSquare, Trophy, LayoutDashboard, Clock, Shield } from 'lucide-react';
import { useState } from 'react';
import type { User as UserType } from '@/types/AppContext';

type Page = 'dashboard' | 'profile' | 'ride-search' | 'ride-create' | 'parking' | 'leaderboard' | 'admin' | 'history';

type NavbarProps = {
  user: UserType;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
};

export function Navbar({ user, currentPage, onNavigate, onLogout }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ride-search' as Page, label: 'Find Rides', icon: Car },
    { id: 'parking' as Page, label: 'Parking', icon: ParkingSquare },
    { id: 'leaderboard' as Page, label: 'Leaderboard', icon: Trophy },
    { id: 'history' as Page, label: 'History', icon: Clock },
  ];

  if (user.role === 'admin') {
    navItems.push({ id: 'admin' as Page, label: 'Admin', icon: Shield });
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-pink-500 to-green-500 rounded-xl rotate-45 float-animation"></div>
              <div className="absolute inset-0 w-12 h-12 bg-gradient-to-br from-pink-500 via-orange-500 to-blue-500 rounded-xl rotate-45 opacity-50 blur-lg"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">GreenMobility</h1>
              <p className="text-xs text-gray-400">Sustainable Transport</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-400 neon-glow-blue'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-blue-500/50"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-blue-500 rounded-full flex items-center justify-center">
                <User size={16} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role}</p>
              </div>
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/50 hover:bg-pink-500/30 transition-all duration-300"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 slide-in-up">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => {
                onNavigate('profile');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5 transition-all"
            >
              <User size={20} />
              <span>Profile</span>
            </button>
            <button
              onClick={onLogout}
              className="w-full px-4 py-3 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/50 hover:bg-pink-500/30 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
