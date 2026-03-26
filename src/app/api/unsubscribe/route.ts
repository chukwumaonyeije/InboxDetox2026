import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { bulkUnsubscribe, executeUnsubscribe } from "@/lib/unsubscribe";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { subscriptionId, subscriptionIds } = body;

  if (subscriptionIds && Array.isArray(subscriptionIds)) {
    const results = await bulkUnsubscribe(session.user.id, subscriptionIds);
    return NextResponse.json({ data: results });
  }

  if (subscriptionId) {
    const result = await executeUnsubscribe(session.user.id, subscriptionId);
    return NextResponse.json({ data: result });
  }

  return NextResponse.json(
    { error: "subscriptionId or subscriptionIds required" },
    { status: 400 }
  );
}
