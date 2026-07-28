"use client";

import React from "react";
import Link from "next/link";
import { useAppContext } from "./AppContext";

import FinalScreen from "./FinalScreen";

const TESTS = [
  { path: "/cognitive/stroop", name: "Stroop Task", category: "Executive Function", trials: "40 trials", time: "~2 min" },
  { path: "/cognitive/nback", name: "N-Back Task", category: "Memory", trials: "30 trials", time: "~2 min" },
  { path: "/cognitive/corsi", name: "Corsi Block Task", category: "Memory", trials: "Adaptive", time: "~3 min" },
  { path: "/cognitive/digitspan", name: "Digit Span Task", category: "Memory", trials: "Adaptive", time: "~3 min" },
  { path: "/cognitive/sart", name: "SART", category: "Attention", trials: "50 trials", time: "~1.5 min" },
  { path: "/cognitive/dotprobe", name: "Dot Probe Task", category: "Attention", trials: "40 trials", time: "~2 min" },
  { path: "/cognitive/flanker", name: "Eriksen Flanker Task", category: "Executive Function", trials: "40 trials", time: "~2 min" },
  { path: "/cognitive/ldt", name: "Lexical Decision Task", category: "Social Cognition", trials: "40 trials", time: "~2 min" },
  { path: "/cognitive/negative-priming", name: "Negative Priming", category: "Social Cognition", trials: "40 trials", time: "~2 min" }
];

export default function CognitiveHub() {
  const { state, resetSession } = useAppContext();

  const allCompleted = TESTS.every(t => state.completedTests.includes(t.path));

  return (
    <div className="card" style={{ maxWidth: 800, margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingBottom: 16, borderBottom: "1px solid var(--card-border)" }}>
        <div>
          <h2>Cognitive Testing Hub</h2>
          <p style={{ margin: 0 }}>Participant: {state.participantName} ({state.participantIdNumber})</p>
        </div>
        <button onClick={resetSession} className="btn btn-outline" style={{ border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          End Session
        </button>
      </div>

      {allCompleted ? (
        <FinalScreen />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {TESTS.map((test) => {
            const isCompleted = state.completedTests.includes(test.path);
            return (
              <Link href={test.path} key={test.path} style={{ textDecoration: "none", pointerEvents: isCompleted ? "none" : "auto" }}>
                <div style={{ 
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
                  <div>
                    <h3 style={{ fontSize: "1.1rem", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                      {test.name}
                      {isCompleted && <span style={{ color: "var(--success-color)", fontSize: "1.2rem" }}>✓</span>}
                    </h3>
                    <div style={{ fontSize: "0.8rem", color: "var(--accent-color)", marginBottom: 12 }}>{test.category}</div>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)", opacity: 0.8, borderTop: "1px solid var(--card-border)", paddingTop: 8 }}>
                    <span>{test.trials}</span>
                    <span>⏱ {test.time}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 48, textAlign: "center", borderTop: "1px solid var(--card-border)", paddingTop: 24 }}>
        <p style={{ marginBottom: 16, color: "var(--accent-color)", fontWeight: 500 }}>Need to complete the standard questionnaires?</p>
        <Link href="/questionnaires" style={{ textDecoration: "none" }}>
          <button className="btn" style={{ padding: "12px 32px" }}>
            Go to Questionnaires
          </button>
        </Link>
      </div>
    </div>
  );
}
