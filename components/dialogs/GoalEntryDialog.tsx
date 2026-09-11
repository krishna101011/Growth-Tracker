"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useApp } from "@/context/AppContext";
import { Goal, GoalEntry } from "@/lib/types";
import { today } from "@/lib/dates";
import { calculateAchievement, formatTarget } from "@/lib/goalScoring";

interface GoalEntryDialogProps {
  open: boolean;
  onClose: () => void;
  goal: Goal | null;
  editEntry?: GoalEntry | null;
  preselectedDate?: string;
}

export function GoalEntryDialog({
  open,
  onClose,
  goal,
  editEntry,
  preselectedDate,
}: GoalEntryDialogProps) {
  const { addGoalEntry, editGoalEntry } = useApp();
  const isEditing = !!editEntry;

  const [date, setDate] = useState(editEntry?.date ?? preselectedDate ?? today());
  const [actualStr, setActualStr] = useState(
    editEntry ? String(editEntry.actualValue) : ""
  );
  const [binaryCompleted, setBinaryCompleted] = useState(
    editEntry ? editEntry.actualValue >= 1 : false
  );
  const [note, setNote] = useState(editEntry?.note ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setDate(editEntry?.date ?? preselectedDate ?? today());
      setActualStr(editEntry ? String(editEntry.actualValue) : "");
      setBinaryCompleted(editEntry ? editEntry.actualValue >= 1 : false);
      setNote(editEntry?.note ?? "");
      setError("");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, editEntry, preselectedDate]);

  if (!goal) return null;

  const isBinary = goal.metricType === "binary";

  const actualValue = isBinary
    ? binaryCompleted ? 1 : 0
    : parseFloat(actualStr);

  const preview = (!isBinary && !isNaN(actualValue) && actualValue >= 0)
    ? calculateAchievement(actualValue, goal.targetValue)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!date) { setError("Date is required."); return; }

    if (!isBinary) {
      const v = parseFloat(actualStr);
      if (isNaN(v) || v < 0) {
        setError("Please enter a valid number (0 or above).");
        return;
      }
    }

    const data: Omit<GoalEntry, "id" | "updatedAt"> = {
      goalId: goal.id,
      date,
      actualValue: isBinary ? (binaryCompleted ? 1 : 0) : parseFloat(actualStr),
      note: note.trim() || undefined,
    };

    if (isEditing && editEntry) {
      editGoalEntry({ ...editEntry, ...data });
    } else {
      addGoalEntry(data);
    }
    onClose();
  };

  const achievementColor =
    preview === null ? "var(--text-muted)" :
    preview.achievementPct >= 100 ? "var(--green)" :
    preview.achievementPct >= 60 ? "var(--amber)" : "var(--red)";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Actual" : "Log Actual"}
      width={440}
    >
      <form onSubmit={handleSubmit}>
        {/* Goal info header */}
        <div
          style={{
            padding: "10px 14px",
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>
            Goal
          </div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{goal.name}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
            Target: {formatTarget(goal)}
          </div>
        </div>

        {/* Date */}
        <div style={{ marginBottom: 14 }}>
          <label className="label" htmlFor="ge-date">Date</label>
          <input
            id="ge-date"
            type="date"
            className="input"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Actual Value */}
        <div style={{ marginBottom: 14 }}>
          <label className="label">
            {isBinary ? "Status" : `Actual (${goal.unit || "value"})`}
          </label>
          {isBinary ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setBinaryCompleted(true)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "var(--radius-md)",
                  border: binaryCompleted ? "1.5px solid var(--green)" : "1px solid var(--border)",
                  background: binaryCompleted ? "rgba(34,197,94,0.1)" : "var(--bg-elevated)",
                  color: binaryCompleted ? "var(--green)" : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                ✓ Completed
              </button>
              <button
                type="button"
                onClick={() => setBinaryCompleted(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "var(--radius-md)",
                  border: !binaryCompleted ? "1.5px solid var(--red)" : "1px solid var(--border)",
                  background: !binaryCompleted ? "rgba(239,68,68,0.1)" : "var(--bg-elevated)",
                  color: !binaryCompleted ? "var(--red)" : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                ✗ Not completed
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                id="ge-actual"
                type="number"
                className="input"
                value={actualStr}
                min="0"
                step="0.1"
                onChange={(e) => { setActualStr(e.target.value); setError(""); }}
                placeholder={`e.g. ${goal.targetValue}`}
                autoFocus
              />
              {goal.unit && (
                <span style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {goal.unit}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Achievement preview */}
        {(preview || isBinary) && (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Achievement</span>
            <span style={{ fontWeight: 700, fontSize: 18, color: achievementColor }}>
              {isBinary
                ? (binaryCompleted ? "100%" : "0%")
                : preview
                  ? `${preview.achievementPct}%`
                  : "—"}
            </span>
          </div>
        )}

        {/* Progress bar */}
        {preview && !isBinary && (
          <div
            style={{
              height: 6,
              background: "var(--border)",
              borderRadius: 99,
              marginBottom: 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${preview.displayPct}%`,
                background: achievementColor,
                borderRadius: 99,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        )}

        {/* Note */}
        <div style={{ marginBottom: 16 }}>
          <label className="label" htmlFor="ge-note">Note (optional)</label>
          <textarea
            id="ge-note"
            className="input"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any context for this entry…"
            maxLength={300}
            style={{ resize: "none" }}
          />
        </div>

        {error && (
          <p style={{ color: "var(--red)", fontSize: 12, marginBottom: 12 }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {isEditing ? "Update" : "Log Actual"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
