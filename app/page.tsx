// app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to Game Count
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Create events, track team scores, and share live scoreboards with your participants.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register" className="btn-primary text-lg px-8 py-3">
            Get Started
          </Link>
          <Link href="/login" className="btn-secondary text-lg px-8 py-3">
            Login
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-20">
        <div className="card text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">Track Scores</h3>
          <p className="text-gray-600">
            Record game scores in real-time and see live leaderboards
          </p>
        </div>
        <div className="card text-center">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-xl font-semibold mb-2">Manage Teams</h3>
          <p className="text-gray-600">
            Add teams, customize avatars, and organize competitions
          </p>
        </div>
        <div className="card text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h3 className="text-xl font-semibold mb-2">Share Results</h3>
          <p className="text-gray-600">
            Generate public links for participants to view live standings
          </p>
        </div>
      </div>
    </div>
  );
}
