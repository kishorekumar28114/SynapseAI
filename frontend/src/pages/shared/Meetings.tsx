import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Video, Upload, ArrowRight, Trash2, FolderOpen, Users, ChevronDown } from "lucide-react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { meetingsApi, teamsApi, projectsApi } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import type { Meeting, Team, Project } from "../../types";
import { MEETING_STATUS_COLORS } from "../../lib/constants";
import { formatRelativeTime, truncate } from "../../lib/utils";

export default function Meetings() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const isManager = user?.role === "manager";
  const canUpload = user?.role === "team_lead";

  const loadData = () => {
    const meetingFetcher = isManager ? meetingsApi.allMeetings : meetingsApi.myMeetings;
    const teamFetcher = isManager ? teamsApi.list : teamsApi.myTeams;

    Promise.all([
      meetingFetcher(),
      teamFetcher(),
      isManager ? projectsApi.list() : projectsApi.myTeamProjects(),
    ])
      .then(([m, t, p]) => {
        setMeetings(m);
        setTeams(t);
        setProjects(p);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadData(); }, [isManager]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete meeting "${title}"? This cannot be undone.`)) return;
    try {
      await meetingsApi.delete(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to delete meeting.");
    }
  };

  // Apply filters
  const filtered = meetings.filter((m) => {
    const teamOk = teamFilter === "all" || m.team_id === teamFilter;
    const projectOk = projectFilter === "all" || m.project_id === projectFilter;
    return teamOk && projectOk;
  });

  // Lookup helpers
  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? "—";
  const projectName = (id: string | null) => id ? (projects.find((p) => p.id === id)?.name ?? "—") : "—";

  const selectStyle: React.CSSProperties = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "6px 32px 6px 12px",
    fontSize: 13,
    color: "var(--text-primary)",
    cursor: "pointer",
    fontFamily: "inherit",
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
  };

  return (
    <DashboardLayout
      title="Meetings"
      subtitle={isManager ? "All meetings across your teams" : "Your team's meetings"}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Team filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={14} style={{ color: "var(--text-muted)" }} />
            <div style={{ position: "relative" }}>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All Teams</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Project filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <FolderOpen size={14} style={{ color: "var(--text-muted)" }} />
            <div style={{ position: "relative" }}>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter count badge */}
          {(teamFilter !== "all" || projectFilter !== "all") && (
            <button
              onClick={() => { setTeamFilter("all"); setProjectFilter("all"); }}
              style={{
                background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
                borderRadius: 20, padding: "4px 12px", fontSize: 12,
                color: "var(--accent)", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} · Clear ×
            </button>
          )}

          {/* Total count */}
          {teamFilter === "all" && projectFilter === "all" && (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {meetings.length} meeting{meetings.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {canUpload && (
          <Link to="/upload-meeting" className="btn btn-primary">
            <Upload size={15} /> Upload Meeting
          </Link>
        )}
      </div>

      {/* Meetings Table */}
      <div className="card">
        {isLoading ? (
          <div style={{ padding: 24 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 64, marginBottom: 8, borderRadius: 8 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <Video size={40} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
            <h3 style={{ marginBottom: 8 }}>No meetings found</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {teamFilter !== "all" || projectFilter !== "all"
                ? "Try changing the team or project filter."
                : canUpload ? "Upload your first meeting to get started." : "No meetings have been uploaded yet."}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Meeting</th>
                <th>Team</th>
                <th>Project</th>
                <th>Status</th>
                <th>Efficiency</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((meeting) => (
                <tr key={meeting.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Video size={16} style={{ color: "var(--accent)" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>
                          {truncate(meeting.title, 40)}
                        </div>
                        {meeting.summary_preview && (
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                            {truncate(meeting.summary_preview, 55)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 12, color: "var(--text-secondary)",
                      background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)",
                      borderRadius: 20, padding: "3px 10px",
                    }}>
                      <Users size={10} /> {teamName(meeting.team_id)}
                    </span>
                  </td>
                  <td>
                    {meeting.project_id ? (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 12, color: "var(--text-secondary)",
                        background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)",
                        borderRadius: 20, padding: "3px 10px",
                      }}>
                        <FolderOpen size={10} /> {truncate(projectName(meeting.project_id), 20)}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${MEETING_STATUS_COLORS[meeting.status] || ""}`}>
                      {meeting.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: meeting.efficiency_score ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {meeting.efficiency_score !== null ? `${meeting.efficiency_score}%` : "—"}
                  </td>
                  <td style={{ fontSize: 12 }}>{formatRelativeTime(meeting.created_at)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <Link to={`/meetings/${meeting.id}`} className="btn btn-secondary btn-sm">
                        View <ArrowRight size={12} />
                      </Link>
                      {(isManager || meeting.uploaded_by === user?.id) && (
                        <button
                          onClick={() => handleDelete(meeting.id, meeting.title)}
                          title="Delete meeting"
                          style={{
                            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                            borderRadius: 6, padding: "5px 7px", cursor: "pointer",
                            color: "#f87171", display: "flex", alignItems: "center",
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
