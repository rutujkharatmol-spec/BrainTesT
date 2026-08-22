"use client";

import React from "react";

export type CalculatedParams = {
  param1Name?: string | null;
  param1Value?: number | null;
  param2Name?: string | null;
  param2Value?: number | null;
  param3Name?: string | null;
  param3Value?: number | null;
} | null;

/**
 * Shared end-of-task screen for every cognitive task.
 *
 * Previously each task inlined its own version of this, which is how four of
 * them ended up with no Continue button at all — they relied on an automatic
 * redirect that fired 200ms after submission, so participants never saw their
 * results. Keeping it in one place stops that drift.
 */
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
  /** Result is only stored on this device so far — not yet on the server. */
  queuedOffline?: boolean;
}) {
  const rows = calculatedParams
    ? ([
        [calculatedParams.param1Name, calculatedParams.param1Value],
        [calculatedParams.param2Name, calculatedParams.param2Value],
        [calculatedParams.param3Name, calculatedParams.param3Value],
      ] as const).filter(([name]) => Boolean(name))
    : [];

  return (
    <div className="card" style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
      <h2>{language === "bn" ? "টাস্ক সম্পন্ন হয়েছে!" : "Task Completed!"}</h2>

      {rows.length > 0 && (
        <div
          style={{
            textAlign: "left",
            background: "#F9FAFB",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid var(--card-border)",
            margin: "24px 0",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 16, borderBottom: "1px solid #eaeaea", paddingBottom: 12 }}>
            {language === "bn" ? "ফলাফল" : "Result Overview"}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rows.map(([name, value]) => (
              <div key={name} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "var(--text-secondary)" }}>{name}:</span>
                {/* null means the task could not compute this metric (e.g. no
                    valid trials in a condition) — show it rather than a fake 0. */}
                <strong>{value === null || value === undefined ? "—" : value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {submitting ? (
        <p style={{ color: "var(--accent-color)", fontWeight: "bold" }}>
          {language === "bn" ? "ডেটা আপলোড করা হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন।" : "Uploading data... please wait."}
        </p>
      ) : (
        <div>
          {/* Never claim the server has the data when it is only queued locally. */}
          {queuedOffline ? (
            <p style={{ color: "#B45309", fontWeight: "bold", marginBottom: 24 }}>
              {language === "bn"
                ? "এই ডিভাইসে সংরক্ষিত হয়েছে। ইন্টারনেট সংযোগ ফিরে এলে আপলোড হবে।"
                : "Saved on this device. It will upload automatically when you are back online."}
            </p>
          ) : (
            <p style={{ color: "var(--success-color)", fontWeight: "bold", marginBottom: 24 }}>
              {language === "bn" ? "সফলভাবে সংরক্ষিত হয়েছে!" : "Successfully saved!"}
            </p>
          )}
          <button className="btn" onClick={onContinue} style={{ width: "100%" }}>
            {language === "bn" ? "ফিরে যান / চালিয়ে যান" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
