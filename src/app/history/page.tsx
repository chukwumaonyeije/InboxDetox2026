import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const userId = session.user.id;

  const [scans, actions] = await Promise.all([
    prisma.emailScan.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 10,
    }),
    prisma.unsubscribeAction.findMany({
      where: { userId },
      orderBy: { executedAt: "desc" },
      take: 100,
      include: { subscription: true },
    }),
  ]);

  const successCount = actions.filter((a) => a.status === "success").length;
  const failCount = actions.filter((a) => a.status === "failed").length;

  function formatDate(date: Date) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
      {/* Header */}
      <div>
        <h1
          className="text-3xl font-bold mb-1"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-dwc-text)" }}
        >
          History
        </h1>
        <p style={{ color: "var(--color-dwc-text-muted)" }}>
          Audit log of scans and unsubscribe actions.
        </p>
      </div>

      {/* Stats row */}
      {actions.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Actions", value: actions.length },
            { label: "Successful", value: successCount, color: "var(--color-dwc-success)" },
            { label: "Failed", value: failCount, color: "var(--color-dwc-danger)" },
          ].map((s) => (
            <div key={s.label} className="card">
              <p className="text-sm mb-1" style={{ color: "var(--color-dwc-text-muted)" }}>
                {s.label}
              </p>
              <p
                className="text-3xl font-bold"
                style={{ color: s.color ?? "var(--color-dwc-accent)" }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Scan History */}
      <section>
        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: "var(--color-dwc-text)" }}
        >
          Scan History
        </h2>
        {scans.length === 0 ? (
          <div className="card text-center py-8">
            <p style={{ color: "var(--color-dwc-text-muted)" }}>
              No scans yet.{" "}
              <a href="/scan" style={{ color: "var(--color-dwc-accent)" }}>
                Run your first scan
              </a>
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-dwc-border)" }}>
                  {["Provider", "Emails Scanned", "Senders Found", "Status", "Date"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium"
                      style={{ color: "var(--color-dwc-text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scans.map((scan) => (
                  <tr
                    key={scan.id}
                    style={{ borderBottom: "1px solid var(--color-dwc-border)" }}
                  >
                    <td className="px-4 py-3 capitalize" style={{ color: "var(--color-dwc-text)" }}>
                      {scan.provider}
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ color: "var(--color-dwc-accent)" }}>
                      {scan.emailsScanned.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ color: "var(--color-dwc-accent)" }}>
                      {scan.subsFound}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          color:
                            scan.status === "completed"
                              ? "var(--color-dwc-success)"
                              : scan.status === "running"
                              ? "var(--color-dwc-warning)"
                              : "var(--color-dwc-danger)",
                          background:
                            scan.status === "completed"
                              ? "color-mix(in srgb, var(--color-dwc-success) 15%, transparent)"
                              : scan.status === "running"
                              ? "color-mix(in srgb, var(--color-dwc-warning) 15%, transparent)"
                              : "color-mix(in srgb, var(--color-dwc-danger) 15%, transparent)",
                        }}
                      >
                        {scan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--color-dwc-text-muted)" }}>
                      {formatDate(scan.startedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Unsubscribe Actions */}
      <section>
        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: "var(--color-dwc-text)" }}
        >
          Unsubscribe Actions
        </h2>
        {actions.length === 0 ? (
          <div className="card text-center py-8">
            <p style={{ color: "var(--color-dwc-text-muted)" }}>
              No unsubscribe actions yet. Go to{" "}
              <a href="/subscriptions" style={{ color: "var(--color-dwc-accent)" }}>
                Subscriptions
              </a>{" "}
              to start unsubscribing.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-dwc-border)" }}>
                  {["Sender", "Method", "Status", "Date"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium"
                      style={{ color: "var(--color-dwc-text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actions.map((action) => (
                  <tr
                    key={action.id}
                    style={{ borderBottom: "1px solid var(--color-dwc-border)" }}
                  >
                    <td className="px-4 py-3">
                      <div style={{ color: "var(--color-dwc-text)" }} className="font-medium truncate max-w-[240px]">
                        {action.subscription.senderName || action.subscription.senderEmail}
                      </div>
                      <div className="text-xs truncate max-w-[240px]" style={{ color: "var(--color-dwc-text-muted)" }}>
                        {action.subscription.senderEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize" style={{ color: "var(--color-dwc-text-muted)" }}>
                      {action.method}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          color:
                            action.status === "success"
                              ? "var(--color-dwc-success)"
                              : action.status === "pending"
                              ? "var(--color-dwc-warning)"
                              : "var(--color-dwc-danger)",
                          background:
                            action.status === "success"
                              ? "color-mix(in srgb, var(--color-dwc-success) 15%, transparent)"
                              : action.status === "pending"
                              ? "color-mix(in srgb, var(--color-dwc-warning) 15%, transparent)"
                              : "color-mix(in srgb, var(--color-dwc-danger) 15%, transparent)",
                        }}
                      >
                        {action.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--color-dwc-text-muted)" }}>
                      {formatDate(action.executedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
