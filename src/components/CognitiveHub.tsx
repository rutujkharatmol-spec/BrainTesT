"use client";

import React from "react";
import Link from "next/link";
import { useAppContext } from "./AppContext";
import FinalScreen from "./FinalScreen";

type TestMeta = {
  path: string;
  name: string;
  name_bn: string;
  name_hi: string;
  name_mr: string;
  nickname: string;
  nickname_bn: string;
  nickname_hi: string;
  nickname_mr: string;
  icon: string;
  category: string;
  category_bn: string;
  category_hi: string;
  category_mr: string;
  trials: string;
  trials_bn: string;
  trials_hi: string;
  trials_mr: string;
  time: string;
  time_bn: string;
  time_hi: string;
  time_mr: string;
  accentColor: string;
  bgLight: string;
};

const TESTS: TestMeta[] = [
  {
    path: "/cognitive/stroop",
    name: "Stroop Task",
    name_bn: "স্ট্রুপ টাস্ক",
    name_hi: "स्ट्रूप टास्क",
    name_mr: "स्ट्रूप चाचणी",
    nickname: "Color Clash",
    nickname_bn: "কালার ক্ল্যাশ",
    nickname_hi: "कलर क्लैश",
    nickname_mr: "रंग संघर्ष",
    icon: "🎯",
    category: "Executive Function",
    category_bn: "এক্সিকিউটিভ ফাংশন",
    category_hi: "एग्जीक्यूटिव फंक्शन",
    category_mr: "कार्यकारी कार्य",
    trials: "20 trials",
    trials_bn: "২০টি ট্রায়াল",
    trials_hi: "20 ट्रायल्स",
    trials_mr: "२० ट्रायल्स",
    time: "~2 min",
    time_bn: "~২ মিনিট",
    time_hi: "~2 मिनट",
    time_mr: "~२ मिनिटे",
    accentColor: "#2563EB",
    bgLight: "#EFF6FF",
  },
  {
    path: "/cognitive/nback",
    name: "N-Back Task (2-Back)",
    name_bn: "এন-ব্যাক টাস্ক",
    name_hi: "एन-बैक टास्क (2-Back)",
    name_mr: "एन-बॅक चाचणी (2-Back)",
    nickname: "Memory Echo",
    nickname_bn: "স্মৃতি প্রতিধ্বনি",
    nickname_hi: "मेमोरी इको",
    nickname_mr: "स्मृती प्रतिध्वनी",
    icon: "🧠",
    category: "Working Memory",
    category_bn: "স্মৃতিশক্তি",
    category_hi: "वर्किंग मेमोरी",
    category_mr: "कार्यरत स्मृती",
    trials: "30 trials",
    trials_bn: "৩০টি ট্রায়াল",
    trials_hi: "30 ट्रायल्स",
    trials_mr: "३० ट्रायल्स",
    time: "~2 min",
    time_bn: "~২ মিনিট",
    time_hi: "~2 मिनट",
    time_mr: "~२ मिनिटे",
    accentColor: "#D97706",
    bgLight: "#FFFBEB",
  },
  {
    path: "/cognitive/corsi",
    name: "Corsi Block Task",
    name_bn: "কোর্সি ব্লক টাস্ক",
    name_hi: "कॉर्सी ब्लॉक टास्क",
    name_mr: "कॉर्सी ब्लॉक चाचणी",
    nickname: "Tile Hopper",
    nickname_bn: "টাইল হপার",
    nickname_hi: "टाइल हॉपर",
    nickname_mr: "टाइल हॉपर",
    icon: "🧱",
    category: "Spatial Memory",
    category_bn: "স্থানিক স্মৃতি",
    category_hi: "स्थानिक स्मृति",
    category_mr: "स्थानिक स्मृती",
    trials: "Adaptive",
    trials_bn: "অ্যাডাপ্টিভ",
    trials_hi: "अनुकूली",
    trials_mr: "अनुकूली",
    time: "~3 min",
    time_bn: "~৩ মিনিট",
    time_hi: "~3 मिनट",
    time_mr: "~३ मिनिटे",
    accentColor: "#7C3AED",
    bgLight: "#F5F3FF",
  },
  {
    path: "/cognitive/digitspan",
    name: "Digit Span Task",
    name_bn: "ডিজিট স্প্যান টাস্ক",
    name_hi: "डिजिट स्पैन टास्क",
    name_mr: "अंक स्मृती चाचणी",
    nickname: "Number Chain",
    nickname_bn: "নম্বর চেইন",
    nickname_hi: "नंबर चेन",
    nickname_mr: "क्रमांक साखळी",
    icon: "🔢",
    category: "Verbal Memory",
    category_bn: "মৌখিক স্মৃতি",
    category_hi: "मौखिक स्मृति",
    category_mr: "मौखिक स्मृती",
    trials: "Adaptive",
    trials_bn: "অ্যাডাপ্টিভ",
    trials_hi: "अनुकूली",
    trials_mr: "अनुकूली",
    time: "~3 min",
    time_bn: "~৩ মিনিট",
    time_hi: "~3 मिनट",
    time_mr: "~३ मिनिटे",
    accentColor: "#0891B2",
    bgLight: "#ECFEFF",
  },
  {
    path: "/cognitive/sart",
    name: "SART",
    name_bn: "এস.এ.আর.টি",
    name_hi: "एस.ए.आर.टी",
    name_mr: "एस.ए.आर.टी",
    nickname: "Speed Reflex",
    nickname_bn: "স্পিড রিফ্লেক্স",
    nickname_hi: "स्पीड रिफ्लेक्स",
    nickname_mr: "स्पीड रिफ्लेक्स",
    icon: "⏱️",
    category: "Sustained Attention",
    category_bn: "মনোযোগ নিয়ন্ত্রণ",
    category_hi: "सतत एकाग्रता",
    category_mr: "सातत्यपूर्ण एकाग्रता",
    trials: "50 trials",
    trials_bn: "৫০টি ট্রায়াল",
    trials_hi: "50 ट्रायल्स",
    trials_mr: "५० ट्रायल्स",
    time: "~1.5 min",
    time_bn: "~১.৫ মিনিট",
    time_hi: "~1.5 मिनट",
    time_mr: "~१.५ मिनिटे",
    accentColor: "#059669",
    bgLight: "#ECFDF5",
  },
  {
    path: "/cognitive/dotprobe",
    name: "Dot Probe Task",
    name_bn: "ডট প্রোব টাস্ক",
    name_hi: "डॉट प्रोब टास्क",
    name_mr: "डॉट प्रोब चाचणी",
    nickname: "Target Hunter",
    nickname_bn: "টার্গেট হান্টার",
    nickname_hi: "टारगेट हंटर",
    nickname_mr: "टार्गेट हंटर",
    icon: "🔴",
    category: "Attentional Bias",
    category_bn: "মনোযোগ লক্ষ্য",
    category_hi: "अटेंशन बायस",
    category_mr: "अटेंशन बायस",
    trials: "40 trials",
    trials_bn: "৪০টি ট্রায়াল",
    trials_hi: "40 ट्रायल्स",
    trials_mr: "४० ट्रायल्स",
    time: "~2 min",
    time_bn: "~২ মিনিট",
    time_hi: "~2 मिनट",
    time_mr: "~२ मिनिटे",
    accentColor: "#DC2626",
    bgLight: "#FEF2F2",
  },
  {
    path: "/cognitive/flanker",
    name: "Eriksen Flanker",
    name_bn: "এরিকসেন ফ্ল্যাঙ্কার",
    name_hi: "एरिकसन फ्लैंकर",
    name_mr: "एरिकसन फ्लँकर",
    nickname: "Arrow Archer",
    nickname_bn: "তীরন্দাজ লক্ষ্য",
    nickname_hi: "तीरंदाज लक्ष्य",
    nickname_mr: "धनुर्धारी बाण",
    icon: "🏹",
    category: "Focus & Inhibition",
    category_bn: "ফোকাস নিয়ন্ত্রণ",
    category_hi: "फोकस व नियंत्रण",
    category_mr: "एकाग्रता व नियंत्रण",
    trials: "40 trials",
    trials_bn: "৪০টি ট্রায়াল",
    trials_hi: "40 ट्रायल्स",
    trials_mr: "४० ट्रायल्स",
    time: "~2 min",
    time_bn: "~২ মিনিট",
    time_hi: "~2 मिनट",
    time_mr: "~२ मिनिटे",
    accentColor: "#65A30D",
    bgLight: "#F7FEE7",
  },
  {
    path: "/cognitive/ldt",
    name: "Lexical Decision",
    name_bn: "লেক্সিক্যাল ডিসিশন",
    name_hi: "लेक्सिकल डिसीजन",
    name_mr: "शब्द निर्णय चाचणी",
    nickname: "Word Detective",
    nickname_bn: "শব্দ গোয়েন্দা",
    nickname_hi: "वर्ड डिटेक्टिव",
    nickname_mr: "शब्द शोधक",
    icon: "📖",
    category: "Language Speed",
    category_bn: "শব্দ জ্ঞান",
    category_hi: "भाषा गति",
    category_mr: "भाषा गती",
    trials: "40 trials",
    trials_bn: "৪০টি ট্রায়াল",
    trials_hi: "40 ट्रायल्स",
    trials_mr: "४० ट्रायल्स",
    time: "~2 min",
    time_bn: "~২ মিনিট",
    time_hi: "~2 मिनट",
    time_mr: "~२ मिनिटे",
    accentColor: "#475569",
    bgLight: "#F1F5F9",
  },
  {
    path: "/cognitive/negative-priming",
    name: "Negative Priming",
    name_bn: "নেগেটিভ প্রাইমিং",
    name_hi: "नेगेटिव प्राइमिंग",
    name_mr: "निगेटिव्ह प्राइमिंग",
    nickname: "Flash Focus",
    nickname_bn: "ফ্ল্যাশ ফোকাস",
    nickname_hi: "फ्लैश फोकस",
    nickname_mr: "फ्लॅश फोकस",
    icon: "⚡",
    category: "Cognitive Agility",
    category_bn: "দ্রুত বিচার",
    category_hi: "संज्ञानात्मक चपलता",
    category_mr: "संज्ञानात्मक चपळता",
    trials: "40 trials",
    trials_bn: "৪০টি ট্রায়াল",
    trials_hi: "40 ट्रायल्स",
    trials_mr: "४० ट्रायल्स",
    time: "~2 min",
    time_bn: "~২ মিনিট",
    time_hi: "~2 मिनट",
    time_mr: "~२ मिनिटे",
    accentColor: "#DB2777",
    bgLight: "#FDF2F8",
  },
];

export default function CognitiveHub() {
  const { state, resetSession } = useAppContext();
  const lang = state.language;

  const t = (en: string, bn: string, hi: string, mr: string) => {
    if (lang === "bn") return bn;
    if (lang === "hi") return hi;
    if (lang === "mr") return mr;
    return en;
  };

  const getTestProp = (test: TestMeta, field: "name" | "nickname" | "category" | "trials" | "time"): string => {
    if (lang === "bn") return (test as any)[`${field}_bn`] || (test as any)[field];
    if (lang === "hi") return (test as any)[`${field}_hi`] || (test as any)[field];
    if (lang === "mr") return (test as any)[`${field}_mr`] || (test as any)[field];
    return (test as any)[field];
  };

  const completedCount = TESTS.filter((t) => state.completedTests.includes(t.path)).length;
  const allCompleted = completedCount === TESTS.length;
  const progressPercent = Math.round((completedCount / TESTS.length) * 100);

  // Student ranking based on tests completed
  let rankBadge = t("Explorer 🧭", "অভিযাত্রী (Explorer 🧭)", "खोजी (Explorer 🧭)", "संशोधक (Explorer 🧭)");
  if (completedCount >= 9) {
    rankBadge = t("Grandmaster 🏆", "মাস্টারমাইন্ড গ্র্যান্ডমাস্টার 🏆", "मास्टरमाइंड ग्रैंडमास्टर 🏆", "मास्टरमाइंड ग्रँडमास्टर 🏆");
  } else if (completedCount >= 6) {
    rankBadge = t("Cognitive Ninja ⚔️", "কগনিটিভ নিনজা ⚔️", "कोग्निटिव निंजा ⚔️", "कोग्निटिव्ह निन्जा ⚔️");
  } else if (completedCount >= 3) {
    rankBadge = t("Brain Scholar 💡", "ব্রেন স্কলার 💡", "ब्रेन विद्वान 💡", "ब्रेन स्कॉलर 💡");
  }

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", paddingBottom: 40 }}>
      {/* Hero "Brain Quest" Header Card */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          padding: "24px 28px",
          borderRadius: 16,
          background: "linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)",
          color: "#FFFFFF",
          boxShadow: "0 10px 25px -5px rgba(30, 64, 175, 0.35)",
          border: "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
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
                🎮 {t("BRAIN QUEST", "ব্রেন কোয়েস্ট প্ল্যাটফর্ম", "ब्रेन क्वेस्ट प्लेटफॉर्म", "ब्रेन क्वेस्ट प्लॅटफॉर्म")}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  backgroundColor: "#FEF08A",
                  color: "#854D0E",
                  padding: "3px 10px",
                  borderRadius: 12,
                }}
              >
                {rankBadge}
              </span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, margin: "4px 0", color: "#FFFFFF", letterSpacing: -0.5 }}>
              {t("Cognitive Challenge Hub", "স্নায়ুবৌদ্ধিক চ্যালেঞ্জ হাব", "संज्ञानात्मक चुनौती हब", "संज्ञानात्मक आव्हान केंद्र")}
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

        {/* Progress Bar Container */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
            <span>
              {t("Your Mission Progress", "আপনার সামগ্রিক অগ্রগতি", "आपकी कुल प्रगति", "तुमची एकूण प्रगती")}
            </span>
            <span style={{ color: "#FEF08A" }}>
              {completedCount} / {TESTS.length} {t("Completed", "সম্পন্ন", "पूर्ण", "पूर्ण")} ({progressPercent}%)
            </span>
          </div>
          <div style={{ width: "100%", height: 10, backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 6, overflow: "hidden" }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                background: "linear-gradient(90deg, #34D399, #10B981, #FEF08A)",
                borderRadius: 6,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </div>

      {allCompleted && (
        <div style={{ marginBottom: 28 }}>
          <FinalScreen />
        </div>
      )}

      {/* Grid of Gamified Challenges */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 16,
        }}
      >
        {TESTS.map((test) => {
          const isCompleted = state.completedTests.includes(test.path);

          return (
            <Link href={test.path} key={test.path} style={{ textDecoration: "none", color: "inherit" }}>
              <div
                className="card"
                style={{
                  padding: "20px 18px",
                  borderRadius: 14,
                  border: isCompleted ? "2px solid #A7F3D0" : "1px solid #E2E8F0",
                  backgroundColor: isCompleted ? "#F0FDF4" : "#FFFFFF",
                  boxShadow: isCompleted
                    ? "0 4px 12px rgba(16, 185, 129, 0.08)"
                    : "0 2px 8px rgba(0, 0, 0, 0.03)",
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
                  e.currentTarget.style.boxShadow = isCompleted
                    ? "0 4px 12px rgba(16, 185, 129, 0.08)"
                    : "0 2px 8px rgba(0, 0, 0, 0.03)";
                }}
              >
                {/* Header Icon + Nickname */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: test.bgLight,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        boxShadow: `0 2px 6px ${test.accentColor}20`,
                      }}
                    >
                      {test.icon}
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
                        {getTestProp(test, "trials")}
                      </span>
                    )}
                  </div>

                  {/* Task Name & Fun Nickname */}
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 2px 0", color: "#0F172A" }}>
                    {getTestProp(test, "name")}
                  </h3>
                  <div style={{ fontSize: 12, fontWeight: 700, color: test.accentColor, marginBottom: 8 }}>
                    ⚡ {getTestProp(test, "nickname")}
                  </div>

                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>
                    {getTestProp(test, "category")}
                  </div>
                </div>

                {/* Footer Strip */}
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
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    ⏱ {getTestProp(test, "time")}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: isCompleted ? "#059669" : "#1E40AF",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    {isCompleted
                      ? t("Replay ▶", "পুনরায় ▶", "दोबारा खेलें ▶", "पुन्हा खेळा ▶")
                      : t("Play ▶", "শুরু করুন ▶", "शुरू करें ▶", "सुरू करा ▶")}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Questionnaire Quick Link Banner */}
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
            {t("Need to complete questionnaire surveys?", "📋 প্রশ্নাবলী জরিপ সম্পন্ন করেছেন?", "📋 क्या आपने प्रश्नावली सर्वेक्षण पूरा कर लिया?", "📋 तुम्ही प्रश्नावली सर्वेक्षण पूर्ण केले आहे का?")}
          </h4>
          <p style={{ margin: "3px 0 0 0", fontSize: 13, color: "#64748B" }}>
            {t(
              "Complete the 12 psychological and lifestyle questionnaire scales.",
              "১২টি মনস্তাত্ত্বিক স্কেল এবং জীবনধারা সম্পর্কিত প্রশ্নাবলীর উত্তর দিন।",
              "12 मनोवैज्ञानिक स्केल और जीवनशैली संबंधी प्रश्नावली के उत्तर दें।",
              "१२ मानसशास्त्रीय स्केल्स आणि जीवनशैली प्रश्नावलींची उत्तरे द्या."
            )}
          </p>
        </div>
        <Link href="/questionnaires" style={{ textDecoration: "none" }}>
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
            <span>{t("Go to Questionnaires", "প্রশ্নাবলীতে যান", "प्रश्नावली पर जाएं", "प्रश्नावलीकडे जा")}</span>
            <span>➔</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
