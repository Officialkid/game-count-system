'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase-client';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { Maximize2, RefreshCw, Trophy, Medal, Award } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  color: string;
  total_points: number;
}

interface Event {
  id: string;
  name: string;
  eventMode: string;
  number_of_days: number;
  start_at: string;
}

export default function PublicScoreboardPage({ params }: { params: { token: string } }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showQR, setShowQR] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    let unsubscribeEvent: (() => void) | null = null;
    let unsubscribeTeams: (() => void) | null = null;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Hash the token to match database
        const crypto = await import('crypto');
        const tokenHash = crypto.createHash('sha256').update(params.token).digest('hex');

        // Query event by public_token_hash
        const eventsRef = collection(db, 'events');
        const eventQuery = query(eventsRef, where('public_token_hash', '==', tokenHash));
        
        // Subscribe to event changes
        unsubscribeEvent = onSnapshot(eventQuery, async (eventSnapshot) => {
          if (eventSnapshot.empty) {
            setError('Event not found. Please check your link.');
            setLoading(false);
            return;
          }

          const eventDoc = eventSnapshot.docs[0];
          const eventData = { id: eventDoc.id, ...eventDoc.data() } as Event;
          setEvent(eventData);

          // Subscribe to teams for this event
          const teamsRef = collection(db, 'teams');
          const teamsQuery = query(teamsRef, where('event_id', '==', eventData.id));

          unsubscribeTeams = onSnapshot(teamsQuery, (teamsSnapshot) => {
            const teamsData = teamsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            })) as Team[];

            // Sort by total_points descending
            teamsData.sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
            
            setTeams(teamsData);
            setLastUpdate(new Date());
            setLoading(false);
          }, (err) => {
            console.error('Teams subscription error:', err);
            setError('Failed to load teams');
            setLoading(false);
          });
        }, (err) => {
          console.error('Event subscription error:', err);
          setError('Failed to load event');
          setLoading(false);
        });

      } catch (err) {
        console.error('Load error:', err);
        setError('Failed to load scoreboard');
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubscribeEvent) unsubscribeEvent();
      if (unsubscribeTeams) unsubscribeTeams();
    };
  }, [params.token]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 font-medium">Loading scoreboard...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Scoreboard Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'Invalid or expired link'}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 ${fullscreen ? 'p-8' : 'p-4 md:p-8'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-6 md:p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold animate-pulse">
                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                LIVE
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-gray-900">
                {event.name}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                title="Refresh"
              >
                <RefreshCw size={20} className="text-gray-700" />
              </button>
              <button
                onClick={() => setShowQR(!showQR)}
                className="hidden md:block px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 transition"
              >
                {showQR ? 'Hide' : 'Show'} QR Code
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition"
                title="Fullscreen"
              >
                <Maximize2 size={20} />
              </button>
            </div>
          </div>

          <p className="text-gray-600 text-sm">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>

        {/* QR Code */}
        {showQR && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Scan to view on your phone</h3>
            <div className="inline-block p-4 bg-white rounded-xl">
              <QRCodeSVG value={currentUrl} size={200} />
            </div>
          </div>
        )}

        {/* Podium - Top 3 */}
        {teams.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-6 max-w-4xl mx-auto">
            {/* 2nd Place */}
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl p-6 text-center transform translate-y-8">
              <Medal size={40} className="text-gray-400 mx-auto mb-3" />
              <div className="text-4xl font-black text-gray-400 mb-2">2</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{teams[1]?.name}</h3>
              <div className="text-3xl font-black text-gray-700">{teams[1]?.total_points || 0}</div>
              <p className="text-sm text-gray-500 mt-1">points</p>
            </div>

            {/* 1st Place */}
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl shadow-2xl p-8 text-center transform scale-110">
              <Trophy size={48} className="text-white mx-auto mb-3" />
              <div className="text-5xl font-black text-white mb-2">1</div>
              <h3 className="text-2xl font-bold text-white mb-2 truncate">{teams[0]?.name}</h3>
              <div className="text-5xl font-black text-white">{teams[0]?.total_points || 0}</div>
              <p className="text-sm text-yellow-100 mt-1">points</p>
            </div>

            {/* 3rd Place */}
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl p-6 text-center transform translate-y-8">
              <Award size={40} className="text-orange-600 mx-auto mb-3" />
              <div className="text-4xl font-black text-orange-600 mb-2">3</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{teams[2]?.name}</h3>
              <div className="text-3xl font-black text-gray-700">{teams[2]?.total_points || 0}</div>
              <p className="text-sm text-gray-500 mt-1">points</p>
            </div>
          </div>
        )}

        {/* Full Rankings */}
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Full Rankings</h2>
          
          {teams.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-2xl text-gray-500 mb-2">No teams yet</p>
              <p className="text-gray-400">Teams will appear here once added</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teams.map((team, index) => {
                const position = index + 1;
                const isTop3 = position <= 3;
                
                return (
                  <div
                    key={team.id}
                    className={`flex items-center gap-4 p-4 md:p-6 rounded-2xl transition-all ${
                      isTop3
                        ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {/* Position */}
                    <div className={`flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center font-black text-xl md:text-2xl ${
                      position === 1 ? 'bg-yellow-400 text-yellow-900' :
                      position === 2 ? 'bg-gray-300 text-gray-700' :
                      position === 3 ? 'bg-orange-400 text-orange-900' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {position}
                    </div>

                    {/* Team Color */}
                    <div
                      className="flex-shrink-0 w-3 h-12 md:h-16 rounded-full"
                      style={{ backgroundColor: team.color }}
                    ></div>

                    {/* Team Name */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl md:text-3xl font-bold text-gray-900 truncate">
                        {team.name}
                      </h3>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-3xl md:text-5xl font-black text-gray-900">
                        {team.total_points || 0}
                      </div>
                      <p className="text-sm md:text-base text-gray-500 font-semibold">points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white/80 text-sm">
          <p>Powered by Game Count • Updates automatically</p>
        </div>
      </div>
    </div>
  );
}
