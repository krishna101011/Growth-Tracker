"use client";

import React from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { Goal, GoalEntry } from "@/lib/types";
import { GoalChartPoint, buildGoalChartData } from "@/lib/goalScoring";

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
  goal: Goal;
}

function GoalTooltip({ active, payload, label, goal }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        boxShadow: "var(--shadow-md)",
        minWidth: 150,
      }}
    >
      <p style={{ color: "var(--text-muted)", fontSize: 11, marginBottom: 6, fontWeight: 500 }}>
        {label}
      </p>
      {payload.map((item) => {
        let displayValue = `${item.value}`;
        if (item.dataKey === "achievementPct") {
          displayValue = `${item.value}%`;
        } else if (item.dataKey !== "target" && goal.unit) {
          displayValue = `${item.value} ${goal.unit}`;
        }
        return (
          <div
            key={item.dataKey}
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
              {displayValue}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Goal Chart ──────────────────────────────────────────────────────────

interface GoalChartProps {
  goal: Goal;
  goalEntries: GoalEntry[];
  startDate: string;
  endDate: string;
  granularity: "daily" | "weekly" | "monthly";
  height?: number;
  showAchievementPct?: boolean;
}

export function GoalChart({
  goal,
  goalEntries,
  startDate,
  endDate,
  granularity,
  height = 280,
  showAchievementPct = false,
}: GoalChartProps) {
  const data: GoalChartPoint[] = buildGoalChartData(goal, goalEntries, startDate, endDate, granularity);

  const hasData = data.some((d) => d.actual !== undefined);
  const isBinary = goal.metricType === "binary";

  if (!hasData) {
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
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M12 2v20M2 12h20" />
        </svg>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>No actuals logged yet</p>
        <p style={{ fontSize: 12 }}>Log your first actual to see the chart</p>
      </div>
    );
  }

  const maxActual = Math.max(
    ...data.filter((d) => d.actual !== undefined).map((d) => d.actual as number),
    goal.targetValue
  );

  const yDomain = isBinary || showAchievementPct ? [0, 100] : [0, Math.ceil(maxActual * 1.2)];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
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
          domain={yDomain}
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={36}
          tickFormatter={(v: number) => showAchievementPct || isBinary ? `${v}%` : String(v)}
        />
        <Tooltip content={<GoalTooltip goal={goal} />} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "var(--text-muted)", paddingTop: 8 }}
        />

        {/* Target reference line */}
        {!showAchievementPct && !isBinary && (
          <ReferenceLine
            y={goal.targetValue}
            stroke="var(--accent)"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{
              value: `Target: ${goal.targetValue}${goal.unit ? ` ${goal.unit}` : ""}`,
              position: "insideTopRight",
              fill: "var(--accent)",
              fontSize: 10,
            }}
          />
        )}

        {/* 100% reference line for achievement view */}
        {(showAchievementPct || isBinary) && (
          <ReferenceLine
            y={100}
            stroke="var(--green)"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{
              value: "100%",
              position: "insideTopRight",
              fill: "var(--green)",
              fontSize: 10,
            }}
          />
        )}

        {/* Actual bars */}
        {!showAchievementPct && !isBinary && (
          <Bar
            dataKey="actual"
            name={`Actual (${goal.unit || "value"})`}
            fill="rgba(108,99,255,0.6)"
            radius={[3, 3, 0, 0]}
            maxBarSize={32}
          />
        )}

        {/* Achievement % line */}
        {(showAchievementPct || isBinary) && (
          <Line
            type="monotone"
            dataKey="achievementPct"
            name="Achievement %"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#22c55e" }}
            connectNulls
          />
        )}

        {/* For binary: also show bars */}
        {isBinary && (
          <Bar
            dataKey="actual"
            name="Completed"
            fill="rgba(34,197,94,0.5)"
            radius={[3, 3, 0, 0]}
            maxBarSize={32}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
