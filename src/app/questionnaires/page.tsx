"use client";

import React, { useState } from "react";
import { useAppContext } from "@/components/AppContext";
import IntakeScreen from "@/components/IntakeScreen";
import { QUESTIONNAIRES } from "@/config/questionnaires";
import QuestionnaireViewer from "@/components/QuestionnaireViewer";
import FinalScreen from "@/components/FinalScreen";
import Link from "next/link";

export default function QuestionnairesPage() {
  const { state, markTestCompleted } = useAppContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  return (
    <div style={{ paddingTop: "50px" }}>
      <div className="card" style={{ maxWidth: 800, margin: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingBottom: 16, borderBottom: "1px solid var(--card-border)" }}>
          <div>
            <h2>Questionnaires Hub</h2>
            <p style={{ margin: 0 }}>Participant: {state.participantName} ({state.participantIdNumber})</p>
          </div>
          <Link href="/" style={{ textDecoration: "none" }}>
            <button className="btn btn-outline">
              Back to Cognitive Hub
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
                  onClick={() => { if (!isCompleted) setSelectedId(q.id); }}
                  style={{ 
                    background: isCompleted ? "#F9FAFB" : "#FFFFFF", 
                    padding: 16, 
                    borderRadius: 8, 
                    border: "1px solid var(--card-border)",
                    transition: "transform 150ms, box-shadow 150ms",
                    cursor: isCompleted ? "default" : "pointer",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    opacity: isCompleted ? 0.5 : 1,
                    boxShadow: isCompleted ? "none" : "0 2px 4px rgba(0,0,0,0.02)"
                  }}
                  onMouseOver={(e) => { if (!isCompleted) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"; } }}
                  onMouseOut={(e) => { if (!isCompleted) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"; } }}
                >
                  <h3 style={{ fontSize: "1.1rem", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    {q.title}
                    {isCompleted && <span style={{ color: "var(--success-color)", fontSize: "1.2rem", flexShrink: 0 }}>✓</span>}
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--accent-color)", opacity: 0.8 }}>
                    {q.items.length} questions
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
