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
  const [signInUsername, setSignInUsername] = useState("");
  const [signInPhone, setSignInPhone] = useState("");

  // Sign Up Form States
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [idNum, setIdNum] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");
  const [consent, setConsent] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sign In Validation (Username min 3 chars + 10-digit Phone)
  const isSignInValid = signInUsername.trim().length >= 3 && signInPhone.trim().length === 10;

  // Sign Up Validation (Aadhaar is optional; if provided must be 12 digits)
  const isAadhaarValid = idNum.trim().length === 0 || idNum.trim().length === 12;
  const isSignUpValid =
    name.trim().length > 0 &&
    username.trim().length >= 3 &&
    phoneNo.length === 10 &&
    isAadhaarValid &&
    age.trim().length > 0 &&
    Boolean(gender) &&
    studentClass.trim().length > 0 &&
    schoolName.trim().length > 0 &&
    address.trim().length > 0 &&
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
          username: signInUsername.trim(),
          phoneNo: signInPhone.trim().replace(/\D/g, ""),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to sign in. Please check your credentials.");
        return;
      }

      if (data.sessionId) {
        loginParticipant(data.sessionId, data.participantName, data.participantIdNumber, data.completedTests, data.username);
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
    const cleanId = idNum.trim() ? idNum.trim() : null;

    try {
      const res = await fetchWithOfflineSync("/api/auth/participant/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: offlineSessionId,
          participantName: name.trim(),
          username: username.trim(),
          participantIdNumber: cleanId,
          phoneNo: phoneNo.trim(),
          passcode: phoneNo.trim(),
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
        setSessionId(data.sessionId, name.trim(), cleanId, data.completedTests || [], data.username || username.trim());
      } else if (data.offline) {
        setSessionId(offlineSessionId, name.trim(), cleanId, [], username.trim());
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
          SIGN IN FORM (Username + Phone Number)
          ===================================================================== */}
      {authMode === "signin" ? (
        <form onSubmit={handleSignIn}>
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px 0", textAlign: "center" }}>
              {lang === "bn"
                ? "অধিবেশন চালিয়ে যেতে আপনার ব্যবহারকারীর নাম এবং ১০-সংখ্যার ফোন নম্বর লিখুন।"
                : "Enter your Username and 10-digit Phone Number to access your assessment profile."}
            </p>
          </div>

          {/* Username */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              {lang === "bn" ? "ব্যবহারকারীর নাম / USERNAME" : "USERNAME"} <span style={{ color: "var(--error-color)" }}>*</span>
            </label>
            <input
              type="text"
              value={signInUsername}
              onChange={(e) => setSignInUsername(e.target.value)}
              required
              style={inputStyle}
              placeholder="Enter your username"
              autoFocus
            />
          </div>

          {/* Phone Number */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              {lang === "bn" ? "ফোন নম্বর / PHONE NUMBER" : "PHONE NUMBER"} <span style={{ color: "var(--error-color)" }}>*</span>
            </label>
            <input
              type="tel"
              value={signInPhone}
              onChange={(e) => {
                const num = e.target.value.replace(/\D/g, "");
                if (num.length <= 10) setSignInPhone(num);
              }}
              required
              pattern="\d{10}"
              title="Phone number must be exactly 10 digits"
              style={inputStyle}
              placeholder="10-digit Mobile Number"
            />
            {signInPhone.length > 0 && signInPhone.length < 10 && (
              <span style={{ fontSize: "0.75rem", color: "var(--error-color)", marginTop: 4, display: "block" }}>
                Must be 10 digits ({signInPhone.length}/10)
              </span>
            )}
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
            SIGN UP FORM (Full Intake)
            ===================================================================== */
        <form onSubmit={handleSignUp}>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px 0", textAlign: "center" }}>
            {lang === "bn"
              ? "মূল্যায়ন শুরু করতে নীচের সমস্ত বিবরণ পূরণ করুন।"
              : "Please fill in your details to register for the assessment."}
          </p>

          {/* Row 1: Full Name & Username */}
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
                {lang === "bn" ? "ব্যবহারকারীর নাম / USERNAME" : "USERNAME"} <span style={{ color: "var(--error-color)" }}>*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.trim().toLowerCase())}
                required
                minLength={3}
                style={inputStyle}
                placeholder="e.g. nihal_sarin"
              />
              {username.length > 0 && username.length < 3 && (
                <span style={{ fontSize: "0.75rem", color: "var(--error-color)", marginTop: 4, display: "block" }}>
                  Must be at least 3 characters
                </span>
              )}
            </div>
          </div>

          {/* Row 2: Phone Number + Aadhaar (Optional) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>
                {lang === "bn" ? "ফোন নম্বর / PHONE NUMBER" : "PHONE NUMBER"} <span style={{ color: "var(--error-color)" }}>*</span>
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
                {lang === "bn" ? "আধার কার্ড নম্বর (ঐচ্ছিক) / AADHAAR (OPTIONAL)" : "AADHAAR CARD NUMBER (OPTIONAL)"}
              </label>
              <input
                type="text"
                value={idNum}
                onChange={(e) => {
                  const num = e.target.value.replace(/\D/g, "");
                  if (num.length <= 12) setIdNum(num);
                }}
                pattern="\d{12}"
                title="Aadhaar Card Number must be exactly 12 digits if provided"
                style={inputStyle}
                placeholder="12-digit Aadhaar (Optional)"
              />
              {idNum.length > 0 && idNum.length < 12 && (
                <span style={{ fontSize: "0.75rem", color: "var(--error-color)", marginTop: 4, display: "block" }}>
                  Must be 12 digits if provided ({idNum.length}/12)
                </span>
              )}
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
              {lang === "bn" ? "প্রবেশ করুন (Sign In)" : "Sign In with your Username/Phone"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
