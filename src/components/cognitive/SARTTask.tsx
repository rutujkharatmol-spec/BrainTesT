"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";

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
  
  const [phase, setPhase] = useState<"instructions" | "running" | "completed">("instructions");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(-1);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    if (phase === "completed" && !submitting && results.length === TOTAL_TRIALS) {
      submitData();
    }
  }, [phase, results]);

  const submitData = async () => {
    setSubmitting(true);
    
    // Parameters
    const goTrials = results.filter(r => !r.isNoGo && r.pressed && r.rt !== null && r.rt > 100);
    const meanRTGo = goTrials.length ? goTrials.reduce((sum, r) => sum + (r.rt as number), 0) / goTrials.length : 0;
    
    const commissionErrors = results.filter(r => r.errorType === "commission").length;
    const omissionErrors = results.filter(r => r.errorType === "omission").length;

    try {
      await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId || "demo-session",
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
      if (onComplete) {
        onComplete();
      } else {
        markTestCompleted("/cognitive/sart");
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
        <h2>{state.language === 'bn' ? "এস.এ.আর.টি (SART - সাসটেইন্ড অ্যাটেনশন টু রেসপন্স টাস্ক)" : "SART (Sustained Attention to Response Task)"}</h2>
        <p>{state.language === 'bn' ? "আপনি স্ক্রিনে দ্রুত একক সংখ্যাগুলি (১ থেকে ৯) ঝলকানি দেখতে পাবেন।" : "You will see single digits (1 through 9) flash rapidly on the screen."}</p>
        <p style={{ marginTop: 16 }}>
          <strong>{state.language === 'bn' ? "প্রতিটি সংখ্যার জন্য যত দ্রুত সম্ভব স্পেসবার (SPACEBAR) চাপুন বা PRESS এ ট্যাপ করুন..." : "Press the SPACEBAR or tap PRESS as quickly as possible for every digit..."}</strong>
        </p>
        <p style={{ margin: "16px 0", fontSize: "1.2rem", color: "var(--error-color)", fontWeight: "bold" }}>
          {state.language === 'bn' ? "তবে ৩ সংখ্যাটির জন্য নয়!" : "EXCEPT for the number 3!"}
        </p>
        <p>{state.language === 'bn' ? "যদি আপনি একটি ৩ দেখতে পান, তবে " : "If you see a 3, "}<strong>{state.language === 'bn' ? "কিছু চাপবেন না।" : "DO NOT PRESS ANYTHING"}</strong>{state.language === 'bn' ? "" : "."}</p>
        <button className="btn" onClick={startTask} style={{ marginTop: 32, width: "100%", padding: "14px", fontSize: "1.1rem" }}>{state.language === 'bn' ? "টাস্ক শুরু করুন" : "Start Task"}</button>
      </div>
    );
  }

  if (phase === "running") {
    const trial = trials[currentTrialIndex];
    return (
      <div className="task-view-container">
        <div className="task-stimulus" style={{ position: "relative" }}>
          {showStimulus ? (
            <h1 style={{ fontSize: "8rem", fontWeight: "bold", color: "var(--text-primary)" }}>{trial?.digit}</h1>
          ) : (
            <div style={{ fontSize: "6rem", opacity: 0.1, color: "var(--text-primary)" }}>⊗</div> // Mask symbol commonly used in SART
          )}
          
          <div style={{
            position: "absolute",
            bottom: "-40px",
            left: "50%",
            transform: "translateX(-50%)",
            opacity: hasPressed ? 1 : 0,
            transition: "opacity 0.1s",
            color: "var(--success-color)",
            fontWeight: "bold"
          }}>
            {state.language === 'bn' ? "নিবন্ধিত" : "Registered"}
          </div>
        </div>

        <div className="mobile-controls-container">
          <div className="mobile-controls">
            <button 
              className="mobile-btn" 
              onClick={handleResponse} 
              disabled={hasPressed}
            >
              {state.language === 'bn' ? "চাপুন (PRESS - GO)" : "PRESS (GO)"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
      <h2>{state.language === 'bn' ? "টাস্ক সম্পন্ন হয়েছে!" : "Task Completed!"}</h2>
      {submitting ? <p>{state.language === 'bn' ? "ডেটা আপলোড করা হচ্ছে..." : "Uploading data..."}</p> : <p>{state.language === 'bn' ? "সম্পন্ন!" : "Done!"}</p>}
    </div>
  );
}
