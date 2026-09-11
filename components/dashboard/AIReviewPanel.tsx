"use client";

import React, { useState, useCallback } from "react";
import { Sparkles, ChevronDown, ChevronUp, AlertCircle, RefreshCw, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { AIReview } from "@/lib/types";

interface ReviewSectionProps {
  title: string;
  content: string;
  color?: string;
}

function ReviewSection({ title, content, color = "var(--accent)" }: ReviewSectionProps) {
  if (!content) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: 3,
            height: 14,
            background: color,
            borderRadius: 99,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {title}
        </span>
      </div>
      <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.7 }}>
        {content}
      </p>
    </div>
  );
}

export function AIReviewPanel() {
  const { sections, entries, goals, goalEntries, settings, timeline, updateAIKey } = useApp();
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<AIReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const enabledKeys = settings.ai.keys.filter(
    (k) => k.enabled && k.status !== "disabled" && k.status !== "invalid"
  );

  const triggerReview = useCallback(async () => {
    if (enabledKeys.length === 0) {
      setError("No AI keys configured. Add a key in Settings → AI Review.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dateRange = {
        start: timeline.startDate,
        end: timeline.endDate,
      };

      const response = await fetch("/api/ai-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keys: enabledKeys,
          sections,
          entries,
          dateRange,
          goals,
          goalEntries,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Review failed");
      }

      // Update key statuses
      if (data.keyStatusUpdates) {
        for (const update of data.keyStatusUpdates) {
          const key = settings.ai.keys.find((k) => k.id === update.id);
          if (key) {
            updateAIKey({ ...key, status: update.status, lastError: update.lastError });
          }
        }
      }

      setReview(data.review);
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [enabledKeys, sections, entries, goals, goalEntries, timeline, settings.ai.keys, updateAIKey]);

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: review || error ? "1px solid var(--border)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              background: "var(--accent-subtle)",
              border: "1px solid rgba(108,99,255,0.3)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={14} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>AI Growth Review</div>
            {review && (
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {new Date(review.generatedAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {review && (
            <button
              className="btn btn-ghost btn-sm btn-icon"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <button
            id="ai-review-btn"
            className="btn btn-primary btn-sm"
            onClick={triggerReview}
            disabled={loading}
            style={{ gap: 6 }}
          >
            {loading ? (
              <>
                <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles size={13} />
                {review ? "Refresh Review" : "Review My Growth"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            padding: "14px 20px",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            color: "var(--red)",
            fontSize: 13,
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 500, marginBottom: 2 }}>Review failed</div>
            <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>{error}</div>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => setError(null)}
            style={{ marginLeft: "auto" }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* No keys */}
      {!loading && !error && !review && enabledKeys.length === 0 && (
        <div style={{ padding: "16px 20px", color: "var(--text-muted)", fontSize: 13 }}>
          Configure an AI key in Settings to enable growth reviews.
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ padding: 20 }}>
          {[100, 80, 90, 70].map((w, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 12, width: `${w}%`, marginBottom: 8 }}
            />
          ))}
        </div>
      )}

      {/* Review content */}
      {review && expanded && (
        <div style={{ padding: 20 }}>
          <ReviewSection title="Overall Assessment" content={review.overall} color="var(--accent)" />
          <ReviewSection title="What Improved" content={review.improved} color="var(--green)" />
          <ReviewSection title="What Declined" content={review.declined} color="var(--red)" />
          <ReviewSection title="Patterns" content={review.patterns} color="var(--amber)" />
          <ReviewSection title="Recommendations" content={review.recommendations} color="#3b82f6" />
          <ReviewSection title="Things to Watch" content={review.watchOut} color="#ec4899" />
        </div>
      )}
    </div>
  );
}
