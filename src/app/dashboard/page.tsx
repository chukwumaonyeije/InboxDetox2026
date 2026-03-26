import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const userId = session.user.id;

  const [totalSubs, activeSubs, recentActions, latestSummary] = await Promise.all([
    prisma.subscription.count({ where: { userId } }),
    prisma.subscription.count({ where: { userId, status: "active" } }),
    prisma.unsubscribeAction.findMany({
      where: { userId },
      orderBy: { executedAt: "desc" },
      take: 10,
      include: { subscription: true },
    }),
    prisma.weeklySummary.findFirst({
      where: { userId },
      orderBy: { weekStarting: "desc" },
    }),
  ]);

  const unsubscribedCount = totalSubs - activeSubs;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-dwc-text)" }}
        >
          Inbox Dashboard
        </h1>
        <p style={{ color: "var(--color-dwc-text-muted)" }} className="mt-1">
          Welcome back, {session.user.name?.split(" ")[0]}.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Subscriptions", value: totalSubs },
          { label: "Active", value: activeSubs },
          { label: "Unsubscribed", value: unsubscribedCount },
          { label: "Actions This Week", value: recentActions.length },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <p
              className="text-sm mb-1"
              style={{ color: "var(--color-dwc-text-muted)" }}
            >
              {stat.label}
            </p>
            <p
              className="text-3xl font-bold"
              style={{ color: "var(--color-dwc-accent)" }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      {latestSummary && (
        <div className="card mb-6">
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--color-dwc-text)" }}
          >
            AI Weekly Summary
          </h2>
          <p style={{ color: "var(--color-dwc-text-muted)" }}>
            {latestSummary.aiNarrative}
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <a href="/subscriptions" className="btn-primary">
          View Subscriptions
        </a>
        <a href="/scan" className="btn-ghost">
          Scan Inbox
        </a>
        <a href="/history" className="btn-ghost">
          View History
        </a>
        <a href="/settings" className="btn-ghost">
          Settings
        </a>
      </div>
    </div>
  );
}
