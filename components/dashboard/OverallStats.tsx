"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { OverallScore } from "@/lib/types";

interface OverallStatsProps {
  score: OverallScore;
}

interface MetricItemProps {
  label: string;
  value: string | number | null;
  subtext?: string;
  highlight?: boolean;
}

function MetricItem({ label, value, subtext, highlight }: MetricItemProps) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div
        className="metric-value"
        style={{ color: highlight ? "var(--accent)" : undefined }}
      >
        {value !== null && value !== undefined ? value : "—"}
      </div>
      {subtext && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          {subtext}
        </div>
      )}
    </div>
  );
}

export function OverallStats({ score }: OverallStatsProps) {
  const trendIcon =
    score.trend === null ? null : score.trend > 0 ? (
      <TrendingUp size={14} style={{ color: "var(--green)" }} />
    ) : score.trend < 0 ? (
      <TrendingDown size={14} style={{ color: "var(--red)" }} />
    ) : (
      <Minus size={14} style={{ color: "var(--text-muted)" }} />
    );

  const trendColor =
    score.trend === null
      ? "var(--text-muted)"
      : score.trend > 0
      ? "var(--green)"
      : score.trend < 0
      ? "var(--red)"
      : "var(--text-muted)";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 10,
        marginBottom: 20,
      }}
    >
      {/* Main score */}
      <div
        className="metric-card"
        style={{
          gridColumn: "span 2",
          background: "var(--accent-subtle)",
          borderColor: "rgba(108, 99, 255, 0.2)",
        }}
      >
        <div className="metric-label">Overall Score</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div
            className="metric-value"
            style={{ fontSize: 40, color: "var(--accent)" }}
          >
            {score.current !== null ? score.current : "—"}
          </div>
          {score.current !== null && (
            <span style={{ fontSize: 16, color: "var(--text-muted)", fontWeight: 400 }}>/100</span>
          )}
        </div>
        {score.trend !== null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 4,
              color: trendColor,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {trendIcon}
            <span>
              {score.trend > 0 ? "+" : ""}
              {score.trend} vs last week
            </span>
          </div>
        )}
      </div>

      <MetricItem
        label="Average"
        value={score.average !== null ? score.average : null}
      />
      <MetricItem
        label="Highest"
        value={score.high !== null ? score.high : null}
      />
      <MetricItem
        label="Lowest"
        value={score.low !== null ? score.low : null}
      />
      <MetricItem
        label="Streak"
        value={score.streak > 0 ? `${score.streak}d` : "—"}
        subtext={score.streak > 0 ? "consecutive days" : "No current streak"}
      />
    </div>
  );
}
