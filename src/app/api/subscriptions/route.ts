import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { subscriptionId, subscriptionIds, status } = body;

  if (!status || !["kept", "active"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const ids: string[] = subscriptionIds ?? (subscriptionId ? [subscriptionId] : []);
  if (ids.length === 0) {
    return NextResponse.json({ error: "subscriptionId or subscriptionIds required" }, { status: 400 });
  }

  await prisma.subscription.updateMany({
    where: { id: { in: ids }, userId: session.user.id },
    data: { status },
  });

  return NextResponse.json({ data: { updated: ids.length } });
}
