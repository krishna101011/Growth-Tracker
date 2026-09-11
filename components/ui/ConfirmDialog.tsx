"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog } from "./Dialog";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} width={400}>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {danger && (
          <AlertTriangle
            size={20}
            style={{ color: "var(--red)", flexShrink: 0, marginTop: 2 }}
          />
        )}
        <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>
          {message}
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
          onClick={() => {
            onConfirm();
            onClose();
          }}
          style={danger ? { background: "var(--red)", color: "white", border: "none" } : {}}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
