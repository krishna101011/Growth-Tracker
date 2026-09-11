import { NextRequest, NextResponse } from "next/server";
import { runWithFailover } from "@/lib/ai/failover";
import { AIKeySlot, Section, ScoreEntry, Goal, GoalEntry } from "@/lib/types";

const SYSTEM_PROMPT = `You are an analytical growth coach AI reviewing personal development data.

CRITICAL RULES:
- Use ONLY the data provided in the user's message. Never fabricate scores, dates, trends, section names, goals, or actual results.
- Be specific, citing actual numbers and dates from the data.
- Be concise but insightful.
- Structure your response as valid JSON matching the schema provided.
- If no goal data is available, do not mention goals.

Your analysis should be honest, actionable, and empathetic.`;

function buildReviewPrompt(
  sections: Section[],
  entries: ScoreEntry[],
  dateRange: { start: string; end: string },
  goals?: Goal[],
  goalEntries?: GoalEntry[]
): string {
  // Filter entries in range
  const inRange = entries.filter((e) => e.date >= dateRange.start && e.date <= dateRange.end);

  // Build section summary
  const sectionSummaries = sections
    .filter((s) => !s.archived)
    .map((section) => {
      const sectionEntries = inRange
        .filter((e) => e.sectionId === section.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (sectionEntries.length === 0) return null;

      const scores = sectionEntries.map((e) => `${e.date}: ${e.score}`).join(", ");
      const avg =
        sectionEntries.reduce((sum, e) => sum + e.score, 0) / sectionEntries.length;
      const first = sectionEntries[0].score;
      const last = sectionEntries[sectionEntries.length - 1].score;

      // Goals for this section
      const sectionGoals = (goals ?? []).filter((g) => g.sectionId === section.id && g.active);
      const goalSummaries = sectionGoals.map((goal) => {
        const goalEntriesInRange = (goalEntries ?? []).filter(
          (ge) => ge.goalId === goal.id && ge.date >= dateRange.start && ge.date <= dateRange.end
        );
        if (goalEntriesInRange.length === 0) return null;

        const actuals = goalEntriesInRange.map((ge) => ge.actualValue);
        const avgActual = actuals.reduce((a, b) => a + b, 0) / actuals.length;
        const hits = actuals.filter((v) =>
          goal.metricType === "binary" ? v >= 1 : v >= goal.targetValue
        ).length;
        const avgAchievementPct =
          goal.targetValue > 0
            ? Math.round((avgActual / goal.targetValue) * 100)
            : hits > 0 ? 100 : 0;

        return {
          name: goal.name,
          metricType: goal.metricType,
          targetValue: goal.targetValue,
          unit: goal.unit,
          frequency: goal.frequency,
          entryCount: goalEntriesInRange.length,
          averageActual: Math.round(avgActual * 100) / 100,
          averageAchievementPct: avgAchievementPct,
          goalHitDays: hits,
          totalDays: goalEntriesInRange.length,
          consistency: `${hits}/${goalEntriesInRange.length} days hit target`,
        };
      }).filter(Boolean);

      return {
        name: section.name,
        entries: sectionEntries.length,
        average: Math.round(avg * 10) / 10,
        start: first,
        end: last,
        change: last - first,
        scores,
        notes: sectionEntries.filter((e) => e.note).map((e) => `${e.date}: "${e.note}"`),
        goals: goalSummaries.length > 0 ? goalSummaries : undefined,
      };
    })
    .filter(Boolean);

  return JSON.stringify(
    {
      instruction:
        "Analyze the following personal growth data and return a JSON response with these exact keys: overall, improved, declined, patterns, recommendations, watchOut. Each value is a concise paragraph (2-4 sentences). Use only data provided below. Growth Scores (0-100) and Goals/Actuals are separate systems — do not conflate them. Never invent data.",
      dateRange,
      sections: sectionSummaries,
    },
    null,
    2
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      keys,
      sections,
      entries,
      dateRange,
      goals,
      goalEntries,
    }: {
      keys: AIKeySlot[];
      sections: Section[];
      entries: ScoreEntry[];
      dateRange: { start: string; end: string };
      goals?: Goal[];
      goalEntries?: GoalEntry[];
    } = body;

    if (!keys || !sections || !entries || !dateRange) {
      return NextResponse.json(
        { error: "Missing required fields: keys, sections, entries, dateRange" },
        { status: 400 }
      );
    }

    // SECURITY: sanitize keys — only use what's needed, never log them
    const safeKeys: AIKeySlot[] = keys.map((k) => ({
      ...k,
      apiKey: k.apiKey,
    }));

    const prompt = buildReviewPrompt(sections, entries, dateRange, goals, goalEntries);

    const result = await runWithFailover({
      keys: safeKeys,
      prompt,
      systemPrompt: SYSTEM_PROMPT,
    });

    if (!result.success || !result.content) {
      return NextResponse.json(
        {
          error: result.error ?? "AI review failed",
          keyStatusUpdates: result.keyStatusUpdates,
        },
        { status: 502 }
      );
    }

    // Try to parse JSON from model response
    let review: Record<string, string>;
    try {
      // Extract JSON even if surrounded by markdown code fences
      const jsonMatch = result.content.match(/```(?:json)?\s*([\s\S]*?)```/)
        || result.content.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : result.content;
      review = JSON.parse(jsonStr);
    } catch {
      // Model returned plain text — wrap it
      review = {
        overall: result.content,
        improved: "",
        declined: "",
        patterns: "",
        recommendations: "",
        watchOut: "",
      };
    }

    return NextResponse.json({
      review: {
        overall: review.overall ?? "",
        improved: review.improved ?? "",
        declined: review.declined ?? "",
        patterns: review.patterns ?? "",
        recommendations: review.recommendations ?? "",
        watchOut: review.watchOut ?? "",
        generatedAt: new Date().toISOString(),
      },
      keyStatusUpdates: result.keyStatusUpdates,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
