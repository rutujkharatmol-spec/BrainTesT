import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAdminSpreadsheetData } from "@/lib/adminData";

export async function GET() {
  const session = await getServerSession(authOptions);
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
