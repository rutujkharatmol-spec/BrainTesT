"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "./AppContext";

export default function Navbar() {
  const { state } = useAppContext();
  const pathname = usePathname();

  // Hide on intake screen
  if (!state.sessionId) {
    return null;
  }

  // Hide during actual cognitive tasks to prevent distraction
  if (pathname?.startsWith("/cognitive/")) {
    return null;
  }

  return (
    <nav style={{
      background: "var(--card-bg)",
      borderBottom: "1px solid var(--card-border)",
      padding: "16px 24px",
      display: "flex",
      justifyContent: "center",
      gap: "32px",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
    }}>
      <Link 
        href="/" 
        style={{ 
          textDecoration: "none", 
          color: pathname === "/" ? "var(--accent-color)" : "var(--text-secondary)",
          fontWeight: pathname === "/" ? 600 : 500,
          borderBottom: pathname === "/" ? "2px solid var(--accent-color)" : "2px solid transparent",
          paddingBottom: "4px",
          transition: "all 0.2s"
        }}
      >
        Cognitive Tests
      </Link>
      <Link 
        href="/questionnaires" 
        style={{ 
          textDecoration: "none", 
          color: pathname === "/questionnaires" ? "var(--accent-color)" : "var(--text-secondary)",
          fontWeight: pathname === "/questionnaires" ? 600 : 500,
          borderBottom: pathname === "/questionnaires" ? "2px solid var(--accent-color)" : "2px solid transparent",
          paddingBottom: "4px",
          transition: "all 0.2s"
        }}
      >
        Questionnaires
      </Link>
    </nav>
  );
}
