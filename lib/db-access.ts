/**
 * Database Access Layer - Firestore CRUD Operations
 * All database queries for events, teams, scores, tokens
 */

import { db, convertTimestamps, timestampToISO } from './db-client';
import { Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// EVENTS
// ============================================================================

export interface Event {
  id: string;
  name: string;
  eventMode: 'quick' | 'multi-day' | 'custom';
  numberOfDays: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'archived';
  adminToken: string;
  scorerToken: string;
  viewerToken: string;
  dayLocking?: Record<string, { locked: boolean; lockedAt?: string }>;
  created_at: string;
  updated_at: string;
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const docRef = db.collection('events').doc(eventId);
  const docSnap = await docRef.get();
  
  if (!docSnap.exists) {
    return null;
  }
  
  return {
    id: docSnap.id,
    ...convertTimestamps(docSnap.data())
  } as Event;
}

export async function getEventByToken(token: string, requiredType?: 'admin' | 'scorer' | 'viewer' | 'public'): Promise<Event | null> {
  // Search across all events for this token
  const eventsSnapshot = await db.collection('events').get();
  
  for (const eventDoc of eventsSnapshot.docs) {
    const tokensSnapshot = await db.collection('events')
      .doc(eventDoc.id)
      .collection('tokens')
      .where('token', '==', token)
      .limit(1)
      .get();
    
    if (!tokensSnapshot.empty) {
      const tokenData = tokensSnapshot.docs[0].data();
      
      // If requiredType specified, validate token type
      if (requiredType && requiredType !== 'public') {
        const validTypes: Record<string, string[]> = {
          'admin': ['admin'],
          'scorer': ['admin', 'scorer'],
          'viewer': ['admin', 'scorer', 'viewer']
        };
        
        if (!validTypes[requiredType]?.includes(tokenData.type)) {
          return null; // Token doesn't have required permissions
        }
      }
      
      return {
        id: eventDoc.id,
        ...convertTimestamps(eventDoc.data())
      } as Event;
    }
  }
  
  return null;
}

export async function getAllEvents(): Promise<Event[]> {
  const snapshot = await db.collection('events')
    .orderBy('created_at', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  })) as Event[];
}

export async function getPastEvents(limit: number = 20): Promise<Event[]> {
  const snapshot = await db.collection('events')
    .where('status', 'in', ['completed', 'archived'])
    .orderBy('created_at', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  })) as Event[];
}

export async function createEvent(data: Partial<Event>): Promise<Event> {
  const timestamp = new Date().toISOString();
  const eventData = {
    ...data,
    created_at: timestamp,
    updated_at: timestamp
  };
  
  const docRef = await db.collection('events').add(eventData);
  
  return {
    id: docRef.id,
    ...eventData
  } as Event;
}

export async function updateEvent(eventId: string, data: Partial<Event>): Promise<Event> {
  const docRef = db.collection('events').doc(eventId);
  const updateData = {
    ...data,
    updated_at: new Date().toISOString()
  };
  
  await docRef.update(updateData);
  
  const updated = await docRef.get();
  return {
    id: updated.id,
    ...convertTimestamps(updated.data())
  } as Event;
}

export async function deleteEvent(eventId: string): Promise<void> {
  await db.collection('events').doc(eventId).delete();
}

// ============================================================================
// TEAMS
// ============================================================================

export interface Team {
  id: string;
  eventId: string;
  name: string;
  color: string;
  created_at: string;
  updated_at?: string;
}

export async function getTeamsByEvent(eventId: string): Promise<Team[]> {
  const snapshot = await db.collection('events')
    .doc(eventId)
    .collection('teams')
    .orderBy('created_at', 'asc')
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  })) as Team[];
}

export async function getTeam(eventId: string, teamId: string): Promise<Team | null> {
  const docRef = db.collection('events')
    .doc(eventId)
    .collection('teams')
    .doc(teamId);
  
  const docSnap = await docRef.get();
  
  if (!docSnap.exists) {
    return null;
  }
  
  return {
    id: docSnap.id,
    ...convertTimestamps(docSnap.data())
  } as Team;
}

export async function createTeam(eventId: string, data: Partial<Team>): Promise<Team> {
  const timestamp = new Date().toISOString();
  const teamData = {
    eventId,
    ...data,
    created_at: timestamp,
    updated_at: timestamp
  };
  
  const docRef = await db.collection('events')
    .doc(eventId)
    .collection('teams')
    .add(teamData);
  
  return {
    id: docRef.id,
    ...teamData
  } as Team;
}

export async function createTeamsBulk(eventId: string, teams: Partial<Team>[]): Promise<Team[]> {
  const batch = db.batch();
  const timestamp = new Date().toISOString();
  const createdTeams: Team[] = [];
  
  teams.forEach(team => {
    const docRef = db.collection('events')
      .doc(eventId)
      .collection('teams')
      .doc();
    
    const teamData = {
      eventId,
      ...team,
      created_at: timestamp,
      updated_at: timestamp
    };
    
    batch.set(docRef, teamData);
    createdTeams.push({
      id: docRef.id,
      ...teamData
    } as Team);
  });
  
  await batch.commit();
  return createdTeams;
}

export async function updateTeam(eventId: string, teamId: string, data: Partial<Team>): Promise<Team> {
  const docRef = db.collection('events')
    .doc(eventId)
    .collection('teams')
    .doc(teamId);
  
  const updateData = {
    ...data,
    updated_at: new Date().toISOString()
  };
  
  await docRef.update(updateData);
  
  const updated = await docRef.get();
  return {
    id: updated.id,
    ...convertTimestamps(updated.data())
  } as Team;
}

export async function deleteTeam(eventId: string, teamId: string): Promise<void> {
  await db.collection('events')
    .doc(eventId)
    .collection('teams')
    .doc(teamId)
    .delete();
}

// ============================================================================
// SCORES
// ============================================================================

export interface Score {
  id: string;
  eventId: string;
  teamId: string;
  day: number;
  points: number;
  penalty?: number;
  bonus?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export async function getScoresByEvent(eventId: string, day?: number): Promise<Score[]> {
  let query = db.collection('events')
    .doc(eventId)
    .collection('scores') as any;
  
  if (day !== undefined) {
    query = query.where('day', '==', day);
  }
  
  const snapshot = await query.orderBy('created_at', 'desc').get();
  
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  })) as Score[];
}

export async function getScoresByTeam(eventId: string, teamId: string): Promise<Score[]> {
  const snapshot = await db.collection('events')
    .doc(eventId)
    .collection('scores')
    .where('teamId', '==', teamId)
    .orderBy('created_at', 'asc')
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  })) as Score[];
}

export async function createScore(eventId: string, data: Partial<Score>): Promise<Score> {
  const timestamp = new Date().toISOString();
  const scoreData = {
    eventId,
    ...data,
    created_at: timestamp,
    updated_at: timestamp
  };
  
  const docRef = await db.collection('events')
    .doc(eventId)
    .collection('scores')
    .add(scoreData);
  
  return {
    id: docRef.id,
    ...scoreData
  } as Score;
}

export async function createScoresBulk(eventId: string, scores: Partial<Score>[]): Promise<Score[]> {
  const batch = db.batch();
  const timestamp = new Date().toISOString();
  const createdScores: Score[] = [];
  
  scores.forEach(score => {
    const docRef = db.collection('events')
      .doc(eventId)
      .collection('scores')
      .doc();
    
    const scoreData = {
      eventId,
      ...score,
      created_at: timestamp,
      updated_at: timestamp
    };
    
    batch.set(docRef, scoreData);
    createdScores.push({
      id: docRef.id,
      ...scoreData
    } as Score);
  });
  
  await batch.commit();
  return createdScores;
}

export async function updateScore(eventId: string, scoreId: string, data: Partial<Score>): Promise<Score> {
  const docRef = db.collection('events')
    .doc(eventId)
    .collection('scores')
    .doc(scoreId);
  
  const updateData = {
    ...data,
    updated_at: new Date().toISOString()
  };
  
  await docRef.update(updateData);
  
  const updated = await docRef.get();
  return {
    id: updated.id,
    ...convertTimestamps(updated.data())
  } as Score;
}

export async function deleteScore(eventId: string, scoreId: string): Promise<void> {
  await db.collection('events')
    .doc(eventId)
    .collection('scores')
    .doc(scoreId)
    .delete();
}

// ============================================================================
// TOKENS
// ============================================================================

export interface Token {
  id: string;
  eventId: string;
  token: string;
  type: 'admin' | 'scorer' | 'viewer';
  created_at: string;
}

export async function getTokensByEvent(eventId: string): Promise<Token[]> {
  const snapshot = await db.collection('events')
    .doc(eventId)
    .collection('tokens')
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  })) as Token[];
}

export async function getTokenByValue(eventId: string, tokenValue: string): Promise<Token | null> {
  const snapshot = await db.collection('events')
    .doc(eventId)
    .collection('tokens')
    .where('token', '==', tokenValue)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  return {
    id: snapshot.docs[0].id,
    ...convertTimestamps(snapshot.docs[0].data())
  } as Token;
}

export async function createToken(eventId: string, data: Partial<Token>): Promise<Token> {
  const timestamp = new Date().toISOString();
  const tokenData = {
    eventId,
    ...data,
    created_at: timestamp
  };
  
  const docRef = await db.collection('events')
    .doc(eventId)
    .collection('tokens')
    .add(tokenData);
  
  return {
    id: docRef.id,
    ...tokenData
  } as Token;
}

// ============================================================================
// SCORE HISTORY
// ============================================================================

export interface ScoreHistory {
  id: string;
  eventId: string;
  scoreId: string;
  teamId: string;
  action: 'created' | 'updated' | 'deleted';
  previousValue?: any;
  newValue?: any;
  created_at: string;
}

export async function getScoreHistory(eventId: string, scoreId?: string): Promise<ScoreHistory[]> {
  let query = db.collection('events')
    .doc(eventId)
    .collection('score_history') as any;
  
  if (scoreId) {
    query = query.where('scoreId', '==', scoreId);
  }
  
  const snapshot = await query.orderBy('created_at', 'desc').get();
  
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...convertTimestamps(doc.data())
  })) as ScoreHistory[];
}

export async function createScoreHistory(eventId: string, data: Partial<ScoreHistory>): Promise<ScoreHistory> {
  const timestamp = new Date().toISOString();
  const historyData = {
    eventId,
    ...data,
    created_at: timestamp
  };
  
  const docRef = await db.collection('events')
    .doc(eventId)
    .collection('score_history')
    .add(historyData);
  
  return {
    id: docRef.id,
    ...historyData
  } as ScoreHistory;
}

// ============================================================================
// BACKWARDS COMPATIBILITY ALIASES
// ============================================================================

// Old function names for compatibility
export const addTeam = createTeam;
export const addScore = createScore;
export const getEventById = getEvent;
export const listTeamsWithTotals = getTeamsByEvent;
export const listScores = getScoresByEvent;
export const listScoresByDay = getScoresByEvent; // Now accepts day parameter
export const listEventDays = async (eventId: string) => {
  // For multi-day events, return day info
  const event = await getEvent(eventId);
  if (!event) return [];
  
  const days = [];
  for (let i = 1; i <= event.numberOfDays; i++) {
    days.push({
      day_number: i,
      locked: event.dayLocking?.[`day${i}`]?.locked || false
    });
  }
  return days;
};

// Cleanup functions for expired events
export async function markExpiredEvents(): Promise<number> {
  // Mark events as archived if past end date
  const events = await getAllEvents();
  let markedCount = 0;
  
  for (const event of events) {
    if (event.status === 'active' && new Date(event.endDate) < new Date()) {
      await updateEvent(event.id, { status: 'archived' });
      markedCount++;
    }
  }
  
  return markedCount;
}

export async function cleanupExpiredEvents(): Promise<number> {
  // Archive completed events
  return markExpiredEvents();
}

// Day management for multi-day events
export async function createDayIfNotExists(eventId: string, dayNumber: number): Promise<void> {
  // Days are now part of event document, no separate collection
  const event = await getEvent(eventId);
  if (!event) throw new Error('Event not found');
  
  // Ensure day is within range
  if (dayNumber < 1 || dayNumber > event.numberOfDays) {
    throw new Error(`Invalid day number: ${dayNumber}`);
  }
  
  // Initialize day locking if not present
  if (!event.dayLocking) {
    const dayLocking: Record<string, { locked: boolean }> = {};
    for (let i = 1; i <= event.numberOfDays; i++) {
      dayLocking[`day${i}`] = { locked: false };
    }
    await updateEvent(eventId, { dayLocking });
  }
}

export async function getEventDay(eventId: string, dayNumber: number) {
  const event = await getEvent(eventId);
  if (!event) return null;
  
  return {
    day_number: dayNumber,
    locked: event.dayLocking?.[`day${dayNumber}`]?.locked || false,
    event_id: eventId
  };
}
