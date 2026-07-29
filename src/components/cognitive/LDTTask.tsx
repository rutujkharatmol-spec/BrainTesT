"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";

type Trial = {
  string: string;
  isWord: boolean;
};

type TrialResult = Trial & {
  rt: number | null;
  correct: boolean;
};

const TOTAL_TRIALS = 40;
const FIXATION_DURATION = 500;

const WORDS = ["HOUSE", "APPLE", "WATER", "CHAIR", "PLANT", "CLOCK", "TABLE", "GLASS", "TRAIN", "PAPER"];
const NON_WORDS = ["BLAP", "TRISK", "FROBN", "GLAR", "SNURT", "VLEEB", "CROMB", "PLANKT", "SNARF", "FLIRM"];

export default function LDTTask({ onComplete }: { onComplete?: () => void }) {
  const { state, markTestCompleted } = useAppContext();
  
  const [phase, setPhase] = useState<"instructions" | "fixation" | "stimulus" | "completed">("instructions");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRespondedRef = useRef(false);

  // Generate sequence
  useEffect(() => {
    const sequence: Trial[] = [];
    for (let i = 0; i < TOTAL_TRIALS; i++) {
      const isWord = Math.random() < 0.5;
      const string = isWord 
        ? WORDS[Math.floor(Math.random() * WORDS.length)] 
        : NON_WORDS[Math.floor(Math.random() * NON_WORDS.length)];
      
      sequence.push({ string, isWord });
    }
    setTrials(sequence);
  }, []);

  const startTask = () => {
    runNextTrial(0);
  };

  const runNextTrial = (index: number) => {
    if (index >= TOTAL_TRIALS) {
      setPhase("completed");
      return;
    }

    setCurrentTrialIndex(index);
    setPhase("fixation");
    hasRespondedRef.current = false;

    timeoutRef.current = setTimeout(() => {
      setPhase("stimulus");
      startTimeRef.current = performance.now();
    }, FIXATION_DURATION);
  };

  const handleResponse = useCallback((responseKey: "KeyF" | "KeyJ") => {
    if (phase !== "stimulus" || hasRespondedRef.current) return;
    
    hasRespondedRef.current = true;
    const rt = performance.now() - startTimeRef.current;
    
    const trial = trials[currentTrialIndex];
    const userSaidWord = responseKey === "KeyF";
    const correct = userSaidWord === trial.isWord;

    setResults(prev => [...prev, { ...trial, rt, correct }]);

    setTimeout(() => {
      runNextTrial(currentTrialIndex + 1);
    }, 500);
  }, [phase, currentTrialIndex, trials]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.code;
    if (key === "KeyF" || key === "KeyJ") {
      handleResponse(key);
    }
  }, [handleResponse]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase === "completed" && !submitting && results.length === TOTAL_TRIALS) {
      submitData();
    }
  }, [phase, results]);

  const submitData = async () => {
    setSubmitting(true);
    
    const validTrials = results.filter(r => r.correct && r.rt !== null && r.rt > 100);
    const wordRTs = validTrials.filter(r => r.isWord).map(r => r.rt as number);
    const nonWordRTs = validTrials.filter(r => !r.isWord).map(r => r.rt as number);

    const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    
    const meanRTWords = mean(wordRTs);
    const meanRTNonWords = mean(nonWordRTs);
    const overallAccuracy = (results.filter(r => r.correct).length / TOTAL_TRIALS) * 100;

    try {
      await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId || "demo-session",
          testCategory: "Social & Emotional Cognition",
          specificTest: "Lexical Decision Task",
          param1Name: "Mean RT Words (ms)",
          param1Value: Math.round(meanRTWords),
          param2Name: "Mean RT Non-words (ms)",
          param2Value: Math.round(meanRTNonWords),
          param3Name: "Overall Accuracy (%)",
          param3Value: Math.round(overallAccuracy),
          rawTrialData: results
        })
      });
      if (onComplete) {
        onComplete();
      } else {
        markTestCompleted("/cognitive/ldt");
        setTimeout(() => window.location.href = "/", 200);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save cognitive data.");
    }
  };

  if (phase === "instructions") {
    return (
      <div className="card" style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
        <h2>Lexical Decision Task (LDT)</h2>
        <p>You will see a string of letters appear on the screen.</p>
        <p>Your goal is to decide if the string is a real English word or a made-up non-word.</p>
        <div style={{ margin: "24px 0", textAlign: "left", display: "inline-block", background: "#F9FAFB", padding: 16, borderRadius: 8, border: "1px solid var(--card-border)" }}>
          <p>Press <strong>'F'</strong> or tap <strong>WORD</strong> if it is a <strong>REAL WORD</strong> (e.g. HOUSE).</p>
          <p style={{ marginTop: 8 }}>Press <strong>'J'</strong> or tap <strong>NON-WORD</strong> if it is a <strong>NON-WORD</strong> (e.g. BLAP).</p>
        </div>
        <button className="btn" onClick={startTask} style={{ marginTop: 32, width: "100%", padding: "14px", fontSize: "1.1rem" }}>Start Task</button>
      </div>
    );
  }

  if (phase === "completed") {
    return (
      <div className="card" style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
        <h2>Task Completed!</h2>
        {submitting ? <p>Uploading data...</p> : <p>Done!</p>}
      </div>
    );
  }

  const trial = trials[currentTrialIndex];

  return (
    <div className="task-view-container">
      <div className="task-stimulus">
        {phase === "fixation" && <h1 style={{ fontSize: "4rem", color: "var(--text-primary)" }}>+</h1>}
        {phase === "stimulus" && trial && <h1 style={{ fontSize: "6rem", fontWeight: "bold", textTransform: "uppercase", color: "var(--text-primary)" }}>{trial.string}</h1>}
      </div>

      {phase === "stimulus" && (
        <div className="mobile-controls-container">
          <div className="mobile-controls">
            <button className="mobile-btn" onClick={() => handleResponse("KeyF")}>WORD</button>
            <button className="mobile-btn" onClick={() => handleResponse("KeyJ")}>NON-WORD</button>
          </div>
        </div>
      )}
    </div>
  );
}
