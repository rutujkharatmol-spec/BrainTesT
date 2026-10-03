"use client";

import React, { useState, useEffect } from "react";
import { useAppContext } from "@/components/AppContext";
import IntakeScreen from "@/components/IntakeScreen";
import { QUESTIONNAIRES } from "@/config/questionnaires";
import QuestionnaireViewer from "@/components/QuestionnaireViewer";
import FinalScreen from "@/components/FinalScreen";
import Link from "next/link";

export default function QuestionnairesPage() {
  const { state, markTestCompleted } = useAppContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem("neuroCogniLabSplashSeen", "1");
    } catch {
      // ignore
    }
  }, []);

  if (!state.sessionId) {
    return (
      <div style={{ paddingTop: "50px" }}>
        <IntakeScreen />
      </div>
    );
  }

  const selectedQuestionnaire = QUESTIONNAIRES.find(q => q.id === selectedId);

  if (selectedQuestionnaire) {
    return (
      <div style={{ paddingTop: "50px" }}>
        <QuestionnaireViewer 
          questionnaire={selectedQuestionnaire} 
          onComplete={() => {
            markTestCompleted(selectedQuestionnaire.id);
            setSelectedId(null); // Return to hub after completion
          }} 
        />
      </div>
    );
  }

  const allCompleted = QUESTIONNAIRES.every(q => state.completedTests.includes(q.id));

  const t = (en: string, bn: string, hi: string, mr: string) => {
    switch (state.language) {
      case "bn": return bn;
      case "hi": return hi;
      case "mr": return mr;
      default: return en;
    }
  };

  const getLocalized = (obj: any, field: string) => {
    if (state.language === "bn" && obj[`${field}_bn`]) return obj[`${field}_bn`];
    if (state.language === "hi" && obj[`${field}_hi`]) return obj[`${field}_hi`];
    if (state.language === "mr" && obj[`${field}_mr`]) return obj[`${field}_mr`];
    return obj[field];
  };

  return (
    <div style={{ paddingTop: "50px" }}>
      <div className="card" style={{ maxWidth: 800, margin: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingBottom: 16, borderBottom: "1px solid var(--card-border)" }}>
          <div>
            <h2>{t("Questionnaires Hub", "প্রশ্নাবলী হাব", "प्रश्नावली हब", "प्रश्नावली हब")}</h2>
            <p style={{ margin: 0 }}>
              {t("Participant:", "অংশগ্রহণকারী:", "प्रतिभागी:", "सहभागी:")} <strong>{state.participantName}</strong>
              {state.username && <span style={{ marginLeft: 6, color: "var(--text-secondary)" }}>(@{state.username})</span>}
              {state.participantIdNumber && <span style={{ marginLeft: 6, color: "var(--text-secondary)" }}>• (Aadhaar: {state.participantIdNumber})</span>}
            </p>
          </div>
          <Link href="/" style={{ textDecoration: "none" }}>
            <button className="btn btn-outline">
              {t("Back to Cognitive Hub", "কগনিটিভ হাবে ফিরে যান", "संज्ञानात्मक हब पर वापस", "संज्ञानात्मक हबवर परत")}
            </button>
          </Link>
        </div>

        {allCompleted ? (
          <FinalScreen />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {QUESTIONNAIRES.map((q) => {
              const isCompleted = state.completedTests.includes(q.id);
              return (
                <div 
                  key={q.id} 
                  onClick={() => setSelectedId(q.id)}
                  style={{ 
                    background: isCompleted ? "#F9FAFB" : "#FFFFFF", 
                    padding: 16, 
                    borderRadius: 8, 
                    border: "1px solid var(--card-border)",
                    transition: "transform 150ms, box-shadow 150ms",
                    cursor: "pointer",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    opacity: 1,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"; }}
                >
                  <h3 style={{ fontSize: "1.1rem", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    {getLocalized(q, "title")}
                    {isCompleted && <span style={{ color: "var(--success-color)", fontSize: "1.2rem", flexShrink: 0 }}>✓</span>}
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--accent-color)", opacity: 0.8 }}>
                    {q.items.length} {t("questions", "টি প্রশ্ন", "प्रश्न", "प्रश्न")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
