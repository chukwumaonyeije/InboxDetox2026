import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInboxSummary } from "@/lib/claude";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);

  const [totalSubs, newSubs, unsubscribed, domainCounts, categoryCounts] =
    await Promise.all([
      prisma.subscription.count({ where: { userId } }),
      prisma.subscription.count({
        where: { userId, firstSeen: { gte: weekStart } },
      }),
      prisma.unsubscribeAction.count({
        where: { userId, status: "success", executedAt: { gte: weekStart } },
      }),
      prisma.subscription.groupBy({
        by: ["senderDomain"],
        where: { userId, status: "active" },
        _count: { senderDomain: true },
        orderBy: { _count: { senderDomain: "desc" } },
        take: 10,
      }),
      prisma.subscription.groupBy({
        by: ["aiCategory"],
        where: { userId, status: "active", aiCategory: { not: null } },
        _count: { aiCategory: true },
      }),
    ]);

  const topDomains = Object.fromEntries(
    domainCounts.map((d: { senderDomain: string; _count: { senderDomain: number } }) => [
      d.senderDomain,
      d._count.senderDomain,
    ])
  );
  const categoryBreakdown = Object.fromEntries(
    categoryCounts
      .filter((c: { aiCategory: string | null; _count: { aiCategory: number } }) => c.aiCategory)
      .map((c: { aiCategory: string | null; _count: { aiCategory: number } }) => [
        c.aiCategory!,
        c._count.aiCategory,
      ])
  );

  const aiNarrative = await generateInboxSummary({
    totalSubs,
    newSubs,
    unsubscribed,
    topDomains,
    categoryBreakdown,
  });

  const summary = await prisma.weeklySummary.upsert({
    where: { userId_weekStarting: { userId, weekStarting: weekStart } },
    update: { totalSubs, newSubs, unsubscribed, topDomains, categoryBreakdown, aiNarrative },
    create: {
      userId,
      weekStarting: weekStart,
      totalSubs,
      newSubs,
      unsubscribed,
      topDomains,
      categoryBreakdown,
      aiNarrative,
    },
  });

  return NextResponse.json({ data: summary });
}
