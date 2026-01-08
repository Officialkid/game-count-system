// lib/pdf-export.ts
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Team {
  id: number;
  team_name: string;
  avatar_url: string | null;
  total_points: number;
}

interface DayScore {
  day_number: number;
  day_label: string | null;
  team_name: string;
  points: number;
}

interface EventData {
  event_name: string;
  mode: 'quick' | 'camp' | 'advanced';
  theme_color?: string;
  public_token: string;
  finalized_at?: string;
}

interface PDFExportOptions {
  event: EventData;
  teams: Team[];
  scoresByDay?: DayScore[];
  includeLink?: boolean;
}

/**
 * Generate a PDF export of event final results
 * Includes event name, team rankings, scores, and AlphaTech branding
 */
export function generateResultsPDF(options: PDFExportOptions): void {
  const { event, teams, scoresByDay = [], includeLink = true } = options;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = event.theme_color || '#6b46c1';
  
  let yPosition = 20;

  // ===== HEADER: AlphaTech Branding =====
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Powered by', pageWidth - 15, yPosition, { align: 'right' });
  
  yPosition += 5;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 70, 193); // AlphaTech purple
  doc.text('AlphaTech', pageWidth - 15, yPosition, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  
  // Reset position for title
  yPosition = 25;

  // ===== EVENT TITLE =====
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(event.event_name, 15, yPosition);
  
  yPosition += 10;
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Final Results', 15, yPosition);
  
  // Finalized timestamp
  if (event.finalized_at) {
    const finalizedDate = new Date(event.finalized_at);
    yPosition += 6;
    doc.setFontSize(9);
    doc.text(
      `Finalized: ${finalizedDate.toLocaleDateString()} ${finalizedDate.toLocaleTimeString()}`,
      15,
      yPosition
    );
  }
  
  yPosition += 15;

  // ===== OVERALL RANKINGS TABLE =====
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('🏆 Team Rankings', 15, yPosition);
  
  yPosition += 5;

  // Sort teams by points
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    return a.team_name.localeCompare(b.team_name);
  });

  const rankingsData = sortedTeams.map((team, index) => [
    (index + 1).toString(),
    team.team_name,
    team.total_points.toString()
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Rank', 'Team Name', 'Total Points']],
    body: rankingsData,
    theme: 'striped',
    headStyles: {
      fillColor: hexToRgb(primaryColor),
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 11
    },
    bodyStyles: {
      fontSize: 10
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { halign: 'left', cellWidth: 100 },
      2: { halign: 'center', cellWidth: 40 }
    },
    margin: { left: 15, right: 15 }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // ===== DAY-BY-DAY BREAKDOWN (for camp events) =====
  if (event.mode === 'camp' && scoresByDay.length > 0) {
    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('📅 Day-by-Day Breakdown', 15, yPosition);
    yPosition += 5;

    // Group scores by day
    const dayGroups = new Map<number, DayScore[]>();
    scoresByDay.forEach(score => {
      if (!dayGroups.has(score.day_number)) {
        dayGroups.set(score.day_number, []);
      }
      dayGroups.get(score.day_number)!.push(score);
    });

    // Sort days
    const sortedDays = Array.from(dayGroups.keys()).sort((a, b) => a - b);

    sortedDays.forEach((dayNum, dayIndex) => {
      const dayScores = dayGroups.get(dayNum)!;
      const dayLabel = dayScores[0]?.day_label || `Day ${dayNum}`;

      // Check if we need a new page
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 20;
      }

      // Day title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(dayLabel, 15, yPosition);
      yPosition += 2;

      // Aggregate scores by team for this day
      const teamDayScores = new Map<string, number>();
      dayScores.forEach(score => {
        const current = teamDayScores.get(score.team_name) || 0;
        teamDayScores.set(score.team_name, current + score.points);
      });

      // Sort teams by day points
      const dayRankings = Array.from(teamDayScores.entries())
        .map(([team_name, points]) => ({ team_name, points }))
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return a.team_name.localeCompare(b.team_name);
        });

      const dayData = dayRankings.map((team, index) => [
        (index + 1).toString(),
        team.team_name,
        team.points.toString()
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Rank', 'Team', 'Points']],
        body: dayData,
        theme: 'plain',
        headStyles: {
          fillColor: hexToRgb(primaryColor, 0.3),
          textColor: 0,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 20 },
          1: { halign: 'left', cellWidth: 100 },
          2: { halign: 'center', cellWidth: 40 }
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    });
  }

  // ===== FOOTER: Link back to platform =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    
    if (includeLink) {
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'https://yourdomain.com';
      const fullUrl = `${baseUrl}/scoreboard/${event.public_token}`;
      
      doc.text(
        `View live results: ${fullUrl}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    // Page number
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 15,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // ===== SAVE PDF =====
  const fileName = `${sanitizeFilename(event.event_name)}_Final_Results.pdf`;
  doc.save(fileName);
}

/**
 * Convert hex color to RGB array for jsPDF
 */
function hexToRgb(hex: string, opacity = 1): number[] {
  // Remove # if present
  hex = hex.replace('#', '');
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  if (opacity < 1) {
    // Blend with white for opacity effect
    const blendR = Math.round(r + (255 - r) * (1 - opacity));
    const blendG = Math.round(g + (255 - g) * (1 - opacity));
    const blendB = Math.round(b + (255 - b) * (1 - opacity));
    return [blendR, blendG, blendB];
  }
  
  return [r, g, b];
}

/**
 * Sanitize filename for safe file saving
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9\s-]/gi, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}
