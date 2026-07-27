import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, testId, rawScores, score, scoreSp, scoreSk, scoreSa } = body;

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

    // Now save to the specific model
    const commonData = {
      session: { connect: { id: sessionId } },
      rawScores: rawScores,
    };

    switch (testId) {
      case "cfs":
        await prisma.cFSSubmission.create({ data: { ...commonData, score } });
        break;
      case "gaene":
        await prisma.gAENESubmission.create({ data: { ...commonData, score } });
        break;
      case "mate":
        await prisma.mATESubmission.create({ data: { ...commonData, score } });
        break;
      case "sbs":
        await prisma.sBSSubmission.create({ data: { ...commonData, score } });
        break;
      case "skep":
        await prisma.sKEPSubmission.create({ data: { ...commonData, score } });
        break;
      case "tsis":
        await prisma.tSISSubmission.create({ data: { ...commonData, scoreSp, scoreSk, scoreSa } });
        break;
      case "ncs6":
        await prisma.nCS6Submission.create({ data: { ...commonData, score } });
        break;
      case "cfq":
        await prisma.cFQSubmission.create({ data: { ...commonData, score } });
        break;
      default:
        return NextResponse.json({ error: "Unknown test ID" }, { status: 400 });
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
