import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Brain, CheckCircle, Clock, AlertCircle,
  BarChart2, MessageSquare, Target, TrendingUp, Users, Zap
} from "lucide-react";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { analyticsApi, meetingsApi, aiApi } from "../../api";
import type { Meeting, MeetingAnalysisDetail } from "../../types";
import { PRIORITY_COLORS, MEETING_STATUS_COLORS, SENTIMENT_COLORS } from "../../lib/constants";
import { formatDate, truncate } from "../../lib/utils";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
        <p style={{ color: "var(--text-muted)", marginBottom: 4 }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [analysis, setAnalysis] = useState<MeetingAnalysisDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [meetingData, analysisData] = await Promise.all([
          meetingsApi.get(id),
          analyticsApi.meetingDetail(id),
        ]);
        setMeeting(meetingData);
        setAnalysis(analysisData.tasks ? analysisData : null);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleTriggerAI = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      await aiApi.triggerProcessing(id);
      // Poll status
      const poll = setInterval(async () => {
        const status = await aiApi.getStatus(id);
        if (status.status === "completed" || status.status === "failed") {
          clearInterval(poll);
          setIsProcessing(false);
          window.location.reload();
        }
      }, 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to start AI processing");
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Meeting Details">
        <div style={{ display: "grid", gap: 20 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
        </div>
      </DashboardLayout>
    );
  }

  if (!meeting) {
    return <DashboardLayout title="Meeting Details"><p style={{ color: "var(--text-muted)" }}>Meeting not found.</p></DashboardLayout>;
  }

  const productivityData = analysis ? [
    { name: "Productive", value: analysis.productive_discussion_pct, fill: "#10b981" },
    { name: "Off-Topic", value: analysis.off_topic_discussion_pct, fill: "#f59e0b" },
    { name: "Remaining", value: Math.max(0, 100 - analysis.productive_discussion_pct - analysis.off_topic_discussion_pct), fill: "#334155" },
  ] : [];

  const participationData = analysis?.participation_insights?.map((p) => ({
    name: p.speaker.split(" ")[0],
    contribution: p.contribution_estimate_pct,
  })) ?? [];

  return (
    <DashboardLayout title={meeting.title} subtitle={`Meeting details · ${formatDate(meeting.created_at)}`}>
      {/* Back */}
      <Link to="/meetings" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, marginBottom: 24, textDecoration: "none" }}>
        <ArrowLeft size={14} /> Back to Meetings
      </Link>

      {/* Status Bar */}
      <div className="card" style={{ marginBottom: 20, padding: "16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span className={`badge ${MEETING_STATUS_COLORS[meeting.status] || ""}`}>{meeting.status}</span>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Type: {meeting.file_type.toUpperCase()}</span>
            {meeting.file_size && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Size: {(meeting.file_size / 1024 / 1024).toFixed(1)} MB</span>}
            {analysis?.model_used && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>AI: {analysis.model_used}</span>}
          </div>
          {(meeting.status === "uploaded" || meeting.status === "transcribed") && (
            <button onClick={handleTriggerAI} className="btn btn-primary" disabled={isProcessing}>
              <Brain size={15} />
              {isProcessing ? "Processing..." : "Run AI Analysis"}
            </button>
          )}
        </div>
      </div>

      {/* No analysis yet */}
      {!analysis && (
        <div style={{ textAlign: "center", padding: "60px 24px" }}>
          <Brain size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
          <h3 style={{ marginBottom: 8 }}>No AI Analysis Yet</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>
            Run AI analysis to get summary, tasks, sentiment, and productivity metrics.
          </p>
          {meeting.status === "uploaded" && (
            <button onClick={handleTriggerAI} className="btn btn-primary" disabled={isProcessing}>
              <Brain size={15} /> {isProcessing ? "Processing..." : "Start AI Analysis"}
            </button>
          )}
        </div>
      )}

      {/* Analysis Content */}
      {analysis && (
        <>
          {/* KPI Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Efficiency Score", value: `${analysis.meeting_efficiency_score?.toFixed(0)}%`, icon: <Target size={18} />, color: "#818cf8" },
              { label: "Sentiment Score", value: analysis.overall_sentiment, icon: <MessageSquare size={18} />, color: SENTIMENT_COLORS[analysis.overall_sentiment] || "#94a3b8" },
              { label: "Action Items", value: analysis.action_items_count, icon: <CheckCircle size={18} />, color: "#34d399" },
              { label: "Processing Time", value: `${analysis.processing_time_seconds?.toFixed(0)}s`, icon: <Zap size={18} />, color: "#fbbf24" },
            ].map((kpi) => (
              <div key={kpi.label} className="kpi-card">
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${kpi.color}20`, border: `1px solid ${kpi.color}40`, display: "flex", alignItems: "center", justifyContent: "center", color: kpi.color, marginBottom: 12 }}>
                  {kpi.icon}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4, textTransform: "capitalize" }}>{kpi.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Summary + Key Points */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: 15, fontWeight: 600 }}>Meeting Summary</h3></div>
              <div className="card-body">
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: 14 }}>{analysis.summary}</p>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: 15, fontWeight: 600 }}>Key Points</h3></div>
              <div className="card-body">
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {analysis.key_points?.map((point, i) => (
                    <li key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent)", fontWeight: 700, flexShrink: 0 }}>•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            {/* Productivity Pie */}
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: 15, fontWeight: 600 }}>Discussion Breakdown</h3></div>
              <div className="card-body" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={productivityData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {productivityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Participation Bar */}
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: 15, fontWeight: 600 }}>Participation</h3></div>
              <div className="card-body" style={{ height: 220 }}>
                {participationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={participationData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8", fontSize: 12 }} width={70} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="contribution" name="Contribution %" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: 13 }}>
                    <Users size={20} style={{ marginRight: 8 }} /> No participation data
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Extracted Tasks ({analysis.tasks?.length ?? 0})</h3>
            </div>
            {analysis.tasks?.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No tasks extracted</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Priority</th>
                    <th>Assignee</th>
                    <th>Deadline</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.tasks?.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <div style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: 13 }}>{task.title}</div>
                        {task.description && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{truncate(task.description, 80)}</div>}
                      </td>
                      <td><span className={`badge ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span></td>
                      <td style={{ fontSize: 13 }}>{task.assignee ?? "—"}</td>
                      <td style={{ fontSize: 12 }}>{task.deadline ? formatDate(task.deadline) : "—"}</td>
                      <td><span className="badge" style={{ background: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}>{task.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Improvements */}
          {analysis.improvement_suggestions?.length > 0 && (
            <div className="card">
              <div className="card-header"><h3 style={{ fontSize: 15, fontWeight: 600 }}>Improvement Suggestions</h3></div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {analysis.improvement_suggestions.map((s, i) => (
                    <div key={i} style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent)", marginRight: 8 }}>→</span>{s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
