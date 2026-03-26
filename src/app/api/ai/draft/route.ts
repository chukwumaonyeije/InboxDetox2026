import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { draftUnsubscribeEmail } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subscriptionId } = await req.json();

  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId: session.user.id },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  const draft = await draftUnsubscribeEmail(
    subscription.senderEmail,
    subscription.senderName ?? subscription.senderEmail,
    session.user.email ?? ""
  );

  return NextResponse.json({ data: { draft } });
}
