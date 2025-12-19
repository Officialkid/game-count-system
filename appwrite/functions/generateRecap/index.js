const sdk = require('node-appwrite');

/**
 * generateRecap (Node 18)
 * - Aggregates scores per team for an event
 * - Builds recap snapshot and stores in `recaps` collection
 * - Can be triggered via HTTP or automation when event status becomes 'completed'
 */
module.exports = async function (req, res) {
  try {
    const {
      APPWRITE_FUNCTION_ENDPOINT,
      APPWRITE_FUNCTION_PROJECT_ID,
      APPWRITE_API_KEY,
      APPWRITE_FUNCTION_USER_ID,
    } = req.variables;

    const client = new sdk.Client()
      .setEndpoint(APPWRITE_FUNCTION_ENDPOINT)
      .setProject(APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(APPWRITE_API_KEY);

    const databases = new sdk.Databases(client);

    const DATABASE_ID = 'main';
    const COLLECTIONS = {
      EVENTS: 'events',
      TEAMS: 'teams',
      SCORES: 'scores',
      RECAPS: 'recaps',
    };

    const body = req.body && typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { event_id } = body;
    if (!event_id) return res.json({ success: false, error: 'event_id required' }, 400);

    const eventDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, event_id).catch(() => null);
    if (!eventDoc) return res.json({ success: false, error: 'Event not found' }, 404);
    if (eventDoc.user_id && APPWRITE_FUNCTION_USER_ID && eventDoc.user_id !== APPWRITE_FUNCTION_USER_ID) {
      return res.json({ success: false, error: 'Forbidden' }, 403);
    }

    const teamsRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TEAMS, [
      sdk.Query.equal('event_id', event_id),
    ]);

    const scoresRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SCORES, [
      sdk.Query.equal('event_id', event_id),
    ]);

    const scores = scoresRes.documents || [];

    // Aggregate totals per team
    const totals = new Map();
    for (const s of scores) {
      const prev = totals.get(s.team_id) || 0;
      totals.set(s.team_id, prev + (typeof s.points === 'number' ? s.points : 0));
    }

    // Build final leaderboard
    const leaderboard = (teamsRes.documents || []).map((t) => ({
      team_id: t.$id,
      team_name: t.team_name,
      total_points: totals.get(t.$id) || 0,
    }))
    .sort((a, b) => b.total_points - a.total_points)
    .map((t, idx) => ({ ...t, rank: idx + 1 }));

    const top = leaderboard[0] || null;

    const snapshot = {
      event_id,
      event_name: eventDoc.event_name,
      total_games: [...new Set(scores.map((s) => s.game_number))].length,
      total_teams: teamsRes.total,
      final_leaderboard: leaderboard,
      top_scorer: top
        ? { team_id: top.team_id, team_name: top.team_name, total_points: top.total_points }
        : undefined,
      winner: top
        ? { team_id: top.team_id, team_name: top.team_name, total_points: top.total_points }
        : undefined,
      highlights: [],
    };

    const recap = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.RECAPS,
      sdk.ID.unique(),
      {
        event_id,
        snapshot,
        generated_at: new Date().toISOString(),
      },
      [`user:${eventDoc.user_id || APPWRITE_FUNCTION_USER_ID}`]
    );

    return res.json({ success: true, data: { recap } }, 200);
  } catch (err) {
    return res.json({ success: false, error: (err && err.message) || 'Internal Server Error' }, 500);
  }
};
