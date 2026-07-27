"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/components/AppContext";

export default function CognitiveLayout({ children }: { children: React.ReactNode }) {
  const { state } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    // If they bypass the intake screen and go directly to /cognitive/... 
    // without a name/ID, send them back to the front door.
    if (!state.participantName || !state.participantIdNumber) {
      router.push("/");
    }
  }, [state.participantName, state.participantIdNumber, router]);

  // Don't render the tests if they don't have a session to avoid saving orphaned data
  if (!state.participantName || !state.participantIdNumber) {
    return <div style={{ textAlign: "center", marginTop: "100px" }}>Redirecting to Intake...</div>;
  }

  return (
    <>
      {children}
    </>
  );
}
