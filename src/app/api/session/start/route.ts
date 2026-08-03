import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      participantName,
      participantIdNumber,
      age,
      gender,
      studentClass,
      schoolName,
      address,
      phoneNo,
    } = body;

    const newSession = await prisma.session.create({
      data: {
        participantName,
        participantIdNumber,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        studentClass: studentClass || null,
        schoolName: schoolName || null,
        address: address || null,
        phoneNo: phoneNo || null,
        consentGiven: true,
      }
    });

    return NextResponse.json({ sessionId: newSession.id });
  } catch (error) {
    console.error("Failed to start session", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
