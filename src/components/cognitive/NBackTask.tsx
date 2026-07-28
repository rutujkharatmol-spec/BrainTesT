"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../AppContext";

type Trial = {
  letter: string;
  isTarget: boolean;
};

type TrialResult = Trial & {
  pressed: boolean;
  rt: number | null; // null if no press
  correct: boolean;
  type: "hit" | "miss" | "false_alarm" | "correct_rejection";
};

const LETTERS = ["A", "B", "C", "D", "E", "H", "K", "L", "M", "O", "P", "T", "X", "Y", "Z"];
const TOTAL_TRIALS = 30;
const N_BACK = 2;
const TARGET_PROBABILITY = 0.3; // 30% targets
const STIMULUS_DURATION = 500;
const ISI_DURATION = 1500; // Inter-stimulus interval

export default function NBackTask({ onComplete }: { onComplete?: () => void }) {
  const { state, markTestCompleted } = useAppContext();
  
  const [phase, setPhase] = useState<"instructions" | "running" | "completed">("instructions");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(-1);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showStimulus, setShowStimulus] = useState(false);
  const [hasPressed, setHasPressed] = useState(false);

  const startTimeRef = useRef<number>(0);
  const trialTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentResponseRef = useRef<{ pressed: boolean, rt: number | null }>({ pressed: false, rt: null });

  // Generate sequence
  useEffect(() => {
    const sequence: Trial[] = [];
    for (let i = 0; i < TOTAL_TRIALS; i++) {
      let letter = "";
      let isTarget = false;
      
      if (i >= N_BACK && Math.random() < TARGET_PROBABILITY) {
        // Create a target
        letter = sequence[i - N_BACK].letter;
        isTarget = true;
      } else {
        // Create non-target (ensure it doesn't accidentally match N-back)
        do {
          letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        } while (i >= N_BACK && letter === sequence[i - N_BACK].letter);
      }
      
      sequence.push({ letter, isTarget });
    }
    setTrials(sequence);
  }, []);

  const startTask = () => {
    setPhase("running");
    runNextTrial(0);
  };

  const recordResult = (index: number) => {
    const trial = trials[index];
    const response = currentResponseRef.current;
    
    let type: TrialResult["type"] = "correct_rejection";
    let correct = true;

    if (trial.isTarget && response.pressed) {
      type = "hit";
    } else if (trial.isTarget && !response.pressed) {
      type = "miss";
      correct = false;
    } else if (!trial.isTarget && response.pressed) {
      type = "false_alarm";
      correct = false;
    }

    setResults(prev => [
      ...prev,
      {
        ...trial,
        pressed: response.pressed,
        rt: response.rt,
        correct,
        type
      }
    ]);
  };

  const runNextTrial = (index: number) => {
    if (index > 0) {
      recordResult(index - 1);
    }

    if (index >= TOTAL_TRIALS) {
      setPhase("completed");
      return;
    }

    setCurrentTrialIndex(index);
    setShowStimulus(true);
    setHasPressed(false);
    currentResponseRef.current = { pressed: false, rt: null };
    startTimeRef.current = performance.now();

    // Stimulus visible duration
    trialTimeoutRef.current = setTimeout(() => {
      setShowStimulus(false);
      
      // Blank screen duration (ISI)
      isiTimeoutRef.current = setTimeout(() => {
        runNextTrial(index + 1);
      }, ISI_DURATION);
      
    }, STIMULUS_DURATION);
  };

  const handleResponse = useCallback(() => {
    if (phase !== "running" || currentResponseRef.current.pressed) return;
    
    const rt = performance.now() - startTimeRef.current;
    currentResponseRef.current = { pressed: true, rt };
    setHasPressed(true); // Trigger re-render for visual feedback
  }, [phase]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      handleResponse();
    }
  }, [handleResponse]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    return () => {
      if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);
      if (isiTimeoutRef.current) clearTimeout(isiTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase === "completed" && !submitting && results.length === TOTAL_TRIALS) {
      submitData();
    }
  }, [phase, results]);

  const submitData = async () => {
    setSubmitting(true);
    
    const hits = results.filter(r => r.type === "hit");
    const falseAlarms = results.filter(r => r.type === "false_alarm");
    
    const totalTargets = results.filter(r => r.isTarget).length;
    const totalNonTargets = results.filter(r => !r.isTarget).length;

    const hitRate = totalTargets > 0 ? (hits.length / totalTargets) * 100 : 0;
    const falseAlarmRate = totalNonTargets > 0 ? (falseAlarms.length / totalNonTargets) * 100 : 0;
    
    const validRTs = hits.filter(r => r.rt !== null && r.rt > 150).map(r => r.rt as number);
    const meanRTHits = validRTs.length ? validRTs.reduce((a, b) => a + b, 0) / validRTs.length : 0;

    try {
      await fetch("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId || "demo-session",
          testCategory: "Memory",
          specificTest: "2-Back Task",
          param1Name: "Mean RT (Hits) (ms)",
          param1Value: Math.round(meanRTHits),
          param2Name: "Hit Rate (%)",
          param2Value: Math.round(hitRate),
          param3Name: "False Alarm Rate (%)",
          param3Value: Math.round(falseAlarmRate),
          rawTrialData: results
        })
      });
      if (onComplete) {
        onComplete();
      } else {
        markTestCompleted("/cognitive/nback");
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
        <h2>N-Back Task (2-Back)</h2>
        <p>You will see a sequence of letters presented one by one.</p>
        <p style={{ marginTop: 16 }}>
          <strong>Press the SPACEBAR or tap MATCH</strong> if the current letter is the 
          <strong> exact same as the letter seen 2 steps ago.</strong>
        </p>
        <div style={{ margin: "24px auto", textAlign: "left", display: "inline-block", background: "#F9FAFB", padding: 16, borderRadius: 8, border: "1px solid var(--card-border)" }}>
          <p>Example Sequence:</p>
          <ul style={{ paddingLeft: 24, margin: "8px 0" }}>
            <li>A (do nothing)</li>
            <li>B (do nothing)</li>
            <li><strong>A (PRESS SPACEBAR - matches 2 steps ago)</strong></li>
            <li>C (do nothing)</li>
            <li><strong>A (PRESS SPACEBAR - matches 2 steps ago)</strong></li>
          </ul>
        </div>
        <button className="btn" onClick={startTask} style={{ marginTop: 32, width: "100%", padding: "14px", fontSize: "1.1rem" }}>Start Task</button>
      </div>
    );
  }

  if (phase === "running") {
    const trial = trials[currentTrialIndex];
    return (
      <div className="task-view-container">
        <div className="task-stimulus" style={{ position: "relative" }}>
          {showStimulus ? (
            <h1 style={{ fontSize: "6rem", fontWeight: "bold", color: "var(--text-primary)" }}>{trial?.letter}</h1>
          ) : (
            <div style={{ width: 10, height: 10, background: "transparent" }} /> // blank ISI
          )}
          
          {/* Visual feedback indicator */}
          <div style={{
            position: "absolute",
            bottom: "-40px",
            left: "50%",
            transform: "translateX(-50%)",
            opacity: hasPressed ? 1 : 0,
            transition: "opacity 0.1s",
            color: "var(--success-color)",
            fontWeight: "bold",
            whiteSpace: "nowrap"
          }}>
            Response Registered
          </div>
        </div>
        
        <div className="mobile-controls-container">
          <div className="mobile-controls">
            <button 
              className="mobile-btn" 
              onClick={handleResponse} 
              disabled={hasPressed}
            >
              MATCH
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
      <h2>Task Completed!</h2>
      {submitting ? <p>Uploading data...</p> : <p>Done!</p>}
    </div>
  );
}
