import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserFilters, updateUserFilters } from "@/lib/filters";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filters = await getUserFilters(session.user.id);
  return NextResponse.json({ data: filters });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const filters = await updateUserFilters(session.user.id, body);
  return NextResponse.json({ data: filters });
}
