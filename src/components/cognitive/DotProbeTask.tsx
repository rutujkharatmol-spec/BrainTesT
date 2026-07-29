"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";

type Trial = {
  leftWord: string;
  rightWord: string;
  targetPosition: "left" | "right"; // Where the negative/target word is
  dotPosition: "left" | "right";    // Where the dot appears
  congruent: boolean;               // True if targetPosition == dotPosition
};

type TrialResult = Trial & {
  rt: number | null;
  correct: boolean;
};

const TOTAL_TRIALS = 40;
const FIXATION_DURATION = 500;
const STIMULUS_DURATION = 500;

const NEUTRAL_WORDS = ["CHAIR", "TABLE", "WATER", "HOUSE", "PAPER", "PLANT", "CLOCK", "GLASS", "TRAIN", "APPLE"];
const TARGET_WORDS = ["ANGER", "DEATH", "FEAR", "PANIC", "GRIEF", "HATE", "ENEMY", "SNAKE", "SPIDER", "PAIN"];

export default function DotProbeTask({ onComplete }: { onComplete?: () => void }) {
  const { state, markTestCompleted } = useAppContext();
  
  const [phase, setPhase] = useState<"instructions" | "fixation" | "words" | "dot" | "completed">("instructions");
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
      const neutralWord = NEUTRAL_WORDS[Math.floor(Math.random() * NEUTRAL_WORDS.length)];
      const targetWord = TARGET_WORDS[Math.floor(Math.random() * TARGET_WORDS.length)];
      
      const targetPosition = Math.random() < 0.5 ? "left" : "right";
      const dotPosition = Math.random() < 0.5 ? "left" : "right";
      
      sequence.push({
        leftWord: targetPosition === "left" ? targetWord : neutralWord,
        rightWord: targetPosition === "right" ? targetWord : neutralWord,
        targetPosition,
        dotPosition,
        congruent: targetPosition === dotPosition // fix: removed quotes
      });
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

    // 1. Fixation
    timeoutRef.current = setTimeout(() => {
      setPhase("words");
      
      // 2. Words
      timeoutRef.current = setTimeout(() => {
        setPhase("dot");
        startTimeRef.current = performance.now();
        // Waits indefinitely for user input here
      }, STIMULUS_DURATION);
      
    }, FIXATION_DURATION);
  };

  const handleResponse = useCallback((responsePos: "left" | "right") => {
    if (phase !== "dot" || hasRespondedRef.current) return;
    
    hasRespondedRef.current = true;
    const rt = performance.now() - startTimeRef.current;
    const trial = trials[currentTrialIndex];
    const correct = responsePos === trial.dotPosition;

    setResults(prev => [...prev, { ...trial, rt, correct }]);

    setTimeout(() => {
      runNextTrial(currentTrialIndex + 1);
    }, 500);
  }, [phase, currentTrialIndex, trials]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.code;
    if (key === "KeyE") handleResponse("left");
    if (key === "KeyI") handleResponse("right");
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
    
    // Parameters (only correct, RT > 150ms)
    const validTrials = results.filter(r => r.correct && r.rt !== null && r.rt > 150);
    const congruentRTs = validTrials.filter(r => r.congruent).map(r => r.rt as number);
    const incongruentRTs = validTrials.filter(r => !r.congruent).map(r => r.rt as number);

    const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    
    const meanRTCongruent = mean(congruentRTs);
    const meanRTIncongruent = mean(incongruentRTs);
    const biasScore = meanRTIncongruent - meanRTCongruent; // Positive means attention was captured by target word

    try {
      await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId || "demo-session",
          testCategory: "Attention",
          specificTest: "Dot Probe Task",
          param1Name: "Mean RT Congruent (ms)",
          param1Value: Math.round(meanRTCongruent),
          param2Name: "Mean RT Incongruent (ms)",
          param2Value: Math.round(meanRTIncongruent),
          param3Name: "Attentional Bias Score",
          param3Value: Math.round(biasScore),
          rawTrialData: results
        })
      });
      if (onComplete) {
        onComplete();
      } else {
        markTestCompleted("/cognitive/dotprobe");
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
        <h2>Dot Probe Task</h2>
        <p>You will see a cross in the center, followed by two words flashing quickly.</p>
        <p>After the words disappear, a dot ( <strong>*</strong> ) will appear where one of the words was.</p>
        <div style={{ margin: "24px 0", textAlign: "left", display: "inline-block", background: "#F9FAFB", padding: 16, borderRadius: 8, border: "1px solid var(--card-border)" }}>
          <p>If the dot appears on the <strong>LEFT</strong>, press the <strong>'E'</strong> key or tap <strong>LEFT</strong>.</p>
          <p>If the dot appears on the <strong>RIGHT</strong>, press the <strong>'I'</strong> key or tap <strong>RIGHT</strong>.</p>
        </div>
        <p>Please respond as quickly and accurately as possible.</p>
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
      <div className="task-stimulus" style={{ flexDirection: "column" }}>
        {phase === "fixation" && <h1 style={{ fontSize: "4rem", color: "var(--text-primary)" }}>+</h1>}
        
        {phase === "words" && trial && (
          <div style={{ display: "flex", width: "100%", maxWidth: "600px", justifyContent: "space-between", padding: "0 20px" }}>
            <h1 style={{ fontSize: "clamp(2rem, 8vw, 4rem)", margin: 0, textAlign: "left", width: "45%", color: "var(--text-primary)" }}>{trial.leftWord}</h1>
            <h1 style={{ fontSize: "clamp(2rem, 8vw, 4rem)", margin: 0, textAlign: "right", width: "45%", color: "var(--text-primary)" }}>{trial.rightWord}</h1>
          </div>
        )}

        {phase === "dot" && trial && (
          <div style={{ display: "flex", width: "100%", maxWidth: "600px", justifyContent: trial.dotPosition === "left" ? "flex-start" : "flex-end", padding: "0 40px" }}>
            <h1 style={{ 
              fontSize: "clamp(3rem, 10vw, 5rem)",
              color: "var(--text-primary)",
              margin: 0
            }}>
              *
            </h1>
          </div>
        )}
      </div>

      {phase === "dot" && (
        <div className="mobile-controls-container">
          <div className="mobile-controls">
            <button className="mobile-btn" onClick={() => handleResponse("left")}>LEFT</button>
            <button className="mobile-btn" onClick={() => handleResponse("right")}>RIGHT</button>
          </div>
        </div>
      )}
    </div>
  );
}
