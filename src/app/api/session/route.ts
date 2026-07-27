import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await prisma.session.create({
      data: {
        consentGiven: true
      }
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
