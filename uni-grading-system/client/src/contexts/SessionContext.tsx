import React, { createContext, useContext, useState, useEffect } from 'react';

interface SessionContextType {
  session: string;
  semester: string;
  setSession: (s: string) => void;
  setSemester: (s: string) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState(() => {
    return localStorage.getItem('ugs_session') || '2024/2025';
  });
  const [semester, setSemesterState] = useState(() => {
    return localStorage.getItem('ugs_semester') || 'first';
  });

  const setSession = (s: string) => {
    setSessionState(s);
    localStorage.setItem('ugs_session', s);
  };

  const setSemester = (s: string) => {
    setSemesterState(s);
    localStorage.setItem('ugs_semester', s);
  };

  return (
    <SessionContext.Provider value={{ session, semester, setSession, setSemester }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
