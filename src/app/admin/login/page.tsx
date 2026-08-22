"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/export";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        // Successful login, navigate to target admin page with fresh reload
        window.location.href = callbackUrl;
      } else {
        setError(data?.error || "Invalid admin password. Please try again.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Unable to connect to server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 12px",
      }}
    >
      <div
        className="card admin-login-card"
        style={{
          maxWidth: 420,
          width: "100%",
          padding: "32px 28px",
          background: "#ffffff",
          borderRadius: 14,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* Lab Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: "linear-gradient(135deg, #0f172a, #1e293b)",
              color: "white",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              marginBottom: 12,
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.25)",
            }}
          >
            🔒
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px 0", color: "#0f172a" }}>
            Admin Portal Access
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            AIIMS Kalyani Physiology & Cognitive Lab
          </p>
        </div>

        {/* Error Feedback */}
        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: "#334155",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Master Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px 42px 12px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 15,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn"
            disabled={!password.trim() || loading}
            style={{
              width: "100%",
              padding: "14px",
              minHeight: 46,
              fontSize: 14,
              fontWeight: 700,
              backgroundColor: "#0f172a",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              opacity: !password.trim() || loading ? 0.6 : 1,
            }}
          >
            {loading ? "Authenticating..." : "Unlock Admin Portal"}
          </button>
        </form>

        <div style={{ marginTop: 22, textAlign: "center", borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
          <Link
            href="/"
            style={{
              fontSize: 12,
              color: "#64748b",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Back to Cognitive Testing Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: 50 }}>Loading...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
