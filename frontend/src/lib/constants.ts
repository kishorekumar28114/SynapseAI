export const APP_NAME = "SynapseAI";
export const APP_TAGLINE = "Smart Meeting Intelligence";

export const ROLES = {
  MANAGER: "manager",
  TEAM_LEAD: "team_lead",
  TEAM_MEMBER: "team_member",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  manager: "Manager",
  team_lead: "Team Lead",
  team_member: "Team Member",
};

export const MEETING_STATUS_COLORS: Record<string, string> = {
  uploaded: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  transcribing: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  transcribed: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  processing: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

export const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#22c55e",
  negative: "#ef4444",
  neutral: "#94a3b8",
  mixed: "#f59e0b",
};
