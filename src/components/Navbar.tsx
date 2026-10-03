"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "./AppContext";
import ProvenanceModal from "./ProvenanceModal";

export default function Navbar() {
  const { state, toggleLanguage, setLanguage, resetSession } = useAppContext();
  const pathname = usePathname();

  const [showProvenanceModal, setShowProvenanceModal] = useState(false);
  const logoClicksRef = useRef<number[]>([]);

  const handleLogoClick = (e: React.MouseEvent) => {
    const now = Date.now();
    // Keep clicks within the last 3000ms
    logoClicksRef.current = [...logoClicksRef.current.filter((t) => now - t < 3000), now];
    if (logoClicksRef.current.length >= 5) {
      e.preventDefault();
      logoClicksRef.current = [];
      setShowProvenanceModal(true);
    }
  };

  useEffect(() => {
    const handleKeyShortcut = (e: KeyboardEvent) => {
      if (
        e.ctrlKey &&
        e.shiftKey &&
        e.altKey &&
        (e.key.toLowerCase() === "r" || e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        setShowProvenanceModal((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyShortcut);
    return () => window.removeEventListener("keydown", handleKeyShortcut);
  }, []);

  // Hide during actual cognitive tasks to prevent distraction, but keep modal available via shortcut
  if (pathname?.startsWith("/cognitive/")) {
    return (
      <ProvenanceModal
        isOpen={showProvenanceModal}
        onClose={() => setShowProvenanceModal(false)}
      />
    );
  }

  const isAdmin = pathname?.startsWith("/admin");

  return (
    <>
      <header
        className="app-navbar"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--card-border)",
          padding: "12px 24px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)"
        }}
      >
        <div style={{ maxWidth: 1600, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          {/* Lab Branding */}
          <Link
            href="/"
            onClick={handleLogoClick}
            style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            title="NeuroCogniLab — AIIMS Kalyani Physiology & Cognitive Lab"
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
              background: "linear-gradient(135deg, #1e40af, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: 16,
              boxShadow: "0 2px 4px rgba(30, 64, 175, 0.25)"
            }}
          >
            🧠
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", letterSpacing: -0.2, lineHeight: 1.2 }}>
              NeuroCogniLab
            </div>
            <div className="nav-brand-sub" style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", lineHeight: 1 }}>
              AIIMS Kalyani Physiology Lab
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        {!isAdmin && state.sessionId && (
          <nav style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <Link 
              href="/" 
              style={{ 
                textDecoration: "none", 
                color: pathname === "/" ? "var(--accent-color)" : "var(--text-secondary)",
                fontWeight: pathname === "/" ? 600 : 500,
                fontSize: 14,
                position: "relative",
                padding: "6px 2px",
                transition: "color 0.15s"
              }}
            >
              {state.language === "bn"
                ? "কগনিটিভ টেস্ট"
                : state.language === "hi"
                ? "संज्ञानात्मक परीक्षण"
                : state.language === "mr"
                ? "संज्ञानात्मक चाचण्या"
                : "Cognitive Tests"}
              {pathname === "/" && (
                <span style={{ position: "absolute", bottom: -6, left: 0, right: 0, height: 2, backgroundColor: "var(--accent-color)", borderRadius: 2 }} />
              )}
            </Link>

            <Link 
              href="/questionnaires" 
              style={{ 
                textDecoration: "none", 
                color: pathname === "/questionnaires" ? "var(--accent-color)" : "var(--text-secondary)",
                fontWeight: pathname === "/questionnaires" ? 600 : 500,
                fontSize: 14,
                position: "relative",
                padding: "6px 2px",
                transition: "color 0.15s"
              }}
            >
              {state.language === "bn"
                ? "প্রশ্নাবলী"
                : state.language === "hi"
                ? "प्रश्नावली"
                : state.language === "mr"
                ? "प्रश्नावली"
                : "Questionnaires"}
              {pathname === "/questionnaires" && (
                <span style={{ position: "absolute", bottom: -6, left: 0, right: 0, height: 2, backgroundColor: "var(--accent-color)", borderRadius: 2 }} />
              )}
            </Link>
          </nav>
        )}

        {/* Right Action Tools */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* 4-Language Switcher */}
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <span style={{ position: "absolute", left: 10, pointerEvents: "none", fontSize: 13 }}>🌐</span>
            <select
              value={state.language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="btn-outline"
              style={{
                padding: "6px 12px 6px 30px",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                border: "1px solid var(--card-border)",
                background: "#ffffff",
                color: "var(--text-primary)",
                cursor: "pointer",
                outline: "none",
                appearance: "auto",
              }}
              title="Select Language / भाषा चुनें / भाषा निवडा / ভাষা নির্বাচন করুন"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
              <option value="bn">বাংলা</option>
            </select>
          </div>

          {/* Participant Sign Out Button */}
          {!isAdmin && state.sessionId && (
            <button
              onClick={resetSession}
              className="btn btn-outline"
              style={{
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: "#dc2626",
                borderColor: "#fecaca",
                borderRadius: 6,
              }}
              title="Sign Out / Switch Participant"
            >
              <span>🚪</span>{" "}
              <span className="nav-hide-sm">
                {state.language === "bn"
                  ? "প্রস্থান"
                  : state.language === "hi"
                  ? "साइन आउट"
                  : state.language === "mr"
                  ? "बाहेर पडा"
                  : "Sign Out"}
              </span>
            </button>
          )}

          {/* Admin status badge — shown only once already inside /admin.
              The portal is intentionally not linked from the participant UI;
              it is reached by navigating to /admin directly. */}
          {isAdmin && (
            <span
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                background: "var(--text-primary)",
                color: "#ffffff",
                border: "1px solid var(--card-border)",
                borderRadius: 6,
              }}
            >
              <span>🔒</span> <span className="nav-hide-sm">Admin Active</span>
            </span>
          )}
        </div>
      </div>
    </header>
    <ProvenanceModal
      isOpen={showProvenanceModal}
      onClose={() => setShowProvenanceModal(false)}
    />
  </>
);
}
