import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorizeEmail } from "@/lib/claude";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Categorize all uncategorized subscriptions for this user
  const uncategorized = await prisma.subscription.findMany({
    where: { userId: session.user.id, aiCategory: null, status: "active" },
    take: 50,
  });

  const results = [];
  for (const sub of uncategorized) {
    const result = await categorizeEmail(
      sub.senderEmail,
      sub.senderName ?? sub.senderEmail,
      sub.subjectSample ?? ""
    );

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        aiCategory: result.category,
        aiConfidence: result.confidence,
      },
    });

    results.push({ id: sub.id, ...result });
  }

  return NextResponse.json({ data: results, count: results.length });
}
