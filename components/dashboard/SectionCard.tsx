"use client";

import React, { useState } from "react";
import { TrendingUp, TrendingDown, Minus, Edit2, Archive, ArchiveRestore, Trash2, Plus, Target } from "lucide-react";
import { Section, ScoreEntry, Goal, GoalEntry } from "@/lib/types";
import { Sparkline } from "@/components/charts/Sparkline";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { GoalCard } from "@/components/goals/GoalCard";
import { getSectionLatestScore, getSectionTrend } from "@/lib/scoring";
import { today, formatDisplayDate } from "@/lib/dates";

interface SectionCardProps {
  section: Section;
  entries: ScoreEntry[];
  goals: Goal[];
  goalEntries: GoalEntry[];
  timelineStart: string;
  timelineEnd: string;
  onEdit: (section: Section) => void;
  onArchive: (id: string, archived: boolean) => void;
  onDelete: (id: string) => void;
  onAddScore: (sectionId: string) => void;
  onAddGoal: (sectionId: string) => void;
  onEditGoal: (goal: Goal) => void;
  onLogActual: (goal: Goal) => void;
  onEditGoalEntry: (goal: Goal, entry: GoalEntry) => void;
  index?: number;
}

export function SectionCard({
  section,
  entries,
  goals,
  goalEntries,
  timelineStart,
  timelineEnd,
  onEdit,
  onArchive,
  onDelete,
  onAddScore,
  onAddGoal,
  onEditGoal,
  onLogActual,
  onEditGoalEntry,
}: SectionCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const todayStr = today();

  const currentScore = getSectionLatestScore(section.id, entries, todayStr);
  const trend = getSectionTrend(section.id, entries, todayStr);

  // Sparkline data: last 14 entries sorted by date
  const sectionEntries = entries
    .filter((e) => e.sectionId === section.id)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);

  const sparkData = sectionEntries.map((e) => ({ value: e.score }));

  const latestEntry = sectionEntries[sectionEntries.length - 1];

  const sectionGoals = goals.filter((g) => g.sectionId === section.id && g.active);

  const trendIcon =
    trend === null ? (
      <Minus size={12} />
    ) : trend > 0 ? (
      <TrendingUp size={12} />
    ) : trend < 0 ? (
      <TrendingDown size={12} />
    ) : (
      <Minus size={12} />
    );

  const trendColor =
    trend === null ? "var(--text-muted)" : trend > 0 ? "var(--green)" : trend < 0 ? "var(--red)" : "var(--text-muted)";

  const sectionColor = section.color || "#6c63ff";

  return (
    <>
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "16px",
          opacity: section.archived ? 0.6 : 1,
          transition: "all 0.15s",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = sectionColor + "44";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
        }}
      >
        {/* Accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: sectionColor,
            opacity: 0.6,
          }}
        />

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{section.icon}</span>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {section.name}
                {section.archived && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 10,
                      color: "var(--text-muted)",
                      fontWeight: 400,
                      background: "var(--bg-elevated)",
                      padding: "1px 6px",
                      borderRadius: 99,
                    }}
                  >
                    archived
                  </span>
                )}
              </div>
              {section.description && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {section.description}
                </div>
              )}
            </div>
          </div>

          {/* Score */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: sectionColor,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {currentScore !== null ? currentScore : "—"}
            </div>
            {trend !== null && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  justifyContent: "flex-end",
                  color: trendColor,
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                {trendIcon}
                <span>
                  {trend > 0 ? "+" : ""}
                  {trend}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sparkline */}
        {sparkData.length > 1 && (
          <div style={{ marginBottom: 10 }}>
            <Sparkline
              data={sparkData}
              color={sectionColor}
              height={36}
              trend={
                trend === null
                  ? "none"
                  : trend > 0
                  ? "up"
                  : trend < 0
                  ? "down"
                  : "flat"
              }
            />
          </div>
        )}

        {/* Latest update */}
        {latestEntry && (
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>
            Last: {formatDisplayDate(latestEntry.date)}
            {latestEntry.note && ` · "${latestEntry.note}"`}
          </div>
        )}

        {/* ── Goals section ── */}
        {sectionGoals.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Target size={10} />
              Goals
            </div>
            {sectionGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                goalEntries={goalEntries}
                timelineStart={timelineStart}
                timelineEnd={timelineEnd}
                onLogActual={onLogActual}
                onEditGoal={onEditGoal}
                onEditEntry={onEditGoalEntry}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
          {!section.archived && (
            <>
              <button
                id={`add-score-${section.id}`}
                className="btn btn-ghost btn-sm btn-icon"
                onClick={() => onAddScore(section.id)}
                title="Log score"
                style={{ color: sectionColor }}
              >
                <Plus size={14} />
              </button>
              <button
                id={`add-goal-${section.id}`}
                className="btn btn-ghost btn-sm btn-icon"
                onClick={() => onAddGoal(section.id)}
                title="Add goal"
                style={{ color: "var(--amber)" }}
              >
                <Target size={13} />
              </button>
            </>
          )}
          <button
            id={`edit-section-${section.id}`}
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => onEdit(section)}
            title="Edit"
          >
            <Edit2 size={13} />
          </button>
          <button
            id={`archive-section-${section.id}`}
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => onArchive(section.id, !section.archived)}
            title={section.archived ? "Restore" : "Archive"}
          >
            {section.archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
          </button>
          <button
            id={`delete-section-${section.id}`}
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete"
            style={{ color: "var(--red)" }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => onDelete(section.id)}
        title="Delete Section"
        message={`Delete "${section.name}"? This will permanently remove the section and all its score history. This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
