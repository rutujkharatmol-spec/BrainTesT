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
    <div className="glass-panel" style={{ maxWidth: 800, margin: "auto" }}>
      <h2>{questionnaire.title}</h2>
      <p style={{ color: "var(--accent-color)", marginTop: 8, fontSize: "0.9rem" }}>{questionnaire.description}</p>
      
      <div style={{ marginTop: 24 }}>
        {questionnaire.items.map((item, index) => (
          <div key={item.id} style={{ marginBottom: 24, padding: 16, background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
            <p style={{ marginBottom: 12 }}><strong>{index + 1}.</strong> {item.text}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {questionnaire.scale.map(s => (
                <button
                  key={s.value}
                  onClick={() => setAnswers({ ...answers, [item.id]: s.value })}
                  style={{
                    padding: "8px 16px",
                    background: answers[item.id] === s.value ? "var(--accent-color)" : "rgba(255,255,255,0.1)",
                    border: "none",
                    borderRadius: 4,
                    color: "white",
                    cursor: "pointer"
                  }}
                >
                  {s.label}
                </button>
              ))}
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
