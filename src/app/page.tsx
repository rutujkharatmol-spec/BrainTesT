"use client";

import { useState, useEffect } from "react";
import MainAppFlow from "@/components/MainAppFlow";
import SplashScreen from "@/components/SplashScreen";

const SPLASH_SEEN_KEY = "brainTestSplashSeen";

export default function Home() {
  // Undecided until we've checked sessionStorage, so the splash never flashes
  // on a return visit within the same browser session.
  const [showSplash, setShowSplash] = useState<boolean | null>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SPLASH_SEEN_KEY) === "1";
    } catch {
      // Private mode / storage disabled — just show it.
    }
    setShowSplash(!seen);
  }, []);

  const dismissSplash = () => {
    try {
      sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
    } catch {
      // Non-fatal; worst case the splash shows again.
    }
    setShowSplash(false);
  };

  if (showSplash === null) return null;

  return showSplash ? <SplashScreen onComplete={dismissSplash} /> : <MainAppFlow />;
}
