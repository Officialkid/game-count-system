/**
 * Unit Tests for Appwrite Event Service
 * 
 * Tests the event service with mocked Appwrite responses
 */

import { createEvent, getEvent, updateEvent, deleteEvent, getEvents } from '@/lib/services/appwriteEvents';

// Mock Appwrite SDK
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
    EVENTS: 'test-events-collection',
  },
}));

import { databases } from '@/lib/appwrite';

describe('Appwrite Events Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should create event successfully', async () => {
      const mockEvent = {
        $id: 'event-123',
        user_id: 'user-123',
        event_name: 'Test Event',
        num_teams: 4,
        num_games: 3,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      (databases.createDocument as jest.Mock).mockResolvedValue(mockEvent);

      const result = await createEvent('user-123', {
        event_name: 'Test Event',
        theme_color: undefined,
        allow_negative: false,
        display_mode: 'cumulative',
        num_teams: 4,
      });

      expect(result.success).toBe(true);
      expect(result.data?.event).toEqual(mockEvent);
      expect(databases.createDocument).toHaveBeenCalledWith(
        'test-database',
        'test-events-collection',
        expect.any(String),
        expect.objectContaining({
          user_id: 'user-123',
          event_name: 'Test Event',
          num_teams: 4,
          num_games: 3,
        })
      );
    });

    it('should handle create event error', async () => {
      (databases.createDocument as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const result = await createEvent('user-123', {
        event_name: 'Test Event',
        num_teams: 4,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should validate required fields', async () => {
      const result = await createEvent('', {
        event_name: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('getEvent', () => {
    it('should retrieve event by ID', async () => {
      const mockEvent = {
        $id: 'event-123',
        event_name: 'Test Event',
        num_teams: 4,
        num_games: 3,
      };

      (databases.getDocument as jest.Mock).mockResolvedValue(mockEvent);

      const result = await getEvent('event-123');

      expect(result.success).toBe(true);
      expect(result.data?.event).toEqual(mockEvent);
      expect(databases.getDocument).toHaveBeenCalledWith(
        'test-database',
        'test-events-collection',
        'event-123'
      );
    });

    it('should handle event not found', async () => {
      (databases.getDocument as jest.Mock).mockRejectedValue(
        new Error('Document not found')
      );

      const result = await getEvent('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('getEvents', () => {
    it('should retrieve all events for user', async () => {
      const mockEvents = {
        documents: [
          { $id: 'event-1', event_name: 'Event 1', user_id: 'user-123', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { $id: 'event-2', event_name: 'Event 2', user_id: 'user-123', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ],
        total: 2,
      };

      (databases.listDocuments as jest.Mock).mockResolvedValue(mockEvents);

      const result = await getEvents('user-123');

      expect(result.success).toBe(true);
      expect(result.data?.events).toHaveLength(2);
    });

    it('should return empty array when user has no events', async () => {
      (databases.listDocuments as jest.Mock).mockResolvedValue({
        documents: [],
        total: 0,
      });

      const result = await getEvents('user-123');

      expect(result.success).toBe(true);
      expect(result.data?.events).toEqual([]);
    });
  });

  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      const updatedEvent = {
        $id: 'event-123',
        event_name: 'Updated Event',
        num_teams: 5,
      };

      (databases.updateDocument as jest.Mock).mockResolvedValue(updatedEvent);

      const result = await updateEvent('event-123', {
        event_name: 'Updated Event',
        num_teams: 5,
      });

      expect(result.success).toBe(true);
      expect(result.data?.event.event_name).toBe('Updated Event');
    });
  });

  describe('deleteEvent', () => {
    it('should soft delete event (set is_active=false)', async () => {
      (databases.updateDocument as jest.Mock).mockResolvedValue({
        $id: 'event-123',
        is_active: false,
      });

      const result = await deleteEvent('event-123');

      expect(result.success).toBe(true);
      expect(databases.updateDocument).toHaveBeenCalledWith(
        'test-database',
        'test-events-collection',
        'event-123',
        expect.objectContaining({ is_active: false })
      );
    });
  });
});
