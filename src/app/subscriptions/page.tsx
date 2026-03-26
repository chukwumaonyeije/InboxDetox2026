import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SubscriptionList from "@/components/SubscriptionList";
import CategorizeButton from "@/components/CategorizeButton";

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    status?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function SubscriptionsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const userId = session.user.id;
  const params = await searchParams;

  const q = params.q?.trim() || "";
  const sort = params.sort || "count";
  const status = params.status || "all";
  const category = params.category || "all";
  const page = Math.max(1, parseInt(params.page || "1", 10));

  const where = {
    userId,
    ...(status !== "all" ? { status } : {}),
    ...(category !== "all" ? { aiCategory: category === "uncategorized" ? null : category } : {}),
    ...(q
      ? {
          OR: [
            { senderName: { contains: q, mode: "insensitive" as const } },
            { senderEmail: { contains: q, mode: "insensitive" as const } },
            { senderDomain: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === "recent"
      ? { lastSeen: "desc" as const }
      : sort === "alpha"
      ? { senderName: "asc" as const }
      : { emailCount: "desc" as const };

  const [subscriptions, total, uncategorizedCount] = await Promise.all([
    prisma.subscription.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.subscription.count({ where }),
    prisma.subscription.count({ where: { userId, aiCategory: null } }),
  ]);

  const totalCount = await prisma.subscription.count({ where: { userId } });
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-dwc-text)" }}
          >
            Subscriptions
          </h1>
          <p style={{ color: "var(--color-dwc-text-muted)" }} className="mt-1">
            {total} sender{total !== 1 ? "s" : ""} found
          </p>
        </div>
        <CategorizeButton uncategorizedCount={uncategorizedCount} totalCount={totalCount} />
      </div>

      <SubscriptionList
        subscriptions={subscriptions.map((s) => ({
          id: s.id,
          senderName: s.senderName ?? s.senderEmail,
          senderEmail: s.senderEmail,
          senderDomain: s.senderDomain,
          emailCount: s.emailCount,
          lastSeen: s.lastSeen.toISOString(),
          status: s.status,
          unsubscribeUrl: s.unsubscribeUrl,
          unsubscribeEmail: s.unsubscribeEmail,
          aiCategory: s.aiCategory,
        }))}
        total={total}
        page={page}
        totalPages={totalPages}
        q={q}
        sort={sort}
        status={status}
        category={category}
      />
    </div>
  );
}
