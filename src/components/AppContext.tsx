"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem('brainTestState', JSON.stringify(state));
    }
  }, [state, loaded]);

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
