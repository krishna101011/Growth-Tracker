"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartDataPoint, Section } from "@/lib/types";

// ─── Color palette for sections ───────────────────────────────────────────────

const SECTION_COLORS = [
  "#6c63ff", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6",
  "#ec4899", "#14b8a6", "#8b5cf6", "#f97316", "#06b6d4",
];

export function getSectionColor(section: Section, index: number): string {
  return section.color || SECTION_COLORS[index % SECTION_COLORS.length];
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        boxShadow: "var(--shadow-md)",
        minWidth: 140,
      }}
    >
      <p style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 6, fontWeight: 500 }}>
        {label}
      </p>
      {payload.map((item) => (
        <div
          key={item.name}
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: item.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{item.name}</span>
          <span style={{ color: "var(--text-primary)", fontWeight: 700, marginLeft: "auto", fontSize: 13 }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Custom Dot ───────────────────────────────────────────────────────────────

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: ChartDataPoint;
  dataKey?: string;
  fill?: string;
  onDotClick?: (point: ChartDataPoint, sectionId: string) => void;
}

function CustomDot({ cx, cy, payload, dataKey, fill, onDotClick }: CustomDotProps) {
  const [hovered, setHovered] = useState(false);

  if (!cx || !cy || !payload) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={hovered ? 6 : 4}
      fill={fill}
      stroke={hovered ? "var(--bg-surface)" : "transparent"}
      strokeWidth={2}
      style={{ cursor: "pointer", transition: "r 0.1s" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (onDotClick && payload && dataKey) {
          onDotClick(payload, dataKey === "overall" ? "overall" : dataKey);
        }
      }}
    />
  );
}

// ─── Main Growth Chart ────────────────────────────────────────────────────────

interface GrowthChartProps {
  data: ChartDataPoint[];
  sections: Section[];
  activeSectionIds: string[] | "all";
  showOverall?: boolean;
  onPointClick?: (point: ChartDataPoint, sectionId: string) => void;
  height?: number;
}

export function GrowthChart({
  data,
  sections,
  activeSectionIds,
  showOverall = true,
  onPointClick,
  height = 340,
}: GrowthChartProps) {
  const visibleSections =
    activeSectionIds === "all"
      ? sections.filter((s) => !s.archived)
      : sections.filter((s) => !s.archived && activeSectionIds.includes(s.id));

  // Empty state
  if (data.length === 0 || data.every((d) => d.overall === undefined)) {
    return (
      <div
        style={{
          height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          gap: 8,
        }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>No data for this period</p>
        <p style={{ fontSize: 12 }}>Add scores to your sections to see the chart</p>
      </div>
    );
  }

  const showMultipleSections = visibleSections.length > 1 || activeSectionIds !== "all";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--chart-grid)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          dy={8}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          ticks={[0, 25, 50, 75, 100]}
          width={32}
        />
        <Tooltip content={<CustomTooltip />} />

        {showOverall && (
          <Line
            key="overall"
            type="monotone"
            dataKey="overall"
            name="Overall"
            stroke="#6c63ff"
            strokeWidth={2.5}
            dot={(props) => (
              <CustomDot
                {...props}
                dataKey="overall"
                fill="#6c63ff"
                onDotClick={onPointClick}
              />
            )}
            activeDot={false}
            connectNulls
          />
        )}

        {showMultipleSections &&
          visibleSections.map((section, i) => {
            const color = getSectionColor(section, i);
            return (
              <Line
                key={section.id}
                type="monotone"
                dataKey={section.id}
                name={section.name}
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray={showOverall ? "4 3" : undefined}
                dot={(props) => (
                  <CustomDot
                    {...props}
                    dataKey={section.id}
                    fill={color}
                    onDotClick={onPointClick}
                  />
                )}
                activeDot={false}
                connectNulls
              />
            );
          })}
      </LineChart>
    </ResponsiveContainer>
  );
}
