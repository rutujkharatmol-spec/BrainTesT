"use client";

import { useState } from "react";

export default function SyncGoogleSheetsButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    setLoading(true);
    setMessage("Syncing...");
    try {
      const res = await fetch("/api/admin/sync-google-sheet", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        setMessage(data.message || "Synced successfully!");
      } else {
        setMessage("Error: " + (data.message || res.statusText || "Failed to sync."));
      }
    } catch (err: any) {
      setMessage("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <button 
        className="btn" 
        onClick={handleSync} 
        disabled={loading}
        style={{ 
          maxWidth: 300, 
          backgroundColor: "var(--accent-color)", 
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        {loading ? "Syncing..." : "Sync Cognitive Results to Google Sheets"}
      </button>
      {message && (
        <span style={{ fontSize: "0.9rem", color: message.startsWith("Error") ? "red" : "green" }}>
          {message}
        </span>
      )}
    </div>
  );
}
