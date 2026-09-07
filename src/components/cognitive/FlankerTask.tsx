"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import { balancedFlags, roundedMeanOrNull, differenceOrNull } from "@/utils/trials";
import TaskCompleteScreen from "./TaskCompleteScreen";
import TaskInstructionCard from "./TaskInstructionCard";
import TaskHUD from "./TaskHUD";

type Trial = {
  direction: "left" | "right"; // direction of the center arrow
  congruent: boolean;          // true if flankers match center
  stimulusString: string;
};

type TrialResult = Trial & {
  rt: number | null;
  correct: boolean;
};

const TOTAL_TRIALS = 40;
const FIXATION_DURATION = 500;

export default function FlankerTask({ onComplete }: { onComplete?: () => void }) {
  const { state, markTestCompleted } = useAppContext();
  const router = useRouter();
  
  const [phase, setPhase] = useState<"instructions" | "fixation" | "stimulus" | "completed">("instructions");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
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

  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRespondedRef = useRef(false);

  // Generate sequence — counterbalanced on both factors: exactly half
  // congruent and half left-facing, independently shuffled.
  useEffect(() => {
    const congruency = balancedFlags(TOTAL_TRIALS, 0.5);
    const directions = balancedFlags(TOTAL_TRIALS, 0.5);

    const sequence: Trial[] = congruency.map((congruent: boolean, i: number) => {
      const direction: "left" | "right" = directions[i] ? "left" : "right";

      let stimulusString = "";
      if (direction === "left" && congruent) stimulusString = "<<<<<";
      if (direction === "right" && congruent) stimulusString = ">>>>>";
      if (direction === "left" && !congruent) stimulusString = ">><>>";
      if (direction === "right" && !congruent) stimulusString = "<<><<";

      return { direction, congruent, stimulusString };
    });
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
      // Waits indefinitely for user input here
    }, FIXATION_DURATION);
  };

  const handleResponse = useCallback((responseDir: "left" | "right") => {
    if (phase !== "stimulus" || hasRespondedRef.current) return;
    
    hasRespondedRef.current = true;
    const rt = performance.now() - startTimeRef.current;
    const trial = trials[currentTrialIndex];
    const correct = responseDir === trial.direction;

    setResults(prev => [...prev, { ...trial, rt, correct }]);

    setTimeout(() => {
      runNextTrial(currentTrialIndex + 1);
    }, 500);
  }, [phase, currentTrialIndex, trials]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.code;
    if (key === "ArrowLeft") handleResponse("left");
    if (key === "ArrowRight") handleResponse("right");
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
    
    // Parameters (only correct, RT > 100ms)
    const validTrials = results.filter(r => r.correct && r.rt !== null && r.rt > 100);
    const congruentRTs = validTrials.filter(r => r.congruent).map(r => r.rt as number);
    const incongruentRTs = validTrials.filter(r => !r.congruent).map(r => r.rt as number);

    
    const meanRTCongruent = roundedMeanOrNull(congruentRTs);
    const meanRTIncongruent = roundedMeanOrNull(incongruentRTs);
    const flankerEffect = differenceOrNull(meanRTIncongruent, meanRTCongruent); 

    
    setCalculatedParams({
      param1Name: "Mean RT Congruent (ms)", param1Value: meanRTCongruent,
      param2Name: "Mean RT Incongruent (ms)", param2Value: meanRTIncongruent,
      param3Name: "Flanker Effect", param3Value: flankerEffect
    });
    try {
      const res = await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          testCategory: "Executive Function",
          specificTest: "Eriksen Flanker Task",
          param1Name: "Mean RT Congruent (ms)",
          param1Value: meanRTCongruent,
          param2Name: "Mean RT Incongruent (ms)",
          param2Value: meanRTIncongruent,
          param3Name: "Flanker Effect",
          param3Value: flankerEffect,
          rawTrialData: results
        })
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok && !payload?.offline) {
        throw new Error(payload?.error || `Upload failed (${res.status})`);
      }
      setQueuedOffline(Boolean(payload?.offline));
      markTestCompleted("/cognitive/flanker");
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

  const isBn = state.language === "bn";

  if (phase === "instructions") {
    return (
      <TaskInstructionCard
        title={isBn ? "এরিকসেন ফ্ল্যাঙ্কার টাস্ক — অ্যারো ফোকাস" : "Eriksen Flanker Task — Arrow Focus"}
        subtitle={isBn ? "মাঝের তীরটি কোন দিকে নির্দেশ করছে?" : "Which way is the center arrow pointing?"}
        icon="🏹"
        category={isBn ? "এক্সিকিউটিভ ফাংশন" : "Executive Function"}
        language={state.language}
        mission={
          isBn
            ? "চারপাশের তীরগুলিকে উপেক্ষা করুন! শুধুমাত্র মাঝখানের তীরটির (CENTER arrow) দিকে ফোকাস করুন এবং সেটির দিক নির্দেশ করুন।"
            : "Ignore the flanker arrows on the sides! Focus your eyes only on the CENTER arrow and indicate its direction."
        }
        visualExample={
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ padding: 14, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1E40AF", marginBottom: 6 }}>
                {isBn ? "উদাহরণ ১: বামের তীর" : "EXAMPLE 1: CENTER POINTS LEFT"}
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "monospace", letterSpacing: 6, color: "#64748B" }}>
                &gt;&gt;<span style={{ color: "#2563EB", background: "#DBEAFE", padding: "2px 6px", borderRadius: 6 }}>&lt;</span>&gt;&gt;
              </div>
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#1D4ED8" }}>
                {isBn ? "মাঝের তীরটি বামে ➔ [ ← ] LEFT চাপুন" : "Center is Left ➔ Press [ ← ] LEFT"}
              </div>
            </div>
            <div style={{ padding: 14, background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#6D28D9", marginBottom: 6 }}>
                {isBn ? "উদাহরণ ২: ডানের তীর" : "EXAMPLE 2: CENTER POINTS RIGHT"}
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "monospace", letterSpacing: 6, color: "#64748B" }}>
                &lt;&lt;<span style={{ color: "#7C3AED", background: "#EDE9FE", padding: "2px 6px", borderRadius: 6 }}>&gt;</span>&lt;&lt;
              </div>
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#6D28D9" }}>
                {isBn ? "মাঝের তীরটি ডানে ➔ [ → ] RIGHT চাপুন" : "Center is Right ➔ Press [ → ] RIGHT"}
              </div>
            </div>
          </div>
        }
        rules={[
          { text: isBn ? "মাঝের তীরটি বামে নির্দেশ করলে [←] অথবা LEFT বাটন চাপুন।" : "If center arrow points LEFT, press [←] or tap LEFT.", icon: "⬅️" },
          { text: isBn ? "মাঝের তীরটি ডানে নির্দেশ করলে [→] অথবা RIGHT বাটন চাপুন।" : "If center arrow points RIGHT, press [→] or tap RIGHT.", icon: "➡️" },
          { text: isBn ? "চারপাশের বিপরীতমুখী তীরগুলিতে বিভ্রান্ত হবেন না!" : "Do NOT let the distractor arrows on the sides fool you!", icon: "🎯" },
          { text: isBn ? "যত দ্রুত ও নির্ভুলভাবে সম্ভব উত্তর দিন।" : "Answer as fast and accurately as possible.", icon: "⚡" },
        ]}
        controls={[
          { key: "←", action: isBn ? "বাম তীর (Left)" : "Left", color: "#2563EB" },
          { key: "→", action: isBn ? "ডান তীর (Right)" : "Right", color: "#7C3AED" },
        ]}
        tip={isBn ? "কীবোর্ডের তীর কী (Arrow keys) বা নিচের বোতামগুলিতে ক্লিক করতে পারেন।" : "You can press keyboard arrow keys (← / →) or click the buttons below."}
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
        title={isBn ? "এরিকসেন ফ্ল্যাঙ্কার" : "Eriksen Flanker"}
        icon="🏹"
        category={isBn ? "এক্সিকিউটিভ ফাংশন" : "Executive Function"}
        currentTrial={currentTrialIndex + 1}
        totalTrials={TOTAL_TRIALS}
        language={state.language}
      />

      <div className="task-stimulus">
        {phase === "fixation" && (
          <h1 style={{ fontSize: "4.5rem", color: "#2563EB", fontWeight: 700 }}>+</h1>
        )}
        
        {phase === "stimulus" && trial && (
          <div className="stimulus-animate" style={{ textAlign: "center" }}>
            <h1 style={{ 
              fontSize: "clamp(3.5rem, 8vw, 6rem)", 
              letterSpacing: "14px", 
              fontWeight: 900, 
              color: "var(--text-primary)", 
              fontFamily: "monospace",
              userSelect: "none"
            }}>
              {trial.stimulusString}
            </h1>
            <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
              {isBn ? "মাঝখানের তীরটি লক্ষ্য করুন" : "Focus on the CENTER arrow"}
            </div>
          </div>
        )}
      </div>

      {phase === "stimulus" && (
        <div className="mobile-controls-container">
          <div className="mobile-controls" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", maxWidth: 440, margin: "0 auto", gap: 14 }}>
            <button 
              className="mobile-btn" 
              onClick={() => handleResponse("left")}
              style={{ borderColor: "#BFDBFE", color: "#1D4ED8", padding: "14px 20px" }}
            >
              <span className="keycap">←</span> {isBn ? "বাম (LEFT)" : "LEFT"}
            </button>
            <button 
              className="mobile-btn" 
              onClick={() => handleResponse("right")}
              style={{ borderColor: "#DDD6FE", color: "#6D28D9", padding: "14px 20px" }}
            >
              <span className="keycap">→</span> {isBn ? "ডান (RIGHT)" : "RIGHT"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
