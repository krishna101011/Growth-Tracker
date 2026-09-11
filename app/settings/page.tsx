"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { TimelineSettings } from "@/components/settings/TimelineSettings";
import { DataManagement } from "@/components/settings/DataManagement";
import { AISettings } from "@/components/settings/AISettings";

const TABS = [
  { id: "ai", label: "AI Review" },
  { id: "appearance", label: "Appearance" },
  { id: "timeline", label: "Timeline" },
  { id: "data", label: "Data" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("ai");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* Header */}
      <header
        style={{
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          gap: 16,
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <Link
          href="/"
          className="btn btn-ghost btn-icon"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              background: "var(--accent)",
              borderRadius: 5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrendingUp size={13} color="white" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Settings</span>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
        {/* Tab nav */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 28,
            background: "var(--bg-elevated)",
            padding: 4,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            width: "fit-content",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`settings-tab-${tab.id}`}
              className="btn"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: "var(--radius-sm)",
                background: activeTab === tab.id ? "var(--accent)" : "transparent",
                color: activeTab === tab.id ? "#fff" : "var(--text-secondary)",
                border: "none",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          className="card"
          style={{ animation: "slideUp 0.15s ease" }}
        >
          {activeTab === "ai" && <AISettings />}
          {activeTab === "appearance" && <AppearanceSettings />}
          {activeTab === "timeline" && <TimelineSettings />}
          {activeTab === "data" && <DataManagement />}
        </div>

        {/* Footer notice */}
        <p
          style={{
            marginTop: 20,
            fontSize: 12,
            color: "var(--text-muted)",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          Growth Graph is local-first. All data is stored in your browser. 
          No account required. No data leaves your device (except AI review requests to your configured provider).
        </p>
      </main>
    </div>
  );
}
