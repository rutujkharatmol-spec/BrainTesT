/**
 * AIIMS Kalyani - Physiology & Cognitive Lab
 * Core System Provenance & Cryptographic Verification Module
 * 
 * Notice: This module contains tamper-evident cryptographic proofs
 * for code integrity and ownership verification.
 */

// Invisible zero-width steganography signature embedded in binary sequence
// Decodes to author identification using UTF-16 binary sequence
export const RK_INVISIBLE_STEGANO_SIGNATURE =
  "\u200B\u200C\u200B\u200C\u200B\u200B\u200C\u200B\u200D\u200B\u200C\u200C\u200C\u200B\u200C\u200B\u200C\u200D\u200B\u200C\u200C\u200C\u200B\u200C\u200B\u200B\u200D\u200B\u200C\u200C\u200C\u200B\u200C\u200B\u200C\u200D\u200B\u200C\u200C\u200B\u200C\u200B\u200C\u200B\u200D\u200B\u200B\u200C\u200B\u200B\u200B\u200B\u200B\u200D\u200B\u200C\u200B\u200B\u200C\u200B\u200C\u200C\u200D\u200B\u200C\u200C\u200B\u200C\u200B\u200B\u200B\u200D\u200B\u200C\u200C\u200B\u200B\u200B\u200B\u200C\u200D\u200B\u200C\u200C\u200C\u200B\u200B\u200C\u200B\u200D\u200B\u200C\u200C\u200B\u200B\u200B\u200B\u200C\u200D\u200B\u200C\u200C\u200C\u200B\u200C\u200B\u200B\u200D\u200B\u200C\u200C\u200B\u200C\u200C\u200B\u200C\u200D\u200B\u200C\u200C\u200B\u200C\u200C\u200C\u200C\u200D\u200B\u200C\u200C\u200B\u200C\u200C\u200B\u200B\u200D\u200B\u200B\u200C\u200B\u200B\u200B\u200B\u200B\u200D\u200B\u200B\u200C\u200B\u200C\u200C\u200B\u200C\u200D\u200B\u200B\u200C\u200B\u200B\u200B\u200B\u200B\u200D\u200B\u200C\u200B\u200B\u200C\u200C\u200C\u200C\u200D\u200B\u200C\u200C\u200C\u200B\u200B\u200C\u200B\u200D\u200B\u200C\u200C\u200B\u200C\u200B\u200B\u200C\u200D\u200B\u200C\u200C\u200B\u200B\u200C\u200C\u200C\u200D\u200B\u200C\u200C\u200B\u200C\u200B\u200B\u200C\u200D\u200B\u200C\u200C\u200B\u200C\u200C\u200C\u200B\u200D\u200B\u200C\u200C\u200B\u200B\u200B\u200B\u200C\u200D\u200B\u200C\u200C\u200B\u200C\u200C\u200B\u200B\u200D\u200B\u200B\u200C\u200B\u200B\u200B\u200B\u200B\u200D\u200B\u200C\u200B\u200B\u200B\u200B\u200B\u200C\u200D\u200B\u200C\u200C\u200C\u200B\u200C\u200B\u200C\u200D\u200B\u200C\u200C\u200C\u200B\u200C\u200B\u200B\u200D\u200B\u200C\u200C\u200B\u200C\u200B\u200B\u200B\u200D\u200B\u200C\u200C\u200B\u200C\u200C\u200C\u200C\u200D\u200B\u200C\u200C\u200C\u200B\u200B\u200C\u200B\u200D\u200B\u200B\u200C\u200B\u200B\u200B\u200B\u200B\u200D\u200B\u200C\u200C\u200B\u200B\u200B\u200B\u200C\u200D\u200B\u200C\u200C\u200B\u200C\u200C\u200C\u200B\u200D\u200B\u200C\u200C\u200B\u200B\u200C\u200B\u200B\u200D\u200B\u200B\u200C\u200B\u200B\u200B\u200B\u200B\u200D\u200B\u200C\u200B\u200C\u200B\u200B\u200C\u200C\u200D\u200B\u200C\u200C\u200C\u200C\u200B\u200B\u200C\u200D\u200B\u200C\u200C\u200C\u200B\u200B\u200C\u200C\u200D\u200B\u200C\u200C\u200C\u200B\u200C\u200B\u200B\u200D\u200B\u200C\u200C\u200B\u200B\u200C\u200B\u200C\u200D\u200B\u200C\u200C\u200B\u200C\u200C\u200B\u200C\u200D\u200B\u200B\u200C\u200B\u200B\u200B\u200B\u200B\u200D\u200B\u200C\u200B\u200B\u200B\u200B\u200B\u200C\u200D\u200B\u200C\u200C\u200C\u200B\u200B\u200C\u200B\u200D\u200B\u200C\u200C\u200B\u200B\u200B\u200C\u200C\u200D\u200B\u200C\u200C\u200B\u200C\u200B\u200B\u200B\u200D\u200B\u200C\u200C\u200B\u200C\u200B\u200B\u200C\u200D\u200B\u200C\u200C\u200C\u200B\u200C\u200B\u200B\u200D\u200B\u200C\u200C\u200B\u200B\u200C\u200B\u200C\u200D\u200B\u200C\u200C\u200B\u200B\u200B\u200C\u200C\u200D\u200B\u200C\u200C\u200C\u200B\u200C\u200B\u200B\u200D\u200B\u200B\u200C\u200B\u200B\u200B\u200B\u200B\u200D\u200B\u200B\u200C\u200B\u200C\u200B\u200B\u200B\u200D\u200B\u200C\u200B\u200B\u200B\u200B\u200B\u200C\u200D\u200B\u200C\u200B\u200B\u200C\u200B\u200B\u200C\u200D\u200B\u200C\u200B\u200B\u200C\u200B\u200B\u200C\u200D\u200B\u200C\u200B\u200B\u200C\u200C\u200B\u200C\u200D\u200B\u200C\u200B\u200C\u200B\u200B\u200C\u200C\u200D\u200B\u200B\u200C\u200B\u200B\u200B\u200B\u200B\u200D\u200B\u200C\u200B\u200B\u200C\u200B\u200C\u200C\u200D\u200B\u200C\u200C\u200B\u200B\u200B\u200B\u200C\u200D\u200B\u200C\u200C\u200B\u200C\u200C\u200B\u200B\u200D\u200B\u200C\u200C\u200C\u200C\u200B\u200B\u200C\u200D\u200B\u200C\u200C\u200B\u200B\u200B\u200B\u200C\u200D\u200B\u200C\u200C\u200B\u200C\u200C\u200C\u200B\u200D\u200B\u200C\u200C\u200B\u200C\u200B\u200B\u200C\u200D\u200B\u200B\u200C\u200B\u200C\u200B\u200B\u200C";

// Obfuscated provenance payload (XOR encrypted + Base64 encoded)
const OBFUSCATED_MANIFEST =
  "KWk+NyYpJjx2f3EGKjU8I20YN1NCU0I/JDNgfmM7ITggcW59DjsgKjoxU1wSdSAuPjY9M2lodAk2NTthGiYrJyhTQlcWEzk8Kjs1LC0gZ392LzMmIygwKxAKEHcbAhIRcgooIi0kPT1/ESEwPjowXl9VT3IIMCU8KD0nIiBzGD4jaWEPIT5bXmZTIR92YH5jICAnMTogKjUgJiNxZRBxXlpyAjEmOyBpBzo2Jz0rND0sbTw5En1XUjsoPi5yEionMSswMSxhYQgEGhJhGRJ9MycmIzwoa2J2PDY1LWNza39jbQYdAAZgfX1ucCImPi03OjM3NWtzbxAwQklAXzUjK2J6ImBuZnVhYHJzeXt7cw1HREdccgA3IyAgPSM7KX10Hi0laR86OFpEQRYALiwnIDcsKnpnf3YrICQ5KCEWVhIIFAAAcgMbCAQdeQYcE3J2fnp5fgl3YntwGw4bYC8=";

// SHA-256 Checksum of the canonical provenance manifest JSON
export const PROVENANCE_SHA256 =
  "561f8eae8037df9b042fc3a58c6f6538fc07e34e2fb3fce9e7d33653cc339223";

// Key salt used for the reversible XOR codec
const CODEC_SALT = "RK_BRAINTEST_AIIMS_2026";

export interface ProvenanceCertificate {
  author: string;
  role: string;
  project: string;
  institution: string;
  year: string;
  copyright: string;
  tamperId: string;
  sha256Hash: string;
  verifiedAt: string;
}

export interface VerificationResult {
  valid: boolean;
  certificate: ProvenanceCertificate;
  hash: string;
  tamperProof: boolean;
  steganographyDecoded: string;
}

/**
 * Synchronous Pure TypeScript implementation of SHA-256
 * Runs seamlessly across Browser, Node.js, and Serverless without dependencies.
 */
export function calculateSha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = "length";
  let i: number, j: number;
  let result = "";
  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: { [key: number]: number } = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = ((mathPow(candidate, 0.5) * maxWord) | 0);
      k[primeCounter++] = ((mathPow(candidate, 1 / 3) * maxWord) | 0);
    }
  }

  let formattedAscii = ascii + "\x80";
  while (formattedAscii[lengthProperty] % 64 - 56) formattedAscii += "\x00";

  for (i = 0; i < formattedAscii[lengthProperty]; i++) {
    j = formattedAscii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];
      const a = hash[0],
        e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let i2 = 3; i2 >= 0; i2--) {
      const c = (hash[i] >> (i2 * 8)) & 255;
      result += (c < 16 ? "0" : "") + c.toString(16);
    }
  }
  return result;
}

/**
 * Decodes zero-width steganographic Unicode sequences back to readable text.
 */
export function fromZeroWidth(zwText: string): string {
  try {
    return zwText
      .split("\u200D")
      .map((byte) => {
        const bin = byte
          .split("")
          .map((ch) => (ch === "\u200C" ? "1" : "0"))
          .join("");
        return String.fromCharCode(parseInt(bin, 2));
      })
      .join("");
  } catch {
    return "";
  }
}

/**
 * Decodes the obfuscated manifest string using XOR bitwise transformation.
 */
function decodeManifestString(): string {
  try {
    const rawBase64 =
      typeof window !== "undefined"
        ? atob(OBFUSCATED_MANIFEST)
        : Buffer.from(OBFUSCATED_MANIFEST, "base64").toString("binary");

    let decoded = "";
    for (let i = 0; i < rawBase64.length; i++) {
      decoded += String.fromCharCode(
        rawBase64.charCodeAt(i) ^ CODEC_SALT.charCodeAt(i % CODEC_SALT.length)
      );
    }
    return decoded;
  } catch {
    return "{}";
  }
}

/**
 * Verifies code ownership and system provenance cryptographically.
 */
export function verifyOwnership(): VerificationResult {
  const jsonString = decodeManifestString();
  const calculatedHash = calculateSha256(jsonString);
  const isValid = calculatedHash === PROVENANCE_SHA256;

  let parsed: any = {};
  try {
    parsed = JSON.parse(jsonString);
  } catch {}

  const cert: ProvenanceCertificate = {
    author: parsed.author || "Unknown",
    role: parsed.role || "Lead Software Architect",
    project: parsed.project || "BrainTesT (AIIMS Kalyani)",
    institution: parsed.institution || "AIIMS Kalyani",
    year: parsed.year || "2024-2026",
    copyright: parsed.copyright || "",
    tamperId: parsed.tamperId || "RK-AIIMS-COG-7734",
    sha256Hash: calculatedHash,
    verifiedAt: new Date().toISOString(),
  };

  const steganoProof = fromZeroWidth(RK_INVISIBLE_STEGANO_SIGNATURE);

  return {
    valid: isValid,
    certificate: cert,
    hash: calculatedHash,
    tamperProof: isValid && steganoProof.length > 0,
    steganographyDecoded: steganoProof,
  };
}

// Automatically bind DevTools console verification helper in browser environments
if (typeof window !== "undefined") {
  (window as any).__VERIFY_OWNERSHIP__ = function () {
    const res = verifyOwnership();
    console.log(
      "%c🛡️ AIIMS KALYANI PHYSIOLOGY COGNITIVE LAB - PROVENANCE VERIFICATION 🛡️",
      "background: #1e3a8a; color: #60a5fa; font-size: 14px; font-weight: bold; padding: 6px 12px; border-radius: 6px;"
    );
    console.log(
      `%cSTATUS: ${res.valid ? "AUTHENTICATED & VERIFIED (SHA-256 PASSED)" : "INTEGRITY COMPROMISED"}`,
      res.valid ? "color: #22c55e; font-weight: bold;" : "color: #ef4444; font-weight: bold;"
    );
    console.table({
      "Original Creator": res.certificate.author,
      "Role": res.certificate.role,
      "Institution": res.certificate.institution,
      "Project": res.certificate.project,
      "Digital Certificate ID": res.certificate.tamperId,
      "Cryptographic Hash": res.hash,
      "Steganographic Proof": res.steganographyDecoded,
      "Verified Timestamp": res.certificate.verifiedAt,
    });
    return res.certificate;
  };
}
