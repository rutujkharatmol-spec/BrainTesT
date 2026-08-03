"use client";

import React from "react";
import Link from "next/link";
import { useAppContext } from "./AppContext";

import FinalScreen from "./FinalScreen";

const TESTS = [
  { path: "/cognitive/stroop", name: "Stroop Task", name_bn: "স্ট্রুপ টাস্ক", category: "Executive Function", category_bn: "এক্সিকিউটিভ ফাংশন", trials: "20 trials", trials_bn: "২০টি ট্রায়াল", time: "~2 min", time_bn: "~২ মিনিট" },
  { path: "/cognitive/nback", name: "N-Back Task", name_bn: "এন-ব্যাক টাস্ক", category: "Memory", category_bn: "স্মৃতি", trials: "30 trials", trials_bn: "৩০টি ট্রায়াল", time: "~2 min", time_bn: "~২ মিনিট" },
  { path: "/cognitive/corsi", name: "Corsi Block Task", name_bn: "কোর্সি ব্লক টাস্ক", category: "Memory", category_bn: "স্মৃতি", trials: "Adaptive", trials_bn: "অ্যাডাপ্টিভ", time: "~3 min", time_bn: "~৩ মিনিট" },
  { path: "/cognitive/digitspan", name: "Digit Span Task", name_bn: "ডিজিট স্প্যান টাস্ক", category: "Memory", category_bn: "স্মৃতি", trials: "Adaptive", trials_bn: "অ্যাডাপ্টিভ", time: "~3 min", time_bn: "~৩ মিনিট" },
  { path: "/cognitive/sart", name: "SART", name_bn: "এস.এ.আর.টি (SART)", category: "Attention", category_bn: "মনোযোগ", trials: "50 trials", trials_bn: "৫০টি ট্রায়াল", time: "~1.5 min", time_bn: "~১.৫ মিনিট" },
  { path: "/cognitive/dotprobe", name: "Dot Probe Task", name_bn: "ডট প্রোব টাস্ক", category: "Attention", category_bn: "মনোযোগ", trials: "40 trials", trials_bn: "৪০টি ট্রায়াল", time: "~2 min", time_bn: "~২ মিনিট" },
  { path: "/cognitive/flanker", name: "Eriksen Flanker Task", name_bn: "এরিকসেন ফ্ল্যাঙ্কার টাস্ক", category: "Executive Function", category_bn: "এক্সিকিউটিভ ফাংশন", trials: "40 trials", trials_bn: "৪০টি ট্রায়াল", time: "~2 min", time_bn: "~২ মিনিট" },
  { path: "/cognitive/ldt", name: "Lexical Decision Task", name_bn: "লেক্সিক্যাল ডিসিশন টাস্ক", category: "Social Cognition", category_bn: "সামাজিক জ্ঞান", trials: "40 trials", trials_bn: "৪০টি ট্রায়াল", time: "~2 min", time_bn: "~২ মিনিট" },
  { path: "/cognitive/negative-priming", name: "Negative Priming", name_bn: "নেগেটিভ প্রাইমিং", category: "Social Cognition", category_bn: "সামাজিক জ্ঞান", trials: "40 trials", trials_bn: "৪০টি ট্রায়াল", time: "~2 min", time_bn: "~২ মিনিট" }
];

export default function CognitiveHub() {
  const { state, resetSession } = useAppContext();

  const allCompleted = TESTS.every(t => state.completedTests.includes(t.path));
  const lang = state.language;

  return (
    <div className="card" style={{ maxWidth: 800, margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingBottom: 16, borderBottom: "1px solid var(--card-border)" }}>
        <div>
          <h2>{lang === 'bn' ? "স্নায়বিক পরীক্ষা হাব" : "Cognitive Testing Hub"}</h2>
          <p style={{ margin: 0 }}>{lang === 'bn' ? "অংশগ্রহণকারী" : "Participant"}: {state.participantName} ({state.participantIdNumber})</p>
        </div>
        <button onClick={resetSession} className="btn btn-outline" style={{ border: "1px solid var(--error-color)", color: "var(--error-color)" }}>
          {lang === 'bn' ? "সেশন শেষ করুন" : "End Session"}
        </button>
      </div>

      {allCompleted && (
        <div style={{ marginBottom: 32 }}>
          <FinalScreen />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        {TESTS.map((test) => {
          const isCompleted = state.completedTests.includes(test.path);
          return (
            <Link href={test.path} key={test.path} style={{ textDecoration: "none" }}>
              <div style={{ 
                background: isCompleted ? "#F9FAFB" : "#FFFFFF", 
                padding: 16, 
                borderRadius: 8, 
                border: "1px solid var(--card-border)",
                transition: "transform 150ms, box-shadow 150ms",
                cursor: "pointer",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                opacity: 1,
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)"; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"; }}
              >
                <div>
                  <h3 style={{ fontSize: "1.1rem", marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                    {lang === 'bn' && test.name_bn ? test.name_bn : test.name}
                    {isCompleted && <span style={{ color: "var(--success-color)", fontSize: "1.2rem" }}>✓</span>}
                  </h3>
                  <div style={{ fontSize: "0.8rem", color: "var(--accent-color)", marginBottom: 12 }}>{lang === 'bn' && test.category_bn ? test.category_bn : test.category}</div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)", opacity: 0.8, borderTop: "1px solid var(--card-border)", paddingTop: 8 }}>
                  <span>{lang === 'bn' && test.trials_bn ? test.trials_bn : test.trials}</span>
                  <span>⏱ {lang === 'bn' && test.time_bn ? test.time_bn : test.time}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div style={{ marginTop: 48, textAlign: "center", borderTop: "1px solid var(--card-border)", paddingTop: 24 }}>
        <p style={{ marginBottom: 16, color: "var(--accent-color)", fontWeight: 500 }}>{lang === 'bn' ? "মানক প্রশ্নাবলী পূরণ করতে হবে?" : "Need to complete the standard questionnaires?"}</p>
        <Link href="/questionnaires" style={{ textDecoration: "none" }}>
          <button className="btn" style={{ padding: "12px 32px" }}>
            {lang === 'bn' ? "প্রশ্নাবলীতে যান" : "Go to Questionnaires"}
          </button>
        </Link>
      </div>
    </div>
  );
}
