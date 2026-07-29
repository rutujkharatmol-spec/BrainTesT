"use client";
import { useEffect, useState } from "react";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show splash screen for 2.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for fade out animation
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, var(--bg-gradient-start), var(--bg-gradient-end))",
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? "visible" : "hidden",
        transition: "opacity 0.5s ease, visibility 0.5s ease",
      }}
    >
      <div
        className="splash-icon-container"
        style={{
          width: "160px",
          height: "160px",
          borderRadius: "28%", // Crops the edges nicely
          overflow: "hidden",
          boxShadow: "0 12px 35px rgba(0, 0, 0, 0.15)",
          animation: "splash-pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        }}
      >
        <img 
          src="/favicon_io/android-chrome-512x512.png" 
          alt="App Icon" 
          style={{ width: "100%", height: "100%", objectFit: "cover" }} 
        />
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes splash-pulse {
          0% { 
            transform: scale(0.9); 
            box-shadow: 0 0 0 0 rgba(45, 110, 126, 0.3); 
          }
          50% { 
            transform: scale(1.05); 
            box-shadow: 0 0 0 25px rgba(45, 110, 126, 0); 
          }
          100% { 
            transform: scale(0.9); 
            box-shadow: 0 0 0 0 rgba(45, 110, 126, 0); 
          }
        }
      `}} />
    </div>
  );
}
