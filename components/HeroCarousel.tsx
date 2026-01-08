'use client';

import { useState, useEffect } from 'react';

const slides = [
  {
    title: 'GameScore',
    subtitle: 'Live Scoring Made Simple',
    description: 'Track competitions in real-time with zero hassle',
    gradient: 'from-purple-600 via-pink-600 to-purple-600',
    bgPattern: 'bg-gradient-to-br from-purple-50 to-pink-50',
  },
  {
    title: 'GameScore',
    subtitle: 'Perfect for Any Event',
    description: 'Sports days, tournaments, quiz nights, and more',
    gradient: 'from-blue-600 via-cyan-600 to-blue-600',
    bgPattern: 'bg-gradient-to-br from-blue-50 to-cyan-50',
  },
  {
    title: 'GameScore',
    subtitle: 'No Signup Required',
    description: 'Create events instantly and share with anyone',
    gradient: 'from-amber-600 via-orange-600 to-amber-600',
    bgPattern: 'bg-gradient-to-br from-amber-50 to-orange-50',
  },
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[500px] md:h-[600px] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ${
            index === currentSlide
              ? 'opacity-100 translate-x-0'
              : index < currentSlide
              ? 'opacity-0 -translate-x-full'
              : 'opacity-0 translate-x-full'
          }`}
        >
          <div className={`h-full flex items-center justify-center ${slide.bgPattern}`}>
            <div className="text-center px-4 max-w-4xl">
              <h1
                className={`text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent animate-fade-in`}
              >
                {slide.title}
              </h1>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {slide.subtitle}
              </h2>
              <p className="text-xl md:text-2xl text-gray-600">
                {slide.description}
              </p>

              {/* Decorative elements */}
              <div className="absolute top-20 left-10 w-20 h-20 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute bottom-20 right-10 w-32 h-32 bg-pink-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 right-20 w-16 h-16 bg-amber-200 rounded-full opacity-20 animate-pulse delay-500"></div>
            </div>
          </div>
        </div>
      ))}

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all ${
              index === currentSlide
                ? 'w-12 h-3 bg-purple-600'
                : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
            } rounded-full`}
            aria-label={`Go to slide ${index + 1}`}
          ></button>
        ))}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .delay-500 {
          animation-delay: 500ms;
        }

        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
}
