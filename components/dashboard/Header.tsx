"use client";

import React from "react";
import Link from "next/link";
import { Settings, Plus, TrendingUp, Calendar } from "lucide-react";
import { formatDisplayDate } from "@/lib/dates";

interface HeaderProps {
  onAddSection: () => void;
  onAddScore: () => void;
  todayStr: string;
}

export function Header({ onAddSection, onAddScore, todayStr }: HeaderProps) {
  return (
    <header
      style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 30,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            background: "var(--accent)",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TrendingUp size={15} color="white" strokeWidth={2.5} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" }}>
          Growth Graph
        </span>
      </div>

      {/* Date */}
      <div
        className="header-date"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "var(--text-secondary)",
          fontSize: 13,
        }}
      >
        <Calendar size={13} />
        <span>{formatDisplayDate(todayStr)}</span>
      </div>

      {/* Actions */}
      <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          id="add-score-btn"
          className="btn btn-primary btn-sm"
          onClick={onAddScore}
          style={{ gap: 5 }}
        >
          <Plus size={14} />
          Log Score
        </button>
        <button
          id="add-section-btn"
          className="btn btn-secondary btn-sm"
          onClick={onAddSection}
          style={{ gap: 5 }}
        >
          <Plus size={14} />
          Section
        </button>
        <Link
          href="/settings"
          id="settings-btn"
          className="btn btn-ghost btn-icon"
          aria-label="Settings"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
        >
          <Settings size={16} />
        </Link>
      </div>
    </header>
  );
}
