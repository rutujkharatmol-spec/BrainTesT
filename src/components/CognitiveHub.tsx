"use client";

import React from "react";
import Link from "next/link";
import { useAppContext } from "./AppContext";

import FinalScreen from "./FinalScreen";

const TESTS = [
  { path: "/cognitive/stroop", name: "Stroop Task", category: "Executive Function" },
  { path: "/cognitive/nback", name: "N-Back Task", category: "Memory" },
  { path: "/cognitive/corsi", name: "Corsi Block Task", category: "Memory" },
  { path: "/cognitive/digitspan", name: "Digit Span Task", category: "Memory" },
  { path: "/cognitive/sart", name: "SART", category: "Attention" },
  { path: "/cognitive/dotprobe", name: "Dot Probe Task", category: "Attention" },
  { path: "/cognitive/flanker", name: "Eriksen Flanker Task", category: "Executive Function" },
  { path: "/cognitive/ldt", name: "Lexical Decision Task", category: "Social Cognition" },
  { path: "/cognitive/negative-priming", name: "Negative Priming", category: "Social Cognition" }
];

export default function CognitiveHub() {
  const { state, resetSession } = useAppContext();

  const allCompleted = TESTS.every(t => state.completedTests.includes(t.path));

  return (
    <div className="glass-panel" style={{ maxWidth: 800, margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
        <div>
          <h2>Cognitive Testing Hub</h2>
          <p>Participant: {state.participantName} ({state.participantIdNumber})</p>
        </div>
        <button onClick={resetSession} style={{ padding: "8px 16px", background: "transparent", border: "1px solid var(--danger-color)", color: "var(--danger-color)", borderRadius: 8, cursor: "pointer" }}>
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
                  background: isCompleted ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)", 
                  padding: 16, 
                  borderRadius: 8, 
                  border: "1px solid rgba(255,255,255,0.1)",
                  transition: "transform 0.1s, background 0.1s",
                  cursor: isCompleted ? "default" : "pointer",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  opacity: isCompleted ? 0.5 : 1
                }}
                onMouseOver={(e) => { if (!isCompleted) e.currentTarget.style.background = "rgba(255,255,255,0.1)" }}
                onMouseOut={(e) => { if (!isCompleted) e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
                >
                  <h3 style={{ fontSize: "1.1rem", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                    {test.name}
                    {isCompleted && <span style={{ color: "var(--success-color)", fontSize: "1.2rem" }}>✓</span>}
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--accent-color)" }}>{test.category}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 48, textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24 }}>
        <p style={{ marginBottom: 16, color: "var(--accent-color)" }}>Need to complete the standard questionnaires?</p>
        <Link href="/questionnaires" style={{ textDecoration: "none" }}>
          <button className="btn" style={{ padding: "8px 24px", fontSize: "0.9rem" }}>
            Go to Questionnaires
          </button>
        </Link>
      </div>
    </div>
  );
}
