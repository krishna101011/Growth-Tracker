"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useApp } from "@/context/AppContext";
import { Goal, MetricType, GoalFrequency } from "@/lib/types";
import { today } from "@/lib/dates";

const UNIT_SUGGESTIONS: Record<MetricType, string[]> = {
  duration: ["hours", "minutes"],
  count: ["questions", "sessions", "tasks", "reps"],
  numeric: ["pages", "km", "calories", "words"],
  binary: [],
};

interface GoalDialogProps {
  open: boolean;
  onClose: () => void;
  editGoal?: Goal | null;
  preselectedSectionId?: string;
}

export function GoalDialog({ open, onClose, editGoal, preselectedSectionId }: GoalDialogProps) {
  const { sections, createGoal, updateGoal } = useApp();
  const isEditing = !!editGoal;
  const activeSections = sections.filter((s) => !s.archived);

  const [sectionId, setSectionId] = useState(
    editGoal?.sectionId ?? preselectedSectionId ?? activeSections[0]?.id ?? ""
  );
  const [name, setName] = useState(editGoal?.name ?? "");
  const [metricType, setMetricType] = useState<MetricType>(editGoal?.metricType ?? "duration");
  const [targetValue, setTargetValue] = useState<string>(
    editGoal ? String(editGoal.targetValue) : "1"
  );
  const [unit, setUnit] = useState(editGoal?.unit ?? "hours");
  const [frequency, setFrequency] = useState<GoalFrequency>(editGoal?.frequency ?? "daily");
  const [startDate, setStartDate] = useState(editGoal?.startDate ?? today());
  const [endDate, setEndDate] = useState(editGoal?.endDate ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setSectionId(editGoal?.sectionId ?? preselectedSectionId ?? activeSections[0]?.id ?? "");
      setName(editGoal?.name ?? "");
      setMetricType(editGoal?.metricType ?? "duration");
      setTargetValue(editGoal ? String(editGoal.targetValue) : "1");
      setUnit(editGoal?.unit ?? "hours");
      setFrequency(editGoal?.frequency ?? "daily");
      setStartDate(editGoal?.startDate ?? today());
      setEndDate(editGoal?.endDate ?? "");
      setError("");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editGoal, preselectedSectionId]);

  // Auto-update unit when metric type changes (if not editing)
  useEffect(() => {
    if (!isEditing) {
      const suggestions = UNIT_SUGGESTIONS[metricType];
      /* eslint-disable react-hooks/set-state-in-effect */
      if (suggestions.length > 0) setUnit(suggestions[0]);
      else setUnit("");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!sectionId) { setError("Please select a section."); return; }
    if (!name.trim()) { setError("Goal name is required."); return; }
    if (!startDate) { setError("Start date is required."); return; }

    const parsedTarget = parseFloat(targetValue);
    if (metricType !== "binary" && (isNaN(parsedTarget) || parsedTarget <= 0)) {
      setError("Target value must be a positive number.");
      return;
    }

    const goalData: Omit<Goal, "id" | "createdAt"> = {
      sectionId,
      name: name.trim(),
      metricType,
      targetValue: metricType === "binary" ? 1 : parsedTarget,
      unit: metricType === "binary" ? "" : unit.trim(),
      frequency,
      startDate,
      endDate: endDate || undefined,
      active: true,
    };

    if (isEditing && editGoal) {
      updateGoal({ ...editGoal, ...goalData });
    } else {
      createGoal(goalData);
    }
    onClose();
  };

  const isBinary = metricType === "binary";

  return (
    <Dialog open={open} onClose={onClose} title={isEditing ? "Edit Goal" : "Add Goal"} width={520}>
      <form onSubmit={handleSubmit}>
        {/* Section */}
        <div style={{ marginBottom: 14 }}>
          <label className="label" htmlFor="goal-section">Section</label>
          {activeSections.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              No active sections. Create a section first.
            </p>
          ) : (
            <select
              id="goal-section"
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

        {/* Goal Name */}
        <div style={{ marginBottom: 14 }}>
          <label className="label" htmlFor="goal-name">Goal Name</label>
          <input
            id="goal-name"
            className="input"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="e.g. Daily Study, Morning Run"
            autoFocus
            maxLength={80}
          />
        </div>

        {/* Metric Type */}
        <div style={{ marginBottom: 14 }}>
          <label className="label">Metric Type</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["duration", "count", "numeric", "binary"] as MetricType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMetricType(t)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-md)",
                  border: metricType === t ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                  background: metricType === t ? "var(--accent-subtle)" : "var(--bg-elevated)",
                  color: metricType === t ? "var(--accent)" : "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.12s",
                  textTransform: "capitalize",
                }}
              >
                {t === "duration" ? "⏱ Duration" :
                 t === "count" ? "🔢 Count" :
                 t === "numeric" ? "📊 Numeric" : "✅ Binary"}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
            {metricType === "duration" && "Track time (e.g. 5 hours of study)"}
            {metricType === "count" && "Track items (e.g. 30 questions, 10 sessions)"}
            {metricType === "numeric" && "Track any number (e.g. 20 pages, 5 km)"}
            {metricType === "binary" && "Completed or not completed"}
          </p>
        </div>

        {/* Target Value + Unit */}
        {!isBinary && (
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="goal-target">Target Value</label>
              <input
                id="goal-target"
                type="number"
                className="input"
                value={targetValue}
                min="0.01"
                step="0.5"
                onChange={(e) => { setTargetValue(e.target.value); setError(""); }}
                placeholder="e.g. 5"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label" htmlFor="goal-unit">Unit</label>
              <input
                id="goal-unit"
                className="input"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="hours, pages, km…"
                list="unit-suggestions"
                maxLength={30}
              />
              <datalist id="unit-suggestions">
                {UNIT_SUGGESTIONS[metricType].map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
          </div>
        )}

        {/* Frequency */}
        <div style={{ marginBottom: 14 }}>
          <label className="label" htmlFor="goal-frequency">Frequency</label>
          <select
            id="goal-frequency"
            className="input"
            style={{ appearance: "auto" }}
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as GoalFrequency)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom / One-time</option>
          </select>
        </div>

        {/* Dates */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="goal-start">Start Date</label>
            <input
              id="goal-start"
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="goal-end">End Date (optional)</label>
            <input
              id="goal-end"
              type="date"
              className="input"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p style={{ color: "var(--red)", fontSize: 12, marginBottom: 12 }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={activeSections.length === 0}>
            {isEditing ? "Save Changes" : "Create Goal"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
