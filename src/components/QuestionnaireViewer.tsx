"use client";

import React, { useState } from "react";
import { QuestionnaireDef } from "@/config/questionnaires";
import { useAppContext } from "./AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";

export default function QuestionnaireViewer({ questionnaire, onComplete }: { questionnaire: QuestionnaireDef, onComplete: () => void }) {
  const { state } = useAppContext();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<"filling" | "completed">("filling");

  const isComplete = questionnaire.items.every(q => answers[q.id] !== undefined);

  const handleSubmit = async () => {
    setSubmitting(true);
    setPhase("completed");
    try {
      // Calculate score based on questionnaire.scoringType
      let score: number | undefined;
      let scoreSp: number | undefined;
      let scoreSk: number | undefined;
      let scoreSa: number | undefined;
      let scoreDepression: number | undefined;
      let scoreAnxiety: number | undefined;
      let scoreStress: number | undefined;
      // Convert answers considering reverse scoring
      const processedScores: Record<string, number> = {};
      questionnaire.items.forEach(q => {
        let val = answers[q.id];
        if (q.isReverse) {
           val = (questionnaire.scaleMax + questionnaire.scaleMin) - val;
        }
        processedScores[q.id] = val;
      });

      const vals = Object.values(processedScores);

      if (questionnaire.scoringType === "sum") {
        score = vals.reduce((acc, v) => acc + v, 0);
      } else if (questionnaire.scoringType === "mean") {
        score = vals.reduce((acc, v) => acc + v, 0) / vals.length;
      } else if (questionnaire.scoringType === "tsis_subscales") {
        const spIds = ["q1", "q3", "q6", "q9", "q14", "q17", "q19"];
        const skIds = ["q4", "q7", "q10", "q12", "q15", "q18", "q20"];
        const saIds = ["q2", "q5", "q8", "q11", "q13", "q16", "q21"];
        scoreSp = spIds.reduce((acc, id) => acc + (processedScores[id] || 0), 0);
        scoreSk = skIds.reduce((acc, id) => acc + (processedScores[id] || 0), 0);
        scoreSa = saIds.reduce((acc, id) => acc + (processedScores[id] || 0), 0);
      } else if (questionnaire.scoringType === "dass21_subscales") {
        const depIds = ["q3", "q5", "q10", "q13", "q16", "q17", "q21"];
        const anxIds = ["q2", "q4", "q7", "q9", "q15", "q19", "q20"];
        const stressIds = ["q1", "q6", "q8", "q11", "q12", "q14", "q18"];
        // DASS-21 subscores are typically multiplied by 2 to map to full DASS-42
        scoreDepression = depIds.reduce((acc, id) => acc + (processedScores[id] || 0), 0) * 2;
        scoreAnxiety = anxIds.reduce((acc, id) => acc + (processedScores[id] || 0), 0) * 2;
        scoreStress = stressIds.reduce((acc, id) => acc + (processedScores[id] || 0), 0) * 2;
      }

      const res = await fetchWithOfflineSync("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          testId: questionnaire.id,
          rawScores: answers,
          score,
          scoreSp,
          scoreSk,
          scoreSa,
          scoreDepression,
          scoreAnxiety,
          scoreStress
        })
      });

      if (!res.ok) {
        throw new Error("Failed to submit");
      }
      
      onComplete();
    } catch (e) {
      console.error(e);
      alert("Failed to submit");
      setPhase("filling");
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === "completed") {
    return (
      <div className="card" style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
        <h2>Questionnaire Completed!</h2>
        <p>Saving your responses...</p>
        {submitting ? <p>Uploading data...</p> : <p>Done!</p>}
      </div>
    );
  }

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
