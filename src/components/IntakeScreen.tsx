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
  const { setSessionId, loginParticipant, state, setLanguage } = useAppContext();
  const lang = state.language;

  // Language translation helper
  const t = (en: string, bn: string, hi: string, mr: string) => {
    if (lang === "bn") return bn;
    if (lang === "hi") return hi;
    if (lang === "mr") return mr;
    return en;
  };

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
      <div style={{ textAlign: "center", marginBottom: 16 }}>
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
          NeuroCogniLab Portal
        </h2>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          {t(
            "AIIMS Kalyani • Neurocognitive Assessment Battery",
            "AIIMS কল্যাণী • স্নায়ুবৌদ্ধিক মূল্যায়ন প্ল্যাটফর্ম",
            "एम्स कल्याणी • न्यूरोकोग्निटिव मूल्यांकन प्लेटफॉर्म",
            "एम्स कल्याणी • न्यूरोकोग्निटिव्ह मूल्यमापन व्यासपीठ"
          )}
        </p>
      </div>

      {/* Language Selector Pills */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { code: "en" as const, label: "English" },
          { code: "hi" as const, label: "हिन्दी" },
          { code: "mr" as const, label: "मराठी" },
          { code: "bn" as const, label: "বাংলা" },
        ].map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setLanguage(item.code)}
            style={{
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 20,
              border: lang === item.code ? "1.5px solid var(--accent-color)" : "1px solid var(--card-border)",
              backgroundColor: lang === item.code ? "#eff6ff" : "#ffffff",
              color: lang === item.code ? "var(--accent-color)" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {item.label}
          </button>
        ))}
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
          <span>🔑</span> {t("Sign In", "প্রবেশ করুন (Sign In)", "लॉग इन करें (Sign In)", "लॉग इन करा (Sign In)")}
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
          <span>📝</span> {t("New Sign Up", "নতুন নিবন্ধন (Sign Up)", "नया पंजीकरण (Sign Up)", "नवीन नोंदणी (Sign Up)")}
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
              {t(
                "Enter your Username and 10-digit Phone Number to access your assessment profile.",
                "অধিবেশন চালিয়ে যেতে আপনার ব্যবহারকারীর নাম এবং ১০-সংখ্যার ফোন নম্বর লিখুন।",
                "सत्र जारी रखने के लिए अपना यूज़रनेम और 10-अंकों का फ़ोन नंबर दर्ज करें।",
                "सत्र सुरू ठेवण्यासाठी तुमचे युझरनेम आणि १०-अंकी फोन नंबर प्रविष्ट करा."
              )}
            </p>
          </div>

          {/* Username */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>
              {t("USERNAME", "ব্যবহারকারীর নাম / USERNAME", "यूज़रनेम / USERNAME", "युझरनेम / USERNAME")}{" "}
              <span style={{ color: "var(--error-color)" }}>*</span>
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
              {t("PHONE NUMBER", "ফোন নম্বর / PHONE NUMBER", "फ़ोन नंबर / PHONE NUMBER", "फोन नंबर / PHONE NUMBER")}{" "}
              <span style={{ color: "var(--error-color)" }}>*</span>
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
              ? t("Signing in...", "যাচাই করা হচ্ছে...", "सत्यापित किया जा रहा है...", "पडताळणी होत आहे...")
              : t("Sign In & Continue Assessment", "প্রবেশ করুন / Sign In", "प्रवेश करें / Sign In", "प्रवेश करा / Sign In")}
          </button>

          {/* Switch to Sign Up */}
          <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "#64748b" }}>
            {t("Don't have an account yet? ", "অ্যাকাউন্ট নেই? ", "खाता नहीं है? ", "खाते नाही का? ")}
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
              {t("Register / Sign Up here", "নতুন নিবন্ধন করুন (Sign Up)", "नया पंजीकरण करें (Sign Up)", "नवीन नोंदणी करा (Sign Up)")}
            </button>
          </div>
        </form>
      ) : (
        /* =====================================================================
            SIGN UP FORM (Full Intake)
            ===================================================================== */
        <form onSubmit={handleSignUp}>
          <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px 0", textAlign: "center" }}>
            {t(
              "Please fill in your details to register for the assessment.",
              "মূল্যায়ন শুরু করতে নীচের সমস্ত বিবরণ পূরণ করুন।",
              "मूल्यांकन शुरू करने के लिए कृपया अपना विवरण भरें।",
              "मूल्यांकन सुरू करण्यासाठी कृपया आपले तपशील भरा."
            )}
          </p>

          {/* Row 1: Full Name & Username */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>
                {t("FULL NAME", "নাম / NAME", "पूरा नाम / FULL NAME", "पूर्ण नाव / FULL NAME")}{" "}
                <span style={{ color: "var(--error-color)" }}>*</span>
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
                {t("USERNAME", "ব্যবহারকারীর নাম / USERNAME", "यूज़रनेम / USERNAME", "युझरनेम / USERNAME")}{" "}
                <span style={{ color: "var(--error-color)" }}>*</span>
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
                {t("PHONE NUMBER", "ফোন নম্বর / PHONE NUMBER", "फ़ोन नंबर / PHONE NUMBER", "फोन नंबर / PHONE NUMBER")}{" "}
                <span style={{ color: "var(--error-color)" }}>*</span>
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
                {t(
                  "AADHAAR CARD NUMBER (OPTIONAL)",
                  "আধার কার্ড নম্বর (ঐচ্ছিক) / AADHAAR (OPTIONAL)",
                  "आधार कार्ड नंबर (वैकल्पिक) / AADHAAR (OPTIONAL)",
                  "आधार कार्ड क्रमांक (पर्यायी) / AADHAAR (OPTIONAL)"
                )}
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
                {t("AGE", "বয়স / AGE", "आयु / AGE", "वय / AGE")}{" "}
                <span style={{ color: "var(--error-color)" }}>*</span>
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
                {t("GENDER", "লিঙ্গ / GENDER", "लिंग / GENDER", "लिंग / GENDER")}{" "}
                <span style={{ color: "var(--error-color)" }}>*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
                style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
              >
                <option value="" disabled>
                  {t("-- Select / Choose --", "-- Select / নির্বাচন করুন --", "-- चुनें / Select --", "-- निवडा / Select --")}
                </option>
                <option value="Male">{t("Male", "পুরুষ / Male", "पुरुष / Male", "पुरुष / Male")}</option>
                <option value="Female">{t("Female", "মহিলা / Female", "महिला / Female", "महिला / Female")}</option>
                <option value="Other">{t("Other", "অন্যান্য / Other", "अन्य / Other", "इतर / Other")}</option>
              </select>
            </div>
          </div>

          {/* Row 4: Class + School */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>
                {t("CLASS / BATCH", "শ্রেণী / CLASS", "कक्षा / CLASS", "वर्ग / CLASS")}{" "}
                <span style={{ color: "var(--error-color)" }}>*</span>
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
                {t("SCHOOL / INSTITUTION", "বিদ্যালয় / SCHOOL NAME", "विद्यालय / संस्था / SCHOOL NAME", "शाळा / संस्था / SCHOOL NAME")}{" "}
                <span style={{ color: "var(--error-color)" }}>*</span>
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
              {t("RESIDENTIAL ADDRESS", "ঠিকানা / ADDRESS", "आवासीय पता / ADDRESS", "पत्ता / ADDRESS")}{" "}
              <span style={{ color: "var(--error-color)" }}>*</span>
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
                  {t(
                    "INFORMED CONSENT",
                    "সম্মতি / INFORMED CONSENT",
                    "सहमति / INFORMED CONSENT",
                    "संमती / INFORMED CONSENT"
                  )}{" "}
                  <span style={{ color: "var(--error-color)" }}>*</span>
                </p>
                {lang === "bn" && (
                  <p style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    lineHeight: 1.45,
                    color: "var(--text-secondary)",
                  }}>
                    আমি স্বেচ্ছায় এই স্নায়ুবৌদ্ধিক মূল্যায়নে অংশগ্রহণ করতে সম্মত। আমি বুঝতে পারছি
                    যে আমার তথ্য গবেষণার উদ্দেশ্যে সংগ্রহ করা হবে এবং গোপনীয় রাখা হবে।
                  </p>
                )}
                {lang === "hi" && (
                  <p style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    lineHeight: 1.45,
                    color: "var(--text-secondary)",
                  }}>
                    मैं स्वेच्छा से इस न्यूरोकोग्निटिव मूल्यांकन में भाग लेने के लिए सहमति देता/देती हूँ। मैं समझता/समझती हूँ
                    कि मेरा डेटा शोध के उद्देश्यों के लिए एकत्र किया जाएगा और गोपनीय रखा जाएगा।
                  </p>
                )}
                {lang === "mr" && (
                  <p style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    lineHeight: 1.45,
                    color: "var(--text-secondary)",
                  }}>
                    मी स्वेच्छेने या न्यूरोकोग्निटिव्ह मूल्यमापनात सहभागी होण्यास संमती देतो/देते. मला समजले आहे
                    की माझा डेटा संशोधन हेतूने गोळा केला जाईल आणि गोपनीय ठेवला जाईल.
                  </p>
                )}
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
              ? t("Registering...", "নিবন্ধন করা হচ্ছে...", "पंजीकरण किया जा रहा है...", "नोंदणी होत आहे...")
              : t("Create Account & Start Assessment", "নিবন্ধন করুন এবং শুরু করুন", "खाता बनाएं और मूल्यांकन शुरू करें", "खाते तयार करा आणि मूल्यांकन सुरू करा")}
          </button>

          {/* Switch to Sign In */}
          <div style={{ marginTop: 18, textAlign: "center", fontSize: 13, color: "#64748b" }}>
            {t("Already registered? ", "ইতিমধ্যে অ্যাকাউন্ট আছে? ", "पहले से पंजीकृत हैं? ", "आधीच नोंदणी केली आहे? ")}
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
              {t("Sign In with your Username/Phone", "প্রবেশ করুন (Sign In)", "लॉग इन करें (Sign In)", "लॉग इन करा (Sign In)")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
