import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * @deprecated Use /api/session/start instead, which captures participant info.
 * This endpoint is kept for backward compatibility but logs a warning.
 */
export async function POST(req: Request) {
  console.warn("[DEPRECATED] /api/session was called — use /api/session/start instead.");
  try {
    const body = await req.json().catch(() => ({}));
    const session = await prisma.session.create({
      data: {
        participantName: body.participantName || null,
        participantIdNumber: body.participantIdNumber || null,
        consentGiven: true
      }
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
