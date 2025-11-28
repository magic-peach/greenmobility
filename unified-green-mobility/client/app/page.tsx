'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Leaf, Car, ParkingSquare, Trophy, Check } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Parallax effect for hero section
  const heroOpacity = Math.max(0, 1 - scrollY / 600);
  const heroScale = Math.max(0.8, 1 - scrollY / 1000);
  const heroTranslateY = scrollY * 0.5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white overflow-x-hidden">
      {/* Hero Section */}
      <div 
        ref={heroRef}
        className="h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          transform: `translateY(${heroTranslateY}px)`,
        }}
      >
        {/* Animated Background Glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-20 left-10 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse"
            style={{
              animation: 'float 8s ease-in-out infinite',
            }}
          ></div>
          <div 
            className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse"
            style={{
              animation: 'float 8s ease-in-out infinite 2s',
            }}
          ></div>
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl"
            style={{
              animation: 'float 10s ease-in-out infinite 4s',
            }}
          ></div>
        </div>

        <div 
          className="text-center relative z-10 px-4 max-w-4xl mx-auto transition-all duration-300"
          style={{ 
            opacity: heroOpacity,
            transform: `scale(${heroScale})`,
          }}
        >
          {/* Logo - 3D Rotating Effect */}
          <div className="flex justify-center mb-8">
            <div 
              className="relative"
              style={{
                transformStyle: 'preserve-3d',
                animation: 'rotate3d 20s linear infinite',
              }}
            >
              <div className="w-32 h-32 bg-gradient-to-br from-pink-500 via-purple-500 via-blue-500 to-green-500 rounded-2xl rotate-45 shadow-2xl"></div>
              <Leaf 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 text-white" 
                size={64}
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))',
                }}
              />
              {/* 3D Glow Effect */}
              <div 
                className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-pink-500 via-purple-500 via-blue-500 to-green-500 rounded-2xl rotate-45 opacity-50 blur-2xl"
                style={{
                  transform: 'translateZ(-20px)',
                }}
              ></div>
            </div>
          </div>

          {/* Brand Name - Gradient Text with Animation */}
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            <span 
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 bg-clip-text text-transparent"
              style={{
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 3s ease infinite',
              }}
            >
              Green
            </span>
            <span 
              className="bg-gradient-to-r from-blue-500 via-cyan-400 to-green-500 bg-clip-text text-transparent"
              style={{
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 3s ease infinite 1.5s',
              }}
            >
              Mobility
            </span>
          </h1>

          {/* Tagline */}
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            The Future of Sustainable Transport.
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-white max-w-2xl mx-auto mb-12 leading-relaxed">
            Share rides, find parking, earn rewards, and reduce your carbon footprint — all in one revolutionary platform.
          </p>

          {/* CTA Button - Gradient with 3D Hover */}
          <Link 
            href="/login"
            className="inline-block relative group mb-16"
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            <div 
              className="bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold text-lg px-12 py-4 rounded-xl shadow-lg transition-all duration-300 relative overflow-hidden"
              style={{
                transform: 'translateZ(0)',
              }}
            >
              <span className="relative z-10">Get Started</span>
              <div 
                className="absolute inset-0 bg-gradient-to-r from-pink-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              ></div>
              <div 
                className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
              ></div>
            </div>
            <div 
              className="absolute inset-0 bg-gradient-to-r from-blue-500 to-pink-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity -z-10"
              style={{
                transform: 'translateZ(-10px) scale(1.1)',
              }}
            ></div>
          </Link>

          {/* Scroll Indicator - Animated */}
          <div className="flex flex-col items-center animate-bounce">
            <p className="text-sm text-white mb-2">Scroll to explore</p>
            <ChevronDown className="text-white" size={24} />
          </div>
        </div>

        {/* Floating 3D Elements */}
        <div 
          className="absolute top-1/4 left-10 pointer-events-none hidden lg:block"
          style={{
            transformStyle: 'preserve-3d',
            animation: 'float3d 6s ease-in-out infinite',
          }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-2xl rotate-12 blur-lg"></div>
        </div>
        <div 
          className="absolute bottom-1/4 right-10 pointer-events-none hidden lg:block"
          style={{
            transformStyle: 'preserve-3d',
            animation: 'float3d 6s ease-in-out infinite 1s',
          }}
        >
          <div className="w-24 h-24 bg-gradient-to-br from-pink-500/30 to-orange-500/30 rounded-3xl -rotate-12 blur-lg"></div>
        </div>
      </div>

      {/* Features Section */}
      <div 
        ref={featuresRef}
        className="min-h-screen flex items-center justify-center py-20 px-4 relative"
      >
        {/* Background Glows for Features Section */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          {/* Section Headings with Scroll Animation */}
          <div 
            className={`text-center mb-16 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-white bg-clip-text text-transparent">
                Why Choose
              </span>{' '}
              <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
                GreenMobility?
              </span>
            </h2>
            <p className="text-xl text-gray-300">
              Everything you need for sustainable transportation
            </p>
          </div>

          {/* Feature Cards Grid - 3 columns with Scroll Animation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Ride Sharing Card */}
            <div 
              className={`bg-gray-800/70 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
              }`}
              style={{
                transitionDelay: '0.1s',
                transformStyle: 'preserve-3d',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px) rotateX(5deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) rotateX(0deg)';
              }}
            >
              {/* Icon - Blue to Light Blue Gradient with 3D */}
              <div 
                className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                style={{
                  transform: 'translateZ(10px)',
                  boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)',
                }}
              >
                <Car className="text-white" size={32} />
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold mb-4 text-white">Ride Sharing</h3>
              
              {/* Description */}
              <p className="text-gray-300 mb-6 leading-relaxed">
                Connect with drivers heading your way. Share rides, split costs, and reduce emissions together.
              </p>
              
              {/* Benefits List */}
              <ul className="space-y-3">
                <li className="flex items-center text-gray-300">
                  <Check className="text-green-400 mr-2 flex-shrink-0" size={18} />
                  <span>Real-time matching</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <Check className="text-green-400 mr-2 flex-shrink-0" size={18} />
                  <span>Fare splitting</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <Check className="text-green-400 mr-2 flex-shrink-0" size={18} />
                  <span>Multiple vehicle types</span>
                </li>
              </ul>
            </div>

            {/* Smart Parking Card */}
            <div 
              className={`bg-gray-800/70 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 hover:border-green-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
              }`}
              style={{
                transitionDelay: '0.2s',
                transformStyle: 'preserve-3d',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px) rotateX(5deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) rotateX(0deg)';
              }}
            >
              {/* Icon - Green to Light Green Gradient with 3D */}
              <div 
                className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                style={{
                  transform: 'translateZ(10px)',
                  boxShadow: '0 10px 30px rgba(34, 197, 94, 0.4)',
                }}
              >
                <ParkingSquare className="text-white" size={32} />
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold mb-4 text-white">Smart Parking</h3>
              
              {/* Description */}
              <p className="text-gray-300 mb-6 leading-relaxed">
                Find and reserve parking spots in real-time. Never circle the block looking for parking again.
              </p>
              
              {/* Benefits List */}
              <ul className="space-y-3">
                <li className="flex items-center text-gray-300">
                  <Check className="text-green-400 mr-2 flex-shrink-0" size={18} />
                  <span>Live availability</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <Check className="text-green-400 mr-2 flex-shrink-0" size={18} />
                  <span>EV charging spots</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <Check className="text-green-400 mr-2 flex-shrink-0" size={18} />
                  <span>Easy reservations</span>
                </li>
              </ul>
            </div>

            {/* Earn Rewards Card */}
            <div 
              className={`bg-gray-800/70 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
              }`}
              style={{
                transitionDelay: '0.3s',
                transformStyle: 'preserve-3d',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px) rotateX(5deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) rotateX(0deg)';
              }}
            >
              {/* Icon - Vibrant Orange Gradient with 3D */}
              <div 
                className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                style={{
                  transform: 'translateZ(10px)',
                  boxShadow: '0 10px 30px rgba(249, 115, 22, 0.4)',
                }}
              >
                <Trophy className="text-white" size={32} />
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold mb-4 text-white">Earn Rewards</h3>
              
              {/* Description */}
              <p className="text-gray-300 mb-6 leading-relaxed">
                Get rewarded for making sustainable choices. Earn points and compete on the leaderboard.
              </p>
              
              {/* Benefits List */}
              <ul className="space-y-3">
                <li className="flex items-center text-gray-300">
                  <Check className="text-green-400 mr-2 flex-shrink-0" size={18} />
                  <span>Points for every trip</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <Check className="text-green-400 mr-2 flex-shrink-0" size={18} />
                  <span>Exclusive benefits</span>
                </li>
                <li className="flex items-center text-gray-300">
                  <Check className="text-green-400 mr-2 flex-shrink-0" size={18} />
                  <span>Global leaderboard</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Right Leaf Icon */}
      <div 
        className="fixed bottom-10 right-10 pointer-events-none hidden lg:block"
        style={{
          animation: 'float 8s ease-in-out infinite',
        }}
      >
        <Leaf 
          className="text-green-500/20" 
          size={80}
          style={{
            filter: 'blur(2px)',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotateX(0deg) rotateY(0deg);
          }
          50% {
            transform: translateY(-20px) rotateX(5deg) rotateY(5deg);
          }
        }

        @keyframes float3d {
          0%, 100% {
            transform: translateY(0) translateZ(0) rotateZ(0deg);
          }
          50% {
            transform: translateY(-30px) translateZ(20px) rotateZ(10deg);
          }
        }

        @keyframes rotate3d {
          0% {
            transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
          }
          100% {
            transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg);
          }
        }

        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
}
