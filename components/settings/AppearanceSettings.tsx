"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { Theme, Density } from "@/lib/types";

// ─── Sub-components hoisted outside render ────────────────────────────────────

interface ThemeButtonProps {
  value: Theme;
  label: string;
  current: Theme;
  onSelect: (t: Theme) => void;
}

function ThemeButton({ value, label, current, onSelect }: ThemeButtonProps) {
  return (
    <button
      className="btn"
      onClick={() => onSelect(value)}
      style={{
        flex: 1,
        justifyContent: "center",
        background: current === value ? "var(--accent)" : "var(--bg-elevated)",
        color: current === value ? "#fff" : "var(--text-secondary)",
        border: current === value ? "1px solid var(--accent)" : "1px solid var(--border)",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

interface DensityButtonProps {
  value: Density;
  label: string;
  current: Density;
  onSelect: (d: Density) => void;
}

function DensityButton({ value, label, current, onSelect }: DensityButtonProps) {
  return (
    <button
      className="btn"
      onClick={() => onSelect(value)}
      style={{
        flex: 1,
        justifyContent: "center",
        background: current === value ? "var(--accent)" : "var(--bg-elevated)",
        color: current === value ? "#fff" : "var(--text-secondary)",
        border: current === value ? "1px solid var(--accent)" : "1px solid var(--border)",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AppearanceSettings() {
  const { settings, updateSettings } = useApp();
  const { theme, density } = settings.ui;

  const setTheme = (t: Theme) => {
    updateSettings({ ...settings, ui: { ...settings.ui, theme: t } });
  };

  const setDensity = (d: Density) => {
    updateSettings({ ...settings, ui: { ...settings.ui, density: d } });
  };

  return (
    <div>
      <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Appearance</h3>

      <div style={{ marginBottom: 20 }}>
        <label className="label">Theme</label>
        <div style={{ display: "flex", gap: 6 }}>
          <ThemeButton value="system" label="System" current={theme} onSelect={setTheme} />
          <ThemeButton value="dark" label="Dark" current={theme} onSelect={setTheme} />
          <ThemeButton value="light" label="Light" current={theme} onSelect={setTheme} />
        </div>
      </div>

      <div>
        <label className="label">Density</label>
        <div style={{ display: "flex", gap: 6 }}>
          <DensityButton value="comfortable" label="Comfortable" current={density} onSelect={setDensity} />
          <DensityButton value="compact" label="Compact" current={density} onSelect={setDensity} />
        </div>
      </div>
    </div>
  );
}
