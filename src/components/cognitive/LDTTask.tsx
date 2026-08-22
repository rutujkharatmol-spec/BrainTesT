"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import { balancedFlags, roundedMeanOrNull, sampleWithoutReplacement } from "@/utils/trials";
import TaskCompleteScreen from "./TaskCompleteScreen";

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
        <h2>{state.language === 'bn' ? "লেক্সিক্যাল ডিসিশন টাস্ক (LDT)" : "Lexical Decision Task (LDT)"}</h2>
        <p>{state.language === 'bn' ? "আপনি স্ক্রিনে অক্ষরের একটি স্ট্রিং দেখতে পাবেন।" : "You will see a string of letters appear on the screen."}</p>
        <p>{state.language === 'bn' ? "আপনার লক্ষ্য হল স্ট্রিংটি একটি আসল শব্দ নাকি একটি বানানো অর্থহীন শব্দ তা সিদ্ধান্ত নেওয়া।" : "Your goal is to decide if the string is a real English word or a made-up non-word."}</p>
        <div style={{ margin: "24px 0", textAlign: "left", display: "inline-block", background: "#F9FAFB", padding: 16, borderRadius: 8, border: "1px solid var(--card-border)" }}>
          <p>{state.language === 'bn' ? "যদি এটি একটি আসল শব্দ হয় তবে 'F' চাপুন বা WORD এ ট্যাপ করুন (উদাঃ বাড়ি)।" : "Press 'F' or tap WORD if it is a REAL WORD (e.g. HOUSE)."}</p>
          <p style={{ marginTop: 8 }}>{state.language === 'bn' ? "যদি এটি একটি অর্থহীন শব্দ হয় তবে 'J' চাপুন বা NON-WORD এ ট্যাপ করুন (উদাঃ ব্ল্যাপ)।" : "Press 'J' or tap NON-WORD if it is a NON-WORD (e.g. BLAP)."}</p>
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
      <div className="task-stimulus">
        {phase === "fixation" && <h1 style={{ fontSize: "4rem", color: "var(--text-primary)" }}>+</h1>}
        {phase === "stimulus" && trial && <h1 style={{ fontSize: "6rem", fontWeight: "bold", textTransform: "uppercase", color: "var(--text-primary)" }}>{trial.string}</h1>}
      </div>

      {phase === "stimulus" && (
        <div className="mobile-controls-container">
          <div className="mobile-controls">
            <button className="mobile-btn" onClick={() => handleResponse("KeyF")}>{state.language === 'bn' ? "শব্দ (WORD)" : "WORD"}</button>
            <button className="mobile-btn" onClick={() => handleResponse("KeyJ")}>{state.language === 'bn' ? "অর্থহীন শব্দ (NON-WORD)" : "NON-WORD"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
