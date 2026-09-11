// ─── Goal Scoring & Metrics ───────────────────────────────────────────────────
// Pure calculation utilities — no React, no storage side-effects.

import { Goal, GoalEntry } from "./types";
import { parseISO, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, endOfMonth } from "./dates";

// ─── Achievement Calculation ──────────────────────────────────────────────────

export interface AchievementResult {
  achievementPct: number; // real value, may exceed 100
  displayPct: number;     // capped at 100 for visual progress bars
}

/**
 * Calculate achievement percentage from actual vs target.
 * Returns 0 if target is 0 (no divide-by-zero).
 * Caps displayPct at 100 while preserving the real achievementPct.
 */
export function calculateAchievement(actual: number, target: number): AchievementResult {
  if (target === 0) {
    // Binary goal treated as 100% if actual === 1, 0% otherwise
    return { achievementPct: actual >= 1 ? 100 : 0, displayPct: actual >= 1 ? 100 : 0 };
  }
  const pct = Math.round((actual / target) * 1000) / 10; // 1 decimal
  return {
    achievementPct: pct,
    displayPct: Math.min(100, pct),
  };
}

// ─── Goal Metrics ─────────────────────────────────────────────────────────────

export interface GoalMetrics {
  target: number;
  latestActual: number | null;
  achievementPct: number | null;    // of latest actual
  averageActual: number | null;
  best: number | null;
  worst: number | null;
  completionDays: number;           // days where achievement >= 100%
  missedDays: number;               // days with 0 logged (within period, for daily goals)
  currentStreak: number;            // consecutive days with any entry (descending from today)
  consistency: number | null;       // % of expected periods with an entry
  entryCount: number;
}

/**
 * Calculate comprehensive goal metrics for the given date range.
 */
export function getGoalMetrics(
  goal: Goal,
  goalEntries: GoalEntry[],
  startDate: string,
  endDate: string
): GoalMetrics {
  const entries = goalEntries
    .filter((e) => e.goalId === goal.id && e.date >= startDate && e.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (entries.length === 0) {
    return {
      target: goal.targetValue,
      latestActual: null,
      achievementPct: null,
      averageActual: null,
      best: null,
      worst: null,
      completionDays: 0,
      missedDays: 0,
      currentStreak: 0,
      consistency: null,
      entryCount: 0,
    };
  }

  const values = entries.map((e) => e.actualValue);
  const latest = entries[entries.length - 1];
  const latestActual = latest.actualValue;
  const { achievementPct } = calculateAchievement(latestActual, goal.targetValue);

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const best = Math.max(...values);
  const worst = Math.min(...values);
  const completionDays = values.filter(
    (v) => goal.targetValue === 0 ? v >= 1 : v >= goal.targetValue
  ).length;

  // Consistency: entryCount / expected periods in range
  let expectedPeriods = 1;
  try {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (goal.frequency === "daily") {
      expectedPeriods = eachDayOfInterval({ start, end }).length;
    } else if (goal.frequency === "weekly") {
      expectedPeriods = Math.max(1, eachWeekOfInterval({ start, end }).length);
    } else if (goal.frequency === "monthly") {
      expectedPeriods = Math.max(1, eachMonthOfInterval({ start, end }).length);
    } else {
      expectedPeriods = entries.length; // custom: consistency always 100%
    }
  } catch {
    expectedPeriods = entries.length;
  }

  const consistency = expectedPeriods > 0
    ? Math.round((entries.length / expectedPeriods) * 100)
    : null;

  // Streak: consecutive days from today backwards
  const entryDates = new Set(entries.map((e) => e.date));
  let streak = 0;
  const d = new Date();
  while (true) {
    const ds = format(d, "yyyy-MM-dd");
    if (ds < startDate) break;
    if (entryDates.has(ds)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    target: goal.targetValue,
    latestActual,
    achievementPct,
    averageActual: Math.round(avg * 100) / 100,
    best,
    worst,
    completionDays,
    missedDays: Math.max(0, expectedPeriods - entries.length),
    currentStreak: streak,
    consistency,
    entryCount: entries.length,
  };
}

// ─── Goal Chart Data ──────────────────────────────────────────────────────────

export interface GoalChartPoint {
  date: string;        // display label
  rawDate: string;     // YYYY-MM-DD
  target: number;
  actual?: number;
  achievementPct?: number;
}

/**
 * Build time-series chart data for a goal, aligned with existing granularity options.
 */
export function buildGoalChartData(
  goal: Goal,
  goalEntries: GoalEntry[],
  startDate: string,
  endDate: string,
  granularity: "daily" | "weekly" | "monthly"
): GoalChartPoint[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);

  let dates: Date[];
  if (granularity === "daily") {
    dates = eachDayOfInterval({ start, end });
  } else if (granularity === "weekly") {
    dates = eachWeekOfInterval({ start, end });
  } else {
    dates = eachMonthOfInterval({ start, end });
  }

  const relevantEntries = goalEntries.filter((e) => e.goalId === goal.id);

  return dates.map((date) => {
    const rawDate = format(date, "yyyy-MM-dd");

    // For weekly/monthly, find the best entry within the bucket
    let lookupEnd = rawDate;
    if (granularity === "weekly") {
      const weekEnd = new Date(date);
      weekEnd.setDate(weekEnd.getDate() + 6);
      lookupEnd = format(weekEnd < end ? weekEnd : end, "yyyy-MM-dd");
    } else if (granularity === "monthly") {
      const mEnd = endOfMonth(date);
      lookupEnd = format(mEnd < end ? mEnd : end, "yyyy-MM-dd");
    }

    const bucketEntries = relevantEntries
      .filter((e) => e.date >= rawDate && e.date <= lookupEnd)
      .sort((a, b) => b.date.localeCompare(a.date));

    const entry = bucketEntries[0];

    const point: GoalChartPoint = {
      date: formatGoalDateLabel(date, granularity),
      rawDate,
      target: goal.targetValue,
    };

    if (entry) {
      point.actual = entry.actualValue;
      const { achievementPct } = calculateAchievement(entry.actualValue, goal.targetValue);
      point.achievementPct = achievementPct;
    }

    return point;
  });
}

function formatGoalDateLabel(date: Date, granularity: "daily" | "weekly" | "monthly"): string {
  if (granularity === "monthly") return format(date, "MMM yyyy");
  return format(date, "MMM d");
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

/** Format an actual value with its unit for display. */
export function formatActual(value: number, goal: Goal): string {
  if (goal.metricType === "binary") {
    return value >= 1 ? "Completed" : "Not completed";
  }
  const unit = goal.unit ? ` ${goal.unit}` : "";
  return `${value}${unit}`;
}

/** Format a target for display (e.g. "5 hrs/day"). */
export function formatTarget(goal: Goal): string {
  if (goal.metricType === "binary") {
    return `Complete / ${goal.frequency}`;
  }
  const unit = goal.unit ? ` ${goal.unit}` : "";
  const freq = goal.frequency === "custom" ? "" : `/${goal.frequency.replace("ly", "")}`;
  return `${goal.targetValue}${unit}${freq}`;
}
