"use client";

export default function FinalScreen() {
  return (
    <div className="glass-panel" style={{ maxWidth: 600, margin: "auto", marginTop: "10vh", textAlign: "center" }}>
      <h1 style={{ color: "var(--success-color)", marginBottom: 24 }}>Battery Complete!</h1>
      <p>
        Thank you for taking the time to complete all the cognitive tests. 
        Your results have been successfully recorded.
      </p>
      <p style={{ marginTop: 32, fontSize: "0.9rem" }}>
        You may now close this tab, or click "End Session" below to start over.
      </p>
    </div>
  );
}
