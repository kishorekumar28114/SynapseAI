import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type AIContextType = "global" | "project" | "meeting" | "team" | "analysis";

export interface AIState {
  isOpen: boolean;
  contextType: AIContextType;
  contextId?: string;
  contextData?: any;
}

interface AIContextProps {
  state: AIState;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  setContext: (type: AIContextType, id?: string, data?: any) => void;
}

const AIContext = createContext<AIContextProps | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AIState>({
    isOpen: false,
    contextType: "global",
  });

  const openPanel = useCallback(() => setState((s) => ({ ...s, isOpen: true })), []);
  const closePanel = useCallback(() => setState((s) => ({ ...s, isOpen: false })), []);
  const togglePanel = useCallback(() => setState((s) => ({ ...s, isOpen: !s.isOpen })), []);
  
  const setContext = useCallback((type: AIContextType, id?: string, data?: any) => {
    setState((s) => {
      // Prevent unnecessary state updates if context hasn't changed
      if (s.contextType === type && s.contextId === id && s.contextData === data) return s;
      return { ...s, contextType: type, contextId: id, contextData: data };
    });
  }, []);

  return (
    <AIContext.Provider value={{ state, openPanel, closePanel, togglePanel, setContext }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error("useAI must be used within an AIProvider");
  }
  return context;
}
