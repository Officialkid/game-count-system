// app/api/export/pdf/[eventId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    // Create PDF
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text(event.event_name, 14, 22);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Teams: ${teams.length}`, 14, 36);

    // Team standings table
    const teamData = teams.map((team, index) => [
      index + 1,
      team.team_name,
      team.total_points,
      history.scores?.filter(s => s.team_name === team.team_name).length || 0,
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Rank', 'Team Name', 'Total Points', 'Games Played']],
      body: teamData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Primary color
    });

    // Game history table
    if (history.scores && history.scores.length > 0) {
      const historyData = history.scores.slice(0, 50).map(score => [
        `Game ${score.game_number}`,
        score.team_name,
        score.points,
        new Date(score.created_at).toLocaleString(),
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: [['Game', 'Team', 'Points', 'Date']],
        body: historyData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
      });

      // Add note if truncated
      if (history.scores.length > 50) {
        doc.setFontSize(8);
        doc.text(
          `* Showing first 50 of ${history.scores.length} total games`,
          14,
          (doc as any).lastAutoTable.finalY + 5
        );
      }
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Return PDF file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${event.event_name.replace(/[^a-z0-9]/gi, '_')}_report.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export PDF' },
      { status: 500 }
    );
  }
}
