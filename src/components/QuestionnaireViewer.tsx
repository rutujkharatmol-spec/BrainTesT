"use client";

import { useState, useEffect, useMemo } from "react";
import { QuestionnaireDef, QuestionnaireItem } from "@/config/questionnaires";
import { useAppContext } from "./AppContext";

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export default function QuestionnaireViewer({ questionnaire }: { questionnaire: QuestionnaireDef }) {
  const { state, markTestCompleted } = useAppContext();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  
  // For buildup type
  const [visibleCount, setVisibleCount] = useState(1);

  // Initialize items order
  const items = useMemo(() => {
    if (questionnaire.orderType === "random") {
      return shuffleArray(questionnaire.items);
    }
    return questionnaire.items;
  }, [questionnaire]);

  const handleAnswer = (itemId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [itemId]: value }));
    
    // If buildup, reveal next
    if (questionnaire.orderType === "buildup") {
      // Find index of this item
      const idx = items.findIndex(i => i.id === itemId);
      // If we just answered the last visible item, reveal the next
      if (idx === visibleCount - 1 && visibleCount < items.length) {
        setVisibleCount(prev => prev + 1);
      }
    }
  };

  const getComputedScore = (itemId: string, rawValue: number) => {
    const item = items.find(i => i.id === itemId);
    if (item?.isReverse) {
      return (questionnaire.scaleMax + questionnaire.scaleMin) - rawValue;
    }
    return rawValue;
  };

  const calculateScores = () => {
    const computedValues = items.map(item => ({
      id: item.id,
      val: getComputedScore(item.id, answers[item.id])
    }));

    if (questionnaire.scoringType === "sum") {
      return { score: computedValues.reduce((acc, curr) => acc + curr.val, 0) };
    }
    
    if (questionnaire.scoringType === "mean") {
      const sum = computedValues.reduce((acc, curr) => acc + curr.val, 0);
      return { score: Number((sum / items.length).toFixed(2)) };
    }

    if (questionnaire.scoringType === "tsis_subscales") {
      // TSIS specific logic based on provided indices (1-indexed based on TSIS config: 1,3,6,9,14,17,19 for SP...)
      // But we have q1, q2 etc. 
      const getSum = (qNums: number[]) => qNums.reduce((acc, num) => {
        const val = computedValues.find(c => c.id === `q${num}`)?.val || 0;
        return acc + val;
      }, 0);

      return {
        scoreSp: getSum([1, 3, 6, 9, 14, 17, 19]),
        scoreSk: getSum([4, 7, 10, 12, 15, 18, 20]),
        scoreSa: getSum([2, 5, 8, 11, 13, 16, 21])
      };
    }
    return { score: 0 };
  };

  const generateFeedback = (scores: any) => {
    let tpl = questionnaire.feedbackTemplate;
    if (scores.score !== undefined) tpl = tpl.replace("{score}", scores.score.toString());
    if (scores.scoreSp !== undefined) {
      tpl = tpl.replace("{scoreSp}", scores.scoreSp.toString())
               .replace("{scoreSk}", scores.scoreSk.toString())
               .replace("{scoreSa}", scores.scoreSa.toString());
    }
    return tpl;
  };

  const handleSubmit = async () => {
    // Validation
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < items.length) {
      setShowValidation(true);
      // scroll to first unanswered
      const firstUnanswered = items.find(i => answers[i.id] === undefined);
      if (firstUnanswered) {
        document.getElementById(`q-${firstUnanswered.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    const scores = calculateScores();

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: state.sessionId,
          testId: questionnaire.id,
          rawScores: answers,
          ...scores
        })
      });

      if (!res.ok) throw new Error("Submission failed");
      
      setFeedback(generateFeedback(scores));
      
      // Auto advance after 4 seconds, or user can click next
      setTimeout(() => {
        markTestCompleted(questionnaire.id);
      }, 5000);

    } catch (e) {
      alert("Failed to submit. Please try again.");
      setSubmitting(false);
    }
  };

  const visibleItems = questionnaire.orderType === "buildup" ? items.slice(0, visibleCount) : items;
  const progressPercent = (Object.keys(answers).length / items.length) * 100;

  return (
    <div className="glass-panel" style={{ maxWidth: 800, margin: "auto" }}>
      <h1>{questionnaire.title}</h1>
      <p style={{ marginBottom: 24 }}>{questionnaire.description}</p>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {visibleItems.map((item, index) => {
          const isInvalid = showValidation && answers[item.id] === undefined;
          
          return (
            <div key={item.id} id={`q-${item.id}`} className={`question-card ${isInvalid ? 'invalid' : ''}`}>
              <div className="question-text">
                {index + 1}. {item.text}
              </div>
              <div className="scale-options">
                {questionnaire.scale.map(option => (
                  <label 
                    key={option.value} 
                    className={`scale-option ${answers[item.id] === option.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`item-${item.id}`}
                      value={option.value}
                      checked={answers[item.id] === option.value}
                      onChange={() => handleAnswer(item.id, option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {isInvalid && <span className="error-text">Please select an answer.</span>}
            </div>
          );
        })}
      </div>

      {feedback ? (
        <div style={{ marginTop: 32, padding: 24, background: "rgba(16, 185, 129, 0.1)", borderRadius: 12, border: "1px solid var(--success-color)" }}>
          <h3 style={{ color: "var(--success-color)", marginBottom: 12 }}>Results</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{feedback}</p>
          <button className="btn" style={{ marginTop: 24 }} onClick={() => markTestCompleted(questionnaire.id)}>
            Continue to Next Test
          </button>
        </div>
      ) : (
        <button 
          className="btn" 
          onClick={handleSubmit}
          disabled={submitting}
          style={{ marginTop: 32 }}
        >
          {submitting ? "Submitting..." : "Submit Answers"}
        </button>
      )}
    </div>
  );
}
