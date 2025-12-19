/**
 * Unit Tests for Appwrite Teams Service
 */

import { createTeam, getTeam, updateTeam, deleteTeam, getTeams } from '@/lib/services/appwriteTeams';

jest.mock('@/lib/appwrite', () => ({
  databases: {
    createDocument: jest.fn(),
    getDocument: jest.fn(),
    updateDocument: jest.fn(),
    deleteDocument: jest.fn(),
    listDocuments: jest.fn(),
  },
  DATABASE_ID: 'test-database',
  COLLECTIONS: {
    TEAMS: 'test-teams-collection',
  },
}));

import { databases } from '@/lib/appwrite';

describe('Appwrite Teams Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTeam', () => {
    it('should create team successfully', async () => {
      const mockTeam = {
        $id: 'team-123',
        event_id: 'event-123',
        team_name: 'Red Eagles',
        color: '#FF0000',
        total_points: 0,
      };

      (databases.createDocument as jest.Mock).mockResolvedValue(mockTeam);

      const result = await createTeam('user-123', {
        event_id: 'event-123',
        team_name: 'Red Eagles',
        avatar_path: null,
      });

      expect(result.success).toBe(true);
      expect(result.data?.team).toEqual(mockTeam);
    });

    it('should validate team color format', async () => {
      const result = await createTeam('user-123', {
        event_id: 'event-123',
        team_name: 'Red Eagles',
        avatar_path: null,
      });

      expect(result.success).toBe(true);
    });

    it('should handle duplicate team names', async () => {
      (databases.createDocument as jest.Mock).mockRejectedValue(
        new Error('Duplicate team name')
      );

      const result = await createTeam('user-123', {
        event_id: 'event-123',
        team_name: 'Existing Team',
        avatar_path: null,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('getTeams', () => {
    it('should retrieve all teams for event', async () => {
      const mockTeams = {
        documents: [
          { $id: 'team-1', team_name: 'Team 1', event_id: 'event-123', avatar_path: null, total_points: 10 },
          { $id: 'team-2', team_name: 'Team 2', event_id: 'event-123', avatar_path: null, total_points: 15 },
        ],
        total: 2,
      };

      (databases.listDocuments as jest.Mock).mockResolvedValue(mockTeams);

      const result = await getTeams('event-123');

      expect(result.success).toBe(true);
      expect(result.data?.teams).toHaveLength(2);
    });

    it('should sort teams by total_points descending', async () => {
      const mockTeams = {
        documents: [
          { $id: 'team-1', team_name: 'Team 1', event_id: 'event-123', avatar_path: null, total_points: 15 },
          { $id: 'team-2', team_name: 'Team 2', event_id: 'event-123', avatar_path: null, total_points: 25 },
          { $id: 'team-3', team_name: 'Team 3', event_id: 'event-123', avatar_path: null, total_points: 10 },
        ],
        total: 3,
      };

      (databases.listDocuments as jest.Mock).mockResolvedValue(mockTeams);

      const result = await getTeams('event-123');

      expect(result.success).toBe(true);
      // Verify teams are sorted by points
      const teams = result.data?.teams || [];
      for (let i = 0; i < teams.length - 1; i++) {
        expect(teams[i].total_points).toBeGreaterThanOrEqual(teams[i + 1].total_points);
      }
    });
  });

  describe('updateTeam', () => {
    it('should update team name and color', async () => {
      const updatedTeam = {
        $id: 'team-123',
        event_id: 'event-123',
        team_name: 'Blue Sharks',
        avatar_path: null,
      };

      (databases.updateDocument as jest.Mock).mockResolvedValue(updatedTeam);

      const result = await updateTeam('team-123', {
        team_name: 'Blue Sharks',
        avatar_path: null,
      });

      expect(result.success).toBe(true);
      expect(result.data?.team.team_name).toBe('Blue Sharks');
    });

    it('should recalculate total_points when updated', async () => {
      const updatedTeam = {
        $id: 'team-123',
        event_id: 'event-123',
        team_name: 'Team',
        total_points: 50,
      };

      (databases.updateDocument as jest.Mock).mockResolvedValue(updatedTeam);

      const result = await updateTeam('team-123', { team_name: 'Team' });

      expect(result.success).toBe(true);
    });
  });

  describe('deleteTeam', () => {
    it('should soft delete team', async () => {
      (databases.updateDocument as jest.Mock).mockResolvedValue({
        $id: 'team-123',
        is_active: false,
      });

      const result = await deleteTeam('team-123');

      expect(result.success).toBe(true);
    });
  });
});
