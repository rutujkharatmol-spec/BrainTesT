"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "./AppContext";

export default function Navbar() {
  const { state, toggleLanguage, resetSession } = useAppContext();
  const pathname = usePathname();

  // Hide during actual cognitive tasks to prevent distraction
  if (pathname?.startsWith("/cognitive/")) {
    return null;
  }

  const isAdmin = pathname?.startsWith("/admin");

  return (
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
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
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
              AIIMS Kalyani
            </div>
            <div className="nav-brand-sub" style={{ fontSize: 11, fontWeight: 500, color: "var(--text-secondary)", lineHeight: 1 }}>
              Physiology & Cognitive Lab
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
              {state.language === "bn" ? "কগনিটিভ টেস্ট" : "Cognitive Tests"}
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
              {state.language === "bn" ? "প্রশ্নাবলী" : "Questionnaires"}
              {pathname === "/questionnaires" && (
                <span style={{ position: "absolute", bottom: -6, left: 0, right: 0, height: 2, backgroundColor: "var(--accent-color)", borderRadius: 2 }} />
              )}
            </Link>
          </nav>
        )}

        {/* Right Action Tools */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Language Switcher */}
          <button 
            onClick={toggleLanguage}
            className="btn btn-outline"
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              gap: 6,
              borderRadius: 6,
            }}
            title="Toggle Language"
          >
            <span>🌐</span> {state.language === 'bn' ? 'বাংলা' : 'English'}
          </button>

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
              <span>🚪</span> <span className="nav-hide-sm">{state.language === 'bn' ? 'প্রস্থান' : 'Sign Out'}</span>
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
  );
}
