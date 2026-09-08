import { NextResponse } from "next/server";
import { verifyOwnership } from "@/lib/provenance";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = verifyOwnership();

  const response = NextResponse.json(
    {
      status: result.valid ? "AUTHENTICATED" : "COMPROMISED",
      verified: result.valid,
      system: "AIIMS Kalyani Physiology & Cognitive Lab (BrainTesT)",
      creator: result.certificate.author,
      role: result.certificate.role,
      institution: result.certificate.institution,
      tamperId: result.certificate.tamperId,
      sha256Proof: result.hash,
      issuedTo: result.certificate.author,
      copyright: result.certificate.copyright,
      verifiedTimestamp: result.certificate.verifiedAt,
    },
    {
      status: result.valid ? 200 : 403,
      headers: {
        "X-System-Origin": "RK-BRAINTEST-AIIMS-2026",
        "X-Author-Checksum": result.hash,
        "X-Provenance-Status": result.valid ? "Verified" : "Tampered",
      },
    }
  );

  return response;
}
