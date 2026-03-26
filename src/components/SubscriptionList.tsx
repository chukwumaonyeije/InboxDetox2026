"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

interface Subscription {
  id: string;
  senderName: string;
  senderEmail: string;
  senderDomain: string;
  emailCount: number;
  lastSeen: string;
  status: string;
  unsubscribeUrl: string | null;
  unsubscribeEmail: string | null;
  aiCategory: string | null;
}

interface Props {
  subscriptions: Subscription[];
  total: number;
  page: number;
  totalPages: number;
  q: string;
  sort: string;
  status: string;
  category: string;
}

export default function SubscriptionList({
  subscriptions,
  total,
  page,
  totalPages,
  q,
  sort,
  status,
  category,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionStates, setActionStates] = useState<Record<string, "loading" | "done" | "kept" | "error">>({});
  const [searchInput, setSearchInput] = useState(q);

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams({
      ...(q ? { q } : {}),
      sort,
      status,
      category,
      page: String(page),
      ...overrides,
    });
    // Remove defaults to keep URL clean
    if (params.get("page") === "1") params.delete("page");
    if (params.get("sort") === "count") params.delete("sort");
    if (params.get("status") === "all") params.delete("status");
    if (params.get("category") === "all") params.delete("category");
    if (!params.get("q")) params.delete("q");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function navigate(overrides: Record<string, string>) {
    startTransition(() => router.push(buildUrl(overrides)));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ q: searchInput, page: "1" });
  }

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === subscriptions.length
        ? new Set()
        : new Set(subscriptions.map((s) => s.id))
    );
  }, [subscriptions]);

  async function unsubscribeOne(id: string) {
    setActionStates((prev) => ({ ...prev, [id]: "loading" }));
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: id }),
      });
      if (!res.ok) throw new Error();
      setActionStates((prev) => ({ ...prev, [id]: "done" }));
      startTransition(() => router.refresh());
    } catch {
      setActionStates((prev) => ({ ...prev, [id]: "error" }));
    }
  }

  async function bulkUnsubscribe() {
    const ids = Array.from(selected);
    const updates: Record<string, "loading"> = {};
    ids.forEach((id) => (updates[id] = "loading"));
    setActionStates((prev) => ({ ...prev, ...updates }));
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionIds: ids }),
      });
      if (!res.ok) throw new Error();
      const doneUpdates: Record<string, "done"> = {};
      ids.forEach((id) => (doneUpdates[id] = "done"));
      setActionStates((prev) => ({ ...prev, ...doneUpdates }));
      setSelected(new Set());
      startTransition(() => router.refresh());
    } catch {
      const errUpdates: Record<string, "error"> = {};
      ids.forEach((id) => (errUpdates[id] = "error"));
      setActionStates((prev) => ({ ...prev, ...errUpdates }));
    }
  }

  async function keepOne(id: string) {
    setActionStates((prev) => ({ ...prev, [id]: "loading" }));
    try {
      const res = await fetch("/api/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: id, status: "kept" }),
      });
      if (!res.ok) throw new Error();
      setActionStates((prev) => ({ ...prev, [id]: "kept" }));
      startTransition(() => router.refresh());
    } catch {
      setActionStates((prev) => ({ ...prev, [id]: "error" }));
    }
  }

  async function bulkKeep() {
    const ids = Array.from(selected);
    const updates: Record<string, "loading"> = {};
    ids.forEach((id) => (updates[id] = "loading"));
    setActionStates((prev) => ({ ...prev, ...updates }));
    try {
      const res = await fetch("/api/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionIds: ids, status: "kept" }),
      });
      if (!res.ok) throw new Error();
      const keptUpdates: Record<string, "kept"> = {};
      ids.forEach((id) => (keptUpdates[id] = "kept"));
      setActionStates((prev) => ({ ...prev, ...keptUpdates }));
      setSelected(new Set());
      startTransition(() => router.refresh());
    } catch {
      const errUpdates: Record<string, "error"> = {};
      ids.forEach((id) => (errUpdates[id] = "error"));
      setActionStates((prev) => ({ ...prev, ...errUpdates }));
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const statusColors: Record<string, string> = {
    active: "var(--color-dwc-info)",
    unsubscribed: "var(--color-dwc-success)",
    kept: "var(--color-dwc-warning)",
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            className="input flex-1"
            placeholder="Search sender, email, or domain…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn-primary px-4">
            Search
          </button>
          {q && (
            <button
              type="button"
              className="btn-ghost px-3"
              onClick={() => {
                setSearchInput("");
                navigate({ q: "", page: "1" });
              }}
            >
              Clear
            </button>
          )}
        </form>

        {/* Sort */}
        <select
          className="input"
          value={sort}
          onChange={(e) => navigate({ sort: e.target.value, page: "1" })}
        >
          <option value="count">Most Emails</option>
          <option value="recent">Most Recent</option>
          <option value="alpha">A → Z</option>
        </select>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 mb-2">
        {["all", "active", "unsubscribed", "kept"].map((s) => (
          <button
            key={s}
            className={s === status ? "btn-primary px-4 py-1.5 text-sm" : "btn-ghost px-4 py-1.5 text-sm"}
            onClick={() => navigate({ status: s, page: "1" })}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-1 mb-4">
        {["all", "promotional", "newsletter", "transactional", "updates", "financial", "social", "other", "uncategorized"].map((c) => (
          <button
            key={c}
            className={c === category ? "btn-primary px-3 py-1 text-xs" : "btn-ghost px-3 py-1 text-xs"}
            onClick={() => navigate({ category: c, page: "1" })}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div
          className="flex items-center gap-4 mb-4 px-4 py-3 rounded-lg"
          style={{
            background: "color-mix(in srgb, var(--color-dwc-accent) 15%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-dwc-accent) 30%, transparent)",
          }}
        >
          <span style={{ color: "var(--color-dwc-text)" }} className="text-sm font-medium">
            {selected.size} selected
          </span>
          <button className="btn-danger text-sm px-3 py-1.5" onClick={bulkUnsubscribe}>
            Unsubscribe Selected
          </button>
          <button
            className="btn-ghost text-sm px-3 py-1.5"
            style={{ color: "var(--color-dwc-warning)" }}
            onClick={bulkKeep}
          >
            Keep Selected
          </button>
          <button
            className="btn-ghost text-sm px-3 py-1.5"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden" style={{ opacity: isPending ? 0.6 : 1 }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-dwc-border)" }}>
              <th className="px-4 py-3 text-left w-8">
                <input
                  type="checkbox"
                  checked={selected.size === subscriptions.length && subscriptions.length > 0}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th
                className="px-4 py-3 text-left font-medium"
                style={{ color: "var(--color-dwc-text-muted)" }}
              >
                Sender
              </th>
              <th
                className="px-4 py-3 text-left font-medium hidden md:table-cell"
                style={{ color: "var(--color-dwc-text-muted)" }}
              >
                Emails
              </th>
              <th
                className="px-4 py-3 text-left font-medium hidden lg:table-cell"
                style={{ color: "var(--color-dwc-text-muted)" }}
              >
                Last Seen
              </th>
              <th
                className="px-4 py-3 text-left font-medium"
                style={{ color: "var(--color-dwc-text-muted)" }}
              >
                Status
              </th>
              <th className="px-4 py-3 text-right font-medium" style={{ color: "var(--color-dwc-text-muted)" }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center"
                  style={{ color: "var(--color-dwc-text-muted)" }}
                >
                  No subscriptions found.
                </td>
              </tr>
            )}
            {subscriptions.map((sub) => {
              const state = actionStates[sub.id];
              return (
                <tr
                  key={sub.id}
                  style={{
                    borderBottom: "1px solid var(--color-dwc-border)",
                    background: selected.has(sub.id)
                      ? "color-mix(in srgb, var(--color-dwc-accent) 8%, transparent)"
                      : undefined,
                  }}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(sub.id)}
                      onChange={() => toggleSelect(sub.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="font-medium truncate max-w-[200px]"
                      style={{ color: "var(--color-dwc-text)" }}
                      title={sub.senderName}
                    >
                      {sub.senderName}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-xs truncate max-w-[160px]"
                        style={{ color: "var(--color-dwc-text-muted)" }}
                        title={sub.senderEmail}
                      >
                        {sub.senderEmail}
                      </span>
                      {sub.aiCategory && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-medium shrink-0"
                          style={{
                            color: "var(--color-dwc-accent-hover)",
                            background: "color-mix(in srgb, var(--color-dwc-accent) 15%, transparent)",
                          }}
                        >
                          {sub.aiCategory}
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    className="px-4 py-3 hidden md:table-cell font-mono"
                    style={{ color: "var(--color-dwc-accent)" }}
                  >
                    {sub.emailCount}
                  </td>
                  <td
                    className="px-4 py-3 hidden lg:table-cell"
                    style={{ color: "var(--color-dwc-text-muted)" }}
                  >
                    {formatDate(sub.lastSeen)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        color: statusColors[sub.status] || "var(--color-dwc-text-muted)",
                        background: `color-mix(in srgb, ${statusColors[sub.status] || "var(--color-dwc-text-muted)"} 15%, transparent)`,
                      }}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {state === "error" ? (
                      <span className="text-xs" style={{ color: "var(--color-dwc-danger)" }}>
                        Failed
                      </span>
                    ) : sub.status === "unsubscribed" || state === "done" ? (
                      <span className="text-xs" style={{ color: "var(--color-dwc-success)" }}>
                        ✓ Unsubscribed
                      </span>
                    ) : sub.status === "kept" || state === "kept" ? (
                      <span className="text-xs" style={{ color: "var(--color-dwc-warning)" }}>
                        ✓ Kept
                      </span>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button
                          className="btn-ghost text-xs px-3 py-1.5"
                          style={{ color: "var(--color-dwc-warning)" }}
                          disabled={state === "loading"}
                          onClick={() => keepOne(sub.id)}
                        >
                          Keep
                        </button>
                        <button
                          className="btn-danger text-xs px-3 py-1.5"
                          disabled={state === "loading"}
                          onClick={() => unsubscribeOne(sub.id)}
                        >
                          {state === "loading" ? "…" : "Unsubscribe"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm" style={{ color: "var(--color-dwc-text-muted)" }}>
            Page {page} of {totalPages} ({total} total)
          </span>
          <div className="flex gap-2">
            <button
              className="btn-ghost px-3 py-1.5 text-sm"
              disabled={page <= 1}
              onClick={() => navigate({ page: String(page - 1) })}
            >
              ← Prev
            </button>
            <button
              className="btn-ghost px-3 py-1.5 text-sm"
              disabled={page >= totalPages}
              onClick={() => navigate({ page: String(page + 1) })}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
