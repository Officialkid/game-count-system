/**
 * Get Event by Token
 * GET /api/event-by-token/{token}
 * Phase 1 Neon/Prisma migration slice
 */

import { getEventAccessByToken } from '@/lib/server/event-service';
import { forbidden, notFound, success, unauthorized, internalError } from '@/lib/api-responses';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const access = await getEventAccessByToken(token);

    if (!access) {
      return notFound('Invalid or expired token');
    }

    const headerAdmin = request.headers.get('x-admin-token');
    const headerScorer = request.headers.get('x-scorer-token');

    if (access.tokenType === 'admin' && headerAdmin !== token) {
      return unauthorized('Admin token required');
    }

    if (access.tokenType === 'scorer' && headerScorer !== token) {
      return unauthorized('Scorer token required');
    }

    if (access.event.eventStatus === 'archived') {
      return forbidden('Event has been archived');
    }

    const eventResponse: Record<string, unknown> = {
      id: access.event.id,
      name: access.event.name,
      mode: access.event.eventMode,
      status: access.event.eventStatus,
      scoringMode: access.event.scoringMode,
      number_of_days: access.event.numberOfDays,
      startDate: access.event.startAt,
      endDate: access.event.endAt,
      start_at: access.event.startAt,
      end_at: access.event.endAt,
      public_token: access.event.publicToken,
      is_finalized: access.event.isFinalized,
      theme_color: access.event.themeColor,
      logo_url: access.event.logoUrl,
    };

    if (access.tokenType === 'admin') {
      eventResponse.admin_token = access.event.adminToken;
      eventResponse.scorer_token = access.event.scorerToken;
      eventResponse.public_token = access.event.publicToken;
    }

    if (access.tokenType === 'scorer') {
      eventResponse.scorer_token = access.event.scorerToken;
    }

    return success({ event: eventResponse });
  } catch (error: any) {
    console.error('Get event by token error:', error);
    return internalError('Failed to get event', error?.message);
  }
}
