"use client";

import React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: Array<{ value: number }>;
  color?: string;
  height?: number;
  trend?: "up" | "down" | "flat" | "none";
}

export function Sparkline({ data, color, height = 40, trend }: SparklineProps) {
  const lineColor =
    color ||
    (trend === "up" ? "#22c55e" : trend === "down" ? "#ef4444" : "#6c63ff");

  if (!data || data.length < 2) {
    return <div style={{ height, opacity: 0.3, borderBottom: `1px solid ${lineColor}` }} />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
