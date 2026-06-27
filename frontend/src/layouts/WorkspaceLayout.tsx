import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { AIPanel } from "./AIPanel";
import { useAI } from "@/contexts/AIContext";

export function WorkspaceLayout() {
  const location = useLocation();
  const { setContext, state } = useAI();

  // Auto-update AI context based on route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/meetings/")) {
      setContext("meeting");
    } else if (path.includes("/teams/")) {
      setContext("team");
    } else if (path.includes("/analysis")) {
      setContext("analysis");
    } else if (path.includes("/projects/")) {
      setContext("project");
    } else {
      setContext("global");
    }
  }, [location.pathname, setContext]);

  return (
    <div className="flex min-h-screen bg-background">
      <WorkspaceSidebar />
      
      <main 
        className="flex-1 transition-layout pl-[72px]"
      >
        <div className={`mx-auto h-full w-full max-w-7xl p-8 md:p-10 transition-layout ${state.isOpen ? 'pr-[384px]' : ''}`}>
          <Outlet />
        </div>
      </main>

      <AIPanel />
    </div>
  );
}
