import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { checkRateLimit, resetRateLimit, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const TEST_PATH_MAP: Record<string, string> = {
  "Stroop Task": "/cognitive/stroop",
  "2-Back Task": "/cognitive/nback",
  "Corsi Block Task": "/cognitive/corsi",
  "Digit Span Task": "/cognitive/digitspan",
  "SART (Basic)": "/cognitive/sart",
  "SART": "/cognitive/sart",
  "Dot Probe Task": "/cognitive/dotprobe",
  "Eriksen Flanker Task": "/cognitive/flanker",
  "Lexical Decision Task": "/cognitive/ldt",
  "Negative Priming Task": "/cognitive/negative-priming",
  "Negative Priming": "/cognitive/negative-priming",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, passcode } = body;

    if (!identifier?.trim()) {
      return NextResponse.json({ error: "Please enter your Aadhaar Card Number or Phone Number." }, { status: 400 });
    }
    if (!passcode?.trim()) {
      return NextResponse.json({ error: "Please enter your passcode." }, { status: 400 });
    }

    const cleanId = identifier.trim().replace(/[\s-]/g, "");

    // Aadhaar / ID numbers are throttled per IP+identifier to prevent enumeration.
    const rateKey = `participant-signin:${clientIp(req)}:${cleanId}`;
    const limit = checkRateLimit(rateKey, { limit: 8, windowMs: 15 * 60_000, blockMs: 10 * 60_000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Please try again in ${Math.ceil(limit.retryAfter / 60)} minute(s).` },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    // Look up participant by Aadhaar Number or Phone Number using raw SQL
    const sessions: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Session" WHERE "participantIdNumber" = $1 OR "phoneNo" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
      cleanId
    );

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ 
        error: "No account found matching this Aadhaar Card Number or Phone Number. Please sign up." 
      }, { status: 404 });
    }

    const session = sessions[0];

    // A record with no passcode used to accept ANY passcode and then claim the
    // account permanently. Combined with publicly-creatable passcode-less
    // sessions that was an account-takeover path, so such records are now
    // refused and must be resolved by a coordinator instead.
    if (!session.passcode) {
      return NextResponse.json({
        error: "This record has no passcode set and cannot be accessed directly. Please contact the study coordinator.",
      }, { status: 403 });
    }

    let isMatch = false;
    if (session.passcode.startsWith("$2a$") || session.passcode.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(passcode.trim(), session.passcode);
    } else {
      // Legacy plaintext passcode: verify, then transparently upgrade to bcrypt.
      isMatch = session.passcode === passcode.trim();
      if (isMatch) {
        const hashed = await bcrypt.hash(passcode.trim(), 10);
        await prisma.$executeRawUnsafe(
          `UPDATE "Session" SET "passcode" = $1 WHERE "id" = $2`,
          hashed,
          session.id
        );
      }
    }

    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect passcode. Please check and try again." }, { status: 401 });
    }

    resetRateLimit(rateKey);

    // Completed cognitive tests AND questionnaires. Questionnaires used to be
    // omitted, and the client replaces completedTests wholesale on login, so a
    // returning participant was told to redo every questionnaire.
    const [cognitiveTests, answeredQuestionnaires] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT DISTINCT "specificTest" FROM "CognitiveTestResult" WHERE "sessionId" = $1`,
        session.id
      ),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT DISTINCT "testName" FROM "Answer" WHERE "sessionId" = $1`,
        session.id
      ),
    ]);

    const completedTestPaths = Array.from(
      new Set([
        ...cognitiveTests.map(t => TEST_PATH_MAP[t.specificTest]).filter(Boolean),
        // Questionnaires are tracked by their bare id (e.g. "dass21").
        ...answeredQuestionnaires.map(a => a.testName).filter(Boolean),
      ])
    );

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      participantName: session.participantName || "Participant",
      participantIdNumber: session.participantIdNumber || cleanId,
      completedTests: completedTestPaths,
      completed: session.completed,
      consentGiven: session.consentGiven,
      message: "Signed in successfully!"
    });

  } catch (error: any) {
    console.error("Sign in error:", error);
    return NextResponse.json({ error: "Failed to sign in: " + error.message }, { status: 500 });
  }
}
