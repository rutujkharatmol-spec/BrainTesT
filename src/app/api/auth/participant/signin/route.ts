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
    const rawUsername = (body.username || body.identifier || body.aadhaarNumber || "").trim();
    const rawPhone = (body.phoneNo || body.passcode || "").replace(/\D/g, "");

    if (!rawUsername) {
      return NextResponse.json({ error: "Please enter your Username." }, { status: 400 });
    }
    if (!rawPhone || rawPhone.length !== 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit Phone Number." }, { status: 400 });
    }

    // Throttled per IP+Username to prevent enumeration.
    const rateKey = `participant-signin:${clientIp(req)}:${rawUsername.toLowerCase()}`;
    const limit = checkRateLimit(rateKey, { limit: 8, windowMs: 15 * 60_000, blockMs: 10 * 60_000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Please try again in ${Math.ceil(limit.retryAfter / 60)} minute(s).` },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    // Look up participant by Username (case-insensitive) or participantIdNumber (fallback for legacy records)
    const sessions: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Session" 
       WHERE LOWER("username") = LOWER($1) OR "participantIdNumber" = $1 
       ORDER BY "createdAt" DESC LIMIT 1`,
      rawUsername
    );

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ 
        error: "No account found matching this Username. Please sign up." 
      }, { status: 404 });
    }

    const session = sessions[0];

    // Check phone number match directly or via bcrypt-hashed passcode (which stores the phone number)
    const isPhoneDirectMatch = session.phoneNo === rawPhone;
    let isPasscodeMatch = false;

    if (session.passcode) {
      if (session.passcode.startsWith("$2a$") || session.passcode.startsWith("$2b$")) {
        isPasscodeMatch = await bcrypt.compare(rawPhone, session.passcode);
      } else {
        isPasscodeMatch = session.passcode === rawPhone;
      }
    }

    const isMatch = isPhoneDirectMatch || isPasscodeMatch;

    if (!isMatch) {
      return NextResponse.json({ error: "Phone number does not match this account record. Please check and try again." }, { status: 401 });
    }

    // Seamlessly upgrade / ensure phoneNo and hashed passcode match the phone number
    if (!session.phoneNo || !session.passcode || !session.passcode.startsWith("$2")) {
      const hashed = await bcrypt.hash(rawPhone, 10);
      await prisma.$executeRawUnsafe(
        `UPDATE "Session" SET "phoneNo" = COALESCE("phoneNo", $1), "passcode" = $2 WHERE "id" = $3`,
        rawPhone,
        hashed,
        session.id
      );
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
      username: session.username || rawUsername,
      participantIdNumber: session.participantIdNumber || null,
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
