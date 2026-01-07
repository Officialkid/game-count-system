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
import { useAuth } from '@/lib/auth-context';

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '107, 70, 193';
}

'use client';

export default function EventDetailPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Event management disabled</h1>
      <p className="text-gray-700 text-lg leading-relaxed">
        The legacy authenticated event management page has been removed. Use the token-based links generated when you create an event:
      </p>
      <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
        <li>Admin link → manage teams, settings, and scoring.</li>
        <li>Scorer link → submit scores.</li>
        <li>Public link → view live scoreboard.</li>
        <li>Recap link → view recap page (/recap/{{public_token}}).</li>
      </ul>
    </div>
  );
}
          <TabsList>
            <TabsTrigger value="teams">🏆 Teams</TabsTrigger>
            <TabsTrigger value="scoring">➕ Scoring</TabsTrigger>
            <TabsTrigger value="history">📊 History</TabsTrigger>
            <TabsTrigger value="analytics">📈 Analytics</TabsTrigger>
            <TabsTrigger value="settings">⚙️ Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="teams">
            <TeamsTab eventId={eventId} event={event} refreshTrigger={refreshTrigger} />
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

        <ScoringModal 
          eventId={eventId} 
          isOpen={showScoringModal} 
          onClose={() => setShowScoringModal(false)} 
          event={event} 
          onScoreAdded={() => setRefreshTrigger(prev => prev + 1)}
        />
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
