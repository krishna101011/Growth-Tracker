"use client";

import React from "react";
import { RangeMetrics } from "@/lib/types";

interface RangeMetricsBarProps {
  metrics: RangeMetrics;
}

function MetricBadge({
  label,
  value,
  suffix = "",
  color,
}: {
  label: string;
  value: number | string | null;
  suffix?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "10px 16px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        minWidth: 80,
        flex: 1,
      }}
    >
      <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <span style={{ fontSize: 16, fontWeight: 700, color: color ?? "var(--text-primary)" }}>
        {value !== null && value !== undefined ? `${value}${suffix}` : "—"}
      </span>
    </div>
  );
}

export function RangeMetricsBar({ metrics }: RangeMetricsBarProps) {
  if (metrics.dataPoints === 0) return null;

  const changeColor =
    metrics.absoluteChange === null
      ? "var(--text-muted)"
      : metrics.absoluteChange > 0
      ? "var(--green)"
      : metrics.absoluteChange < 0
      ? "var(--red)"
      : "var(--text-secondary)";

  const trendLabel =
    metrics.trendDirection === "up"
      ? "↑ Uptrend"
      : metrics.trendDirection === "down"
      ? "↓ Downtrend"
      : metrics.trendDirection === "flat"
      ? "→ Flat"
      : "—";

  const volatilityLabel =
    metrics.volatility === null
      ? null
      : metrics.volatility < 5
      ? "Very consistent"
      : metrics.volatility < 15
      ? "Moderate variation"
      : "High variation";

  return (
    <div
      className="range-metrics-bar"
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        paddingBottom: 4,
        marginTop: 12,
      }}
    >
      <MetricBadge label="Start" value={metrics.startScore} />
      <MetricBadge label="End" value={metrics.endScore} />
      <MetricBadge
        label="Change"
        value={
          metrics.absoluteChange !== null
            ? `${metrics.absoluteChange > 0 ? "+" : ""}${metrics.absoluteChange}`
            : null
        }
        color={changeColor}
      />
      <MetricBadge
        label="% Change"
        value={
          metrics.percentChange !== null
            ? `${metrics.percentChange > 0 ? "+" : ""}${metrics.percentChange}`
            : null
        }
        suffix="%"
        color={changeColor}
      />
      <MetricBadge label="Avg" value={metrics.average} />
      <MetricBadge label="High" value={metrics.high} color="var(--green)" />
      <MetricBadge label="Low" value={metrics.low} color="var(--red)" />
      <MetricBadge label="Trend" value={trendLabel} />
      {volatilityLabel && <MetricBadge label="Consistency" value={volatilityLabel} />}
    </div>
  );
}
