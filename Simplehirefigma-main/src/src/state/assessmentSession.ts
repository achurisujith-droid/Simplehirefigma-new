/**
 * Assessment Session State
 * Simple Zustand store for managing assessment session
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AssessmentSessionState {
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  clearSession: () => void;
}

export const useAssessmentSession = create<AssessmentSessionState>()(
  persist(
    (set) => ({
      sessionId: null,
      setSessionId: (id) => set({ sessionId: id }),
      clearSession: () => set({ sessionId: null }),
    }),
    {
      name: 'assessment-session', // localStorage key
    }
  )
);
