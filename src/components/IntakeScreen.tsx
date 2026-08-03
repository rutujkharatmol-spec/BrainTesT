"use client";

import React, { useState } from "react";
import { useAppContext } from "./AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 8,
  border: "1px solid var(--card-border)",
  fontSize: "0.95rem",
  background: "#FFFFFF",
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.2s",
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
  const { setSessionId, setConsentGiven } = useAppContext();

  const [name, setName] = useState("");
  const [idNum, setIdNum] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const isFormValid =
    name.trim() &&
    idNum.trim() &&
    age.trim() &&
    gender &&
    studentClass.trim() &&
    schoolName.trim() &&
    address.trim() &&
    phoneNo.length === 10 &&
    consent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      const res = await fetchWithOfflineSync("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName: name,
          participantIdNumber: idNum,
          age: parseInt(age),
          gender,
          studentClass,
          schoolName,
          address,
          phoneNo,
        }),
      });

      const data = await res.json();
      if (data.sessionId) {
        setSessionId(data.sessionId, name, idNum);
        setConsentGiven(true);
      } else if (data.offline) {
        const offlineSessionId = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setSessionId(offlineSessionId, name, idNum);
        setConsentGiven(true);
      } else {
        alert("Failed to start session. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 600, margin: "auto" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ marginBottom: 4 }}>Participant Registration</h2>
        <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-secondary)" }}>
          অংশগ্রহণকারী নিবন্ধন
        </p>
        <p style={{ marginTop: 12, fontSize: "0.85rem" }}>
          Please fill in all details below to begin the assessment.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Row 1: Name + ID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>নাম / NAME <span style={{ color: "var(--error-color)" }}>*</span></label>
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
            <label style={labelStyle}>ID NUMBER <span style={{ color: "var(--error-color)" }}>*</span></label>
            <input
              type="text"
              value={idNum}
              onChange={(e) => setIdNum(e.target.value)}
              required
              style={inputStyle}
              placeholder="e.g. 123456"
            />
          </div>
        </div>

        {/* Row 2: Age + Gender */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>বয়স / AGE <span style={{ color: "var(--error-color)" }}>*</span></label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
              min={1}
              max={120}
              style={inputStyle}
              placeholder="e.g. 25"
            />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>লিঙ্গ / GENDER <span style={{ color: "var(--error-color)" }}>*</span></label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
              style={{
                ...inputStyle,
                cursor: "pointer",
                appearance: "auto",
              }}
            >
              <option value="" disabled>-- Select / নির্বাচন করুন --</option>
              <option value="Male">পুরুষ / Male</option>
              <option value="Female">মহিলা / Female</option>
              <option value="Other">অন্যান্য / Other</option>
            </select>
          </div>
        </div>

        {/* Row 3: Class + School */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>শ্রেণী / CLASS <span style={{ color: "var(--error-color)" }}>*</span></label>
            <input
              type="text"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              required
              style={inputStyle}
              placeholder="e.g. Class 10"
            />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>SCHOOL NAME <span style={{ color: "var(--error-color)" }}>*</span></label>
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

        {/* Row 4: Address + Phone */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>ঠিকানা / ADDRESS <span style={{ color: "var(--error-color)" }}>*</span></label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              style={inputStyle}
              placeholder="e.g. Kalyani, Nadia, West Bengal"
            />
          </div>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>PHONE NO <span style={{ color: "var(--error-color)" }}>*</span></label>
            <input
              type="tel"
              value={phoneNo}
              onChange={(e) => {
                // Remove non-numeric characters
                const numericValue = e.target.value.replace(/\D/g, "");
                if (numericValue.length <= 10) {
                  setPhoneNo(numericValue);
                }
              }}
              required
              pattern="\d{10}"
              title="Phone number must be exactly 10 digits"
              style={inputStyle}
              placeholder="e.g. 9876543210"
            />
            {phoneNo.length > 0 && phoneNo.length < 10 && (
              <span style={{ fontSize: "0.75rem", color: "var(--error-color)", marginTop: 4, display: "block" }}>
                Must be 10 digits
              </span>
            )}
          </div>
        </div>

        {/* Consent Section */}
        <div
          style={{
            marginTop: 8,
            marginBottom: 20,
            padding: 16,
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
                width: 20,
                height: 20,
                marginTop: 2,
                accentColor: "var(--accent-color)",
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
            <div>
              <p style={{
                margin: 0,
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 6,
              }}>
                সম্মতি / CONSENT <span style={{ color: "var(--error-color)" }}>*</span>
              </p>
              <p style={{
                margin: 0,
                fontSize: "0.82rem",
                lineHeight: 1.5,
                color: "var(--text-secondary)",
              }}>
                আমি স্বেচ্ছায় এই স্নায়ুবৌদ্ধিক মূল্যায়নে অংশগ্রহণ করতে সম্মত। আমি বুঝতে পারছি
                যে আমার তথ্য গবেষণার উদ্দেশ্যে সংগ্রহ করা হবে এবং গোপনীয় রাখা হবে।
              </p>
              <p style={{
                margin: 0,
                marginTop: 6,
                fontSize: "0.82rem",
                lineHeight: 1.5,
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
          disabled={!isFormValid || loading}
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "1.05rem",
            opacity: isFormValid ? 1 : 0.5,
          }}
        >
          {loading ? "Starting... / শুরু হচ্ছে..." : "Begin Assessment / মূল্যায়ন শুরু করুন"}
        </button>

        {!consent && (
          <p style={{
            textAlign: "center",
            marginTop: 10,
            marginBottom: 0,
            fontSize: "0.8rem",
            color: "var(--warning-color)",
            fontWeight: 500,
          }}>
            ⚠ You must provide consent to participate / অংশগ্রহণের জন্য সম্মতি প্রয়োজন
          </p>
        )}
      </form>
    </div>
  );
}
