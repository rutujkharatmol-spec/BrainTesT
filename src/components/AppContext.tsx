"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { processOfflineQueue, getOfflineQueueSize } from '@/utils/offlineSync';

type AppState = {
  consentGiven: boolean;
  sessionId: string | null;
  participantName: string | null;
  participantIdNumber: string | null;
  completedTests: string[];
};

type AppContextType = {
  state: AppState;
  setSessionId: (id: string, name: string, idNum: string) => void;
  setConsentGiven: (given: boolean) => void;
  markTestCompleted: (testId: string) => void;
  resetSession: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppState = {
  consentGiven: false,
  sessionId: null,
  participantName: null,
  participantIdNumber: null,
  completedTests: [],
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('brainTestState');
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    setLoaded(true);

    // Set initial online/offline status
    setIsOffline(!navigator.onLine);
    setPendingCount(getOfflineQueueSize());

    const handleOnline = async () => {
      setIsOffline(false);
      const queueSize = getOfflineQueueSize();
      if (queueSize > 0) {
        setSyncMessage(`Syncing ${queueSize} pending submission(s)...`);
        const result = await processOfflineQueue();
        if (result.sent > 0) {
          setSyncMessage(`✓ Synced ${result.sent} submission(s) successfully!`);
          setTimeout(() => setSyncMessage(null), 4000);
        } else {
          setSyncMessage(null);
        }
        setPendingCount(getOfflineQueueSize());
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check queue on initial load too
    if (navigator.onLine && getOfflineQueueSize() > 0) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem('brainTestState', JSON.stringify(state));
    }
  }, [state, loaded]);

  // Update pending count periodically when offline
  useEffect(() => {
    if (!isOffline) return;
    const interval = setInterval(() => {
      setPendingCount(getOfflineQueueSize());
    }, 2000);
    return () => clearInterval(interval);
  }, [isOffline]);

  const setSessionId = (id: string, name: string, idNum: string) => setState(s => ({ 
    ...s, 
    sessionId: id,
    participantName: name,
    participantIdNumber: idNum
  }));
  const setConsentGiven = (given: boolean) => setState(s => ({ ...s, consentGiven: given }));
  const markTestCompleted = (testId: string) => setState(s => ({
    ...s,
    completedTests: Array.from(new Set([...s.completedTests, testId]))
  }));
  const resetSession = () => {
    const newState = { 
      sessionId: null, 
      consentGiven: false, 
      participantName: null, 
      participantIdNumber: null, 
      completedTests: [] 
    };
    setState(newState);
    localStorage.removeItem('brainTestState');
  };

  if (!loaded) return null; // Avoid hydration mismatch

  return (
    <AppContext.Provider value={{ state, setSessionId, setConsentGiven, markTestCompleted, resetSession }}>
      {/* Offline / Sync Status Banner */}
      {(isOffline || syncMessage) && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
          padding: "10px 16px",
          textAlign: "center",
          fontSize: "13px",
          fontWeight: 600,
          color: "#fff",
          background: isOffline 
            ? "linear-gradient(90deg, #D97706, #B45309)" 
            : "linear-gradient(90deg, #059669, #047857)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          transition: "all 0.3s ease",
        }}>
          {isOffline 
            ? `📡 You are offline. Results will be saved locally.${pendingCount > 0 ? ` (${pendingCount} pending)` : ""}`
            : syncMessage
          }
        </div>
      )}
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

