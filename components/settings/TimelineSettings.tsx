"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { TimelineRange, Granularity } from "@/lib/types";

const RANGE_OPTIONS: Array<{ value: TimelineRange; label: string }> = [
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
  { value: "year", label: "Last year" },
];

const GRANULARITY_OPTIONS: Array<{ value: Granularity; label: string }> = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function TimelineSettings() {
  const { settings, updateSettings } = useApp();
  const { timeline } = settings;

  const setDefaultRange = (range: TimelineRange) => {
    updateSettings({ ...settings, timeline: { ...timeline, defaultRange: range } });
  };

  const setGranularity = (granularity: Granularity) => {
    updateSettings({
      ...settings,
      timeline: { ...timeline, custom: { ...timeline.custom, granularity } },
    });
  };

  return (
    <div>
      <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Timeline Defaults</h3>

      <div style={{ marginBottom: 20 }}>
        <label className="label">Default Range</label>
        <select
          className="input"
          style={{ appearance: "auto" }}
          value={timeline.defaultRange}
          onChange={(e) => setDefaultRange(e.target.value as TimelineRange)}
        >
          {RANGE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value} style={{ background: "var(--bg-elevated)" }}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Custom Granularity Default</label>
        <div style={{ display: "flex", gap: 6 }}>
          {GRANULARITY_OPTIONS.map((g) => (
            <button
              key={g.value}
              className="btn"
              onClick={() => setGranularity(g.value)}
              style={{
                flex: 1,
                justifyContent: "center",
                background: timeline.custom.granularity === g.value ? "var(--accent)" : "var(--bg-elevated)",
                color: timeline.custom.granularity === g.value ? "#fff" : "var(--text-secondary)",
                border: timeline.custom.granularity === g.value ? "1px solid var(--accent)" : "1px solid var(--border)",
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
