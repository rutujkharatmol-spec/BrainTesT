import { NextResponse } from "next/server";
import { verifyAdminSession, ADMIN_PASSWORD } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await verifyAdminSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.json({ message: `Admin system active with password ${ADMIN_PASSWORD}` });
}
