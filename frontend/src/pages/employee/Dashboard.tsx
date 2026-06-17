import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Video, CheckCircle, Clock, FolderOpen, ArrowRight, AlertCircle } from "lucide-react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { KPICard } from "../../components/common/KPICard";
import { useAuth } from "../../contexts/AuthContext";
import { meetingsApi, projectsApi } from "../../api";
import type { Meeting, Project } from "../../types";
import { MEETING_STATUS_COLORS, PRIORITY_COLORS } from "../../lib/constants";
import { formatRelativeTime, truncate } from "../../lib/utils";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const meetingsData = await meetingsApi.myMeetings();
        setMeetings(meetingsData);
        // Projects will be loaded per-team; show a generic list for now
      } catch (err) {
        console.error("Failed to load employee data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const completedMeetings = meetings.filter((m) => m.status === "completed");
  const analyzedCount = meetings.filter((m) => m.has_analysis).length;
  const avgScore = completedMeetings.length > 0
    ? completedMeetings
        .filter((m) => m.efficiency_score !== null)
        .reduce((sum, m) => sum + (m.efficiency_score ?? 0), 0) /
      Math.max(completedMeetings.filter((m) => m.efficiency_score !== null).length, 1)
    : 0;

  return (
    <DashboardLayout
      title={`Hello, ${user?.full_name?.split(" ")[0]} 👋`}
      subtitle="Your meetings and responsibilities"
    >
      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 28 }}>
        <KPICard
          title="Total Meetings"
          value={meetings.length}
          subtitle="In your teams"
          icon={<Video size={20} />}
          color="accent"
        />
        <KPICard
          title="AI Analyzed"
          value={analyzedCount}
          subtitle="With insights available"
          icon={<CheckCircle size={20} />}
          color="green"
        />
        <KPICard
          title="Avg Efficiency"
          value={avgScore ? `${avgScore.toFixed(0)}%` : "—"}
          subtitle="Team meeting quality"
          icon={<Clock size={20} />}
          color="orange"
        />
      </div>

      {/* Recent Meetings */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Meetings</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Meetings in your teams
            </p>
          </div>
          <Link to="/meetings" style={{ fontSize: 12, color: "var(--accent-hover)", display: "flex", alignItems: "center", gap: 4 }}>
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {isLoading ? (
          <div style={{ padding: 24 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 56, marginBottom: 8, borderRadius: 8 }} />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No meetings available yet. Your team lead will upload meetings.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Meeting</th>
                <th>Status</th>
                <th>Efficiency</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {meetings.slice(0, 8).map((meeting) => (
                <tr key={meeting.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {meeting.status === "completed" ? (
                        <CheckCircle size={14} style={{ color: "#34d399", flexShrink: 0 }} />
                      ) : meeting.status === "failed" ? (
                        <AlertCircle size={14} style={{ color: "#f87171", flexShrink: 0 }} />
                      ) : (
                        <Clock size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: 13 }}>
                          {truncate(meeting.title, 35)}
                        </div>
                        {meeting.summary_preview && (
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                            {truncate(meeting.summary_preview, 60)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${MEETING_STATUS_COLORS[meeting.status] || ""}`}>
                      {meeting.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                    {meeting.efficiency_score !== null ? `${meeting.efficiency_score}%` : "—"}
                  </td>
                  <td style={{ fontSize: 12 }}>{formatRelativeTime(meeting.created_at)}</td>
                  <td>
                    {meeting.has_analysis && (
                      <Link
                        to={`/meetings/${meeting.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        View <ArrowRight size={12} />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Links */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Link to="/projects" style={{ textDecoration: "none" }}>
          <div className="kpi-card" style={{ cursor: "pointer" }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#818cf8", marginBottom: 16
            }}>
              <FolderOpen size={20} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              Project Overview
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              View project requirements and details
            </p>
          </div>
        </Link>

        <Link to="/ai-assistant" style={{ textDecoration: "none" }}>
          <div className="kpi-card" style={{ cursor: "pointer" }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(6,182,212,0.12)",
              border: "1px solid rgba(6,182,212,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#22d3ee", marginBottom: 16
            }}>
              <Video size={20} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              AI Assistant
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Ask questions about meetings and tasks
            </p>
          </div>
        </Link>
      </div>
    </DashboardLayout>
  );
}
