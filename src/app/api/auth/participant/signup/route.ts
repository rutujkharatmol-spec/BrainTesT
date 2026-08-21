import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      participantName,
      participantIdNumber,
      phoneNo,
      passcode,
      age,
      gender,
      studentClass,
      schoolName,
      address,
      consentGiven
    } = body;

    // Validation
    if (!participantName?.trim()) {
      return NextResponse.json({ error: "Participant Name is required." }, { status: 400 });
    }
    if (!participantIdNumber?.trim()) {
      return NextResponse.json({ error: "Participant ID Number is required." }, { status: 400 });
    }
    if (!passcode || passcode.trim().length < 4) {
      return NextResponse.json({ error: "Passcode must be at least 4 characters/digits." }, { status: 400 });
    }
    if (!phoneNo || phoneNo.trim().length !== 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit phone number." }, { status: 400 });
    }

    const cleanId = participantIdNumber.trim();
    const cleanPhone = phoneNo.trim();

    // Check if a participant with this ID or phone already exists
    const existing: any[] = await prisma.$queryRawUnsafe(
      `SELECT "id" FROM "Session" WHERE "participantIdNumber" = $1 OR "phoneNo" = $2 LIMIT 1`,
      cleanId,
      cleanPhone
    );

    if (existing && existing.length > 0) {
      return NextResponse.json({ 
        error: "A participant with this ID Number or Phone Number already exists. Please Sign In instead." 
      }, { status: 409 });
    }

    // Hash passcode securely
    const hashedPasscode = await bcrypt.hash(passcode.trim(), 10);
    const newSessionId = crypto.randomUUID();

    await prisma.$executeRawUnsafe(
      `INSERT INTO "Session" (
        "id", "participantName", "participantIdNumber", "phoneNo", "passcode",
        "age", "gender", "studentClass", "schoolName", "address",
        "consentGiven", "completed", "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      newSessionId,
      participantName.trim(),
      cleanId,
      cleanPhone,
      hashedPasscode,
      age ? parseInt(age) : null,
      gender || null,
      studentClass?.trim() || null,
      schoolName?.trim() || null,
      address?.trim() || null,
      Boolean(consentGiven),
      false
    );

    return NextResponse.json({
      success: true,
      sessionId: newSessionId,
      participantName: participantName.trim(),
      participantIdNumber: cleanId,
      phoneNo: cleanPhone,
      completedTests: [],
      message: "Registration successful!"
    });

  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Failed to complete registration: " + error.message }, { status: 500 });
  }
}
