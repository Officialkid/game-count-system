"use client";

import { useEffect, useState } from "react";
import { Shield, AlertTriangle, User, Sliders, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import * as appwriteEvents from "@/lib/services/appwriteEvents";
import { useAuth } from "@/lib/auth-context";

interface ProfileState {
  name: string;
  email: string;
}

type EventDefaults = {
  allow_negative: boolean;
  display_mode: "cumulative" | "per-game";
};

export default function SettingsPage() {
  const { user, authReady } = useAuth();
  const [profile, setProfile] = useState<ProfileState>({ name: "", email: "" });
  const [eventDefaults, setEventDefaults] = useState<EventDefaults>({
    allow_negative: false,
    display_mode: "cumulative",
  });
  const [status, setStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const restartTutorial = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("onboarding:start"));
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!authReady || !user) return;
      const [eventsRes] = await Promise.all([
        appwriteEvents.getEvents(user.id),
      ]);

      if (!active) return;
      setProfile({
        name: user.name,
        email: user.email,
      });

      const firstEvent = eventsRes.data?.events?.[0];
      setEventDefaults({
        allow_negative: firstEvent?.allow_negative ?? false,
        display_mode: (firstEvent?.display_mode as EventDefaults["display_mode"]) || "cumulative",
      });
    };

    load();
    return () => {
      active = false;
    };
  }, [authReady, user]);

  const handleSave = async () => {
    setSaving(true);
    setStatus("");
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setStatus("Preferences updated");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-purple-600 font-semibold">Settings</p>
            <h1 className="text-3xl font-extrabold text-neutral-900 mt-1">Personalize your GameScore</h1>
            <p className="text-neutral-600 mt-1">All changes are stored locally for now while the backend is offline.</p>
          </div>
          <Shield className="w-10 h-10 text-purple-500" aria-hidden />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex items-center gap-2">
              <User className="w-5 h-5 text-purple-500" />
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Name"
                value={profile.name}
                onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Your display name"
              />
              <Input
                label="Email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="you@example.com"
              />
              <p className="text-xs text-neutral-500">Mock profile only — syncing will return when the backend is live.</p>
              <Button onClick={handleSave} isLoading={saving} disabled={saving} className="mt-2">
                Save profile
              </Button>
              {status && <p className="text-sm text-green-600">{status}</p>}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <CardTitle>Onboarding tutorial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-neutral-700">
                Need a refresher? Restart the guided walkthrough with spotlight steps for create, dashboard cards, score entry, and recap.
              </p>
              <Button variant="secondary" onClick={restartTutorial}>
                Restart tutorial
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-500" />
              <CardTitle>Event defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between border border-neutral-200 rounded-lg px-4 py-3 bg-white">
                <div>
                  <p className="font-semibold text-neutral-900">Allow negative scores</p>
                  <p className="text-sm text-neutral-600">Use when penalties should reduce totals.</p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={eventDefaults.allow_negative}
                    onChange={(e) =>
                      setEventDefaults((prev) => ({ ...prev, allow_negative: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-neutral-300 text-purple-600 focus:ring-purple-500"
                  />
                  Enable
                </label>
              </div>

              <div className="border border-neutral-200 rounded-lg px-4 py-3 bg-white">
                <p className="font-semibold text-neutral-900">Display mode</p>
                <p className="text-sm text-neutral-600">Choose how scores appear by default.</p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {["cumulative", "per-game"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        setEventDefaults((prev) => ({ ...prev, display_mode: mode as EventDefaults["display_mode"] }))
                      }
                      className={`w-full px-4 py-3 rounded-lg border text-left transition-all ${
                        eventDefaults.display_mode === mode
                          ? "border-purple-600 bg-purple-50 text-purple-700 shadow-sm"
                          : "border-neutral-200 text-neutral-700 hover:border-neutral-300"
                      }`}
                    >
                      <p className="font-semibold capitalize">{mode.replace("-", " ")}</p>
                      <p className="text-xs text-neutral-600">{mode === "cumulative" ? "Running total across games" : "Reset every game"}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleSave} isLoading={saving} disabled={saving}>
                Save defaults
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <CardTitle>Danger zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-neutral-700">
                These actions are disabled while running in mock mode. They will re-enable once the backend is
                connected.
              </p>
              <div className="space-y-3">
                <Button variant="danger" fullWidth disabled>
                  Delete account
                </Button>
                <Button variant="danger" fullWidth disabled>
                  Reset all events
                </Button>
              </div>
              <p className="text-xs text-neutral-500">Looking for something else? Reach out to an admin when live data is available.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
