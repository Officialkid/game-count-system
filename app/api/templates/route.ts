// app/api/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db, auth } from '@/lib';

/**
 * GET /api/templates
 * Fetch all templates for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = auth.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.userId;
    const client = await db.pool.connect();
    try {
      // Get all templates for user
      const templatesResult = await client.query(
        `SELECT 
          template_id,
          template_name,
          event_name_prefix,
          theme_color,
          logo_url,
          allow_negative,
          display_mode,
          created_at
        FROM event_templates
        WHERE user_id = $1
        ORDER BY created_at DESC`,
        [userId]
      );

      return NextResponse.json({ templates: templatesResult.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

/**
 * POST /api/templates
 * Create a new template from event configuration
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = auth.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { template_name, event_name_prefix, theme_color, logo_url, allow_negative, display_mode } = body;

    // Validate required fields
    if (!template_name || !event_name_prefix) {
      return NextResponse.json({ error: 'Template name and event name prefix are required' }, { status: 400 });
    }

    const client = await db.pool.connect();
    try {
      const userId = user.userId;

      // Create template
      const insertResult = await client.query(
        `INSERT INTO event_templates 
          (user_id, template_name, event_name_prefix, theme_color, logo_url, allow_negative, display_mode)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          userId,
          template_name,
          event_name_prefix,
          theme_color || '#8B5CF6',
          logo_url || null,
          allow_negative || false,
          display_mode || 'total'
        ]
      );

      return NextResponse.json({ template: insertResult.rows[0] }, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
