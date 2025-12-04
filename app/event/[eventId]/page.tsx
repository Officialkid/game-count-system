'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { getPaletteById } from '@/lib/color-palettes';
import { TeamsTab } from '@/components/event-tabs/TeamsTab';
import { ScoringTab } from '@/components/event-tabs/ScoringTab';
import { ScoringModal } from '@/components/modals/ScoringModal';
import { HistoryTab } from '@/components/event-tabs/HistoryTab';
import { AnalyticsTab } from '@/components/event-tabs/AnalyticsTab';
import { SettingsTab } from '@/components/event-tabs/SettingsTab';
import { EditEventModal } from '@/components/modals/EditEventModal';
import { auth } from '@/lib/api-client';

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '107, 70, 193';
}

interface Event {
  id: number;
  event_name: string;
  theme_color: string;
  logo_url: string | null;
  allow_negative: boolean;
  display_mode: string;
  status: string;
  created_at: string;
}

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('teams');
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const token = auth.getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    if (eventId) {
      loadEvent(token);
    }
    
    // Check for tab query parameter
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && ['teams', 'scoring', 'history', 'analytics', 'settings'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [eventId, router]);

  const loadEvent = async (token: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error('Failed to load event:', data.error);
        throw new Error(data.error || 'Failed to load event');
      }

      // API returns { success: true, data: { event: {...}, teams: [...] } }
      if (data.data?.event) {
        setEvent(data.data.event);
        
        // Load share link to get the token
        try {
          const linkResponse = await fetch(`/api/events/${eventId}/share-link`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (linkResponse.ok) {
            const linkData = await linkResponse.json();
            const shareTokenValue = linkData.data?.shareLink?.share_token || linkData.shareLink?.share_token;
            setShareToken(shareTokenValue);
          }
        } catch (error) {
          console.error('Error loading share link:', error);
        }
      } else {
        throw new Error('Event data not found in response');
      }
    } catch (err: any) {
      console.error('Error loading event:', err);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = () => {
    // TODO: Implement edit event modal
    alert('Edit event functionality coming soon!');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Event not found</p>
        <Link href="/dashboard">
          <Button variant="primary" className="mt-4">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const palette = getPaletteById(event.theme_color) || getPaletteById('purple');

  return (
    <div className="min-h-screen" style={{ backgroundColor: palette!.background }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="font-medium flex items-center space-x-1"
            style={{ color: palette!.primary }}
          >
            <span>←</span>
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Event Header - Enhanced Layout */}
        <div
          className="bg-gradient-to-br rounded-3xl shadow-2xl p-8 mb-8 border-t-4 overflow-hidden relative backdrop-blur-xl"
          style={{
            background: `linear-gradient(135deg, rgba(${hexToRgb(palette!.primary)}, 0.1) 0%, rgba(${hexToRgb(palette!.accent)}, 0.08) 100%), rgba(255, 255, 255, 0.6)`,
            borderTopColor: palette!.primary,
            boxShadow: `0 8px 32px 0 rgba(31, 38, 135, 0.37)`,
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full" style={{ background: `${palette!.accent}10` }}></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full" style={{ background: `${palette!.primary}10` }}></div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-6 md:space-y-0 relative z-10">
            {/* Left: Logo & Title */}
            <div className="flex items-start space-x-6">
              {event.logo_url && (
                <img
                  src={event.logo_url}
                  alt={event.event_name}
                  className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                  style={{ boxShadow: `0 0 0 4px ${palette!.primary}30` }}
                />
              )}
              <div className="flex-1">
                <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">{event.event_name}</h1>
                <div className="flex items-center space-x-4 flex-wrap gap-3">
                  <Badge variant={event.status === 'active' ? 'success' : 'default'} className="px-4 py-2 text-sm font-semibold shadow-md">
                    {event.status === 'active' ? '🟢 Active' : '⚫ Inactive'}
                  </Badge>
                  
                  {/* Palette Preview */}
                  <div className="flex items-center space-x-2 px-4 py-2 rounded-lg" style={{ background: `${palette!.primary}10` }}>
                    <div className="flex space-x-2">
                      <div className="w-5 h-5 rounded-full" style={{ background: palette!.primary }}></div>
                      <div className="w-5 h-5 rounded-full" style={{ background: palette!.secondary }}></div>
                      <div className="w-5 h-5 rounded-full" style={{ background: palette!.accent }}></div>
                    </div>
                    <span className="text-xs font-semibold text-gray-600" style={{ color: palette!.text }}>{palette!.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-col space-y-3">\n              <Button
                onClick={() => setShowScoringModal(true)}
                style={{ backgroundColor: palette!.primary }}
                className="text-white font-bold py-3 px-8 rounded-xl text-lg shadow-lg hover:shadow-2xl transition-all hover:scale-105 hover:-translate-y-1 duration-200 backdrop-blur-sm"
              >
                ➕ Quick Add Score
              </Button>
              {shareToken ? (
                <Link href={`/scoreboard/${shareToken}`} target="_blank">
                  <Button 
                    className="w-full text-lg font-bold py-3 px-6 rounded-xl transition-all hover:scale-105"
                    style={{ backgroundColor: palette!.accent }}
                  >
                    👁️ View Public Scoreboard
                  </Button>
                </Link>
              ) : (
                <Button 
                  className="w-full text-lg font-bold py-3 px-6 rounded-xl"
                  disabled 
                  title="Create a share link in Settings tab first"
                  style={{ opacity: 0.5 }}
                >
                  👁️ View Public Scoreboard
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs 
          defaultValue={activeTab} 
          activeColor={palette!.primary}
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger value="teams">🏆 Teams</TabsTrigger>
            <TabsTrigger value="scoring">➕ Scoring</TabsTrigger>
            <TabsTrigger value="history">📊 History</TabsTrigger>
            <TabsTrigger value="analytics">📈 Analytics</TabsTrigger>
            <TabsTrigger value="settings">⚙️ Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="teams">
            <TeamsTab eventId={eventId} event={event} />
          </TabsContent>

          <TabsContent value="scoring">
            <ScoringTab eventId={eventId} event={event} />
          </TabsContent>

          <TabsContent value="history">
            <HistoryTab eventId={eventId} event={event} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab eventId={eventId} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab eventId={eventId} eventName={event.event_name} />
          </TabsContent>
        </Tabs>

        <ScoringModal eventId={eventId} isOpen={showScoringModal} onClose={() => setShowScoringModal(false)} event={event} />
        <EditEventModal
          eventId={eventId}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          initial={{
            event_name: event.event_name,
            theme_color: event.theme_color,
            logo_url: event.logo_url,
            allow_negative: event.allow_negative,
            display_mode: event.display_mode,
          }}
        />
      </div>
    </div>
  );
}
