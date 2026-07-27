"use client";

import { useAppContext } from "./AppContext";
import IntakeScreen from "./IntakeScreen";
import CognitiveHub from "./CognitiveHub";

export default function MainAppFlow() {
  const { state } = useAppContext();
  
  if (!state.participantName || !state.participantIdNumber) {
    return (
      <div style={{ paddingTop: "50px" }}>
        <IntakeScreen />
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "50px" }}>
      <CognitiveHub />
    </div>
  );
}
