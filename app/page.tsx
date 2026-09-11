"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Header } from "@/components/dashboard/Header";
import { OverallStats } from "@/components/dashboard/OverallStats";
import { TimeControls } from "@/components/dashboard/TimeControls";
import { GrowthChart } from "@/components/charts/GrowthChart";
import { GoalChart } from "@/components/goals/GoalChart";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { SectionFilter } from "@/components/dashboard/SectionFilter";
import { RangeMetricsBar } from "@/components/dashboard/RangeMetricsBar";
import { AIReviewPanel } from "@/components/dashboard/AIReviewPanel";
import { AddSectionDialog } from "@/components/dialogs/AddSectionDialog";
import { ScoreEntryDialog } from "@/components/dialogs/ScoreEntryDialog";
import { GoalDialog } from "@/components/dialogs/GoalDialog";
import { GoalEntryDialog } from "@/components/dialogs/GoalEntryDialog";
import { Section, ScoreEntry, ChartDataPoint, Goal, GoalEntry } from "@/lib/types";
import { getOverallScore, buildChartData, calculateRangeMetrics } from "@/lib/scoring";
import { Plus, BarChart2, Target, BarChart } from "lucide-react";

export default function DashboardPage() {
  const {
    sections,
    entries,
    goals,
    goalEntries,
    timeline,
    todayStr,
    setTimelineRange,
    setCustomTimeline,
    setActiveSections,
    archiveSection,
    removeSection,
  } = useApp();

  // ── Existing score dialog state ──────────────────────────────────────────────
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [scoreDialogSection, setScoreDialogSection] = useState<string | undefined>(undefined);
  const [scoreDialogDate, setScoreDialogDate] = useState<string | undefined>(undefined);
  const [editingEntry, setEditingEntry] = useState<ScoreEntry | null>(null);
  const [showOverall, setShowOverall] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  // ── Goal dialog state ────────────────────────────────────────────────────────
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalDialogSectionId, setGoalDialogSectionId] = useState<string | undefined>(undefined);

  const [goalEntryDialogOpen, setGoalEntryDialogOpen] = useState(false);
  const [activeGoalForEntry, setActiveGoalForEntry] = useState<Goal | null>(null);
  const [editingGoalEntry, setEditingGoalEntry] = useState<GoalEntry | null>(null);
  const [goalEntryDate, setGoalEntryDate] = useState<string | undefined>(undefined);

  // ── Chart tab state ──────────────────────────────────────────────────────────
  const [chartTab, setChartTab] = useState<"growth" | "goals">("growth");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showAchievementPct, setShowAchievementPct] = useState(false);

  // ── Computed data ────────────────────────────────────────────────────────────

  const overallScore = useMemo(
    () => getOverallScore(sections, entries, todayStr),
    [sections, entries, todayStr]
  );

  const chartData = useMemo(
    () =>
      buildChartData(
        sections,
        entries,
        timeline.startDate,
        timeline.endDate,
        timeline.granularity,
        timeline.activeSectionIds
      ),
    [sections, entries, timeline]
  );

  const rangeMetrics = useMemo(
    () => calculateRangeMetrics(chartData, "overall"),
    [chartData]
  );

  const activeGoals = useMemo(
    () => goals.filter((g) => g.active),
    [goals]
  );

  // Selected goal for the chart tab
  const selectedGoal = useMemo(
    () =>
      selectedGoalId
        ? activeGoals.find((g) => g.id === selectedGoalId) ?? activeGoals[0] ?? null
        : activeGoals[0] ?? null,
    [selectedGoalId, activeGoals]
  );

  // ── Section filter handlers ──────────────────────────────────────────────────

  const handleToggleSection = (id: string) => {
    if (timeline.activeSectionIds === "all") {
      setActiveSections([id]);
    } else {
      const current = timeline.activeSectionIds as string[];
      if (current.includes(id)) {
        const next = current.filter((x) => x !== id);
        setActiveSections(next.length === 0 ? "all" : next);
      } else {
        setActiveSections([...current, id]);
      }
    }
  };

  const handleToggleAll = () => {
    setActiveSections("all");
  };

  // Chart point click → open edit entry dialog
  const handleChartPointClick = (point: ChartDataPoint, sectionId: string) => {
    const rawDate = point.rawDate;
    if (!rawDate) return;

    if (sectionId === "overall") {
      setScoreDialogDate(rawDate);
      setScoreDialogSection(undefined);
      setEditingEntry(null);
      setScoreDialogOpen(true);
      return;
    }

    const entry = entries.find(
      (e) => e.sectionId === sectionId && e.date === rawDate
    );
    if (entry) {
      setEditingEntry(entry);
      setScoreDialogOpen(true);
    } else {
      setScoreDialogSection(sectionId);
      setScoreDialogDate(rawDate);
      setEditingEntry(null);
      setScoreDialogOpen(true);
    }
  };

  // ── Goal handlers ────────────────────────────────────────────────────────────

  const handleAddGoal = (sectionId: string) => {
    setEditingGoal(null);
    setGoalDialogSectionId(sectionId);
    setGoalDialogOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalDialogSectionId(undefined);
    setGoalDialogOpen(true);
  };

  const handleLogActual = (goal: Goal, date?: string) => {
    setActiveGoalForEntry(goal);
    setEditingGoalEntry(null);
    setGoalEntryDate(date);
    setGoalEntryDialogOpen(true);
  };

  const handleEditGoalEntry = (goal: Goal, entry: GoalEntry) => {
    setActiveGoalForEntry(goal);
    setEditingGoalEntry(entry);
    setGoalEntryDate(undefined);
    setGoalEntryDialogOpen(true);
  };

  const activeSections = sections.filter((s) => !s.archived);
  const archivedSections = sections.filter((s) => s.archived);
  const isEmpty = sections.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Header
        onAddSection={() => { setEditingSection(null); setAddSectionOpen(true); }}
        onAddScore={() => { setEditingEntry(null); setScoreDialogSection(undefined); setScoreDialogDate(undefined); setScoreDialogOpen(true); }}
        todayStr={todayStr}
      />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>

        {/* Empty state */}
        {isEmpty && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "60vh",
              textAlign: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                background: "var(--accent-subtle)",
                border: "1px solid rgba(108,99,255,0.3)",
                borderRadius: "var(--radius-xl)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BarChart2 size={32} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
                Start tracking your growth
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 380, lineHeight: 1.6 }}>
                Create your first growth area — like Study, Physical, or Finance — and start logging daily scores to see your progress over time.
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => { setEditingSection(null); setAddSectionOpen(true); }}
              style={{ gap: 6 }}
            >
              <Plus size={16} />
              Create Your First Section
            </button>
          </div>
        )}

        {!isEmpty && (
          <>
            {/* Overall stats */}
            <OverallStats score={overallScore} />

            {/* Chart area */}
            <div
              className="card"
              style={{ marginBottom: 20, padding: "20px 20px 16px" }}
            >
              {/* Chart header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div>
                  {/* Tab switcher: Growth Score | Goals/Actuals */}
                  <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                    <button
                      id="chart-tab-growth"
                      onClick={() => setChartTab("growth")}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "var(--radius-sm)",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        gap: 5,
                        display: "flex",
                        alignItems: "center",
                        background: chartTab === "growth" ? "var(--accent)" : "var(--bg-elevated)",
                        color: chartTab === "growth" ? "#fff" : "var(--text-secondary)",
                        transition: "all 0.15s",
                      }}
                    >
                      <BarChart size={12} />
                      Growth Score
                    </button>
                    {activeGoals.length > 0 && (
                      <button
                        id="chart-tab-goals"
                        onClick={() => setChartTab("goals")}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "var(--radius-sm)",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          gap: 5,
                          display: "flex",
                          alignItems: "center",
                          background: chartTab === "goals" ? "var(--amber)" : "var(--bg-elevated)",
                          color: chartTab === "goals" ? "#000" : "var(--text-secondary)",
                          transition: "all 0.15s",
                        }}
                      >
                        <Target size={12} />
                        Goals / Actuals
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {timeline.startDate} — {timeline.endDate}
                  </p>
                </div>
                <TimeControls
                  range={timeline.range}
                  startDate={timeline.startDate}
                  endDate={timeline.endDate}
                  granularity={timeline.granularity}
                  onRangeChange={setTimelineRange}
                  onCustomChange={setCustomTimeline}
                />
              </div>

              {/* Growth Score chart */}
              {chartTab === "growth" && (
                <>
                  {/* Section filter */}
                  <div style={{ marginBottom: 14 }}>
                    <SectionFilter
                      sections={sections}
                      activeSectionIds={timeline.activeSectionIds}
                      showOverall={showOverall}
                      onToggleSection={handleToggleSection}
                      onToggleAll={handleToggleAll}
                      onToggleOverall={() => setShowOverall((v) => !v)}
                    />
                  </div>

                  <GrowthChart
                    data={chartData}
                    sections={sections}
                    activeSectionIds={timeline.activeSectionIds}
                    showOverall={showOverall}
                    onPointClick={handleChartPointClick}
                    height={300}
                  />

                  <RangeMetricsBar metrics={rangeMetrics} />
                </>
              )}

              {/* Goals / Actuals chart */}
              {chartTab === "goals" && activeGoals.length > 0 && (
                <>
                  {/* Goal selector */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      marginBottom: 14,
                    }}
                  >
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
                      {activeGoals.map((g) => {
                        const sec = sections.find((s) => s.id === g.sectionId);
                        return (
                          <button
                            key={g.id}
                            onClick={() => setSelectedGoalId(g.id)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "var(--radius-sm)",
                              border:
                                selectedGoal?.id === g.id
                                  ? "1.5px solid var(--amber)"
                                  : "1px solid var(--border)",
                              background:
                                selectedGoal?.id === g.id
                                  ? "rgba(245,158,11,0.1)"
                                  : "var(--bg-elevated)",
                              color:
                                selectedGoal?.id === g.id
                                  ? "var(--amber)"
                                  : "var(--text-secondary)",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.12s",
                            }}
                          >
                            {sec?.icon ?? "🎯"} {g.name}
                          </button>
                        );
                      })}
                    </div>

                    {selectedGoal && selectedGoal.metricType !== "binary" && (
                      <button
                        onClick={() => setShowAchievementPct((v) => !v)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "var(--radius-sm)",
                          border: showAchievementPct ? "1.5px solid var(--green)" : "1px solid var(--border)",
                          background: showAchievementPct ? "rgba(34,197,94,0.1)" : "var(--bg-elevated)",
                          color: showAchievementPct ? "var(--green)" : "var(--text-secondary)",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.12s",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {showAchievementPct ? "Show Actuals" : "Show Achievement %"}
                      </button>
                    )}
                  </div>

                  {selectedGoal && (
                    <GoalChart
                      goal={selectedGoal}
                      goalEntries={goalEntries}
                      startDate={timeline.startDate}
                      endDate={timeline.endDate}
                      granularity={timeline.granularity}
                      height={300}
                      showAchievementPct={showAchievementPct}
                    />
                  )}
                </>
              )}
            </div>

            {/* Sections grid */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <h2 style={{ fontSize: 15, fontWeight: 600 }}>
                  Sections
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 12,
                      color: "var(--text-muted)",
                      fontWeight: 400,
                    }}
                  >
                    {activeSections.length} active
                  </span>
                </h2>
                <div style={{ display: "flex", gap: 8 }}>
                  {archivedSections.length > 0 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setShowArchived((v) => !v)}
                    >
                      {showArchived ? "Hide archived" : `Show archived (${archivedSections.length})`}
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setEditingSection(null); setAddSectionOpen(true); }}
                    style={{ gap: 5 }}
                  >
                    <Plus size={13} />
                    Add Section
                  </button>
                </div>
              </div>

              <div className="section-grid">
                {activeSections.map((section, i) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    entries={entries}
                    goals={goals}
                    goalEntries={goalEntries}
                    timelineStart={timeline.startDate}
                    timelineEnd={timeline.endDate}
                    onEdit={(s) => { setEditingSection(s); setAddSectionOpen(true); }}
                    onArchive={archiveSection}
                    onDelete={removeSection}
                    onAddScore={(sectionId) => {
                      setScoreDialogSection(sectionId);
                      setScoreDialogDate(undefined);
                      setEditingEntry(null);
                      setScoreDialogOpen(true);
                    }}
                    onAddGoal={handleAddGoal}
                    onEditGoal={handleEditGoal}
                    onLogActual={handleLogActual}
                    onEditGoalEntry={handleEditGoalEntry}
                    index={i}
                  />
                ))}
              </div>

              {showArchived && archivedSections.length > 0 && (
                <>
                  <div style={{ marginTop: 20, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Archived
                    </span>
                  </div>
                  <div className="section-grid">
                    {archivedSections.map((section, i) => (
                      <SectionCard
                        key={section.id}
                        section={section}
                        entries={entries}
                        goals={goals}
                        goalEntries={goalEntries}
                        timelineStart={timeline.startDate}
                        timelineEnd={timeline.endDate}
                        onEdit={(s) => { setEditingSection(s); setAddSectionOpen(true); }}
                        onArchive={archiveSection}
                        onDelete={removeSection}
                        onAddScore={(sectionId) => {
                          setScoreDialogSection(sectionId);
                          setEditingEntry(null);
                          setScoreDialogOpen(true);
                        }}
                        onAddGoal={handleAddGoal}
                        onEditGoal={handleEditGoal}
                        onLogActual={handleLogActual}
                        onEditGoalEntry={handleEditGoalEntry}
                        index={i}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* AI Review panel */}
            <AIReviewPanel />
          </>
        )}
      </main>

      {/* Dialogs */}
      <AddSectionDialog
        open={addSectionOpen}
        onClose={() => { setAddSectionOpen(false); setEditingSection(null); }}
        editSection={editingSection}
      />
      <ScoreEntryDialog
        open={scoreDialogOpen}
        onClose={() => { setScoreDialogOpen(false); setEditingEntry(null); }}
        preselectedSectionId={scoreDialogSection}
        preselectedDate={scoreDialogDate}
        editEntry={editingEntry}
      />
      <GoalDialog
        open={goalDialogOpen}
        onClose={() => { setGoalDialogOpen(false); setEditingGoal(null); }}
        editGoal={editingGoal}
        preselectedSectionId={goalDialogSectionId}
      />
      <GoalEntryDialog
        open={goalEntryDialogOpen}
        onClose={() => { setGoalEntryDialogOpen(false); setActiveGoalForEntry(null); setEditingGoalEntry(null); }}
        goal={activeGoalForEntry}
        editEntry={editingGoalEntry}
        preselectedDate={goalEntryDate}
      />
    </div>
  );
}
