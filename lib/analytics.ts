// lib/analytics.ts
interface GameScore {
  id: number;
  game_number: number;
  points: number;
  team_name: string;
  created_at: string;
}

interface Team {
  team_name: string;
  total_points: number;
}

export interface TeamPerformance {
  teamName: string;
  totalPoints: number;
  gamesPlayed: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

export interface GameProgressData {
  gameNumber: number;
  [teamName: string]: number | string;
}

export function calculateTeamPerformance(
  teams: Team[],
  scores: GameScore[]
): TeamPerformance[] {
  return teams.map(team => {
    const teamScores = scores.filter(s => s.team_name === team.team_name);
    const points = teamScores.map(s => s.points);

    // Calculate trend (last 3 games vs previous 3 games)
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (teamScores.length >= 6) {
      const recent = teamScores.slice(-3).reduce((sum, s) => sum + s.points, 0) / 3;
      const previous = teamScores.slice(-6, -3).reduce((sum, s) => sum + s.points, 0) / 3;
      if (recent > previous * 1.1) trend = 'improving';
      else if (recent < previous * 0.9) trend = 'declining';
    }

    return {
      teamName: team.team_name,
      totalPoints: team.total_points,
      gamesPlayed: teamScores.length,
      averageScore: points.length > 0 ? points.reduce((a, b) => a + b, 0) / points.length : 0,
      highestScore: points.length > 0 ? Math.max(...points) : 0,
      lowestScore: points.length > 0 ? Math.min(...points) : 0,
      trend,
    };
  });
}

export function calculateScoreDistribution(scores: GameScore[]): ScoreDistribution[] {
  const ranges = [
    { min: 0, max: 10, label: '0-10' },
    { min: 11, max: 20, label: '11-20' },
    { min: 21, max: 30, label: '21-30' },
    { min: 31, max: 40, label: '31-40' },
    { min: 41, max: 50, label: '41-50' },
    { min: 51, max: Infinity, label: '51+' },
  ];

  return ranges.map(range => ({
    range: range.label,
    count: scores.filter(s => s.points >= range.min && s.points <= range.max).length,
  }));
}

export function calculateGameProgress(
  teams: Team[],
  scores: GameScore[]
): GameProgressData[] {
  const gameNumbers = [...new Set(scores.map(s => s.game_number))].sort((a, b) => a - b);

  return gameNumbers.map(gameNum => {
    const data: GameProgressData = { gameNumber: gameNum };

    teams.forEach(team => {
      const teamScoresUpToGame = scores
        .filter(s => s.team_name === team.team_name && s.game_number <= gameNum)
        .reduce((sum, s) => sum + s.points, 0);
      data[team.team_name] = teamScoresUpToGame;
    });

    return data;
  });
}

export function calculateWinProbabilities(
  teams: Team[],
  scores: GameScore[]
): { teamName: string; winProbability: number }[] {
  if (teams.length === 0) return [];

  const totalPoints = teams.reduce((sum, t) => sum + t.total_points, 0);
  const performances = calculateTeamPerformance(teams, scores);

  return teams.map((team, index) => {
    const performance = performances[index];
    
    // Base probability on current points
    let probability = totalPoints > 0 ? (team.total_points / totalPoints) * 100 : 0;

    // Adjust based on trend
    if (performance.trend === 'improving') probability *= 1.15;
    else if (performance.trend === 'declining') probability *= 0.85;

    // Normalize probabilities to sum to 100
    return {
      teamName: team.team_name,
      winProbability: probability,
    };
  });
}

export function getInsights(
  teams: Team[],
  scores: GameScore[]
): string[] {
  const insights: string[] = [];
  const performances = calculateTeamPerformance(teams, scores);

  // Close race insight
  const sorted = [...teams].sort((a, b) => b.total_points - a.total_points);
  if (sorted.length >= 2) {
    const diff = sorted[0].total_points - sorted[1].total_points;
    const avgScore = scores.reduce((sum, s) => sum + s.points, 0) / scores.length;
    if (diff < avgScore * 2) {
      insights.push(`🔥 Close race! ${sorted[0].team_name} leads by only ${diff} points`);
    }
  }

  // Dominant team insight
  if (sorted.length >= 2) {
    const leader = sorted[0];
    const secondPlace = sorted[1];
    if (leader.total_points > secondPlace.total_points * 1.5) {
      insights.push(`👑 ${leader.team_name} is dominating with a commanding lead`);
    }
  }

  // Improving team insight
  const improving = performances.filter(p => p.trend === 'improving');
  if (improving.length > 0) {
    insights.push(`📈 ${improving.map(p => p.teamName).join(', ')} showing strong momentum`);
  }

  // High scorer insight
  const highScores = scores.filter(s => s.points >= 40);
  if (highScores.length > 0) {
    const topTeam = highScores.reduce((acc, score) => {
      acc[score.team_name] = (acc[score.team_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostHighScores = Object.entries(topTeam).sort((a, b) => b[1] - a[1])[0];
    insights.push(`⚡ ${mostHighScores[0]} has scored 40+ points ${mostHighScores[1]} times`);
  }

  return insights;
}
