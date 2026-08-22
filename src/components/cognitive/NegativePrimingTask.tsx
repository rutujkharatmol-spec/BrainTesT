"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import { balancedFlags, roundedMeanOrNull, differenceOrNull } from "@/utils/trials";
import TaskCompleteScreen from "./TaskCompleteScreen";

type Category = "LIVING" | "NON_LIVING";

type WordData = {
  text: string;
  category: Category;
};

const WORDS_EN: WordData[] = [
  { text: "DOG", category: "LIVING" },
  { text: "CAT", category: "LIVING" },
  { text: "BIRD", category: "LIVING" },
  { text: "FISH", category: "LIVING" },
  { text: "CAR", category: "NON_LIVING" },
  { text: "BOOK", category: "NON_LIVING" },
  { text: "SHOE", category: "NON_LIVING" },
  { text: "DESK", category: "NON_LIVING" }
];

const WORDS_BN: WordData[] = [
  { text: "কুকুর", category: "LIVING" },
  { text: "বিড়াল", category: "LIVING" },
  { text: "পাখি", category: "LIVING" },
  { text: "মাছ", category: "LIVING" },
  { text: "গাড়ি", category: "NON_LIVING" },
  { text: "বই", category: "NON_LIVING" },
  { text: "জুতো", category: "NON_LIVING" },
  { text: "ডেস্ক", category: "NON_LIVING" }
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRespondedRef = useRef(false);

  // Generate sequence
  useEffect(() => {
    const sequence: Trial[] = [];
    const WORDS = state.language === 'bn' ? WORDS_BN : WORDS_EN;
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
  }, [state.language]);

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
    const userCategory: Category = responseKey === "KeyF" ? "LIVING" : "NON_LIVING";
    const correct = userCategory === trial.target.category;

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
    if (!state.sessionId) {
      alert("No active session — please sign in again before submitting.");
      return;
    }
    setSubmitting(true);
    
    const validTrials = results.filter(r => r.correct && r.rt !== null && r.rt > 100);
    const controlRTs = validTrials.filter(r => !r.isIgnoredRepetition).map(r => r.rt as number);
    const ignoredRepRTs = validTrials.filter(r => r.isIgnoredRepetition).map(r => r.rt as number);

    
    const meanRTControl = roundedMeanOrNull(controlRTs);
    const meanRTIgnoredRep = roundedMeanOrNull(ignoredRepRTs);
    const primingEffect = differenceOrNull(meanRTIgnoredRep, meanRTControl); 

    
    setCalculatedParams({
      param1Name: "Mean RT Control (ms)", param1Value: meanRTControl,
      param2Name: "Mean RT Ignored Rep (ms)", param2Value: meanRTIgnoredRep,
      param3Name: "Negative Priming Effect (ms)", param3Value: primingEffect
    });
    try {
      const res = await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          testCategory: "Social & Emotional Cognition",
          specificTest: "Negative Priming Task",
          param1Name: "Mean RT Control (ms)",
          param1Value: meanRTControl,
          param2Name: "Mean RT Ignored Rep (ms)",
          param2Value: meanRTIgnoredRep,
          param3Name: "Negative Priming Effect (ms)",
          param3Value: primingEffect,
          rawTrialData: results
        })
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok && !payload?.offline) {
        throw new Error(payload?.error || `Upload failed (${res.status})`);
      }
      setQueuedOffline(Boolean(payload?.offline));
      markTestCompleted("/cognitive/negative-priming");
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
        <h2>{state.language === 'bn' ? "নেগেটিভ প্রাইমিং টাস্ক" : "Negative Priming Task"}</h2>
        <p>{state.language === 'bn' ? "আপনি দুটি ওভারল্যাপিং (একের ওপর অন্যটি) শব্দ দেখতে পাবেন। একটি " : "You will see two overlapping words. One will be "}<strong>{state.language === 'bn' ? "লাল (RED)" : "RED"}</strong>{state.language === 'bn' ? " হবে এবং একটি " : " and one will be "}<strong style={{color:"#00aaff"}}>{state.language === 'bn' ? "নীল (BLUE)" : "BLUE"}</strong>{state.language === 'bn' ? " হবে।" : "."}</p>
        <p>{state.language === 'bn' ? "আপনার লক্ষ্য হল " : "Your goal is to categorize the "}<strong>{state.language === 'bn' ? "লাল শব্দটিকে (RED WORD)" : "RED WORD"}</strong>{state.language === 'bn' ? " শ্রেণিবদ্ধ করা এবং নীল শব্দটিকে সম্পূর্ণ উপেক্ষা করা।" : " and completely ignore the blue word."}</p>
        <div style={{ margin: "24px 0", textAlign: "left", display: "inline-block", background: "#F9FAFB", padding: 16, borderRadius: 8, border: "1px solid var(--card-border)" }}>
          <p>{state.language === 'bn' ? "লাল শব্দটি যদি জীবন্ত কিছু হয় তবে 'F' চাপুন বা LIVING এ ট্যাপ করুন (উদাঃ কুকুর, বিড়াল)।" : "Press 'F' or tap LIVING if the red word is a LIVING THING (e.g. DOG, CAT)."}</p>
          <p style={{ marginTop: 8 }}>{state.language === 'bn' ? "লাল শব্দটি যদি জড় বস্তু হয় তবে 'J' চাপুন বা NON-LIVING এ ট্যাপ করুন (উদাঃ গাড়ি, জুতো)।" : "Press 'J' or tap NON-LIVING if the red word is a NON-LIVING THING (e.g. CAR, SHOE)."}</p>
        </div>
        <button className="btn" onClick={startTask} style={{ marginTop: 32, width: "100%", padding: "14px", fontSize: "1.1rem" }}>{state.language === 'bn' ? "টাস্ক শুরু করুন" : "Start Task"}</button>
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

  const trial = trials[currentTrialIndex];

  return (
    <div className="task-view-container">
      <div className="task-stimulus" style={{ position: "relative" }}>
        {phase === "fixation" && <h1 style={{ fontSize: "4rem", color: "var(--text-primary)" }}>+</h1>}
        
        {phase === "stimulus" && trial && (
          <div style={{ position: "relative" }}>
            {/* Distractor word in Blue */}
            <h1 style={{ 
              fontSize: "6rem", 
              fontWeight: "bold", 
              color: "#00aaff",
              position: "absolute",
              top: 20,
              left: 10,
              opacity: 0.8,
              pointerEvents: "none",
              whiteSpace: "nowrap"
            }}>
              {trial.distractor.text}
            </h1>
            
            {/* Target word in Red */}
            <h1 style={{ 
              fontSize: "6rem", 
              fontWeight: "bold", 
              color: "#ff4444",
              position: "relative",
              zIndex: 10,
              whiteSpace: "nowrap"
            }}>
              {trial.target.text}
            </h1>
          </div>
        )}
      </div>

      {phase === "stimulus" && (
        <div className="mobile-controls-container">
          <div className="mobile-controls">
            <button className="mobile-btn" onClick={() => handleResponse("KeyF")}>{state.language === 'bn' ? "জীবন্ত (LIVING)" : "LIVING"}</button>
            <button className="mobile-btn" onClick={() => handleResponse("KeyJ")}>{state.language === 'bn' ? "জড় বস্তু (NON-LIVING)" : "NON-LIVING"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
