"use client";

import React, { useState } from "react";
import { useAppContext } from "./AppContext";
import { fetchWithOfflineSync, OFFLINE_SESSION_PREFIX } from "@/utils/offlineSync";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 8,
  border: "1px solid var(--card-border)",
  fontSize: "0.95rem",
  background: "#FFFFFF",
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "var(--text-primary)",
};

const fieldGroupStyle: React.CSSProperties = {
  marginBottom: 16,
};

export default function IntakeScreen() {
  const { setSessionId, loginParticipant, state } = useAppContext();
  const lang = state.language;

  // Auth Mode: "signin" vs "signup"
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  // Sign In Form States
  const [signInIdentifier, setSignInIdentifier] = useState("");
  const [signInPasscode, setSignInPasscode] = useState("");
  const [showSignInPasscode, setShowSignInPasscode] = useState(false);

  // Sign Up Form States
  const [name, setName] = useState("");
  const [idNum, setIdNum] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [passcode, setPasscode] = useState("");
  const [showSignUpPasscode, setShowSignUpPasscode] = useState(false);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");
  const [consent, setConsent] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sign In Validation
  const isSignInValid = signInIdentifier.trim() && signInPasscode.trim();

  // Sign Up Validation
  const isSignUpValid =
    name.trim() &&
    idNum.trim().length === 12 &&
    phoneNo.length === 10 &&
    passcode.trim().length >= 4 &&
    age.trim() &&
    gender &&
    studentClass.trim() &&
    schoolName.trim() &&
    address.trim() &&
    consent;

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignInValid) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/participant/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: signInIdentifier.trim().replace(/[\s-]/g, ""),
          passcode: signInPasscode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to sign in. Please check your credentials.");
        return;
      }

      if (data.sessionId) {
        loginParticipant(data.sessionId, data.participantName, data.participantIdNumber, data.completedTests);
      }
    } catch (err: any) {
      console.error("Sign in network error:", err);
      setErrorMessage("Network error: Unable to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUpValid) return;

    setLoading(true);
    setErrorMessage(null);

    // Minted up front and sent along with the request. If we are offline the
    // request is queued carrying this id, so when it is finally replayed the
    // sync layer can map this placeholder to the real server-issued id and
    // repoint every test result recorded against it. The server ignores the
    // field when it does reach it.
    const offlineSessionId = `${OFFLINE_SESSION_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      const res = await fetchWithOfflineSync("/api/auth/participant/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: offlineSessionId,
          participantName: name.trim(),
          participantIdNumber: idNum.trim(),
          phoneNo: phoneNo.trim(),
          passcode: passcode.trim(),
          age: parseInt(age),
          gender,
          studentClass: studentClass.trim(),
          schoolName: schoolName.trim(),
          address: address.trim(),
          consentGiven: consent,
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok && !data.offline) {
        setErrorMessage(data.error || "Registration failed. Please check your information.");
        return;
      }

      if (data.sessionId) {
        setSessionId(data.sessionId, name.trim(), idNum.trim(), data.completedTests || []);
      } else if (data.offline) {
        setSessionId(offlineSessionId, name.trim(), idNum.trim(), []);
      } else {
        setErrorMessage("Failed to start session. Please try again.");
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      setErrorMessage("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 620, margin: "auto", padding: "28px 32px" }}>
      {/* Header with Lab Badge */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "linear-gradient(135deg, #1e40af, #3b82f6)",
            color: "white",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            marginBottom: 10,
            boxShadow: "0 4px 10px rgba(30,64,175,0.25)"
          }}
        >
          🧠
        </div>
        <h2 style={{ marginBottom: 4, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
          AIIMS Kalyani Cognitive Portal
        </h2>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          {lang === "bn" ? "স্নায়ুবৌদ্ধিক মূল্যায়ন প্ল্যাটফর্ম" : "Neurocognitive Assessment Battery"}
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "#f1f5f9",
          padding: 4,
          borderRadius: 10,
          marginBottom: 24,
          gap: 4
        }}
      >
        <button
          type="button"
          onClick={() => {
            setAuthMode("signin");
            setErrorMessage(null);
          }}
          style={{
            padding: "10px",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            backgroundColor: authMode === "signin" ? "#ffffff" : "transparent",
            color: authMode === "signin" ? "#1e40af" : "#64748b",
            boxShadow: authMode === "signin" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
            transition: "all 0.15s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6
          }}
        >
          <span>🔑</span> {lang === "bn" ? "প্রবেশ করুন (Sign In)" : "Sign In"}
        </button>

        <button
          type="button"
          onClick={() => {
            setAuthMode("signup");
            setErrorMessage(null);
          }}
          style={{
            padding: "10px",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            backgroundColor: authMode === "signup" ? "#ffffff" : "transparent",
            color: authMode === "signup" ? "#1e40af" : "#64748b",
            boxShadow: authMode === "signup" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
            transition: "all 0.15s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6
          }}
        >
          <span>📝</span> {lang === "bn" ? "নতুন নিবন্ধন (Sign Up)" : "New Sign Up"}
        </button>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* =====================================================================
          SIGN IN FORM (Aadhaar Card Number / Phone Number + Passcode)
          ===================================================================== */}
      {authMode === "signin" ? (
        <form onSubmit={handleSignIn}>
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px 0", textAlign: "center" }}>
              {lang === "bn"
                ? "অধিবেশন চালিয়ে যেতে আপনার ১২-সংখ্যার আধার কার্ড নম্বর অথবা ১০-সংখ্যার ফোন নম্বর এবং পাসকোড লিখুন।"
                : "Enter your 12-digit Aadhaar Card Number or 10-digit Phone Number and Passcode to access your assessment profile."}
            </p>
          </div>

          {/* Identifier: Aadhaar or Phone */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              {lang === "bn" ? "আধার কার্ড নম্বর অথবা ফোন নম্বর" : "AADHAAR CARD OR PHONE NUMBER"} <span style={{ color: "var(--error-color)" }}>*</span>
            </label>
            <input
              type="text"
              value={signInIdentifier}
              onChange={(e) => setSignInIdentifier(e.target.value)}
              required
              style={inputStyle}
              placeholder="e.g. 12-digit Aadhaar No or 10-digit Mobile No"
              autoFocus
            />
          </div>

          {/* Passcode */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              {lang === "bn" ? "পাসকোড" : "PASSCODE"} <span style={{ color: "var(--error-color)" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showSignInPasscode ? "text" : "password"}
                value={signInPasscode}
                onChange={(e) => setSignInPasscode(e.target.value)}
                required
                style={{ ...inputStyle, paddingRight: 40 }}
                placeholder="Enter your passcode"
              />
              <button
                type="button"
                onClick={() => setShowSignInPasscode(v => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title={showSignInPasscode ? "Hide passcode" : "Show passcode"}
                aria-label={showSignInPasscode ? "Hide passcode" : "Show passcode"}
              >
                {showSignInPasscode ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Sign In */}
          <button
            className="btn"
            type="submit"
            disabled={!isSignInValid || loading}
            style={{
              width: "100%",
              padding: "13px",
              fontSize: "1rem",
              marginTop: 10,
              opacity: isSignInValid ? 1 : 0.6,
            }}
          >
            {loading
              ? (lang === "bn" ? "যাচাই করা হচ্ছে..." : "Signing in...")
              : (lang === "bn" ? "প্রবেশ করুন / Sign In" : "Sign In & Continue Assessment")}
          </button>

          {/* Switch to Sign Up */}
          <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "#64748b" }}>
            {lang === "bn" ? "অ্যাকাউন্ট নেই? " : "Don't have an account yet? "}
            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setErrorMessage(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#1e40af",
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline"
              }}
            >
              {lang === "bn" ? "নতুন নিবন্ধন করুন (Sign Up)" : "Register / Sign Up here"}
            </button>
          </div>
        </form>
      ) : (
        /* =====================================================================
            SIGN UP FORM (Full Intake with Passcode Creation)
            ===================================================================== */
        <form onSubmit={handleSignUp}>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px 0", textAlign: "center" }}>
            {lang === "bn"
              ? "মূল্যায়ন শুরু করতে নীচের সমস্ত বিবরণ পূরণ করুন এবং একটি পাসকোড সেট করুন।"
              : "Please fill in your details and create a passcode to register for the assessment."}
          </p>

          {/* Row 1: Name + Aadhaar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>
                {lang === "bn" ? "নাম / NAME" : "FULL NAME"} <span style={{ color: "var(--error-color)" }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={inputStyle}
                placeholder="e.g. Nihal Sarin"
              />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>
                {lang === "bn" ? "আধার কার্ড নম্বর / AADHAAR CARD NUMBER" : "AADHAAR CARD NUMBER"} <span style={{ color: "var(--error-color)" }}>*</span>
              </label>
              <input
                type="text"
                value={idNum}
                onChange={(e) => {
                  const num = e.target.value.replace(/\D/g, "");
                  if (num.length <= 12) setIdNum(num);
                }}
                required
                pattern="\d{12}"
                title="Aadhaar Card Number must be exactly 12 digits"
                style={inputStyle}
                placeholder="12-digit Aadhaar Number"
              />
              {idNum.length > 0 && idNum.length < 12 && (
                <span style={{ fontSize: "0.75rem", color: "var(--error-color)", marginTop: 4, display: "block" }}>
                  Must be 12 digits ({idNum.length}/12)
                </span>
              )}
            </div>
          </div>

          {/* Row 2: Phone + Passcode */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>
                {lang === "bn" ? "ফোন নম্বর / PHONE NO" : "PHONE NUMBER"} <span style={{ color: "var(--error-color)" }}>*</span>
              </label>
              <input
                type="tel"
                value={phoneNo}
                onChange={(e) => {
                  const num = e.target.value.replace(/\D/g, "");
                  if (num.length <= 10) setPhoneNo(num);
                }}
                required
                pattern="\d{10}"
                title="Phone number must be exactly 10 digits"
                style={inputStyle}
                placeholder="10-digit Mobile No"
              />
              {phoneNo.length > 0 && phoneNo.length < 10 && (
                <span style={{ fontSize: "0.75rem", color: "var(--error-color)", marginTop: 4, display: "block" }}>
                  Must be 10 digits ({phoneNo.length}/10)
                </span>
              )}
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>
                {lang === "bn" ? "পাসকোড তৈরি করুন / PASSCODE" : "CREATE PASSCODE"} <span style={{ color: "var(--error-color)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showSignUpPasscode ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  required
                  minLength={4}
                  style={{ ...inputStyle, paddingRight: 38 }}
                  placeholder="Min 4 characters/digits"
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPasscode(v => !v)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title={showSignUpPasscode ? "Hide passcode" : "Show passcode"}
                  aria-label={showSignUpPasscode ? "Hide passcode" : "Show passcode"}
                >
                  {showSignUpPasscode ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Age + Gender */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>
                {lang === "bn" ? "বয়স / AGE" : "AGE"} <span style={{ color: "var(--error-color)" }}>*</span>
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                min={1}
                max={120}
                style={inputStyle}
                placeholder="e.g. 21"
              />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>
                {lang === "bn" ? "লিঙ্গ / GENDER" : "GENDER"} <span style={{ color: "var(--error-color)" }}>*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
                style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
              >
                <option value="" disabled>-- Select / নির্বাচন করুন --</option>
                <option value="Male">পুরুষ / Male</option>
                <option value="Female">মহিলা / Female</option>
                <option value="Other">অন্যান্য / Other</option>
              </select>
            </div>
          </div>

          {/* Row 4: Class + School */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>
                {lang === "bn" ? "শ্রেণী / CLASS" : "CLASS / BATCH"} <span style={{ color: "var(--error-color)" }}>*</span>
              </label>
              <input
                type="text"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                required
                style={inputStyle}
                placeholder="e.g. Class 10 / MBBS"
              />
            </div>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>
                {lang === "bn" ? "বিদ্যালয় / SCHOOL NAME" : "SCHOOL / INSTITUTION"} <span style={{ color: "var(--error-color)" }}>*</span>
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
                style={inputStyle}
                placeholder="e.g. Kendriya Vidyalaya"
              />
            </div>
          </div>

          {/* Row 5: Address */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              {lang === "bn" ? "ঠিকানা / ADDRESS" : "RESIDENTIAL ADDRESS"} <span style={{ color: "var(--error-color)" }}>*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              style={inputStyle}
              placeholder="e.g. Kalyani, Nadia, West Bengal"
            />
          </div>

          {/* Consent Section */}
          <div
            style={{
              marginTop: 4,
              marginBottom: 18,
              padding: 14,
              background: consent ? "rgba(5, 150, 105, 0.04)" : "#FFF9F0",
              border: `1.5px solid ${consent ? "var(--success-color)" : "#E5C07B"}`,
              borderRadius: 8,
              transition: "all 0.3s ease",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                cursor: "pointer",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                style={{
                  width: 18,
                  height: 18,
                  marginTop: 2,
                  accentColor: "var(--accent-color)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
              <div>
                <p style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}>
                  সম্মতি / INFORMED CONSENT <span style={{ color: "var(--error-color)" }}>*</span>
                </p>
                <p style={{
                  margin: 0,
                  fontSize: "0.8rem",
                  lineHeight: 1.45,
                  color: "var(--text-secondary)",
                }}>
                  আমি স্বেচ্ছায় এই স্নায়ুবৌদ্ধিক মূল্যায়নে অংশগ্রহণ করতে সম্মত। আমি বুঝতে পারছি
                  যে আমার তথ্য গবেষণার উদ্দেশ্যে সংগ্রহ করা হবে এবং গোপনীয় রাখা হবে।
                </p>
                <p style={{
                  margin: 0,
                  marginTop: 4,
                  fontSize: "0.8rem",
                  lineHeight: 1.45,
                  color: "var(--text-secondary)",
                }}>
                  I voluntarily consent to participate in this neurocognitive assessment.
                  I understand that my data will be collected for research purposes and
                  will be kept confidential.
                </p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            className="btn"
            type="submit"
            disabled={!isSignUpValid || loading}
            style={{
              width: "100%",
              padding: "13px",
              fontSize: "1rem",
              opacity: isSignUpValid ? 1 : 0.6,
            }}
          >
            {loading
              ? (lang === "bn" ? "নিবন্ধন করা হচ্ছে..." : "Registering...")
              : (lang === "bn" ? "নিবন্ধন করুন এবং শুরু করুন" : "Create Account & Start Assessment")}
          </button>

          {/* Switch to Sign In */}
          <div style={{ marginTop: 18, textAlign: "center", fontSize: 13, color: "#64748b" }}>
            {lang === "bn" ? "ইতিমধ্যে অ্যাকাউন্ট আছে? " : "Already registered? "}
            <button
              type="button"
              onClick={() => {
                setAuthMode("signin");
                setErrorMessage(null);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#1e40af",
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline"
              }}
            >
              {lang === "bn" ? "প্রবেশ করুন (Sign In)" : "Sign In with your ID/Phone"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
