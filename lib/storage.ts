import { AppSettings, Section, ScoreEntry, AppState, AIKeySlot } from "./types";

const KEYS = {
  sections: "gg_sections",
  entries: "gg_entries",
  settings: "gg_settings",
} as const;

// ─── Default Settings ─────────────────────────────────────────────────────────

const defaultSettings: AppSettings = {
  timeline: {
    defaultRange: "month",
    custom: {
      startDate: "",
      endDate: "",
      granularity: "daily",
    },
  },
  ai: {
    keys: [],
  },
  ui: {
    theme: "system",
    density: "comfortable",
  },
};

// ─── Safe localStorage wrapper ────────────────────────────────────────────────

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ─── Sections ─────────────────────────────────────────────────────────────────

export function getSections(): Section[] {
  return safeRead<Section[]>(KEYS.sections, []);
}

export function saveSections(sections: Section[]): boolean {
  return safeWrite(KEYS.sections, sections);
}

export function upsertSection(section: Section): Section[] {
  const all = getSections();
  const idx = all.findIndex((s) => s.id === section.id);
  if (idx >= 0) {
    all[idx] = section;
  } else {
    all.push(section);
  }
  saveSections(all);
  return all;
}

export function deleteSection(id: string): { sections: Section[]; entries: ScoreEntry[] } {
  const sections = getSections().filter((s) => s.id !== id);
  const entries = getEntries().filter((e) => e.sectionId !== id);
  saveSections(sections);
  saveEntries(entries);
  return { sections, entries };
}

// ─── Score Entries ────────────────────────────────────────────────────────────

export function getEntries(): ScoreEntry[] {
  return safeRead<ScoreEntry[]>(KEYS.entries, []);
}

export function saveEntries(entries: ScoreEntry[]): boolean {
  return safeWrite(KEYS.entries, entries);
}

export function upsertEntry(entry: ScoreEntry): ScoreEntry[] {
  const all = getEntries();
  const idx = all.findIndex((e) => e.id === entry.id);
  if (idx >= 0) {
    all[idx] = entry;
  } else {
    // Check if there's an existing entry for same section+date (replace it)
    const dupIdx = all.findIndex(
      (e) => e.sectionId === entry.sectionId && e.date === entry.date
    );
    if (dupIdx >= 0) {
      all[dupIdx] = { ...all[dupIdx], ...entry };
    } else {
      all.push(entry);
    }
  }
  saveEntries(all);
  return all;
}

export function deleteEntry(id: string): ScoreEntry[] {
  const entries = getEntries().filter((e) => e.id !== id);
  saveEntries(entries);
  return entries;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function getSettings(): AppSettings {
  const stored = safeRead<Partial<AppSettings>>(KEYS.settings, {});
  return {
    ...defaultSettings,
    ...stored,
    timeline: { ...defaultSettings.timeline, ...(stored.timeline ?? {}) },
    ai: { ...defaultSettings.ai, ...(stored.ai ?? {}) },
    ui: { ...defaultSettings.ui, ...(stored.ui ?? {}) },
  };
}

export function saveSettings(settings: AppSettings): boolean {
  return safeWrite(KEYS.settings, settings);
}

export function updateAIKey(slot: AIKeySlot): AppSettings {
  const settings = getSettings();
  const idx = settings.ai.keys.findIndex((k) => k.id === slot.id);
  if (idx >= 0) {
    settings.ai.keys[idx] = slot;
  } else {
    settings.ai.keys.push(slot);
  }
  saveSettings(settings);
  return settings;
}

export function removeAIKey(id: string): AppSettings {
  const settings = getSettings();
  settings.ai.keys = settings.ai.keys.filter((k) => k.id !== id);
  saveSettings(settings);
  return settings;
}

// ─── Full export / import ─────────────────────────────────────────────────────

export function exportData(): AppState {
  return {
    sections: getSections(),
    entries: getEntries(),
    settings: getSettings(),
  };
}

export function importData(data: AppState): void {
  if (!Array.isArray(data.sections) || !Array.isArray(data.entries)) {
    throw new Error("Invalid import format: expected sections and entries arrays.");
  }
  saveSections(data.sections);
  saveEntries(data.entries);
  if (data.settings) saveSettings(data.settings);
}

export function clearAllData(): void {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}
