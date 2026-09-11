"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Goal, GoalEntry } from "@/lib/types";
import { useApp } from "@/context/AppContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { calculateAchievement, getGoalMetrics, formatTarget, formatActual } from "@/lib/goalScoring";
import { today } from "@/lib/dates";

interface GoalCardProps {
  goal: Goal;
  goalEntries: GoalEntry[];
  timelineStart: string;
  timelineEnd: string;
  onLogActual: (goal: Goal) => void;
  onEditGoal: (goal: Goal) => void;
  onEditEntry: (goal: Goal, entry: GoalEntry) => void;
}

export function GoalCard({
  goal,
  goalEntries,
  timelineStart,
  timelineEnd,
  onLogActual,
  onEditGoal,
  onEditEntry,
}: GoalCardProps) {
  const { removeGoal } = useApp();
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const todayStr = today();

  const relevantEntries = goalEntries
    .filter((e) => e.goalId === goal.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const todayEntry = relevantEntries.find((e) => e.date === todayStr);
  const latestEntry = relevantEntries[0];

  const metrics = getGoalMetrics(goal, goalEntries, timelineStart, timelineEnd);
  const isBinary = goal.metricType === "binary";

  const displayActual = latestEntry !== undefined
    ? formatActual(latestEntry.actualValue, goal)
    : null;

  const achievement = latestEntry !== undefined
    ? calculateAchievement(latestEntry.actualValue, goal.targetValue)
    : null;

  const achievementColor =
    achievement === null ? "var(--text-muted)" :
    achievement.achievementPct >= 100 ? "var(--green)" :
    achievement.achievementPct >= 60 ? "var(--amber)" : "var(--red)";

  return (
    <>
      <div
        style={{
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          padding: "10px 12px",
          marginBottom: 6,
        }}
      >
        {/* Top row: goal name + actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {goal.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
              {formatTarget(goal)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button
              id={`log-actual-${goal.id}`}
              className="btn btn-ghost btn-sm"
              onClick={() => onLogActual(goal)}
              style={{ gap: 4, fontSize: 11, padding: "4px 8px" }}
              title="Log actual"
            >
              <Plus size={11} />
              {todayEntry ? "Update" : "Log"}
            </button>
            <button
              id={`edit-goal-${goal.id}`}
              className="btn btn-ghost btn-sm btn-icon"
              onClick={() => onEditGoal(goal)}
              title="Edit goal"
            >
              <Edit2 size={11} />
            </button>
            <button
              id={`delete-goal-${goal.id}`}
              className="btn btn-ghost btn-sm btn-icon"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete goal"
              style={{ color: "var(--red)" }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {/* Achievement row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isBinary ? 6 : 8 }}>
          <div style={{ flex: 1 }}>
            {!isBinary && (
              <div
                style={{
                  height: 5,
                  background: "var(--border)",
                  borderRadius: 99,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${achievement?.displayPct ?? 0}%`,
                    background: achievementColor,
                    borderRadius: 99,
                    transition: "width 0.3s",
                  }}
                />
              </div>
            )}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {displayActual !== null ? (
              <div style={{ fontSize: 13, fontWeight: 700, color: achievementColor }}>
                {isBinary
                  ? displayActual
                  : `${displayActual} · ${achievement?.achievementPct}%`}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>No entry yet</div>
            )}
          </div>
        </div>

        {/* Mini stats row */}
        {metrics.entryCount > 0 && (
          <div style={{ display: "flex", gap: 10, fontSize: 10, color: "var(--text-muted)" }}>
            {metrics.averageActual !== null && !isBinary && (
              <span>Avg: {metrics.averageActual}{goal.unit ? ` ${goal.unit}` : ""}</span>
            )}
            {metrics.consistency !== null && (
              <span>Consistency: {metrics.consistency}%</span>
            )}
            {metrics.currentStreak > 1 && (
              <span style={{ color: "var(--amber)" }}>🔥 {metrics.currentStreak}d streak</span>
            )}
            {metrics.completionDays > 0 && (
              <span style={{ color: "var(--green)" }}>✓ {metrics.completionDays}/{metrics.entryCount}</span>
            )}
          </div>
        )}

        {/* History toggle */}
        {relevantEntries.length > 0 && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowHistory((v) => !v)}
            style={{
              marginTop: 8,
              fontSize: 11,
              gap: 4,
              padding: "3px 6px",
              color: "var(--text-muted)",
            }}
          >
            <Clock size={10} />
            History ({relevantEntries.length})
            {showHistory ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
        )}

        {/* History list */}
        {showHistory && relevantEntries.length > 0 && (
          <div
            style={{
              marginTop: 6,
              borderTop: "1px solid var(--border)",
              paddingTop: 6,
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            {relevantEntries.slice(0, 30).map((entry) => {
              const ach = calculateAchievement(entry.actualValue, goal.targetValue);
              const entryColor =
                ach.achievementPct >= 100 ? "var(--green)" :
                ach.achievementPct >= 60 ? "var(--amber)" : "var(--red)";
              return (
                <div
                  key={entry.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 0",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: "var(--text-muted)", minWidth: 72 }}>{entry.date}</span>
                  <span style={{ color: entryColor, fontWeight: 600, flex: 1 }}>
                    {formatActual(entry.actualValue, goal)}
                  </span>
                  <span style={{ color: entryColor, minWidth: 36 }}>
                    {ach.achievementPct}%
                  </span>
                  {entry.note && (
                    <span
                      style={{ color: "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      title={entry.note}
                    >
                      {entry.note}
                    </span>
                  )}
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => onEditEntry(goal, entry)}
                    title="Edit entry"
                    style={{ padding: 3 }}
                  >
                    <Edit2 size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => removeGoal(goal.id)}
        title="Delete Goal"
        message={`Delete "${goal.name}"? This will permanently remove the goal and all its history.`}
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
