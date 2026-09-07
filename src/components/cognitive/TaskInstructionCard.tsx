"use client";

import React from "react";

export type TaskControlItem = {
  key: string;
  action: string;
  color?: string;
};

export type TaskInstructionCardProps = {
  title: string;
  subtitle?: string;
  icon?: string;
  category?: string;
  language: "en" | "bn";
  mission: string;
  visualExample?: React.ReactNode;
  rules: { text: string; highlight?: boolean; icon?: string }[];
  controls: TaskControlItem[];
  tip?: string;
  onStart: () => void;
  startBtnText?: string;
};

export default function TaskInstructionCard({
  title,
  subtitle,
  icon = "🎯",
  category,
  language,
  mission,
  visualExample,
  rules,
  controls,
  tip,
  onStart,
  startBtnText,
}: TaskInstructionCardProps) {
  const isBn = language === "bn";

  return (
    <div
      className="card"
      style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: "24px 28px",
        borderRadius: 16,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
        border: "1px solid #E2E8F0",
        background: "#FFFFFF",
      }}
    >
      {/* Header Banner */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            boxShadow: "0 4px 12px rgba(30, 64, 175, 0.25)",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0F172A" }}>
              {title}
            </h2>
            {category && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: "#EFF6FF",
                  color: "#1E40AF",
                  padding: "3px 9px",
                  borderRadius: 12,
                  border: "1px solid #BFDBFE",
                }}
              >
                {category}
              </span>
            )}
          </div>
          {subtitle && (
            <p style={{ margin: "3px 0 0 0", fontSize: 13, color: "#64748B", fontWeight: 500 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Mission Box */}
      <div
        style={{
          background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)",
          border: "1px solid #BFDBFE",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 20,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 22, marginTop: 1 }}>🎯</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#1E40AF", letterSpacing: 0.5 }}>
            {isBn ? "আপনার লক্ষ্য (MISSION)" : "YOUR MISSION"}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginTop: 2, lineHeight: 1.4 }}>
            {mission}
          </div>
        </div>
      </div>

      {/* Visual Example (If provided) */}
      {visualExample && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 }}>
            {isBn ? "👀 ভিজ্যুয়াল উদাহরণ (HOW IT WORKS)" : "👀 HOW IT WORKS"}
          </div>
          {visualExample}
        </div>
      )}

      {/* Rules / Steps List */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 }}>
          {isBn ? "📋 নির্দেশাবলী (RULES)" : "📋 RULES TO FOLLOW"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rules.map((rule, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 8,
                backgroundColor: rule.highlight ? "#FEF2F2" : "#F8FAFC",
                border: `1px solid ${rule.highlight ? "#FECACA" : "#E2E8F0"}`,
                fontSize: 13,
                fontWeight: rule.highlight ? 700 : 500,
                color: rule.highlight ? "#991B1B" : "#1E293B",
              }}
            >
              <span>{rule.icon || (rule.highlight ? "⚠️" : "👉")}</span>
              <span style={{ flex: 1 }}>{rule.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls & Keys Guide */}
      <div
        style={{
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: 0.5 }}>
            🎮 {isBn ? "নিয়ন্ত্রণ (CONTROLS)" : "CONTROLS"}
          </span>
          <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>
            {isBn ? "কীবোর্ড কী অথবা স্ক্রিন বোতামে ক্লিক করুন" : "Use keyboard keys OR click/tap buttons"}
          </span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {controls.map((ctrl, i) => (
            <div
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 8,
                backgroundColor: "#FFFFFF",
                border: "1px solid #CBD5E1",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              }}
            >
              <span className="keycap">{ctrl.key}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: ctrl.color || "#0F172A" }}>
                {ctrl.action}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pro Tip */}
      {tip && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "#64748B",
            fontWeight: 600,
            marginBottom: 20,
            padding: "8px 12px",
            borderRadius: 8,
            backgroundColor: "#FFFBEB",
            border: "1px solid #FDE68A",
          }}
        >
          <span>💡</span>
          <span>{tip}</span>
        </div>
      )}

      {/* Action Button */}
      <button
        type="button"
        onClick={onStart}
        className="btn"
        style={{
          width: "100%",
          padding: "14px",
          fontSize: "1.1rem",
          fontWeight: 800,
          background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)",
          color: "#FFFFFF",
          borderRadius: 10,
          border: "none",
          boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 6px 18px rgba(37, 99, 235, 0.45)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(37, 99, 235, 0.35)";
        }}
      >
        <span>🚀</span>
        <span>{startBtnText || (isBn ? "চ্যালেঞ্জ শুরু করুন" : "Start Challenge")}</span>
      </button>
    </div>
  );
}
