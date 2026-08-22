"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import TaskCompleteScreen from "./TaskCompleteScreen";

type Phase = "instructions" | "presentation" | "recall" | "completed";

export default function DigitSpanTask({ onComplete }: { onComplete?: () => void }) {
  const { state, markTestCompleted } = useAppContext();
  const router = useRouter();
  
  // Beyond this the task stops being a meaningful span measure.
  const MAX_SPAN = 12;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const flashRef = useRef<NodeJS.Timeout | null>(null);
  const advanceRef = useRef<NodeJS.Timeout | null>(null);

  const [phase, setPhase] = useState<Phase>("instructions");
  const [spanLength, setSpanLength] = useState(3);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [activeDigit, setActiveDigit] = useState<number | null>(null);
  
  const [maxSpan, setMaxSpan] = useState(0);
  const [errorsAtCurrentSpan, setErrorsAtCurrentSpan] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [calculatedParams, setCalculatedParams] = useState<any>(null);
  // True when the result was only queued locally (device offline).
  const [queuedOffline, setQueuedOffline] = useState(false);

  const startTask = () => {
    generateAndPlaySequence(3);
  };

  const generateAndPlaySequence = (length: number) => {
    if (length > MAX_SPAN) {
      setPhase("completed");
      return;
    }
    setPhase("presentation");
    setSpanLength(length);
    setUserSequence([]);
    
    const newSeq: number[] = [];
    for (let i = 0; i < length; i++) {
      newSeq.push(Math.floor(Math.random() * 10));
    }
    setSequence(newSeq);

    // Play sequence
    let step = 0;
    // Refs so unmount can cancel these; they previously outlived the component.
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (step < newSeq.length) {
        setActiveDigit(newSeq[step]);
        if (flashRef.current) clearTimeout(flashRef.current);
        flashRef.current = setTimeout(() => setActiveDigit(null), 700); // 700ms visible
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setPhase("recall");
      }
      step++;
    }, 1000); // 1 digit per second
  };

  const handleDigitClick = (digit: number) => {
    if (phase !== "recall") return;
    
    const newUserSequence = [...userSequence, digit];
    setUserSequence(newUserSequence);

    if (newUserSequence.length === sequence.length) {
      checkResult(newUserSequence);
    }
  };

  // Keyboard support
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (phase !== "recall") return;
    const num = parseInt(e.key);
    if (!isNaN(num) && num >= 0 && num <= 9) {
      handleDigitClick(num);
    }
  }, [phase, userSequence, sequence]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const checkResult = (userInput: number[]) => {
    const isCorrect = userInput.every((val, i) => val === sequence[i]);

    if (isCorrect) {
      setMaxSpan(Math.max(maxSpan, spanLength));
      setErrorsAtCurrentSpan(0);
      advanceRef.current = setTimeout(() => generateAndPlaySequence(spanLength + 1), 1000);
    } else {
      if (errorsAtCurrentSpan === 0) {
        setErrorsAtCurrentSpan(1);
        advanceRef.current = setTimeout(() => generateAndPlaySequence(spanLength), 1000); // try same span again
      } else {
        // 2 errors at same span -> test ends
        setPhase("completed");
      }
    }
  };

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (flashRef.current) clearTimeout(flashRef.current);
    if (advanceRef.current) clearTimeout(advanceRef.current);
  }, []);

  useEffect(() => {
    if (phase === "completed" && !submitting) {
      submitData();
    }
  }, [phase]);

  const submitData = async () => {
    if (!state.sessionId) {
      alert("No active session — please sign in again before submitting.");
      return;
    }
    setSubmitting(true);
    
    
    setCalculatedParams({
      param1Name: "Maximum Digit Span", param1Value: maxSpan,
      param2Name: null, param2Value: null,
      param3Name: null, param3Value: null
    });
    try {
      const res = await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          testCategory: "Memory",
          specificTest: "Digit Span Task",
          param1Name: "Maximum Digit Span",
          param1Value: maxSpan,
          param2Name: null,
          param2Value: null,
          param3Name: null,
          param3Value: null,
          rawTrialData: { maxSpan }
        })
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok && !payload?.offline) {
        throw new Error(payload?.error || `Upload failed (${res.status})`);
      }
      setQueuedOffline(Boolean(payload?.offline));
      markTestCompleted("/cognitive/digitspan");
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
        <h2>{state.language === 'bn' ? "ডিজিট স্প্যান টেস্ট" : "Digit Span Test"}</h2>
        <p>{state.language === 'bn' ? "স্ক্রিনে একে একে সংখ্যার একটি ক্রম উপস্থিত হবে।" : "A sequence of numbers will appear on the screen, one at a time."}</p>
        <p>{state.language === 'bn' ? "ক্রমটি শেষ হলে, আপনার কীবোর্ড বা স্ক্রিনের বোতামগুলি ব্যবহার করে সংখ্যাগুলি " : "When the sequence finishes, type the numbers in the "}<strong>{state.language === 'bn' ? "ঠিক যে ক্রমে উপস্থিত হয়েছিল" : "exact order"}</strong>{state.language === 'bn' ? " সেই ক্রমেই টাইপ করুন।" : " they appeared using your keyboard or the on-screen buttons."}</p>
        <p>{state.language === 'bn' ? "আপনি সঠিক উত্তর দেওয়ার সাথে সাথে ক্রমটি দীর্ঘ হতে থাকবে।" : "The sequence will get longer as you get them right."}</p>
        <button className="btn" onClick={startTask} style={{ marginTop: 32, width: "100%", padding: "14px", fontSize: "1.1rem" }}>{state.language === 'bn' ? "টাস্ক শুরু করুন" : "Start Task"}</button>
      </div>
    );
  }

  if (phase === "presentation") {
    return (
      <div className="task-view-container">
        <div className="task-stimulus">
          {activeDigit !== null ? (
            <h1 style={{ fontSize: "8rem", fontWeight: "bold", color: "var(--text-primary)" }}>{activeDigit}</h1>
          ) : (
            <div style={{ width: 10, height: 10 }} />
          )}
        </div>
      </div>
    );
  }

  if (phase === "recall") {
    return (
      <div className="task-view-container">
        <div className="task-stimulus" style={{ flexDirection: "column" }}>
          <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
            <h3 style={{ color: "var(--text-primary)" }}>{state.language === 'bn' ? "ক্রমটি কী ছিল?" : "What was the sequence?"}</h3>
            
            <div style={{ 
              minHeight: 60, 
              fontSize: "2rem", 
              margin: "20px 0", 
              borderBottom: "2px solid var(--text-primary)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              letterSpacing: "8px",
              color: "var(--accent-color)",
              fontWeight: "bold",
              wordBreak: "break-all",
              flexWrap: "wrap",
              padding: "10px"
            }}>
              {userSequence.join("")}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button key={num} onClick={() => handleDigitClick(num)} style={{ padding: "20px", fontSize: "1.5rem", borderRadius: "8px", background: "#FFFFFF", border: "1px solid #D1D5DB", color: "var(--text-primary)", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                  {num}
                </button>
              ))}
              <div />
              <button onClick={() => handleDigitClick(0)} style={{ padding: "20px", fontSize: "1.5rem", borderRadius: "8px", background: "#FFFFFF", border: "1px solid #D1D5DB", color: "var(--text-primary)", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                0
              </button>
            </div>
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
