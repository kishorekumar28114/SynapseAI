import { useState, useEffect } from "react";
import {
  BarChart2, TrendingUp, Target, MessageSquare,
  CheckCircle, Clock, AlertTriangle, Users
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend
} from "recharts";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { analyticsApi, teamsApi } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import type { Team, TeamAnalytics, MeetingAnalytics } from "../../types";
import { SENTIMENT_COLORS } from "../../lib/constants";
import { truncate } from "../../lib/utils";

const CHART_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
      <p style={{ color: "var(--text-muted)", marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color || p.fill || "#818cf8", fontWeight: 600, marginBottom: 2 }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [meetingAnalytics, setMeetingAnalytics] = useState<MeetingAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Managers see all their teams; employees auto-load their own team
    const fetchTeams = isManager ? teamsApi.list : teamsApi.myTeams;
    fetchTeams().then((t) => {
      setTeams(t);
      if (t.length > 0) setSelectedTeamId(t[0].id);
    });
  }, [isManager]);

  useEffect(() => {
    if (!selectedTeamId) return;
    setIsLoading(true);
    Promise.all([
      analyticsApi.teamAnalytics(selectedTeamId),
      analyticsApi.meetingsAnalytics(selectedTeamId),
    ])
      .then(([a, m]) => { setAnalytics(a); setMeetingAnalytics(m); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedTeamId]);

  // Derived chart data
  const efficiencyTrendData = meetingAnalytics
    .filter((m) => m.efficiency_score !== null)
    .slice(-10)
    .map((m) => ({
      name: truncate(m.title, 14),
      "Efficiency": m.efficiency_score ?? 0,
      "Productive %": m.productive_pct ?? 0,
      "Off-Topic %": m.off_topic_pct ?? 0,
    }));

  const sentimentPieData = meetingAnalytics.reduce((acc, m) => {
    const s = m.overall_sentiment ?? "neutral";
    const existing = acc.find((a) => a.name === s);
    if (existing) existing.value++;
    else acc.push({ name: s, value: 1 });
    return acc;
  }, [] as { name: string; value: number }[]);

  const priorityData = analytics
    ? [
        { subject: "Critical", value: analytics.task_by_priority.critical },
        { subject: "High", value: analytics.task_by_priority.high },
        { subject: "Medium", value: analytics.task_by_priority.medium },
        { subject: "Low", value: analytics.task_by_priority.low },
      ]
    : [];

  const taskCompletionData = analytics
    ? [
        { name: "Completed", value: analytics.completed_tasks, fill: "#10b981" },
        { name: "Pending", value: analytics.pending_tasks, fill: "#6366f1" },
      ]
    : [];

  const kpis = analytics
    ? [
        { label: "Total Meetings", value: analytics.total_meetings, sub: `${analytics.completed_meetings} analyzed`, icon: <BarChart2 size={18} />, color: "#818cf8" },
        { label: "Avg Efficiency", value: analytics.avg_efficiency_score ? `${analytics.avg_efficiency_score}%` : "—", sub: "Meeting quality score", icon: <Target size={18} />, color: "#34d399" },
        { label: "Total Tasks", value: analytics.total_tasks, sub: `${analytics.completed_tasks} completed`, icon: <CheckCircle size={18} />, color: "#fbbf24" },
        { label: "Avg Sentiment", value: analytics.avg_sentiment_score !== null ? analytics.avg_sentiment_score!.toFixed(2) : "—", sub: "Team mood score", icon: <MessageSquare size={18} />, color: "#f472b6" },
      ]
    : [];

  return (
    <DashboardLayout title="Analytics" subtitle="AI-powered insights across your team's meetings">
      {/* Team Selector — only shown to managers; employees auto-load their team */}
      {isManager && (
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
          Team:
        </label>
        <select
          className="form-input"
          style={{ width: 220 }}
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
        >
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          {teams.length === 0 && <option value="">No teams</option>}
        </select>
      </div>
      )}

      {isLoading ? (
        <div style={{ display: "grid", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />)}
          </div>
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton" style={{ height: 260, borderRadius: 16 }} />)}
        </div>
      ) : !analytics ? (
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <BarChart2 size={52} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
          <h3 style={{ marginBottom: 8 }}>No analytics yet</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Upload and analyze meetings to see insights here.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
            {kpis.map((kpi) => (
              <div key={kpi.label} className="kpi-card">
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${kpi.color}18`, border: `1px solid ${kpi.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: kpi.color, marginBottom: 14 }}>
                  {kpi.icon}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>{kpi.value}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{kpi.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Main Charts Row */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
            {/* Efficiency Trend */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600 }}>Meeting Efficiency Trend</h3>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Efficiency & productive time across meetings</p>
                </div>
                <TrendingUp size={16} style={{ color: "var(--accent)" }} />
              </div>
              <div className="card-body" style={{ height: 260 }}>
                {efficiencyTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={efficiencyTrendData}>
                      <defs>
                        {[["effGrad", "#6366f1"], ["prodGrad", "#10b981"], ["offGrad", "#f59e0b"]].map(([id, color]) => (
                          <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} unit="%" />
                      <Tooltip content={<DarkTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                      <Area type="monotone" dataKey="Efficiency" stroke="#6366f1" fill="url(#effGrad)" strokeWidth={2.5} />
                      <Area type="monotone" dataKey="Productive %" stroke="#10b981" fill="url(#prodGrad)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Off-Topic %" stroke="#f59e0b" fill="url(#offGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>
                    No analyzed meetings yet
                  </div>
                )}
              </div>
            </div>

            {/* Sentiment Distribution */}
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Sentiment Distribution</h3>
              </div>
              <div className="card-body" style={{ height: 260 }}>
                {sentimentPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentPieData}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {sentimentPieData.map((entry) => (
                          <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name.toLowerCase()] || "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip content={<DarkTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>No data</div>
                )}
              </div>
            </div>
          </div>

          {/* Second Charts Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            {/* Task Priority Bar */}
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Task Priority Breakdown</h3>
              </div>
              <div className="card-body" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="value" name="Tasks" radius={[6, 6, 0, 0]}>
                      {priorityData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Task Completion Donut */}
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Task Completion Rate</h3>
              </div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 220, gap: 24 }}>
                <div style={{ position: "relative", width: 140, height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={taskCompletionData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                        {taskCompletionData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
                      {analytics.total_tasks > 0 ? `${Math.round((analytics.completed_tasks / analytics.total_tasks) * 100)}%` : "—"}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Done</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 20 }}>
                  {taskCompletionData.map((d) => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: d.fill }} />
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{d.name}: <strong style={{ color: "var(--text-primary)" }}>{d.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Per-Meeting Table */}
          {meetingAnalytics.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Per-Meeting Analytics</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Meeting</th>
                    <th>Efficiency</th>
                    <th>Productive %</th>
                    <th>Off-Topic %</th>
                    <th>Sentiment</th>
                    <th>Action Items</th>
                  </tr>
                </thead>
                <tbody>
                  {meetingAnalytics.map((m) => (
                    <tr key={m.meeting_id}>
                      <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{truncate(m.title, 36)}</td>
                      <td>
                        {m.efficiency_score !== null ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="progress-bar" style={{ width: 80 }}>
                              <div className="progress-fill" style={{ width: `${m.efficiency_score}%` }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{m.efficiency_score.toFixed(0)}%</span>
                          </div>
                        ) : "—"}
                      </td>
                      <td style={{ color: "#34d399", fontWeight: 600 }}>{m.productive_pct !== null ? `${m.productive_pct.toFixed(0)}%` : "—"}</td>
                      <td style={{ color: "#f59e0b", fontWeight: 600 }}>{m.off_topic_pct !== null ? `${m.off_topic_pct.toFixed(0)}%` : "—"}</td>
                      <td>
                        {m.overall_sentiment && (
                          <span className="badge" style={{ background: `${SENTIMENT_COLORS[m.overall_sentiment] || "#94a3b8"}18`, color: SENTIMENT_COLORS[m.overall_sentiment] || "#94a3b8", border: `1px solid ${SENTIMENT_COLORS[m.overall_sentiment] || "#94a3b8"}30`, textTransform: "capitalize" }}>
                            {m.overall_sentiment}
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{m.action_items_count ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
