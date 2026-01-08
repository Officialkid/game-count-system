import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db-client';
import { getEventByToken } from '@/lib/db-access';

/**
 * GET /api/events/[event_id]/export-csv
 * Export archived event data as CSV
 * 
 * Headers:
 *   X-ADMIN-TOKEN: Admin token to verify access
 * 
 * Returns: CSV file with teams and scores
 * 
 * Error responses:
 * - 400: Missing admin token header
 * - 403: Invalid admin token or event not archived
 * - 404: Event not found
 * - 500: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { event_id: string } }
) {
  try {
    const { event_id } = params;
    
    // Get admin token from header
    const admin_token = request.headers.get('X-ADMIN-TOKEN');
    
    if (!admin_token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'X-ADMIN-TOKEN header required' 
        },
        { status: 400 }
      );
    }

    // Verify admin token
    const adminEvent = await getEventByToken(admin_token, 'admin');
    
    if (!adminEvent) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid admin token' 
        },
        { status: 403 }
      );
    }

    // Get event details
    const eventResult = await query(
      `SELECT id, name, mode, status, admin_token 
       FROM events 
       WHERE id = $1`,
      [event_id]
    );

    if (eventResult.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Event not found' 
        },
        { status: 404 }
      );
    }

    const event = eventResult.rows[0];

    // Verify admin owns this event
    if (event.admin_token !== admin_token) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'You do not have permission to export this event' 
        },
        { status: 403 }
      );
    }

    // Verify event is archived
    if (event.status !== 'archived') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Only archived events can be exported' 
        },
        { status: 403 }
      );
    }

    // Fetch teams
    const teamsResult = await query(
      `SELECT id, name, total_points 
       FROM teams 
       WHERE event_id = $1 
       ORDER BY total_points DESC`,
      [event_id]
    );

    const teams = teamsResult.rows;

    // Fetch scores grouped by day
    const scoresResult = await query(
      `SELECT 
        s.team_id, 
        s.day_number, 
        s.category,
        s.points,
        s.created_at,
        t.name as team_name
       FROM scores s
       JOIN teams t ON s.team_id = t.id
       WHERE s.event_id = $1
       ORDER BY s.day_number, s.created_at`,
      [event_id]
    );

    const scores = scoresResult.rows;

    // Get unique days
    const days = [...new Set(scores.map((s: any) => s.day_number))].sort((a, b) => a - b);

    // Build CSV content
    let csv = '';
    
    // Header
    csv += `Event: ${event.name}\n`;
    csv += `Mode: ${event.mode}\n`;
    csv += `Exported: ${new Date().toISOString()}\n`;
    csv += `\n`;

    // Teams summary
    csv += `TEAMS SUMMARY\n`;
    csv += `Rank,Team Name,Total Points\n`;
    teams.forEach((team: any, index: number) => {
      csv += `${index + 1},"${team.name}",${team.total_points || 0}\n`;
    });
    csv += `\n`;

    // Scores by day
    if (event.mode === 'camp' && days.length > 1) {
      csv += `SCORES BY DAY\n`;
      
      days.forEach((day: number) => {
        csv += `\nDay ${day}\n`;
        csv += `Team,Category,Points,Timestamp\n`;
        
        const dayScores = scores.filter((s: any) => s.day_number === day);
        dayScores.forEach((score: any) => {
          const timestamp = new Date(score.created_at).toLocaleString();
          csv += `"${score.team_name}","${score.category}",${score.points},"${timestamp}"\n`;
        });
      });
    } else {
      // Single day or quick mode
      csv += `ALL SCORES\n`;
      csv += `Team,Category,Points,Timestamp\n`;
      scores.forEach((score: any) => {
        const timestamp = new Date(score.created_at).toLocaleString();
        csv += `"${score.team_name}","${score.category}",${score.points},"${timestamp}"\n`;
      });
    }

    // Totals
    csv += `\n`;
    csv += `TOTALS\n`;
    csv += `Total Teams,${teams.length}\n`;
    csv += `Total Scores,${scores.length}\n`;
    csv += `Total Points Awarded,${teams.reduce((sum: number, t: any) => sum + (t.total_points || 0), 0)}\n`;

    // Create filename
    const sanitizedName = event.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sanitizedName}_Final_Results.csv`;

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('[CSV EXPORT] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to export CSV',
      },
      { status: 500 }
    );
  }
}

/**
 * Block mutations - CSV export is read-only
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'CSV export is read-only. Cannot create exports via POST.',
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: 'CSV export is read-only. Cannot modify exports.',
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: 'CSV export is read-only. Cannot delete exports.',
    },
    { status: 405 }
  );
}
