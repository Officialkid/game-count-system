const sdk = require('node-appwrite');

/**
 * submitScoreHandler (Node 18)
 * - Validates input
 * - Ensures idempotency via clientScoreId (if provided)
 * - Upserts score (event_id, team_id, game_number)
 * - Recomputes team.total_points from scores
 * - Checks ownership by comparing event.user_id with APPWRITE_FUNCTION_USER_ID
 * - Logs audit trail (Phase F)
 */
module.exports = async function (req, res) {
  try {
    const {
      APPWRITE_FUNCTION_ENDPOINT,
      APPWRITE_FUNCTION_PROJECT_ID,
      APPWRITE_API_KEY,
      APPWRITE_FUNCTION_USER_ID,
      APPWRITE_FUNCTION_LOG_AUDIT_ID, // Function ID for logAudit
    } = req.variables;

    const client = new sdk.Client()
      .setEndpoint(APPWRITE_FUNCTION_ENDPOINT)
      .setProject(APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(APPWRITE_API_KEY);

    const databases = new sdk.Databases(client);
    const functions = new sdk.Functions(client);

    const DATABASE_ID = 'main';
    const COLLECTIONS = {
      EVENTS: 'events',
      TEAMS: 'teams',
      SCORES: 'scores',
    };

    const body = req.body && typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { event_id, team_id, game_number, points, clientScoreId } = body;

    if (!event_id || !team_id || typeof game_number !== 'number' || typeof points !== 'number') {
      return res.json({ success: false, error: 'Missing required fields' }, 400);
    }

    // Permission check: only owner of the event can write
    const eventDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, event_id).catch(() => null);
    if (!eventDoc) return res.json({ success: false, error: 'Event not found' }, 404);
    if (eventDoc.user_id && APPWRITE_FUNCTION_USER_ID && eventDoc.user_id !== APPWRITE_FUNCTION_USER_ID) {
      return res.json({ success: false, error: 'Forbidden' }, 403);
    }

    // Idempotency: if clientScoreId provided, check if a score with same client_score_id exists
    if (clientScoreId) {
      const existingByClient = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SCORES, [
        sdk.Query.equal('client_score_id', clientScoreId),
      ]);
      if (existingByClient.total > 0) {
        return res.json({ success: true, data: { score: existingByClient.documents[0], idempotent: true } }, 200);
      }
    }

    // Upsert by composite key (event_id, team_id, game_number)
    const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SCORES, [
      sdk.Query.equal('event_id', event_id),
      sdk.Query.equal('team_id', team_id),
      sdk.Query.equal('game_number', game_number),
    ]);

    const now = new Date().toISOString();
    let scoreDoc;

    if (existing.total > 0) {
      // Update existing
      const current = existing.documents[0];
      scoreDoc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.SCORES, current.$id, {
        points,
        client_score_id: clientScoreId || current.client_score_id || null,
        updated_at: now,
      });
    } else {
      // Create new
      scoreDoc = await databases.createDocument(DATABASE_ID, COLLECTIONS.SCORES, sdk.ID.unique(), {
        event_id,
        team_id,
        game_number,
        points,
        client_score_id: clientScoreId || null,
        user_id: APPWRITE_FUNCTION_USER_ID || null,
        created_at: now,
      }, [`user:${eventDoc.user_id || APPWRITE_FUNCTION_USER_ID}`]);
    }

    // Log audit trail (async, don't wait for it)
    if (APPWRITE_FUNCTION_LOG_AUDIT_ID) {
      const auditAction = existing.total > 0 ? 'score.update' : 'score.create';
      functions.createExecution(
        APPWRITE_FUNCTION_LOG_AUDIT_ID,
        JSON.stringify({
          user_id: APPWRITE_FUNCTION_USER_ID || 'system',
          action: auditAction,
          entity: 'scores',
          record_id: scoreDoc.$id,
          details: {
            event_id,
            team_id,
            game_number,
            points,
            old_points: existing.total > 0 ? existing.documents[0].points : null,
          },
        }),
        true // async
      ).catch(err => console.log('Audit log failed:', err.message));
    }

    // Recompute team total points for consistency
    const allTeamScores = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SCORES, [
      sdk.Query.equal('event_id', event_id),
      sdk.Query.equal('team_id', team_id),
    ]);

    const totalPoints = allTeamScores.documents.reduce((sum, s) => sum + (typeof s.points === 'number' ? s.points : 0), 0);

    // Update team total
    const teamDoc = await databases.listDocuments(DATABASE_ID, COLLECTIONS.TEAMS, [
      sdk.Query.equal('event_id', event_id),
      sdk.Query.equal('$id', team_id),
    ]);

    if (teamDoc.total > 0) {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.TEAMS, team_id, {
        total_points: totalPoints,
      });
    }

    return res.json({ success: true, data: { score: scoreDoc, total_points: totalPoints } }, 200);
  } catch (err) {
    return res.json({ success: false, error: (err && err.message) || 'Internal Server Error' }, 500);
  }
};
