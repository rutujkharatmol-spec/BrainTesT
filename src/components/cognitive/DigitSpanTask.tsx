"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import TaskCompleteScreen from "./TaskCompleteScreen";
import TaskInstructionCard from "./TaskInstructionCard";
import TaskHUD from "./TaskHUD";

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
        title={t("Digit Span Test — Number Recall", "ডিজিট স্প্যান টেস্ট — নম্বর মেমরি", "डिजिट स्पैन टेस्ट — संख्या स्मरण", "डिजिट स्पॅन टेस्ट — संख्या स्मरण")}
        subtitle={t("Memorize the sequence of digits", "সংখ্যাগুলির ক্রম মনে রাখুন", "अंकों के क्रम को याद रखें", "अंकांचा क्रम लक्षात ठेवा")}
        icon="🔢"
        category={t("Working Memory", "স্মৃতিশক্তি (Memory)", "कार्यशील स्मृति", "कार्यशील स्मरणशक्ती")}
        language={state.language}
        mission={
          t(
            "Numbers will appear on screen one by one. Once the sequence ends, recall and enter the numbers in the EXACT SAME order using your keyboard or on-screen keypad!",
            "স্ক্রিনে একে একে কয়েকটি সংখ্যা দেখা যাবে। সমস্ত সংখ্যা দেখানো শেষ হলে, সংখ্যাগুলি ঠিক যে ক্রমে দেখা গিয়েছিল সেই ক্রমানুসারে আপনার কীবোর্ড বা স্ক্রিনের নম্বর প্যাড ব্যবহার করে প্রবেশ করান!",
            "स्क्रीन पर एक-एक करके संख्याएं दिखाई देंगी। अनुक्रम समाप्त होने के बाद, अपने कीबोर्ड या ऑन-स्क्रीन कीपैड का उपयोग करके ठीक उसी क्रम में संख्याओं को दर्ज करें!",
            "स्क्रीनवर एकापाठोपाठ एक संख्या दिसतील. क्रम संपल्यानंतर, आपल्या कीबोर्ड किंवा ऑन-स्क्रीन कीपॅडचा वापर करून अगदी त्याच क्रमाने संख्या प्रविष्ट करा!"
          )
        }
        visualExample={
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <div style={{ padding: 14, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1E40AF", marginBottom: 6 }}>
                {t("STEP 1: NUMBERS FLASH", "ধাপ ১: সংখ্যা প্রদর্শিত হবে", "चरण 1: संख्याएं चमकेंगी", "पायरी 1: संख्या दिसतील")}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, alignItems: "center", padding: "6px 0" }}>
                <span style={{ fontSize: 22, fontWeight: 900, background: "#DBEAFE", color: "#1E40AF", width: 34, height: 34, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>4</span>
                <span style={{ color: "#94A3B8" }}>➔</span>
                <span style={{ fontSize: 22, fontWeight: 900, background: "#DBEAFE", color: "#1E40AF", width: 34, height: 34, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>9</span>
                <span style={{ color: "#94A3B8" }}>➔</span>
                <span style={{ fontSize: 22, fontWeight: 900, background: "#DBEAFE", color: "#1E40AF", width: 34, height: 34, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>2</span>
              </div>
            </div>
            <div style={{ padding: 14, background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#065F46", marginBottom: 6 }}>
                {t("STEP 2: ENTER SAME ORDER", "ধাপ ২: একই ক্রমে উত্তর দিন", "चरण 2: उसी क्रम में दर्ज करें", "पायरी 2: त्याच क्रमाने प्रविष्ट करा")}
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#059669", letterSpacing: 4 }}>
                4 - 9 - 2
              </div>
              <div style={{ fontSize: 11, color: "#047857", marginTop: 4 }}>
                {t("Type [ 4 ][ 9 ][ 2 ] on keyboard", "কীবোর্ডে [ 4 ][ 9 ][ 2 ] টাইপ করুন", "कीबोर्ड पर [ 4 ][ 9 ][ 2 ] टाइप करें", "कीबोर्डवर [ 4 ][ 9 ][ 2 ] टाईप करा")}
              </div>
            </div>
          </div>
        }
        rules={[
          { text: t("Watch carefully — each number is flashed once.", "সংখ্যাগুলি মনোযোগ দিয়ে দেখুন — প্রতিটি সংখ্যা মাত্র একবার দেখানো হবে।", "ध्यान से देखें — प्रत्येक संख्या केवल एक बार दिखाई जाती है।", "काळजीपूर्वक पहा — प्रत्येक संख्या फक्त एकदाच दाखवली जाईल."), icon: "👁️" },
          { text: t("With each correct recall, the digit sequence gets longer.", "সঠিক উত্তর দিলে ক্রমটি ধাপে ধাপে দীর্ঘতর হবে।", "प्रत्येक सही उत्तर के साथ अंकों का क्रम लंबा होता जाता है।", "प्रत्येक अचूक उत्तरासह अंकांचा क्रम लांब होत जातो."), icon: "📈" },
          { text: t("Making 2 mistakes at the same span length completes the test.", "একই দৈর্ঘ্যে ২ বার ভুল হলে টেস্ট সম্পন্ন হবে।", "समान लंबाई पर 2 गलतियाँ करने से परीक्षण पूरा हो जाता है।", "समान लांबीवर 2 चुका केल्यास चाचणी पूर्ण होते."), icon: "⚠️" },
        ]}
        controls={[
          { key: "0 - 9", action: t("Number keys or Keypad", "সংখ্যা কী বা অন-স্ক্রিন কিপ্যাড", "संख्या कुंजियाँ या कीपैड", "संख्या की किंवा कीपॅड"), color: "#2563EB" },
        ]}
        tip={t(
          "You can use laptop number keys (0-9) or tap/click the on-screen keypad.",
          "ল্যাপটপের কীবোর্ডের নম্বর কী বা স্ক্রিনের কিপ্যাড স্পর্শ করে উত্তর দিতে পারেন।",
          "आप लैपटॉप नंबर कुंजियों (0-9) का उपयोग कर सकते हैं या ऑन-स्क्रीन कीपैड को टैप/क्लिक कर सकते हैं।",
          "तुम्ही लॅपटॉप नंबर की (0-9) वापरू शकता किंवा ऑन-स्क्रीन कीपॅडवर टॅप/क्लिक करू शकता."
        )}
        onStart={startTask}
      />
    );
  }

  if (phase === "presentation") {
    return (
      <div className="task-view-container">
        <TaskHUD
          title={t("Digit Span", "ডিজিট স্প্যান", "डिजिट स्पैन", "डिजिट स्पॅन")}
          icon="🔢"
          category={t("Working Memory", "স্মৃতিশক্তি", "कार्यशील स्मृति", "कार्यशील स्मरणशक्ती")}
          currentTrial={spanLength}
          totalTrials={MAX_SPAN}
          customProgressLabel={t(`Span: ${spanLength} digits`, `দৈর্ঘ্য: ${spanLength} টি সংখ্যা`, `लंबाई: ${spanLength} अंक`, `लांबी: ${spanLength} अंक`)}
          language={state.language}
        />
        <div className="task-stimulus" style={{ flexDirection: "column", gap: 16 }}>
          {activeDigit !== null ? (
            <div className="stimulus-animate" style={{ textAlign: "center" }}>
              <div style={{
                fontSize: "clamp(5rem, 15vw, 9rem)",
                fontWeight: 900,
                color: "var(--accent-color, #2563EB)",
                lineHeight: 1,
                textShadow: "0 4px 20px rgba(37, 99, 235, 0.2)"
              }}>
                {activeDigit}
              </div>
              <div style={{ marginTop: 12, fontSize: 14, color: "var(--text-secondary)", fontWeight: 600 }}>
                {t("Memorize the number...", "সংখ্যাটি মনে রাখুন...", "संख्या याद रखें...", "संख्या लक्षात ठेवा...")}
              </div>
            </div>
          ) : (
            <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#CBD5E1" }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "recall") {
    return (
      <div className="task-view-container">
        <TaskHUD
          title={t("Digit Span", "ডিজিট স্প্যান", "डिजिट स्पैन", "डिजिट स्पॅन")}
          icon="🔢"
          category={t("Working Memory", "স্মৃতিশক্তি", "कार्यशील स्मृति", "कार्यशील स्मरणशक्ती")}
          currentTrial={spanLength}
          totalTrials={MAX_SPAN}
          customProgressLabel={t(`Span: ${spanLength} digits`, `দৈর্ঘ্য: ${spanLength} টি সংখ্যা`, `लंबाई: ${spanLength} अंक`, `लांबी: ${spanLength} अंक`)}
          language={state.language}
        />

        <div className="task-stimulus" style={{ flexDirection: "column", padding: "16px 20px" }}>
          <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
              {t("What was the sequence?", "সংখ্যাগুলির ক্রম কী ছিল?", "संख्याओं का क्रम क्या था?", "संख्यांचा क्रम काय होता?")}
            </div>
            
            {/* Visual Slots Display */}
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              gap: 8, 
              margin: "12px 0 20px 0",
              flexWrap: "wrap"
            }}>
              {Array.from({ length: spanLength }).map((_, idx) => {
                const filled = userSequence[idx] !== undefined;
                const isCurrent = idx === userSequence.length;
                return (
                  <div
                    key={idx}
                    style={{
                      width: 44,
                      height: 52,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.8rem",
                      fontWeight: 800,
                      background: filled ? "var(--accent-color, #2563EB)" : isCurrent ? "#EFF6FF" : "#F8FAFC",
                      color: filled ? "#FFFFFF" : "#64748B",
                      border: isCurrent ? "2px solid #3B82F6" : filled ? "2px solid #1D4ED8" : "2px dashed #CBD5E1",
                      boxShadow: filled ? "0 2px 8px rgba(37, 99, 235, 0.25)" : "none",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {filled ? userSequence[idx] : isCurrent ? "•" : ""}
                  </div>
                );
              })}
            </div>

            {/* Modern Keypad */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => handleDigitClick(num)}
                  style={{
                    padding: "16px 0",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    borderRadius: "12px",
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                    transition: "transform 0.1s, box-shadow 0.1s",
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                  onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                onClick={() => handleDigitClick(0)}
                style={{
                  padding: "16px 0",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  borderRadius: "12px",
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                  transition: "transform 0.1s, box-shadow 0.1s",
                }}
                onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
              >
                0
              </button>
              <div />
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
