import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users, Video, BarChart2, TrendingUp, FolderOpen,
  Clock, CheckCircle, AlertCircle, ArrowRight, Cpu
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { KPICard } from "../../components/common/KPICard";
import { useAuth } from "../../contexts/AuthContext";
import { analyticsApi, teamsApi, employeesApi, meetingsApi } from "../../api";
import type { Team, Employee, Meeting, TeamAnalytics, MeetingAnalytics } from "../../types";
import { MEETING_STATUS_COLORS, SENTIMENT_COLORS } from "../../lib/constants";
import { formatRelativeTime, truncate } from "../../lib/utils";

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: "var(--bg-elevated)", border: "1px solid var(--border)",
        borderRadius: 10, padding: "10px 14px", fontSize: 12
      }}>
        <p style={{ color: "var(--text-muted)", marginBottom: 4 }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [meetingAnalytics, setMeetingAnalytics] = useState<MeetingAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsData, empData, meetingsData] = await Promise.all([
          teamsApi.list(),
          employeesApi.list(),
          meetingsApi.myMeetings(),
        ]);
        setTeams(teamsData);
        setEmployees(empData);
        setMeetings(meetingsData);

        // Load analytics for first team
        if (teamsData.length > 0) {
          const [analyticsData, mAnalytics] = await Promise.all([
            analyticsApi.teamAnalytics(teamsData[0].id),
            analyticsApi.meetingsAnalytics(teamsData[0].id),
          ]);
          setAnalytics(analyticsData);
          setMeetingAnalytics(mAnalytics);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const completedMeetings = meetings.filter((m) => m.status === "completed").length;
  const avgScore = analytics?.avg_efficiency_score ?? 0;

  // Chart data
  const taskPriorityData = analytics
    ? Object.entries(analytics.task_by_priority).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value,
      }))
    : [];

  const efficiencyChartData = meetingAnalytics.slice(-8).map((m) => ({
    name: truncate(m.title, 12),
    score: m.efficiency_score ?? 0,
    sentiment: ((m.sentiment_score ?? 0) + 1) * 50,
  }));

  const sentimentData = meetingAnalytics.reduce((acc, m) => {
    const s = m.overall_sentiment ?? "neutral";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentimentPieData = Object.entries(sentimentData).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 28 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="kpi-card skeleton" style={{ height: 140 }} />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.full_name?.split(" ")[0]} 👋`}
      subtitle="Here's what's happening across your teams"
    >
      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 28 }}>
        <KPICard
          title="Total Teams"
          value={teams.length}
          subtitle="Active workspaces"
          icon={<Users size={20} />}
          color="accent"
        />
        <KPICard
          title="Employees"
          value={employees.length}
          subtitle="Across all teams"
          icon={<Users size={20} />}
          color="cyan"
        />
        <KPICard
          title="Meetings Analyzed"
          value={completedMeetings}
          subtitle={`of ${meetings.length} total`}
          icon={<Video size={20} />}
          color="green"
        />
        <KPICard
          title="Avg Efficiency"
          value={avgScore ? `${avgScore}%` : "—"}
          subtitle="Meeting productivity score"
          icon={<TrendingUp size={20} />}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 28 }}>
        {/* Meeting Efficiency Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Meeting Efficiency Trend</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Efficiency & sentiment scores across recent meetings
              </p>
            </div>
            <BarChart2 size={18} style={{ color: "var(--accent)" }} />
          </div>
          <div className="card-body" style={{ height: 240 }}>
            {efficiencyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={efficiencyChartData}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                  <Area type="monotone" dataKey="score" name="Efficiency" stroke="#6366f1" fill="url(#scoreGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="sentiment" name="Sentiment" stroke="#10b981" fill="url(#sentGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: 13 }}>
                No analyzed meetings yet
              </div>
            )}
          </div>
        </div>

        {/* Sentiment Pie */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Sentiment Breakdown</h3>
          </div>
          <div className="card-body" style={{ height: 240 }}>
            {sentimentPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sentimentPieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={SENTIMENT_COLORS[entry.name.toLowerCase()] ?? "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: 13 }}>
                No data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Teams + Recent Meetings */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Teams */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Your Teams</h3>
            <Link to="/teams" style={{ fontSize: 12, color: "var(--accent-hover)", display: "flex", alignItems: "center", gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div>
            {teams.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No teams yet. <Link to="/teams" style={{ color: "var(--accent)" }}>Create your first team</Link>
              </div>
            ) : (
              teams.slice(0, 4).map((team) => (
                <Link
                  key={team.id}
                  to={`/teams/${team.id}`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 24px", borderBottom: "1px solid var(--border)",
                    textDecoration: "none", transition: "background 0.15s"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "linear-gradient(135deg, var(--accent), var(--violet))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700, color: "white"
                    }}>
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{team.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{team.member_count} members</div>
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Meetings */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Meetings</h3>
            <Link to="/meetings" style={{ fontSize: 12, color: "var(--accent-hover)", display: "flex", alignItems: "center", gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div>
            {meetings.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No meetings uploaded yet.
              </div>
            ) : (
              meetings.slice(0, 5).map((meeting) => {
                const statusColors = MEETING_STATUS_COLORS[meeting.status] || "";
                return (
                  <Link
                    key={meeting.id}
                    to={`/meetings/${meeting.id}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 24px", borderBottom: "1px solid var(--border)",
                      textDecoration: "none", transition: "background 0.15s"
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {meeting.status === "completed" ? (
                        <CheckCircle size={14} style={{ color: "#34d399", flexShrink: 0 }} />
                      ) : meeting.status === "failed" ? (
                        <AlertCircle size={14} style={{ color: "#f87171", flexShrink: 0 }} />
                      ) : (
                        <Clock size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
                      )}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                          {truncate(meeting.title, 30)}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {formatRelativeTime(meeting.created_at)}
                        </div>
                      </div>
                    </div>
                    <span className={`badge ${statusColors}`} style={{ fontSize: 10 }}>
                      {meeting.status}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Task Priority Chart */}
      {analytics && taskPriorityData.some((d) => d.value > 0) && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Task Priority Distribution</h3>
          </div>
          <div className="card-body" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskPriorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Tasks" radius={[6, 6, 0, 0]}>
                  {taskPriorityData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
