import { Section, ScoreEntry, RangeMetrics, OverallScore, ChartDataPoint } from "./types";
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, format, parseISO, endOfMonth } from "./dates";

// ─── Overall Growth Score ──────────────────────────────────────────────────────

/**
 * For each active section, find the most recent score on or before `date`.
 * Average those scores (ignoring missing sections).
 */
export function calculateOverallScore(
  sections: Section[],
  entries: ScoreEntry[],
  date: string
): number | null {
  const active = sections.filter((s) => !s.archived);
  if (active.length === 0) return null;

  const scores: number[] = [];

  for (const section of active) {
    const sectionEntries = entries
      .filter((e) => e.sectionId === section.id && e.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (sectionEntries.length > 0) {
      scores.push(sectionEntries[0].score);
    }
  }

  if (scores.length === 0) return null;

  const sum = scores.reduce((acc, s) => acc + s, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

/**
 * Calculates the Overall Score object for dashboard header stats.
 */
export function getOverallScore(
  sections: Section[],
  entries: ScoreEntry[],
  today: string
): OverallScore {
  const current = calculateOverallScore(sections, entries, today);

  // Trend: compare to 7 days ago
  const prev = new Date(today);
  prev.setDate(prev.getDate() - 7);
  const prevDate = format(prev, "yyyy-MM-dd");
  const previous = calculateOverallScore(sections, entries, prevDate);
  const trend = current !== null && previous !== null ? current - previous : null;

  // Average, high, low from all available data
  const allDates = [...new Set(entries.map((e) => e.date))].sort();
  const scores: number[] = [];
  for (const d of allDates) {
    const s = calculateOverallScore(sections, entries, d);
    if (s !== null) scores.push(s);
  }

  // Streak: consecutive days up to today that have at least one entry
  const entryDates = new Set(entries.map((e) => e.date));
  let streak = 0;
  const d = new Date(today);
  while (true) {
    const ds = format(d, "yyyy-MM-dd");
    if (entryDates.has(ds)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    current,
    trend,
    average: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null,
    high: scores.length > 0 ? Math.max(...scores) : null,
    low: scores.length > 0 ? Math.min(...scores) : null,
    streak,
  };
}

// ─── Range Metrics ────────────────────────────────────────────────────────────

export function calculateRangeMetrics(
  dataPoints: ChartDataPoint[],
  field: string = "overall"
): RangeMetrics {
  const values = dataPoints
    .map((p) => p[field] as number | undefined)
    .filter((v): v is number => typeof v === "number");

  if (values.length === 0) {
    return {
      startScore: null,
      endScore: null,
      absoluteChange: null,
      percentChange: null,
      average: null,
      high: null,
      low: null,
      trendDirection: "none",
      volatility: null,
      dataPoints: 0,
    };
  }

  const start = values[0];
  const end = values[values.length - 1];
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const high = Math.max(...values);
  const low = Math.min(...values);
  const absChange = end - start;
  const pctChange = start !== 0 ? (absChange / start) * 100 : null;

  // Volatility = std deviation
  const mean = avg;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  const volatility = Math.round(Math.sqrt(variance) * 10) / 10;

  const trendDirection: RangeMetrics["trendDirection"] =
    absChange > 1 ? "up" : absChange < -1 ? "down" : "flat";

  return {
    startScore: Math.round(start * 10) / 10,
    endScore: Math.round(end * 10) / 10,
    absoluteChange: Math.round(absChange * 10) / 10,
    percentChange: pctChange !== null ? Math.round(pctChange * 10) / 10 : null,
    average: Math.round(avg * 10) / 10,
    high: Math.round(high * 10) / 10,
    low: Math.round(low * 10) / 10,
    trendDirection,
    volatility,
    dataPoints: values.length,
  };
}

// ─── Chart Data Builder ───────────────────────────────────────────────────────

export function buildChartData(
  sections: Section[],
  entries: ScoreEntry[],
  startDate: string,
  endDate: string,
  granularity: "daily" | "weekly" | "monthly",
  activeSectionIds: string[] | "all" = "all"
): ChartDataPoint[] {
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

  const activeSections =
    activeSectionIds === "all"
      ? sections.filter((s) => !s.archived)
      : sections.filter((s) => !s.archived && activeSectionIds.includes(s.id));

  return dates.map((date) => {
    const rawDate = format(date, "yyyy-MM-dd");

    // For weekly/monthly, look at the range up to end of that bucket
    let lookupDate = rawDate;
    if (granularity === "weekly") {
      const weekEnd = new Date(date);
      weekEnd.setDate(weekEnd.getDate() + 6);
      lookupDate = format(weekEnd < end ? weekEnd : end, "yyyy-MM-dd");
    } else if (granularity === "monthly") {
      const mEnd = endOfMonth(date);
      lookupDate = format(mEnd < end ? mEnd : end, "yyyy-MM-dd");
    }

    const point: ChartDataPoint = {
      date: formatDateLabel(date, granularity),
      rawDate,
    };

    for (const section of activeSections) {
      // Try exact date first, then most recent within the bucket
      const exactEntry = entries.find(
        (e) => e.sectionId === section.id && e.date === rawDate
      );
      const latestEntry = entries
        .filter((e) => e.sectionId === section.id && e.date <= lookupDate)
        .sort((a, b) => b.date.localeCompare(a.date))[0];

      const entry = granularity === "daily" ? exactEntry : (exactEntry ?? latestEntry);
      if (entry) {
        point[section.id] = entry.score;
      }
    }

    // Calculate overall for this point
    const sectionScores = activeSections
      .map((s) => point[s.id] as number | undefined)
      .filter((v): v is number => typeof v === "number");

    if (sectionScores.length > 0) {
      point.overall =
        Math.round((sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length) * 10) / 10;
    }

    return point;
  });
}

function formatDateLabel(date: Date, granularity: "daily" | "weekly" | "monthly"): string {
  if (granularity === "daily") return format(date, "MMM d");
  if (granularity === "weekly") return format(date, "MMM d");
  return format(date, "MMM yyyy");
}

// ─── Section stats ────────────────────────────────────────────────────────────

export function getSectionLatestScore(
  sectionId: string,
  entries: ScoreEntry[],
  date: string
): number | null {
  const relevant = entries
    .filter((e) => e.sectionId === sectionId && e.date <= date)
    .sort((a, b) => b.date.localeCompare(a.date));
  return relevant.length > 0 ? relevant[0].score : null;
}

export function getSectionTrend(
  sectionId: string,
  entries: ScoreEntry[],
  date: string
): number | null {
  const sorted = entries
    .filter((e) => e.sectionId === sectionId && e.date <= date)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (sorted.length < 2) return null;
  return sorted[0].score - sorted[1].score;
}
