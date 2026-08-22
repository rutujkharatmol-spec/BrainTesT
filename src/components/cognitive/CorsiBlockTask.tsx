"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import TaskCompleteScreen from "./TaskCompleteScreen";

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
  const router = useRouter();
  
  // Only 9 blocks exist, so a sequence longer than that is not presentable.
  const MAX_SPAN = BLOCK_POSITIONS.length;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const flashRef = useRef<NodeJS.Timeout | null>(null);
  const advanceRef = useRef<NodeJS.Timeout | null>(null);

  const [phase, setPhase] = useState<Phase>("instructions");
  const [spanLength, setSpanLength] = useState(2);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [activeBlock, setActiveBlock] = useState<number | null>(null);
  
  const [maxSpan, setMaxSpan] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [errorsAtCurrentSpan, setErrorsAtCurrentSpan] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [calculatedParams, setCalculatedParams] = useState<any>(null);
  // True when the result was only queued locally (device offline).
  const [queuedOffline, setQueuedOffline] = useState(false);

  const startTask = () => {
    generateAndPlaySequence(2); // Corsi usually starts at 2
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
    // Held in refs so the unmount cleanup can cancel them; previously these
    // kept firing setState after the participant navigated away.
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (step < newSeq.length) {
        setActiveBlock(newSeq[step]);
        if (flashRef.current) clearTimeout(flashRef.current);
        flashRef.current = setTimeout(() => setActiveBlock(null), 500); // block lit for 500ms
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setPhase("recall");
      }
      step++;
    }, 1000); // 1 block per second
  };

  const handleBlockClick = (blockId: number) => {
    if (phase !== "recall") return;
    
    // Briefly light it up on click for visual feedback
    setActiveBlock(blockId);
    if (flashRef.current) clearTimeout(flashRef.current);
    flashRef.current = setTimeout(() => setActiveBlock(null), 200);

    const newUserSequence = [...userSequence, blockId];
    setUserSequence(newUserSequence);

    if (newUserSequence.length === sequence.length) {
      advanceRef.current = setTimeout(() => checkResult(newUserSequence), 300); // short delay before next
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
      param1Name: "Maximum Block Span", param1Value: maxSpan,
      param2Name: "Total Correct Trials", param2Value: totalCorrect,
      param3Name: null, param3Value: null
    });
    try {
      const res = await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
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
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok && !payload?.offline) {
        throw new Error(payload?.error || `Upload failed (${res.status})`);
      }
      setQueuedOffline(Boolean(payload?.offline));
      markTestCompleted("/cognitive/corsi");
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
        <h2>{state.language === 'bn' ? "কোর্সি ব্লক টেস্ট" : "Corsi Block Test"}</h2>
        <p>{state.language === 'bn' ? "আপনি স্ক্রিনে কিছু বর্গক্ষেত্র দেখতে পাবেন।" : "You will see a set of squares on the screen."}</p>
        <p>{state.language === 'bn' ? "বর্গক্ষেত্রগুলো একটি নির্দিষ্ট ক্রমে একে একে আলোকিত হবে।" : "The squares will light up one by one in a specific sequence."}</p>
        <p>{state.language === 'bn' ? "ক্রমটি শেষ হলে, " : "When the sequence finishes, "}<strong>{state.language === 'bn' ? "যে ক্রমে তারা আলোকিত হয়েছিল ঠিক সেই ক্রমেই বর্গক্ষেত্রগুলোতে ক্লিক করুন।" : "click the squares in the exact same order"}</strong>{state.language === 'bn' ? "" : " they lit up."}</p>
        <p>{state.language === 'bn' ? "আপনি সঠিক উত্তর দেওয়ার সাথে সাথে ক্রমটি দীর্ঘ হতে থাকবে।" : "The sequence will get longer as you get them right."}</p>
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

  return (
    <div className="task-view-container">
      <div className="task-stimulus" style={{ flexDirection: "column" }}>
        {phase === "recall" ? (
          <h3 style={{ marginBottom: 16, color: "var(--text-primary)" }}>{state.language === 'bn' ? "আপনার পালা! ক্রমানুসারে ব্লকগুলিতে ক্লিক করুন।" : "Your turn! Click the blocks in order."}</h3>
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
