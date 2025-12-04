// app/api/export/csv/[eventId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Papa from 'papaparse';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;

    // Verify authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get event details
    const event = await db.getEventById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get teams and scores
    const teams = await db.listTeamsByEvent(eventId);
    const history = await db.getGameHistory(eventId, { limit: 10000 });

    // Format data for CSV
    const csvData = teams.map(team => {
      const teamScores = history.scores?.filter(s => s.team_name === team.team_name) || [];
      const gameBreakdown = teamScores.reduce((acc, score) => {
        acc[`Game ${score.game_number}`] = score.points;
        return acc;
      }, {} as Record<string, number>);

      return {
        'Team Name': team.team_name,
        'Total Points': team.total_points,
        'Games Played': teamScores.length,
        ...gameBreakdown,
      };
    });

    // Generate CSV
    const csv = Papa.unparse(csvData);

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${event.event_name.replace(/[^a-z0-9]/gi, '_')}_export.csv"`,
      },
    });
  } catch (error: any) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export CSV' },
      { status: 500 }
    );
  }
}
