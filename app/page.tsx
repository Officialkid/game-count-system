'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import HeroCarousel from '@/components/HeroCarousel';

export default function HomePage() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    // Check if user has seen tutorial
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setTimeout(() => setShowTutorial(true), 2000);
    }
  }, []);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  const tutorialSteps = [
    {
      title: "Welcome! 👋",
      description: "GameScore is the simplest way to track scores for any event. No signup, no hassle.",
      emoji: "🎯"
    },
    {
      title: "Create Your Event",
      description: "Click 'Start Creating Events' to get unique links for managing your competition.",
      emoji: "✨"
    },
    {
      title: "That's It!",
      description: "Share links with your team, add scores, and watch the live scoreboard. Easy!",
      emoji: "🚀"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50">
      <Navbar />
      {/* WhatsApp Floating Button for inquiries */}
      <a
        href="https://wa.me/254745169345?text=Hello%20GameScore%20team%2C%20I%20have%20an%20inquiry."
        target="_blank"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg bg-green-500 text-white hover:bg-green-600"
      >
        <span className="inline-block w-5 h-5">💬</span>
        <span className="font-semibold">WhatsApp</span>
      </a>

      {/* Hero Carousel Section */}
      <section id="home" className="pt-16">
        <HeroCarousel />

      </section>

      {/* CTA Buttons */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/events/create"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300 font-semibold text-lg w-full sm:w-auto group"
            >
              Start Creating Events
              <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <button
              onClick={() => setShowTutorial(true)}
              className="px-8 py-4 bg-white/80 backdrop-blur-lg border-2 border-purple-200 text-purple-600 rounded-xl hover:shadow-xl hover:scale-105 transform transition-all duration-300 font-semibold text-lg w-full sm:w-auto"
            >
              Watch Quick Tutorial
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>No signup required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Live updates</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>100% free</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 3 Steps */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gray-900">
            How It Works
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Get started in under 60 seconds
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute -top-4 left-8 w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                1
              </div>
              <div className="mt-4">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Create Event</h3>
                <p className="text-gray-600 leading-relaxed">
                  Enter your event name and start time. Get instant access links for admin, scoring, and public viewing.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute -top-4 left-8 w-12 h-12 bg-gradient-to-r from-pink-600 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                2
              </div>
              <div className="mt-4">
                <div className="text-5xl mb-4">👥</div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Add Teams & Score</h3>
                <p className="text-gray-600 leading-relaxed">
                  Use your admin link to add teams. Then use the scorer link to enter points as your event unfolds.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute -top-4 left-8 w-12 h-12 bg-gradient-to-r from-amber-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                3
              </div>
              <div className="mt-4">
                <div className="text-5xl mb-4">📺</div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">View Live Results</h3>
                <p className="text-gray-600 leading-relaxed">
                  Share the public scoreboard with everyone. It updates automatically — no refreshing needed!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Everything You Need
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex gap-4 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl">⚡</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
                <p className="text-gray-600 text-sm">Updates appear instantly on all connected devices</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl">🔗</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Secure Access Links</h3>
                <p className="text-gray-600 text-sm">Control who can add teams, enter scores, or just view results</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl">📱</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Mobile Friendly</h3>
                <p className="text-gray-600 text-sm">Works perfectly on phones, tablets, and computers</p>
              </div>
            </div>

            <div className="flex gap-4 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl">🎨</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Clean Design</h3>
                <p className="text-gray-600 text-sm">Beautiful scoreboards that put your event in the spotlight</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Create your first event in less than a minute
          </p>
          <Link
            href="/events/create"
            className="inline-block px-10 py-4 bg-white text-purple-600 rounded-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300 font-bold text-lg"
          >
            Create Free Event →
          </Link>
        </div>
      </section>

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative animate-scale-in">
            <button
              onClick={closeTutorial}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
            >
              ✕
            </button>

            <div className="text-center">
              <div className="text-6xl mb-6">{tutorialSteps[tutorialStep].emoji}</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                {tutorialSteps[tutorialStep].title}
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                {tutorialSteps[tutorialStep].description}
              </p>

              {/* Progress dots */}
              <div className="flex justify-center gap-2 mb-6">
                {tutorialSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === tutorialStep
                        ? 'w-8 bg-purple-600'
                        : 'w-2 bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-3">
                {tutorialStep < tutorialSteps.length - 1 ? (
                  <>
                    <button
                      onClick={closeTutorial}
                      className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => setTutorialStep(tutorialStep + 1)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
                    >
                      Next
                    </button>
                  </>
                ) : (
                  <Link
                    href="/events/create"
                    onClick={closeTutorial}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow text-center"
                  >
                    Create My First Event
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
