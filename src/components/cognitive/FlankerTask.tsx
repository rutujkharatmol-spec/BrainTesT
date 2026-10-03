"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import { balancedFlags, roundedMeanOrNull, differenceOrNull } from "@/utils/trials";
import TaskCompleteScreen from "./TaskCompleteScreen";
import TaskInstructionCard from "./TaskInstructionCard";
import TaskHUD from "./TaskHUD";

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

  // Generate sequence — counterbalanced on both factors: exactly half
  // congruent and half left-facing, independently shuffled.
  useEffect(() => {
    const congruency = balancedFlags(TOTAL_TRIALS, 0.5);
    const directions = balancedFlags(TOTAL_TRIALS, 0.5);

    const sequence: Trial[] = congruency.map((congruent: boolean, i: number) => {
      const direction: "left" | "right" = directions[i] ? "left" : "right";

      let stimulusString = "";
      if (direction === "left" && congruent) stimulusString = "<<<<<";
      if (direction === "right" && congruent) stimulusString = ">>>>>";
      if (direction === "left" && !congruent) stimulusString = ">><>>";
      if (direction === "right" && !congruent) stimulusString = "<<><<";

      return { direction, congruent, stimulusString };
    });
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
    if (!state.sessionId) {
      alert("No active session — please sign in again before submitting.");
      return;
    }
    setSubmitting(true);
    
    // Parameters (only correct, RT > 100ms)
    const validTrials = results.filter(r => r.correct && r.rt !== null && r.rt > 100);
    const congruentRTs = validTrials.filter(r => r.congruent).map(r => r.rt as number);
    const incongruentRTs = validTrials.filter(r => !r.congruent).map(r => r.rt as number);

    
    const meanRTCongruent = roundedMeanOrNull(congruentRTs);
    const meanRTIncongruent = roundedMeanOrNull(incongruentRTs);
    const flankerEffect = differenceOrNull(meanRTIncongruent, meanRTCongruent); 

    
    setCalculatedParams({
      param1Name: "Mean RT Congruent (ms)", param1Value: meanRTCongruent,
      param2Name: "Mean RT Incongruent (ms)", param2Value: meanRTIncongruent,
      param3Name: "Flanker Effect", param3Value: flankerEffect
    });
    try {
      const res = await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          testCategory: "Executive Function",
          specificTest: "Eriksen Flanker Task",
          param1Name: "Mean RT Congruent (ms)",
          param1Value: meanRTCongruent,
          param2Name: "Mean RT Incongruent (ms)",
          param2Value: meanRTIncongruent,
          param3Name: "Flanker Effect",
          param3Value: flankerEffect,
          rawTrialData: results
        })
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok && !payload?.offline) {
        throw new Error(payload?.error || `Upload failed (${res.status})`);
      }
      setQueuedOffline(Boolean(payload?.offline));
      markTestCompleted("/cognitive/flanker");
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

  const t = (en: string, bn: string, hi: string, mr: string) => {
    switch (state.language) {
      case "bn": return bn;
      case "hi": return hi;
      case "mr": return mr;
      default: return en;
    }
  };

  if (phase === "instructions") {
    return (
      <TaskInstructionCard
        title={t("Eriksen Flanker Task — Arrow Focus", "এরিকসেন ফ্ল্যাঙ্কার টাস্ক — অ্যারো ফোকাস", "एरिकसन फ्लैंकर टास्क — बाण एकाग्रता", "एरिकसन फ्लँकर टास्क — बाण एकाग्रता")}
        subtitle={t("Which way is the center arrow pointing?", "মাঝের তীরটি কোন দিকে নির্দেশ করছে?", "बीच का तीर किस दिशा में इंगित कर रहा है?", "मधला बाण कोणत्या दिशेला निर्देश करत आहे?")}
        icon="🏹"
        category={t("Executive Function", "এক্সিকিউটিভ ফাংশন", "कार्यकारी कार्य", "कार्यकारी कार्य")}
        language={state.language}
        mission={
          t(
            "Ignore the flanker arrows on the sides! Focus your eyes only on the CENTER arrow and indicate its direction.",
            "চারপাশের তীরগুলিকে উপেক্ষা করুন! শুধুমাত্র মাঝখানের তীরটির (CENTER arrow) দিকে ফোকাস করুন এবং সেটির দিক নির্দেশ করুন।",
            "आसपास के तीरों को अनदेखा करें! अपनी आँखें केवल केंद्र के तीर पर केंद्रित करें और उसकी दिशा बताएं।",
            "बाजूच्या बाणांकडे दुर्लक्ष करा! आपले लक्ष फक्त मधल्या बाणावर केंद्रित करा आणि त्याची दिशा दर्शवा."
          )
        }
        visualExample={
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ padding: 14, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1E40AF", marginBottom: 6 }}>
                {t("EXAMPLE 1: CENTER POINTS LEFT", "উদাহরণ ১: বামের তীর", "उदाहरण 1: केंद्र बायीं ओर", "उदाहरण 1: मध्य डावीकडे")}
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "monospace", letterSpacing: 6, color: "#64748B" }}>
                &gt;&gt;<span style={{ color: "#2563EB", background: "#DBEAFE", padding: "2px 6px", borderRadius: 6 }}>&lt;</span>&gt;&gt;
              </div>
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#1D4ED8" }}>
                {t("Center is Left ➔ Press [ ← ] LEFT", "মাঝের তীরটি বামে ➔ [ ← ] LEFT চাপুন", "केंद्र बायीं ओर है ➔ [ ← ] LEFT दबाएं", "मध्य डावीकडे आहे ➔ [ ← ] LEFT दाबा")}
              </div>
            </div>
            <div style={{ padding: 14, background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#6D28D9", marginBottom: 6 }}>
                {t("EXAMPLE 2: CENTER POINTS RIGHT", "উদাহরণ ২: ডানের তীর", "उदाहरण 2: केंद्र दायीं ओर", "उदाहरण 2: मध्य उजवीकडे")}
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "monospace", letterSpacing: 6, color: "#64748B" }}>
                &lt;&lt;<span style={{ color: "#7C3AED", background: "#EDE9FE", padding: "2px 6px", borderRadius: 6 }}>&gt;</span>&lt;&lt;
              </div>
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#6D28D9" }}>
                {t("Center is Right ➔ Press [ → ] RIGHT", "মাঝের তীরটি ডানে ➔ [ → ] RIGHT চাপুন", "केंद्र दायीं ओर है ➔ [ → ] RIGHT दबाएं", "मध्य उजवीकडे आहे ➔ [ → ] RIGHT दाबा")}
              </div>
            </div>
          </div>
        }
        rules={[
          { text: t("If center arrow points LEFT, press [←] or tap LEFT.", "মাঝের তীরটি বামে নির্দেশ করলে [←] অথবা LEFT বাটন চাপুন।", "यदि केंद्र का तीर बायीं ओर है, तो [←] दबाएं या LEFT पर टैप करें।", "जर मधला बाण डावीकडे असेल, तर [←] दाबा किंवा LEFT वर टॅप करा."), icon: "⬅️" },
          { text: t("If center arrow points RIGHT, press [→] or tap RIGHT.", "মাঝের তীরটি ডানে নির্দেশ করলে [→] অথবা RIGHT বাটন চাপুন।", "यदि केंद्र का तीर दायीं ओर है, तो [→] दबाएं या RIGHT पर टैप करें।", "जर मधला बाण उजवीकडे असेल, तर [→] दाबा किंवा RIGHT वर टॅप करा."), icon: "➡️" },
          { text: t("Do NOT let the distractor arrows on the sides fool you!", "চারপাশের বিপরীতমুখী তীরগুলিতে বিভ্রান্ত হবেন না!", "किनारों के तीरों से भ्रमित न हों!", "बाजूच्या बाणांमुळे विचलित होऊ नका!"), icon: "🎯" },
          { text: t("Answer as fast and accurately as possible.", "যত দ্রুত ও নির্ভুলভাবে সম্ভব উত্তর দিন।", "जितनी जल्दी और सटीक संभव हो उत्तर दें।", "शक्य तितक्या लवकर आणि अचूक उत्तर द्या."), icon: "⚡" },
        ]}
        controls={[
          { key: "←", action: t("Left", "বাম তীর (Left)", "बायाँ (Left)", "डावा (Left)"), color: "#2563EB" },
          { key: "→", action: t("Right", "ডান তীর (Right)", "दायाँ (Right)", "उजवा (Right)"), color: "#7C3AED" },
        ]}
        tip={t(
          "You can press keyboard arrow keys (← / →) or click the buttons below.",
          "কীবোর্ডের তীর কী (Arrow keys) বা নিচের বোতামগুলিতে ক্লিক করতে পারেন।",
          "आप कीबोर्ड तीर कुंजियों (← / →) का उपयोग कर सकते हैं या नीचे दिए गए बटनों पर क्लिक कर सकते हैं।",
          "तुम्ही कीबोर्ड बाण की (← / →) वापरू शकता किंवा खालील बटणांवर क्लिक करू शकता."
        )}
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
        title={t("Eriksen Flanker", "এরিকসেন ফ্ল্যাঙ্কার", "एरिकसन फ्लैंकर", "एरिकसन फ्लँकर")}
        icon="🏹"
        category={t("Executive Function", "এক্সিকিউটিভ ফাংশন", "कार्यकारी कार्य", "कार्यकारी कार्य")}
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
              fontSize: "clamp(3.5rem, 8vw, 6rem)", 
              letterSpacing: "14px", 
              fontWeight: 900, 
              color: "var(--text-primary)", 
              fontFamily: "monospace",
              userSelect: "none"
            }}>
              {trial.stimulusString}
            </h1>
            <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
              {t("Focus on the CENTER arrow", "মাঝখানের তীরটি লক্ষ্য করুন", "बीच के तीर पर ध्यान दें", "मधल्या बाणावर लक्ष केंद्रित करा")}
            </div>
          </div>
        )}
      </div>

      {phase === "stimulus" && (
        <div className="mobile-controls-container">
          <div className="mobile-controls" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", maxWidth: 440, margin: "0 auto", gap: 14 }}>
            <button 
              className="mobile-btn" 
              onClick={() => handleResponse("left")}
              style={{ borderColor: "#BFDBFE", color: "#1D4ED8", padding: "14px 20px" }}
            >
              <span className="keycap">←</span> {t("LEFT", "বাম (LEFT)", "बायाँ (LEFT)", "डावा (LEFT)")}
            </button>
            <button 
              className="mobile-btn" 
              onClick={() => handleResponse("right")}
              style={{ borderColor: "#DDD6FE", color: "#6D28D9", padding: "14px 20px" }}
            >
              <span className="keycap">→</span> {t("RIGHT", "ডান (RIGHT)", "दायाँ (RIGHT)", "उजवा (RIGHT)")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
