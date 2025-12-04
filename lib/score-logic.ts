// lib/score-logic.ts
/**
 * Score submission logic and team total calculation utilities
 */

export interface ScoreSubmission {
  event_id: string;
  team_id: string;
  game_number: number;
  points: number;
}

export interface ScoreResult {
  score: {
    id: string;
    event_id: string;
    team_id: string;
    game_number: number;
    points: number;
    created_at: string;
  };
  updated_team: {
    id: string;
    team_name: string;
    total_points: number;
  };
  action: 'created' | 'updated';
}

/**
 * Validates score submission data
 */
export function validateScoreSubmission(data: Partial<ScoreSubmission>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.event_id) errors.push('Event ID is required');
  if (!data.team_id) errors.push('Team ID is required');
  if (typeof data.game_number !== 'number' || data.game_number < 1) {
    errors.push('Game number must be a positive integer');
  }
  if (typeof data.points !== 'number') {
    errors.push('Points must be a number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates team total from array of scores
 */
export function calculateTeamTotal(scores: Array<{ points: number }>): number {
  return scores.reduce((total, score) => total + score.points, 0);
}

/**
 * Checks if a score already exists for a team and game number
 */
export function findExistingScore(
  scores: Array<{ team_id: string; game_number: number }>,
  teamId: string,
  gameNumber: number
) {
  return scores.find(
    (s) => s.team_id === teamId && s.game_number === gameNumber
  );
}

/**
 * Groups scores by team ID
 */
export function groupScoresByTeam(
  scores: Array<{ team_id: string; points: number }>
): Map<string, number> {
  const teamTotals = new Map<string, number>();

  scores.forEach((score) => {
    const currentTotal = teamTotals.get(score.team_id) || 0;
    teamTotals.set(score.team_id, currentTotal + score.points);
  });

  return teamTotals;
}

/**
 * Verifies team total matches sum of scores
 */
export function verifyTeamTotal(
  teamTotal: number,
  scores: Array<{ points: number }>
): { valid: boolean; expected: number; actual: number; difference: number } {
  const expected = calculateTeamTotal(scores);
  const difference = teamTotal - expected;

  return {
    valid: difference === 0,
    expected,
    actual: teamTotal,
    difference,
  };
}

/**
 * React hook for score submission with optimistic updates
 */
export function useScoreSubmission() {
  const submitScore = async (
    apiClient: any,
    token: string,
    data: ScoreSubmission,
    onSuccess?: (result: ScoreResult) => void,
    onError?: (error: string) => void
  ) => {
    // Validate data
    const validation = validateScoreSubmission(data);
    if (!validation.valid) {
      onError?.(validation.errors.join(', '));
      return;
    }

    try {
      const response = await apiClient.addScore(
        token,
        data.event_id,
        data.team_id,
        data.game_number,
        data.points
      );

      if (response.success) {
        onSuccess?.(response.data);
      } else {
        onError?.(response.error || 'Failed to submit score');
      }
    } catch (error) {
      onError?.('Network error occurred');
    }
  };

  return { submitScore };
}

/**
 * Creates optimistic team update (before API response)
 */
export function createOptimisticUpdate(
  currentTeams: Array<{ id: string; total_points: number }>,
  teamId: string,
  pointsDelta: number
) {
  return currentTeams.map((team) =>
    team.id === teamId
      ? { ...team, total_points: team.total_points + pointsDelta }
      : team
  );
}
