"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { processOfflineQueue, getOfflineQueueSize, getDeadLetterCount, clearDeadLetters } from '@/utils/offlineSync';

export type Language = 'en' | 'bn' | 'hi' | 'mr';

type AppState = {
  consentGiven: boolean;
  sessionId: string | null;
  participantName: string | null;
  username: string | null;
  participantIdNumber: string | null;
  completedTests: string[];
  language: Language;
};

type AppContextType = {
  state: AppState;
  setSessionId: (id: string, name: string, idNum?: string | null, completedTests?: string[], username?: string | null) => void;
  loginParticipant: (id: string, name: string, idNum?: string | null, completedTests?: string[], username?: string | null) => void;
  setConsentGiven: (given: boolean) => void;
  markTestCompleted: (testId: string) => void;
  resetSession: () => void;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppState = {
  consentGiven: false,
  sessionId: null,
  participantName: null,
  username: null,
  participantIdNumber: null,
  completedTests: [],
  language: 'en',
};

const STATE_KEY = 'neuroCogniLabState';
const LEGACY_STATE_KEY = 'brainTestState';
// Bump when the shape of AppState changes incompatibly; older blobs are discarded.
const STATE_VERSION = 1;
const STATE_VERSION_KEY = 'neuroCogniLabStateVersion';

/**
 * Restores persisted state, tolerating blobs written by older builds.
 * Always merged over initialState so a missing field (e.g. completedTests)
 * can never surface as undefined and crash consumers.
 */
function loadPersistedState(): AppState {
  try {
    const savedVersion = Number(localStorage.getItem(STATE_VERSION_KEY) || localStorage.getItem('brainTestStateVersion') || '0');
    if (savedVersion !== STATE_VERSION) {
      localStorage.removeItem(STATE_KEY);
      localStorage.removeItem(LEGACY_STATE_KEY);
      localStorage.setItem(STATE_VERSION_KEY, String(STATE_VERSION));
      return initialState;
    }

    const saved = localStorage.getItem(STATE_KEY) || localStorage.getItem(LEGACY_STATE_KEY);
    if (!saved) return initialState;

    const parsed = JSON.parse(saved) as Partial<AppState>;
    if (!parsed || typeof parsed !== 'object') return initialState;

    return {
      ...initialState,
      ...parsed,
      // Defend against these two specifically — consumers call array/string
      // methods on them directly.
      completedTests: Array.isArray(parsed.completedTests) ? parsed.completedTests : [],
      language: (parsed.language && ['en', 'bn', 'hi', 'mr'].includes(parsed.language)) ? parsed.language as Language : 'en',
    };
  } catch (e) {
    console.error('Failed to restore saved state, starting fresh', e);
    return initialState;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  // Submissions the server rejected permanently (4xx). These will never sync,
  // so the participant/researcher must be told rather than left believing
  // everything uploaded.
  const [failedCount, setFailedCount] = useState(0);

  useEffect(() => {
    setState(loadPersistedState());
    setLoaded(true);

    // Set initial online/offline status
    setIsOffline(!navigator.onLine);
    setPendingCount(getOfflineQueueSize());
    setFailedCount(getDeadLetterCount());

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
      // Surface permanent failures rather than letting data vanish quietly.
      setFailedCount(getDeadLetterCount());
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
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      localStorage.setItem(STATE_VERSION_KEY, String(STATE_VERSION));
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

  const setSessionId = (id: string, name: string, idNum?: string | null, completedTests?: string[], username?: string | null) => setState(s => ({ 
    ...s, 
    sessionId: id,
    participantName: name,
    username: username !== undefined ? username : s.username,
    participantIdNumber: idNum !== undefined ? idNum : s.participantIdNumber,
    completedTests: completedTests ? Array.from(new Set([...s.completedTests, ...completedTests])) : s.completedTests,
    consentGiven: true
  }));

  const loginParticipant = (id: string, name: string, idNum?: string | null, completedTests?: string[], username?: string | null) => {
    setState(s => ({
      ...s,
      sessionId: id,
      participantName: name,
      username: username !== undefined ? username : null,
      participantIdNumber: idNum !== undefined ? idNum : null,
      completedTests: completedTests || [],
      consentGiven: true
    }));
  };

  const setConsentGiven = (given: boolean) => setState(s => ({ ...s, consentGiven: given }));
  const markTestCompleted = (testId: string) => setState(s => ({
    ...s,
    completedTests: Array.from(new Set([...s.completedTests, testId]))
  }));
  const resetSession = () => {
    const newState: Partial<AppState> = { 
      sessionId: null, 
      consentGiven: false, 
      participantName: null, 
      username: null,
      participantIdNumber: null, 
      completedTests: []
    };
    setState(s => ({...s, ...newState}));
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(LEGACY_STATE_KEY);
  };

  const LANGUAGES: Language[] = ['en', 'hi', 'mr', 'bn'];

  const toggleLanguage = () => setState(s => {
    const currentIndex = LANGUAGES.indexOf(s.language);
    const nextIndex = (currentIndex + 1) % LANGUAGES.length;
    return { ...s, language: LANGUAGES[nextIndex] };
  });

  const setLanguage = (lang: Language) => setState(s => ({ ...s, language: lang }));

  if (!loaded) return null; // Avoid hydration mismatch

  return (
    <AppContext.Provider value={{ state, setSessionId, loginParticipant, setConsentGiven, markTestCompleted, resetSession, toggleLanguage, setLanguage }}>
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

      {/* Permanent upload failures — never fail silently, this is research data. */}
      {failedCount > 0 && (
        <div style={{
          position: "fixed",
          top: (isOffline || syncMessage) ? 40 : 0,
          left: 0,
          right: 0,
          zIndex: 10000,
          padding: "10px 16px",
          textAlign: "center",
          fontSize: "13px",
          fontWeight: 600,
          color: "#fff",
          background: "linear-gradient(90deg, #DC2626, #991B1B)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}>
          <span>
            ⚠️ {failedCount} submission(s) could not be uploaded. Please inform the study coordinator.
          </span>
          <button
            onClick={() => { clearDeadLetters(); setFailedCount(0); }}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.5)",
              color: "#fff",
              borderRadius: 4,
              padding: "2px 10px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Dismiss
          </button>
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

