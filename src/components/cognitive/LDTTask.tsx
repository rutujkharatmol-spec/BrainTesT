"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import { balancedFlags, roundedMeanOrNull, sampleWithoutReplacement } from "@/utils/trials";
import TaskCompleteScreen from "./TaskCompleteScreen";
import TaskInstructionCard from "./TaskInstructionCard";
import TaskHUD from "./TaskHUD";

type Trial = {
  string: string;
  isWord: boolean;
};

type TrialResult = Trial & {
  rt: number | null;
  correct: boolean;
};

const TOTAL_TRIALS = 40;
const FIXATION_DURATION = 500;

// Each list holds at least TOTAL_TRIALS/2 items so a full run can be drawn
// without repeating any item.
const WORDS = {
  en: [
    "HOUSE", "APPLE", "WATER", "CHAIR", "PLANT", "CLOCK", "TABLE", "GLASS", "TRAIN", "PAPER",
    "BREAD", "RIVER", "STONE", "LIGHT", "MUSIC", "BRUSH", "FIELD", "CLOUD", "SUGAR", "TIGER",
    "SHIRT", "MONEY", "ROUTE", "GRASS", "STICK",
  ],
  bn: [
    "বাড়ি", "আপেল", "জল", "চেয়ার", "গাছ", "ঘড়ি", "টেবিল", "গ্লাস", "ট্রেন", "কাগজ",
    "রুটি", "নদী", "পাথর", "আলো", "গান", "তুলি", "মাঠ", "মেঘ", "চিনি", "বাঘ",
    "জামা", "টাকা", "রাস্তা", "ঘাস", "লাঠি",
  ],
  hi: [
    "घर", "सेब", "पानी", "कुर्सी", "पौधा", "घड़ी", "मेज़", "गिलास", "रेल", "कागज़",
    "रोटी", "नदी", "पत्थर", "रोशनी", "गाना", "ब्रश", "मैदान", "बादल", "चीनी", "बाघ",
    "कमीज़", "पैसा", "रास्ता", "घास", "लाठी",
  ],
  mr: [
    "घर", "सफरचंद", "पाणी", "खुर्ची", "झाड", "घड्याळ", "टेबल", "पेला", "गाडी", "कागद",
    "भाकरी", "नदी", "दगड", "प्रकाश", "गाणे", "कुंचला", "मैदान", "ढग", "साखर", "वाघ",
    "शर्ट", "पैसे", "रस्ता", "गवत", "काठी",
  ],
};
const NON_WORDS = {
  en: [
    "BLAP", "TRISK", "FROBN", "GLAR", "SNURT", "VLEEB", "CROMB", "PLANKT", "SNARF", "FLIRM",
    "DRENT", "SPULK", "TRAMB", "GLINK", "PROST", "KLIMP", "BRUNK", "SWELP", "THRIM", "CLOND",
    "GRAFT", "PLUSK", "SNODE", "TWERN", "BLIMP",
  ],
  bn: [
    "ঝিকাত", "লিমুট", "চামুর", "ফেনক", "পিসুল", "হিরাম", "ভুসক", "রিসত", "নাপস", "টোমার",
    "কেলুপ", "মিদরা", "শুবাক", "ঢোপিন", "তরুস", "গমিল", "বেসুক", "নিঝল", "পাত্রুম", "সোমিদ",
    "খলুপ", "রেমিত", "চুবাল", "ধিনক", "সপুরা",
  ],
  hi: [
    "झिकात", "लिमुट", "चामुर", "फेनक", "पिसुल", "हिराम", "भुसक", "रिसत", "नापस", "टोमार",
    "केलुप", "मिदरा", "शुबाक", "ढोपिन", "तरुस", "गमिल", "बेसुक", "निझल", "पात्रुम", "सोमिद",
    "खलुप", "रेमित", "चुबाल", "धिनक", "सपुरा",
  ],
  mr: [
    "झिकात", "लिमुट", "चामुर", "फेनक", "पिसুল", "हिराम", "भुसक", "रिसत", "नापस", "टोमार",
    "केलुप", "मिदरा", "शुबाक", "ढोपिन", "तरुस", "गमिल", "बेसुक", "निझल", "पात्रुम", "सोमिद",
    "खलुप", "रेमित", "चुबाल", "धिनक", "सपुरा",
  ],
};

export default function LDTTask({ onComplete }: { onComplete?: () => void }) {
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

  // Generate sequence — exactly half words / half non-words, and items drawn
  // without replacement so a 10-item list is not repeated ~4x across 40 trials
  // (which would let repetition priming drive the word/non-word contrast).
  useEffect(() => {
    const lang = state.language;
    const wordDict = WORDS[lang] || WORDS.en;
    const nonWordDict = NON_WORDS[lang] || NON_WORDS.en;

    const isWordFlags = balancedFlags(TOTAL_TRIALS, 0.5);
    const words = sampleWithoutReplacement(wordDict, TOTAL_TRIALS);
    const nonWords = sampleWithoutReplacement(nonWordDict, TOTAL_TRIALS);

    const sequence: Trial[] = isWordFlags.map((isWord: boolean, i: number) => ({
      string: isWord ? words[i] : nonWords[i],
      isWord,
    }));
    setTrials(sequence);
  }, [state.language]);

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
    }, FIXATION_DURATION);
  };

  const handleResponse = useCallback((responseKey: "KeyF" | "KeyJ") => {
    if (phase !== "stimulus" || hasRespondedRef.current) return;
    
    hasRespondedRef.current = true;
    const rt = performance.now() - startTimeRef.current;
    
    const trial = trials[currentTrialIndex];
    const userSaidWord = responseKey === "KeyF";
    const correct = userSaidWord === trial.isWord;

    setResults(prev => [...prev, { ...trial, rt, correct }]);

    setTimeout(() => {
      runNextTrial(currentTrialIndex + 1);
    }, 500);
  }, [phase, currentTrialIndex, trials]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.code;
    if (key === "KeyF" || key === "KeyJ") {
      handleResponse(key);
    }
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
    
    const validTrials = results.filter(r => r.correct && r.rt !== null && r.rt > 100);
    const wordRTs = validTrials.filter(r => r.isWord).map(r => r.rt as number);
    const nonWordRTs = validTrials.filter(r => !r.isWord).map(r => r.rt as number);

    
    const meanRTWords = roundedMeanOrNull(wordRTs);
    const meanRTNonWords = roundedMeanOrNull(nonWordRTs);
    const overallAccuracy = (results.filter(r => r.correct).length / TOTAL_TRIALS) * 100;

    
    setCalculatedParams({
      param1Name: "Mean RT Words (ms)", param1Value: meanRTWords,
      param2Name: "Mean RT Non-words (ms)", param2Value: meanRTNonWords,
      param3Name: "Overall Accuracy (%)", param3Value: Math.round(overallAccuracy)
    });
    try {
      const res = await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          testCategory: "Social & Emotional Cognition",
          specificTest: "Lexical Decision Task",
          param1Name: "Mean RT Words (ms)",
          param1Value: meanRTWords,
          param2Name: "Mean RT Non-words (ms)",
          param2Value: meanRTNonWords,
          param3Name: "Overall Accuracy (%)",
          param3Value: Math.round(overallAccuracy),
          rawTrialData: results
        })
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok && !payload?.offline) {
        throw new Error(payload?.error || `Upload failed (${res.status})`);
      }
      setQueuedOffline(Boolean(payload?.offline));
      markTestCompleted("/cognitive/ldt");
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
        title={t("Lexical Decision Task — Real or Fake?", "লেক্সিক্যাল ডিসিশন টাস্ক — আসল নাকি বানানো?", "लेक्सिकल डिसिजन टास्क — असली या बनावटी?", "लेक्सिकल डिसिजन टास्क — खरा की बनावट?")}
        subtitle={t("Identify real words vs made-up non-words", "শব্দটি আসল নাকি বানানো তা চিনুন", "पहचानें कि शब्द असली है या मनगढ़ंत", "शब्द खरा आहे की बनावट ते ओळखा")}
        icon="📖"
        category={t("Language & Cognition", "ভাষাগত জ্ঞান (Language)", "भाषा और अनुभूति", "भाषा आणि आकलन")}
        language={state.language}
        mission={
          t(
            "A word will appear on screen. Decide as quickly as possible: Is it a REAL dictionary word (press [F]), or a MADE-UP non-word (press [J])?",
            "স্ক্রিনে একটি শব্দ ভেসে উঠবে। যদি এটি একটি আসল ও অর্থপূর্ণ শব্দ হয়, তবে 'F' বা WORD চাপুন। আর যদি এটি অর্থহীন বা বানানো শব্দ হয়, তবে 'J' বা NON-WORD চাপুন!",
            "स्क्रीन पर एक शब्द दिखाई देगा। जितनी जल्दी हो सके तय करें: क्या यह एक वास्तविक शब्द है ( [F] दबाएं), या एक बनावटी/काल्पनिक शब्द है ( [J] दबाएं)?",
            "स्क्रीनवर एक शब्द दिसेल. शक्य तितक्या लवकर ठरवा: हा शब्द खरा आहे ( [F] दाबा), की बनावट/काल्पनिक शब्द आहे ( [J] दाबा)?"
          )
        }
        visualExample={
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ padding: 14, background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#065F46", marginBottom: 6 }}>
                {t("EXAMPLE 1: REAL WORD", "উদাহরণ ১: আসল শব্দ", "उदाहरण 1: असली शब्द", "उदाहरण 1: खरा शब्द")}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#047857" }}>
                {t("HOUSE", "বাড়ি", "घर", "घर")}
              </div>
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#065F46" }}>
                {t("Real Word ➔ Press [ F ] WORD", "আসল শব্দ ➔ [ F ] WORD চাপুন", "असली शब्द ➔ [ F ] WORD दबाएं", "खरा शब्द ➔ [ F ] WORD दाबा")}
              </div>
            </div>
            <div style={{ padding: 14, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#991B1B", marginBottom: 6 }}>
                {t("EXAMPLE 2: FAKE WORD", "উদাহরণ ২: বানানো/অর্থহীন শব্দ", "उदाहरण 2: बनावटी शब्द", "उदाहरण 2: बनावट शब्द")}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#DC2626" }}>
                {t("BLAP", "ঝিকাত", "झिकात", "झिकात")}
              </div>
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#991B1B" }}>
                {t("Fake Word ➔ Press [ J ] NON-WORD", "অর্থহীন শব্দ ➔ [ J ] NON-WORD চাপুন", "बनावटी शब्द ➔ [ J ] NON-WORD दबाएं", "बनावट शब्द ➔ [ J ] NON-WORD दाबा")}
              </div>
            </div>
          </div>
        }
        rules={[
          { text: t("If it is a REAL meaningful word, press [F] or tap WORD.", "আসল অর্থপূর্ণ শব্দ হলে [F] বা WORD বাটন চাপুন।", "यदि यह एक असली सार्थक शब्द है, तो [F] दबाएं या WORD पर टैप करें।", "जर तो खरा अर्थपूर्ण शब्द असेल, तर [F] दाबा किंवा WORD वर टॅप करा."), icon: "✅" },
          { text: t("If it is a MADE-UP non-word, press [J] or tap NON-WORD.", "অর্থহীন বা বানানো শব্দ হলে [J] বা NON-WORD বাটন চাপুন।", "यदि यह बनावटी शब्द है, तो [J] दबाएं या NON-WORD पर टैप करें।", "जर तो बनावट शब्द असेल, तर [J] दाबा किंवा NON-WORD वर टॅप करा."), icon: "❌" },
          { text: t("Answer as fast and accurately as possible.", "যত দ্রুত এবং সঠিকভাবে সম্ভব উত্তর দিন।", "जितनी जल्दी और सटीक संभव हो उत्तर दें।", "शक्य तितक्या लवकर आणि अचूक उत्तर द्या."), icon: "⚡" },
          { text: t("There are 40 quick trials in total.", "মোট ৪০টি ট্রায়াল সম্পন্ন করতে হবে।", "कुल 40 त्वरित परीक्षण हैं।", "एकूण 40 जलद चाचण्या आहेत."), icon: "🎯" },
        ]}
        controls={[
          { key: "F", action: t("Real Word", "আসল শব্দ (Word)", "असली शब्द (Word)", "खरा शब्द (Word)"), color: "#059669" },
          { key: "J", action: t("Non-Word", "অর্থহীন শব্দ (Non-Word)", "बनावटी शब्द (Non-Word)", "बनावट शब्द (Non-Word)"), color: "#DC2626" },
        ]}
        tip={t(
          "You can use keyboard keys (F and J) or click the buttons below.",
          "ল্যাপটপের কীবোর্ড (F / J) বা নিচের বোতামগুলিতে ক্লিক করতে পারেন।",
          "आप कीबोर्ड कुंजियों (F और J) का उपयोग कर सकते हैं या नीचे दिए गए बटनों पर क्लिक कर सकते हैं।",
          "तुम्ही कीबोर्ड की (F आणि J) वापरू शकता किंवा खालील बटणांवर क्लिक करू शकता."
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
        title={t("Lexical Decision", "লেক্সিক্যাল ডিসিশন", "लेक्सिकल डिसिजन", "लेक्सिकल डिसिजन")}
        icon="📖"
        category={t("Language & Cognition", "ভাষাগত জ্ঞান", "भाषा और अनुभूति", "भाषा आणि आकलन")}
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
              fontSize: "clamp(3rem, 8vw, 5.5rem)", 
              fontWeight: 900, 
              textTransform: "uppercase", 
              color: "var(--text-primary)",
              letterSpacing: "3px"
            }}>
              {trial.string}
            </h1>
          </div>
        )}
      </div>

      {phase === "stimulus" && (
        <div className="mobile-controls-container">
          <div className="mobile-controls" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", maxWidth: 460, margin: "0 auto", gap: 14 }}>
            <button 
              className="mobile-btn" 
              onClick={() => handleResponse("KeyF")}
              style={{ borderColor: "#A7F3D0", color: "#065F46", padding: "14px 18px" }}
            >
              <span className="keycap">F</span> {t("REAL WORD", "আসল শব্দ (WORD)", "असली शब्द (WORD)", "खरा शब्द (WORD)")}
            </button>
            <button 
              className="mobile-btn" 
              onClick={() => handleResponse("KeyJ")}
              style={{ borderColor: "#FECACA", color: "#991B1B", padding: "14px 18px" }}
            >
              <span className="keycap">J</span> {t("NON-WORD", "অর্থহীন শব্দ (NON-WORD)", "बनावटी शब्द (NON-WORD)", "बनावट शब्द (NON-WORD)")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
