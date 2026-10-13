"use client";

import React from "react";
import Link from "next/link";
import { useAppContext } from "./AppContext";
import FinalScreen from "./FinalScreen";
import { QUESTIONNAIRES, QuestionnaireDef } from "@/config/questionnaires";

type Lang = "en" | "bn" | "hi" | "mr";
type L10n = { en: string; bn: string; hi: string; mr: string };

type QuestMeta = {
  icon: string;
  nickname: L10n;
  category: L10n;
  accentColor: string;
  bgLight: string;
};

/** Visual + playful metadata for each questionnaire, keyed by questionnaire id. */
const QUEST_META: Record<string, QuestMeta> = {
  cfs: {
    icon: "🔀",
    nickname: { en: "Mind Bender", bn: "মাইন্ড বেন্ডার", hi: "माइंड बेंडर", mr: "माइंड बेंडर" },
    category: { en: "Cognitive Flexibility", bn: "চিন্তার নমনীয়তা", hi: "संज्ञानात्मक लचीलापन", mr: "संज्ञानात्मक लवचिकता" },
    accentColor: "#2563EB",
    bgLight: "#EFF6FF",
  },
  gaene: {
    icon: "🧬",
    nickname: { en: "Evolution Explorer", bn: "বিবর্তন অভিযাত্রী", hi: "विकास खोजी", mr: "उत्क्रांती शोधक" },
    category: { en: "Science Attitudes", bn: "বিজ্ঞান মনোভাব", hi: "वैज्ञानिक दृष्टिकोण", mr: "वैज्ञानिक दृष्टिकोन" },
    accentColor: "#059669",
    bgLight: "#ECFDF5",
  },
  mate: {
    icon: "🦕",
    nickname: { en: "Origins Quest", bn: "উৎপত্তির খোঁজ", hi: "उत्पत्ति की खोज", mr: "उत्पत्तीचा शोध" },
    category: { en: "Science Attitudes", bn: "বিজ্ঞান মনোভাব", hi: "वैज्ञानिक दृष्टिकोण", mr: "वैज्ञानिक दृष्टिकोन" },
    accentColor: "#65A30D",
    bgLight: "#F7FEE7",
  },
  sbs: {
    icon: "🔮",
    nickname: { en: "Beyond the Veil", bn: "অদৃশ্যের ওপারে", hi: "परदे के पार", mr: "पडद्यापलीकडे" },
    category: { en: "Beliefs", bn: "বিশ্বাস", hi: "मान्यताएँ", mr: "श्रद्धा" },
    accentColor: "#7C3AED",
    bgLight: "#F5F3FF",
  },
  skep: {
    icon: "📺",
    nickname: { en: "Ad Detective", bn: "বিজ্ঞাপন গোয়েন্দা", hi: "विज्ञापन जासूस", mr: "जाहिरात गुप्तहेर" },
    category: { en: "Critical Thinking", bn: "সমালোচনামূলক চিন্তা", hi: "आलोचनात्मक सोच", mr: "चिकित्सक विचार" },
    accentColor: "#D97706",
    bgLight: "#FFFBEB",
  },
  tsis: {
    icon: "🤝",
    nickname: { en: "Social Radar", bn: "সামাজিক রাডার", hi: "सोशल रडार", mr: "सामाजिक रडार" },
    category: { en: "Social Intelligence", bn: "সামাজিক বুদ্ধিমত্তা", hi: "सामाजिक बुद्धिमत्ता", mr: "सामाजिक बुद्धिमत्ता" },
    accentColor: "#0891B2",
    bgLight: "#ECFEFF",
  },
  ncs6: {
    icon: "💭",
    nickname: { en: "Thinker's Drive", bn: "চিন্তকের তাগিদ", hi: "विचारक की ललक", mr: "विचारवंताची ओढ" },
    category: { en: "Thinking Style", bn: "চিন্তার ধরন", hi: "सोचने की शैली", mr: "विचारशैली" },
    accentColor: "#4F46E5",
    bgLight: "#EEF2FF",
  },
  cfq: {
    icon: "🧩",
    nickname: { en: "Slip-Up Tracker", bn: "ভুলচুক ট্র্যাকার", hi: "भूल-चूक ट्रैकर", mr: "चूक-भूल ट्रॅकर" },
    category: { en: "Everyday Memory", bn: "দৈনন্দিন স্মৃতি", hi: "रोज़मर्रा की स्मृति", mr: "दैनंदिन स्मृती" },
    accentColor: "#DB2777",
    bgLight: "#FDF2F8",
  },
  dass21: {
    icon: "🌦️",
    nickname: { en: "Mood Weather", bn: "মনের আবহাওয়া", hi: "मन का मौसम", mr: "मनाचे हवामान" },
    category: { en: "Emotional Health", bn: "মানসিক স্বাস্থ্য", hi: "भावनात्मक स्वास्थ्य", mr: "भावनिक आरोग्य" },
    accentColor: "#475569",
    bgLight: "#F1F5F9",
  },
  phq9: {
    icon: "🌱",
    nickname: { en: "Mood Check-In", bn: "মুড চেক-ইন", hi: "मूड चेक-इन", mr: "मूड चेक-इन" },
    category: { en: "Emotional Health", bn: "মানসিক স্বাস্থ্য", hi: "भावनात्मक स्वास्थ्य", mr: "भावनिक आरोग्य" },
    accentColor: "#16A34A",
    bgLight: "#F0FDF4",
  },
  gad7: {
    icon: "🌊",
    nickname: { en: "Calm Meter", bn: "শান্তি মিটার", hi: "शांति मीटर", mr: "शांतता मीटर" },
    category: { en: "Anxiety Check", bn: "উদ্বেগ পরীক্ষা", hi: "चिंता जाँच", mr: "चिंता तपासणी" },
    accentColor: "#0284C7",
    bgLight: "#F0F9FF",
  },
  who5: {
    icon: "☀️",
    nickname: { en: "Sunshine Index", bn: "রোদ্দুর সূচক", hi: "सनशाइन इंडेक्स", mr: "सूर्यप्रकाश निर्देशांक" },
    category: { en: "Well-Being", bn: "সুস্থতা", hi: "कल्याण", mr: "आरोग्य व समाधान" },
    accentColor: "#EA580C",
    bgLight: "#FFF7ED",
  },
};

const FALLBACK_META: QuestMeta = {
  icon: "📋",
  nickname: { en: "Self-Discovery", bn: "আত্ম-আবিষ্কার", hi: "आत्म-खोज", mr: "आत्मशोध" },
  category: { en: "Questionnaire", bn: "প্রশ্নাবলী", hi: "प्रश्नावली", mr: "प्रश्नावली" },
  accentColor: "#7C3AED",
  bgLight: "#F5F3FF",
};

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
const DEVANAGARI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

/** Matches the Cognitive Hub convention: Bengali/Marathi digits localized, Hindi uses Western digits. */
function localizeNum(n: number, lang: Lang): string {
  const s = String(n);
  if (lang === "bn") return s.replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
  if (lang === "mr") return s.replace(/\d/g, (d) => DEVANAGARI_DIGITS[Number(d)]);
  return s;
}

export default function QuestionnaireHub({ onSelect }: { onSelect: (id: string) => void }) {
  const { state, resetSession } = useAppContext();
  const lang = state.language as Lang;

  const t = (en: string, bn: string, hi: string, mr: string) => {
    if (lang === "bn") return bn;
    if (lang === "hi") return hi;
    if (lang === "mr") return mr;
    return en;
  };

  const l = (v: L10n) => v[lang] || v.en;

  const getTitle = (q: QuestionnaireDef) => {
    if (lang === "bn" && q.title_bn) return q.title_bn;
    if (lang === "hi" && q.title_hi) return q.title_hi;
    if (lang === "mr" && q.title_mr) return q.title_mr;
    return q.title;
  };

  // ~10s per item, rounded up to whole minutes
  const estMinutes = (q: QuestionnaireDef) => Math.max(1, Math.ceil((q.items.length * 10) / 60));

  const total = QUESTIONNAIRES.length;
  const completedCount = QUESTIONNAIRES.filter((q) => state.completedTests.includes(q.id)).length;
  const allCompleted = completedCount === total;
  const progressPercent = Math.round((completedCount / total) * 100);
  const nextUpId = QUESTIONNAIRES.find((q) => !state.completedTests.includes(q.id))?.id;

  let rankBadge = t("Newcomer 🌱", "নবাগত 🌱", "नवागंतुक 🌱", "नवखा 🌱");
  if (allCompleted) {
    rankBadge = t("Enlightened Sage 🏆", "জ্ঞানী ঋষি 🏆", "ज्ञानी ऋषि 🏆", "ज्ञानी ऋषी 🏆");
  } else if (completedCount >= 8) {
    rankBadge = t("Mind Explorer 🧭", "মনের অভিযাত্রী 🧭", "मन के खोजी 🧭", "मनाचा शोधक 🧭");
  } else if (completedCount >= 4) {
    rankBadge = t("Self-Aware Owl 🦉", "আত্মসচেতন পেঁচা 🦉", "आत्म-जागरूक उल्लू 🦉", "आत्मजागरूक घुबड 🦉");
  } else if (completedCount >= 1) {
    rankBadge = t("Insight Seeker 🔍", "অন্তর্দৃষ্টি সন্ধানী 🔍", "अंतर्दृष्टि खोजी 🔍", "अंतर्दृष्टी शोधक 🔍");
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", paddingBottom: 40 }}>
      {/* Hero Header Card */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          padding: "24px 28px",
          borderRadius: 16,
          background: "linear-gradient(135deg, #5B21B6 0%, #7C3AED 50%, #C026D3 100%)",
          color: "#FFFFFF",
          boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.4)",
          border: "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "#FFFFFF",
                  padding: "3px 10px",
                  borderRadius: 12,
                  backdropFilter: "blur(4px)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                📓 {t("MIND JOURNAL", "মাইন্ড জার্নাল", "माइंड जर्नल", "माइंड जर्नल")}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  backgroundColor: "#FBCFE8",
                  color: "#831843",
                  padding: "3px 10px",
                  borderRadius: 12,
                }}
              >
                {rankBadge}
              </span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, margin: "4px 0", color: "#FFFFFF", letterSpacing: -0.5 }}>
              {t("Self-Discovery Hub", "আত্ম-আবিষ্কার হাব", "आत्म-खोज हब", "आत्मशोध केंद्र")}
            </h1>

            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
              {t("Student", "অংশগ্রহণকারী", "प्रतिभागी", "सहभागी")}: <strong style={{ color: "#FFFFFF" }}>{state.participantName}</strong>
              {state.username && <span style={{ marginLeft: 6 }}>@{state.username}</span>}
              {state.participantIdNumber && <span style={{ marginLeft: 6 }}>• ID: {state.participantIdNumber}</span>}
            </p>
          </div>

          <button
            onClick={resetSession}
            style={{
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 700,
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              border: "1px solid rgba(255, 255, 255, 0.35)",
              borderRadius: 8,
              cursor: "pointer",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "background 0.15s ease",
            }}
            title="Log out or switch participant"
          >
            <span>🚪</span> {t("Sign Out", "লগ আউট", "लॉग आउट", "बाहेर पडा")}
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
            <span>{t("Your Journey Progress", "আপনার যাত্রার অগ্রগতি", "आपकी यात्रा की प्रगति", "तुमच्या प्रवासाची प्रगती")}</span>
            <span style={{ color: "#FBCFE8" }}>
              {localizeNum(completedCount, lang)} / {localizeNum(total, lang)} {t("Completed", "সম্পন্ন", "पूर्ण", "पूर्ण")} ({localizeNum(progressPercent, lang)}%)
            </span>
          </div>
          <div style={{ width: "100%", height: 10, backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 6, overflow: "hidden" }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                background: "linear-gradient(90deg, #F0ABFC, #F472B6, #FDE68A)",
                borderRadius: 6,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </div>

      {allCompleted && (
        <div style={{ marginBottom: 28 }}>
          <FinalScreen type="questionnaires" />
        </div>
      )}

      {/* Grid of Questionnaire Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 16,
        }}
      >
        {QUESTIONNAIRES.map((q) => {
          const meta = QUEST_META[q.id] ?? FALLBACK_META;
          const isCompleted = state.completedTests.includes(q.id);
          const isNextUp = q.id === nextUpId;
          const restShadow = isCompleted
            ? "0 4px 12px rgba(16, 185, 129, 0.08)"
            : isNextUp
            ? `0 6px 16px ${meta.accentColor}26`
            : "0 2px 8px rgba(0, 0, 0, 0.03)";

          return (
            <div
              key={q.id}
              id={`questionnaire-card-${q.id}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(q.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(q.id);
                }
              }}
              className="card"
              style={{
                padding: "20px 18px",
                borderRadius: 14,
                border: isCompleted
                  ? "2px solid #A7F3D0"
                  : isNextUp
                  ? `2px solid ${meta.accentColor}66`
                  : "1px solid #E2E8F0",
                backgroundColor: isCompleted ? "#F0FDF4" : "#FFFFFF",
                boxShadow: restShadow,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = restShadow;
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: meta.bgLight,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      boxShadow: `0 2px 6px ${meta.accentColor}20`,
                    }}
                  >
                    {meta.icon}
                  </div>
                  {isCompleted ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 800,
                        backgroundColor: "#DCFCE7",
                        color: "#166534",
                        padding: "3px 8px",
                        borderRadius: 10,
                        border: "1px solid #86EFAC",
                      }}
                    >
                      ✓ {t("Done", "সম্পন্ন", "पूर्ण", "पूर्ण")}
                    </span>
                  ) : isNextUp ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        backgroundColor: meta.accentColor,
                        color: "#FFFFFF",
                        padding: "3px 8px",
                        borderRadius: 10,
                        boxShadow: `0 2px 6px ${meta.accentColor}55`,
                      }}
                    >
                      ⭐ {t("Next Up", "পরবর্তী", "अगला", "पुढील")}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: "#F1F5F9",
                        color: "#475569",
                        padding: "2px 7px",
                        borderRadius: 10,
                      }}
                    >
                      {localizeNum(q.items.length, lang)} {t("Qs", "প্রশ্ন", "प्रश्न", "प्रश्न")}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 2px 0", color: "#0F172A", lineHeight: 1.3 }}>
                  {getTitle(q)}
                </h3>
                <div style={{ fontSize: 12, fontWeight: 700, color: meta.accentColor, marginBottom: 8 }}>
                  ✨ {l(meta.nickname)}
                </div>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>{l(meta.category)}</div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: "1px solid #F1F5F9",
                  fontSize: 12,
                  color: "#64748B",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>📝 {localizeNum(q.items.length, lang)}</span>
                  <span>⏱ ~{localizeNum(estMinutes(q), lang)} {t("min", "মিনিট", "मिनट", "मिनिटे")}</span>
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: isCompleted ? "#059669" : "#6D28D9",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  {isCompleted
                    ? t("Retake ▶", "আবার দিন ▶", "दोबारा दें ▶", "पुन्हा द्या ▶")
                    : t("Start ▶", "শুরু করুন ▶", "शुरू करें ▶", "सुरू करा ▶")}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cognitive Hub Quick Link Banner */}
      <div
        className="card"
        style={{
          marginTop: 36,
          padding: "20px 24px",
          borderRadius: 14,
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
        }}
      >
        <div>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0F172A" }}>
            {t("🎮 Ready for brain games?", "🎮 ব্রেন গেমের জন্য প্রস্তুত?", "🎮 ब्रेन गेम्स के लिए तैयार?", "🎮 ब्रेन गेम्ससाठी तयार?")}
          </h4>
          <p style={{ margin: "3px 0 0 0", fontSize: 13, color: "#64748B" }}>
            {t(
              "Play the 9 cognitive challenges in the Brain Quest hub.",
              "ব্রেন কোয়েস্ট হাবে ৯টি কগনিটিভ চ্যালেঞ্জ খেলুন।",
              "ब्रेन क्वेस्ट हब में 9 संज्ञानात्मक चुनौतियाँ खेलें।",
              "ब्रेन क्वेस्ट केंद्रात ९ संज्ञानात्मक आव्हाने खेळा."
            )}
          </p>
        </div>
        <Link href="/" style={{ textDecoration: "none" }}>
          <button
            className="btn btn-outline"
            style={{
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <span>{t("Go to Cognitive Hub", "কগনিটিভ হাবে যান", "संज्ञानात्मक हब पर जाएं", "संज्ञानात्मक हबकडे जा")}</span>
            <span>➔</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
