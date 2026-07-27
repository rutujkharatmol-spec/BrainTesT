import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { participantName, participantIdNumber } = body;

    const newSession = await prisma.session.create({
      data: {
        participantName,
        participantIdNumber,
        consentGiven: true, // We can assume consent is given via the intake screen
      }
    });

    return NextResponse.json({ sessionId: newSession.id });
  } catch (error) {
    console.error("Failed to start session", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
