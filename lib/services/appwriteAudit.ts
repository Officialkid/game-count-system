/**
 * Appwrite Audit Logs Service
 * 
 * Query and create audit log entries
 * Phase F: Admin, Emails, Audit
 */

import { databases, functions } from '@/lib/appwrite';
import { Query } from 'appwrite';

const DATABASE_ID = 'main';
const COLLECTION_ID = 'audit_logs';

export interface AuditLog {
  $id: string;
  user_id: string;
  action: string;
  entity: string;
  record_id: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface CreateAuditLogParams {
  user_id: string;
  action: string;
  entity: string;
  record_id: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Create an audit log entry
 * Calls the logAudit Appwrite Function
 * 
 * @param params - Audit log parameters
 * @returns Success status with audit ID
 */
export async function createAuditLog(
  params: CreateAuditLogParams
): Promise<{ success: boolean; data?: { audit_id: string }; error?: string }> {
  try {
    const functionId = process.env.NEXT_PUBLIC_APPWRITE_FUNCTION_LOG_AUDIT;
    
    if (!functionId) {
      console.warn('Audit logging disabled: NEXT_PUBLIC_APPWRITE_FUNCTION_LOG_AUDIT not set');
      return { success: false, error: 'Audit function not configured' };
    }

    const execution = await functions.createExecution(
      functionId,
      JSON.stringify(params),
      true // async
    );

    return {
      success: true,
      data: { audit_id: execution.$id },
    };
  } catch (err: any) {
    console.error('Failed to create audit log:', err);
    return {
      success: false,
      error: err.message || 'Failed to create audit log',
    };
  }
}

/**
 * Get all audit logs with optional filters
 * 
 * @param filters - Query filters
 * @returns List of audit logs
 */
export async function getAuditLogs(filters?: {
  user_id?: string;
  action?: string;
  entity?: string;
  record_id?: string;
  limit?: number;
  offset?: number;
}): Promise<{ success: boolean; data?: { logs: AuditLog[]; total: number }; error?: string }> {
  try {
    const queries: string[] = [];

    if (filters?.user_id) {
      queries.push(Query.equal('user_id', filters.user_id));
    }
    if (filters?.action) {
      queries.push(Query.equal('action', filters.action));
    }
    if (filters?.entity) {
      queries.push(Query.equal('entity', filters.entity));
    }
    if (filters?.record_id) {
      queries.push(Query.equal('record_id', filters.record_id));
    }

    queries.push(Query.orderDesc('timestamp'));

    if (filters?.limit) {
      queries.push(Query.limit(filters.limit));
    }
    if (filters?.offset) {
      queries.push(Query.offset(filters.offset));
    }

    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, queries);

    return {
      success: true,
      data: {
        logs: result.documents as unknown as AuditLog[],
        total: result.total,
      },
    };
  } catch (err: any) {
    console.error('Failed to get audit logs:', err);
    return {
      success: false,
      error: err.message || 'Failed to get audit logs',
    };
  }
}

/**
 * Get audit logs for a specific user
 * 
 * @param userId - User ID to filter by
 * @param limit - Max number of logs to return
 * @returns List of user's audit logs
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50
): Promise<{ success: boolean; data?: { logs: AuditLog[] }; error?: string }> {
  const result = await getAuditLogs({ user_id: userId, limit });
  
  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: { logs: result.data!.logs },
  };
}

/**
 * Get audit logs for a specific record
 * 
 * @param entity - Entity type (e.g., 'events', 'scores')
 * @param recordId - Record ID
 * @returns List of audit logs for the record
 */
export async function getRecordAuditLogs(
  entity: string,
  recordId: string
): Promise<{ success: boolean; data?: { logs: AuditLog[] }; error?: string }> {
  const result = await getAuditLogs({ entity, record_id: recordId });
  
  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: { logs: result.data!.logs },
  };
}

/**
 * Get recent audit logs (last N entries)
 * 
 * @param limit - Number of logs to return (default: 100)
 * @returns Recent audit logs
 */
export async function getRecentAuditLogs(
  limit: number = 100
): Promise<{ success: boolean; data?: { logs: AuditLog[] }; error?: string }> {
  const result = await getAuditLogs({ limit });
  
  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: { logs: result.data!.logs },
  };
}

/**
 * Get audit logs by action type
 * 
 * @param action - Action type (e.g., 'score.create', 'event.delete')
 * @param limit - Max number of logs
 * @returns Filtered audit logs
 */
export async function getAuditLogsByAction(
  action: string,
  limit: number = 50
): Promise<{ success: boolean; data?: { logs: AuditLog[] }; error?: string }> {
  const result = await getAuditLogs({ action, limit });
  
  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: { logs: result.data!.logs },
  };
}

/**
 * Get audit statistics
 * Counts logs by action type
 * 
 * @returns Stats object with counts per action
 */
export async function getAuditStats(): Promise<{
  success: boolean;
  data?: {
    total: number;
    by_action: Record<string, number>;
    by_entity: Record<string, number>;
  };
  error?: string;
}> {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.limit(1000)] // Get last 1000 logs for stats
    );

    const logs = result.documents as unknown as AuditLog[];
    
    const by_action: Record<string, number> = {};
    const by_entity: Record<string, number> = {};

    logs.forEach(log => {
      by_action[log.action] = (by_action[log.action] || 0) + 1;
      by_entity[log.entity] = (by_entity[log.entity] || 0) + 1;
    });

    return {
      success: true,
      data: {
        total: result.total,
        by_action,
        by_entity,
      },
    };
  } catch (err: any) {
    console.error('Failed to get audit stats:', err);
    return {
      success: false,
      error: err.message || 'Failed to get audit stats',
    };
  }
}

/**
 * Helper: Log a frontend action (for client-side audit trails)
 * 
 * @param action - Action name
 * @param entity - Entity type
 * @param recordId - Record ID
 * @param details - Additional details
 */
export async function logAction(
  action: string,
  entity: string,
  recordId: string,
  details?: Record<string, any>
): Promise<void> {
  // This would typically get user ID from auth context
  // For now, we'll skip if not available
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) return;

    await createAuditLog({
      user_id: user.id,
      action,
      entity,
      record_id: recordId,
      details,
    });
  } catch (err) {
    console.error('Failed to log action:', err);
  }
}
