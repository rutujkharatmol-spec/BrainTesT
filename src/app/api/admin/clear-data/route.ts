import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await verifyAdminSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await prisma.session.deleteMany({});
    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${result.count} sessions and all associated data.` 
    });
  } catch (error: any) {
    console.error("Clear Data Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
