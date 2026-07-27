"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../AppContext";

type Phase = "instructions" | "presentation" | "recall" | "completed";

export default function DigitSpanTask({ onComplete }: { onComplete?: () => void }) {
  const { state, markTestCompleted } = useAppContext();
  
  const [phase, setPhase] = useState<Phase>("instructions");
  const [spanLength, setSpanLength] = useState(3);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [activeDigit, setActiveDigit] = useState<number | null>(null);
  
  const [maxSpan, setMaxSpan] = useState(0);
  const [errorsAtCurrentSpan, setErrorsAtCurrentSpan] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const startTask = () => {
    generateAndPlaySequence(3);
  };

  const generateAndPlaySequence = (length: number) => {
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
    const interval = setInterval(() => {
      if (step < newSeq.length) {
        setActiveDigit(newSeq[step]);
        setTimeout(() => setActiveDigit(null), 700); // 700ms visible
      } else {
        clearInterval(interval);
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
      setTimeout(() => generateAndPlaySequence(spanLength + 1), 1000);
    } else {
      if (errorsAtCurrentSpan === 0) {
        setErrorsAtCurrentSpan(1);
        setTimeout(() => generateAndPlaySequence(spanLength), 1000); // try same span again
      } else {
        // 2 errors at same span -> test ends
        setPhase("completed");
      }
    }
  };

  useEffect(() => {
    if (phase === "completed" && !submitting) {
      submitData();
    }
  }, [phase]);

  const submitData = async () => {
    setSubmitting(true);
    
    try {
      await fetch("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId || "demo-session",
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
      if (onComplete) {
        onComplete();
      } else {
        markTestCompleted("/cognitive/digitspan");
        setTimeout(() => window.location.href = "/", 200);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save cognitive data.");
    }
  };

  if (phase === "instructions") {
    return (
      <div className="glass-panel" style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
        <h2>Digit Span Test</h2>
        <p>A sequence of numbers will appear on the screen, one at a time.</p>
        <p>When the sequence finishes, type the numbers in the <strong>exact order</strong> they appeared using your keyboard or the on-screen buttons.</p>
        <p>The sequence will get longer as you get them right.</p>
        <button className="btn" onClick={startTask} style={{ marginTop: 24 }}>Start Task</button>
      </div>
    );
  }

  if (phase === "presentation") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        {activeDigit !== null ? (
          <h1 style={{ fontSize: "8rem", fontWeight: "bold" }}>{activeDigit}</h1>
        ) : (
          <div style={{ width: 10, height: 10 }} />
        )}
      </div>
    );
  }

  if (phase === "recall") {
    return (
      <div style={{ maxWidth: 400, margin: "auto", textAlign: "center" }}>
        <h3>What was the sequence?</h3>
        
        <div style={{ 
          height: 60, 
          fontSize: "2rem", 
          margin: "20px 0", 
          borderBottom: "2px solid var(--text-color)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          letterSpacing: "8px"
        }}>
          {userSequence.join("")}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} onClick={() => handleDigitClick(num)} style={{ padding: "20px", fontSize: "1.5rem", borderRadius: "8px" }}>
              {num}
            </button>
          ))}
          <div />
          <button onClick={() => handleDigitClick(0)} style={{ padding: "20px", fontSize: "1.5rem", borderRadius: "8px" }}>
            0
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
      <h2>Task Completed!</h2>
      {submitting ? <p>Uploading data...</p> : (
        <>
          <p>Your Maximum Digit Span: <strong>{maxSpan}</strong></p>
          <p>Done!</p>
        </>
      )}
    </div>
  );
}
