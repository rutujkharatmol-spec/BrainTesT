import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
