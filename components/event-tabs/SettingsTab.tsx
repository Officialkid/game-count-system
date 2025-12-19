'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { ConfirmDialog } from '../ui/Modal';
import { SaveTemplateModal } from '../modals';
import { EditEventModal } from '../modals/EditEventModal';
import { useAuth } from '@/lib/auth-context';
import { eventsService, shareLinksService, templatesService, recapsService, teamsService, scoresService } from '@/lib/services';
import { getPaletteById } from '@/lib/color-palettes';
import { getFriendlyError } from '@/lib/error-messages';

interface ShareLink {
  share_token: string;
  is_active: boolean;
  created_at: string;
}

interface Event {
  event_id: number;
  event_name: string;
  theme_color: string;
  allow_negative: boolean;
  display_mode: string;
}

interface SettingsTabProps {
  eventId: string;
  eventName: string;
}

export function SettingsTab({ eventId, eventName }: SettingsTabProps) {
  const { user } = useAuth();
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [showDeleteEvent, setShowDeleteEvent] = useState(false);
  const [generatingRecap, setGeneratingRecap] = useState(false);
  const { showToast } = useToast();

  const showFriendlyError = (input: { status?: number; message?: string; code?: string; context?: 'event' | 'share' | 'general' }) => {
    const friendly = getFriendlyError({ ...input, context: input.context || 'general' });
    const body = friendly.suggestion ? `${friendly.message}\n${friendly.suggestion}` : friendly.message;
    showToast(body, friendly.type === 'warning' ? 'warning' : 'error', {
      learnMoreHref: friendly.learnMoreHref,
      duration: friendly.type === 'warning' ? 6000 : 8000,
    });
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load event data via Appwrite
      const ev = await eventsService.getEvent(eventId);
      if (ev.success && ev.data) {
        const e = ev.data.event as any;
        setEvent({
          event_id: e.$id,
          event_name: e.event_name,
          theme_color: e.theme_color,
          allow_negative: !!e.allow_negative,
          display_mode: e.display_mode,
        });
      }

      // Load share link via Appwrite
      const link = await shareLinksService.getShareLinkByEvent(eventId);
      if (link.success && link.data) {
        const sl = link.data.shareLink;
        setShareLink({
          share_token: sl.token,
          is_active: sl.is_active,
          created_at: sl.created_at,
        });
      } else {
        setShareLink(null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showFriendlyError({ message: (error as Error).message, context: 'event' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      // Client-side CSV export: fetch teams and scores
      const teamsRes = await teamsService.getTeams(eventId);
      const teams = teamsRes.success && teamsRes.data ? (teamsRes.data.teams as any[]) : [];
      const scoresRes = await scoresService.getScores(eventId);
      const scores = scoresRes.success && scoresRes.data ? (scoresRes.data.scores as any[]) : [];

      const rows: string[] = [];
      rows.push('team_id,team_name,game_number,points');
      for (const s of scores) {
        const teamName = teams.find(t => t.$id === s.team_id)?.team_name || '';
        rows.push(`${s.team_id},"${teamName}",${s.game_number},${s.points}`);
      }
      const csv = rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventName.replace(/[^a-z0-9]/gi, '_')}_export.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('CSV exported successfully', 'success');
    } catch (error) {
      console.error('CSV export error:', error);
      showFriendlyError({ message: (error as Error).message, context: 'event' });
    }
  };

  const handleExportPDF = async () => {
    try {
      // PDF export requires a server function; fallback to CSV guidance
      showToast('PDF export not available without a server. Use CSV instead.', 'warning');
    } catch (error) {
      console.error('PDF export error:', error);
      showFriendlyError({ message: (error as Error).message, context: 'event' });
    }
  };

  const handleCopyLink = () => {
    if (!shareLink) return;
    
    const url = `${window.location.origin}/scoreboard/${shareLink.share_token}`;
    navigator.clipboard.writeText(url).then(
      () => {
        showToast('Link copied to clipboard!', 'success');
      },
      () => {
        showToast('Failed to copy link', 'error');
      }
    );
  };

  const handleRegenerateLink = async () => {
    try {
      setRegenerating(true);
      if (!user?.id) return;
      const res = await shareLinksService.createShareLink(eventId, user.id, true);
      if (!res.success || !res.data) {
        showFriendlyError({ message: res.error || 'Failed to regenerate link', context: 'share' });
        return;
      }
      const sl = res.data.shareLink;
      setShareLink({ share_token: sl.token, is_active: sl.is_active, created_at: sl.created_at });
      showToast('Share link regenerated successfully!', 'success');
    } catch (error) {
      console.error('Error regenerating link:', error);
      showFriendlyError({ message: (error as Error).message, context: 'share' });
    } finally {
      setRegenerating(false);
    }
  };

  const handleDeleteLink = async () => {
    try {
      setDeleting(true);
      if (!user?.id) return;
      const resp = await shareLinksService.deleteShareLink(eventId, user.id);
      if (!resp.success) {
        showFriendlyError({ message: resp.error || 'Failed to delete link', context: 'share' });
        return;
      }
      setShareLink(null);
      showToast('Share link deleted successfully', 'success');
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting link:', error);
      showFriendlyError({ message: (error as Error).message, context: 'share' });
    } finally {
      setDeleting(false);
    }
  };

  const handlePreviewScoreboard = () => {
    if (!shareLink) return;
    window.open(`/scoreboard/${shareLink.share_token}`, '_blank');
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSaveTemplate = async (templateName: string) => {
    if (!event) return;

    try {
      setSavingTemplate(true);
      if (!user?.id) { showFriendlyError({ message: 'Not authenticated', context: 'event' }); return; }
      const resp = await templatesService.saveTemplate(user.id, {
        template_name: templateName,
        event_name_prefix: event.event_name,
        theme_color: event.theme_color,
        allow_negative: event.allow_negative,
        display_mode: event.display_mode,
      });
      if (!resp.success) {
        showFriendlyError({ message: resp.error, context: 'event' });
        return;
      }
      showToast('Template saved successfully!', 'success');
      setShowSaveTemplate(false);
    } catch (error) {
      console.error('Error saving template:', error);
      showFriendlyError({ message: (error as Error).message, context: 'event' });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      const response = await eventsService.deleteEvent(eventId);
      if (!response.success) {
        showFriendlyError({ message: response.error, context: 'event' });
        return;
      }

      showToast('Event deleted successfully', 'success');
      setShowDeleteEvent(false);
      // Redirect to dashboard after deletion
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (error) {
      console.error('Error deleting event:', error);
      showFriendlyError({ message: (error as Error).message, context: 'event' });
    }
  };

  const handleEventUpdated = () => {
    setShowEditEvent(false);
    loadData();
    showToast('Event updated successfully', 'success');
  };

  const handleGenerateRecap = async () => {
    try {
      setGeneratingRecap(true);
      if (!user?.id) { showFriendlyError({ message: 'Not authenticated', context: 'event' }); return; }

      // Build recap snapshot client-side
      const teamsRes = await teamsService.getTeams(eventId);
      const scoresRes = await scoresService.getScores(eventId);
      const teams = (teamsRes.success && teamsRes.data ? teamsRes.data.teams : []) as any[];
      const scores = (scoresRes.success && scoresRes.data ? scoresRes.data.scores : []) as any[];

      const totals: Record<string, number> = {};
      for (const s of scores) {
        totals[s.team_id] = (totals[s.team_id] || 0) + (s.points || 0);
      }
      const final_leaderboard = teams
        .map(t => ({ team_id: t.$id, team_name: t.team_name, total_points: totals[t.$id] || 0 }))
        .sort((a, b) => b.total_points - a.total_points)
        .map((t, idx) => ({ ...t, rank: idx + 1 }));

      const snapshot = {
        event_id: eventId,
        event_name: eventName,
        total_games: scores.length ? Math.max(...scores.map((s: any) => s.game_number || 0)) : 0,
        total_teams: teams.length,
        final_leaderboard,
        top_scorer: final_leaderboard[0]
          ? { team_id: final_leaderboard[0].team_id, team_name: final_leaderboard[0].team_name, total_points: final_leaderboard[0].total_points }
          : undefined,
        winner: final_leaderboard[0]
          ? { team_id: final_leaderboard[0].team_id, team_name: final_leaderboard[0].team_name, total_points: final_leaderboard[0].total_points }
          : undefined,
        highlights: [],
      } as any;

      const create = await recapsService.createRecap(user.id, eventId, snapshot);
      if (!create.success) {
        showFriendlyError({ message: create.error || 'Failed to generate recap', context: 'event' });
        return;
      }
      showToast('Event recap generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating recap:', error);
      showFriendlyError({ message: (error as Error).message, context: 'event' });
    } finally {
      setGeneratingRecap(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Public Dashboard Settings - Primary Section */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader className="border-b border-blue-200 bg-blue-100">
          <CardTitle className="text-lg flex items-center gap-2">
            🌐 Public Dashboard Settings
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2 font-normal">
            Manage your event's public scoreboard and share settings
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {shareLink ? (
            <>
              {/* Status Badge */}
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                <div>
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <div className="mt-1">
                    {shareLink.is_active ? (
                      <Badge variant="success" className="text-green-700 bg-green-100 border border-green-300">
                        ✓ Active
                      </Badge>
                    ) : (
                      <Badge variant="error" className="text-red-700 bg-red-100 border border-red-300">
                        ✗ Inactive
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div className="font-medium">Created</div>
                  <div>{formatDate(shareLink.created_at)}</div>
                </div>
              </div>

              {/* Share Link Display */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Public Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/scoreboard/${shareLink.share_token}`}
                    readOnly
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono text-gray-700 overflow-x-auto"
                  />
                  <Button 
                    variant="secondary" 
                    onClick={handleCopyLink}
                    data-tour="share-leaderboard"
                    className="whitespace-nowrap"
                  >
                    📋 Copy
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Share this link with anyone to allow them to view your live scoreboard without logging in
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="primary"
                  onClick={handlePreviewScoreboard}
                  className="w-full"
                >
                  👁️ Preview Scoreboard
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleRegenerateLink}
                  loading={regenerating}
                  disabled={regenerating}
                  className="w-full"
                >
                  🔄 Regenerate Link
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full"
                >
                  🗑️ Delete Link
                </Button>
              </div>

              {/* Info Messages */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
                <div className="text-sm text-yellow-800">
                  <strong>💡 Tip:</strong> Anyone with the share link can view your live scoreboard in real-time
                </div>
                <div className="text-sm text-yellow-800">
                  <strong>🔄 Regenerate:</strong> Creates a new link and invalidates the old one
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="text-6xl">🔗</div>
              <div>
                <p className="text-gray-600 font-medium mb-2">No Public Share Link</p>
                <p className="text-sm text-gray-500 mb-6">
                  Create a share link to allow others to view your event's live scoreboard
                </p>
              </div>
              <Button 
                variant="primary" 
                onClick={handleRegenerateLink} 
                loading={regenerating}
                className="mx-auto"
              >
                🔗 Create Share Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Settings Section */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader className="border-b border-purple-200 bg-purple-100">
          <CardTitle className="text-lg flex items-center gap-2">
            ⚙️ Event Settings
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2 font-normal">
            Manage your event configuration and appearance
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Name
              </label>
              <div className="text-lg font-semibold text-gray-900">{eventName}</div>
            </div>

            {event && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg shadow-md border-2 border-gray-200"
                      style={{ backgroundColor: getPaletteById(event.theme_color)?.primary || '#8b5cf6' }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{getPaletteById(event.theme_color)?.name || 'Purple'}</p>
                      <p className="text-sm text-gray-500">Current theme</p>
                    </div>
                  </div>
                </div>

                {/* Logo display removed for MVP */}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Negative Scoring
                    </label>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                        event.allow_negative 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {event.allow_negative ? '✓' : '✗'}
                      </div>
                      <span className="text-sm text-gray-600">
                        {event.allow_negative ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Mode
                    </label>
                    <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-900">
                      {event.display_mode === 'standard' && '📊 Standard'}
                      {event.display_mode === 'compact' && '📱 Compact'}
                      {event.display_mode === 'leaderboard' && '🏆 Leaderboard'}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-purple-200 space-y-3">
            <Button
              variant="primary"
              onClick={() => setShowEditEvent(true)}
              className="w-full"
            >
              ✏️ Edit Event Details
            </Button>
            <Button
              variant="secondary"
              onClick={handleGenerateRecap}
              disabled={generatingRecap}
              className="w-full"
            >
              {generatingRecap ? '⏳ Generating...' : '📊 Generate Recap'}
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowDeleteEvent(true)}
              className="w-full"
            >
              🗑️ Delete Event
            </Button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-sm text-yellow-800">
              <strong>💡 Note:</strong> Edit event details including name, theme color, and scoring options.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Data Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Download event data, team standings, and game history in your preferred format.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={handleExportCSV}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </Button>
            <Button
              variant="secondary"
              onClick={handleExportPDF}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Save this event's configuration as a template to quickly create similar events in the future.
          </p>
          <div>
            <Button
              variant="primary"
              onClick={() => setShowSaveTemplate(true)}
              disabled={!event}
            >
              💾 Save as Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Link Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteLink}
        title="Delete Share Link"
        message="Are you sure you want to delete this share link? The public scoreboard will no longer be accessible."
        confirmText="Delete Link"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />

      {/* Delete Event Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteEvent}
        onClose={() => setShowDeleteEvent(false)}
        onConfirm={handleDeleteEvent}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone. All teams, scores, and data associated with this event will be permanently deleted."
        confirmText="Delete Event"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        onSave={handleSaveTemplate}
        currentEventName={eventName}
      />

      {/* Edit Event Modal */}
      {event && (
        <EditEventModal
          isOpen={showEditEvent}
          onClose={() => setShowEditEvent(false)}
          onSave={handleEventUpdated}
          eventId={eventId}
          initial={{
            event_name: event.event_name,
            theme_color: event.theme_color,
            allow_negative: event.allow_negative,
            display_mode: event.display_mode,
          }}
        />
      )}
    </div>
  );
}
