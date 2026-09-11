"use client";

import React, { useState } from "react";
import { TimelineRange, Granularity } from "@/lib/types";

interface TimeControlsProps {
  range: TimelineRange;
  startDate: string;
  endDate: string;
  granularity: Granularity;
  onRangeChange: (range: TimelineRange) => void;
  onCustomChange: (start: string, end: string, granularity: Granularity) => void;
}

const RANGES: Array<{ value: TimelineRange; label: string }> = [
  { value: "week", label: "7D" },
  { value: "month", label: "30D" },
  { value: "year", label: "1Y" },
  { value: "custom", label: "Custom" },
];

export function TimeControls({
  range,
  startDate,
  endDate,
  granularity,
  onRangeChange,
  onCustomChange,
}: TimeControlsProps) {
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);
  const [localGran, setLocalGran] = useState<Granularity>(granularity);

  const applyCustom = () => {
    if (localStart && localEnd && localStart <= localEnd) {
      onCustomChange(localStart, localEnd, localGran);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      {/* Range tabs */}
      <div
        style={{
          display: "flex",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: 3,
          gap: 2,
        }}
      >
        {RANGES.map((r) => (
          <button
            key={r.value}
            id={`range-${r.value}`}
            onClick={() => onRangeChange(r.value)}
            className="btn"
            style={{
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: 500,
              borderRadius: "var(--radius-sm)",
              background: range === r.value ? "var(--accent)" : "transparent",
              color: range === r.value ? "#fff" : "var(--text-secondary)",
              border: "none",
              transition: "all 0.15s",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {range === "custom" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <input
            type="date"
            className="input"
            style={{ width: 140 }}
            value={localStart}
            max={localEnd}
            onChange={(e) => setLocalStart(e.target.value)}
          />
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>to</span>
          <input
            type="date"
            className="input"
            style={{ width: 140 }}
            value={localEnd}
            min={localStart}
            onChange={(e) => setLocalEnd(e.target.value)}
          />
          <select
            className="input"
            style={{ width: 110, appearance: "auto" }}
            value={localGran}
            onChange={(e) => setLocalGran(e.target.value as Granularity)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={applyCustom}>
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
