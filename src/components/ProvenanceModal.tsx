"use client";

import React, { useState, useEffect } from "react";
import { verifyOwnership, VerificationResult } from "@/lib/provenance";

interface ProvenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProvenanceModal({ isOpen, onClose }: ProvenanceModalProps) {
  const [data, setData] = useState<VerificationResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setData(verifyOwnership());
      setCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const copyCertificate = () => {
    const payload = JSON.stringify(
      {
        system: "AIIMS Kalyani Physiology & Cognitive Lab (BrainTesT)",
        authorshipCertificate: data.certificate,
        sha256Signature: data.hash,
        steganographyProof: data.steganographyDecoded,
        status: data.valid ? "AUTHENTICATED" : "FAILED",
        tamperProof: data.tamperProof,
      },
      null,
      2
    );
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "16px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(145deg, #0f172a, #1e293b)",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "640px",
          color: "#f8fafc",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(37, 99, 235, 0.2)",
          padding: "24px",
          overflow: "hidden",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #2563eb, #38bdf8, #22c55e)",
          }}
        />

        {/* Modal Top Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #1e40af, #2563eb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                boxShadow: "0 0 15px rgba(37, 99, 235, 0.4)",
              }}
            >
              🛡️
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, letterSpacing: "-0.3px", color: "#ffffff" }}>
                Authorship & Provenance Certificate
              </h2>
              <div style={{ fontSize: "12px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>AIIMS Kalyani Cognitive Battery</span>
                <span>•</span>
                <span style={{ color: "#4ade80", fontWeight: 600 }}>Tamper-Evident SHA-256</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "6px 10px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            ✕
          </button>
        </div>

        {/* Verification Status Badge */}
        <div
          style={{
            background: "rgba(34, 197, 94, 0.12)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: "10px",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#22c55e", fontSize: "16px" }}>✓</span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#86efac" }}>
              Cryptographic Integrity Authenticated
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "#4ade80", fontFamily: "monospace" }}>
            {data.certificate.tamperId}
          </span>
        </div>

        {/* Certificate Details Grid */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            borderRadius: "12px",
            padding: "14px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
              Original Author & Creator
            </div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#38bdf8", marginTop: "2px" }}>
              {data.certificate.author}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
              Engineering Role
            </div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0", marginTop: "2px" }}>
              {data.certificate.role}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
              Institution & Department
            </div>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "#cbd5e1", marginTop: "2px" }}>
              {data.certificate.institution}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
              Project Codebase
            </div>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "#cbd5e1", marginTop: "2px" }}>
              BrainTesT Cognitive Battery
            </div>
          </div>
        </div>

        {/* Cryptographic SHA-256 Hash Display */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "4px",
            }}
          >
            <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
              SHA-256 Provenance Hash
            </span>
            <span style={{ fontSize: "11px", color: "#38bdf8" }}>Deterministic Checksum</span>
          </div>
          <div
            style={{
              background: "#020617",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: "8px",
              padding: "8px 12px",
              fontFamily: "monospace",
              fontSize: "11px",
              color: "#93c5fd",
              wordBreak: "break-all",
              lineHeight: 1.4,
            }}
          >
            {data.hash}
          </div>
        </div>

        {/* Legal / Steganography Protection Notice */}
        <div
          style={{
            background: "rgba(30, 41, 59, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "8px",
            padding: "10px 12px",
            fontSize: "11px",
            color: "#94a3b8",
            lineHeight: 1.4,
            marginBottom: "20px",
          }}
        >
          🔒 <strong style={{ color: "#e2e8f0" }}>Anti-Theft Notice:</strong> This project is digitally signed and watermarked with zero-width steganographic markers identifying{" "}
          <strong style={{ color: "#38bdf8" }}>{data.certificate.author}</strong> as original creator. Any unauthorized copying or claiming of ownership is mathematically verifiable.
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={copyCertificate}
            style={{
              background: copied ? "#15803d" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {copied ? "✓ Copied to Clipboard" : "📋 Copy Verification Certificate"}
          </button>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              color: "#e2e8f0",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
