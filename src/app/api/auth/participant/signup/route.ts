import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      participantName,
      username,
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

    const cleanUsername = username ? String(username).trim() : "";
    if (!cleanUsername || cleanUsername.length < 3) {
      return NextResponse.json({ error: "Username is required (minimum 3 characters)." }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      return NextResponse.json({ error: "Username can only contain letters, numbers, underscores, and hyphens." }, { status: 400 });
    }

    // Aadhaar Card is optional. If provided, it must be 12 digits. If blank, stored as null.
    let cleanId: string | null = null;
    if (participantIdNumber && String(participantIdNumber).trim().length > 0) {
      const digitsOnly = String(participantIdNumber).replace(/\D/g, "");
      if (digitsOnly.length !== 12) {
        return NextResponse.json({ error: "Aadhaar Card Number must be exactly 12 digits (or leave blank)." }, { status: 400 });
      }
      cleanId = digitsOnly;
    }

    const cleanPhone = phoneNo?.replace(/\D/g, "") || "";
    if (!cleanPhone || cleanPhone.length !== 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit phone number." }, { status: 400 });
    }

    // Use phone number as the passcode and hash it securely
    const rawPasscode = (passcode && passcode.trim().length >= 4) ? passcode.trim() : cleanPhone;
    const hashedPasscode = await bcrypt.hash(rawPasscode, 10);
    const newSessionId = crypto.randomUUID();

    // Uniqueness is enforced by the database (see the @unique columns on
    // Session). A prior read-then-write check was racy: two devices
    // registering the same participant at once both passed it and inserted,
    // splitting that participant's results across two rows. A duplicate now
    // surfaces as P2002 and is handled below.
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Session" (
          "id", "participantName", "username", "participantIdNumber", "phoneNo", "passcode",
          "age", "gender", "studentClass", "schoolName", "address",
          "consentGiven", "completed", "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
        newSessionId,
        participantName.trim(),
        cleanUsername,
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
    } catch (insertErr: any) {
      const isDuplicate =
        insertErr?.code === "P2002" ||
        insertErr?.meta?.code === "23505" ||
        /duplicate key value|unique constraint/i.test(String(insertErr?.message ?? ""));

      if (isDuplicate) {
        return NextResponse.json({
          error: "A participant with this Username, Aadhaar Number, or Phone Number already exists. Please Sign In instead.",
        }, { status: 409 });
      }
      throw insertErr;
    }

    return NextResponse.json({
      success: true,
      sessionId: newSessionId,
      participantName: participantName.trim(),
      username: cleanUsername,
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
