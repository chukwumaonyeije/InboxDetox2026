"use client";

import { useState } from "react";

interface Props {
  initial: {
    blockedDomains: string[];
    blockedKeywords: string[];
    maxAgeDays: number | null;
    unreadOnly: boolean;
    autoCategories: string[];
  };
}

const ALL_CATEGORIES = [
  "promotional",
  "newsletter",
  "transactional",
  "updates",
  "financial",
  "social",
  "other",
];

export default function SettingsForm({ initial }: Props) {
  const [domains, setDomains] = useState(initial.blockedDomains.join(", "));
  const [keywords, setKeywords] = useState(initial.blockedKeywords.join(", "));
  const [maxAge, setMaxAge] = useState<string>(initial.maxAgeDays?.toString() ?? "");
  const [unreadOnly, setUnreadOnly] = useState(initial.unreadOnly);
  const [autoCategories, setAutoCategories] = useState<string[]>(initial.autoCategories);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function toggleCategory(cat: string) {
    setAutoCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function parseList(val: string): string[] {
    return val
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockedDomains: parseList(domains),
          blockedKeywords: parseList(keywords),
          maxAgeDays: maxAge ? parseInt(maxAge, 10) : null,
          unreadOnly,
          autoCategories,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Blocked Domains */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-dwc-text)" }}>
          Blocked Domains
        </label>
        <p className="text-xs mb-2" style={{ color: "var(--color-dwc-text-muted)" }}>
          Senders from these domains will be excluded from scan results. Comma-separated.
        </p>
        <input
          type="text"
          className="input w-full"
          placeholder="e.g. github.com, google.com"
          value={domains}
          onChange={(e) => setDomains(e.target.value)}
        />
      </div>

      {/* Blocked Keywords */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-dwc-text)" }}>
          Blocked Keywords
        </label>
        <p className="text-xs mb-2" style={{ color: "var(--color-dwc-text-muted)" }}>
          Senders whose name or subject matches these keywords will be excluded. Comma-separated.
        </p>
        <input
          type="text"
          className="input w-full"
          placeholder="e.g. receipt, invoice, alert"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
      </div>

      {/* Max Age */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-dwc-text)" }}>
          Ignore Emails Older Than (days)
        </label>
        <p className="text-xs mb-2" style={{ color: "var(--color-dwc-text-muted)" }}>
          Leave blank to include all emails regardless of age.
        </p>
        <input
          type="number"
          className="input w-32"
          placeholder="e.g. 365"
          min={1}
          value={maxAge}
          onChange={(e) => setMaxAge(e.target.value)}
        />
      </div>

      {/* Unread Only */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--color-dwc-text)" }}>
            Unread Only
          </p>
          <p className="text-xs" style={{ color: "var(--color-dwc-text-muted)" }}>
            Only show subscription emails that are unread.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUnreadOnly((v) => !v)}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
          style={{
            background: unreadOnly ? "var(--color-dwc-accent)" : "var(--color-dwc-border)",
          }}
        >
          <span
            className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
            style={{ transform: unreadOnly ? "translateX(22px)" : "translateX(4px)" }}
          />
        </button>
      </div>

      {/* Auto-categorize Categories */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-dwc-text)" }}>
          Auto-Categorize These Types
        </label>
        <p className="text-xs mb-3" style={{ color: "var(--color-dwc-text-muted)" }}>
          Senders in selected categories will be automatically flagged for unsubscribe suggestions.
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((cat) => {
            const active = autoCategories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={active ? "btn-primary px-3 py-1.5 text-sm" : "btn-ghost px-3 py-1.5 text-sm"}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4 pt-2">
        <button
          className="btn-primary px-6"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
        {saved && (
          <span className="text-sm" style={{ color: "var(--color-dwc-success)" }}>
            ✓ Saved
          </span>
        )}
        {error && (
          <span className="text-sm" style={{ color: "var(--color-dwc-danger)" }}>
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
