// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string | null;
  username: string;
  full_name: string;
  role: "manager" | "team_lead" | "team_member";
  avatar_url: string | null;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ─── Teams ───────────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  email: string | null;
  role_in_team: "team_lead" | "team_member";
  joined_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  manager_id: string;
  is_active: boolean;
  created_at: string;
  member_count: number;
  project_id: string | null;
  members?: TeamMember[];
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string | null;
  client_requirements: string | null;
  requirements_file_path: string | null;
  deadline: string | null;
  budget: number | null;
  team_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  // AI analysis fields
  ai_difficulty: string | null;
  ai_teams_needed: number | null;
  ai_budget_estimate: string | null;
  ai_time_estimate: string | null;
  ai_analysis_summary: string | null;
  ai_analysis_status: string | null;
}

// ─── Meetings ─────────────────────────────────────────────────────────────────

export type MeetingStatus =
  | "uploaded"
  | "transcribing"
  | "transcribed"
  | "processing"
  | "completed"
  | "failed";

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_type: string;
  file_size: number | null;
  status: MeetingStatus;
  duration_seconds: number | null;
  team_id: string;
  project_id: string | null;
  uploaded_by: string;
  meeting_date: string | null;
  created_at: string;
  has_transcript: boolean;
  has_analysis: boolean;
  efficiency_score: number | null;
  summary_preview: string | null;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string | null;
  assignee: string | null;
}

// ─── AI Analysis ──────────────────────────────────────────────────────────────

export interface ParticipationInsight {
  speaker: string;
  contribution_estimate_pct: number;
  sentiment: string;
  engagement_level: string;
  key_contributions: string[];
}

export interface MeetingAnalysisDetail {
  summary: string;
  key_points: string[];
  overall_sentiment: string;
  sentiment_score: number;
  meeting_efficiency_score: number;
  productive_discussion_pct: number;
  off_topic_discussion_pct: number;
  action_items_count: number;
  participation_insights: ParticipationInsight[];
  improvement_suggestions: string[];
  decisions_made: string[];
  processing_time_seconds: number;
  model_used: string;
  tasks: Task[];
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface TeamAnalytics {
  total_meetings: number;
  completed_meetings: number;
  pending_meetings: number;
  avg_efficiency_score: number | null;
  avg_sentiment_score: number | null;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  task_by_priority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface MeetingAnalytics {
  meeting_id: string;
  title: string;
  efficiency_score: number | null;
  sentiment_score: number | null;
  productive_pct: number | null;
  off_topic_pct: number | null;
  action_items_count: number | null;
  overall_sentiment: string | null;
}

// ─── Employees ────────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  username: string;
  full_name: string;
  email: string | null;
  role: "manager" | "team_lead" | "team_member";
  is_active: boolean;
  created_at: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
