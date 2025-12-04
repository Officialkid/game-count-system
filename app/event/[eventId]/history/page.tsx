// app/event/[eventId]/history/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient, auth } from '@/lib/api-client';

interface Score {
  id: string;
  team_name: string;
  game_number: number;
  points: number;
  created_at: string;
  avatar_url?: string | null;
}

export default function EventHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string;

  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = auth.getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    if (eventId) {
      loadScores(token);
    }
  }, [eventId, router]);

  const loadScores = async (token: string) => {
    try {
      const response = await apiClient.getScoresByEvent(token, eventId);
      if (response.success) {
        setScores(response.data?.scores || []);
      } else {
        setError(response.error || 'Failed to load scores');
      }
    } catch (err) {
      setError('Failed to load scores');
    } finally {
      setLoading(false);
    }
  };

  // Group scores by game number
  const scoresByGame = scores.reduce((acc, score) => {
    if (!acc[score.game_number]) {
      acc[score.game_number] = [];
    }
    acc[score.game_number].push(score);
    return acc;
  }, {} as Record<number, Score[]>);

  const gameNumbers = Object.keys(scoresByGame)
    .map(Number)
    .sort((a, b) => b - a); // Most recent first

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href={`/event/${eventId}`}
          className="text-primary-600 hover:underline mb-2 block"
        >
          ← Back to Event
        </Link>
        <h1 className="text-4xl font-bold">Game History</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {scores.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-2">📋</div>
          <h3 className="text-xl font-semibold mb-2">No games played yet</h3>
          <p className="text-gray-600 mb-4">
            Start adding scores to see the game history!
          </p>
          <Link href={`/event/${eventId}`} className="btn-primary">
            Add Scores
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {gameNumbers.map((gameNumber) => (
            <div key={gameNumber} className="card">
              <div className="flex justify-between items-center mb-4 pb-3 border-b">
                <h2 className="text-2xl font-bold">Game {gameNumber}</h2>
                <span className="text-sm text-gray-500">
                  {new Date(
                    scoresByGame[gameNumber][0].created_at
                  ).toLocaleString()}
                </span>
              </div>

              <div className="space-y-3">
                {scoresByGame[gameNumber].map((score) => (
                  <div
                    key={score.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {score.avatar_url ? (
                        <img
                          src={score.avatar_url}
                          alt={score.team_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          {score.team_name[0]}
                        </div>
                      )}
                      <span className="font-semibold">{score.team_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-2xl font-bold ${
                          score.points > 0
                            ? 'text-green-600'
                            : score.points < 0
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {score.points > 0 ? '+' : ''}
                        {score.points}
                      </span>
                      <span className="text-sm text-gray-500">pts</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Total scores recorded:</span>
                  <span className="font-semibold">
                    {scoresByGame[gameNumber].length}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href={`/event/${eventId}`} className="btn-secondary">
          Back to Event
        </Link>
      </div>
    </div>
  );
}
