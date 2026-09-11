"use client";

import React, { useState } from "react";
import { Download, Upload, Trash2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function DataManagement() {
  const { exportJSON, importJSON, clearData, sections, entries } = useApp();
  const [clearConfirm, setClearConfirm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(false);
    try {
      await importJSON(file);
      setImportSuccess(true);
    } catch (err) {
      setImportError(
        err instanceof Error
          ? err.message
          : "Failed to import file. Make sure it's a valid Growth Graph backup."
      );
    }
    // Reset file input
    e.target.value = "";
  };

  return (
    <div>
      <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Data Management</h3>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
        {sections.length} sections · {entries.length} score entries stored locally in your browser.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Export */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>Export Data</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Download all sections, scores, and settings as a JSON file.
            </div>
          </div>
          <button
            id="export-btn"
            className="btn btn-secondary"
            onClick={exportJSON}
            style={{ gap: 6, flexShrink: 0 }}
          >
            <Download size={14} />
            Export JSON
          </button>
        </div>

        {/* Import */}
        <div
          style={{
            padding: "14px 16px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: 14 }}>Import Backup</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Restore from a previously exported JSON file.
              </div>
            </div>
            <label
              id="import-btn"
              className="btn btn-secondary"
              style={{ gap: 6, flexShrink: 0, cursor: "pointer" }}
            >
              <Upload size={14} />
              Import JSON
              <input
                type="file"
                accept=".json,application/json"
                style={{ display: "none" }}
                onChange={handleImport}
              />
            </label>
          </div>

          {importError && (
            <div
              style={{
                padding: "8px 12px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "var(--radius-sm)",
                fontSize: 12,
                color: "var(--red)",
              }}
            >
              {importError}
            </div>
          )}
          {importSuccess && (
            <div
              style={{
                padding: "8px 12px",
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: "var(--radius-sm)",
                fontSize: 12,
                color: "var(--green)",
              }}
            >
              Import successful! Your data has been restored.
            </div>
          )}
        </div>

        {/* Clear all */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            background: "rgba(239,68,68,0.05)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div>
            <div style={{ fontWeight: 500, fontSize: 14, color: "var(--red)" }}>Clear All Data</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Permanently delete all sections, scores, and settings.
            </div>
          </div>
          <button
            id="clear-data-btn"
            className="btn btn-danger"
            onClick={() => setClearConfirm(true)}
            style={{ gap: 6, flexShrink: 0 }}
          >
            <Trash2 size={14} />
            Clear All
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={clearConfirm}
        onClose={() => setClearConfirm(false)}
        onConfirm={clearData}
        title="Clear All Data"
        message="This will permanently delete all your sections, score history, and settings. This action cannot be undone. Export your data first if you want a backup."
        confirmLabel="Delete Everything"
        danger
      />
    </div>
  );
}
