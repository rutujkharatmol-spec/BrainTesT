"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";

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
  
  const [phase, setPhase] = useState<"instructions" | "fixation" | "stimulus" | "completed">("instructions");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRespondedRef = useRef(false);

  // Generate sequence
  useEffect(() => {
    const sequence: Trial[] = [];
    for (let i = 0; i < TOTAL_TRIALS; i++) {
      const direction = Math.random() < 0.5 ? "left" : "right";
      const congruent = Math.random() < 0.5;
      
      let stimulusString = "";
      if (direction === "left" && congruent) stimulusString = "<<<<<";
      if (direction === "right" && congruent) stimulusString = ">>>>>";
      if (direction === "left" && !congruent) stimulusString = ">><>>";
      if (direction === "right" && !congruent) stimulusString = "<<><<";
      
      sequence.push({ direction, congruent, stimulusString });
    }
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

  useEffect(() => {
    if (phase === "completed" && !submitting && results.length === TOTAL_TRIALS) {
      submitData();
    }
  }, [phase, results]);

  const submitData = async () => {
    setSubmitting(true);
    
    // Parameters (only correct, RT > 100ms)
    const validTrials = results.filter(r => r.correct && r.rt !== null && r.rt > 100);
    const congruentRTs = validTrials.filter(r => r.congruent).map(r => r.rt as number);
    const incongruentRTs = validTrials.filter(r => !r.congruent).map(r => r.rt as number);

    const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    
    const meanRTCongruent = mean(congruentRTs);
    const meanRTIncongruent = mean(incongruentRTs);
    const flankerEffect = meanRTIncongruent - meanRTCongruent; 

    try {
      await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId || "demo-session",
          testCategory: "Executive Function",
          specificTest: "Eriksen Flanker Task",
          param1Name: "Mean RT Congruent (ms)",
          param1Value: Math.round(meanRTCongruent),
          param2Name: "Mean RT Incongruent (ms)",
          param2Value: Math.round(meanRTIncongruent),
          param3Name: "Flanker Effect",
          param3Value: Math.round(flankerEffect),
          rawTrialData: results
        })
      });
      if (onComplete) {
        onComplete();
      } else {
        markTestCompleted("/cognitive/flanker");
        setTimeout(() => window.location.href = "/", 200);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save cognitive data.");
    }
  };

  if (phase === "instructions") {
    return (
      <div className="card" style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
        <h2>{state.language === 'bn' ? "এরিকসেন ফ্ল্যাঙ্কার টাস্ক" : "Eriksen Flanker Task"}</h2>
        <p>{state.language === 'bn' ? "আপনি স্ক্রিনে পাঁচটি তীরের একটি সারি দেখতে পাবেন।" : "You will see a row of five arrows on the screen."}</p>
        <p>{state.language === 'bn' ? "আপনার লক্ষ্য হল চারপাশের তীরগুলিকে উপেক্ষা করে মাঝখানের তীরের দিক নির্দেশ করা।" : "Your goal is to indicate the direction of the CENTER arrow while ignoring the surrounding arrows."}</p>
        <div style={{ margin: "24px 0", textAlign: "left", display: "inline-block", background: "#F9FAFB", padding: "16px", borderRadius: "8px", border: "1px solid var(--card-border)" }}>
          <p>{state.language === 'bn' ? "মাঝখানের তীরটি যদি বাম দিকে (LEFT) নির্দেশ করে, তবে বাম তীর কী (LEFT ARROW KEY) চাপুন বা বাম (LEFT) এ ট্যাপ করুন।" : "If the center arrow points LEFT, press the LEFT ARROW KEY or tap LEFT."}</p>
          <p style={{ marginTop: 8 }}>{state.language === 'bn' ? "মাঝখানের তীরটি যদি ডান দিকে (RIGHT) নির্দেশ করে, তবে ডান তীর কী (RIGHT ARROW KEY) চাপুন বা ডান (RIGHT) এ ট্যাপ করুন।" : "If the center arrow points RIGHT, press the RIGHT ARROW KEY or tap RIGHT."}</p>
        </div>
        <p>{state.language === 'bn' ? "যত দ্রুত এবং সঠিকভাবে সম্ভব উত্তর দিন।" : "Please respond as quickly and accurately as possible."}</p>
        <button className="btn" onClick={startTask} style={{ marginTop: 32, width: "100%", padding: "14px", fontSize: "1.1rem" }}>{state.language === 'bn' ? "টাস্ক শুরু করুন" : "Start Task"}</button>
      </div>
    );
  }

  if (phase === "completed") {
    return (
      <div className="card" style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
        <h2>{state.language === 'bn' ? "টাস্ক সম্পন্ন হয়েছে!" : "Task Completed!"}</h2>
        {submitting ? <p>{state.language === 'bn' ? "ডেটা আপলোড করা হচ্ছে..." : "Uploading data..."}</p> : <p>{state.language === 'bn' ? "সম্পন্ন!" : "Done!"}</p>}
      </div>
    );
  }

  const trial = trials[currentTrialIndex];

  return (
    <div className="task-view-container">
      <div className="task-stimulus">
        {phase === "fixation" && <h1 style={{ fontSize: "4rem", color: "var(--text-primary)" }}>+</h1>}
        
        {phase === "stimulus" && trial && (
          <h1 style={{ fontSize: "6rem", letterSpacing: "10px", fontWeight: "bold", color: "var(--text-primary)" }}>
            {trial.stimulusString}
          </h1>
        )}
      </div>

      {phase === "stimulus" && (
        <div className="mobile-controls-container">
          <div className="mobile-controls">
            <button className="mobile-btn" onClick={() => handleResponse("left")}>{state.language === 'bn' ? "বাম (LEFT)" : "LEFT"}</button>
            <button className="mobile-btn" onClick={() => handleResponse("right")}>{state.language === 'bn' ? "ডান (RIGHT)" : "RIGHT"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
