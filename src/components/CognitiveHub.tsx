"use client";

import React from "react";
import Link from "next/link";
import { useAppContext } from "./AppContext";
import FinalScreen from "./FinalScreen";

type TestMeta = {
  path: string;
  name: string;
  name_bn: string;
  nickname: string;
  nickname_bn: string;
  icon: string;
  category: string;
  category_bn: string;
  trials: string;
  trials_bn: string;
  time: string;
  time_bn: string;
  accentColor: string;
  bgLight: string;
};

const TESTS: TestMeta[] = [
  {
    path: "/cognitive/stroop",
    name: "Stroop Task",
    name_bn: "স্ট্রুপ টাস্ক",
    nickname: "Color Clash",
    nickname_bn: "কালার ক্ল্যাশ",
    icon: "🎯",
    category: "Executive Function",
    category_bn: "এক্সিকিউটিভ ফাংশন",
    trials: "20 trials",
    trials_bn: "২০টি ট্রায়াল",
    time: "~2 min",
    time_bn: "~২ মিনিট",
    accentColor: "#2563EB",
    bgLight: "#EFF6FF",
  },
  {
    path: "/cognitive/nback",
    name: "N-Back Task (2-Back)",
    name_bn: "এন-ব্যাক টাস্ক",
    nickname: "Memory Echo",
    nickname_bn: "স্মৃতি প্রতিধ্বনি",
    icon: "🧠",
    category: "Working Memory",
    category_bn: "স্মৃতিশক্তি",
    trials: "30 trials",
    trials_bn: "৩০টি ট্রায়াল",
    time: "~2 min",
    time_bn: "~২ মিনিট",
    accentColor: "#D97706",
    bgLight: "#FFFBEB",
  },
  {
    path: "/cognitive/corsi",
    name: "Corsi Block Task",
    name_bn: "কোর্সি ব্লক টাস্ক",
    nickname: "Tile Hopper",
    nickname_bn: "টাইল হপার",
    icon: "🧱",
    category: "Spatial Memory",
    category_bn: "স্থানিক স্মৃতি",
    trials: "Adaptive",
    trials_bn: "অ্যাডাপ্টিভ",
    time: "~3 min",
    time_bn: "~৩ মিনিট",
    accentColor: "#7C3AED",
    bgLight: "#F5F3FF",
  },
  {
    path: "/cognitive/digitspan",
    name: "Digit Span Task",
    name_bn: "ডিজিট স্প্যান টাস্ক",
    nickname: "Number Chain",
    nickname_bn: "নম্বর চেইন",
    icon: "🔢",
    category: "Verbal Memory",
    category_bn: "মৌখিক স্মৃতি",
    trials: "Adaptive",
    trials_bn: "অ্যাডাপ্টিভ",
    time: "~3 min",
    time_bn: "~৩ মিনিট",
    accentColor: "#0891B2",
    bgLight: "#ECFEFF",
  },
  {
    path: "/cognitive/sart",
    name: "SART",
    name_bn: "এস.এ.আর.টি",
    nickname: "Speed Reflex",
    nickname_bn: "স্পিড রিফ্লেক্স",
    icon: "⏱️",
    category: "Sustained Attention",
    category_bn: "মনোযোগ নিয়ন্ত্রণ",
    trials: "50 trials",
    trials_bn: "৫০টি ট্রায়াল",
    time: "~1.5 min",
    time_bn: "~১.৫ মিনিট",
    accentColor: "#059669",
    bgLight: "#ECFDF5",
  },
  {
    path: "/cognitive/dotprobe",
    name: "Dot Probe Task",
    name_bn: "ডট প্রোব টাস্ক",
    nickname: "Target Hunter",
    nickname_bn: "টার্গেট হান্টার",
    icon: "🔴",
    category: "Attentional Bias",
    category_bn: "মনোযোগ লক্ষ্য",
    trials: "40 trials",
    trials_bn: "৪০টি ট্রায়াল",
    time: "~2 min",
    time_bn: "~২ মিনিট",
    accentColor: "#DC2626",
    bgLight: "#FEF2F2",
  },
  {
    path: "/cognitive/flanker",
    name: "Eriksen Flanker",
    name_bn: "এরিকসেন ফ্ল্যাঙ্কার",
    nickname: "Arrow Archer",
    nickname_bn: "তীরন্দাজ লক্ষ্য",
    icon: "🏹",
    category: "Focus & Inhibition",
    category_bn: "ফোকাস নিয়ন্ত্রণ",
    trials: "40 trials",
    trials_bn: "৪০টি ট্রায়াল",
    time: "~2 min",
    time_bn: "~২ মিনিট",
    accentColor: "#65A30D",
    bgLight: "#F7FEE7",
  },
  {
    path: "/cognitive/ldt",
    name: "Lexical Decision",
    name_bn: "লেক্সিক্যাল ডিসিশন",
    nickname: "Word Detective",
    nickname_bn: "শব্দ গোয়েন্দা",
    icon: "📖",
    category: "Language Speed",
    category_bn: "শব্দ জ্ঞান",
    trials: "40 trials",
    trials_bn: "৪০টি ট্রায়াল",
    time: "~2 min",
    time_bn: "~২ মিনিট",
    accentColor: "#475569",
    bgLight: "#F1F5F9",
  },
  {
    path: "/cognitive/negative-priming",
    name: "Negative Priming",
    name_bn: "নেগেটিভ প্রাইমিং",
    nickname: "Flash Focus",
    nickname_bn: "ফ্ল্যাশ ফোকাস",
    icon: "⚡",
    category: "Cognitive Agility",
    category_bn: "দ্রুত বিচার",
    trials: "40 trials",
    trials_bn: "৪০টি ট্রায়াল",
    time: "~2 min",
    time_bn: "~২ মিনিট",
    accentColor: "#DB2777",
    bgLight: "#FDF2F8",
  },
];

export default function CognitiveHub() {
  const { state, resetSession } = useAppContext();
  const lang = state.language;
  const isBn = lang === "bn";

  const completedCount = TESTS.filter((t) => state.completedTests.includes(t.path)).length;
  const allCompleted = completedCount === TESTS.length;
  const progressPercent = Math.round((completedCount / TESTS.length) * 100);

  // Student ranking based on tests completed
  let rankBadge = isBn ? "অভিযাত্রী (Explorer 🧭)" : "Explorer 🧭";
  if (completedCount >= 9) {
    rankBadge = isBn ? "মাস্টারমাইন্ড গ্র্যান্ডমাস্টার 🏆" : "Grandmaster 🏆";
  } else if (completedCount >= 6) {
    rankBadge = isBn ? "কগনিটিভ নিনজা ⚔️" : "Cognitive Ninja ⚔️";
  } else if (completedCount >= 3) {
    rankBadge = isBn ? "ব্রেন স্কলার 💡" : "Brain Scholar 💡";
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
                🎮 {isBn ? "ব্রেন কোয়েস্ট প্ল্যাটফর্ম" : "BRAIN QUEST"}
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
              {isBn ? "স্নায়ুবৌদ্ধিক চ্যালেঞ্জ হাব" : "Cognitive Challenge Hub"}
            </h1>

            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
              {isBn ? "অংশগ্রহণকারী" : "Student"}: <strong style={{ color: "#FFFFFF" }}>{state.participantName}</strong>
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
            <span>🚪</span> {isBn ? "লগ আউট" : "Sign Out"}
          </button>
        </div>

        {/* Progress Bar Container */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
            <span>
              {isBn ? "আপনার সামগ্রিক অগ্রগতি" : "Your Mission Progress"}
            </span>
            <span style={{ color: "#FEF08A" }}>
              {completedCount} / {TESTS.length} {isBn ? "সম্পন্ন" : "Completed"} ({progressPercent}%)
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
                        ✓ {isBn ? "সম্পন্ন" : "Done"}
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
                        {isBn ? test.trials_bn : test.trials}
                      </span>
                    )}
                  </div>

                  {/* Task Name & Fun Nickname */}
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 2px 0", color: "#0F172A" }}>
                    {isBn ? test.name_bn : test.name}
                  </h3>
                  <div style={{ fontSize: 12, fontWeight: 700, color: test.accentColor, marginBottom: 8 }}>
                    ⚡ {isBn ? test.nickname_bn : test.nickname}
                  </div>

                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>
                    {isBn ? test.category_bn : test.category}
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
                    ⏱ {isBn ? test.time_bn : test.time}
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
                    {isCompleted ? (isBn ? "পুনরায় ▶" : "Replay ▶") : (isBn ? "শুরু করুন ▶" : "Play ▶")}
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
            📋 {isBn ? "প্রশ্নাবলী জরিপ সম্পন্ন করেছেন?" : "Need to complete questionnaire surveys?"}
          </h4>
          <p style={{ margin: "3px 0 0 0", fontSize: 13, color: "#64748B" }}>
            {isBn
              ? "১২টি মনস্তাত্ত্বিক স্কেল এবং জীবনধারা সম্পর্কিত প্রশ্নাবলীর উত্তর দিন।"
              : "Complete the 12 psychological and lifestyle questionnaire scales."}
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
            <span>{isBn ? "প্রশ্নাবলীতে যান" : "Go to Questionnaires"}</span>
            <span>➔</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
