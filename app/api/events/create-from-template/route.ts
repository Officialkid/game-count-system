// app/api/events/create-from-template/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db, getTemplateById } from '@/lib/db';

/**
 * POST /api/events/create-from-template
 * Create a new event from a template
 * Body: { template_id: number, event_name?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = requireAuth(req);
    if (!authResult.authenticated) {
      return authResult.error;
    }

    const { user } = authResult;
    const body = await req.json();
    const { template_id, event_name } = body;

    if (!template_id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const userId = Number(user.userId);

    // Get template by ID and verify ownership
    const template = await getTemplateById(template_id, userId);

    if (!template) {
      return NextResponse.json({ error: 'Template not found or unauthorized' }, { status: 404 });
    }

    // Create event from template using db.createEvent signature
    const newEvent = await db.createEvent(
      user.userId,
      event_name || template.event_name_prefix || 'New Event',
      template.theme_color || 'purple',
      template.logo_url || null,
      template.allow_negative || false,
      template.display_mode || 'cumulative',
      3 // Default number of teams
    );

    return NextResponse.json({ 
      success: true,
      event: newEvent 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating event from template:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create event from template' 
    }, { status: 500 });
  }
}
