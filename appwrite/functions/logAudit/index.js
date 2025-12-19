/**
 * Appwrite Function: logAudit
 * 
 * Creates audit log entries for all important operations
 * Phase F: Admin, Emails, Audit
 * 
 * Input JSON:
 * {
 *   "user_id": "string",
 *   "action": "string",           // e.g., "score.create", "event.update", "user.delete"
 *   "entity": "string",            // e.g., "scores", "events", "users"
 *   "record_id": "string",         // Document ID of affected record
 *   "details": {},                 // Optional: Additional context (changes, metadata)
 *   "ip_address": "string",        // Optional: Client IP
 *   "user_agent": "string"         // Optional: Client user agent
 * }
 * 
 * Output:
 * {
 *   "success": true,
 *   "audit_id": "string"
 * }
 */

import { Client, Databases, ID } from 'node-appwrite';

// Environment variables set by Appwrite
const APPWRITE_ENDPOINT = process.env.APPWRITE_FUNCTION_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

// Database and collection IDs
const DATABASE_ID = 'main';
const AUDIT_LOGS_COLLECTION = 'audit_logs';

/**
 * Main function handler
 */
export default async ({ req, res, log, error }) => {
  try {
    // Parse input
    const payload = JSON.parse(req.body || '{}');
    const {
      user_id,
      action,
      entity,
      record_id,
      details = {},
      ip_address = null,
      user_agent = null,
    } = payload;

    // Validate required fields
    if (!user_id) {
      return res.json({ success: false, error: 'Missing user_id' }, 400);
    }
    if (!action) {
      return res.json({ success: false, error: 'Missing action' }, 400);
    }
    if (!entity) {
      return res.json({ success: false, error: 'Missing entity' }, 400);
    }
    if (!record_id) {
      return res.json({ success: false, error: 'Missing record_id' }, 400);
    }

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setKey(APPWRITE_API_KEY);

    const databases = new Databases(client);

    // Create audit log entry
    const timestamp = new Date().toISOString();
    const auditEntry = {
      user_id,
      action,
      entity,
      record_id,
      details: details || {},
      ip_address,
      user_agent,
      timestamp,
    };

    log(`Creating audit log: ${action} on ${entity}/${record_id} by user ${user_id}`);

    const auditDoc = await databases.createDocument(
      DATABASE_ID,
      AUDIT_LOGS_COLLECTION,
      ID.unique(),
      auditEntry
    );

    log(`Audit log created: ${auditDoc.$id}`);

    return res.json({
      success: true,
      data: {
        audit_id: auditDoc.$id,
        timestamp,
      },
    });

  } catch (err) {
    error('Audit logging failed:', err);
    return res.json(
      {
        success: false,
        error: err.message || 'Failed to create audit log',
      },
      500
    );
  }
};
