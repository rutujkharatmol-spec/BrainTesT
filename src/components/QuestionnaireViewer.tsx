"use client";

import React, { useState } from "react";
import { QuestionnaireDef } from "@/config/questionnaires";
import { useAppContext } from "./AppContext";

export default function QuestionnaireViewer({ questionnaire, onComplete }: { questionnaire: QuestionnaireDef, onComplete: () => void }) {
  const { state } = useAppContext();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const isComplete = questionnaire.items.every(q => answers[q.id] !== undefined);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          questionnaireId: questionnaire.id,
          answers
        })
      });
      onComplete();
    } catch (e) {
      console.error(e);
      alert("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 800, margin: "auto" }}>
      <h2>{questionnaire.title}</h2>
      <p style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: "0.9rem" }}>{questionnaire.description}</p>
      
      <div style={{ marginTop: 24 }}>
        {questionnaire.items.map((item, index) => (
          <div key={item.id} style={{ marginBottom: 24, padding: 20, background: "#F9FAFB", borderRadius: 8, border: "1px solid var(--card-border)" }}>
            <p style={{ marginBottom: 16, color: "var(--text-primary)", fontWeight: 500 }}><strong>{index + 1}.</strong> {item.text}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {questionnaire.scale.map(s => {
                const isSelected = answers[item.id] === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => setAnswers({ ...answers, [item.id]: s.value })}
                    style={{
                      padding: "8px 16px",
                      background: isSelected ? "var(--accent-color)" : "#FFFFFF",
                      border: isSelected ? "1px solid var(--accent-color)" : "1px solid var(--card-border)",
                      borderRadius: 6,
                      color: isSelected ? "white" : "var(--text-primary)",
                      cursor: "pointer",
                      transition: "background 150ms, color 150ms",
                      boxShadow: isSelected ? "none" : "0 1px 2px rgba(0,0,0,0.05)"
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button 
        className="btn" 
        disabled={!isComplete || submitting} 
        onClick={handleSubmit}
        style={{ marginTop: 24, width: "100%", opacity: isComplete ? 1 : 0.5 }}
      >
        {submitting ? "Submitting..." : "Submit Answers"}
      </button>
    </div>
  );
}
