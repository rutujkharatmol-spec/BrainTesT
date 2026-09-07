import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * The questionnaire ids that have a submission table. Checked up front because
 * the switch below only rejects an unknown id *after* the answer rows have
 * been replaced, which would clear a valid previous submission.
 */
const VALID_TEST_IDS = new Set([
  "cfs", "gaene", "mate", "sbs", "skep", "tsis",
  "ncs6", "cfq", "dass21", "phq9", "gad7", "who5",
]);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, testId, rawScores, score, scoreSp, scoreSk, scoreSa, scoreDepression, scoreAnxiety, scoreStress } = body;

    if (!sessionId || !testId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate the payload BEFORE touching stored data. This used to be read
    // only at the Object.entries call below -- after the participant's previous
    // answers had already been deleted -- so a malformed retake wiped the old
    // submission and then threw, saving nothing in its place.
    if (rawScores === null || typeof rawScores !== "object" || Array.isArray(rawScores)) {
      return NextResponse.json(
        { error: "rawScores must be an object of item id to score." },
        { status: 400 }
      );
    }

    if (!VALID_TEST_IDS.has(testId)) {
      return NextResponse.json({ error: "Unknown test ID" }, { status: 400 });
    }

    // Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

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

    // Replace the previous answers for this test in one transaction, so a
    // failure half way through cannot leave the participant with neither the
    // old submission nor the new one.
    await prisma.$transaction([
      prisma.answer.deleteMany({ where: { sessionId, testName: testId } }),
      prisma.answer.createMany({ data: answersData }),
    ]);

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
        // Unreachable: VALID_TEST_IDS is checked before any write.
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

    // NOTE: the full-table reconciliation sync (syncQuestionnairesToGoogleSheets)
    // used to run here, awaited, on every submission — reading every Session
    // with all 12 submission relations and re-POSTing the whole table. That is
    // O(N) per write. Reconciliation now happens only via the admin-triggered
    // /api/admin/sync-google-sheet button; the single-row webhook above keeps
    // the sheet live in the meantime.

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
