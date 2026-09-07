"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import TaskCompleteScreen from "./TaskCompleteScreen";
import TaskInstructionCard from "./TaskInstructionCard";
import TaskHUD from "./TaskHUD";

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
    const isBn = state.language === "bn";
    return (
      <TaskInstructionCard
        title={isBn ? "কোর্সি ব্লক — টাইল হপার" : "Corsi Block — Tile Hopper"}
        subtitle={isBn ? "ভিজ্যুওস্প্যাশিয়াল স্মৃতির (Spatial Memory) পরীক্ষা" : "Test your visuospatial memory span"}
        icon="🧱"
        category={isBn ? "স্থানিক স্মৃতি" : "Spatial Memory"}
        language={state.language}
        mission={
          isBn
            ? "স্ক্রিনের বর্গাকার ব্লকগুলো একটি নির্দিষ্ট ক্রমে একে একে নীল রঙে জ্বলে উঠবে। আলো শেষ হলে, ঠিক একই ক্রমে ব্লকগুলোতে ক্লিক বা ট্যাপ করুন!"
            : "Squares will light up in a specific sequence. Watch carefully, then click or tap the squares in the EXACT same order!"
        }
        visualExample={
          <div style={{ background: "#F8FAFC", padding: "16px", borderRadius: 12, border: "1px solid #E2E8F0", textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", marginBottom: 10, textTransform: "uppercase" }}>
              {isBn ? "কীভাবে কাজ করে:" : "HOW IT WORKS:"}
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              <div style={{ padding: "8px 12px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#1E40AF" }}>
                1. 💡 {isBn ? "ব্লক ১ জ্বলে উঠল" : "Block 1 flashes"}
              </div>
              <span style={{ color: "#94A3B8" }}>➔</span>
              <div style={{ padding: "8px 12px", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#1E40AF" }}>
                2. 💡 {isBn ? "ব্লক ২ জ্বলে উঠল" : "Block 2 flashes"}
              </div>
              <span style={{ color: "#94A3B8" }}>➔</span>
              <div style={{ padding: "8px 14px", background: "#ECFDF5", border: "2px solid #10B981", borderRadius: 8, fontSize: 13, fontWeight: 800, color: "#059669" }}>
                3. 👉 {isBn ? "আপনার পালা: ১ তারপর ২ ক্লিক করুন!" : "Your turn: Click 1 then 2!"}
              </div>
            </div>
          </div>
        }
        rules={[
          { text: isBn ? "প্রতিবার সঠিক উত্তর দিলে ক্রমটি আরও ১টি ব্লক করে দীর্ঘ হতে থাকবে।" : "Each correct sequence makes the next pattern 1 block longer.", icon: "📈" },
          { text: isBn ? "ভুল হলে পুনরায় একই দৈর্ঘ্যের আরেকটি ক্রম দেওয়া হবে।" : "If you make a mistake, you'll get one more chance at that level.", icon: "🔄" },
          { text: isBn ? "পরপর দুইবার ভুল করলে পরীক্ষা সম্পন্ন হবে।" : "Two consecutive mistakes end the test.", icon: "🎯" },
        ]}
        controls={[
          { key: "MOUSE / TAP", action: isBn ? "ব্লকে ক্লিক বা স্পর্শ করুন" : "Click or tap blocks in order", color: "#7C3AED" },
        ]}
        tip={isBn ? "স্ক্রিনের পুরো গ্রিডে চোখ রাখুন, শুধু একটি ব্লকে আটকে থাকবেন না।" : "Keep your eyes focused on the center to catch the full sequence path!"}
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

  const isRecall = phase === "recall";

  return (
    <div className="task-view-container">
      <TaskHUD
        title={state.language === "bn" ? "কোর্সি ব্লক" : "Corsi Block Task"}
        icon="🧱"
        category={state.language === "bn" ? "স্থানিক স্মৃতি" : "Spatial Memory"}
        currentTrial={spanLength}
        totalTrials={9}
        language={state.language}
      />

      <div className="task-stimulus" style={{ flexDirection: "column", gap: 12 }}>
        {/* Play / Recall Interactive Guidance */}
        <div
          style={{
            padding: "8px 16px",
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: isRecall ? "#ECFDF5" : "#EFF6FF",
            color: isRecall ? "#047857" : "#1E40AF",
            border: `1px solid ${isRecall ? "#A7F3D0" : "#BFDBFE"}`,
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
          }}
        >
          {isRecall ? (
            <>
              <span>👉</span>
              <span>
                {state.language === "bn"
                  ? `আপনার পালা! ক্রমানুসারে ব্লকে ক্লিক করুন (${userSequence.length}/${sequence.length})`
                  : `Your turn! Tap the blocks in order (${userSequence.length}/${sequence.length})`}
              </span>
            </>
          ) : (
            <>
              <span style={{ animation: "stimulus-pop 1s infinite" }}>💡</span>
              <span>
                {state.language === "bn" ? "মনোযোগ দিয়ে লক্ষ্য করুন..." : "Watch the flashing sequence closely..."}
              </span>
            </>
          )}
        </div>
        
        <div style={{ 
          position: "relative", 
          width: "100%",
          minWidth: 300,
          maxWidth: 480, 
          aspectRatio: "1/1",
          background: "#FFFFFF",
          border: "2px solid #E2E8F0",
          borderRadius: 20,
          boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        }}>
          {BLOCK_POSITIONS.map((pos) => {
            const isLit = activeBlock === pos.id;
            return (
              <div
                key={pos.id}
                onClick={() => handleBlockClick(pos.id)}
                style={{
                  position: "absolute",
                  left: pos.left,
                  top: pos.top,
                  width: "16%",
                  height: "16%",
                  background: isLit
                    ? "linear-gradient(135deg, #2563EB, #3B82F6)"
                    : "#E2E8F0",
                  boxShadow: isLit
                    ? "0 0 20px #2563EB, 0 4px 10px rgba(37, 99, 235, 0.4)"
                    : "0 2px 4px rgba(0,0,0,0.06)",
                  borderRadius: 10,
                  cursor: isRecall ? "pointer" : "default",
                  transition: "all 0.12s ease",
                  transform: isLit ? "scale(1.08)" : "scale(1)",
                  border: isLit ? "2px solid #93C5FD" : "1px solid #CBD5E1",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
