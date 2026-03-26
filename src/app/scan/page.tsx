"use client";

import { useState } from "react";

interface ScanResult {
  scanId: string;
  emailsScanned: number;
  subsFound: number;
}

export default function ScanPage() {
  const [scanning, setScanning] = useState<"gmail" | "outlook" | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function triggerScan(provider: "gmail" | "outlook") {
    setScanning(provider);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(`/api/scan/${provider}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Scan failed");
      setResult(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setScanning(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-1"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-dwc-text)" }}
        >
          Scan Inbox
        </h1>
        <p style={{ color: "var(--color-dwc-text-muted)" }}>
          Detect subscription emails across your connected accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gmail */}
        <div className="card">
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--color-dwc-text)" }}
          >
            Gmail
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-dwc-text-muted)" }}>
            Scans up to 500 emails using Gmail API.
          </p>
          <button
            className="btn-primary"
            onClick={() => triggerScan("gmail")}
            disabled={scanning !== null}
          >
            {scanning === "gmail" ? "Scanning..." : "Scan Gmail"}
          </button>
        </div>

        {/* Outlook */}
        <div className="card">
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--color-dwc-text)" }}
          >
            Outlook
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-dwc-text-muted)" }}>
            Scans up to 500 emails via Microsoft Graph API.
          </p>
          <button
            className="btn-ghost"
            onClick={() => triggerScan("outlook")}
            disabled={scanning !== null}
          >
            {scanning === "outlook" ? "Scanning..." : "Scan Outlook"}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div
          className="card mt-6"
          style={{ borderColor: "var(--color-dwc-accent)" }}
        >
          <p
            className="font-semibold mb-1"
            style={{ color: "var(--color-dwc-text)" }}
          >
            Scan complete
          </p>
          <p style={{ color: "var(--color-dwc-text-muted)" }}>
            Scanned <strong>{result.emailsScanned}</strong> emails — found{" "}
            <strong>{result.subsFound}</strong> unique senders.
          </p>
          <a href="/dashboard" className="btn-primary mt-4 inline-flex">
            View Dashboard
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card mt-6" style={{ borderColor: "var(--color-dwc-danger)" }}>
          <p style={{ color: "var(--color-dwc-danger)" }}>{error}</p>
        </div>
      )}
    </div>
  );
}
