import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { APPS_SCRIPT_WEBAPP_URL } = process.env;

  if (!APPS_SCRIPT_WEBAPP_URL) {
    return new NextResponse("Missing APPS_SCRIPT_WEBAPP_URL in .env", { status: 500 });
  }

  try {
    // Fetch cognitive data
    const results = await prisma.cognitiveTestResult.findMany({
      orderBy: { createdAt: "asc" }, // Append oldest first
      include: {
        session: true
      }
    });

    const groupedData: Record<string, any> = {};
    
    results.forEach((r) => {
      if (!groupedData[r.sessionId]) {
        groupedData[r.sessionId] = {
          sessionId: r.sessionId,
          idNumber: r.session?.participantIdNumber || "N/A",
          name: r.session?.participantName || "N/A",
          createdAt: r.session?.createdAt || r.createdAt
        };
      }
      
      const g = groupedData[r.sessionId];
      
      switch (r.specificTest) {
        case "Stroop Task":
          g.stroopCongruent = r.param1Value;
          g.stroopIncongruent = r.param2Value;
          g.stroopEffect = r.param3Value;
          break;
        case "SART (Basic)":
          g.sartRt = r.param1Value;
          g.sartCommission = r.param2Value;
          g.sartOmission = r.param3Value;
          break;
        case "Dot Probe Task":
          g.dotProbeCongruent = r.param1Value;
          g.dotProbeIncongruent = r.param2Value;
          g.dotProbeBias = r.param3Value;
          break;
        case "2-Back Task":
          g.nbackHit = r.param1Value;
          g.nbackFalseAlarm = r.param2Value;
          g.nbackDprime = r.param3Value;
          break;
        case "Corsi Block Task":
          g.corsiForward = r.param1Value;
          g.corsiBackward = r.param2Value;
          break;
        case "Digit Span Task":
          g.digitSpanMax = r.param1Value;
          break;
        case "Lexical Decision Task":
          g.ldtWord = r.param1Value;
          g.ldtNonWord = r.param2Value;
          g.ldtAccuracy = r.param3Value;
          break;
        case "Negative Priming Task":
          g.npControl = r.param1Value;
          g.npPrimed = r.param2Value;
          g.npEffect = r.param3Value;
          break;
      }
    });

    // Formatting rows for Google Sheets to match the Excel format exactly
    const rows = Object.values(groupedData).map((g: any) => [
      g.idNumber,
      g.name,
      g.stroopCongruent ?? "",
      g.stroopIncongruent ?? "",
      g.stroopEffect ?? "",
      g.sartRt ?? "",
      g.sartCommission ?? "",
      g.sartOmission ?? "",
      g.dotProbeCongruent ?? "",
      g.dotProbeIncongruent ?? "",
      g.dotProbeBias ?? "",
      g.nbackHit ?? "",
      g.nbackFalseAlarm ?? "",
      g.nbackDprime ?? "",
      g.corsiForward ?? "",
      g.corsiBackward ?? "",
      g.digitSpanMax ?? "",
      g.ldtWord ?? "",
      g.ldtNonWord ?? "",
      g.ldtAccuracy ?? "",
      g.npControl ?? "",
      g.npPrimed ?? "",
      g.npEffect ?? "",
      g.sessionId, // Keep sessionId in column X for deduplication
      new Date(g.createdAt).toISOString() // Date in column Y
    ]);

    // Send payload to Apps Script
    const response = await fetch(APPS_SCRIPT_WEBAPP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain", // Apps Script doPost often prefers text/plain to avoid CORS preflight issues
      },
      body: JSON.stringify({ rows }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Apps Script responded with ${response.status}: ${text}`);
    }

    const data = await response.json().catch(() => ({}));

    return NextResponse.json({ 
      message: data.message || `Successfully synced data to Google Sheets.` 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Google Sheets Sync Error:", error);
    return new NextResponse("Failed to sync to Google Sheets: " + error.message, { status: 500 });
  }
}
