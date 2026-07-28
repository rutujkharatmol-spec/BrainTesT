"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAppContext } from "../AppContext";

type Phase = "instructions" | "presentation" | "recall" | "completed";

// Standardish scattered positions for 9 blocks (x%, y%)
const BLOCK_POSITIONS = [
  { id: 0, left: "10%", top: "10%" },
  { id: 1, left: "40%", top: "15%" },
  { id: 2, left: "80%", top: "20%" },
  { id: 3, left: "5%", top: "45%" },
  { id: 4, left: "30%", top: "40%" },
  { id: 5, left: "60%", top: "50%" },
  { id: 6, left: "20%", top: "70%" },
  { id: 7, left: "50%", top: "85%" },
  { id: 8, left: "80%", top: "80%" },
];

export default function CorsiBlockTask({ onComplete }: { onComplete?: () => void }) {
  const { state, markTestCompleted } = useAppContext();
  
  const [phase, setPhase] = useState<Phase>("instructions");
  const [spanLength, setSpanLength] = useState(2);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [activeBlock, setActiveBlock] = useState<number | null>(null);
  
  const [maxSpan, setMaxSpan] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [errorsAtCurrentSpan, setErrorsAtCurrentSpan] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const startTask = () => {
    generateAndPlaySequence(2); // Corsi usually starts at 2
  };

  const generateAndPlaySequence = (length: number) => {
    setPhase("presentation");
    setSpanLength(length);
    setUserSequence([]);
    
    const newSeq: number[] = [];
    let lastBlock = -1;
    for (let i = 0; i < length; i++) {
      let nextBlock;
      do {
        nextBlock = Math.floor(Math.random() * 9);
      } while (nextBlock === lastBlock); // prevent same block twice in a row
      newSeq.push(nextBlock);
      lastBlock = nextBlock;
    }
    setSequence(newSeq);

    // Play sequence
    let step = 0;
    const interval = setInterval(() => {
      if (step < newSeq.length) {
        setActiveBlock(newSeq[step]);
        setTimeout(() => setActiveBlock(null), 500); // block lit for 500ms
      } else {
        clearInterval(interval);
        setPhase("recall");
      }
      step++;
    }, 1000); // 1 block per second
  };

  const handleBlockClick = (blockId: number) => {
    if (phase !== "recall") return;
    
    // Briefly light it up on click for visual feedback
    setActiveBlock(blockId);
    setTimeout(() => setActiveBlock(null), 200);

    const newUserSequence = [...userSequence, blockId];
    setUserSequence(newUserSequence);

    if (newUserSequence.length === sequence.length) {
      setTimeout(() => checkResult(newUserSequence), 300); // short delay before next
    }
  };

  const checkResult = (userInput: number[]) => {
    const isCorrect = userInput.every((val, i) => val === sequence[i]);

    if (isCorrect) {
      setMaxSpan(Math.max(maxSpan, spanLength));
      setTotalCorrect(prev => prev + 1);
      setErrorsAtCurrentSpan(0);
      generateAndPlaySequence(spanLength + 1);
    } else {
      if (errorsAtCurrentSpan === 0) {
        setErrorsAtCurrentSpan(1);
        generateAndPlaySequence(spanLength); // try same span again
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
          specificTest: "Corsi Block Task",
          param1Name: "Maximum Block Span",
          param1Value: maxSpan,
          param2Name: "Total Correct Trials",
          param2Value: totalCorrect,
          param3Name: null,
          param3Value: null,
          rawTrialData: { maxSpan, totalCorrect }
        })
      });
      if (onComplete) {
        onComplete();
      } else {
        markTestCompleted("/cognitive/corsi");
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
        <h2>Corsi Block Test</h2>
        <p>You will see a set of squares on the screen.</p>
        <p>The squares will light up one by one in a specific sequence.</p>
        <p>When the sequence finishes, <strong>click the squares in the exact same order</strong> they lit up.</p>
        <p>The sequence will get longer as you get them right.</p>
        <button className="btn" onClick={startTask} style={{ marginTop: 32, width: "100%", padding: "14px", fontSize: "1.1rem" }}>Start Task</button>
      </div>
    );
  }

  if (phase === "completed") {
    return (
      <div className="card" style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
        <h2>Task Completed!</h2>
        {submitting ? <p>Uploading data...</p> : (
          <>
            <p>Your Maximum Block Span: <strong>{maxSpan}</strong></p>
            <p>Total Correct Trials: <strong>{totalCorrect}</strong></p>
            <p>Done!</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="task-view-container">
      <div className="task-stimulus" style={{ flexDirection: "column" }}>
        {phase === "recall" ? (
          <h3 style={{ marginBottom: 16, color: "var(--text-primary)" }}>Your turn! Click the blocks in order.</h3>
        ) : (
          <h3 style={{ marginBottom: 16, opacity: 0 }}>Placeholder</h3>
        )}
        
        <div style={{ 
          position: "relative", 
          width: "100%",
          minWidth: 320,
          maxWidth: 500, 
          aspectRatio: "1/1",
          background: "#F9FAFB",
          border: "1px solid var(--card-border)",
          borderRadius: 16
        }}>
          {BLOCK_POSITIONS.map((pos) => (
            <div
              key={pos.id}
              onClick={() => handleBlockClick(pos.id)}
              style={{
                position: "absolute",
                left: pos.left,
                top: pos.top,
                width: "15%",
                height: "15%",
                background: activeBlock === pos.id ? "var(--accent-color)" : "#D1D5DB",
                boxShadow: activeBlock === pos.id ? "0 0 15px var(--accent-color)" : "0 1px 2px rgba(0,0,0,0.1)",
                borderRadius: 8,
                cursor: phase === "recall" ? "pointer" : "default",
                transition: "background 0.1s, box-shadow 0.1s"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
