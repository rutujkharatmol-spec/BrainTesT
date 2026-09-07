"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import { balancedFlags, roundedMeanOrNull, sampleWithoutReplacement } from "@/utils/trials";
import TaskCompleteScreen from "./TaskCompleteScreen";
import TaskInstructionCard from "./TaskInstructionCard";
import TaskHUD from "./TaskHUD";

type Trial = {
  string: string;
  isWord: boolean;
};

type TrialResult = Trial & {
  rt: number | null;
  correct: boolean;
};

const TOTAL_TRIALS = 40;
const FIXATION_DURATION = 500;

// Each list holds at least TOTAL_TRIALS/2 items so a full run can be drawn
// without repeating any item.
const WORDS = {
  en: [
    "HOUSE", "APPLE", "WATER", "CHAIR", "PLANT", "CLOCK", "TABLE", "GLASS", "TRAIN", "PAPER",
    "BREAD", "RIVER", "STONE", "LIGHT", "MUSIC", "BRUSH", "FIELD", "CLOUD", "SUGAR", "TIGER",
    "SHIRT", "MONEY", "ROUTE", "GRASS", "STICK",
  ],
  bn: [
    "বাড়ি", "আপেল", "জল", "চেয়ার", "গাছ", "ঘড়ি", "টেবিল", "গ্লাস", "ট্রেন", "কাগজ",
    "রুটি", "নদী", "পাথর", "আলো", "গান", "তুলি", "মাঠ", "মেঘ", "চিনি", "বাঘ",
    "জামা", "টাকা", "রাস্তা", "ঘাস", "লাঠি",
  ],
};
const NON_WORDS = {
  en: [
    "BLAP", "TRISK", "FROBN", "GLAR", "SNURT", "VLEEB", "CROMB", "PLANKT", "SNARF", "FLIRM",
    "DRENT", "SPULK", "TRAMB", "GLINK", "PROST", "KLIMP", "BRUNK", "SWELP", "THRIM", "CLOND",
    "GRAFT", "PLUSK", "SNODE", "TWERN", "BLIMP",
  ],
  bn: [
    "ঝিকাত", "লিমুট", "চামুর", "ফেনক", "পিসুল", "হিরাম", "ভুসক", "রিসত", "নাপস", "টোমার",
    "কেলুপ", "মিদরা", "শুবাক", "ঢোপিন", "তরুস", "গমিল", "বেসুক", "নিঝল", "পাত্রুম", "সোমিদ",
    "খলুপ", "রেমিত", "চুবাল", "ধিনক", "সপুরা",
  ],
};

export default function LDTTask({ onComplete }: { onComplete?: () => void }) {
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

  // Generate sequence — exactly half words / half non-words, and items drawn
  // without replacement so a 10-item list is not repeated ~4x across 40 trials
  // (which would let repetition priming drive the word/non-word contrast).
  useEffect(() => {
    const wordDict = state.language === 'bn' ? WORDS.bn : WORDS.en;
    const nonWordDict = state.language === 'bn' ? NON_WORDS.bn : NON_WORDS.en;

    const isWordFlags = balancedFlags(TOTAL_TRIALS, 0.5);
    const words = sampleWithoutReplacement(wordDict, TOTAL_TRIALS);
    const nonWords = sampleWithoutReplacement(nonWordDict, TOTAL_TRIALS);

    const sequence: Trial[] = isWordFlags.map((isWord: boolean, i: number) => ({
      string: isWord ? words[i] : nonWords[i],
      isWord,
    }));
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
    const userSaidWord = responseKey === "KeyF";
    const correct = userSaidWord === trial.isWord;

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
    
    const validTrials = results.filter(r => r.correct && r.rt !== null && r.rt > 100);
    const wordRTs = validTrials.filter(r => r.isWord).map(r => r.rt as number);
    const nonWordRTs = validTrials.filter(r => !r.isWord).map(r => r.rt as number);

    
    const meanRTWords = roundedMeanOrNull(wordRTs);
    const meanRTNonWords = roundedMeanOrNull(nonWordRTs);
    const overallAccuracy = (results.filter(r => r.correct).length / TOTAL_TRIALS) * 100;

    
    setCalculatedParams({
      param1Name: "Mean RT Words (ms)", param1Value: meanRTWords,
      param2Name: "Mean RT Non-words (ms)", param2Value: meanRTNonWords,
      param3Name: "Overall Accuracy (%)", param3Value: Math.round(overallAccuracy)
    });
    try {
      const res = await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          testCategory: "Social & Emotional Cognition",
          specificTest: "Lexical Decision Task",
          param1Name: "Mean RT Words (ms)",
          param1Value: meanRTWords,
          param2Name: "Mean RT Non-words (ms)",
          param2Value: meanRTNonWords,
          param3Name: "Overall Accuracy (%)",
          param3Value: Math.round(overallAccuracy),
          rawTrialData: results
        })
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok && !payload?.offline) {
        throw new Error(payload?.error || `Upload failed (${res.status})`);
      }
      setQueuedOffline(Boolean(payload?.offline));
      markTestCompleted("/cognitive/ldt");
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
        title={isBn ? "লেক্সিক্যাল ডিসিশন টাস্ক — আসল নাকি বানানো?" : "Lexical Decision Task — Real or Fake?"}
        subtitle={isBn ? "শব্দটি আসল নাকি বানানো তা চিনুন" : "Identify real words vs made-up non-words"}
        icon="📖"
        category={isBn ? "ভাষাগত জ্ঞান (Language)" : "Language & Cognition"}
        language={state.language}
        mission={
          isBn
            ? "স্ক্রিনে একটি শব্দ ভেসে উঠবে। যদি এটি একটি আসল ও অর্থপূর্ণ শব্দ হয়, তবে 'F' বা WORD চাপুন। আর যদি এটি অর্থহীন বা বানানো শব্দ হয়, তবে 'J' বা NON-WORD চাপুন!"
            : "A word will appear on screen. Decide as quickly as possible: Is it a REAL dictionary word (press [F]), or a MADE-UP non-word (press [J])?"
        }
        visualExample={
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ padding: 14, background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#065F46", marginBottom: 6 }}>
                {isBn ? "উদাহরণ ১: আসল শব্দ" : "EXAMPLE 1: REAL WORD"}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#047857" }}>
                {isBn ? "বাড়ি" : "HOUSE"}
              </div>
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#065F46" }}>
                {isBn ? "আসল শব্দ ➔ [ F ] WORD চাপুন" : "Real Word ➔ Press [ F ] WORD"}
              </div>
            </div>
            <div style={{ padding: 14, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#991B1B", marginBottom: 6 }}>
                {isBn ? "উদাহরণ ২: বানানো/অর্থহীন শব্দ" : "EXAMPLE 2: FAKE WORD"}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#DC2626" }}>
                {isBn ? "ঝিকাত" : "BLAP"}
              </div>
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#991B1B" }}>
                {isBn ? "অর্থহীন শব্দ ➔ [ J ] NON-WORD চাপুন" : "Fake Word ➔ Press [ J ] NON-WORD"}
              </div>
            </div>
          </div>
        }
        rules={[
          { text: isBn ? "আসল অর্থপূর্ণ শব্দ হলে [F] বা WORD বাটন চাপুন।" : "If it is a REAL meaningful word, press [F] or tap WORD.", icon: "✅" },
          { text: isBn ? "অর্থহীন বা বানানো শব্দ হলে [J] বা NON-WORD বাটন চাপুন।" : "If it is a MADE-UP non-word, press [J] or tap NON-WORD.", icon: "❌" },
          { text: isBn ? "যত দ্রুত এবং সঠিকভাবে সম্ভব উত্তর দিন।" : "Answer as fast and accurately as possible.", icon: "⚡" },
          { text: isBn ? "মোট ৪০টি ট্রায়াল সম্পন্ন করতে হবে।" : "There are 40 quick trials in total.", icon: "🎯" },
        ]}
        controls={[
          { key: "F", action: isBn ? "আসল শব্দ (Word)" : "Real Word", color: "#059669" },
          { key: "J", action: isBn ? "অর্থহীন শব্দ (Non-Word)" : "Non-Word", color: "#DC2626" },
        ]}
        tip={isBn ? "ল্যাপটপের কীবোর্ড (F / J) বা নিচের বোতামগুলিতে ক্লিক করতে পারেন।" : "You can use keyboard keys (F and J) or click the buttons below."}
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
        title={isBn ? "লেক্সিক্যাল ডিসিশন" : "Lexical Decision"}
        icon="📖"
        category={isBn ? "ভাষাগত জ্ঞান" : "Language & Cognition"}
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
              fontSize: "clamp(3rem, 8vw, 5.5rem)", 
              fontWeight: 900, 
              textTransform: "uppercase", 
              color: "var(--text-primary)",
              letterSpacing: "3px"
            }}>
              {trial.string}
            </h1>
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
              <span className="keycap">F</span> {isBn ? "আসল শব্দ (WORD)" : "REAL WORD"}
            </button>
            <button 
              className="mobile-btn" 
              onClick={() => handleResponse("KeyJ")}
              style={{ borderColor: "#FECACA", color: "#991B1B", padding: "14px 18px" }}
            >
              <span className="keycap">J</span> {isBn ? "অর্থহীন শব্দ (NON-WORD)" : "NON-WORD"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
