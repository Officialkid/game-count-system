'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateResultsPDF } from '@/lib/pdf-export';
import PastEventsSection from '@/components/PastEventsSection';
import { AdminTutorial, resetAdminTutorial } from '@/components/AdminTutorial';
import { EventLinksManager } from '@/components/EventLinksManager';
import { ExpiredEvent, EventNotFoundError } from '@/components/ExpiredEvent';
import { safeInitial } from '@/lib/safe-ui-helpers';
import { Upload, Edit, Trash2, Zap, FileText, Clipboard } from 'lucide-react';
import { NoTeamsEmpty } from '@/components/EmptyStates';

interface Team {
  id: string;
  name: string;
  color: string;
  avatar_url?: string;
  total_points?: number;
}

interface Event {
  id: string;
  name: string;
  mode: string;
  status: string;
  public_token: string;
  scorer_token: string;
  admin_token?: string;
  is_finalized?: boolean;
  finalized_at?: string;
  theme_color?: string;
}

export default function AdminPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { token } = params;
  const [event, setEvent] = useState<Event | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'expired' | 'not-found' | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('#3B82F6');
  const [bulkRows, setBulkRows] = useState<{ name: string; color: string }[]>([
    { name: '', color: '#3B82F6' },
  ]);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [adding, setAdding] = useState(false);
  
  // Bulk import methods state
  const [importMethod, setImportMethod] = useState<'quick' | 'paste' | 'file'>('paste');
  const [quickAddInput, setQuickAddInput] = useState('');
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [teamsAdded, setTeamsAdded] = useState<number | null>(null);
  
  // Finalization state
  const [finalizing, setFinalizing] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showLinksDropdown, setShowLinksDropdown] = useState(false);

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      setErrorType(null);

      // Verify token and get event
      const eventRes = await fetch(`/api/event-by-token/${token}`, {
        headers: { 'X-ADMIN-TOKEN': token }
      });

      if (eventRes.status === 410) {
        setErrorType('expired');
        setLoading(false);
        return;
      }
      
      if (eventRes.status === 404) {
        setErrorType('not-found');
        setLoading(false);
        return;
      }

      if (!eventRes.ok) {
        throw new Error('Invalid admin token');
      }

      const eventData = await eventRes.json();
      const eventInfo = eventData.data?.event || eventData.event;
      setEvent(eventInfo);

      // Load teams
      const teamsRes = await fetch(`/api/events/${eventInfo.id}/teams`, {
        headers: { 'X-ADMIN-TOKEN': token }
      });

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData.data?.teams || teamsData.teams || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !teamName.trim()) return;

    try {
      setAdding(true);
      const res = await fetch(`/api/events/${event.id}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-TOKEN': token
        },
        body: JSON.stringify({
          name: teamName.trim(),
          color: teamColor
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add team');
      }

      setTeamName('');
      setTeamColor('#3B82F6');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add team');
    } finally {
      setAdding(false);
    }
  };

  // Color palette for auto-assignment
  const teamColors = [
    '#9333ea', // purple
    '#db2777', // pink
    '#f59e0b', // amber
    '#10b981', // green
    '#3b82f6', // blue
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // rose
    '#f97316', // orange
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#84cc16', // lime
  ];

  // Helper to show success toast
  const showSuccessToast = (count: number) => {
    setTeamsAdded(count);
    setTimeout(() => setTeamsAdded(null), 4000);
  };

  // Add multiple teams with auto-assigned colors
  const addMultipleTeams = async (teamNames: string[]) => {
    if (!event || teamNames.length === 0) return;

    try {
      setBulkAdding(true);
      
      // Assign colors automatically
      const teamsData = teamNames.map((name, index) => ({
        name: name.trim(),
        color: teamColors[teams.length + index % teamColors.length],
      }));

      const res = await fetch('/api/teams/bulk', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'X-ADMIN-TOKEN': token 
        },
        body: JSON.stringify({ 
          event_id: event.id, 
          teams: teamsData 
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add teams');
      }

      showSuccessToast(teamNames.length);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to add teams');
    } finally {
      setBulkAdding(false);
    }
  };

  // Quick add single team (press Enter)
  const handleQuickAdd = async () => {
    if (!quickAddInput.trim()) return;
    
    await addMultipleTeams([quickAddInput.trim()]);
    setQuickAddInput('');
  };

  // Bulk paste handler
  const handleBulkPaste = async () => {
    const teamNames = bulkPasteText
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    if (teamNames.length === 0) {
      alert('Please enter at least one team name');
      return;
    }

    await addMultipleTeams(teamNames);
    setBulkPasteText('');
  };

  // File import handler
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const teamNames = text
        .split(/[\n,]/)
        .map(name => name.trim())
        .filter(name => name.length > 0);
      
      if (teamNames.length === 0) {
        alert('No valid team names found in file');
        return;
      }

      await addMultipleTeams(teamNames);
    };
    reader.readAsText(file);
    
    // Reset input
    e.target.value = '';
  };

  // Finalize event
  const handleFinalizeEvent = async () => {
    if (!event) return;

    try {
      setFinalizing(true);
      const res = await fetch(`/api/events/${event.id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin_token: token })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to finalize event');
      }

      setSuccessMessage('✅ Event finalized! Results are now published.');
      setShowFinalizeModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to finalize event');
    } finally {
      setFinalizing(false);
    }
  };

  // Unfinalize event
  const handleUnfinalizeEvent = async () => {
    if (!event) return;

    try {
      setFinalizing(true);
      const res = await fetch(`/api/events/${event.id}/finalize?admin_token=${token}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to unfinalize event');
      }

      setSuccessMessage('✅ Event reopened for editing');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to unfinalize event');
    } finally {
      setFinalizing(false);
    }
  };

  // Export PDF
  const handleExportPDF = async () => {
    if (!event) return;

    try {
      setExportingPDF(true);

      // Re-fetch latest teams using admin token to ensure freshest standings
      const teamsRes = await fetch(`/api/events/${event.id}/teams`, {
        headers: { 'X-ADMIN-TOKEN': token }
      });

      if (!teamsRes.ok) throw new Error('Failed to fetch teams for PDF');
      const teamsData = await teamsRes.json();
      const latestTeams = teamsData.data?.teams || teamsData.teams || [];

      // Fetch scores by day (public endpoint is fine for this)
      const res = await fetch(`/api/public/${event.public_token}`);
      if (!res.ok) throw new Error('Failed to fetch data for PDF');
      const data = await res.json();
      const scoresByDay = data.data?.scores_by_day || [];

      await generateResultsPDF({
        event: {
          event_name: event.name,
          mode: event.mode as any,
          theme_color: event.theme_color,
          public_token: event.public_token,
          finalized_at: event.finalized_at
        },
        teams: latestTeams.map((t: any) => ({
          id: Number(t.id),
          team_name: t.name,
          avatar_url: t.avatar_url || null,
          total_points: t.total_points || 0
        })),
        scoresByDay,
        includeLink: true
      });

      setSuccessMessage('✅ PDF downloaded successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to export PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (errorType === 'expired') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <ExpiredEvent showWaitlist={true} />
      </div>
    );
  }

  if (errorType === 'not-found') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <EventNotFoundError />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md bg-white rounded-lg shadow p-6 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/events/create')}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Create New Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-amber-50 py-10 px-4">
      {/* Interactive Tutorial */}
      <AdminTutorial />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-amber-500/10" />
          <div className="relative p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">A</div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{event?.name}</h1>
              </div>
              <button
                onClick={resetAdminTutorial}
                className="px-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-2"
                title="Restart tutorial"
              >
                <span className="text-lg">❓</span>
                <span className="hidden sm:inline">Tutorial</span>
              </button>
            </div>
            <p className="text-gray-600 mb-4">Admin Control Panel</p>
            
            {/* Event Links Manager */}
            <EventLinksManager
              eventId={event?.id || ''}
              eventName={event?.name || ''}
              adminToken={token}
              scorerToken={event?.scorer_token || ''}
              publicToken={event?.public_token || ''}
            />
            
            {/* Quick Access Links */}
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`/recap/${event?.public_token}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
              >
                <span>{event?.is_finalized ? '🏆' : '⚡'}</span>
                {event?.is_finalized ? 'Final Results' : 'Live Scores'}
              </a>
            </div>
          </div>
        </div>

        {/* Finalization & Export Section */}
        {event && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Results Management</h2>
            <div className="space-y-4">
              {/* Finalization Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Event Status</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {event.is_finalized 
                      ? `Finalized on ${new Date(event.finalized_at!).toLocaleString()}`
                      : 'Event is still active - scores can be edited'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {event.is_finalized ? (
                    <>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        ✓ Finalized
                      </span>
                      <button
                        onClick={handleUnfinalizeEvent}
                        disabled={finalizing}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm font-medium"
                      >
                        {finalizing ? 'Reopening...' : 'Reopen for Editing'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowFinalizeModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                    >
                      Publish Final Results
                    </button>
                  )}
                </div>
              </div>

              {/* PDF Export */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Export Results</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Download a PDF with team rankings, scores, and branding
                  </p>
                </div>
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPDF}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                >
                  <span>{exportingPDF ? '⏳' : '📄'}</span>
                  {exportingPDF ? 'Generating...' : 'Download PDF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Finalize Confirmation Modal */}
        {showFinalizeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Publish Final Results?
              </h3>
              <div className="space-y-3 mb-6 text-sm text-gray-600">
                <p>This will:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Mark the event as officially completed</li>
                  <li>Change "Live Scores" label to "Final Results"</li>
                  <li>Allow you to export results as PDF</li>
                  <li>You can still reopen for editing later</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFinalizeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalizeEvent}
                  disabled={finalizing}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                >
                  {finalizing ? 'Publishing...' : 'Publish Results'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 font-medium">
            {successMessage}
          </div>
        )}

        {/* Success Toast (floating) */}
        {teamsAdded !== null && (
          <div className="fixed bottom-6 right-6 p-6 bg-green-500 text-white rounded-xl shadow-2xl animate-slide-up z-50 max-w-sm">
            <div className="flex items-center gap-4">
              <div className="text-4xl animate-bounce">✅</div>
              <div>
                <p className="font-bold text-lg">Teams Added!</p>
                <p className="text-sm opacity-90">
                  {teamsAdded} {teamsAdded === 1 ? 'team' : 'teams'} created successfully
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 1: Bulk Team Import (Enhanced with 3 Methods) */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-purple-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              ＋
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add Teams</h2>
              <p className="text-base text-gray-600">Choose your preferred method to add teams quickly</p>
            </div>
          </div>

          {/* Method Selector Tabs */}
          <div className="flex gap-3 mb-6 border-b border-gray-200 pb-4">
            <button
              type="button"
              onClick={() => setImportMethod('paste')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                importMethod === 'paste'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clipboard className="w-5 h-5" />
              Bulk Paste
            </button>
            <button
              type="button"
              onClick={() => setImportMethod('quick')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                importMethod === 'quick'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Zap className="w-5 h-5" />
              Quick Add
            </button>
            <button
              type="button"
              onClick={() => setImportMethod('file')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
                importMethod === 'file'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-5 h-5" />
              Import File
            </button>
          </div>

          {/* METHOD 1: Bulk Paste (Primary) */}
          {importMethod === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  📋 Paste Team Names
                </label>
                <textarea
                  rows={10}
                  placeholder="Paste team names, one per line:&#10;Team Alpha&#10;Team Bravo&#10;Team Charlie&#10;Team Delta&#10;Team Echo"
                  className="w-full px-6 py-4 text-lg font-mono border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 bg-gray-50"
                  value={bulkPasteText}
                  onChange={(e) => setBulkPasteText(e.target.value)}
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm text-gray-600">
                    💡 Copy from Excel, Google Sheets, or any list
                  </p>
                  {bulkPasteText.trim() && (
                    <p className="text-sm font-semibold text-purple-600">
                      {bulkPasteText.split('\n').filter(line => line.trim()).length} teams ready
                    </p>
                  )}
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleBulkPaste}
                disabled={bulkAdding || !bulkPasteText.trim()}
                className="w-full py-5 px-8 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-bold text-xl rounded-xl hover:shadow-2xl transition disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-100"
              >
                {bulkAdding ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Teams...
                  </span>
                ) : (
                  `Add All ${bulkPasteText.split('\n').filter(line => line.trim()).length} Teams →`
                )}
              </button>
            </div>
          )}

          {/* METHOD 2: Quick Add (Press Enter) */}
          {importMethod === 'quick' && (
            <div className="space-y-4">
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  ⚡ Quick Add Teams
                </label>
                <input
                  type="text"
                  placeholder="Team name (press Enter to add)"
                  className="w-full px-6 py-5 text-xl border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 bg-gray-50"
                  value={quickAddInput}
                  onChange={(e) => setQuickAddInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleQuickAdd();
                    }
                  }}
                  disabled={bulkAdding}
                  autoFocus
                />
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-base text-blue-800 flex items-start gap-2">
                    <span className="text-2xl">💡</span>
                    <span>
                      <strong>Tip:</strong> Type team name → Press <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-sm font-mono">Enter</kbd> → Repeat
                      <br />
                      <span className="text-sm">Perfect for quickly adding teams one at a time!</span>
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* METHOD 3: File Import */}
          {importMethod === 'file' && (
            <div className="space-y-4">
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  📁 Import from File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-purple-400 transition bg-gray-50">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold inline-block">
                          Choose File
                        </span>
                        <input
                          id="file-upload"
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleFileImport}
                          className="hidden"
                        />
                      </label>
                      <p className="text-base text-gray-600 mt-3">
                        Upload a <strong>.txt</strong> or <strong>.csv</strong> file with team names
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-semibold text-amber-900 mb-2">Supported formats:</p>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• <strong>Text file (.txt):</strong> One team per line</li>
                    <li>• <strong>CSV file (.csv):</strong> Teams separated by commas or newlines</li>
                    <li>• <strong>Example:</strong> Team A, Team B, Team C</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Teams List (with Edit/Delete) */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Your Teams {teams.length > 0 && <span className="text-purple-600">({teams.length})</span>}
            </h2>
            {teams.length > 0 && (
              <div className="text-sm text-gray-600">
                Colors auto-assigned • Tap to edit
              </div>
            )}
          </div>
          
          {teams.length === 0 ? (
            <NoTeamsEmpty onAddTeams={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
          ) : (
            <div className="space-y-3">
              {teams.map((team, index) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-md transition-all border border-gray-200 hover:border-purple-300"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md"
                        style={{ backgroundColor: team.color }}
                      >
                        {safeInitial(team.name)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-gray-200">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 truncate">{team.name}</h3>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">{team.total_points || 0}</span> points total
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-4">
                      <div className="text-3xl font-bold text-purple-600">{team.total_points || 0}</div>
                    </div>
                    
                    {/* Edit Button */}
                    <button
                      onClick={() => {
                        const newName = prompt('Edit team name:', team.name);
                        if (newName && newName.trim() && newName !== team.name) {
                          // Update team name
                          fetch(`/api/teams/${team.id}`, {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                              'X-ADMIN-TOKEN': token
                            },
                            body: JSON.stringify({ name: newName.trim() })
                          }).then(() => loadData()).catch(err => alert('Failed to update team'));
                        }
                      }}
                      className="p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                      title="Edit team name"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${team.name}"? This will also delete all their scores.`)) {
                          fetch(`/api/teams/${team.id}`, {
                            method: 'DELETE',
                            headers: { 'X-ADMIN-TOKEN': token }
                          }).then(() => loadData()).catch(err => alert('Failed to delete team'));
                        }
                      }}
                      className="p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                      title="Delete team"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {teams.length > 0 && (
            <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>💡 Tip:</strong> Colors are automatically assigned from a palette. 
                You can edit team names or delete teams anytime.
              </p>
            </div>
          )}
        </div>

        {/* SECTION 3: Scorer Link (Primary Operational Link) */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">📝</div>
              <div>
                <h3 className="text-xl font-bold text-blue-900">Scorer Interface</h3>
                <p className="text-sm text-blue-700">Dedicated interface for adding scores</p>
              </div>
            </div>
            <p className="text-blue-800 mb-4">
              All scores must be added via the scorer link. This keeps scoring separate from admin functions and prevents accidental changes.
            </p>
            <a
              href={`/score/${event?.scorer_token}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition font-semibold"
            >
              <span>🚀</span>
              Open Scorer Interface
              <span className="text-xs opacity-75">↗</span>
            </a>
          </div>

        {/* SECTION 4: Links Section (Collapsed Dropdown) */}
        <div className="bg-white rounded-xl shadow border border-gray-200">
          <button
            onClick={() => setShowLinksDropdown(!showLinksDropdown)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔗</span>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Event Links</h3>
                <p className="text-sm text-gray-600">Admin, Scorer, and Public URLs</p>
              </div>
            </div>
            <span className={`text-2xl transition-transform ${showLinksDropdown ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {showLinksDropdown && (
            <div className="px-6 pb-6 pt-2 border-t border-gray-200">
              <EventLinksManager
                eventId={event?.id || ''}
                eventName={event?.name || ''}
                adminToken={token}
                scorerToken={event?.scorer_token || ''}
                publicToken={event?.public_token || ''}
              />
              
              {/* Quick Access Buttons */}
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={`/history/${token}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                >
                  <span>📊</span>
                  Score History
                </a>
                <a
                  href={`/recap/${event?.public_token}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
                >
                  <span>{event?.is_finalized ? '🏆' : '⚡'}</span>
                  {event?.is_finalized ? 'Final Results' : 'Live Scores'}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: Results Management (Export/Finalize) */}
        {event && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span>
              Results Management
            </h2>
            <div className="space-y-4">
              {/* Finalization Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Event Status</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {event.is_finalized 
                      ? `Finalized on ${new Date(event.finalized_at!).toLocaleString()}`
                      : 'Event is still active - scores can be edited'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {event.is_finalized ? (
                    <>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        ✓ Finalized
                      </span>
                      <button
                        onClick={handleUnfinalizeEvent}
                        disabled={finalizing}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm font-medium"
                      >
                        {finalizing ? 'Reopening...' : 'Reopen for Editing'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowFinalizeModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                    >
                      Publish Final Results
                    </button>
                  )}
                </div>
              </div>

              {/* PDF Export */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Export Results</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Download a PDF with team rankings, scores, and branding
                  </p>
                </div>
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPDF}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                >
                  <span>{exportingPDF ? '⏳' : '📄'}</span>
                  {exportingPDF ? 'Generating...' : 'Download PDF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: Past Events (Read-only, Last Section) */}
        <PastEventsSection adminToken={token} />
      </div>
    </div>
  );
}
