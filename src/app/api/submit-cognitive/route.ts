import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      sessionId, 
      testCategory, 
      specificTest, 
      param1Name, param1Value,
      param2Name, param2Value,
      param3Name, param3Value,
      rawTrialData 
    } = body;

    if (!sessionId || !testCategory || !specificTest) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    // Delete old results for this test and session to allow retakes
    await prisma.cognitiveTestResult.deleteMany({
      where: {
        sessionId,
        specificTest
      }
    });

    const result = await prisma.cognitiveTestResult.create({
      data: {
        sessionId,
        testCategory,
        specificTest,
        param1Name,
        param1Value,
        param2Name,
        param2Value,
        param3Name,
        param3Value,
        rawTrialData
      }
    });

    // ==========================================
    // DESTINATION B: LIVE GOOGLE SHEETS PIPELINE
    // ==========================================
    const GOOGLE_SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL;

    if (GOOGLE_SHEET_WEBHOOK_URL) {
      try {
        const payload = {
          idNumber: session.participantIdNumber || "N/A",
          name: session.participantName || "N/A",
          age: session.age !== null ? session.age : "",
          gender: session.gender || "N/A",
          studentClass: session.studentClass || "N/A",
          schoolName: session.schoolName || "N/A",
          address: session.address || "N/A",
          phoneNo: session.phoneNo || "N/A",
          testCategory: testCategory,
          specificTest: specificTest,
          param1: param1Value !== null ? param1Value : "",
          param2: param2Value !== null ? param2Value : "",
          param3: param3Value !== null ? param3Value : ""
        };

        const response = await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain",
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          console.error("Google Sheets Webhook Failed:", response.statusText);
        } else {
          console.log("Successfully pushed to Google Sheets Webhook!");
        }
      } catch (sheetsError) {
        console.error("Google Sheets Sync Failed, but saved locally:", sheetsError);
      }
    }

    // DESTINATION C: MASTER GOOGLE SHEETS PIPELINE
    // Trigger the consolidated sync script to update the master record for this session
    try {
      const { syncCognitiveToGoogleSheets } = await import('@/lib/googleSheetsSync');
      await syncCognitiveToGoogleSheets();
      console.log("Successfully pushed to Master Google Sheets via Apps Script!");
    } catch (syncErr) {
      console.error("Master Google Sheets Sync Failed:", syncErr);
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    console.error("Cognitive Submission Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
