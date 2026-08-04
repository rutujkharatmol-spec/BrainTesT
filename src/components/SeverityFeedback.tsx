import React from 'react';
import { 
  getDass21DepressionSeverity, 
  getDass21AnxietySeverity, 
  getDass21StressSeverity, 
  getPhq9Severity, 
  getGad7Severity, 
  getWho5Severity 
} from "@/utils/scoring";

const SEVERITY_COLORS: Record<string, string> = {
  "Normal": "🟢",
  "Minimal / Normal": "🟢",
  "Good Well-being": "🟢",
  "Mild": "🟡",
  "Moderate": "🟧",
  "Moderately Severe": "🔴",
  "Severe": "🔴",
  "Extremely Severe": "❌",
  "Poor Well-being": "🔴",
};

const DASS_PHQ_GAD_DESCRIPTIONS: Record<string, string> = {
  "Normal": "Your score falls within the healthy, typical range. Occasional mood fluctuations are a normal part of life.",
  "Minimal / Normal": "Your score falls within the healthy, typical range. Occasional mood fluctuations are a normal part of life.",
  "Mild": "You are experiencing some mild symptoms. These can often be managed with good self-care, rest, and talking to supportive friends or family.",
  "Moderate": "Your symptoms are noticeable and may be interfering with your daily life. It might be helpful to speak with a counselor or doctor for guidance.",
  "Moderately Severe": "Your symptoms are significant and likely having a major impact on your daily life. We strongly encourage you to reach out to a healthcare or mental health professional for support.",
  "Severe": "Your symptoms are significant and likely having a major impact on your daily life. We strongly encourage you to reach out to a healthcare or mental health professional for support.",
  "Extremely Severe": "Your symptoms are significant and likely having a major impact on your daily life. We strongly encourage you to reach out to a healthcare or mental health professional for support.",
};

const WHO5_DESCRIPTIONS: Record<string, string> = {
  "Good Well-being": "Your score indicates a healthy level of general well-being and positive mood over the past two weeks.",
  "Poor Well-being": "Your score indicates low well-being and suggests you might be feeling down or exhausted. We encourage you to focus on self-care and consider speaking to a healthcare professional if you are struggling.",
};

export default function SeverityFeedback({ questionnaireId, calculatedScores }: { questionnaireId: string, calculatedScores: any }) {
  if (!calculatedScores) return null;

  const renderBadge = (severity: string) => {
    const icon = SEVERITY_COLORS[severity] || "";
    let color = "#333";
    let bg = "#f0f0f0";
    if (icon === "🟢") { color = "#155724"; bg = "#d4edda"; }
    else if (icon === "🟡") { color = "#856404"; bg = "#fff3cd"; }
    else if (icon === "🟧") { color = "#856404"; bg = "#ffe8a1"; }
    else if (icon === "🔴" || icon === "❌") { color = "#721c24"; bg = "#f8d7da"; }

    return (
      <span style={{ 
        display: "inline-flex", alignItems: "center", gap: 4, 
        padding: "4px 8px", borderRadius: 4, 
        background: bg, color: color, fontWeight: "bold", fontSize: "0.9rem",
        marginLeft: 8
      }}>
        {icon} {severity}
      </span>
    );
  };

  if (questionnaireId === "dass21") {
    const depSev = getDass21DepressionSeverity(calculatedScores.scoreDepression);
    const anxSev = getDass21AnxietySeverity(calculatedScores.scoreAnxiety);
    const stressSev = getDass21StressSeverity(calculatedScores.scoreStress);
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: "8px 0" }}><strong>Depression Score:</strong> {calculatedScores.scoreDepression} {renderBadge(depSev)}</p>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontStyle: "italic", margin: "4px 0 0 0" }}>{DASS_PHQ_GAD_DESCRIPTIONS[depSev]}</p>
          </div>
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: "8px 0" }}><strong>Anxiety Score:</strong> {calculatedScores.scoreAnxiety} {renderBadge(anxSev)}</p>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontStyle: "italic", margin: "4px 0 0 0" }}>{DASS_PHQ_GAD_DESCRIPTIONS[anxSev]}</p>
          </div>
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: "8px 0" }}><strong>Stress Score:</strong> {calculatedScores.scoreStress} {renderBadge(stressSev)}</p>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontStyle: "italic", margin: "4px 0 0 0" }}>{DASS_PHQ_GAD_DESCRIPTIONS[stressSev]}</p>
          </div>
        </div>
        
        <div style={{ marginTop: 24, padding: "12px", background: "#fff", borderRadius: 6, border: "1px solid #eaeaea", fontSize: "0.85rem" }}>
          <strong style={{ display: "block", marginBottom: 8 }}>Score Guide:</strong>
          <ul style={{ paddingLeft: 20, margin: 0, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 6 }}>
            <li><strong>Depression:</strong> 🟢 0-9 Normal | 🟡 10-13 Mild | 🟧 14-20 Moderate | 🔴 21-27 Severe | ❌ 28+ Extremely Severe</li>
            <li><strong>Anxiety:</strong> 🟢 0-7 Normal | 🟡 8-9 Mild | 🟧 10-14 Moderate | 🔴 15-19 Severe | ❌ 20+ Extremely Severe</li>
            <li><strong>Stress:</strong> 🟢 0-14 Normal | 🟡 15-18 Mild | 🟧 19-25 Moderate | 🔴 26-33 Severe | ❌ 34+ Extremely Severe</li>
          </ul>
        </div>
      </div>
    );
  }

  if (questionnaireId === "phq9") {
    const sev = getPhq9Severity(calculatedScores.score);
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: "8px 0", fontSize: "1.1rem" }}><strong>PHQ-9 Score:</strong> {calculatedScores.score} {renderBadge(sev)}</p>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", fontStyle: "italic", margin: "8px 0" }}>{DASS_PHQ_GAD_DESCRIPTIONS[sev]}</p>
        </div>
        <div style={{ marginTop: 24, padding: "12px", background: "#fff", borderRadius: 6, border: "1px solid #eaeaea", fontSize: "0.85rem" }}>
          <strong style={{ display: "block", marginBottom: 8 }}>Score Guide:</strong>
          <ul style={{ listStyleType: "none", padding: 0, margin: 0, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 6 }}>
            <li>🟢 0-4: Normal</li>
            <li>🟡 5-9: Mild</li>
            <li>🟧 10-14: Moderate</li>
            <li>🔴 15-19: Moderately Severe</li>
            <li>❌ 20+: Severe</li>
          </ul>
        </div>
      </div>
    );
  }

  if (questionnaireId === "gad7") {
    const sev = getGad7Severity(calculatedScores.score);
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: "8px 0", fontSize: "1.1rem" }}><strong>GAD-7 Score:</strong> {calculatedScores.score} {renderBadge(sev)}</p>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", fontStyle: "italic", margin: "8px 0" }}>{DASS_PHQ_GAD_DESCRIPTIONS[sev]}</p>
        </div>
        <div style={{ marginTop: 24, padding: "12px", background: "#fff", borderRadius: 6, border: "1px solid #eaeaea", fontSize: "0.85rem" }}>
          <strong style={{ display: "block", marginBottom: 8 }}>Score Guide:</strong>
          <ul style={{ listStyleType: "none", padding: 0, margin: 0, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 6 }}>
            <li>🟢 0-4: Normal</li>
            <li>🟡 5-9: Mild</li>
            <li>🟧 10-14: Moderate</li>
            <li>🔴 15+: Severe</li>
          </ul>
        </div>
      </div>
    );
  }

  if (questionnaireId === "who5") {
    const sev = getWho5Severity(calculatedScores.score);
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: "8px 0", fontSize: "1.1rem", display: "flex", alignItems: "center" }}>
            <strong>WHO-5 Raw Score:</strong> <span style={{ marginLeft: 6 }}>{calculatedScores.score}</span> {renderBadge(sev)}
          </p>
          <p style={{ margin: "4px 0", fontSize: "0.95rem", color: "var(--text-secondary)" }}><strong>Percentage Score:</strong> {calculatedScores.score * 4}%</p>
          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", fontStyle: "italic", margin: "12px 0" }}>{WHO5_DESCRIPTIONS[sev]}</p>
        </div>
        <div style={{ marginTop: 24, padding: "12px", background: "#fff", borderRadius: 6, border: "1px solid #eaeaea", fontSize: "0.85rem" }}>
          <strong style={{ display: "block", marginBottom: 8 }}>Score Guide:</strong>
          <ul style={{ listStyleType: "none", padding: 0, margin: 0, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 6 }}>
            <li>🔴 &lt; 13 Raw Score (or &lt; 50%): Poor Well-being</li>
            <li>🟢 &ge; 13 Raw Score (or &ge; 50%): Good Well-being</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div>
      {calculatedScores.score !== undefined && <p><strong>Total Score:</strong> {calculatedScores.score}</p>}
      {calculatedScores.scoreSp !== undefined && <p><strong>SP Score:</strong> {calculatedScores.scoreSp}</p>}
      {calculatedScores.scoreSk !== undefined && <p><strong>SK Score:</strong> {calculatedScores.scoreSk}</p>}
      {calculatedScores.scoreSa !== undefined && <p><strong>SA Score:</strong> {calculatedScores.scoreSa}</p>}
    </div>
  );
}
