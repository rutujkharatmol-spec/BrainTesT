"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../AppContext";

type Trial = {
  word: string;
  color: string;
  congruent: boolean;
};

type TrialResult = Trial & {
  rt: number;
  correct: boolean;
};

const COLORS = ["RED", "BLUE", "GREEN", "YELLOW"];
const KEYS: Record<string, string> = { r: "RED", b: "BLUE", g: "GREEN", y: "YELLOW" };
const TOTAL_TRIALS = 20;

export default function StroopTask({ onComplete }: { onComplete?: () => void }) {
  const { state, markTestCompleted } = useAppContext();
  
  const [phase, setPhase] = useState<"instructions" | "fixation" | "stimulus" | "completed">("instructions");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const startTimeRef = useRef<number>(0);

  // Generate Trials
  useEffect(() => {
    const generated: Trial[] = [];
    for (let i = 0; i < TOTAL_TRIALS; i++) {
      const isCongruent = Math.random() > 0.5;
      const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      let fontColor = wordColor;
      
      if (!isCongruent) {
        const otherColors = COLORS.filter(c => c !== wordColor);
        fontColor = otherColors[Math.floor(Math.random() * otherColors.length)];
      }
      
      generated.push({ word: wordColor, color: fontColor, congruent: isCongruent });
    }
    setTrials(generated);
  }, []);

  const startTask = () => setPhase("fixation");

  // Fixation cross timer
  useEffect(() => {
    if (phase === "fixation") {
      const timer = setTimeout(() => {
        setPhase("stimulus");
        // Record high precision start time immediately when stimulus is shown
        startTimeRef.current = performance.now();
      }, 500); // 500ms fixation
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleResponse = useCallback((colorName: string) => {
    if (phase !== "stimulus") return;

    const rt = performance.now() - startTimeRef.current;
    const currentTrial = trials[currentTrialIndex];
    const correct = colorName === currentTrial.color;

    const newResult: TrialResult = { ...currentTrial, rt, correct };
    
    setResults(prev => [...prev, newResult]);

    if (currentTrialIndex + 1 < TOTAL_TRIALS) {
      setCurrentTrialIndex(prev => prev + 1);
      setPhase("fixation");
    } else {
      setPhase("completed");
    }
  }, [phase, currentTrialIndex, trials]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (KEYS[key]) {
      handleResponse(KEYS[key]);
    }
  }, [handleResponse]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Handle Submission
  useEffect(() => {
    if (phase === "completed" && !submitting) {
      submitData();
    }
  }, [phase]);

  const submitData = async () => {
    setSubmitting(true);
    
    // Calculate parameters (only correct answers, RT > 150ms)
    const validTrials = results.filter(r => r.correct && r.rt > 150);
    
    const congruentRTs = validTrials.filter(r => r.congruent).map(r => r.rt);
    const incongruentRTs = validTrials.filter(r => !r.congruent).map(r => r.rt);

    const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    
    const meanRTCongruent = mean(congruentRTs);
    const meanRTIncongruent = mean(incongruentRTs);
    const stroopEffect = meanRTIncongruent - meanRTCongruent;

    try {
      await fetch("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId || "demo-session",
          testCategory: "Executive Function",
          specificTest: "Stroop Task",
          param1Name: "Mean RT Congruent (ms)",
          param1Value: Math.round(meanRTCongruent),
          param2Name: "Mean RT Incongruent (ms)",
          param2Value: Math.round(meanRTIncongruent),
          param3Name: "Stroop Interference Effect (ms)",
          param3Value: Math.round(stroopEffect),
          rawTrialData: results
        })
      });
      if (onComplete) {
        onComplete();
      } else {
        markTestCompleted("/cognitive/stroop");
        setTimeout(() => window.location.href = "/", 200);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save cognitive data.");
    }
  };

  if (phase === "instructions") {
    return (
      <div className="glass-panel" style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
        <h2>Stroop Task</h2>
        <p>You will see words appear in different colors.</p>
        <p><strong>Press the key or tap the button corresponding to the FONT COLOR of the word, ignoring what the word says.</strong></p>
        <ul style={{ textAlign: "left", display: "inline-block", margin: "20px 0" }}>
          <li>Press <strong>R</strong> for Red</li>
          <li>Press <strong>B</strong> for Blue</li>
          <li>Press <strong>G</strong> for Green</li>
          <li>Press <strong>Y</strong> for Yellow</li>
        </ul>
        <button className="btn" onClick={startTask}>Start Task</button>
      </div>
    );
  }

  if (phase === "fixation") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px", fontSize: "4rem" }}>
        +
      </div>
    );
  }

  if (phase === "stimulus") {
    const trial = trials[currentTrialIndex];
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "450px" }}>
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <h1 style={{ 
            color: trial.color.toLowerCase(), 
            fontSize: "5rem", 
            textTransform: "uppercase",
            fontWeight: "bold",
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)" // to ensure readability on backgrounds
          }}>
            {trial.word}
          </h1>
        </div>
        <div className="mobile-controls-container">
          <div className="mobile-controls" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <button className="mobile-btn" onClick={() => handleResponse("RED")} style={{ background: "rgba(239, 68, 68, 0.4)", borderColor: "rgba(239, 68, 68, 0.6)" }}>RED</button>
            <button className="mobile-btn" onClick={() => handleResponse("BLUE")} style={{ background: "rgba(59, 130, 246, 0.4)", borderColor: "rgba(59, 130, 246, 0.6)" }}>BLUE</button>
            <button className="mobile-btn" onClick={() => handleResponse("GREEN")} style={{ background: "rgba(16, 185, 129, 0.4)", borderColor: "rgba(16, 185, 129, 0.6)" }}>GREEN</button>
            <button className="mobile-btn" onClick={() => handleResponse("YELLOW")} style={{ background: "rgba(234, 179, 8, 0.4)", borderColor: "rgba(234, 179, 8, 0.6)" }}>YELLOW</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
      <h2>Task Completed!</h2>
      <p>Saving your reaction times...</p>
      {submitting ? <p>Uploading data...</p> : <p>Done!</p>}
    </div>
  );
}
