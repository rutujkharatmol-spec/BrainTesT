"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import { balancedFlags, roundedMeanOrNull, differenceOrNull } from "@/utils/trials";
import TaskCompleteScreen from "./TaskCompleteScreen";
import TaskInstructionCard from "./TaskInstructionCard";
import TaskHUD from "./TaskHUD";

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

  const isBn = state.language === "bn";

  if (phase === "instructions") {
    return (
      <TaskInstructionCard
        title={isBn ? "নেগেটিভ প্রাইমিং টাস্ক — ওভারল্যাপ ফোকাস" : "Negative Priming Task — Overlap Focus"}
        subtitle={isBn ? "লাল রঙের শব্দটি জীবন্ত নাকি জড় বস্তু?" : "Is the RED word living or non-living?"}
        icon="🧬"
        category={isBn ? "জ্ঞানীয় নিয়ন্ত্রণ ও মনোযোগ" : "Cognitive Control & Attention"}
        language={state.language}
        mission={
          isBn
            ? "স্ক্রিনে দুটি ওভারল্যাপিং (একের ওপর অন্যটি) শব্দ দেখা যাবে — একটি লাল রঙে এবং একটি নীল রঙে। নীল শব্দটি সম্পূর্ণ উপেক্ষা করুন! শুধুমাত্র লাল রঙের শব্দটি দেখে বলুন সেটি কি জীবন্ত নাকি জড় বস্তু?"
            : "You will see two overlapping words — one printed in RED and one in BLUE. Completely ignore the blue word! Focus only on the RED word: Is it LIVING or NON-LIVING?"
        }
        visualExample={
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ padding: 14, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1E40AF", marginBottom: 6 }}>
                {isBn ? "উদাহরণ ১: লাল শব্দটি জীবন্ত" : "EXAMPLE 1: RED IS LIVING"}
              </div>
              <div style={{ position: "relative", height: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ position: "absolute", fontSize: 24, fontWeight: 700, color: "#38BDF8", opacity: 0.7, transform: "translate(12px, -8px)" }}>
                  {isBn ? "গাড়ি" : "CAR"}
                </span>
                <span style={{ position: "relative", fontSize: 28, fontWeight: 900, color: "#DC2626", zIndex: 2 }}>
                  {isBn ? "বিড়াল" : "CAT"}
                </span>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#065F46" }}>
                {isBn ? "বিড়াল জীবন্ত ➔ [ F ] LIVING" : "CAT is Living ➔ Press [ F ] LIVING"}
              </div>
            </div>
            <div style={{ padding: 14, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", marginBottom: 6 }}>
                {isBn ? "উদাহরণ ২: লাল শব্দটি জড় বস্তু" : "EXAMPLE 2: RED IS NON-LIVING"}
              </div>
              <div style={{ position: "relative", height: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ position: "absolute", fontSize: 24, fontWeight: 700, color: "#38BDF8", opacity: 0.7, transform: "translate(12px, -8px)" }}>
                  {isBn ? "কুকুর" : "DOG"}
                </span>
                <span style={{ position: "relative", fontSize: 28, fontWeight: 900, color: "#DC2626", zIndex: 2 }}>
                  {isBn ? "বই" : "BOOK"}
                </span>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#475569" }}>
                {isBn ? "বই জড় বস্তু ➔ [ J ] NON-LIVING" : "BOOK is Non-Living ➔ Press [ J ] NON-LIVING"}
              </div>
            </div>
          </div>
        }
        rules={[
          { text: isBn ? "শুধুমাত্র লাল (RED) রঙের শব্দটির অর্থ বিবেচনা করুন।" : "Judge the category of the RED word only.", icon: "🔴" },
          { text: isBn ? "নীল (BLUE) রঙের শব্দটিকে সম্পূর্ণ উপেক্ষা করুন।" : "Completely ignore the BLUE distractor word.", icon: "🔵" },
          { text: isBn ? "জীবন্ত (প্রাণী/উদ্ভিদ) হলে [F] চাপুন, জড় বস্তু হলে [J] চাপুন।" : "Press [F] for LIVING, press [J] for NON-LIVING.", icon: "⚡" },
          { text: isBn ? "মোট ৪০টি ট্রায়াল সম্পন্ন করতে হবে।" : "There are 40 quick trials in total.", icon: "🎯" },
        ]}
        controls={[
          { key: "F", action: isBn ? "জীবন্ত (Living)" : "Living", color: "#059669" },
          { key: "J", action: isBn ? "জড় বস্তু (Non-Living)" : "Non-Living", color: "#4B5563" },
        ]}
        tip={isBn ? "ল্যাপটপের কীবোর্ডের F এবং J কী বা স্ক্রিনের বোতামে ক্লিক করুন।" : "You can use keyboard keys (F and J) or click the buttons below."}
        onStart={startTask}
      />
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
      <TaskHUD
        title={isBn ? "নেগেটিভ প্রাইমিং" : "Negative Priming"}
        icon="🧬"
        category={isBn ? "জ্ঞানীয় নিয়ন্ত্রণ" : "Cognitive Control"}
        currentTrial={currentTrialIndex + 1}
        totalTrials={TOTAL_TRIALS}
        language={state.language}
      />

      <div className="task-stimulus" style={{ position: "relative" }}>
        {phase === "fixation" && (
          <h1 style={{ fontSize: "4.5rem", color: "#2563EB", fontWeight: 700 }}>+</h1>
        )}
        
        {phase === "stimulus" && trial && (
          <div className="stimulus-animate" style={{ position: "relative", textAlign: "center", display: "inline-block" }}>
            {/* Distractor word in Blue */}
            <h1 style={{ 
              fontSize: "clamp(3.5rem, 8vw, 6rem)", 
              fontWeight: 800, 
              color: "#38BDF8",
              position: "absolute",
              top: 14,
              left: 14,
              opacity: 0.75,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              userSelect: "none"
            }}>
              {trial.distractor.text}
            </h1>
            
            {/* Target word in Red */}
            <h1 style={{ 
              fontSize: "clamp(3.5rem, 8vw, 6rem)", 
              fontWeight: 900, 
              color: "#DC2626",
              position: "relative",
              zIndex: 10,
              whiteSpace: "nowrap",
              userSelect: "none",
              textShadow: "0 2px 12px rgba(220, 38, 38, 0.15)"
            }}>
              {trial.target.text}
            </h1>

            <div style={{ marginTop: 14, fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
              {isBn ? "শুধুমাত্র লাল শব্দের উত্তর দিন" : "Focus on the RED word"}
            </div>
          </div>
        )}
      </div>

      {phase === "stimulus" && (
        <div className="mobile-controls-container">
          <div className="mobile-controls" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", maxWidth: 460, margin: "0 auto", gap: 14 }}>
            <button 
              className="mobile-btn" 
              onClick={() => handleResponse("KeyF")}
              style={{ borderColor: "#A7F3D0", color: "#065F46", padding: "14px 18px" }}
            >
              <span className="keycap">F</span> {isBn ? "জীবন্ত (LIVING)" : "LIVING"}
            </button>
            <button 
              className="mobile-btn" 
              onClick={() => handleResponse("KeyJ")}
              style={{ borderColor: "#E2E8F0", color: "#475569", padding: "14px 18px" }}
            >
              <span className="keycap">J</span> {isBn ? "জড় বস্তু (NON-LIVING)" : "NON-LIVING"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
