"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  uncategorizedCount: number;
  totalCount: number;
}

export default function CategorizeButton({ uncategorizedCount, totalCount }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState("");

  const categorized = totalCount - uncategorizedCount;

  async function runCategorization() {
    setRunning(true);
    setError("");
    setDone(0);

    let processed = 0;
    try {
      while (true) {
        const res = await fetch("/api/ai/categorize", { method: "POST" });
        if (!res.ok) throw new Error("API error");
        const json = await res.json();
        const count: number = json.data?.length ?? 0;
        processed += count;
        setDone(processed);
        if (count < 50) break; // last batch
      }
      startTransition(() => router.refresh());
    } catch {
      setError("Categorization failed. Try again.");
    } finally {
      setRunning(false);
    }
  }

  if (uncategorizedCount === 0) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-dwc-success)" }}>
        <span>✓</span>
        <span>All {totalCount} senders categorized by AI</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {!running ? (
        <button className="btn-primary px-4 py-2 text-sm" onClick={runCategorization}>
          Categorize with AI
          <span
            className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
            style={{
              background: "color-mix(in srgb, var(--color-dwc-accent-hover) 30%, transparent)",
            }}
          >
            {uncategorizedCount} pending
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <div
            className="w-40 h-2 rounded-full overflow-hidden"
            style={{ background: "var(--color-dwc-border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.round(((categorized + done) / totalCount) * 100)}%`,
                background: "var(--color-dwc-accent)",
              }}
            />
          </div>
          <span className="text-sm" style={{ color: "var(--color-dwc-text-muted)" }}>
            {categorized + done} / {totalCount}
          </span>
        </div>
      )}

      {!running && categorized > 0 && (
        <span className="text-sm" style={{ color: "var(--color-dwc-text-muted)" }}>
          {categorized} / {totalCount} already categorized
        </span>
      )}

      {error && (
        <span className="text-sm" style={{ color: "var(--color-dwc-danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
