import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, FolderOpen, Users, Settings, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAI } from "@/contexts/AIContext";

export function WorkspaceSidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();
  const { togglePanel } = useAI();

  const isManager = user?.role === "manager";

  const navItems = [
    { icon: Home, label: "Home", to: "/dashboard" },
    { icon: FolderOpen, label: "Projects", to: "/projects" },
    ...(isManager ? [{ icon: Users, label: "People", to: "/people" }] : []),
    { icon: Settings, label: "Settings", to: "/settings" },
  ];

  return (
    <motion.aside
      initial={{ width: 72 }}
      animate={{ width: isHovered ? 220 : 72 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed left-0 top-0 z-50 flex h-screen flex-col border-r bg-background shadow-sm transition-layout"
    >
      <div className="flex h-16 items-center justify-center border-b">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">
          S
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-4 rounded-md px-3 py-2.5 transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {isHovered && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap text-sm"
              >
                {item.label}
              </motion.span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3">
        <button
          onClick={togglePanel}
          className="flex w-full items-center gap-4 rounded-md bg-accent/50 px-3 py-2.5 text-accent-foreground transition-colors hover:bg-accent"
        >
          <Sparkles className="h-5 w-5 shrink-0 text-primary" />
          {isHovered && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="whitespace-nowrap text-sm font-medium"
            >
              Ask AI
            </motion.span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
