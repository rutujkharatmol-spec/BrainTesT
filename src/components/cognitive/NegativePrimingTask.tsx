"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../AppContext";

type Category = "LIVING" | "NON_LIVING";

type WordData = {
  text: string;
  category: Category;
};

const WORDS: WordData[] = [
  { text: "DOG", category: "LIVING" },
  { text: "CAT", category: "LIVING" },
  { text: "BIRD", category: "LIVING" },
  { text: "FISH", category: "LIVING" },
  { text: "CAR", category: "NON_LIVING" },
  { text: "BOOK", category: "NON_LIVING" },
  { text: "SHOE", category: "NON_LIVING" },
  { text: "DESK", category: "NON_LIVING" }
];

type Trial = {
  target: WordData;     // Word in RED
  distractor: WordData; // Word in BLUE
  isIgnoredRepetition: boolean;
};

type TrialResult = Trial & {
  rt: number | null;
  correct: boolean;
};

const TOTAL_TRIALS = 40;
const FIXATION_DURATION = 500;

export default function NegativePrimingTask({ onComplete }: { onComplete?: () => void }) {
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
    let previousDistractor: WordData | null = null;
    
    for (let i = 0; i < TOTAL_TRIALS; i++) {
      // 30% chance for Ignored Repetition (if we have a previous distractor)
      const isIgnoredRepetition = previousDistractor !== null && Math.random() < 0.3;
      
      let target: WordData;
      if (isIgnoredRepetition && previousDistractor) {
        target = previousDistractor;
      } else {
        // Pick a target that is NOT the previous distractor
        do {
          target = WORDS[Math.floor(Math.random() * WORDS.length)];
        } while (previousDistractor && target.text === previousDistractor.text);
      }

      // Pick a distractor that is NOT the current target
      let distractor: WordData;
      do {
        distractor = WORDS[Math.floor(Math.random() * WORDS.length)];
      } while (distractor.text === target.text);

      sequence.push({ target, distractor, isIgnoredRepetition });
      previousDistractor = distractor; // save for next trial
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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (phase !== "stimulus" || hasRespondedRef.current) return;
    
    const key = e.code;
    if (key !== "KeyF" && key !== "KeyJ") return;
    
    hasRespondedRef.current = true;
    const rt = performance.now() - startTimeRef.current;
    
    const trial = trials[currentTrialIndex];
    const userCategory: Category = key === "KeyF" ? "LIVING" : "NON_LIVING";
    const correct = userCategory === trial.target.category;

    setResults(prev => [...prev, { ...trial, rt, correct }]);

    setTimeout(() => {
      runNextTrial(currentTrialIndex + 1);
    }, 500);

  }, [phase, currentTrialIndex, trials]);

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
    const controlRTs = validTrials.filter(r => !r.isIgnoredRepetition).map(r => r.rt as number);
    const ignoredRepRTs = validTrials.filter(r => r.isIgnoredRepetition).map(r => r.rt as number);

    const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    
    const meanRTControl = mean(controlRTs);
    const meanRTIgnoredRep = mean(ignoredRepRTs);
    const primingEffect = meanRTIgnoredRep - meanRTControl; 

    try {
      await fetch("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId || "demo-session",
          testCategory: "Social & Emotional Cognition",
          specificTest: "Negative Priming Task",
          param1Name: "Mean RT Control (ms)",
          param1Value: Math.round(meanRTControl),
          param2Name: "Mean RT Ignored Rep (ms)",
          param2Value: Math.round(meanRTIgnoredRep),
          param3Name: "Negative Priming Effect (ms)",
          param3Value: Math.round(primingEffect),
          rawTrialData: results
        })
      });
      if (onComplete) {
        onComplete();
      } else {
        markTestCompleted("/cognitive/negative-priming");
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
        <h2>Negative Priming Task</h2>
        <p>You will see two overlapping words. One will be <strong>RED</strong> and one will be <strong style={{color:"#00aaff"}}>BLUE</strong>.</p>
        <p>Your goal is to categorize the <strong>RED WORD</strong> and completely ignore the blue word.</p>
        <div style={{ margin: "24px 0", textAlign: "left", display: "inline-block", background: "rgba(0,0,0,0.2)", padding: 16, borderRadius: 8 }}>
          <p>Press <strong>'F'</strong> if the red word is a <strong>LIVING THING</strong> (e.g. DOG, CAT).</p>
          <p style={{ marginTop: 8 }}>Press <strong>'J'</strong> if the red word is a <strong>NON-LIVING THING</strong> (e.g. CAR, SHOE).</p>
        </div>
        <button className="btn" onClick={startTask} style={{ marginTop: 24 }}>Start Task</button>
      </div>
    );
  }

  if (phase === "completed") {
    return (
      <div className="glass-panel" style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
        <h2>Task Completed!</h2>
        {submitting ? <p>Uploading data...</p> : <p>Done!</p>}
      </div>
    );
  }

  const trial = trials[currentTrialIndex];

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px", position: "relative" }}>
      {phase === "fixation" && <h1 style={{ fontSize: "4rem" }}>+</h1>}
      
      {phase === "stimulus" && trial && (
        <div style={{ position: "relative" }}>
          {/* Distractor word in Blue */}
          <h1 style={{ 
            fontSize: "6rem", 
            fontWeight: "bold", 
            color: "#00aaff",
            position: "absolute",
            top: 20, // slightly offset so they don't perfectly overlap
            left: 10,
            opacity: 0.8,
            pointerEvents: "none"
          }}>
            {trial.distractor.text}
          </h1>
          
          {/* Target word in Red */}
          <h1 style={{ 
            fontSize: "6rem", 
            fontWeight: "bold", 
            color: "#ff4444",
            position: "relative",
            zIndex: 10
          }}>
            {trial.target.text}
          </h1>
        </div>
      )}
    </div>
  );
}
