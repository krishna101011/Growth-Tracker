"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useApp } from "@/context/AppContext";
import { ScoreEntry } from "@/lib/types";
import { today } from "@/lib/dates";

interface ScoreEntryDialogProps {
  open: boolean;
  onClose: () => void;
  preselectedSectionId?: string;
  preselectedDate?: string;
  editEntry?: ScoreEntry | null;
}

export function ScoreEntryDialog({
  open,
  onClose,
  preselectedSectionId,
  preselectedDate,
  editEntry,
}: ScoreEntryDialogProps) {
  const { sections, entries, addEntry, editEntry: updateEntry } = useApp();
  const isEditing = !!editEntry;

  const activeSections = sections.filter((s) => !s.archived);

  const [sectionId, setSectionId] = useState(
    editEntry?.sectionId ?? preselectedSectionId ?? activeSections[0]?.id ?? ""
  );
  const [date, setDate] = useState(editEntry?.date ?? preselectedDate ?? today());
  const [score, setScore] = useState<number>(editEntry?.score ?? 75);
  const [note, setNote] = useState(editEntry?.note ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setSectionId(editEntry?.sectionId ?? preselectedSectionId ?? activeSections[0]?.id ?? "");
      setDate(editEntry?.date ?? preselectedDate ?? today());
      setScore(editEntry?.score ?? 75);
      setNote(editEntry?.note ?? "");
      setError("");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editEntry, preselectedSectionId, preselectedDate]);

  // Check for existing entry on selected date+section
  const existingEntry = !isEditing
    ? entries.find((e) => e.sectionId === sectionId && e.date === date)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionId) { setError("Please select a section."); return; }
    if (!date) { setError("Please select a date."); return; }
    if (score < 0 || score > 100 || isNaN(score)) {
      setError("Score must be between 0 and 100.");
      return;
    }

    if (isEditing && editEntry) {
      updateEntry({ ...editEntry, sectionId, date, score, note: note.trim() });
    } else if (existingEntry) {
      // Update existing entry for same section+date
      updateEntry({ ...existingEntry, score, note: note.trim() });
    } else {
      addEntry({ sectionId, date, score, note: note.trim() });
    }
    onClose();
  };

  const selectedSection = activeSections.find((s) => s.id === sectionId);
  const scoreColor =
    score >= 70 ? "var(--green)" : score >= 40 ? "var(--amber)" : "var(--red)";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Score" : "Log Score"}
    >
      <form onSubmit={handleSubmit}>
        {/* Section selector */}
        <div style={{ marginBottom: 14 }}>
          <label className="label" htmlFor="entry-section">
            Section
          </label>
          {activeSections.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              No active sections. Create a section first.
            </p>
          ) : (
            <select
              id="entry-section"
              className="input"
              style={{ appearance: "auto" }}
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
            >
              {activeSections.map((s) => (
                <option key={s.id} value={s.id} style={{ background: "var(--bg-elevated)" }}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Date */}
        <div style={{ marginBottom: 14 }}>
          <label className="label" htmlFor="entry-date">
            Date
          </label>
          <input
            id="entry-date"
            type="date"
            className="input"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Score slider */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <label className="label" style={{ marginBottom: 0 }}>
              Score
            </label>
            <span
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: scoreColor,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {score}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            style={{ "--thumb-color": scoreColor } as React.CSSProperties}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>0</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>100</span>
          </div>
          {/* Or type it */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <label style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>or type:</label>
            <input
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => {
                const v = Math.min(100, Math.max(0, Number(e.target.value)));
                setScore(isNaN(v) ? 0 : v);
              }}
              style={{
                width: 64,
                padding: "4px 8px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                fontSize: 14,
                fontWeight: 600,
                textAlign: "center",
              }}
            />
          </div>
        </div>

        {/* Note */}
        <div style={{ marginBottom: 16 }}>
          <label className="label" htmlFor="entry-note">
            Note (optional)
          </label>
          <textarea
            id="entry-note"
            className="input"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What influenced this score today?"
            maxLength={300}
            style={{ resize: "none" }}
          />
        </div>

        {existingEntry && !isEditing && (
          <div
            style={{
              padding: "8px 12px",
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: "var(--radius-sm)",
              marginBottom: 14,
              fontSize: 12,
              color: "var(--amber)",
            }}
          >
            An entry for {selectedSection?.name} on this date already exists (score: {existingEntry.score}). Submitting will update it.
          </div>
        )}

        {error && (
          <p style={{ color: "var(--red)", fontSize: 12, marginBottom: 12 }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={activeSections.length === 0}
          >
            {isEditing ? "Update" : existingEntry ? "Update Entry" : "Save Score"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
