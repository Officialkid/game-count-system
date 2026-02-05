/**
 * Events API - Create New Event
 * Converted from PostgreSQL to Firestore
 * POST /api/events/create
 */

import { NextResponse } from 'next/server';
import { adminCreateDocument, adminQueryCollection } from '@/lib/firestore-admin-helpers';
import { COLLECTIONS, EventMode, EventStatus, ScoringMode } from '@/lib/firebase-collections';
import { 
  calculateAutoCleanupDate, 
  calculateEndDate, 
  validateModeConstraints,
  getEventModeConfig 
} from '@/lib/event-mode-helpers';
import { generateEventTokens, generateShareLink } from '@/lib/token-utils';

interface CreateEventRequest {
  name: string;
  number_of_days: number;
  scoringMode?: ScoringMode;
  
  // New mode fields
  eventMode?: EventMode;
  requiresAuthentication?: boolean;
  organizationId?: string;
  organizationName?: string;
  createdBy?: string;
}

export async function POST(request: Request) {
  try {
    const body: CreateEventRequest = await request.json();
    const { 
      name, 
      number_of_days, 
      scoringMode = 'continuous',
      eventMode = 'quick',
      requiresAuthentication,
      organizationId,
      organizationName,
      createdBy,
    } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Event name is required' },
        { status: 400 }
      );
    }

    if (!number_of_days || number_of_days < 1) {
      return NextResponse.json(
        { success: false, error: 'Number of days must be at least 1' },
        { status: 400 }
      );
    }

    // Get mode configuration
    const modeConfig = getEventModeConfig(eventMode);

    // Determine authentication requirement
    const authRequired = requiresAuthentication !== undefined 
      ? requiresAuthentication 
      : modeConfig.requiresAuth;

    // Validate mode constraints
    const validation = validateModeConstraints(eventMode, number_of_days, authRequired);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Mode validation failed',
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    // Advanced mode requires organization for some features
    if (eventMode === 'advanced' && modeConfig.features.organizations) {
      if (!organizationId || !organizationName) {
        return NextResponse.json(
          { success: false, error: 'Organization information required for Advanced mode' },
          { status: 400 }
        );
      }
    }

    // Generate secure tokens with hashing
    const tokens = generateEventTokens();

    // Calculate dates
    const start_at = new Date();
    const end_at = calculateEndDate(eventMode, start_at, number_of_days);
    const autoCleanupDate = calculateAutoCleanupDate(eventMode, start_at);

    // Create event in Firestore (store ONLY hashed tokens)
    const eventData = {
      name: name.trim(),
      
      // Mode configuration
      eventMode,
      eventStatus: 'draft' as EventStatus,
      requiresAuthentication: authRequired,
      ...(autoCleanupDate && { autoCleanupDate }),
      
      // Scoring configuration
      scoringMode,
      number_of_days,
      
      // Legacy status (for backward compatibility)
      status: 'active' as const,
      
      // Dates
      start_at: start_at.toISOString(),
      end_at: end_at.toISOString(),
      
      // Security tokens - store BOTH plain (for display/sharing) and hashed (for validation)
      // Plain tokens (for generating share links and displaying to admins)
      ...tokens.plain,
      // Hashed tokens (for secure validation during authentication)
      ...tokens.hashed,
      
      // Finalization
      is_finalized: false,
      
      // Organization (if provided)
      ...(organizationId && { organization_id: organizationId }),
      ...(organizationName && { organization_name: organizationName }),
      
      // Creator
      ...(createdBy && { created_by: createdBy }),
    };

    const eventId = await adminCreateDocument(COLLECTIONS.EVENTS, eventData);

    // If daily scoring mode, create event days
    if (scoringMode === 'daily' && modeConfig.features.multiDay) {
      const dayPromises = [];
      for (let day = 1; day <= number_of_days; day++) {
        const dayDate = new Date(start_at);
        dayDate.setDate(dayDate.getDate() + (day - 1));
        
        dayPromises.push(
          adminCreateDocument(COLLECTIONS.EVENT_DAYS, {
            event_id: eventId,
            day_number: day,
            date: dayDate.toISOString(),
            is_locked: false,
          })
        );
      }
      await Promise.all(dayPromises);
    }

    // Generate shareable links with plain tokens
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shareLinks = {
      admin: generateShareLink(eventId, tokens.plain.admin_token, 'admin', baseUrl),
      scorer: generateShareLink(eventId, tokens.plain.scorer_token, 'scorer', baseUrl),
      viewer: generateShareLink(eventId, tokens.plain.public_token, 'viewer', baseUrl),
    };

    return NextResponse.json({
      success: true,
      data: {
        event: {
          id: eventId,
          name: eventData.name,
          eventMode: eventData.eventMode,
          eventStatus: eventData.eventStatus,
          start_at: eventData.start_at,
          end_at: eventData.end_at,
        },
        // Return plain tokens ONCE (user must save these)
        tokens: tokens.plain,
        // Return shareable links
        shareLinks,
        modeInfo: {
          mode: eventMode,
          config: modeConfig,
          autoCleanup: autoCleanupDate ? true : false,
          maxDuration: modeConfig.maxDuration,
        },
      },
      message: '⚠️ IMPORTANT: Save these tokens! They will not be shown again.',
    }, { status: 201 });

  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create event',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
