"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useApp } from "@/context/AppContext";
import { Section } from "@/lib/types";

const EMOJI_OPTIONS = [
  "📚", "💪", "📖", "💻", "💰", "😴", "💼", "🧘", "🎯", "🏃",
  "🍎", "🎨", "🎵", "🌱", "🔬", "✍️", "🧠", "❤️", "🤝", "⚡",
];

const COLOR_OPTIONS = [
  "#6c63ff", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6",
  "#ec4899", "#14b8a6", "#8b5cf6", "#f97316", "#06b6d4",
];

interface AddSectionDialogProps {
  open: boolean;
  onClose: () => void;
  editSection?: Section | null;
}

export function AddSectionDialog({ open, onClose, editSection }: AddSectionDialogProps) {
  const { createSection, updateSection } = useApp();
  const isEditing = !!editSection;

  const [name, setName] = useState(editSection?.name ?? "");
  const [description, setDescription] = useState(editSection?.description ?? "");
  const [icon, setIcon] = useState(editSection?.icon ?? "📈");
  const [color, setColor] = useState(editSection?.color ?? COLOR_OPTIONS[0]);
  const [error, setError] = useState("");

  // Reset when dialog opens with new data
  React.useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setName(editSection?.name ?? "");
      setDescription(editSection?.description ?? "");
      setIcon(editSection?.icon ?? "📈");
      setColor(editSection?.color ?? COLOR_OPTIONS[0]);
      setError("");
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, editSection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Section name is required.");
      return;
    }
    if (trimmed.length > 50) {
      setError("Name must be 50 characters or less.");
      return;
    }

    if (isEditing && editSection) {
      updateSection({ ...editSection, name: trimmed, description: description.trim(), icon, color });
    } else {
      createSection({ name: trimmed, description: description.trim(), icon, color, weight: 1 });
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Section" : "New Section"}
    >
      <form onSubmit={handleSubmit}>
        {/* Icon & Color row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label className="label">Icon</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "var(--radius-sm)",
                    border: icon === e ? `2px solid ${color}` : "1px solid var(--border)",
                    background: icon === e ? "var(--accent-subtle)" : "var(--bg-elevated)",
                    cursor: "pointer",
                    fontSize: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.1s",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Color */}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Color</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: c,
                  border: color === c ? "3px solid var(--text-primary)" : "2px solid transparent",
                  cursor: "pointer",
                  outline: color === c ? `2px solid ${c}` : "none",
                  outlineOffset: 2,
                  transition: "all 0.1s",
                }}
              />
            ))}
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <label className="label" htmlFor="section-name">
            Name *
          </label>
          <input
            id="section-name"
            className="input"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="e.g. Study, Physical, Finance"
            autoFocus
            maxLength={50}
          />
          {error && (
            <p style={{ color: "var(--red)", fontSize: 12, marginTop: 4 }}>{error}</p>
          )}
        </div>

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <label className="label" htmlFor="section-desc">
            Description (optional)
          </label>
          <input
            id="section-desc"
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this track?"
            maxLength={120}
          />
        </div>

        {/* Preview */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 20 }}>{icon}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: color || "var(--text-primary)" }}>
              {name || "Section name"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {description || "No description"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {isEditing ? "Save Changes" : "Create Section"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
