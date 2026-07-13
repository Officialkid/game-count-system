import { NextRequest, NextResponse } from 'next/server';
import { exportEventAsCsvData } from '@/lib/server/event-lifecycle-service';
import { requireAdminToken } from '@/lib/token-middleware';

function getAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null;
  return request.headers.get('x-admin-token') || bearerToken;
}

export async function GET(request: NextRequest, { params }: { params: { event_id: string } }) {
  try {
    const adminToken = getAdminToken(request);
    if (!adminToken) {
      return NextResponse.json({ success: false, error: 'X-ADMIN-TOKEN header or Bearer token required' }, { status: 400 });
    }

    const validation = await requireAdminToken(params.event_id, adminToken);
    if (validation instanceof NextResponse) return validation;

    const exported = await exportEventAsCsvData(params.event_id);
    if (exported.event.eventStatus !== 'archived') {
      return NextResponse.json({ success: false, error: 'Only archived events can be exported' }, { status: 403 });
    }

    let csv = '';
    csv += `Event,${exported.event.name}\n`;
    csv += `Mode,${exported.event.eventMode}\n`;
    csv += `Exported At,${new Date().toISOString()}\n\n`;
    csv += 'TEAMS SUMMARY\n';
    csv += 'Rank,Team Name,Total Points\n';
    exported.teams.forEach((team, index) => {
      csv += `${index + 1},"${team.name}",${team.total_points}\n`;
    });
    csv += '\n';

    if (exported.event.eventMode === 'camp' && exported.days.length > 1) {
      csv += 'SCORES BY DAY\n';
      exported.days.forEach((day) => {
        csv += `\nDay ${day}\n`;
        csv += 'Team,Category,Points,Timestamp\n';
        exported.scores.filter((score) => score.day_number === day).forEach((score) => {
          csv += `"${score.team_name}","${score.category}",${score.points},"${new Date(score.created_at).toLocaleString()}"\n`;
        });
      });
    } else {
      csv += 'ALL SCORES\n';
      csv += 'Team,Category,Points,Timestamp\n';
      exported.scores.forEach((score) => {
        csv += `"${score.team_name}","${score.category}",${score.points},"${new Date(score.created_at).toLocaleString()}"\n`;
      });
    }

    csv += '\nTOTALS\n';
    csv += `Total Teams,${exported.teams.length}\n`;
    csv += `Total Scores,${exported.scores.length}\n`;
    csv += `Total Points Awarded,${exported.teams.reduce((sum, team) => sum + team.total_points, 0)}\n`;

    const filename = `${exported.event.name.replace(/[^a-zA-Z0-9]/g, '_')}_Final_Results.csv`;
    return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${filename}"` } });
  } catch (error) {
    console.error('[CSV EXPORT] Error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to export CSV' }, { status: 500 });
  }
}

function methodNotAllowed(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 405 });
}

export async function POST() { return methodNotAllowed('CSV export is read-only. Cannot create exports via POST.'); }
export async function PUT() { return methodNotAllowed('CSV export is read-only. Cannot modify exports.'); }
export async function DELETE() { return methodNotAllowed('CSV export is read-only. Cannot delete exports.'); }
