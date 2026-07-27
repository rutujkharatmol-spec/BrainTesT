"use client";

import { useState } from "react";
import { useAppContext } from "./AppContext";

export default function WelcomeScreen() {
  const { setSessionId, setConsentGiven } = useAppContext();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!agreed) return;
    setLoading(true);
    setError(null);
    try {
      // Create session on server
      const res = await fetch("/api/session", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to create session");
      const data = await res.json();
      
      setSessionId(data.sessionId);
      setConsentGiven(true);
    } catch (err) {
      setError("An error occurred while starting the session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: 600, margin: "auto", marginTop: "10vh" }}>
      <h1>Welcome to the Cognitive Self-Assessment Study</h1>
      <p>
        Thank you for your interest. This study involves a series of short questionnaires 
        designed to measure various cognitive styles and beliefs.
      </p>
      <p>
        Your responses will be recorded anonymously and will be used solely for research purposes. 
        You may stop at any time.
      </p>
      
      <div style={{ marginTop: 24, marginBottom: 24 }}>
        <label style={{ display: "flex", alignItems: "flex-start", cursor: "pointer", gap: 12 }}>
          <input 
            type="checkbox" 
            checked={agreed} 
            onChange={e => setAgreed(e.target.checked)} 
            style={{ width: 20, height: 20, marginTop: 4, accentColor: 'var(--accent-color)' }}
          />
          <span style={{ fontSize: "1.05rem", lineHeight: 1.4 }}>
            I have read the study description and explicitly consent to participate in this research.
          </span>
        </label>
      </div>

      {error && <span className="error-text" style={{ marginBottom: 16 }}>{error}</span>}

      <button 
        className="btn" 
        onClick={handleStart} 
        disabled={!agreed || loading}
      >
        {loading ? "Starting..." : "Start Assessment"}
      </button>
    </div>
  );
}
