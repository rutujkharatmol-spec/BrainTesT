"use client";

import React, { useState, useEffect } from "react";
import { useAppContext } from "@/components/AppContext";
import IntakeScreen from "@/components/IntakeScreen";
import { QUESTIONNAIRES } from "@/config/questionnaires";
import QuestionnaireViewer from "@/components/QuestionnaireViewer";
import QuestionnaireHub from "@/components/QuestionnaireHub";

export default function QuestionnairesPage() {
  const { state, markTestCompleted } = useAppContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem("neuroCogniLabSplashSeen", "1");
    } catch {
      // ignore
    }
  }, []);

  if (!state.sessionId) {
    return (
      <div style={{ paddingTop: "50px" }}>
        <IntakeScreen />
      </div>
    );
  }

  const selectedQuestionnaire = QUESTIONNAIRES.find(q => q.id === selectedId);

  if (selectedQuestionnaire) {
    return (
      <div style={{ paddingTop: "50px" }}>
        <QuestionnaireViewer 
          questionnaire={selectedQuestionnaire} 
          onComplete={() => {
            markTestCompleted(selectedQuestionnaire.id);
            setSelectedId(null); // Return to hub after completion
          }} 
        />
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "50px" }}>
      <QuestionnaireHub onSelect={setSelectedId} />
    </div>
  );
}
