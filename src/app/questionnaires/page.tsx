"use client";

import React from "react";
import { useAppContext } from "@/components/AppContext";
import IntakeScreen from "@/components/IntakeScreen";
import { QUESTIONNAIRES } from "@/config/questionnaires";
import QuestionnaireViewer from "@/components/QuestionnaireViewer";
import FinalScreen from "@/components/FinalScreen";

export default function QuestionnairesPage() {
  const { state, markTestCompleted } = useAppContext();

  if (!state.sessionId) {
    return (
      <div style={{ paddingTop: "50px" }}>
        <IntakeScreen />
      </div>
    );
  }

  const pendingQuestionnaire = QUESTIONNAIRES.find(q => !state.completedTests.includes(q.id));

  if (pendingQuestionnaire) {
    return (
      <div style={{ paddingTop: "50px" }}>
        <QuestionnaireViewer 
          questionnaire={pendingQuestionnaire} 
          onComplete={() => markTestCompleted(pendingQuestionnaire.id)} 
        />
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "50px" }}>
      <FinalScreen />
    </div>
  );
}
