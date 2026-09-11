"use client";

import React from "react";
import { Section } from "@/lib/types";

interface SectionFilterProps {
  sections: Section[];
  activeSectionIds: string[] | "all";
  showOverall: boolean;
  onToggleSection: (id: string) => void;
  onToggleAll: () => void;
  onToggleOverall: () => void;
}

export function SectionFilter({
  sections,
  activeSectionIds,
  showOverall,
  onToggleSection,
  onToggleAll,
  onToggleOverall,
}: SectionFilterProps) {
  const active = sections.filter((s) => !s.archived);
  if (active.length === 0) return null;

  const allActive = activeSectionIds === "all";

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        alignItems: "center",
      }}
    >
      {/* Overall toggle */}
      <button
        className="btn btn-sm"
        onClick={onToggleOverall}
        style={{
          background: showOverall ? "var(--accent-subtle)" : "var(--bg-elevated)",
          border: showOverall ? "1px solid rgba(108,99,255,0.4)" : "1px solid var(--border)",
          color: showOverall ? "var(--accent)" : "var(--text-secondary)",
          gap: 6,
          fontSize: 12,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#6c63ff",
            display: "inline-block",
          }}
        />
        Overall
      </button>

      <div style={{ width: 1, height: 16, background: "var(--border)" }} />

      {/* All sections */}
      <button
        className="btn btn-sm"
        onClick={onToggleAll}
        style={{
          background: allActive ? "var(--bg-hover)" : "var(--bg-elevated)",
          border: "1px solid var(--border)",
          color: allActive ? "var(--text-primary)" : "var(--text-secondary)",
          fontSize: 12,
        }}
      >
        All
      </button>

      {/* Individual sections */}
      {active.map((section) => {
        const isActive =
          allActive || (Array.isArray(activeSectionIds) && activeSectionIds.includes(section.id));

        return (
          <button
            key={section.id}
            className="btn btn-sm"
            onClick={() => onToggleSection(section.id)}
            style={{
              background: isActive ? section.color + "22" : "var(--bg-elevated)",
              border: isActive ? `1px solid ${section.color}44` : "1px solid var(--border)",
              color: isActive ? section.color : "var(--text-secondary)",
              gap: 6,
              fontSize: 12,
            }}
          >
            <span>{section.icon}</span>
            {section.name}
          </button>
        );
      })}
    </div>
  );
}
