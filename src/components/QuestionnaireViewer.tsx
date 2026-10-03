"use client";

import React, { useState, useMemo } from "react";
import { QuestionnaireDef } from "@/config/questionnaires";
import { useAppContext } from "./AppContext";
import { fetchWithOfflineSync } from "@/utils/offlineSync";
import { shuffle } from "@/utils/trials";
import SeverityFeedback from "./SeverityFeedback";

export default function QuestionnaireViewer({ questionnaire, onComplete }: { questionnaire: QuestionnaireDef, onComplete: () => void }) {
  const { state } = useAppContext();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<"filling" | "completed">("filling");
  const [calculatedScores, setCalculatedScores] = useState<any>(null);
  // Answers are only on this device so far (queued while offline).
  const [queuedOffline, setQueuedOffline] = useState(false);

  // `orderType: "random"` was declared on CFS and CFQ but never implemented —
  // items always rendered in declaration order, reintroducing the order effect
  // the config was written to avoid. Shuffled once per mount so answering does
  // not reorder the list under the participant.
  const displayItems = useMemo(
    () => (questionnaire.orderType === "random" ? shuffle(questionnaire.items) : questionnaire.items),
    [questionnaire]
  );

  const isComplete = questionnaire.items.every(q => answers[q.id] !== undefined);

  const handleSubmit = async () => {
    setSubmitting(true);
    setPhase("completed");
    try {
      // Calculate score based on questionnaire.scoringType
      let score: number | undefined;
      let scoreSp: number | undefined;
      let scoreSk: number | undefined;
      let scoreSa: number | undefined;
      let scoreDepression: number | undefined;
      let scoreAnxiety: number | undefined;
      let scoreStress: number | undefined;
      // Convert answers considering reverse scoring
      const processedScores: Record<string, number> = {};
      questionnaire.items.forEach(q => {
        let val = answers[q.id];
        if (q.isReverse) {
           val = (questionnaire.scaleMax + questionnaire.scaleMin) - val;
        }
        processedScores[q.id] = val;
      });

      const vals = Object.values(processedScores);

      if (questionnaire.scoringType === "sum") {
        score = vals.reduce((acc, v) => acc + v, 0);
      } else if (questionnaire.scoringType === "mean") {
        score = vals.reduce((acc, v) => acc + v, 0) / vals.length;
      } else if (questionnaire.scoringType === "tsis_subscales") {
        const spIds = ["q1", "q3", "q6", "q9", "q14", "q17", "q19"];
        const skIds = ["q4", "q7", "q10", "q12", "q15", "q18", "q20"];
        const saIds = ["q2", "q5", "q8", "q11", "q13", "q16", "q21"];
        scoreSp = spIds.reduce((acc, id) => acc + (processedScores[id] || 0), 0);
        scoreSk = skIds.reduce((acc, id) => acc + (processedScores[id] || 0), 0);
        scoreSa = saIds.reduce((acc, id) => acc + (processedScores[id] || 0), 0);
      } else if (questionnaire.scoringType === "dass21_subscales") {
        const depIds = ["q3", "q5", "q10", "q13", "q16", "q17", "q21"];
        const anxIds = ["q2", "q4", "q7", "q9", "q15", "q19", "q20"];
        const stressIds = ["q1", "q6", "q8", "q11", "q12", "q14", "q18"];
        // DASS-21 subscores are typically multiplied by 2 to map to full DASS-42
        scoreDepression = depIds.reduce((acc, id) => acc + (processedScores[id] || 0), 0) * 2;
        scoreAnxiety = anxIds.reduce((acc, id) => acc + (processedScores[id] || 0), 0) * 2;
        scoreStress = stressIds.reduce((acc, id) => acc + (processedScores[id] || 0), 0) * 2;
      }

      setCalculatedScores({ score, scoreDepression, scoreAnxiety, scoreStress, scoreSp, scoreSk, scoreSa });

      const res = await fetchWithOfflineSync("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          testId: questionnaire.id,
          rawScores: answers,
          score,
          scoreSp,
          scoreSk,
          scoreSa,
          scoreDepression,
          scoreAnxiety,
          scoreStress
        })
      });

      const payload = await res.json().catch(() => ({} as any));
      if (!res.ok && !payload?.offline) {
        throw new Error(payload?.error || "Failed to submit");
      }
      setQueuedOffline(Boolean(payload?.offline));

    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to submit");
      setPhase("filling");
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

  const getLocalized = (obj: any, field: string) => {
    if (state.language === "bn" && obj[`${field}_bn`]) return obj[`${field}_bn`];
    if (state.language === "hi" && obj[`${field}_hi`]) return obj[`${field}_hi`];
    if (state.language === "mr" && obj[`${field}_mr`]) return obj[`${field}_mr`];
    return obj[field];
  };

  if (phase === "completed") {
    return (
      <div className="card" style={{ maxWidth: 600, margin: "auto", textAlign: "center" }}>
        <h2>{t("Questionnaire Completed!", "প্রশ্নাবলী সম্পন্ন হয়েছে!", "प्रश्नावली पूरी हुई!", "प्रश्नावली पूर्ण झाली!")}</h2>

            {calculatedScores && (
              <div style={{ textAlign: "left", background: "#F9FAFB", padding: "20px", borderRadius: "12px", border: "1px solid var(--card-border)", marginBottom: 24 }}>
                <h3 style={{ marginTop: 0, marginBottom: 16, borderBottom: "1px solid #eaeaea", paddingBottom: 12 }}>
                  {t("Results Overview", "ফলাফল সংক্ষেপ", "परिणाम सारांश", "निकाल सारांश")}
                </h3>
                <SeverityFeedback questionnaireId={questionnaire.id} calculatedScores={calculatedScores} />
              </div>
            )}

            {submitting ? (
              <p style={{ color: "var(--accent-color)", fontWeight: "bold" }}>
                {t("Uploading data... please wait.", "ডেটা আপলোড করা হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন।", "डेटा अपलोड हो रहा है... कृपया प्रतीक्षा करें।", "डेटा अपलोड होत आहे... कृपया प्रतीक्षा करा.")}
              </p>
            ) : (
              <div>
                {queuedOffline ? (
                  <p style={{ color: "#B45309", fontWeight: "bold", marginBottom: 24 }}>
                    {t(
                      "Saved on this device. It will upload automatically when you are back online.",
                      "এই ডিভাইসে সংরক্ষিত হয়েছে। ইন্টারনেট সংযোগ ফিরে এলে আপলোড হবে।",
                      "इस डिवाइस पर सहेजा गया। ऑनलाइन होने पर अपने आप अपलोड होगा।",
                      "या डिव्हाइसवर सेव्ह केले. ऑनलाइन झाल्यावर आपोआप अपलोड होईल."
                    )}
                  </p>
                ) : (
                  <p style={{ color: "var(--success-color)", fontWeight: "bold", marginBottom: 24 }}>
                    {t("Successfully saved!", "সফলভাবে সংরক্ষিত হয়েছে!", "सफलतापूर्वक सहेजा गया!", "यशस्वीरित्या जतन झाले!")}
                  </p>
                )}
                <button className="btn" onClick={onComplete} style={{ width: "100%" }}>
                  {t("Return to Hub", "ফিরে যান", "हब पर वापस जाएं", "हबवर परत जा")}
                </button>
              </div>
            )}
      </div>
    );
  }

  const title = getLocalized(questionnaire, "title");
  const description = getLocalized(questionnaire, "description");

  return (
    <div className="card" style={{ maxWidth: 800, margin: "auto" }}>
      <h2>{title}</h2>
      <p style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: "0.9rem" }}>{description}</p>
      
      <div style={{ marginTop: 24 }}>
        {displayItems.map((item, index) => (
          <div key={item.id} style={{ marginBottom: 24, padding: 20, background: "#F9FAFB", borderRadius: 8, border: "1px solid var(--card-border)" }}>
            <p style={{ marginBottom: 16, color: "var(--text-primary)", fontWeight: 500 }}>
              <strong>{index + 1}.</strong> {getLocalized(item, "text")}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {questionnaire.scale.map(s => {
                const isSelected = answers[item.id] === s.value;
                const label = getLocalized(s, "label");
                return (
                  <button
                    key={s.value}
                    onClick={() => setAnswers({ ...answers, [item.id]: s.value })}
                    style={{
                      padding: "8px 16px",
                      background: isSelected ? "var(--accent-color)" : "#FFFFFF",
                      border: isSelected ? "1px solid var(--accent-color)" : "1px solid var(--card-border)",
                      borderRadius: 6,
                      color: isSelected ? "white" : "var(--text-primary)",
                      cursor: "pointer",
                      transition: "background 150ms, color 150ms",
                      boxShadow: isSelected ? "none" : "0 1px 2px rgba(0,0,0,0.05)"
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button 
        className="btn" 
        disabled={!isComplete || submitting} 
        onClick={handleSubmit}
        style={{ marginTop: 24, width: "100%", opacity: isComplete ? 1 : 0.5 }}
      >
        {submitting 
          ? t("Submitting...", "জমা দেওয়া হচ্ছে...", "सबमिट हो रहा है...", "सबमिट होत आहे...")
          : t("Submit Answers", "উত্তর জমা দিন", "उत्तर सबमिट करें", "उत्तरे सबमिट करा")}
      </button>
    </div>
  );
}
