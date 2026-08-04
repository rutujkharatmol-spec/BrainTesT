import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, testId, rawScores, score, scoreSp, scoreSk, scoreSa, scoreDepression, scoreAnxiety, scoreStress } = body;

    if (!sessionId || !testId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 404 });
    }

    // Delete old answers for this test and session to allow retakes
    await prisma.answer.deleteMany({
      where: {
        sessionId,
        testName: testId
      }
    });

    // First save normalized answers
    const answersData = Object.entries(rawScores).map(([itemId, rawVal]) => {
      // Extract numeric index from id like "q1", "q12"
      const itemIndex = parseInt(itemId.replace('q', ''));
      return {
        sessionId,
        testName: testId,
        itemIndex: isNaN(itemIndex) ? 0 : itemIndex,
        rawScore: rawVal as number
      };
    });

    if (answersData.length > 0) {
      await prisma.answer.createMany({
        data: answersData
      });
    }

    // Now save to the specific model using upsert to allow retakes
    const commonData = {
      session: { connect: { id: sessionId } },
      rawScores: rawScores,
    };

    switch (testId) {
      case "cfs":
        await prisma.cFSSubmission.upsert({ where: { sessionId }, update: { rawScores, score }, create: { ...commonData, score } });
        break;
      case "gaene":
        await prisma.gAENESubmission.upsert({ where: { sessionId }, update: { rawScores, score }, create: { ...commonData, score } });
        break;
      case "mate":
        await prisma.mATESubmission.upsert({ where: { sessionId }, update: { rawScores, score }, create: { ...commonData, score } });
        break;
      case "sbs":
        await prisma.sBSSubmission.upsert({ where: { sessionId }, update: { rawScores, score }, create: { ...commonData, score } });
        break;
      case "skep":
        await prisma.sKEPSubmission.upsert({ where: { sessionId }, update: { rawScores, score }, create: { ...commonData, score } });
        break;
      case "tsis":
        await prisma.tSISSubmission.upsert({ where: { sessionId }, update: { rawScores, scoreSp, scoreSk, scoreSa }, create: { ...commonData, scoreSp, scoreSk, scoreSa } });
        break;
      case "ncs6":
        await prisma.nCS6Submission.upsert({ where: { sessionId }, update: { rawScores, score }, create: { ...commonData, score } });
        break;
      case "cfq":
        await prisma.cFQSubmission.upsert({ where: { sessionId }, update: { rawScores, score }, create: { ...commonData, score } });
        break;
      case "dass21":
        await prisma.dASS21Submission.upsert({ where: { sessionId }, update: { rawScores, scoreDepression, scoreAnxiety, scoreStress }, create: { ...commonData, scoreDepression, scoreAnxiety, scoreStress } });
        break;
      case "phq9":
        await prisma.pHQ9Submission.upsert({ where: { sessionId }, update: { rawScores, score }, create: { ...commonData, score } });
        break;
      case "gad7":
        await prisma.gAD7Submission.upsert({ where: { sessionId }, update: { rawScores, score }, create: { ...commonData, score } });
        break;
      case "who5":
        await prisma.wHO5Submission.upsert({ where: { sessionId }, update: { rawScores, score }, create: { ...commonData, score } });
        break;
      default:
        return NextResponse.json({ error: "Unknown test ID" }, { status: 400 });
    }

    // ==========================================
    // DESTINATION B: LIVE GOOGLE SHEETS PIPELINE
    // ==========================================
    const QUESTIONNAIRE_SHEET_WEBHOOK_URL = process.env.QUESTIONNAIRE_SHEET_WEBHOOK_URL;

    if (QUESTIONNAIRE_SHEET_WEBHOOK_URL) {
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
          testId: testId,
          score: score !== undefined ? score : "",
          scoreSp: scoreSp !== undefined ? scoreSp : "",
          scoreSk: scoreSk !== undefined ? scoreSk : "",
          scoreSa: scoreSa !== undefined ? scoreSa : "",
          scoreDepression: scoreDepression !== undefined ? scoreDepression : "",
          scoreAnxiety: scoreAnxiety !== undefined ? scoreAnxiety : "",
          scoreStress: scoreStress !== undefined ? scoreStress : "",
          rawScores: JSON.stringify(rawScores || {})
        };

        const response = await fetch(QUESTIONNAIRE_SHEET_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain", // Use text/plain to avoid CORS / preflight issues on Google
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const text = await response.text();
          console.error("Questionnaire Sheets Webhook Failed:", response.status, response.statusText, text);
        } else {
          console.log("Successfully pushed to Questionnaires Google Sheets Webhook!");
        }
      } catch (sheetsError) {
        console.error("Google Sheets Sync Failed, but saved locally:", sheetsError);
      }
    }

    // DESTINATION C: MASTER GOOGLE SHEETS PIPELINE
    // Trigger the consolidated sync script to update the master record for this session
    try {
      const { syncQuestionnairesToGoogleSheets } = await import('@/lib/googleSheetsSync');
      await syncQuestionnairesToGoogleSheets();
      console.log("Successfully pushed to Master Google Sheets (Sheet2) via Apps Script!");
    } catch (syncErr) {
      console.error("Master Google Sheets Questionnaire Sync Failed:", syncErr);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Submission Error:", error);
    // Prisma unique constraint violation code is P2002 (duplicate submission for this session)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: "You have already submitted this test." }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
