"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getTelemetryEvents, getViolationCount } from "@/lib/api";

interface TelemetryEvent {
  id: number;
  eventType: string;
  severity: string;
  recordedAt: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const candidateId = Number(searchParams.get("candidateId") || 1);

  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [candidateId]);

  const loadData = async () => {
    try {
      const [evts, cnt] = await Promise.all([
        getTelemetryEvents(candidateId),
        getViolationCount(candidateId),
      ]);
      setEvents(evts);
      setCount(cnt.violationCount);
    } catch {
      // Backend may not be running yet
    } finally {
      setLoading(false);
    }
  };

  const severityColor: Record<string, string> = {
    LOW: "text-gray-400 bg-gray-400/10",
    MEDIUM: "text-jatayu-warn bg-jatayu-warn/10",
    HIGH: "text-orange-400 bg-orange-400/10",
    CRITICAL: "text-jatayu-danger bg-jatayu-danger/10",
  };

  const eventIcon: Record<string, string> = {
    TAB_SWITCH: "🔀",
    FOCUS_LOST: "👁️",
    PASTE_DETECTED: "📋",
    GHOST_TYPING: "👻",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🛡️ Guardian Watchdog Dashboard</h1>
        <span className="text-sm text-gray-500">
          Candidate #{candidateId} • Auto-refreshing
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Violations"
          value={count}
          color={count > 5 ? "text-jatayu-danger" : "text-jatayu-warn"}
        />
        <StatCard
          label="Tab Switches"
          value={events.filter((e) => e.eventType === "TAB_SWITCH").length}
          color="text-orange-400"
        />
        <StatCard
          label="Paste Events"
          value={events.filter((e) => e.eventType === "PASTE_DETECTED").length}
          color="text-jatayu-warn"
        />
        <StatCard
          label="Ghost Typing"
          value={events.filter((e) => e.eventType === "GHOST_TYPING").length}
          color="text-jatayu-danger"
        />
      </div>

      {/* Event Log */}
      <div className="rounded-xl border border-jatayu-border bg-jatayu-panel">
        <div className="border-b border-jatayu-border px-5 py-3">
          <h2 className="text-sm font-semibold">Live Event Log</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading telemetry...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No violations detected yet. The Guardian Watchdog is monitoring.
          </div>
        ) : (
          <div className="divide-y divide-jatayu-border">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center gap-4 px-5 py-3 text-sm transition-colors hover:bg-jatayu-dark/50"
              >
                <span className="text-lg">{eventIcon[evt.eventType] || "⚠️"}</span>
                <div className="flex-1">
                  <span className="font-medium">{evt.eventType.replace(/_/g, " ")}</span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    severityColor[evt.severity] || ""
                  }`}
                >
                  {evt.severity}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(evt.recordedAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-jatayu-border bg-jatayu-panel p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
