"use client";

import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Eye, EyeOff, Plus, Trash2, CheckCircle, XCircle, AlertCircle, Clock, ZapOff } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { AIKeySlot, AIProvider } from "@/lib/types";
import { DEFAULT_MODELS, PROVIDER_LABELS } from "@/lib/ai/providers";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const PROVIDERS: AIProvider[] = ["openai", "anthropic", "gemini", "openai-compatible"];

const STATUS_INFO: Record<AIKeySlot["status"], { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: "Active", color: "var(--green)", icon: <CheckCircle size={12} /> },
  invalid: { label: "Invalid", color: "var(--red)", icon: <XCircle size={12} /> },
  "rate-limited": { label: "Rate Limited", color: "var(--amber)", icon: <AlertCircle size={12} /> },
  cooldown: { label: "Cooldown", color: "var(--amber)", icon: <Clock size={12} /> },
  disabled: { label: "Disabled", color: "var(--text-muted)", icon: <ZapOff size={12} /> },
};

function maskKey(key: string): string {
  if (!key || key.length <= 8) return "••••••••";
  return key.slice(0, 4) + "••••••••" + key.slice(-4);
}

interface KeySlotEditorProps {
  slot: AIKeySlot;
  onSave: (slot: AIKeySlot) => void;
  onDelete: (id: string) => void;
}

function KeySlotEditor({ slot, onSave, onDelete }: KeySlotEditorProps) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(slot);
  const [showKey, setShowKey] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const statusInfo = STATUS_INFO[slot.status];

  if (!editing) {
    return (
      <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            marginBottom: 8,
          }}
        >
          {/* Enabled toggle */}
          <label className="toggle" style={{ flexShrink: 0 }}>
            <input
              type="checkbox"
              checked={slot.enabled}
              onChange={(e) => onSave({ ...slot, enabled: e.target.checked })}
            />
            <span className="toggle-track" />
            <span className="toggle-thumb" />
          </label>

          {/* Provider badge */}
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 99,
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            {PROVIDER_LABELS[slot.provider]}
          </span>

          {/* Model */}
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
            {slot.model}
          </span>

          {/* Masked key */}
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace", flex: 1 }}>
            {maskKey(slot.apiKey)}
          </span>

          {/* Status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: statusInfo.color,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {statusInfo.icon}
            {statusInfo.label}
          </div>

          {/* Priority */}
          <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            #{slot.priority}
          </span>

          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => setDeleteConfirm(true)}
            style={{ color: "var(--red)" }}
          >
            <Trash2 size={13} />
          </button>
        </div>

        <ConfirmDialog
          open={deleteConfirm}
          onClose={() => setDeleteConfirm(false)}
          onConfirm={() => onDelete(slot.id)}
          title="Remove API Key"
          message={`Remove this ${PROVIDER_LABELS[slot.provider]} key? The key itself is not revoked — you must do that in your provider's dashboard.`}
          confirmLabel="Remove"
          danger
        />
      </>
    );
  }

  // Edit mode
  return (
    <div
      style={{
        padding: "16px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--accent)",
        borderRadius: "var(--radius-md)",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {/* Provider */}
        <div>
          <label className="label">Provider</label>
          <select
            className="input"
            style={{ appearance: "auto" }}
            value={local.provider}
            onChange={(e) => {
              const p = e.target.value as AIProvider;
              setLocal((l) => ({ ...l, provider: p, model: DEFAULT_MODELS[p] }));
            }}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p} style={{ background: "var(--bg-elevated)" }}>
                {PROVIDER_LABELS[p]}
              </option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div>
          <label className="label">Model</label>
          <input
            className="input"
            value={local.model}
            onChange={(e) => setLocal((l) => ({ ...l, model: e.target.value }))}
            placeholder={DEFAULT_MODELS[local.provider]}
          />
        </div>

        {/* API Key */}
        <div style={{ gridColumn: "span 2" }}>
          <label className="label">API Key</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              className="input"
              type={showKey ? "text" : "password"}
              value={local.apiKey}
              onChange={(e) => setLocal((l) => ({ ...l, apiKey: e.target.value }))}
              placeholder="Paste your API key here"
              autoComplete="off"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              onClick={() => setShowKey((v) => !v)}
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Custom base URL (for openai-compatible) */}
        {local.provider === "openai-compatible" && (
          <div style={{ gridColumn: "span 2" }}>
            <label className="label">Base URL</label>
            <input
              className="input"
              value={local.baseUrl ?? ""}
              onChange={(e) => setLocal((l) => ({ ...l, baseUrl: e.target.value }))}
              placeholder="https://api.yourendpoint.com/v1"
            />
          </div>
        )}

        {/* Priority */}
        <div>
          <label className="label">Priority (1 = highest)</label>
          <input
            className="input"
            type="number"
            min={1}
            max={5}
            value={local.priority}
            onChange={(e) => setLocal((l) => ({ ...l, priority: Number(e.target.value) }))}
          />
        </div>

        {/* Status reset */}
        <div>
          <label className="label">Status</label>
          <select
            className="input"
            style={{ appearance: "auto" }}
            value={local.status}
            onChange={(e) => setLocal((l) => ({ ...l, status: e.target.value as AIKeySlot["status"] }))}
          >
            {Object.keys(STATUS_INFO).map((s) => (
              <option key={s} value={s} style={{ background: "var(--bg-elevated)" }}>
                {STATUS_INFO[s as AIKeySlot["status"]].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notice */}
      <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>
        ⚠️ API keys are stored locally in your browser. This is not enterprise-grade secret storage — only use keys you own.
      </p>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => { setLocal(slot); setEditing(false); }}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            onSave(local);
            setEditing(false);
          }}
        >
          Save Key
        </button>
      </div>
    </div>
  );
}

export function AISettings() {
  const { settings, updateAIKey, removeAIKey } = useApp();
  const keys = settings.ai.keys.sort((a, b) => a.priority - b.priority);

  const addKey = () => {
    const existingPriorities = keys.map((k) => k.priority);
    let nextPriority = 1;
    while (existingPriorities.includes(nextPriority)) nextPriority++;

    const newSlot: AIKeySlot = {
      id: uuidv4(),
      enabled: true,
      provider: "openai",
      apiKey: "",
      model: DEFAULT_MODELS.openai,
      status: "active",
      priority: Math.min(nextPriority, 5),
    };
    updateAIKey(newSlot);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <h3 style={{ fontWeight: 600, fontSize: 15 }}>AI Review Keys</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Up to 5 keys. Tried in priority order with automatic failover.
          </p>
        </div>
        {keys.length < 5 && (
          <button className="btn btn-secondary btn-sm" onClick={addKey} style={{ gap: 5 }}>
            <Plus size={13} />
            Add Key
          </button>
        )}
      </div>

      {keys.length === 0 && (
        <div
          style={{
            padding: "24px",
            textAlign: "center",
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--border)",
          }}
        >
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 10 }}>
            No AI keys configured. Add a key to enable Growth Reviews.
          </p>
          <button className="btn btn-primary btn-sm" onClick={addKey} style={{ gap: 5 }}>
            <Plus size={13} />
            Add Your First Key
          </button>
        </div>
      )}

      {keys.map((slot) => (
        <KeySlotEditor
          key={slot.id}
          slot={slot}
          onSave={updateAIKey}
          onDelete={removeAIKey}
        />
      ))}

      <div
        style={{
          marginTop: 16,
          padding: "12px 14px",
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
        }}
      >
        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--text-secondary)" }}>Failover behavior:</strong>{" "}
          Keys are tried in priority order. HTTP 429/5xx → next key. HTTP 401/403 → key marked invalid, next tried. 
          Timeout → next key. All failed → friendly error shown.
        </p>
      </div>
    </div>
  );
}
