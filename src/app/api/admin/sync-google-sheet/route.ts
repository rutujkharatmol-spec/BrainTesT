import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { syncCognitiveToGoogleSheets, syncQuestionnairesToGoogleSheets } from "@/lib/googleSheetsSync";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const dataCognitive = await syncCognitiveToGoogleSheets();
    const dataQuestionnaires = await syncQuestionnairesToGoogleSheets();

    return NextResponse.json({ 
      message: `Successfully synced data to Google Sheets.` 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Google Sheets Sync Error:", error);
    return new NextResponse("Failed to sync to Google Sheets: " + error.message, { status: 500 });
  }
}
