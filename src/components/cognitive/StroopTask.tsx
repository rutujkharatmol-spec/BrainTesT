"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import { balancedFlags, roundedMeanOrNull, differenceOrNull } from "@/utils/trials";
import TaskCompleteScreen from "./TaskCompleteScreen";

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
  const router = useRouter();
  
  const [phase, setPhase] = useState<"instructions" | "fixation" | "stimulus" | "completed">("instructions");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [calculatedParams, setCalculatedParams] = useState<any>(null);
  // True when the result was only queued locally (device offline).
  const [queuedOffline, setQueuedOffline] = useState(false);

  const startTimeRef = useRef<number>(0);

  // Generate Trials — counterbalanced: exactly half congruent, order shuffled.
  useEffect(() => {
    const congruency = balancedFlags(TOTAL_TRIALS, 0.5);
    const generated: Trial[] = congruency.map((isCongruent: boolean) => {
      const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      let fontColor = wordColor;

      if (!isCongruent) {
        const otherColors = COLORS.filter(c => c !== wordColor);
        fontColor = otherColors[Math.floor(Math.random() * otherColors.length)];
      }

      return { word: wordColor, color: fontColor, congruent: isCongruent };
    });
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
    if (phase === "completed" && !submitting && results.length === TOTAL_TRIALS) {
      submitData();
    }
  }, [phase, results]);

  const submitData = async () => {
    if (!state.sessionId) {
      alert("No active session — please sign in again before submitting.");
      return;
    }
    setSubmitting(true);
    
    // Calculate parameters (only correct answers, RT > 150ms)
    const validTrials = results.filter(r => r.correct && r.rt > 150);
    
    const congruentRTs = validTrials.filter(r => r.congruent).map(r => r.rt);
    const incongruentRTs = validTrials.filter(r => !r.congruent).map(r => r.rt);

    // null (not 0) when a condition has no valid trials, so an unmeasurable
    // cell is never stored as a real value.
    const meanRTCongruent = roundedMeanOrNull(congruentRTs);
    const meanRTIncongruent = roundedMeanOrNull(incongruentRTs);
    const stroopEffect = differenceOrNull(meanRTIncongruent, meanRTCongruent);

    setCalculatedParams({
      param1Name: "Mean RT Congruent (ms)", param1Value: meanRTCongruent,
      param2Name: "Mean RT Incongruent (ms)", param2Value: meanRTIncongruent,
      param3Name: "Stroop Interference Effect (ms)", param3Value: stroopEffect
    });
    try {
      const res = await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          testCategory: "Executive Function",
          specificTest: "Stroop Task",
          param1Name: "Mean RT Congruent (ms)",
          param1Value: meanRTCongruent,
          param2Name: "Mean RT Incongruent (ms)",
          param2Value: meanRTIncongruent,
          param3Name: "Stroop Interference Effect (ms)",
          param3Value: stroopEffect,
          validTrialCount: validTrials.length,
          rawTrialData: results
        })
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok && !payload?.offline) {
        throw new Error(payload?.error || `Upload failed (${res.status})`);
      }
      setQueuedOffline(Boolean(payload?.offline));
      markTestCompleted("/cognitive/stroop");
      // Stay on the results screen; the Continue button navigates.
      if (onComplete) onComplete();
    } catch (e) {
      console.error(e);
      alert(`Could not save your results: ${e instanceof Error ? e.message : e}

Please tell the study coordinator before continuing.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === "instructions") {
    return (
      <div className="card" style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
        <h2>{state.language === 'bn' ? "স্ট্রুপ টাস্ক" : "Stroop Task"}</h2>
        <p>{state.language === 'bn' ? "আপনি বিভিন্ন রঙে শব্দ দেখতে পাবেন।" : "You will see words appear in different colors."}</p>
        <p><strong>{state.language === 'bn' ? "শব্দটি কী বলছে তা উপেক্ষা করে, শব্দের ফন্ট কালার বা রঙের সাথে মিলে যায় এমন বোতামটি চাপুন।" : "Press the key or tap the button corresponding to the FONT COLOR of the word, ignoring what the word says."}</strong></p>
        <ul style={{ textAlign: "left", display: "inline-block", margin: "20px 0" }}>
          <li>{state.language === 'bn' ? "লাল রঙের জন্য " : "Press "}<strong>R</strong>{state.language === 'bn' ? " চাপুন" : " for Red"}</li>
          <li>{state.language === 'bn' ? "নীল রঙের জন্য " : "Press "}<strong>B</strong>{state.language === 'bn' ? " চাপুন" : " for Blue"}</li>
          <li>{state.language === 'bn' ? "সবুজ রঙের জন্য " : "Press "}<strong>G</strong>{state.language === 'bn' ? " চাপুন" : " for Green"}</li>
          <li>{state.language === 'bn' ? "হলুদ রঙের জন্য " : "Press "}<strong>Y</strong>{state.language === 'bn' ? " চাপুন" : " for Yellow"}</li>
        </ul>
        <button className="btn" onClick={startTask} style={{ marginTop: 32, width: "100%", padding: "14px", fontSize: "1.1rem" }}>{state.language === 'bn' ? "টাস্ক শুরু করুন" : "Start Task"}</button>
      </div>
    );
  }

  if (phase === "fixation") {
    return (
      <div className="task-view-container">
        <div className="task-stimulus" style={{ fontSize: "4rem", color: "var(--text-primary)" }}>
          +
        </div>
      </div>
    );
  }

  if (phase === "stimulus") {
    const trial = trials[currentTrialIndex];
    return (
      <div className="task-view-container">
        <div className="task-stimulus">
          <h1 style={{ 
            color: trial.color.toLowerCase(), 
            fontSize: "5rem", 
            textTransform: "uppercase",
            fontWeight: "bold"
          }}>
            {trial.word}
          </h1>
        </div>
        <div className="mobile-controls-container">
          <div className="mobile-controls" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <button className="mobile-btn" onClick={() => handleResponse("RED")}>{state.language === 'bn' ? "লাল (RED)" : "RED"}</button>
            <button className="mobile-btn" onClick={() => handleResponse("BLUE")}>{state.language === 'bn' ? "নীল (BLUE)" : "BLUE"}</button>
            <button className="mobile-btn" onClick={() => handleResponse("GREEN")}>{state.language === 'bn' ? "সবুজ (GREEN)" : "GREEN"}</button>
            <button className="mobile-btn" onClick={() => handleResponse("YELLOW")}>{state.language === 'bn' ? "হলুদ (YELLOW)" : "YELLOW"}</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "completed") {
    return (
      <TaskCompleteScreen
        calculatedParams={calculatedParams}
        submitting={submitting}
        queuedOffline={queuedOffline}
        language={state.language}
        onContinue={() => (onComplete ? onComplete() : router.push("/"))}
      />
    );
  }

  return null; // fallback
}
