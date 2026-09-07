import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function handleDelete(req: Request) {
  const session = await verifyAdminSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    let sessionId: string | null = null;

    // Check query param first
    const url = new URL(req.url);
    sessionId = url.searchParams.get("sessionId") || url.searchParams.get("id");

    // If not in query param, read from request body
    if (!sessionId && req.method !== "GET") {
      try {
        const body = await req.json();
        sessionId = body.sessionId || body.id;
      } catch {
        // Body was empty or not JSON
      }
    }

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "Valid sessionId is required" },
        { status: 400 }
      );
    }

    // Verify the session exists
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, participantName: true, participantIdNumber: true },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: "Participant record not found" },
        { status: 404 }
      );
    }

    // Deleting the session cascades to delete all foreign-key related rows:
    // cfsSubmission, gaeneSubmission, mateSubmission, sbsSubmission, skepSubmission,
    // tsisSubmission, ncs6Submission, cfqSubmission, dass21Submission, phq9Submission,
    // gad7Submission, who5Submission, answers, cognitiveTests.
    await prisma.session.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({
      success: true,
      message: `Participant ${existingSession.participantName || existingSession.participantIdNumber || sessionId} and all related data deleted successfully.`,
      sessionId,
    });
  } catch (error: any) {
    console.error("Delete Participant Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete participant" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return handleDelete(req);
}

export async function DELETE(req: Request) {
  return handleDelete(req);
}
