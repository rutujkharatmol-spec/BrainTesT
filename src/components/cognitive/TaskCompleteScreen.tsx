"use client";

import React, { useEffect, useState } from "react";

export type CalculatedParams = {
  param1Name?: string | null;
  param1Value?: number | null;
  param2Name?: string | null;
  param2Value?: number | null;
  param3Name?: string | null;
  param3Value?: number | null;
} | null;

const CONFETTI_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function TaskCompleteScreen({
  calculatedParams,
  submitting,
  language,
  onContinue,
  queuedOffline = false,
}: {
  calculatedParams: CalculatedParams;
  submitting: boolean;
  language: "en" | "bn";
  onContinue: () => void;
  queuedOffline?: boolean;
}) {
  const isBn = language === "bn";
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const rows = calculatedParams
    ? ([
        [calculatedParams.param1Name, calculatedParams.param1Value],
        [calculatedParams.param2Name, calculatedParams.param2Value],
        [calculatedParams.param3Name, calculatedParams.param3Value],
      ] as const).filter(([name]) => Boolean(name))
    : [];

  // Generate dynamic celebration title based on result
  let celebrationTitle = isBn ? "দারুণ কাজ! 🌟" : "Awesome Job! 🌟";
  let achievementBadge = isBn ? "ব্রেন চ্যালেঞ্জ মাস্টার 🧠" : "Brain Quest Master 🧠";

  if (rows.length > 0) {
    const firstVal = rows[0][1];
    if (typeof firstVal === "number") {
      if (firstVal < 450) {
        achievementBadge = isBn ? "বিদ্যুৎ গতি রিফ্লেক্স ⚡" : "Lightning Reflexes ⚡";
      } else if (firstVal < 650) {
        achievementBadge = isBn ? "সুপার ফোকাস চ্যাম্পিয়ন 🎯" : "Super Focus Champion 🎯";
      } else {
        achievementBadge = isBn ? "সুনির্দিষ্ট মনোযোগ 🌟" : "Precision Mind 🌟";
      }
    }
  }

  return (
    <>
      {/* Confetti Explosion */}
      {showConfetti && (
        <div className="confetti-container" aria-hidden="true">
          {Array.from({ length: 36 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${(i / 36) * 100}%`,
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDelay: `${(i % 5) * 0.2}s`,
                animationDuration: `${2.4 + (i % 4) * 0.4}s`,
                width: `${8 + (i % 6)}px`,
                height: `${12 + (i % 6)}px`,
              }}
            />
          ))}
        </div>
      )}

      <div
        className="card"
        style={{
          maxWidth: 620,
          margin: "auto",
          textAlign: "center",
          borderRadius: 18,
          padding: "32px 28px",
          boxShadow: "0 20px 30px -10px rgba(0, 0, 0, 0.08)",
          border: "1px solid #E2E8F0",
          background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
        }}
      >
        {/* Animated Trophy Icon */}
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FEF08A 0%, #FDE047 50%, #F59E0B 100%)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 38,
            boxShadow: "0 8px 24px rgba(245, 158, 11, 0.35)",
            marginBottom: 16,
            animation: "stimulus-pop 0.6s ease",
          }}
        >
          🏆
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", margin: "0 0 6px 0" }}>
          {celebrationTitle}
        </h2>

        {/* Gamified Achievement Tag */}
        <div style={{ display: "inline-block", marginBottom: 20 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 800,
              backgroundColor: "#ECFDF5",
              color: "#047857",
              border: "1px solid #A7F3D0",
              boxShadow: "0 2px 6px rgba(16, 185, 129, 0.15)",
            }}
          >
            {achievementBadge}
          </span>
        </div>

        <p style={{ color: "#64748B", fontSize: 14, margin: "0 0 20px 0" }}>
          {isBn
            ? "আপনি সফলভাবে এই কগনিটিভ পরীক্ষাটি শেষ করেছেন। আপনার ফলাফল রেকর্ড করা হয়েছে।"
            : "You have successfully finished this challenge. Your reaction data is safely saved."}
        </p>

        {/* Results Overview Cards */}
        {rows.length > 0 && (
          <div
            style={{
              textAlign: "left",
              background: "#FFFFFF",
              padding: "18px 20px",
              borderRadius: 14,
              border: "1px solid #E2E8F0",
              margin: "0 0 24px 0",
              boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
                borderBottom: "1px solid #F1F5F9",
                paddingBottom: 10,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1E293B", display: "flex", alignItems: "center", gap: 6 }}>
                <span>📊</span> {isBn ? "ফলাফল সংক্ষেপ" : "Performance Metrics"}
              </h3>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", backgroundColor: "#ECFDF5", padding: "2px 8px", borderRadius: 10 }}>
                {isBn ? "রেকর্ড সম্পন্ন" : "Recorded"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rows.map(([name, value], idx) => (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 12px",
                    borderRadius: 8,
                    backgroundColor: idx % 2 === 0 ? "#F8FAFC" : "#FFFFFF",
                  }}
                >
                  <span style={{ color: "#475569", fontSize: 13, fontWeight: 600 }}>{name}:</span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#0F172A",
                      backgroundColor: "#EFF6FF",
                      padding: "2px 8px",
                      borderRadius: 6,
                      border: "1px solid #DBEAFE",
                    }}
                  >
                    {value === null || value === undefined ? "—" : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submission Status */}
        {submitting ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "20px 0" }}>
            <span style={{ fontSize: 18 }}>⏳</span>
            <span style={{ color: "#1E40AF", fontWeight: 700, fontSize: 14 }}>
              {isBn ? "ডেটা আপলোড করা হচ্ছে... অপেক্ষা করুন।" : "Saving your results..."}
            </span>
          </div>
        ) : (
          <div>
            {queuedOffline ? (
              <p style={{ color: "#B45309", fontWeight: 700, fontSize: 13, marginBottom: 20 }}>
                📡 {isBn
                  ? "এই ডিভাইসে সংরক্ষিত হয়েছে। অনলাইন হলে আপলোড হবে।"
                  : "Saved offline on this device. Will sync automatically once online."}
              </p>
            ) : (
              <p style={{ color: "#059669", fontWeight: 700, fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span>✓</span> {isBn ? "সার্ভারে সফলভাবে সংরক্ষিত হয়েছে!" : "Safely uploaded to the database!"}
              </p>
            )}

            {/* Action Continue Button */}
            <button
              type="button"
              onClick={onContinue}
              className="btn"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "1.05rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                transition: "transform 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
            >
              <span>{isBn ? "পরবর্তী চ্যালেঞ্জে যান" : "Continue to Brain Hub"}</span>
              <span>🚀</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
