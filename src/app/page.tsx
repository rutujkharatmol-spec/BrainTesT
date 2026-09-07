"use client";

import { useState, useEffect } from "react";
import MainAppFlow from "@/components/MainAppFlow";
import SplashScreen from "@/components/SplashScreen";
import { useAppContext } from "@/components/AppContext";

const SPLASH_SEEN_KEY = "brainTestSplashSeen";

export default function Home() {
  const { state } = useAppContext();
  // Default to false so on laptop/desktop or return visits there is zero flash/loading delay
  const [showSplash, setShowSplash] = useState<boolean>(false);

  useEffect(() => {
    // Never show splash/loading screen on laptops or desktops (viewport width >= 768px)
    const isLaptopOrDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
    // Never show splash/loading screen if participant already has an active session
    const hasActiveSession = Boolean(state.sessionId);

    let seen = false;
    try {
      seen = sessionStorage.getItem(SPLASH_SEEN_KEY) === "1";
    } catch {
      // Private mode / storage disabled
    }

    if (isLaptopOrDesktop || hasActiveSession || seen) {
      try {
        sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
      } catch {
        // Non-fatal
      }
      setShowSplash(false);
      return;
    }

    // Only for initial mobile PWA launch without active session
    setShowSplash(true);
  }, [state.sessionId]);

  const dismissSplash = () => {
    try {
      sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
    } catch {
      // Non-fatal; worst case the splash shows again.
    }
    setShowSplash(false);
  };

  return showSplash ? <SplashScreen onComplete={dismissSplash} /> : <MainAppFlow />;
}

