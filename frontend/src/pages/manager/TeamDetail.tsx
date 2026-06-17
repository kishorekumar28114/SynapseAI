import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Users, UserPlus, Crown, User, X, Trash2,
  FolderOpen, Video, Calendar, Shield
} from "lucide-react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { teamsApi, employeesApi, meetingsApi } from "../../api";
import type { Team, Employee, Meeting, TeamMember } from "../../types";
import { MEETING_STATUS_COLORS, ROLE_LABELS } from "../../lib/constants";
import { formatDate, formatRelativeTime, getInitials, truncate } from "../../lib/utils";

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("team_member");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const loadData = async () => {
    if (!id) return;
    try {
      const [teamData, empData, meetingsData] = await Promise.all([
        teamsApi.get(id),
        employeesApi.list(),
        meetingsApi.teamMeetings(id),
      ]);
      setTeam(teamData);
      setEmployees(empData);
      setMeetings(meetingsData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const currentMemberIds = new Set((team?.members || []).map((m) => m.user_id));
  const availableEmployees = employees.filter((e) => !currentMemberIds.has(e.id));

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !id) return;
    setIsAdding(true);
    setAddError("");
    try {
      await teamsApi.addMember(id, selectedUserId, selectedRole);
      await loadData();
      setShowAddModal(false);
      setSelectedUserId("");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setAddError(apiErr.response?.data?.detail || "Failed to add member.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id || !window.confirm("Remove this member from the team?")) return;
    try {
      await teamsApi.removeMember(id, userId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Team">
        <div style={{ display: "grid", gap: 16 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
      </DashboardLayout>
    );
  }

  if (!team) {
    return <DashboardLayout title="Team"><p style={{ color: "var(--text-muted)" }}>Team not found.</p></DashboardLayout>;
  }

  return (
    <DashboardLayout title={team.name} subtitle={team.description || "Team overview"}>
      {/* Back */}
      <Link to="/teams" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, marginBottom: 24, textDecoration: "none" }}>
        <ArrowLeft size={14} /> Back to Teams
      </Link>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Members", value: team.member_count, icon: <Users size={18} />, color: "#818cf8" },
          { label: "Meetings", value: meetings.length, icon: <Video size={18} />, color: "#34d399" },
          { label: "Created", value: formatDate(team.created_at), icon: <Calendar size={18} />, color: "#fbbf24" },
        ].map((stat) => (
          <div key={stat.label} className="kpi-card" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${stat.color}18`, border: `1px solid ${stat.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: stat.color }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Members */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={16} style={{ color: "var(--accent)" }} />
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Members ({team.members?.length ?? 0})</h3>
            </div>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">
              <UserPlus size={13} /> Add Member
            </button>
          </div>

          <div>
            {(!team.members || team.members.length === 0) ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No members yet. Add your first team member.
              </div>
            ) : (
              team.members.map((member: TeamMember) => (
                <div key={member.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--violet))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0 }}>
                      {getInitials(member.full_name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                        {member.full_name}
                        {member.role_in_team === "team_lead" && <Crown size={11} style={{ color: "#fbbf24" }} />}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>@{member.username}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="badge" style={{ background: member.role_in_team === "team_lead" ? "rgba(251,191,36,0.12)" : "var(--accent-subtle)", color: member.role_in_team === "team_lead" ? "#fbbf24" : "var(--accent-hover)", border: `1px solid ${member.role_in_team === "team_lead" ? "rgba(251,191,36,0.25)" : "rgba(99,102,241,0.25)"}` }}>
                      {member.role_in_team === "team_lead" ? "Lead" : "Member"}
                    </span>
                    <button onClick={() => handleRemoveMember(member.user_id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: 4, transition: "color 0.2s" }}
                      onMouseOver={(e) => (e.currentTarget.style.color = "#f87171")}
                      onMouseOut={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Meetings */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Video size={16} style={{ color: "var(--accent)" }} />
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Meetings</h3>
            </div>
            <Link to="/meetings" style={{ fontSize: 12, color: "var(--accent-hover)" }}>View all</Link>
          </div>

          <div>
            {meetings.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No meetings uploaded for this team yet.
              </div>
            ) : (
              meetings.slice(0, 8).map((m) => (
                <Link key={m.id} to={`/meetings/${m.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid var(--border)", textDecoration: "none", transition: "background 0.15s" }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{truncate(m.title, 30)}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{formatRelativeTime(m.created_at)}</div>
                  </div>
                  <span className={`badge ${MEETING_STATUS_COLORS[m.status] || ""}`} style={{ fontSize: 10 }}>{m.status}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Add Team Member</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddMember} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {addError && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>{addError}</div>
              )}
              <div>
                <label className="form-label">Select Employee *</label>
                <select className="form-input" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} required>
                  <option value="">— Choose employee —</option>
                  {availableEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.full_name} (@{emp.username})</option>
                  ))}
                </select>
                {availableEmployees.length === 0 && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>All employees are already in this team.</p>
                )}
              </div>
              <div>
                <label className="form-label">Role in Team</label>
                <select className="form-input" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  <option value="team_member">Team Member</option>
                  <option value="team_lead">Team Lead</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isAdding || !selectedUserId}>
                  {isAdding ? "Adding..." : <><UserPlus size={14} /> Add Member</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
