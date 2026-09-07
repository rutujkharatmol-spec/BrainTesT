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
    
    // Calculate parameters (only correct answers, RT > 150ms)
    const validTrials = results.filter(r => r.correct && r.rt > 150);
    
    const congruentRTs = validTrials.filter(r => r.congruent).map(r => r.rt);
    const incongruentRTs = validTrials.filter(r => !r.congruent).map(r => r.rt);

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
      if (onComplete) onComplete();
    } catch (e) {
      // Failed: unlatch so the participant can retry.
      submittedRef.current = false;
      console.error(e);
      alert(`Could not save your results: ${e instanceof Error ? e.message : e}\n\nPlease tell the study coordinator before continuing.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === "instructions") {
    const isBn = state.language === "bn";
    return (
      <TaskInstructionCard
        title={isBn ? "স্ট্রুপ টাস্ক — কালার ক্ল্যাশ" : "Stroop Task — Color Clash"}
        subtitle={isBn ? "রঙ বনাম শব্দের চ্যালেঞ্জ" : "Challenge your brain's selective attention"}
        icon="🎯"
        category={isBn ? "এক্সিকিউটিভ ফাংশন" : "Executive Function"}
        language={state.language}
        mission={
          isBn
            ? "শব্দটি কী লেখা আছে তা উপেক্ষা করুন! শব্দটি যে কালিতে বা রঙে লেখা আছে শুধুমাত্র সেই রঙের বোতামটি চাপুন।"
            : "Name the INK COLOR, not the word! Ignore what the word says and choose the color it is printed in."
        }
        visualExample={
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ padding: 14, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#991B1B", marginBottom: 4 }}>
                {isBn ? "উদাহরণ উদ্দীপক" : "EXAMPLE STIMULUS"}
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#DC2626", letterSpacing: 2 }}>
                BLUE
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                {isBn ? "শব্দে লেখা 'BLUE', কিন্তু রঙ হলো " : "Word reads 'BLUE', but ink color is "}
                <strong style={{ color: "#DC2626" }}>{isBn ? "লাল (RED)" : "RED"}</strong>!
              </div>
            </div>
            <div style={{ padding: 14, background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#065F46" }}>
                {isBn ? "✅ সঠিক উত্তর" : "✅ CORRECT ACTION"}
              </div>
              <div style={{ marginTop: 4, fontSize: 15, fontWeight: 800, color: "#DC2626" }}>
                {isBn ? "[ R ] লাল চাপুন" : "Press [ R ] for RED"}
              </div>
              <div style={{ fontSize: 11, color: "#991B1B", marginTop: 2 }}>
                {isBn ? "❌ ব্লু বা নীল চাপবেন না!" : "❌ Don't press Blue!"}
              </div>
            </div>
          </div>
        }
        rules={[
          { text: isBn ? "প্রতিটি শব্দের জন্য যত দ্রুত ও নির্ভুলভাবে সম্ভব উত্তর দিন।" : "Respond as quickly and accurately as possible.", icon: "⚡" },
          { text: isBn ? "ফন্ট কালার দেখতে হবে, শব্দের অর্থ উপেক্ষা করুন।" : "Focus solely on the font color, not the word text.", icon: "👁️" },
          { text: isBn ? "মোট ২০টি ট্রায়াল সম্পন্ন করতে হবে।" : "There are 20 quick trials in total.", icon: "🎯" },
        ]}
        controls={[
          { key: "R", action: isBn ? "লাল (Red)" : "Red", color: "#DC2626" },
          { key: "B", action: isBn ? "নীল (Blue)" : "Blue", color: "#2563EB" },
          { key: "G", action: isBn ? "সবুজ (Green)" : "Green", color: "#059669" },
          { key: "Y", action: isBn ? "হলুদ (Yellow)" : "Yellow", color: "#D97706" },
        ]}
        tip={isBn ? "ল্যাপটপে কীবোর্ড কী বা নিচের রঙের বোতামে ক্লিক করুন।" : "You can use keyboard keys (R, B, G, Y) or click the colored buttons on your screen."}
        onStart={startTask}
      />
    );
  }

  if (phase === "fixation") {
    return (
      <div className="task-view-container">
        <TaskHUD
          title={state.language === "bn" ? "স্ট্রুপ টাস্ক" : "Stroop Task"}
          icon="🎯"
          category={state.language === "bn" ? "এক্সিকিউটিভ ফাংশন" : "Executive Function"}
          currentTrial={currentTrialIndex + 1}
          totalTrials={TOTAL_TRIALS}
          language={state.language}
        />
        <div className="task-stimulus" style={{ fontSize: "4.5rem", color: "#1E40AF", fontWeight: 700 }}>
          +
        </div>
      </div>
    );
  }

  if (phase === "stimulus") {
    const trial = trials[currentTrialIndex];
    return (
      <div className="task-view-container">
        <TaskHUD
          title={state.language === "bn" ? "স্ট্রুপ টাস্ক" : "Stroop Task"}
          icon="🎯"
          category={state.language === "bn" ? "এক্সিকিউটিভ ফাংশন" : "Executive Function"}
          currentTrial={currentTrialIndex + 1}
          totalTrials={TOTAL_TRIALS}
          language={state.language}
        />
        <div className="task-stimulus stimulus-animate">
          <h1 style={{ 
            color: trial.color.toLowerCase(), 
            fontSize: "clamp(3.5rem, 8vw, 6rem)", 
            textTransform: "uppercase",
            fontWeight: 900,
            letterSpacing: 2,
            textShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}>
            {trial.word}
          </h1>
        </div>
        <div className="mobile-controls-container">
          <div className="mobile-controls" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
            <button className="mobile-btn" onClick={() => handleResponse("RED")} style={{ borderColor: "#FECACA", color: "#DC2626" }}>
              <span className="keycap">R</span> {state.language === 'bn' ? "লাল" : "RED"}
            </button>
            <button className="mobile-btn" onClick={() => handleResponse("BLUE")} style={{ borderColor: "#BFDBFE", color: "#2563EB" }}>
              <span className="keycap">B</span> {state.language === 'bn' ? "নীল" : "BLUE"}
            </button>
            <button className="mobile-btn" onClick={() => handleResponse("GREEN")} style={{ borderColor: "#A7F3D0", color: "#059669" }}>
              <span className="keycap">G</span> {state.language === 'bn' ? "সবুজ" : "GREEN"}
            </button>
            <button className="mobile-btn" onClick={() => handleResponse("YELLOW")} style={{ borderColor: "#FDE68A", color: "#D97706" }}>
              <span className="keycap">Y</span> {state.language === 'bn' ? "হলুদ" : "YELLOW"}
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
