import { useState, useEffect } from "react";
import { Users, Plus, Trash2, X, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { teamsApi, projectsApi } from "../../api";
import type { Team, Project } from "../../types";
import { formatDate } from "../../lib/utils";

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "", project_id: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const loadData = () => {
    Promise.all([teamsApi.list(), projectsApi.list()])
      .then(([t, p]) => { setTeams(t); setProjects(p); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");
    try {
      const payload: any = { name: createForm.name, description: createForm.description || undefined };
      if (createForm.project_id) payload.project_id = createForm.project_id;
      const newTeam = await teamsApi.create(payload);
      setTeams((prev) => [newTeam, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ name: "", description: "", project_id: "" });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create team.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete team "${name}"? This will soft-delete it.`)) return;
    try {
      await teamsApi.delete(id);
      setTeams((prev) => prev.filter((t) => t.id !== id));
    } catch (err) { console.error(err); }
  };

  // Unassigned projects (no team yet or can be re-assigned)
  const unassignedProjects = projects.filter((p) => !p.team_id || teams.some((t) => t.project_id === p.id && t.id === createForm.project_id));

  return (
    <DashboardLayout title="Teams" subtitle="Manage your organization's teams">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          {teams.length} team{teams.length !== 1 ? "s" : ""} total
        </p>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> New Team
        </button>
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <Users size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>No teams yet</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>Create your first team to get started</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={16} /> Create Team
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {teams.map((team) => {
            const assignedProject = projects.find((p) => p.id === team.project_id);
            return (
              <div key={team.id} style={{ position: "relative" }}>
                <Link to={`/teams/${team.id}`} style={{ textDecoration: "none" }}>
                  <div
                    className="card"
                    style={{ cursor: "pointer", transition: "all 0.3s", borderColor: "var(--border)" }}
                    onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.4)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                    onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                  >
                    <div style={{ padding: "20px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: "linear-gradient(135deg, var(--accent), var(--violet))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 18, fontWeight: 700, color: "white"
                        }}>
                          {team.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{team.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Created {formatDate(team.created_at)}</div>
                        </div>
                      </div>
                      {team.description && (
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
                          {team.description}
                        </p>
                      )}
                      {assignedProject && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "5px 10px" }}>
                          <FolderOpen size={12} style={{ color: "var(--accent)", flexShrink: 0 }} />
                          <span style={{ fontSize: 11.5, color: "var(--accent-hover)", fontWeight: 600 }}>{assignedProject.name}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Users size={13} style={{ color: "var(--accent)" }} />
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {team.member_count} member{team.member_count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                {/* Delete button — floating top-right */}
                <button
                  onClick={(e) => { e.preventDefault(); handleDelete(team.id, team.name); }}
                  title="Delete team"
                  style={{
                    position: "absolute", top: 12, right: 12,
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: 7, padding: "5px 7px", cursor: "pointer", color: "#f87171",
                    display: "flex", alignItems: "center", zIndex: 1,
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Create New Team</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: 24 }}>
              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, color: "#f87171", fontSize: 13 }}>
                  {error}
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Team Name *</label>
                <input
                  className="form-input"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Backend Team"
                  required
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What does this team work on?"
                  rows={2}
                  style={{ resize: "vertical" }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label className="form-label">Assign Project (optional)</label>
                <select
                  className="form-input"
                  value={createForm.project_id}
                  onChange={(e) => setCreateForm((p) => ({ ...p, project_id: e.target.value }))}
                >
                  <option value="">— No project —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>
                  Link a project so employees can view requirements.
                </p>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
