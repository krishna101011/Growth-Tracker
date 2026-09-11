"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Section,
  ScoreEntry,
  AppSettings,
  TimelineRange,
  Granularity,
  AIKeySlot,
  Goal,
  GoalEntry,
} from "@/lib/types";
import {
  getSections,
  getEntries,
  getSettings,
  upsertSection,
  deleteSection as storageDeleteSection,
  upsertEntry,
  deleteEntry as storageDeleteEntry,
  saveSettings,
  exportData,
  importData,
  clearAllData,
  getGoals,
  getGoalEntries,
  upsertGoal,
  deleteGoal as storageDeleteGoal,
  upsertGoalEntry,
  deleteGoalEntry as storageDeleteGoalEntry,
  saveGoals,
  saveGoalEntries,
} from "@/lib/storage";
import { today, getDateRange, getDefaultGranularity } from "@/lib/dates";

// ─── State Types ──────────────────────────────────────────────────────────────

interface TimelineState {
  range: TimelineRange;
  startDate: string;
  endDate: string;
  granularity: Granularity;
  activeSectionIds: string[] | "all";
}

interface AppContextValue {
  // Data
  sections: Section[];
  entries: ScoreEntry[];
  settings: AppSettings;
  goals: Goal[];
  goalEntries: GoalEntry[];

  // Timeline
  timeline: TimelineState;
  setTimelineRange: (range: TimelineRange) => void;
  setCustomTimeline: (start: string, end: string, granularity: Granularity) => void;
  setActiveSections: (ids: string[] | "all") => void;

  // Section CRUD
  createSection: (data: Omit<Section, "id" | "createdAt" | "archived">) => Section;
  updateSection: (section: Section) => void;
  archiveSection: (id: string, archived: boolean) => void;
  removeSection: (id: string) => void;

  // Entry CRUD
  addEntry: (entry: Omit<ScoreEntry, "id" | "updatedAt">) => ScoreEntry;
  editEntry: (entry: ScoreEntry) => void;
  removeEntry: (id: string) => void;

  // Goal CRUD
  createGoal: (data: Omit<Goal, "id" | "createdAt">) => Goal;
  updateGoal: (goal: Goal) => void;
  removeGoal: (id: string) => void;

  // Goal Entry CRUD
  addGoalEntry: (data: Omit<GoalEntry, "id" | "updatedAt">) => GoalEntry;
  editGoalEntry: (entry: GoalEntry) => void;
  removeGoalEntry: (id: string) => void;

  // Settings
  updateSettings: (settings: AppSettings) => void;
  updateAIKey: (slot: AIKeySlot) => void;
  removeAIKey: (id: string) => void;

  // Import/Export
  exportJSON: () => void;
  importJSON: (file: File) => Promise<void>;
  clearData: () => void;

  // UI
  todayStr: string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

// ─── Helper: derive timeline dates ───────────────────────────────────────────

function deriveTimeline(range: TimelineRange, settings: AppSettings): Omit<TimelineState, "activeSectionIds"> {
  const todayStr = today();
  if (range === "custom") {
    const { custom } = settings.timeline;
    return {
      range,
      startDate: custom.startDate || todayStr,
      endDate: custom.endDate || todayStr,
      granularity: custom.granularity || "daily",
    };
  }
  const { start, end } = getDateRange(range as "week" | "month" | "year");
  return {
    range,
    startDate: start,
    endDate: end,
    granularity: getDefaultGranularity(range),
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [entries, setEntries] = useState<ScoreEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalEntries, setGoalEntries] = useState<GoalEntry[]>([]);
  const [timeline, setTimeline] = useState<TimelineState>({
    range: "month",
    startDate: "",
    endDate: "",
    granularity: "daily",
    activeSectionIds: "all",
  });

  const todayStr = today();

  // Load from localStorage on mount
  useEffect(() => {
    const s = getSections();
    const e = getEntries();
    const cfg = getSettings();
    const g = getGoals();
    const ge = getGoalEntries();
    const derived = deriveTimeline(cfg.timeline.defaultRange, cfg);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSections(s);
    setEntries(e);
    setSettings(cfg);
    setGoals(g);
    setGoalEntries(ge);
    setTimeline((t) => ({ ...t, ...derived }));
  }, []);

  // Timeline controls
  const setTimelineRange = useCallback(
    (range: TimelineRange) => {
      if (!settings) return;
      const derived = deriveTimeline(range, settings);
      setTimeline((t) => ({ ...t, ...derived }));
    },
    [settings]
  );

  const setCustomTimeline = useCallback((start: string, end: string, granularity: Granularity) => {
    setTimeline((t) => ({
      ...t,
      range: "custom",
      startDate: start,
      endDate: end,
      granularity,
    }));
  }, []);

  const setActiveSections = useCallback((ids: string[] | "all") => {
    setTimeline((t) => ({ ...t, activeSectionIds: ids }));
  }, []);

  // Section CRUD
  const createSection = useCallback(
    (data: Omit<Section, "id" | "createdAt" | "archived">): Section => {
      const section: Section = {
        ...data,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        archived: false,
      };
      const updated = upsertSection(section);
      setSections(updated);
      return section;
    },
    []
  );

  const updateSection = useCallback((section: Section) => {
    const updated = upsertSection(section);
    setSections(updated);
  }, []);

  const archiveSection = useCallback((id: string, archived: boolean) => {
    setSections((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, archived } : s));
      const target = updated.find((x) => x.id === id);
      if (target) upsertSection(target);
      return updated;
    });
  }, []);

  const removeSection = useCallback((id: string) => {
    const { sections: s, entries: e } = storageDeleteSection(id);
    setSections(s);
    setEntries(e);
    // Also remove goals and goal entries for this section
    setGoals((prevGoals) => {
      const sectionGoalIds = prevGoals.filter((g) => g.sectionId === id).map((g) => g.id);
      setGoalEntries((ge) => {
        const filtered = ge.filter((entry) => !sectionGoalIds.includes(entry.goalId));
        saveGoalEntries(filtered);
        return filtered;
      });
      const filteredGoals = prevGoals.filter((g) => g.sectionId !== id);
      saveGoals(filteredGoals);
      return filteredGoals;
    });
  }, []);

  // Entry CRUD
  const addEntry = useCallback(
    (data: Omit<ScoreEntry, "id" | "updatedAt">): ScoreEntry => {
      const entry: ScoreEntry = {
        ...data,
        id: uuidv4(),
        updatedAt: new Date().toISOString(),
      };
      const updated = upsertEntry(entry);
      setEntries(updated);
      return entry;
    },
    []
  );

  const editEntry = useCallback((entry: ScoreEntry) => {
    const updated = upsertEntry({ ...entry, updatedAt: new Date().toISOString() });
    setEntries(updated);
  }, []);

  const removeEntry = useCallback((id: string) => {
    const updated = storageDeleteEntry(id);
    setEntries(updated);
  }, []);

  // Goal CRUD
  const createGoal = useCallback(
    (data: Omit<Goal, "id" | "createdAt">): Goal => {
      const goal: Goal = {
        ...data,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      };
      const updated = upsertGoal(goal);
      setGoals(updated);
      return goal;
    },
    []
  );

  const updateGoal = useCallback((goal: Goal) => {
    const updated = upsertGoal(goal);
    setGoals(updated);
  }, []);

  const removeGoal = useCallback((id: string) => {
    const { goals: g, goalEntries: ge } = storageDeleteGoal(id);
    setGoals(g);
    setGoalEntries(ge);
  }, []);

  // Goal Entry CRUD
  const addGoalEntry = useCallback(
    (data: Omit<GoalEntry, "id" | "updatedAt">): GoalEntry => {
      const entry: GoalEntry = {
        ...data,
        id: uuidv4(),
        updatedAt: new Date().toISOString(),
      };
      const updated = upsertGoalEntry(entry);
      setGoalEntries(updated);
      return entry;
    },
    []
  );

  const editGoalEntry = useCallback((entry: GoalEntry) => {
    const updated = upsertGoalEntry({ ...entry, updatedAt: new Date().toISOString() });
    setGoalEntries(updated);
  }, []);

  const removeGoalEntry = useCallback((id: string) => {
    const updated = storageDeleteGoalEntry(id);
    setGoalEntries(updated);
  }, []);

  // Settings
  const updateSettings = useCallback((s: AppSettings) => {
    saveSettings(s);
    setSettings(s);
  }, []);

  const updateAIKeyFn = useCallback(
    (slot: AIKeySlot) => {
      if (!settings) return;
      const idx = settings.ai.keys.findIndex((k) => k.id === slot.id);
      const newKeys =
        idx >= 0
          ? settings.ai.keys.map((k) => (k.id === slot.id ? slot : k))
          : [...settings.ai.keys, slot];
      const updated = { ...settings, ai: { ...settings.ai, keys: newKeys } };
      saveSettings(updated);
      setSettings(updated);
    },
    [settings]
  );

  const removeAIKeyFn = useCallback(
    (id: string) => {
      if (!settings) return;
      const updated = {
        ...settings,
        ai: { ...settings.ai, keys: settings.ai.keys.filter((k) => k.id !== id) },
      };
      saveSettings(updated);
      setSettings(updated);
    },
    [settings]
  );

  // Import / Export
  const exportJSON = useCallback(() => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `growth-graph-backup-${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [todayStr]);

  const importJSON = useCallback(async (file: File) => {
    const text = await file.text();
    const data = JSON.parse(text);
    importData(data);
    setSections(getSections());
    setEntries(getEntries());
    setSettings(getSettings());
    setGoals(getGoals());
    setGoalEntries(getGoalEntries());
  }, []);

  const clearData = useCallback(() => {
    clearAllData();
    setSections([]);
    setEntries([]);
    setGoals([]);
    setGoalEntries([]);
    const cfg = getSettings();
    setSettings(cfg);
  }, []);

  if (!settings) return null; // Wait for hydration

  return (
    <AppContext.Provider
      value={{
        sections,
        entries,
        settings,
        goals,
        goalEntries,
        timeline,
        todayStr,
        setTimelineRange,
        setCustomTimeline,
        setActiveSections,
        createSection,
        updateSection,
        archiveSection,
        removeSection,
        addEntry,
        editEntry,
        removeEntry,
        createGoal,
        updateGoal,
        removeGoal,
        addGoalEntry,
        editGoalEntry,
        removeGoalEntry,
        updateSettings,
        updateAIKey: updateAIKeyFn,
        removeAIKey: removeAIKeyFn,
        exportJSON,
        importJSON,
        clearData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
