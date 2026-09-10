// ─── Section ──────────────────────────────────────────────────────────────────

export interface Section {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or lucide icon name
  color: string; // hex color for chart line
  weight: number; // 0-100, used in weighted overall score (default 1)
  archived: boolean;
  createdAt: string; // ISO date string
}

// ─── Score Entry ──────────────────────────────────────────────────────────────

export interface ScoreEntry {
  id: string;
  sectionId: string;
  date: string; // YYYY-MM-DD
  score: number; // 0-100
  note: string;
  updatedAt: string; // ISO datetime string
}

// ─── AI Provider ─────────────────────────────────────────────────────────────

export type AIProvider = "openai" | "anthropic" | "gemini" | "openai-compatible";

export type APIKeyStatus = "active" | "rate-limited" | "invalid" | "cooldown" | "disabled";

export interface AIKeySlot {
  id: string;
  enabled: boolean;
  provider: AIProvider;
  apiKey: string; // stored locally; masked in UI after save
  model: string;
  baseUrl?: string; // optional for openai-compatible
  status: APIKeyStatus;
  priority: number; // 1-5, lower = higher priority
  lastError?: string;
  lastUsedAt?: string;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export type TimelineRange = "week" | "month" | "year" | "custom";
export type Granularity = "daily" | "weekly" | "monthly";
export type Theme = "light" | "dark" | "system";
export type Density = "compact" | "comfortable";

export interface CustomTimelinePrefs {
  startDate: string;
  endDate: string;
  granularity: Granularity;
}

export interface TimelinePreferences {
  defaultRange: TimelineRange;
  custom: CustomTimelinePrefs;
}

export interface AISettings {
  keys: AIKeySlot[];
}

export interface UIPreferences {
  theme: Theme;
  density: Density;
}

export interface AppSettings {
  timeline: TimelinePreferences;
  ai: AISettings;
  ui: UIPreferences;
}

// ─── Calculated Metrics ───────────────────────────────────────────────────────

export interface RangeMetrics {
  startScore: number | null;
  endScore: number | null;
  absoluteChange: number | null;
  percentChange: number | null;
  average: number | null;
  high: number | null;
  low: number | null;
  trendDirection: "up" | "down" | "flat" | "none";
  volatility: number | null; // std deviation
  dataPoints: number;
}

export interface OverallScore {
  current: number | null;
  trend: number | null; // change from previous period
  average: number | null;
  high: number | null;
  low: number | null;
  streak: number; // consecutive days with at least one entry
}

// ─── Chart Data ───────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  date: string; // formatted date label
  rawDate: string; // YYYY-MM-DD
  overall?: number;
  [sectionId: string]: number | string | undefined;
}

// ─── AI Review ────────────────────────────────────────────────────────────────

export interface AIReviewSection {
  title: string;
  content: string;
}

export interface AIReview {
  overall: string;
  improved: string;
  declined: string;
  patterns: string;
  recommendations: string;
  watchOut: string;
  generatedAt: string;
}

// ─── App State ────────────────────────────────────────────────────────────────

export interface AppState {
  sections: Section[];
  entries: ScoreEntry[];
  settings: AppSettings;
}
