/**
 * Create Event API
 * POST /api/events
 * Public endpoint - no authentication required
 * Returns URLs with embedded tokens for admin, scorer, and public access
 */

import { NextResponse } from 'next/server';
import { createEvent } from '@/lib/db-access';
import { CreateEventSchema } from '@/lib/db-validations';
import { successResponse, errorResponse, ERROR_STATUS_MAP } from '@/lib/api-responses';
import { handleCors } from '@/lib/cors';
import { ZodError } from 'zod';

export async function POST(request: Request) {
  // Handle CORS
  const cors = handleCors(request);
  if (cors instanceof Response) {
    return cors;
  }
  const corsHeaders = cors;

  try {
    const body = await request.json();
    
    // Validate input
    const validated = CreateEventSchema.parse(body);
    
    // Create event with generated tokens
    const event = await createEvent(validated);
    
    // Build URLs with embedded tokens
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    return NextResponse.json(
      successResponse({
        event_id: event.id,
        admin_url: `${baseUrl}/admin/${event.admin_token}`,
        scorer_url: `${baseUrl}/score/${event.scorer_token}`,
        public_url: `${baseUrl}/events/${event.public_token}`,
      }),
      { status: 201, headers: corsHeaders as HeadersInit }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', error.errors[0]?.message || 'Invalid input'),
        { status: ERROR_STATUS_MAP.VALIDATION_ERROR, headers: corsHeaders as HeadersInit }
      );
    }
    
    console.error('Create event error:', error);
    
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', 'Failed to create event'),
      { status: ERROR_STATUS_MAP.INTERNAL_ERROR, headers: corsHeaders as HeadersInit }
    );
  }
}
