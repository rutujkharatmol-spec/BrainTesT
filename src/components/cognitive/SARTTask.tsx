"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import { roundedMeanOrNull } from "@/utils/trials";
import TaskCompleteScreen from "./TaskCompleteScreen";
import TaskInstructionCard from "./TaskInstructionCard";
import TaskHUD from "./TaskHUD";

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
  const router = useRouter();
  
  const [phase, setPhase] = useState<"instructions" | "running" | "completed">("instructions");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(-1);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [calculatedParams, setCalculatedParams] = useState<any>(null);
  // True when the result was only queued locally (device offline).
  const [queuedOffline, setQueuedOffline] = useState(false);
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
    if (!state.sessionId) {
      alert("No active session — please sign in again before submitting.");
      return;
    }
    setSubmitting(true);
    
    // Parameters
    const goTrials = results.filter(r => !r.isNoGo && r.pressed && r.rt !== null && r.rt > 100);
    // null, not 0 — see NBackTask for the same reasoning.
    const meanRTGo = roundedMeanOrNull(goTrials.map(r => r.rt as number));
    
    const commissionErrors = results.filter(r => r.errorType === "commission").length;
    const omissionErrors = results.filter(r => r.errorType === "omission").length;

    
    setCalculatedParams({
      param1Name: "Mean RT Go Trials (ms)", param1Value: meanRTGo,
      param2Name: "Commission Errors", param2Value: commissionErrors,
      param3Name: "Omission Errors", param3Value: omissionErrors
    });
    try {
      const res = await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          testCategory: "Attention",
          specificTest: "SART (Basic)",
          param1Name: "Mean RT Go Trials (ms)",
          param1Value: meanRTGo,
          param2Name: "Commission Errors",
          param2Value: commissionErrors,
          param3Name: "Omission Errors",
          param3Value: omissionErrors,
          rawTrialData: results
        })
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok && !payload?.offline) {
        throw new Error(payload?.error || `Upload failed (${res.status})`);
      }
      setQueuedOffline(Boolean(payload?.offline));
      markTestCompleted("/cognitive/sart");
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
        title={t("SART — Speed Reflex & Attention", "এস.এ.আর.টি — স্পিড রিফ্লেক্স", "एस.ए.आर.टी — गति सजगता और ध्यान", "एस.ए.आर.टी — वेग प्रतिक्षिप्त क्रिया आणि एकाग्रता")}
        subtitle={t("Sustained Attention to Response Task", "সাসটেইন্ড অ্যাটেনশন ও আত্মনিয়ন্ত্রণের পরীক্ষা", "प्रतिक्रिया कार्य के लिए निरंतर ध्यान (SART)", "प्रतिक्रिया कार्यासाठी सतत एकाग्रता (SART)")}
        icon="⏱️"
        category={t("Sustained Attention", "মনোযোগ নিয়ন্ত্রণ", "निरंतर ध्यान", "सतत एकाग्रता")}
        language={state.language}
        mission={
          t(
            "Press SPACEBAR as fast as you can for EVERY number (1, 2, 4, 5, 6, 7, 8, 9) — EXCEPT when you see the number 3!",
            "স্ক্রিনে দ্রুত সংখ্যা আসবে। যেকোনো সংখ্যা এলে দ্রুত স্পেসবার চাপুন — কিন্তু ৩ (THREE) সংখ্যাটি এলে কখনোই কিছু চাপবেন না!",
            "प्रत्येक संख्या (1, 2, 4, 5, 6, 7, 8, 9) के लिए जितनी जल्दी हो सके स्पेसबार दबाएं — सिवाय जब आपको 3 नंबर दिखे!",
            "प्रत्येक क्रमांकासाठी (1, 2, 4, 5, 6, 7, 8, 9) शक्य तितक्या लवकर स्पेसबार दाबा — फक्त जेव्हा 3 क्रमांक दिसेल तेव्हा दाबू नका!"
          )
        }
        visualExample={
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: 14, background: "#ECFDF5", border: "2px solid #10B981", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#065F46", marginBottom: 4 }}>
                {t("ANY NUMBER (1, 2, 4... 9)", "যেকোনো সংখ্যা (১, ২, ৪... ৯)", "कोई भी संख्या (1, 2, 4... 9)", "कोणताही क्रमांक (1, 2, 4... 9)")}
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#059669" }}>
                1, 2, 4, 5, 7, 8...
              </div>
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: "#065F46" }}>
                ✅ {t("PRESS SPACEBAR FAST!", "দ্রুত স্পেসবার চাপুন!", "जल्दी स्पेसबार दबाएं!", "त्वरित स्पेसबार दाबा!")}
              </div>
            </div>
            <div style={{ padding: 14, background: "#FEF2F2", border: "2px solid #EF4444", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#991B1B", marginBottom: 4 }}>
                {t("THE TRAP", "বিপদজনক ফাঁদ (TRAP)", "जाल (TRAP)", "सापळा (TRAP)")}
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#DC2626" }}>
                3
              </div>
              <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800, color: "#DC2626" }}>
                🛑 {t("STOP! DO NOT PRESS!", "কিছুই চাপবেন না!", "रुकें! कुछ न दबाएं!", "थांबा! काहीही दाबू नका!")}
              </div>
            </div>
          </div>
        }
        rules={[
          { text: t("Numbers flash very quickly — stay alert and focused!", "সংখ্যাগুলো স্ক্রিনে খুব দ্রুত ফ্ল্যাশ হবে।", "संख्याएं स्क्रीन पर बहुत तेजी से आएंगी — सतर्क और केंद्रित रहें!", "क्रमांक स्क्रीनवर खूप वेगाने दिसतील — सतर्क आणि एकाग्र राहा!"), icon: "⚡" },
          { text: t("Train your brain to hold back when the number 3 appears.", "৩ দেখতে পেলেই হাত থামিয়ে রাখুন।", "3 संख्या दिखने पर खुद को रोकने के लिए तैयार रहें।", "3 क्रमांक दिसताच स्वतःला रोखून ठेवा."), icon: "🛑", highlight: true },
          { text: t("50 quick trials total.", "মোট ৫০টি দ্রুত ট্রায়াল আছে।", "कुल 50 त्वरित परीक्षण हैं।", "एकूण 50 जलद चाचण्या आहेत."), icon: "🎯" },
        ]}
        controls={[
          { key: "SPACEBAR", action: t("PRESS for numbers (except 3)", "যেকোনো সংখ্যার জন্য চাপুন (৩ বাদে)", "संख्याओं के लिए दबाएं (3 को छोड़कर)", "क्रमांकांसाठी दाबा (3 वगळता)"), color: "#059669" },
        ]}
        tip={t(
          "Keep your finger resting gently on the SPACEBAR so you're ready to react!",
          "আঙুল স্পেসবারের উপরে আলতো করে ধরে রাখুন।",
          "अपनी उंगली स्पेसबार पर हल्के से रखें ताकि आप तुरंत प्रतिक्रिया दे सकें!",
          "आपले बोट स्पेसबारवर अलगद ठेवा जेणेकरून आपण त्वरित प्रतिक्रिया देऊ शकाल!"
        )}
        onStart={startTask}
      />
    );
  }

  if (phase === "running") {
    const trial = trials[currentTrialIndex];
    return (
      <div className="task-view-container">
        <TaskHUD
          title={t("SART Attention", "এস.এ.আর.টি", "एस.ए.आर.टी ध्यान", "एस.ए.आर.टी एकाग्रता")}
          icon="⏱️"
          category={t("Attention", "মনোযোগ", "ध्यान", "एकाग्रता")}
          currentTrial={currentTrialIndex + 1}
          totalTrials={TOTAL_TRIALS}
          language={state.language}
        />
        <div className="task-stimulus stimulus-animate" style={{ position: "relative" }}>
          {showStimulus ? (
            <h1 style={{ fontSize: "clamp(5rem, 12vw, 8rem)", fontWeight: 900, color: "#0F172A" }}>
              {trial?.digit}
            </h1>
          ) : (
            <div style={{ fontSize: "clamp(3rem, 8vw, 5rem)", opacity: 0.15, color: "#64748B" }}>⊗</div>
          )}
          
          <div style={{
            position: "absolute",
            bottom: "-36px",
            left: "50%",
            transform: "translateX(-50%)",
            opacity: hasPressed ? 1 : 0,
            transition: "opacity 0.15s ease",
            color: "#059669",
            fontWeight: 800,
            fontSize: 14,
            whiteSpace: "nowrap",
            backgroundColor: "#ECFDF5",
            padding: "3px 10px",
            borderRadius: 12,
            border: "1px solid #A7F3D0"
          }}>
            ✓ {t("Pressed!", "প্রেস সম্পন্ন", "दबाया गया!", "दाबले गेले!")}
          </div>
        </div>

        <div className="mobile-controls-container">
          <div className="mobile-controls">
            <button 
              type="button"
              className="mobile-btn" 
              onClick={handleResponse} 
              disabled={hasPressed}
              style={{
                maxWidth: 340,
                background: hasPressed ? "#E2E8F0" : "linear-gradient(135deg, #059669, #10B981)",
                color: hasPressed ? "#64748B" : "#FFFFFF",
                borderColor: hasPressed ? "#CBD5E1" : "#059669",
                fontSize: 16,
              }}
            >
              <span className="keycap">SPACE</span> {t("PRESS (GO)", "চাপুন (PRESS - GO)", "दबाएं (GO)", "दाबा (GO)")}
            </button>
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
