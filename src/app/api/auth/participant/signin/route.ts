import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

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
      return NextResponse.json({ error: "Please enter your ID Number or Phone Number." }, { status: 400 });
    }
    if (!passcode?.trim()) {
      return NextResponse.json({ error: "Please enter your passcode." }, { status: 400 });
    }

    const cleanId = identifier.trim();

    // Look up participant by ID Number or Phone Number using raw SQL
    const sessions: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Session" WHERE "participantIdNumber" = $1 OR "phoneNo" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
      cleanId
    );

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ 
        error: "No account found matching this ID Number or Phone Number. Please sign up." 
      }, { status: 404 });
    }

    const session = sessions[0];

    // Verify passcode if set
    if (session.passcode) {
      let isMatch = false;
      if (session.passcode.startsWith("$2a$") || session.passcode.startsWith("$2b$")) {
        isMatch = await bcrypt.compare(passcode.trim(), session.passcode);
      } else {
        isMatch = session.passcode === passcode.trim();
      }

      if (!isMatch) {
        return NextResponse.json({ error: "Incorrect passcode. Please check and try again." }, { status: 401 });
      }
    } else {
      // If legacy record had no passcode, set the passcode now
      const hashedPasscode = await bcrypt.hash(passcode.trim(), 10);
      await prisma.$executeRawUnsafe(
        `UPDATE "Session" SET "passcode" = $1 WHERE "id" = $2`,
        hashedPasscode,
        session.id
      );
    }

    // Fetch completed cognitive tests for this session
    const cognitiveTests: any[] = await prisma.$queryRawUnsafe(
      `SELECT "specificTest" FROM "CognitiveTestResult" WHERE "sessionId" = $1`,
      session.id
    );

    const completedTestPaths = Array.from(
      new Set(
        cognitiveTests
          .map(t => TEST_PATH_MAP[t.specificTest])
          .filter(Boolean)
      )
    );

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      participantName: session.participantName || "Participant",
      participantIdNumber: session.participantIdNumber || cleanId,
      phoneNo: session.phoneNo || "",
      age: session.age,
      gender: session.gender,
      studentClass: session.studentClass,
      schoolName: session.schoolName,
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
