import Link from 'next/link';

export default function HomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50">
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
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

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300 font-semibold text-lg w-full sm:w-auto group"
              >
                Start Creating Events
                <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/public"
                className="px-8 py-4 bg-white/80 backdrop-blur-lg border-2 border-purple-200 text-purple-600 rounded-xl hover:shadow-xl hover:scale-105 transform transition-all duration-300 font-semibold text-lg w-full sm:w-auto"
              >
                View Public Events
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
