import { useState, useEffect } from 'react';
import { ChevronDown, Leaf, Car, ParkingSquare, Trophy, Users, TrendingUp, Zap, Shield } from 'lucide-react';

type WelcomePageProps = {
  onNavigateToLogin: () => void;
};

export function WelcomePage({ onNavigateToLogin }: WelcomePageProps) {
  const [scrollY, setScrollY] = useState(0);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Trigger login page when scrolled past certain point
      if (window.scrollY > window.innerHeight * 2.5) {
        setShowLogin(true);
      } else {
        setShowLogin(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (showLogin) {
      onNavigateToLogin();
    }
  }, [showLogin, onNavigateToLogin]);

  const opacity = Math.max(0, 1 - scrollY / 500);
  const scale = Math.max(0.8, 1 - scrollY / 1000);

  return (
    <div className="min-h-[300vh] bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Hero Section */}
      <div className="h-screen flex items-center justify-center relative overflow-hidden sticky top-0">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl float-animation"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl float-animation" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-3xl float-animation" style={{ animationDelay: '4s' }}></div>
        </div>

        <div 
          className="text-center relative z-10 px-4 transition-all duration-300"
          style={{ 
            opacity, 
            transform: `scale(${scale})`,
          }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-pink-500 to-green-500 rounded-3xl rotate-45 float-animation"></div>
              <Leaf className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 text-white" size={64} />
              <div className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-pink-500 via-orange-500 to-blue-500 rounded-3xl rotate-45 opacity-50 blur-2xl"></div>
            </div>
          </div>

          {/* Hero Text */}
          <h1 className="text-6xl md:text-8xl font-bold mb-6 gradient-text">
            GreenMobility
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4">
            The Future of Sustainable Transport
          </p>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            Share rides, find parking, earn rewards, and reduce your carbon footprint — all in one revolutionary platform.
          </p>

          {/* CTA Button */}
          <button 
            onClick={onNavigateToLogin}
            className="btn-primary text-lg px-12 py-4 mb-16 pulse-animation"
          >
            Get Started
          </button>

          {/* Scroll Indicator */}
          <div className="flex flex-col items-center animate-bounce">
            <p className="text-sm text-gray-400 mb-2">Scroll to explore</p>
            <ChevronDown className="text-blue-400" size={32} />
          </div>
        </div>

        {/* Floating 3D Elements */}
        <div className="absolute top-1/4 left-10 pointer-events-none hidden lg:block">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-2xl rotate-12 float-animation blur-lg"></div>
        </div>
        <div className="absolute bottom-1/4 right-10 pointer-events-none hidden lg:block">
          <div className="w-24 h-24 bg-gradient-to-br from-pink-500/30 to-orange-500/30 rounded-3xl -rotate-12 float-animation blur-lg" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="min-h-screen flex items-center justify-center py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 slide-in-up">
            <h2 className="text-5xl font-bold mb-4 gradient-text">Why Choose GreenMobility?</h2>
            <p className="text-xl text-gray-400">Everything you need for sustainable transportation</p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Ride Sharing */}
            <div className="glass-card p-8 hover:scale-105 transition-all duration-300 slide-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 float-animation">
                <Car className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Ride Sharing</h3>
              <p className="text-gray-400 mb-4">
                Connect with drivers heading your way. Share rides, split costs, and reduce emissions together.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Real-time matching
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Fare splitting
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Multiple vehicle types
                </li>
              </ul>
            </div>

            {/* Smart Parking */}
            <div className="glass-card p-8 hover:scale-105 transition-all duration-300 slide-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 float-animation" style={{ animationDelay: '1s' }}>
                <ParkingSquare className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Smart Parking</h3>
              <p className="text-gray-400 mb-4">
                Find and reserve parking spots in real-time. Never circle the block looking for parking again.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Live availability
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  EV charging spots
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Easy reservations
                </li>
              </ul>
            </div>

            {/* Rewards System */}
            <div className="glass-card p-8 hover:scale-105 transition-all duration-300 slide-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center mb-6 float-animation" style={{ animationDelay: '2s' }}>
                <Trophy className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Earn Rewards</h3>
              <p className="text-gray-400 mb-4">
                Get rewarded for making sustainable choices. Earn points and compete on the leaderboard.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Points for every trip
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Exclusive benefits
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Global leaderboard
                </li>
              </ul>
            </div>

            {/* CO₂ Tracking */}
            <div className="glass-card p-8 hover:scale-105 transition-all duration-300 slide-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 float-animation" style={{ animationDelay: '3s' }}>
                <Leaf className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Track Impact</h3>
              <p className="text-gray-400 mb-4">
                See your environmental impact in real-time. Monitor CO₂ saved and distance traveled.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  CO₂ calculator
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Personal statistics
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Impact reports
                </li>
              </ul>
            </div>

            {/* Community */}
            <div className="glass-card p-8 hover:scale-105 transition-all duration-300 slide-in-up" style={{ animationDelay: '0.5s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 float-animation" style={{ animationDelay: '4s' }}>
                <Users className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Join Community</h3>
              <p className="text-gray-400 mb-4">
                Connect with like-minded individuals committed to sustainable transportation.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Verified users
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Rating system
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Safe & trusted
                </li>
              </ul>
            </div>

            {/* Safety */}
            <div className="glass-card p-8 hover:scale-105 transition-all duration-300 slide-in-up" style={{ animationDelay: '0.6s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 float-animation" style={{ animationDelay: '5s' }}>
                <Shield className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Safety First</h3>
              <p className="text-gray-400 mb-4">
                Your safety is our priority. KYC verification and emergency features included.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  KYC verification
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  SOS button
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  24/7 support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-gradient-to-br from-green-500/10 via-blue-500/10 to-pink-500/10">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-16 gradient-text slide-in-up">Our Impact So Far</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
            <div className="glass-card p-8 slide-in-up" style={{ animationDelay: '0.1s' }}>
              <TrendingUp className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-5xl font-bold text-green-400 mb-2">2.5K+</p>
              <p className="text-gray-400">Active Users</p>
            </div>

            <div className="glass-card p-8 slide-in-up" style={{ animationDelay: '0.2s' }}>
              <Car className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <p className="text-5xl font-bold text-blue-400 mb-2">15K+</p>
              <p className="text-gray-400">Rides Shared</p>
            </div>

            <div className="glass-card p-8 slide-in-up" style={{ animationDelay: '0.3s' }}>
              <Leaf className="w-12 h-12 text-pink-400 mx-auto mb-4" />
              <p className="text-5xl font-bold text-pink-400 mb-2">8.2T</p>
              <p className="text-gray-400">CO₂ Saved (kg)</p>
            </div>

            <div className="glass-card p-8 slide-in-up" style={{ animationDelay: '0.4s' }}>
              <Zap className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <p className="text-5xl font-bold text-orange-400 mb-2">50+</p>
              <p className="text-gray-400">Cities</p>
            </div>
          </div>

          {/* Final CTA */}
          <div className="glass-card p-12 slide-in-up" style={{ animationDelay: '0.5s' }}>
            <h3 className="text-4xl font-bold mb-6">Ready to Make a Difference?</h3>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already reducing their carbon footprint and earning rewards.
            </p>
            <button 
              onClick={onNavigateToLogin}
              className="btn-primary text-xl px-16 py-5 pulse-animation"
            >
              Start Your Journey
            </button>
          </div>

          {/* Scroll Indicator */}
          <div className="mt-16 flex flex-col items-center animate-bounce">
            <p className="text-sm text-gray-400 mb-2">Scroll down to login</p>
            <ChevronDown className="text-blue-400" size={32} />
          </div>
        </div>
      </div>

      {/* Floating Elements Throughout */}
      <div className="fixed top-1/3 left-20 pointer-events-none hidden lg:block">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl rotate-45 float-animation blur-lg"></div>
      </div>
      <div className="fixed bottom-1/3 right-20 pointer-events-none hidden lg:block">
        <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-3xl -rotate-12 float-animation blur-lg" style={{ animationDelay: '2s' }}></div>
      </div>
    </div>
  );
}