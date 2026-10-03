"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import { balancedFlags, roundedMeanOrNull, differenceOrNull, sampleWithoutReplacement } from "@/utils/trials";
import TaskCompleteScreen from "./TaskCompleteScreen";
import TaskInstructionCard from "./TaskInstructionCard";
import TaskHUD from "./TaskHUD";

type Trial = {
  leftWord: string;
  rightWord: string;
  targetPosition: "left" | "right"; // Where the negative/target word is
  dotPosition: "left" | "right";    // Where the dot appears
  congruent: boolean;               // True if targetPosition == dotPosition
};

type TrialResult = Trial & {
  rt: number | null;
  correct: boolean;
};

const TOTAL_TRIALS = 40;
const FIXATION_DURATION = 500;
const STIMULUS_DURATION = 500;
// Trials that get no response within this window are recorded as misses
// rather than hanging the task forever.
const RESPONSE_DEADLINE = 2000;

// Large enough to fill a full run without repeating an item, so repetition
// priming does not confound the attentional-bias score.
const NEUTRAL_WORDS = {
  en: [
    "CHAIR", "TABLE", "WATER", "HOUSE", "PAPER", "PLANT", "CLOCK", "GLASS", "TRAIN", "APPLE",
    "BREAD", "RIVER", "STONE", "LIGHT", "MUSIC", "BRUSH", "FIELD", "CLOUD", "SUGAR", "SHIRT",
    "ROUTE", "GRASS", "STICK", "BOTTLE", "WINDOW", "PENCIL", "CARPET", "GARDEN", "BASKET", "CANDLE",
  ],
  bn: [
    "চেয়ার", "টেবিল", "জল", "বাড়ি", "কাগজ", "গাছ", "ঘড়ি", "গ্লাস", "ট্রেন", "আপেল",
    "রুটি", "নদী", "পাথর", "আলো", "গান", "তুলি", "মাঠ", "মেঘ", "চিনি", "জামা",
    "রাস্তা", "ঘাস", "লাঠি", "বোতল", "জানালা", "পেন্সিল", "কার্পেট", "বাগান", "ঝুড়ি", "মোমবাতি",
  ],
  hi: [
    "कुर्सी", "मेज़", "पानी", "घर", "कागज़", "पौधा", "घड़ी", "गिलास", "रेल", "सेब",
    "रोटी", "नदी", "पत्थर", "रोशनी", "गाना", "ब्रश", "मैदान", "बादल", "चीनी", "कमीज़",
    "रास्ता", "घास", "लाठी", "बोतल", "खिड़की", "पेंसिल", "कालीन", "बगीचा", "टोकरी", "मोमबत्ती",
  ],
  mr: [
    "खुर्ची", "टेबल", "पाणी", "घर", "कागद", "झाड", "घड्याळ", "पेला", "गाडी", "सफरचंद",
    "भाकरी", "नदी", "दगड", "प्रकाश", "गाणे", "कुंचला", "मैदान", "ढग", "साखर", "शर्ट",
    "रस्ता", "गवत", "काठी", "बाटली", "खिडकी", "पेन्सिल", "गालिचा", "बाग", "टोपली", "मेणबत्ती",
  ],
};
const TARGET_WORDS = {
  en: [
    "ANGER", "DEATH", "FEAR", "PANIC", "GRIEF", "HATE", "ENEMY", "SNAKE", "SPIDER", "PAIN",
    "TERROR", "AGONY", "THREAT", "DANGER", "DISEASE", "FUNERAL", "VICTIM", "CRUEL", "WOUND", "TRAUMA",
    "DESPAIR", "HORROR", "POISON", "ASSAULT", "MISERY", "PANICKY", "SHAME", "DREAD", "CRISIS", "RUIN",
  ],
  bn: [
    "রাগ", "মৃত্যু", "ভয়", "আতঙ্ক", "শোক", "ঘৃণা", "শত্রু", "সাপ", "মাকড়সা", "ব্যথা",
    "সন্ত্রাস", "যন্ত্রণা", "হুমকি", "বিপদ", "রোগ", "শবযাত্রা", "শিকার", "নিষ্ঠুর", "ক্ষত", "আঘাত",
    "হতাশা", "বিভীষিকা", "বিষ", "আক্রমণ", "দুঃখ", "উদ্বেগ", "লজ্জা", "ত্রাস", "সংকট", "ধ্বংস",
  ],
  hi: [
    "क्रोध", "मृत्यु", "डर", "आतंक", "शोक", "नफ़रत", "शत्रु", "साँप", "मकड़ी", "दर्द",
    "दहशत", "यातना", "धमकी", "खतरा", "बीमारी", "जनाज़ा", "पीड़ित", "क्रूर", "घाव", "आघात",
    "निराशा", "खौफ़", "ज़हर", "हमला", "कष्ट", "घबराहट", "शर्म", "त्रास", "संकट", "विनाश",
  ],
  mr: [
    "राग", "मृत्यू", "भीती", "घबराट", "शोक", "द्वेष", "शत्रू", "साप", "कोळी", "वेदना",
    "दहशत", "यातना", "धमकी", "धोका", "आजार", "अंत्ययात्रा", "बळी", "क्रूर", "जख्म", "आघात",
    "निराशा", "थरकाप", "विष", "हल्ला", "दुःख", "धांदल", "लाज", "त्रास", "संकट", "विनाश",
  ],
};

export default function DotProbeTask({ onComplete }: { onComplete?: () => void }) {
  const { state, markTestCompleted } = useAppContext();
  const router = useRouter();
  
  const [phase, setPhase] = useState<"instructions" | "fixation" | "words" | "dot" | "completed">("instructions");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [calculatedParams, setCalculatedParams] = useState<any>(null);
  // True when the result was only queued locally (device offline).
  const [queuedOffline, setQueuedOffline] = useState(false);

  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const interTrialRef = useRef<NodeJS.Timeout | null>(null);
  const hasRespondedRef = useRef(false);

  // Generate sequence — counterbalanced: exactly half the trials are congruent
  // (dot behind the emotional word) and target side is balanced independently,
  // so the attentional-bias score rests on equal-sized cells. Words are sampled
  // without replacement to limit repetition priming.
  useEffect(() => {
    const neutralDict = NEUTRAL_WORDS[state.language] || NEUTRAL_WORDS.en;
    const targetDict = TARGET_WORDS[state.language] || TARGET_WORDS.en;

    const targetLeft = balancedFlags(TOTAL_TRIALS, 0.5);
    const congruentFlags = balancedFlags(TOTAL_TRIALS, 0.5);
    const neutralWords = sampleWithoutReplacement(neutralDict, TOTAL_TRIALS);
    const targetWords = sampleWithoutReplacement(targetDict, TOTAL_TRIALS);

    const sequence: Trial[] = targetLeft.map((isTargetLeft: boolean, i: number) => {
      const targetPosition: "left" | "right" = isTargetLeft ? "left" : "right";
      const congruent = congruentFlags[i];
      const dotPosition: "left" | "right" = congruent
        ? targetPosition
        : (targetPosition === "left" ? "right" : "left");

      return {
        leftWord: targetPosition === "left" ? targetWords[i] : neutralWords[i],
        rightWord: targetPosition === "right" ? targetWords[i] : neutralWords[i],
        targetPosition,
        dotPosition,
        congruent,
      };
    });
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

    // 1. Fixation
    timeoutRef.current = setTimeout(() => {
      setPhase("words");

      // 2. Words
      timeoutRef.current = setTimeout(() => {
        setPhase("dot");
        startTimeRef.current = performance.now();

        // 3. Response deadline. Previously this waited indefinitely, so a
        // distracted participant produced a 45-second "reaction time" that
        // entered the mean, and an abandoned run hung with no way forward.
        responseTimeoutRef.current = setTimeout(() => {
          if (hasRespondedRef.current) return;
          hasRespondedRef.current = true;
          const trial = trials[index];
          if (trial) {
            setResults(prev => [...prev, { ...trial, rt: null, correct: false }]);
          }
          runNextTrial(index + 1);
        }, RESPONSE_DEADLINE);
      }, STIMULUS_DURATION);

    }, FIXATION_DURATION);
  };

  const handleResponse = useCallback((responsePos: "left" | "right") => {
    if (phase !== "dot" || hasRespondedRef.current) return;
    
    hasRespondedRef.current = true;
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    const rt = performance.now() - startTimeRef.current;
    const trial = trials[currentTrialIndex];
    const correct = responsePos === trial.dotPosition;

    setResults(prev => [...prev, { ...trial, rt, correct }]);

    interTrialRef.current = setTimeout(() => {
      runNextTrial(currentTrialIndex + 1);
    }, 500);
  }, [phase, currentTrialIndex, trials]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.code;
    if (key === "KeyE" || key === "ArrowLeft") handleResponse("left");
    if (key === "KeyI" || key === "ArrowRight") handleResponse("right");
  }, [handleResponse]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    return () => {
      // All three must be cleared, otherwise navigating away mid-task
      // leaves timers firing setState on an unmounted component.
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
      if (interTrialRef.current) clearTimeout(interTrialRef.current);
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
    
    // Parameters (only correct, RT > 150ms)
    const validTrials = results.filter(r => r.correct && r.rt !== null && r.rt > 150);
    const congruentRTs = validTrials.filter(r => r.congruent).map(r => r.rt as number);
    const incongruentRTs = validTrials.filter(r => !r.congruent).map(r => r.rt as number);

    
    const meanRTCongruent = roundedMeanOrNull(congruentRTs);
    const meanRTIncongruent = roundedMeanOrNull(incongruentRTs);
    const biasScore = differenceOrNull(meanRTIncongruent, meanRTCongruent); // Positive means attention was captured by target word

    
    setCalculatedParams({
      param1Name: "Mean RT Congruent (ms)", param1Value: meanRTCongruent,
      param2Name: "Mean RT Incongruent (ms)", param2Value: meanRTIncongruent,
      param3Name: "Attentional Bias Score", param3Value: biasScore
    });
    try {
      const res = await fetchWithOfflineSync("/api/submit-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          testCategory: "Attention",
          specificTest: "Dot Probe Task",
          param1Name: "Mean RT Congruent (ms)",
          param1Value: meanRTCongruent,
          param2Name: "Mean RT Incongruent (ms)",
          param2Value: meanRTIncongruent,
          param3Name: "Attentional Bias Score",
          param3Value: biasScore,
          rawTrialData: results
        })
      });
      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok && !payload?.offline) {
        throw new Error(payload?.error || `Upload failed (${res.status})`);
      }
      setQueuedOffline(Boolean(payload?.offline));
      markTestCompleted("/cognitive/dotprobe");
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
        title={t("Dot Probe Task — Visual Spotlight", "ডট প্রোব টাস্ক — ভিজ্যুয়াল স্পটলাইট", "डॉट प्रोब टास्क — दृश्य एकाग्रता", "डॉट प्रोब टास्क — दृश्य एकाग्रता")}
        subtitle={t("Where did the target dot appear?", "ডট বা লক্ষ্যবিন্দু কোন পাশে ফুটে উঠলো?", "लक्षित बिंदु किस तरफ दिखाई दिया?", "लक्षित बिंदू कोणत्या बाजूला दिसला?")}
        icon="📍"
        category={t("Attention Bias", "মনোযোগ (Attention)", "ध्यान पूर्वाग्रह", "एकाग्रता पूर्वग्रह")}
        language={state.language}
        mission={
          t(
            "After the center cross, two words flash briefly. As soon as they disappear, a glowing blue dot (●) appears on the LEFT or RIGHT. Detect its position as fast as possible!",
            "মাঝখানের ক্রসের পর ক্ষণিকের জন্য দুটি শব্দ দেখা যাবে। শব্দ দুটি মিলিয়ে যাওয়ার সাথে সাথেই বাম অথবা ডান পাশে একটি নীল ডট (●) জ্বলবে। ডটটি দেখার সাথে সাথে দ্রুত বোতাম চাপুন!",
            "केंद्र के क्रॉस के बाद दो शब्द थोड़ी देर के लिए चमकेंगे। जैसे ही वे गायब होंगे, बाईं या दाईं ओर एक चमकता नीला बिंदु (●) दिखाई देगा। जितनी जल्दी हो सके इसकी स्थिति पहचानें!",
            "मध्यभागी असलेल्या क्रॉस नंतर दोन शब्द क्षणभर चमकतील. ते नाहीसे होताच डाव्या किंवा उजव्या बाजूला एक निळा बिंदू (●) दिसेल. शक्य तितक्या लवकर त्याची बाजू ओळखा!"
          )
        }
        visualExample={
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ padding: 14, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", marginBottom: 6 }}>
                {t("STEP 1: WORDS FLASH", "ধাপ ১: শব্দ দুটি ফ্ল্যাশ করবে", "चरण 1: शब्द चमकेंगे", "पायरी 1: शब्द चमकतील")}
              </div>
              <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "10px 0" }}>
                <span style={{ fontWeight: 800, color: "#DC2626", fontSize: 16 }}>{t("ANGER", "রাগ", "क्रोध", "राग")}</span>
                <span style={{ color: "#CBD5E1" }}>|</span>
                <span style={{ fontWeight: 800, color: "#2563EB", fontSize: 16 }}>{t("RIVER", "নদী", "नदी", "नदी")}</span>
              </div>
            </div>
            <div style={{ padding: 14, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1E40AF", marginBottom: 6 }}>
                {t("STEP 2: DOT APPEARS", "ধাপ ২: ডট দেখা দিলে চাপুন", "चरण 2: बिंदु दिखेगा", "पायरी 2: बिंदू दिसेल")}
              </div>
              <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "8px 0" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2563EB", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900 }}>●</div>
                <span style={{ color: "#CBD5E1" }}>|</span>
                <div style={{ width: 28, height: 28 }}></div>
              </div>
              <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: "#1D4ED8" }}>
                {t("Dot on Left ➔ Press [ E ] or [ ← ]", "বামে ডট ➔ [ E ] বা [ ← ] চাপুন", "बाईं ओर बिंदु ➔ [ E ] या [ ← ] दबाएं", "डावीकडे बिंदू ➔ [ E ] किंवा [ ← ] दाबा")}
              </div>
            </div>
          </div>
        }
        rules={[
          { text: t("If dot appears on the LEFT, press [E] or [←].", "ডটটি বাম পাশে দেখা দিলে [E] অথবা [←] চাপুন।", "यदि बिंदु बाईं ओर दिखाई दे, तो [E] या [←] दबाएं।", "जर बिंदू डाव्या बाजूला दिसला, तर [E] किंवा [←] दाबा."), icon: "👈" },
          { text: t("If dot appears on the RIGHT, press [I] or [→].", "ডটটি ডান পাশে দেখা দিলে [I] অথবা [→] চাপুন।", "यदि बिंदु दाईं ओर दिखाई दे, तो [I] या [→] दबाएं।", "जर बिंदू उजव्या बाजूला दिसला, तर [I] किंवा [→] दाबा."), icon: "👉" },
          { text: t("The dot appears quickly — keep your eyes sharp!", "ডটটি খুব দ্রুত চলে যেতে পারে, তাই সবসময় প্রস্তুত থাকুন!", "बिंदु बहुत तेजी से आता है — अपनी नज़रें तेज़ रखें!", "बिंदू खूप वेगाने येतो — डोळे सतर्क ठेवा!"), icon: "⚡" },
          { text: t("There are 40 quick trials in total.", "মোট ৪০টি ট্রায়াল সম্পন্ন করতে হবে।", "कुल 40 त्वरित परीक्षण हैं।", "एकूण 40 जलद चाचण्या आहेत."), icon: "🎯" },
        ]}
        controls={[
          { key: "E / ←", action: t("Left", "বাম (Left)", "बायाँ (Left)", "डावा (Left)"), color: "#2563EB" },
          { key: "I / →", action: t("Right", "ডান (Right)", "दायाँ (Right)", "उजवा (Right)"), color: "#7C3AED" },
        ]}
        tip={t(
          "You can use keyboard keys (E / I or Arrow keys) or click the buttons below.",
          "ল্যাপটপের কীবোর্ড বা নিচের বোতামগুলিতে ক্লিক করতে পারেন।",
          "आप कीबोर्ड कुंजियों (E / I या तीर कुंजियों) का उपयोग कर सकते हैं या नीचे दिए गए बटनों पर क्लिक कर सकते हैं।",
          "तुम्ही कीबोर्ड की (E / I किंवा बाण की) वापरू शकता किंवा खालील बटणांवर क्लिक करू शकता."
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
        title={t("Dot Probe", "ডট প্রোব", "डॉट प्रोब", "डॉट प्रोब")}
        icon="📍"
        category={t("Attention", "মনোযোগ", "ध्यान", "एकाग्रता")}
        currentTrial={currentTrialIndex + 1}
        totalTrials={TOTAL_TRIALS}
        language={state.language}
      />

      <div className="task-stimulus" style={{ flexDirection: "column" }}>
        {phase === "fixation" && (
          <h1 style={{ fontSize: "4.5rem", color: "#2563EB", fontWeight: 700 }}>+</h1>
        )}
        
        {phase === "words" && trial && (
          <div style={{ display: "flex", width: "100%", maxWidth: "680px", justifyContent: "space-between", padding: "0 24px" }} className="stimulus-animate">
            <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", margin: 0, textAlign: "left", width: "45%", color: "var(--text-primary)", fontWeight: 800 }}>
              {trial.leftWord}
            </h1>
            <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", margin: 0, textAlign: "right", width: "45%", color: "var(--text-primary)", fontWeight: 800 }}>
              {trial.rightWord}
            </h1>
          </div>
        )}

        {phase === "dot" && trial && (
          <div style={{ display: "flex", width: "100%", maxWidth: "680px", justifyContent: trial.dotPosition === "left" ? "flex-start" : "flex-end", padding: "0 60px" }} className="stimulus-animate">
            <div style={{ 
              width: 56, 
              height: 56, 
              borderRadius: "50%", 
              background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
              boxShadow: "0 0 24px rgba(37, 99, 235, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "1.8rem",
              fontWeight: 900
            }}>
              ●
            </div>
          </div>
        )}
      </div>

      {phase === "dot" && (
        <div className="mobile-controls-container">
          <div className="mobile-controls" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", maxWidth: 440, margin: "0 auto", gap: 14 }}>
            <button 
              className="mobile-btn" 
              onClick={() => handleResponse("left")}
              style={{ borderColor: "#BFDBFE", color: "#1D4ED8", padding: "14px 20px" }}
            >
              <span className="keycap">E / ←</span> {t("LEFT", "বাম (LEFT)", "बायाँ (LEFT)", "डावा (LEFT)")}
            </button>
            <button 
              className="mobile-btn" 
              onClick={() => handleResponse("right")}
              style={{ borderColor: "#DDD6FE", color: "#6D28D9", padding: "14px 20px" }}
            >
              <span className="keycap">I / →</span> {t("RIGHT", "ডান (RIGHT)", "दायाँ (RIGHT)", "उजवा (RIGHT)")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
