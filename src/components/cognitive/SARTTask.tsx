"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import TaskCompleteScreen from "./TaskCompleteScreen";
import TaskInstructionCard from "./TaskInstructionCard";
import TaskHUD from "./TaskHUD";

type Trial = {
  digit: number;
  isNoGo: boolean; // 3 is No-Go
};

type TrialResult = Trial & {
  pressed: boolean;
  rt: number | null;
  errorType: "commission" | "omission" | "none";
};

const TOTAL_TRIALS = 50;
const NO_GO_DIGIT = 3;
const NO_GO_PROBABILITY = 0.15; // heavily weighted toward Go
const STIMULUS_DURATION = 250;
const MASK_DURATION = 900;

export default function SARTTask({ onComplete }: { onComplete?: () => void }) {
  const { state, markTestCompleted } = useAppContext();
  const router = useRouter();
  
  const [phase, setPhase] = useState<"instructions" | "running" | "completed">("instructions");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(-1);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  // Latched synchronously the moment an upload starts. The `!submitting` check
  // in the effect below could never do this job: `submitting` was read from a
  // stale closure and was not in the dependency array, so under React's
  // double-invoked effects the second call still saw `false` and uploaded the
  // participant's run twice.
  const submittedRef = useRef(false);
  const [calculatedParams, setCalculatedParams] = useState<any>(null);
  // True when the result was only queued locally (device offline).
  const [queuedOffline, setQueuedOffline] = useState(false);
  const [showStimulus, setShowStimulus] = useState(false);
  const [hasPressed, setHasPressed] = useState(false);

  const startTimeRef = useRef<number>(0);
  const trialTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maskTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentResponseRef = useRef<{ pressed: boolean, rt: number | null }>({ pressed: false, rt: null });

  // Generate sequence
  useEffect(() => {
    const sequence: Trial[] = [];
    for (let i = 0; i < TOTAL_TRIALS; i++) {
      const isNoGo = Math.random() < NO_GO_PROBABILITY;
      let digit;
      if (isNoGo) {
        digit = NO_GO_DIGIT;
      } else {
        do {
          digit = Math.floor(Math.random() * 9) + 1; // 1-9
        } while (digit === NO_GO_DIGIT);
      }
      sequence.push({ digit, isNoGo });
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
    
    let errorType: "commission" | "omission" | "none" = "none";

    if (trial.isNoGo && response.pressed) {
      errorType = "commission"; // Pressed on No-Go
    } else if (!trial.isNoGo && !response.pressed) {
      errorType = "omission"; // Missed a Go
    }

    setResults(prev => [
      ...prev,
      {
        ...trial,
        pressed: response.pressed,
        rt: response.rt,
        errorType
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

    // Stimulus visible
    trialTimeoutRef.current = setTimeout(() => {
      setShowStimulus(false);
      
      // Mask / blank duration
      maskTimeoutRef.current = setTimeout(() => {
        runNextTrial(index + 1);
      }, MASK_DURATION);
      
    }, STIMULUS_DURATION);
  };

  const handleResponse = useCallback(() => {
    if (phase !== "running" || currentResponseRef.current.pressed) return;
    
    const rt = performance.now() - startTimeRef.current;
    currentResponseRef.current = { pressed: true, rt };
    setHasPressed(true); // visual indicator
  }, [phase]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      handleResponse();
    }
  }, [handleResponse]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    return () => {
      if (trialTimeoutRef.current) clearTimeout(trialTimeoutRef.current);
      if (maskTimeoutRef.current) clearTimeout(maskTimeoutRef.current);
    };
  }, []);

  // submitData is deliberately not a dependency: it is recreated on every
  // render, so depending on it would re-fire this effect continuously.
  // submittedRef above makes the upload idempotent instead.
  useEffect(() => {
    if (phase === "completed" && results.length === TOTAL_TRIALS) {
      submitData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, results]);

  const submitData = async () => {
    if (submittedRef.current) return;
    if (!state.sessionId) {
      alert("No active session — please sign in again before submitting.");
      return;
    }
    submittedRef.current = true;
    setSubmitting(true);
    
    // Parameters
    const goTrials = results.filter(r => !r.isNoGo && r.pressed && r.rt !== null && r.rt > 100);
    const meanRTGo = goTrials.length ? goTrials.reduce((sum, r) => sum + (r.rt as number), 0) / goTrials.length : 0;
    
    const commissionErrors = results.filter(r => r.errorType === "commission").length;
    const omissionErrors = results.filter(r => r.errorType === "omission").length;

    
    setCalculatedParams({
      param1Name: "Mean RT Go Trials (ms)", param1Value: Math.round(meanRTGo),
      param2Name: "Commission Errors", param2Value: commissionErrors,
      param3Name: "Omission Errors", param3Value: omissionErrors
    });
    try {
      const res = await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          testCategory: "Attention",
          specificTest: "SART (Basic)",
          param1Name: "Mean RT Go Trials (ms)",
          param1Value: Math.round(meanRTGo),
          param2Name: "Commission Errors",
          param2Value: commissionErrors,
          param3Name: "Omission Errors",
          param3Value: omissionErrors,
          rawTrialData: results
        })
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok && !payload?.offline) {
        throw new Error(payload?.error || `Upload failed (${res.status})`);
      }
      setQueuedOffline(Boolean(payload?.offline));
      markTestCompleted("/cognitive/sart");
      // Stay on the results screen; the Continue button navigates.
      if (onComplete) onComplete();
    } catch (e) {
      // Failed: unlatch so the participant can retry.
      submittedRef.current = false;
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
        title={isBn ? "এস.এ.আর.টি — স্পিড রিফ্লেক্স" : "SART — Speed Reflex & Attention"}
        subtitle={isBn ? "সাসটেইন্ড অ্যাটেনশন ও আত্মনিয়ন্ত্রণের পরীক্ষা" : "Sustained Attention to Response Task"}
        icon="⏱️"
        category={isBn ? "মনোযোগ নিয়ন্ত্রণ" : "Sustained Attention"}
        language={state.language}
        mission={
          isBn
            ? "স্ক্রিনে দ্রুত সংখ্যা আসবে। যেকোনো সংখ্যা এলে দ্রুত স্পেসবার চাপুন — কিন্তু ৩ (THREE) সংখ্যাটি এলে কখনোই কিছু চাপবেন না!"
            : "Press SPACEBAR as fast as you can for EVERY number (1, 2, 4, 5, 6, 7, 8, 9) — EXCEPT when you see the number 3!"
        }
        visualExample={
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: 14, background: "#ECFDF5", border: "2px solid #10B981", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#065F46", marginBottom: 4 }}>
                {isBn ? "যেকোনো সংখ্যা (১, ২, ৪... ৯)" : "ANY NUMBER (1, 2, 4... 9)"}
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#059669" }}>
                1, 2, 4, 5, 7, 8...
              </div>
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: "#065F46" }}>
                ✅ {isBn ? "দ্রুত স্পেসবার চাপুন!" : "PRESS SPACEBAR FAST!"}
              </div>
            </div>
            <div style={{ padding: 14, background: "#FEF2F2", border: "2px solid #EF4444", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#991B1B", marginBottom: 4 }}>
                {isBn ? "বিপদজনক ফাঁদ (TRAP)" : "THE TRAP"}
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#DC2626" }}>
                3
              </div>
              <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800, color: "#DC2626" }}>
                🛑 {isBn ? "কিছুই চাপবেন না!" : "STOP! DO NOT PRESS!"}
              </div>
            </div>
          </div>
        }
        rules={[
          { text: isBn ? "সংখ্যাগুলো স্ক্রিনে খুব দ্রুত ফ্ল্যাশ হবে।" : "Numbers flash very quickly — stay alert and focused!", icon: "⚡" },
          { text: isBn ? "৩ দেখতে পেলেই হাত থামিয়ে রাখুন।" : "Train your brain to hold back when the number 3 appears.", icon: "🛑", highlight: true },
          { text: isBn ? "মোট ৫০টি দ্রুত ট্রায়াল আছে।" : "50 quick trials total.", icon: "🎯" },
        ]}
        controls={[
          { key: "SPACEBAR", action: isBn ? "যেকোনো সংখ্যার জন্য চাপুন (৩ বাদে)" : "PRESS for numbers (except 3)", color: "#059669" },
        ]}
        tip={isBn ? "আঙুল স্পেসবারের উপরে আলতো করে ধরে রাখুন।" : "Keep your finger resting gently on the SPACEBAR so you're ready to react!"}
        onStart={startTask}
      />
    );
  }

  if (phase === "running") {
    const trial = trials[currentTrialIndex];
    return (
      <div className="task-view-container">
        <TaskHUD
          title={state.language === "bn" ? "এস.এ.আর.টি" : "SART Attention"}
          icon="⏱️"
          category={state.language === "bn" ? "মনোযোগ" : "Attention"}
          currentTrial={currentTrialIndex + 1}
          totalTrials={TOTAL_TRIALS}
          language={state.language}
        />
        <div className="task-stimulus stimulus-animate" style={{ position: "relative" }}>
          {showStimulus ? (
            <h1 style={{ fontSize: "clamp(5rem, 12vw, 8rem)", fontWeight: 900, color: "#0F172A" }}>
              {trial?.digit}
            </h1>
          ) : (
            <div style={{ fontSize: "clamp(3rem, 8vw, 5rem)", opacity: 0.15, color: "#64748B" }}>⊗</div>
          )}
          
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
            ✓ {state.language === 'bn' ? "প্রেস সম্পন্ন" : "Pressed!"}
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
                maxWidth: 340,
                background: hasPressed ? "#E2E8F0" : "linear-gradient(135deg, #059669, #10B981)",
                color: hasPressed ? "#64748B" : "#FFFFFF",
                borderColor: hasPressed ? "#CBD5E1" : "#059669",
                fontSize: 16,
              }}
            >
              <span className="keycap">SPACE</span> {state.language === 'bn' ? "চাপুন (PRESS - GO)" : "PRESS (GO)"}
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
