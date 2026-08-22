import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { getAdminSpreadsheetData } from "@/lib/adminData";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await verifyAdminSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const data = await getAdminSpreadsheetData();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching admin sheet data:", error);
    return new NextResponse("Internal Server Error: " + error.message, { status: 500 });
  }
}
