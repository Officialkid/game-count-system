// app/page.tsx - Premium Landing Page
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: '⚡',
      title: 'Smart Scoring System',
      description: 'Real-time score inputs with animated changes and instant leaderboard updates.'
    },
    {
      icon: '📊',
      title: 'Live Public Leaderboards',
      description: 'Auto-generated share links with real-time syncing accessible anywhere.'
    },
    {
      icon: '🎨',
      title: 'Custom Event Branding',
      description: 'Upload event logos, set theme colors, and customize scoreboard layouts.'
    },
    {
      icon: '🔒',
      title: 'Secure Accounts & Permissions',
      description: 'User roles for admins, judges, and participants with proper access control.'
    },
    {
      icon: '⚙️',
      title: 'Admin Control Center',
      description: 'Manage events, teams, scoring rules, and settings from one dashboard.'
    },
    {
      icon: '📱',
      title: 'Multi-Device Support',
      description: 'Score from mobile, tablet, or desktop with seamless synchronization.'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Create Event',
      description: 'Upload logo, set colors, define scoring rules.'
    },
    {
      number: '2',
      title: 'Add Teams',
      description: 'Enter team names, logos, and categories.'
    },
    {
      number: '3',
      title: 'Start Scoring',
      description: 'Use any device — real-time syncing enabled.'
    },
    {
      number: '4',
      title: 'Share Leaderboard',
      description: 'Auto-generated public link updates instantly.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50">
      {/* Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation Bar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* Hero Content */}
          <div className="relative z-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 animate-fade-in leading-tight">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 bg-clip-text text-transparent">
                Track Competitions.
              </span>
              <br />
              <span className="text-gray-900">
                Boost Performance.
              </span>
              <br />
              <span className="bg-gradient-to-r from-amber-500 to-purple-600 bg-clip-text text-transparent">
                Celebrate Winners.
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              A clean, fast, and visually stunning scoring platform for events, schools, tournaments, and academies.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/register"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300 font-semibold text-lg w-full sm:w-auto group"
              >
                Get Started Free
                <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-white/80 backdrop-blur-lg border-2 border-purple-200 text-purple-600 rounded-xl hover:shadow-xl hover:scale-105 transform transition-all duration-300 font-semibold text-lg w-full sm:w-auto"
              >
                Login
              </Link>
            </div>

            {/* Hero Visual */}
            <div className="relative max-w-5xl mx-auto">
              <div className="glass-card p-8 rounded-2xl backdrop-blur-xl bg-white/30 border border-white/50 shadow-2xl">
                <div className="text-center space-y-4">
                  <div className="text-6xl animate-float">🏆</div>
                  <p className="text-gray-600 italic">
                    Futuristic 3D floating scoreboard with holographic glass cards
                  </p>
                  <div className="flex justify-center space-x-4 pt-4">
                    <div className="px-4 py-2 bg-purple-500/20 rounded-lg backdrop-blur-sm border border-purple-300/30">
                      <span className="text-2xl font-bold text-purple-600">342</span>
                      <p className="text-xs text-gray-600">Team Alpha</p>
                    </div>
                    <div className="px-4 py-2 bg-amber-500/20 rounded-lg backdrop-blur-sm border border-amber-300/30">
                      <span className="text-2xl font-bold text-amber-600">298</span>
                      <p className="text-xs text-gray-600">Team Beta</p>
                    </div>
                    <div className="px-4 py-2 bg-pink-500/20 rounded-lg backdrop-blur-sm border border-pink-300/30">
                      <span className="text-2xl font-bold text-pink-600">275</span>
                      <p className="text-xs text-gray-600">Team Gamma</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to run professional competitions and track performance in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group glass-card p-8 rounded-2xl backdrop-blur-xl bg-white/40 border border-white/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
              >
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 to-amber-50 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes with our simple 4-step process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg transform hover:scale-110 transition-transform">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>

                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full">
                    <div className="flex items-center justify-center">
                      <div className="text-purple-400 text-2xl animate-pulse">→</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-amber-500 text-white rounded-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300 font-semibold text-lg"
            >
              Start Your First Event Now
              <span className="ml-2">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white py-12 border-t-4 border-purple-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-3xl">🎮</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
                  GameScore
                </span>
              </div>
              <p className="text-gray-400 mb-4">
                The ultimate scoring platform for competitions, tournaments, and events.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors text-2xl">📷</a>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors text-2xl">✖️</a>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors text-2xl">🎵</a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold mb-4 text-purple-400">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/events" className="text-gray-400 hover:text-white transition-colors">Events</Link></li>
                <li><Link href="/register" className="text-gray-400 hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold mb-4 text-purple-400">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} GameScore. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .glass-card {
          backdrop-filter: blur(16px) saturate(180%);
        }
      `}</style>
    </div>
  );
}
