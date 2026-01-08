/**
 * Create Event API
 * POST /api/events
 * Public endpoint - no authentication required
 * Returns URLs with embedded tokens for admin, scorer, and public access
 */

import { NextResponse } from 'next/server';
import { createEvent, createDayIfNotExists } from '@/lib/db-access';
import { CreateEventSchema } from '@/lib/db-validations';
import { successResponse, errorResponse, ERROR_STATUS_MAP } from '@/lib/api-responses';
import { handleCors } from '@/lib/cors';
import { ZodError } from 'zod';

export async function POST(request: Request) {
  console.log('[CREATE EVENT] Request received');
  
  // Handle CORS
  const cors = handleCors(request);
  if (cors instanceof Response) {
    return cors;
  }
  const corsHeaders = cors;

  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('[CREATE EVENT] Request body:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('[CREATE EVENT] Failed to parse JSON:', parseError);
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid JSON in request body'),
        { status: 400, headers: corsHeaders as HeadersInit }
      );
    }
    
    // Validate input with Zod
    let validated;
    try {
      validated = CreateEventSchema.parse(body);
      console.log('[CREATE EVENT] Validated input:', JSON.stringify(validated, null, 2));
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('[CREATE EVENT] Validation error:', error.errors);
        return NextResponse.json(
          errorResponse('VALIDATION_ERROR', error.errors[0]?.message || 'Invalid input'),
          { status: 400, headers: corsHeaders as HeadersInit }
        );
      }
      throw error;
    }
    
    // Create event with generated tokens
    let event;
    try {
      console.log('[CREATE EVENT] Calling createEvent...');
      event = await createEvent(validated);
      console.log('[CREATE EVENT] Event created successfully:', {
        id: event.id,
        name: event.name,
        mode: event.mode,
        admin_token: event.admin_token?.substring(0, 8) + '...',
        scorer_token: event.scorer_token?.substring(0, 8) + '...',
        public_token: event.public_token?.substring(0, 8) + '...',
      });

      // Create event days if this is a camp event with specified days
      if (event.mode === 'camp' && body.number_of_days) {
        const numberOfDays = parseInt(body.number_of_days, 10);
        console.log(`[CREATE EVENT] Creating ${numberOfDays} days for camp event`);
        
        for (let dayNum = 1; dayNum <= numberOfDays; dayNum++) {
          await createDayIfNotExists({
            event_id: event.id,
            day_number: dayNum,
            label: `Day ${dayNum}`
          });
        }
        console.log(`[CREATE EVENT] Created ${numberOfDays} event days`);
      }
    } catch (dbError: any) {
      console.error('[CREATE EVENT] Database error:', {
        message: dbError?.message,
        stack: dbError?.stack,
        code: dbError?.code,
        detail: dbError?.detail,
      });
      return NextResponse.json(
        errorResponse('INTERNAL_ERROR', `Database error: ${dbError?.message || 'Unknown error'}`),
        { status: 500, headers: corsHeaders as HeadersInit }
      );
    }
    
    // Build URLs with embedded tokens
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log('[CREATE EVENT] Using base URL:', baseUrl);
    
    const response = {
      event_id: event.id,
      admin_url: `${baseUrl}/admin/${event.admin_token}`,
      scorer_url: `${baseUrl}/score/${event.scorer_token}`,
      public_url: `${baseUrl}/events/${event.public_token}`,
    };
    
    console.log('[CREATE EVENT] Returning success response');
    return NextResponse.json(
      successResponse(response),
      { status: 201, headers: corsHeaders as HeadersInit }
    );
  } catch (error: any) {
    console.error('[CREATE EVENT] Unexpected error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', `Server error: ${error?.message || 'Unknown error'}`),
      { status: 500, headers: corsHeaders as HeadersInit }
    );
  }
}
