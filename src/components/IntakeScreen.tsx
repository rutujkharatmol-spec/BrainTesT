"use client";

import React, { useState } from "react";
import { useAppContext } from "./AppContext";

export default function IntakeScreen() {
  const { setSessionId, setConsentGiven } = useAppContext();
  
  const [name, setName] = useState("");
  const [idNum, setIdNum] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !idNum.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantName: name, participantIdNumber: idNum })
      });
      
      const data = await res.json();
      if (data.sessionId) {
        setSessionId(data.sessionId, name, idNum);
        setConsentGiven(true);
      } else {
        alert("Failed to start session. Please try again.");
      }
    } catch (e) {
      console.error(e);
      alert("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: 500, margin: "auto", textAlign: "center" }}>
      <h2>Participant Intake</h2>
      <p style={{ marginBottom: 24 }}>Please enter your details to begin the cognitive battery.</p>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ display: "block", textAlign: "left", marginBottom: 8 }}>Full Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "100%", padding: 12, borderRadius: 8, border: "none" }}
            placeholder="e.g. John Doe"
          />
        </div>
        
        <div>
          <label style={{ display: "block", textAlign: "left", marginBottom: 8 }}>ID Number</label>
          <input 
            type="text" 
            value={idNum}
            onChange={(e) => setIdNum(e.target.value)}
            required
            style={{ width: "100%", padding: 12, borderRadius: 8, border: "none" }}
            placeholder="e.g. 123456"
          />
        </div>
        
        <button className="btn" type="submit" disabled={loading} style={{ marginTop: 16 }}>
          {loading ? "Starting..." : "Begin"}
        </button>
      </form>
    </div>
  );
}
