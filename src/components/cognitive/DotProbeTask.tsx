"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import { balancedFlags, roundedMeanOrNull, differenceOrNull, sampleWithoutReplacement } from "@/utils/trials";
import TaskCompleteScreen from "./TaskCompleteScreen";
import TaskInstructionCard from "./TaskInstructionCard";
import TaskHUD from "./TaskHUD";

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
// Trials that get no response within this window are recorded as misses
// rather than hanging the task forever.
const RESPONSE_DEADLINE = 2000;

// Large enough to fill a full run without repeating an item, so repetition
// priming does not confound the attentional-bias score.
const NEUTRAL_WORDS = {
  en: [
    "CHAIR", "TABLE", "WATER", "HOUSE", "PAPER", "PLANT", "CLOCK", "GLASS", "TRAIN", "APPLE",
    "BREAD", "RIVER", "STONE", "LIGHT", "MUSIC", "BRUSH", "FIELD", "CLOUD", "SUGAR", "SHIRT",
    "ROUTE", "GRASS", "STICK", "BOTTLE", "WINDOW", "PENCIL", "CARPET", "GARDEN", "BASKET", "CANDLE",
  ],
  bn: [
    "চেয়ার", "টেবিল", "জল", "বাড়ি", "কাগজ", "গাছ", "ঘড়ি", "গ্লাস", "ট্রেন", "আপেল",
    "রুটি", "নদী", "পাথর", "আলো", "গান", "তুলি", "মাঠ", "মেঘ", "চিনি", "জামা",
    "রাস্তা", "ঘাস", "লাঠি", "বোতল", "জানালা", "পেন্সিল", "কার্পেট", "বাগান", "ঝুড়ি", "মোমবাতি",
  ],
};
const TARGET_WORDS = {
  en: [
    "ANGER", "DEATH", "FEAR", "PANIC", "GRIEF", "HATE", "ENEMY", "SNAKE", "SPIDER", "PAIN",
    "TERROR", "AGONY", "THREAT", "DANGER", "DISEASE", "FUNERAL", "VICTIM", "CRUEL", "WOUND", "TRAUMA",
    "DESPAIR", "HORROR", "POISON", "ASSAULT", "MISERY", "PANICKY", "SHAME", "DREAD", "CRISIS", "RUIN",
  ],
  bn: [
    "রাগ", "মৃত্যু", "ভয়", "আতঙ্ক", "শোক", "ঘৃণা", "শত্রু", "সাপ", "মাকড়সা", "ব্যথা",
    "সন্ত্রাস", "যন্ত্রণা", "হুমকি", "বিপদ", "রোগ", "শবযাত্রা", "শিকার", "নিষ্ঠুর", "ক্ষত", "আঘাত",
    "হতাশা", "বিভীষিকা", "বিষ", "আক্রমণ", "দুঃখ", "উদ্বেগ", "লজ্জা", "ত্রাস", "সংকট", "ধ্বংস",
  ],
};

export default function DotProbeTask({ onComplete }: { onComplete?: () => void }) {
  const { state, markTestCompleted } = useAppContext();
  const router = useRouter();
  
  const [phase, setPhase] = useState<"instructions" | "fixation" | "words" | "dot" | "completed">("instructions");
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
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const interTrialRef = useRef<NodeJS.Timeout | null>(null);
  const hasRespondedRef = useRef(false);

  // Generate sequence — counterbalanced: exactly half the trials are congruent
  // (dot behind the emotional word) and target side is balanced independently,
  // so the attentional-bias score rests on equal-sized cells. Words are sampled
  // without replacement to limit repetition priming.
  useEffect(() => {
    const neutralDict = state.language === 'bn' ? NEUTRAL_WORDS.bn : NEUTRAL_WORDS.en;
    const targetDict = state.language === 'bn' ? TARGET_WORDS.bn : TARGET_WORDS.en;

    const targetLeft = balancedFlags(TOTAL_TRIALS, 0.5);
    const congruentFlags = balancedFlags(TOTAL_TRIALS, 0.5);
    const neutralWords = sampleWithoutReplacement(neutralDict, TOTAL_TRIALS);
    const targetWords = sampleWithoutReplacement(targetDict, TOTAL_TRIALS);

    const sequence: Trial[] = targetLeft.map((isTargetLeft: boolean, i: number) => {
      const targetPosition: "left" | "right" = isTargetLeft ? "left" : "right";
      const congruent = congruentFlags[i];
      const dotPosition: "left" | "right" = congruent
        ? targetPosition
        : (targetPosition === "left" ? "right" : "left");

      return {
        leftWord: targetPosition === "left" ? targetWords[i] : neutralWords[i],
        rightWord: targetPosition === "right" ? targetWords[i] : neutralWords[i],
        targetPosition,
        dotPosition,
        congruent,
      };
    });
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

    // 1. Fixation
    timeoutRef.current = setTimeout(() => {
      setPhase("words");

      // 2. Words
      timeoutRef.current = setTimeout(() => {
        setPhase("dot");
        startTimeRef.current = performance.now();

        // 3. Response deadline. Previously this waited indefinitely, so a
        // distracted participant produced a 45-second "reaction time" that
        // entered the mean, and an abandoned run hung with no way forward.
        responseTimeoutRef.current = setTimeout(() => {
          if (hasRespondedRef.current) return;
          hasRespondedRef.current = true;
          const trial = trials[index];
          if (trial) {
            setResults(prev => [...prev, { ...trial, rt: null, correct: false }]);
          }
          runNextTrial(index + 1);
        }, RESPONSE_DEADLINE);
      }, STIMULUS_DURATION);

    }, FIXATION_DURATION);
  };

  const handleResponse = useCallback((responsePos: "left" | "right") => {
    if (phase !== "dot" || hasRespondedRef.current) return;
    
    hasRespondedRef.current = true;
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    const rt = performance.now() - startTimeRef.current;
    const trial = trials[currentTrialIndex];
    const correct = responsePos === trial.dotPosition;

    setResults(prev => [...prev, { ...trial, rt, correct }]);

    interTrialRef.current = setTimeout(() => {
      runNextTrial(currentTrialIndex + 1);
    }, 500);
  }, [phase, currentTrialIndex, trials]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.code;
    if (key === "KeyE" || key === "ArrowLeft") handleResponse("left");
    if (key === "KeyI" || key === "ArrowRight") handleResponse("right");
  }, [handleResponse]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    return () => {
      // All three must be cleared, otherwise navigating away mid-task
      // leaves timers firing setState on an unmounted component.
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
      if (interTrialRef.current) clearTimeout(interTrialRef.current);
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
    
    // Parameters (only correct, RT > 150ms)
    const validTrials = results.filter(r => r.correct && r.rt !== null && r.rt > 150);
    const congruentRTs = validTrials.filter(r => r.congruent).map(r => r.rt as number);
    const incongruentRTs = validTrials.filter(r => !r.congruent).map(r => r.rt as number);

    
    const meanRTCongruent = roundedMeanOrNull(congruentRTs);
    const meanRTIncongruent = roundedMeanOrNull(incongruentRTs);
    const biasScore = differenceOrNull(meanRTIncongruent, meanRTCongruent); // Positive means attention was captured by target word

    
    setCalculatedParams({
      param1Name: "Mean RT Congruent (ms)", param1Value: meanRTCongruent,
      param2Name: "Mean RT Incongruent (ms)", param2Value: meanRTIncongruent,
      param3Name: "Attentional Bias Score", param3Value: biasScore
    });
    try {
      const res = await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          testCategory: "Attention",
          specificTest: "Dot Probe Task",
          param1Name: "Mean RT Congruent (ms)",
          param1Value: meanRTCongruent,
          param2Name: "Mean RT Incongruent (ms)",
          param2Value: meanRTIncongruent,
          param3Name: "Attentional Bias Score",
          param3Value: biasScore,
          rawTrialData: results
        })
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok && !payload?.offline) {
        throw new Error(payload?.error || `Upload failed (${res.status})`);
      }
      setQueuedOffline(Boolean(payload?.offline));
      markTestCompleted("/cognitive/dotprobe");
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
        title={isBn ? "ডট প্রোব টাস্ক — ভিজ্যুয়াল স্পটলাইট" : "Dot Probe Task — Visual Spotlight"}
        subtitle={isBn ? "ডট বা লক্ষ্যবিন্দু কোন পাশে ফুটে উঠলো?" : "Where did the target dot appear?"}
        icon="📍"
        category={isBn ? "মনোযোগ (Attention)" : "Attention Bias"}
        language={state.language}
        mission={
          isBn
            ? "মাঝখানের ক্রসের পর ক্ষণিকের জন্য দুটি শব্দ দেখা যাবে। শব্দ দুটি মিলিয়ে যাওয়ার সাথে সাথেই বাম অথবা ডান পাশে একটি নীল ডট (●) জ্বলবে। ডটটি দেখার সাথে সাথে দ্রুত বোতাম চাপুন!"
            : "After the center cross, two words flash briefly. As soon as they disappear, a glowing blue dot (●) appears on the LEFT or RIGHT. Detect its position as fast as possible!"
        }
        visualExample={
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ padding: 14, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", marginBottom: 6 }}>
                {isBn ? "ধাপ ১: শব্দ দুটি ফ্ল্যাশ করবে" : "STEP 1: WORDS FLASH"}
              </div>
              <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "10px 0" }}>
                <span style={{ fontWeight: 800, color: "#DC2626", fontSize: 16 }}>{isBn ? "রাগ" : "ANGER"}</span>
                <span style={{ color: "#CBD5E1" }}>|</span>
                <span style={{ fontWeight: 800, color: "#2563EB", fontSize: 16 }}>{isBn ? "নদী" : "RIVER"}</span>
              </div>
            </div>
            <div style={{ padding: 14, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1E40AF", marginBottom: 6 }}>
                {isBn ? "ধাপ ২: ডট দেখা দিলে চাপুন" : "STEP 2: DOT APPEARS"}
              </div>
              <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "8px 0" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2563EB", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900 }}>●</div>
                <span style={{ color: "#CBD5E1" }}>|</span>
                <div style={{ width: 28, height: 28 }}></div>
              </div>
              <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: "#1D4ED8" }}>
                {isBn ? "বামে ডট ➔ [ E ] বা [ ← ] চাপুন" : "Dot on Left ➔ Press [ E ] or [ ← ]"}
              </div>
            </div>
          </div>
        }
        rules={[
          { text: isBn ? "ডটটি বাম পাশে দেখা দিলে [E] অথবা [←] চাপুন।" : "If dot appears on the LEFT, press [E] or [←].", icon: "👈" },
          { text: isBn ? "ডটটি ডান পাশে দেখা দিলে [I] অথবা [→] চাপুন।" : "If dot appears on the RIGHT, press [I] or [→].", icon: "👉" },
          { text: isBn ? "ডটটি খুব দ্রুত চলে যেতে পারে, তাই সবসময় প্রস্তুত থাকুন!" : "The dot appears quickly — keep your eyes sharp!", icon: "⚡" },
          { text: isBn ? "মোট ৪০টি দ্রুত ট্রায়াল সম্পন্ন করতে হবে।" : "There are 40 quick trials in total.", icon: "🎯" },
        ]}
        controls={[
          { key: "E / ←", action: isBn ? "বাম (Left)" : "Left", color: "#2563EB" },
          { key: "I / →", action: isBn ? "ডান (Right)" : "Right", color: "#7C3AED" },
        ]}
        tip={isBn ? "ল্যাপটপের কীবোর্ড বা নিচের বোতামগুলিতে ক্লিক করতে পারেন।" : "You can use keyboard keys (E / I or Arrow keys) or click the buttons below."}
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
        title={isBn ? "ডট প্রোব" : "Dot Probe"}
        icon="📍"
        category={isBn ? "মনোযোগ" : "Attention"}
        currentTrial={currentTrialIndex + 1}
        totalTrials={TOTAL_TRIALS}
        language={state.language}
      />

      <div className="task-stimulus" style={{ flexDirection: "column" }}>
        {phase === "fixation" && (
          <h1 style={{ fontSize: "4.5rem", color: "#2563EB", fontWeight: 700 }}>+</h1>
        )}
        
        {phase === "words" && trial && (
          <div style={{ display: "flex", width: "100%", maxWidth: "680px", justifyContent: "space-between", padding: "0 24px" }} className="stimulus-animate">
            <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", margin: 0, textAlign: "left", width: "45%", color: "var(--text-primary)", fontWeight: 800 }}>
              {trial.leftWord}
            </h1>
            <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", margin: 0, textAlign: "right", width: "45%", color: "var(--text-primary)", fontWeight: 800 }}>
              {trial.rightWord}
            </h1>
          </div>
        )}

        {phase === "dot" && trial && (
          <div style={{ display: "flex", width: "100%", maxWidth: "680px", justifyContent: trial.dotPosition === "left" ? "flex-start" : "flex-end", padding: "0 60px" }} className="stimulus-animate">
            <div style={{ 
              width: 56, 
              height: 56, 
              borderRadius: "50%", 
              background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
              boxShadow: "0 0 24px rgba(37, 99, 235, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "1.8rem",
              fontWeight: 900
            }}>
              ●
            </div>
          </div>
        )}
      </div>

      {phase === "dot" && (
        <div className="mobile-controls-container">
          <div className="mobile-controls" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", maxWidth: 440, margin: "0 auto", gap: 14 }}>
            <button 
              className="mobile-btn" 
              onClick={() => handleResponse("left")}
              style={{ borderColor: "#BFDBFE", color: "#1D4ED8", padding: "14px 20px" }}
            >
              <span className="keycap">E / ←</span> {isBn ? "বাম (LEFT)" : "LEFT"}
            </button>
            <button 
              className="mobile-btn" 
              onClick={() => handleResponse("right")}
              style={{ borderColor: "#DDD6FE", color: "#6D28D9", padding: "14px 20px" }}
            >
              <span className="keycap">I / →</span> {isBn ? "ডান (RIGHT)" : "RIGHT"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
