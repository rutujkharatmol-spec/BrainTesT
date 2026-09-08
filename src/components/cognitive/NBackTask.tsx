"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import { roundedMeanOrNull } from "@/utils/trials";
import TaskCompleteScreen from "./TaskCompleteScreen";
import TaskInstructionCard from "./TaskInstructionCard";
import TaskHUD from "./TaskHUD";

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
  const router = useRouter();
  
  const [phase, setPhase] = useState<"instructions" | "running" | "completed">("instructions");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(-1);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [calculatedParams, setCalculatedParams] = useState<any>(null);
  // True when the result was only queued locally (device offline).
  const [queuedOffline, setQueuedOffline] = useState(false);
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
    if (!state.sessionId) {
      alert("No active session — please sign in again before submitting.");
      return;
    }
    setSubmitting(true);
    
    const hits = results.filter(r => r.type === "hit");
    const falseAlarms = results.filter(r => r.type === "false_alarm");
    
    const totalTargets = results.filter(r => r.isTarget).length;
    const totalNonTargets = results.filter(r => !r.isTarget).length;

    const hitRate = totalTargets > 0 ? (hits.length / totalTargets) * 100 : null;
    const falseAlarmRate = totalNonTargets > 0 ? (falseAlarms.length / totalNonTargets) * 100 : null;
    
    const validRTs = hits.filter(r => r.rt !== null && r.rt > 150).map(r => r.rt as number);
    // null, not 0: "mean RT 0ms" is impossible and was being stored as a real
    // measurement whenever a participant scored no hits.
    const meanRTHits = roundedMeanOrNull(validRTs);

    
    setCalculatedParams({
      param1Name: "Mean RT (Hits) (ms)", param1Value: meanRTHits,
      param2Name: "Hit Rate (%)", param2Value: hitRate === null ? null : Math.round(hitRate),
      param3Name: "False Alarm Rate (%)", param3Value: falseAlarmRate === null ? null : Math.round(falseAlarmRate)
    });
    try {
      const res = await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          testCategory: "Memory",
          specificTest: "2-Back Task",
          param1Name: "Mean RT (Hits) (ms)",
          param1Value: meanRTHits,
          param2Name: "Hit Rate (%)",
          param2Value: hitRate === null ? null : Math.round(hitRate),
          param3Name: "False Alarm Rate (%)",
          param3Value: falseAlarmRate === null ? null : Math.round(falseAlarmRate),
          rawTrialData: results
        })
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok && !payload?.offline) {
        throw new Error(payload?.error || `Upload failed (${res.status})`);
      }
      setQueuedOffline(Boolean(payload?.offline));
      markTestCompleted("/cognitive/nback");
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
    const isBn = state.language === "bn";
    return (
      <TaskInstructionCard
        title={isBn ? "এন-ব্যাক টাস্ক — স্মৃতি প্রতিধ্বনি" : "2-Back Task — Memory Echo"}
        subtitle={isBn ? "কার্যকরী স্মৃতির (Working Memory) পরীক্ষা" : "Test your working memory and recall"}
        icon="🧠"
        category={isBn ? "ওয়ার্কিং মেমোরি" : "Working Memory"}
        language={state.language}
        mission={
          isBn
            ? "স্ক্রিনে একে একে অক্ষর আসবে। বর্তমান অক্ষরটি যদি ঠিক ২ ধাপ আগের অক্ষরের মতো একই হয়, তখনই স্পেসবার (SPACEBAR) চাপুন অথবা MATCH এ ট্যাপ করুন!"
            : "Watch the letters appear one by one. If the current letter matches the one from EXACTLY 2 steps ago, press SPACEBAR or tap MATCH!"
        }
        visualExample={
          <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: 12, border: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", marginBottom: 8, textTransform: "uppercase" }}>
              {isBn ? "টাইমলাইন ডায়াগ্রাম:" : "TIMELINE WALKTHROUGH:"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", paddingBottom: 6 }}>
              <div style={{ textAlign: "center", padding: "8px 10px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, minWidth: 60 }}>
                <div style={{ fontSize: 10, color: "#94A3B8" }}>Step 1</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A" }}>A</div>
                <div style={{ fontSize: 10, color: "#64748B" }}>Wait</div>
              </div>
              <span style={{ color: "#94A3B8" }}>➔</span>
              <div style={{ textAlign: "center", padding: "8px 10px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, minWidth: 60 }}>
                <div style={{ fontSize: 10, color: "#94A3B8" }}>Step 2</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A" }}>B</div>
                <div style={{ fontSize: 10, color: "#64748B" }}>Wait</div>
              </div>
              <span style={{ color: "#94A3B8" }}>➔</span>
              <div style={{ textAlign: "center", padding: "8px 10px", background: "#ECFDF5", border: "2px solid #10B981", borderRadius: 8, minWidth: 80 }}>
                <div style={{ fontSize: 10, color: "#059669", fontWeight: 700 }}>Step 3</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#059669" }}>A</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#047857" }}>MATCH! 🔥</div>
              </div>
              <span style={{ color: "#94A3B8" }}>➔</span>
              <div style={{ textAlign: "center", padding: "8px 10px", background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, minWidth: 60 }}>
                <div style={{ fontSize: 10, color: "#94A3B8" }}>Step 4</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A" }}>C</div>
                <div style={{ fontSize: 10, color: "#64748B" }}>Wait</div>
              </div>
              <span style={{ color: "#94A3B8" }}>➔</span>
              <div style={{ textAlign: "center", padding: "8px 10px", background: "#ECFDF5", border: "2px solid #10B981", borderRadius: 8, minWidth: 80 }}>
                <div style={{ fontSize: 10, color: "#059669", fontWeight: 700 }}>Step 5</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#059669" }}>A</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#047857" }}>MATCH! 🔥</div>
              </div>
            </div>
          </div>
        }
        rules={[
          { text: isBn ? "প্রতিটি অক্ষর স্ক্রিনে ১.৫ সেকেন্ডের জন্য থাকে।" : "Each letter stays on screen briefly — keep your memory updated!", icon: "⏱️" },
          { text: isBn ? "যদি ২ ধাপ আগের অক্ষরের সাথে না মিলে, তবে কোনো বাটন চাপবেন না।" : "If the letter is NOT a 2-step match, do not press anything.", icon: "🛑" },
          { text: isBn ? "মোট ৩০টি অক্ষর দেখানো হবে।" : "There are 30 letters shown in sequence.", icon: "🎯" },
        ]}
        controls={[
          { key: "SPACEBAR", action: isBn ? "ম্যাচ (MATCH)" : "MATCH (2 Steps Back)", color: "#10B981" },
        ]}
        tip={isBn ? "মনে মনে আগের দুটি অক্ষর উচ্চারণ করুন: যেমন 'A... B...'" : "Mental trick: Whisper the last 2 letters to yourself as each one appears!"}
        onStart={startTask}
      />
    );
  }

  if (phase === "running") {
    const trial = trials[currentTrialIndex];
    return (
      <div className="task-view-container">
        <TaskHUD
          title={state.language === "bn" ? "এন-ব্যাক টাস্ক" : "2-Back Task"}
          icon="🧠"
          category={state.language === "bn" ? "ওয়ার্কিং মেমোরি" : "Working Memory"}
          currentTrial={currentTrialIndex + 1}
          totalTrials={TOTAL_TRIALS}
          language={state.language}
        />
        <div className="task-stimulus stimulus-animate" style={{ position: "relative" }}>
          {showStimulus ? (
            <h1 style={{ fontSize: "clamp(4rem, 10vw, 7rem)", fontWeight: 900, color: "#0F172A", letterSpacing: 2 }}>
              {trial?.letter}
            </h1>
          ) : (
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#CBD5E1" }} />
          )}
          
          {/* Visual feedback indicator */}
          <div style={{
            position: "absolute",
            bottom: "-36px",
            left: "50%",
            transform: "translateX(-50%)",
            opacity: hasPressed ? 1 : 0,
            transition: "opacity 0.15s ease",
            color: "#059669",
            fontWeight: 800,
            fontSize: 14,
            whiteSpace: "nowrap",
            backgroundColor: "#ECFDF5",
            padding: "3px 10px",
            borderRadius: 12,
            border: "1px solid #A7F3D0"
          }}>
            ✓ {state.language === 'bn' ? "প্রতিক্রিয়া নিবন্ধিত হয়েছে" : "Match Pressed!"}
          </div>
        </div>
        
        <div className="mobile-controls-container">
          <div className="mobile-controls">
            <button 
              type="button"
              className="mobile-btn" 
              onClick={handleResponse} 
              disabled={hasPressed}
              style={{
                maxWidth: 320,
                background: hasPressed ? "#E2E8F0" : "linear-gradient(135deg, #059669, #10B981)",
                color: hasPressed ? "#64748B" : "#FFFFFF",
                borderColor: hasPressed ? "#CBD5E1" : "#059669",
                fontSize: 16,
              }}
            >
              <span className="keycap">SPACE</span> {state.language === 'bn' ? "ম্যাচ (MATCH)" : "MATCH"}
            </button>
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
