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
  word: string;
  color: string;
  congruent: boolean;
};

type TrialResult = Trial & {
  rt: number;
  correct: boolean;
};

const COLORS = ["RED", "BLUE", "GREEN", "YELLOW"];
const KEYS: Record<string, string> = { r: "RED", b: "BLUE", g: "GREEN", y: "YELLOW" };
const TOTAL_TRIALS = 20;

export default function StroopTask({ onComplete }: { onComplete?: () => void }) {
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

  // Generate Trials — counterbalanced: exactly half congruent, order shuffled.
  useEffect(() => {
    const congruency = balancedFlags(TOTAL_TRIALS, 0.5);
    const generated: Trial[] = congruency.map((isCongruent: boolean) => {
      const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      let fontColor = wordColor;

      if (!isCongruent) {
        const otherColors = COLORS.filter(c => c !== wordColor);
        fontColor = otherColors[Math.floor(Math.random() * otherColors.length)];
      }

      return { word: wordColor, color: fontColor, congruent: isCongruent };
    });
    setTrials(generated);
  }, []);

  const startTask = () => setPhase("fixation");

  // Fixation cross timer
  useEffect(() => {
    if (phase === "fixation") {
      const timer = setTimeout(() => {
        setPhase("stimulus");
        // Record high precision start time immediately when stimulus is shown
        startTimeRef.current = performance.now();
      }, 500); // 500ms fixation
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleResponse = useCallback((colorName: string) => {
    if (phase !== "stimulus") return;

    const rt = performance.now() - startTimeRef.current;
    const currentTrial = trials[currentTrialIndex];
    const correct = colorName === currentTrial.color;

    const newResult: TrialResult = { ...currentTrial, rt, correct };
    
    setResults(prev => [...prev, newResult]);

    if (currentTrialIndex + 1 < TOTAL_TRIALS) {
      setCurrentTrialIndex(prev => prev + 1);
      setPhase("fixation");
    } else {
      setPhase("completed");
    }
  }, [phase, currentTrialIndex, trials]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (KEYS[key]) {
      handleResponse(KEYS[key]);
    }
  }, [handleResponse]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Handle Submission
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
    
    // Calculate parameters (only correct answers, RT > 150ms)
    const validTrials = results.filter(r => r.correct && r.rt > 150);
    
    const congruentRTs = validTrials.filter(r => r.congruent).map(r => r.rt);
    const incongruentRTs = validTrials.filter(r => !r.congruent).map(r => r.rt);

    const meanRTCongruent = roundedMeanOrNull(congruentRTs);
    const meanRTIncongruent = roundedMeanOrNull(incongruentRTs);
    const stroopEffect = differenceOrNull(meanRTIncongruent, meanRTCongruent);

    setCalculatedParams({
      param1Name: "Mean RT Congruent (ms)", param1Value: meanRTCongruent,
      param2Name: "Mean RT Incongruent (ms)", param2Value: meanRTIncongruent,
      param3Name: "Stroop Interference Effect (ms)", param3Value: stroopEffect
    });
    try {
      const res = await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          testCategory: "Executive Function",
          specificTest: "Stroop Task",
          param1Name: "Mean RT Congruent (ms)",
          param1Value: meanRTCongruent,
          param2Name: "Mean RT Incongruent (ms)",
          param2Value: meanRTIncongruent,
          param3Name: "Stroop Interference Effect (ms)",
          param3Value: stroopEffect,
          validTrialCount: validTrials.length,
          rawTrialData: results
        })
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok && !payload?.offline) {
        throw new Error(payload?.error || `Upload failed (${res.status})`);
      }
      setQueuedOffline(Boolean(payload?.offline));
      markTestCompleted("/cognitive/stroop");
      if (onComplete) onComplete();
    } catch (e) {
      console.error(e);
      alert(`Could not save your results: ${e instanceof Error ? e.message : e}\n\nPlease tell the study coordinator before continuing.`);
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

  const WORD_LABELS: Record<string, { en: string; bn: string; hi: string; mr: string }> = {
    RED: { en: "RED", bn: "লাল", hi: "लाल", mr: "लाल" },
    BLUE: { en: "BLUE", bn: "नीল", hi: "नीला", mr: "निळा" },
    GREEN: { en: "GREEN", bn: "সবুজ", hi: "हरा", mr: "हिरवा" },
    YELLOW: { en: "YELLOW", bn: "হলুদ", hi: "पीला", mr: "पिवळा" },
  };

  if (phase === "instructions") {
    return (
      <TaskInstructionCard
        title={t("Stroop Task — Color Clash", "স্ট্রুপ টাস্ক — কালার ক্ল্যাশ", "स्ट्रूप टास्क — कलर क्लैश", "स्ट्रूप टास्क — कलर क्लॅश")}
        subtitle={t("Challenge your brain's selective attention", "রঙ বনাম শব্দের চ্যালেঞ্জ", "अपने मस्तिष्क के चयनात्मक ध्यान को चुनौती दें", "आपल्या मेंदूच्या निवडक एकाग्रतेला आव्हान द्या")}
        icon="🎯"
        category={t("Executive Function", "এক্সিকিউটিভ ফাংশন", "कार्यकारी कार्य", "कार्यकारी कार्य")}
        language={state.language}
        mission={
          t(
            "Name the INK COLOR, not the word! Ignore what the word says and choose the color it is printed in.",
            "শব্দটি কী লেখা আছে তা উপেক্ষা করুন! শব্দটি যে কালিতে বা রঙে লেখা আছে শুধুমাত্র সেই রঙের বোতামটি চাপুন।",
            "शब्द क्या लिखा है उसे अनदेखा करें! शब्द जिस स्याही/रंग में छपा है, केवल उस रंग का बटन चुनें।",
            "शब्द काय लिहिला आहे त्याकडे दुर्लक्ष करा! शब्द ज्या शाईच्या रंगात लिहिला आहे फक्त तोच रंग निवडा."
          )
        }
        visualExample={
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ padding: 14, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#991B1B", marginBottom: 4 }}>
                {t("EXAMPLE STIMULUS", "উদাহরণ উদ্দীপক", "उदाहरण उद्दीपक", "उदाहरण उद्दीपक")}
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#DC2626", letterSpacing: 2 }}>
                {t("BLUE", "নীল", "नीला", "निळा")}
              </div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                {t("Word reads 'BLUE', but ink color is ", "শব্দে লেখা 'নীল', কিন্তু রঙ হলো ", "शब्द में लिखा है 'नीला', लेकिन रंग है ", "शब्द लिहिला आहे 'निळा', पण रंग आहे ")}
                <strong style={{ color: "#DC2626" }}>{t("RED", "লাল (RED)", "लाल (RED)", "लाल (RED)")}</strong>!
              </div>
            </div>
            <div style={{ padding: 14, background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#065F46" }}>
                {t("✅ CORRECT ACTION", "✅ সঠিক উত্তর", "✅ सही क्रिया", "✅ योग्य कृती")}
              </div>
              <div style={{ marginTop: 4, fontSize: 15, fontWeight: 800, color: "#DC2626" }}>
                {t("Press [ R ] for RED", "[ R ] লাল চাপুন", "[ R ] लाल दबाएं", "[ R ] लाल दाबा")}
              </div>
              <div style={{ fontSize: 11, color: "#991B1B", marginTop: 2 }}>
                {t("❌ Don't press Blue!", "❌ ব্লু বা নীল চাপবেন না!", "❌ नीला मत दबाएं!", "❌ निळा दाबू नका!")}
              </div>
            </div>
          </div>
        }
        rules={[
          { text: t("Respond as quickly and accurately as possible.", "প্রতিটি শব্দের জন্য যত দ্রুত ও নির্ভুলভাবে সম্ভব উত্তর দিন।", "जितनी जल्दी और सटीक संभव हो उत्तर दें।", "शक्य तितक्या लवकर आणि अचूक उत्तर द्या."), icon: "⚡" },
          { text: t("Focus solely on the font color, not the word text.", "ফন্ট কালার দেখতে হবে, শব্দের অর্থ উপেক্ষা করুন।", "केवल फॉन्ट के रंग पर ध्यान दें, शब्द के अर्थ पर नहीं।", "केवळ फॉन्टच्या रंगावर लक्ष केंद्रित करा, शब्दाच्या अर्थावर नाही."), icon: "👁️" },
          { text: t("There are 20 quick trials in total.", "মোট ২০টি ট্রায়াল সম্পন্ন করতে হবে।", "कुल 20 त्वरित परीक्षण हैं।", "एकूण 20 चाचण्या आहेत."), icon: "🎯" },
        ]}
        controls={[
          { key: "R", action: t("Red", "লাল (Red)", "लाल (Red)", "लाल (Red)"), color: "#DC2626" },
          { key: "B", action: t("Blue", "নীল (Blue)", "नीला (Blue)", "निळा (Blue)"), color: "#2563EB" },
          { key: "G", action: t("Green", "সবুজ (Green)", "हरा (Green)", "हिरवा (Green)"), color: "#059669" },
          { key: "Y", action: t("Yellow", "হলুদ (Yellow)", "पीला (Yellow)", "पिवळा (Yellow)"), color: "#D97706" },
        ]}
        tip={t(
          "You can use keyboard keys (R, B, G, Y) or click the colored buttons on your screen.",
          "ল্যাপটপে কীবোর্ড কী বা নিচের রঙের বোতামে ক্লিক করুন।",
          "आप कीबोर्ड कुंजियों (R, B, G, Y) का उपयोग कर सकते हैं या स्क्रीन पर रंगीन बटन क्लिक कर सकते हैं।",
          "तुम्ही कीबोर्ड की (R, B, G, Y) वापरू शकता किंवा स्क्रीनवरील रंगीत बटणांवर क्लिक करू शकता."
        )}
        onStart={startTask}
      />
    );
  }

  if (phase === "fixation") {
    return (
      <div className="task-view-container">
        <TaskHUD
          title={t("Stroop Task", "স্ট্রুপ টাস্ক", "स्ट्रूप टास्क", "स्ट्रूप टास्क")}
          icon="🎯"
          category={t("Executive Function", "এক্সিকিউটিভ ফাংশন", "कार्यकारी कार्य", "कार्यकारी कार्य")}
          currentTrial={currentTrialIndex + 1}
          totalTrials={TOTAL_TRIALS}
          language={state.language}
        />
        <div className="task-stimulus" style={{ fontSize: "4.5rem", color: "#1E40AF", fontWeight: 700 }}>
          +
        </div>
      </div>
    );
  }

  if (phase === "stimulus") {
    const trial = trials[currentTrialIndex];
    const displayWord = WORD_LABELS[trial.word]
      ? (state.language === "bn" ? WORD_LABELS[trial.word].bn :
         state.language === "hi" ? WORD_LABELS[trial.word].hi :
         state.language === "mr" ? WORD_LABELS[trial.word].mr :
         WORD_LABELS[trial.word].en)
      : trial.word;

    return (
      <div className="task-view-container">
        <TaskHUD
          title={t("Stroop Task", "স্ট্রুপ টাস্ক", "स्ट्रूप टास्क", "स्ट्रूप टास्क")}
          icon="🎯"
          category={t("Executive Function", "এক্সিকিউটিভ ফাংশন", "कार्यकारी कार्य", "कार्यकारी कार्य")}
          currentTrial={currentTrialIndex + 1}
          totalTrials={TOTAL_TRIALS}
          language={state.language}
        />
        <div className="task-stimulus stimulus-animate">
          <h1 style={{ 
            color: trial.color.toLowerCase(), 
            fontSize: "clamp(3.5rem, 8vw, 6rem)", 
            textTransform: "uppercase",
            fontWeight: 900,
            letterSpacing: 2,
            textShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}>
            {displayWord}
          </h1>
        </div>
        <div className="mobile-controls-container">
          <div className="mobile-controls" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
            <button className="mobile-btn" onClick={() => handleResponse("RED")} style={{ borderColor: "#FECACA", color: "#DC2626" }}>
              <span className="keycap">R</span> {t("RED", "লাল", "लाल", "लाल")}
            </button>
            <button className="mobile-btn" onClick={() => handleResponse("BLUE")} style={{ borderColor: "#BFDBFE", color: "#2563EB" }}>
              <span className="keycap">B</span> {t("BLUE", "নীল", "नीला", "निळा")}
            </button>
            <button className="mobile-btn" onClick={() => handleResponse("GREEN")} style={{ borderColor: "#A7F3D0", color: "#059669" }}>
              <span className="keycap">G</span> {t("GREEN", "সবুজ", "हरा", "हिरवा")}
            </button>
            <button className="mobile-btn" onClick={() => handleResponse("YELLOW")} style={{ borderColor: "#FDE68A", color: "#D97706" }}>
              <span className="keycap">Y</span> {t("YELLOW", "হলুদ", "पीला", "पिवळा")}
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
