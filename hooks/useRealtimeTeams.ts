/**
 * Custom React Hook: useRealtimeTeams
 * 
 * Subscribes to Firebase Firestore teams subcollection in real-time using onSnapshot()
 * Structure: events/{eventId}/teams/{teamId}
 * Automatically calculates total scores from real-time score updates
 * 
 * Features:
 * - Real-time team updates
 * - Automatic score totals calculation from totalPoints field
 * - Rank tracking for animations
 * - Connection status tracking
 * - Proper cleanup on unmount
 * 
 * Usage:
 * const { teams, loading, error, connected, rankChanges } = useRealtimeTeams(eventId);
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { collection, query, onSnapshot, Unsubscribe, orderBy, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useRealtimeScores } from './useRealtimeScores';

export interface Team {
  id: string;
  event_id: string;
  name: string;
  color: string;
  created_at: string;
  total_points?: number;
}

export interface TeamWithScore extends Team {
  total_points: number;
  rank: number;
  previousRank?: number;
}

export interface RankChange {
  teamId: string;
  teamName: string;
  oldRank: number;
  newRank: number;
  direction: 'up' | 'down';
}

export interface UseRealtimeTeamsResult {
  teams: TeamWithScore[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  rankChanges: RankChange[];
}

/**
 * Hook to subscribe to real-time team updates with calculated scores
 */
export function useRealtimeTeams(eventId: string | null): UseRealtimeTeamsResult {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [rankChanges, setRankChanges] = useState<RankChange[]>([]);
  
  // Use real-time scores to calculate totals
  const { scores, connected: scoresConnected } = useRealtimeScores(eventId);
  
  // Track previous ranks for animation
  const prevRanksRef = useRef<Map<string, number>>(new Map());

  // Subscribe to teams collection
  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      setConnected(false);
      return;
    }

    let unsubscribe: Unsubscribe | null = null;
    let isSubscribed = true;

    const setupListener = async () => {
      try {
        // Query teams subcollection under this event
        const teamsRef = collection(doc(db, 'events', eventId), 'teams');
        const q = query(
          teamsRef,
          orderBy('totalPoints', 'desc')
        );

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (!isSubscribed) return;

            const teamsData: Team[] = snapshot.docs.map(teamDoc => {
              const data = teamDoc.data();
              return {
                id: teamDoc.id,
                event_id: eventId || '',
                name: data.name || 'Unnamed Team',
                color: data.color || '#3B82F6',
                created_at: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                total_points: data.totalPoints || 0,
              };
            });

            setTeams(teamsData);
            setLoading(false);
            setConnected(true);
            setError(null);

            // Log changes for debugging
            if (process.env.NODE_ENV === 'development') {
              snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                  console.log('🟢 New team:', change.doc.data().name);
                }
                if (change.type === 'modified') {
                  console.log('🟡 Modified team:', change.doc.data().name);
                }
                if (change.type === 'removed') {
                  console.log('🔴 Removed team:', change.doc.id);
                }
              });
            }
          },
          (err) => {
            console.error('❌ Realtime teams error:', err);
            
            if (!isSubscribed) return;

            setConnected(false);
            setLoading(false);
            
            if (err.code === 'permission-denied') {
              setError('Access denied. Please check your permissions.');
            } else {
              setError('Connection error. Some features may not be available.');
            }
          }
        );
      } catch (err: any) {
        console.error('❌ Failed to setup teams listener:', err);
        setError(err.message || 'Failed to connect to real-time updates');
        setLoading(false);
        setConnected(false);
      }
    };

    setupListener();

    return () => {
      isSubscribed = false;
      if (unsubscribe) {
        console.log('🔌 Unsubscribing from realtime teams');
        unsubscribe();
      }
    };
  }, [eventId]);

  // Calculate team totals and ranks from real-time scores
  const teamsWithScores = useMemo(() => {
    // Calculate total points per team from scores
    const teamTotals = new Map<string, number>();
    
    scores.forEach(score => {
      const current = teamTotals.get(score.team_id) || 0;
      teamTotals.set(score.team_id, current + score.final_score);
    });

    // Add totals to teams
    const teamsWithTotals = teams.map(team => ({
      ...team,
      total_points: teamTotals.get(team.id) || 0,
    }));

    // Sort by total points (descending), then by name
    const sorted = teamsWithTotals.sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }
      return a.name.localeCompare(b.name);
    });

    // Add ranks and detect changes
    const newRankChanges: RankChange[] = [];
    const teamsWithRanks = sorted.map((team, index) => {
      const rank = index + 1;
      const prevRank = prevRanksRef.current.get(team.id);
      
      // Detect rank changes
      if (prevRank !== undefined && prevRank !== rank) {
        newRankChanges.push({
          teamId: team.id,
          teamName: team.name,
          oldRank: prevRank,
          newRank: rank,
          direction: rank < prevRank ? 'up' : 'down',
        });
      }
      
      return {
        ...team,
        rank,
        previousRank: prevRank,
      };
    });

    // Update previous ranks
    const newRanksMap = new Map<string, number>();
    teamsWithRanks.forEach(team => {
      newRanksMap.set(team.id, team.rank);
    });
    prevRanksRef.current = newRanksMap;

    // Set rank changes and clear after animation duration
    if (newRankChanges.length > 0) {
      setRankChanges(newRankChanges);
      setTimeout(() => setRankChanges([]), 2000);
    }

    return teamsWithRanks;
  }, [teams, scores]);

  return {
    teams: teamsWithScores,
    loading,
    error,
    connected: connected && scoresConnected,
    rankChanges,
  };
}

/**
 * Hook to get team data by day for multi-day events
 */
export function useRealtimeTeamsByDay(eventId: string | null, dayNumber: number | null) {
  const { scores } = useRealtimeScores(eventId);
  const [teams] = useState<Team[]>([]);

  const teamsByDay = useMemo(() => {
    if (!dayNumber) return [];

    // Filter scores for specific day
    const dayScores = scores.filter(score => score.day_number === dayNumber);
    
    // Calculate totals per team for this day
    const teamTotals = new Map<string, number>();
    dayScores.forEach(score => {
      const current = teamTotals.get(score.team_id) || 0;
      teamTotals.set(score.team_id, current + score.final_score);
    });

    // Create team rankings for day
    const teamsWithDayScores = teams.map(team => ({
      ...team,
      total_points: teamTotals.get(team.id) || 0,
      rank: 0,
    }));

    // Sort and rank
    const sorted = teamsWithDayScores.sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points;
      }
      return a.name.localeCompare(b.name);
    });

    return sorted.map((team, index) => ({
      ...team,
      rank: index + 1,
    }));
  }, [scores, teams, dayNumber]);

  return teamsByDay;
}
