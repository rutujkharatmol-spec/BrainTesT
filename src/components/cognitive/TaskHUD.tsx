"use client";

import React from "react";

type TaskHUDProps = {
  title: string;
  icon?: string;
  currentTrial: number;
  totalTrials: number;
  language?: "en" | "bn";
  category?: string;
  customProgressLabel?: string;
};

export default function TaskHUD({
  title,
  icon = "🧠",
  currentTrial,
  totalTrials,
  language = "en",
  category,
  customProgressLabel,
}: TaskHUDProps) {
  const percent = totalTrials > 0 
    ? Math.min(100, Math.max(0, Math.round(((currentTrial) / totalTrials) * 100))) 
    : 0;

  return (
    <div className="task-hud-container">
      <div className="task-hud-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ color: "#0F172A", fontWeight: 800 }}>{title}</span>
          {category && (
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 12,
                backgroundColor: "#EFF6FF",
                color: "#1E40AF",
                fontWeight: 700,
                border: "1px solid #BFDBFE",
              }}
            >
              {category}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {customProgressLabel ? (
            <span style={{ color: "#0F172A", fontWeight: 800, fontSize: 13 }}>
              {customProgressLabel}
            </span>
          ) : (
            <>
              <span style={{ color: "#64748B", fontSize: 12 }}>
                {language === "bn" ? "অগ্রগতি:" : "Progress:"}
              </span>
              <span style={{ color: "#0F172A", fontWeight: 800 }}>
                {currentTrial} / {totalTrials}
              </span>
              <span style={{ fontSize: 11, color: "#059669", fontWeight: 700, marginLeft: 4 }}>
                ({percent}%)
              </span>
            </>
          )}
        </div>
      </div>
      <div className="task-progress-bar">
        <div
          className="task-progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
