import { useState, useEffect } from "react";
import {
  FolderOpen, Plus, X, Upload, FileText, Trash2, Cpu,
  Clock, DollarSign, Users, AlertTriangle, CheckCircle, Loader
} from "lucide-react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { projectsApi } from "../../api";
import type { Project } from "../../types";
import { formatDate, truncate } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

const DIFFICULTY_COLORS: Record<string, string> = {
  low: "#34d399",
  medium: "#fbbf24",
  high: "#f97316",
  very_high: "#f87171",
};

function AIAnalysisBadge({ status }: { status: string | null }) {
  if (!status || status === "pending") return null;
  if (status === "analyzing") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#818cf8", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 20, padding: "3px 10px" }}>
      <Loader size={10} style={{ animation: "spin 1s linear infinite" }} /> Analyzing…
    </span>
  );
  if (status === "done") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#34d399", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 20, padding: "3px 10px" }}>
      <CheckCircle size={10} /> AI Analyzed
    </span>
  );
  if (status === "failed") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 20, padding: "3px 10px" }}>
      <AlertTriangle size={10} /> Analysis Failed
    </span>
  );
  return null;
}

function ProjectDetailModal({ project, onClose, onDelete, onAnalyze, isManager }: {
  project: Project;
  onClose: () => void;
  onDelete: (id: string) => void;
  onAnalyze: (id: string) => void;
  isManager: boolean;
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    await onAnalyze(project.id);
    setIsAnalyzing(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 620, maxHeight: "85vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FolderOpen size={17} style={{ color: "#818cf8" }} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>{project.name}</h3>
                <AIAnalysisBadge status={project.ai_analysis_status} />
              </div>
            </div>
            {project.description && (
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{project.description}</p>
            )}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {/* AI Analysis Results */}
          {project.ai_analysis_status === "done" && (
            <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Cpu size={16} style={{ color: "var(--accent)" }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>AI Project Analysis</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {project.ai_difficulty && (
                  <div style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Difficulty</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: DIFFICULTY_COLORS[project.ai_difficulty] || "#94a3b8", textTransform: "capitalize" }}>
                      {project.ai_difficulty.replace("_", " ")}
                    </div>
                  </div>
                )}
                {project.ai_teams_needed && (
                  <div style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Teams Needed</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Users size={16} style={{ color: "#818cf8" }} />
                      <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{project.ai_teams_needed}</span>
                    </div>
                  </div>
                )}
                {project.ai_budget_estimate && (
                  <div style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Budget Estimate</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <DollarSign size={14} style={{ color: "#34d399" }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#34d399" }}>{project.ai_budget_estimate}</span>
                    </div>
                  </div>
                )}
                {project.ai_time_estimate && (
                  <div style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>Time Estimate</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock size={14} style={{ color: "#fbbf24" }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24" }}>{project.ai_time_estimate}</span>
                    </div>
                  </div>
                )}
              </div>

              {project.ai_analysis_summary && (
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, background: "var(--bg-elevated)", borderRadius: 10, padding: "12px 14px" }}>
                  {project.ai_analysis_summary}
                </div>
              )}
            </div>
          )}

          {/* Requirements text */}
          {project.client_requirements && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                <FileText size={14} style={{ color: "var(--accent)" }} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>Requirements</span>
              </div>
              <div style={{
                background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 10,
                padding: 16, fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.75,
                maxHeight: 240, overflowY: "auto", whiteSpace: "pre-wrap", fontFamily: "inherit"
              }}>
                {project.client_requirements}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {isManager && project.client_requirements && project.ai_analysis_status !== "done" && (
              <button
                onClick={handleAnalyze}
                className="btn btn-primary"
                disabled={isAnalyzing || project.ai_analysis_status === "analyzing"}
                style={{ flex: 1 }}
              >
                {isAnalyzing ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Analyzing…</> : <><Cpu size={14} /> Run AI Analysis</>}
              </button>
            )}
            {isManager && (
              <button
                onClick={() => { onDelete(project.id); onClose(); }}
                className="btn btn-secondary"
                style={{ color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [reqFile, setReqFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const loadProjects = () => {
    const fetcher = isManager ? projectsApi.list : projectsApi.myTeamProjects;
    fetcher()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadProjects(); }, [isManager]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqFile) { setError("Please upload a requirements file."); return; }
    setIsSubmitting(true);
    setError("");
    try {
      // Step 1: create project
      const newProject = await projectsApi.create({ name: form.name, description: form.description || undefined });
      // Step 2: upload requirements file
      const updated = await projectsApi.uploadRequirements(newProject.id, reqFile);
      setProjects((prev) => [updated, ...prev]);
      setShowModal(false);
      setForm({ name: "", description: "" });
      setReqFile(null);

      // Step 3: auto-trigger AI analysis (non-blocking — show in card)
      projectsApi.analyzeProject(updated.id).then((analyzed) => {
        setProjects((prev) => prev.map((p) => p.id === analyzed.id ? analyzed : p));
      }).catch(console.error);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    setDeleteError("");
    try {
      await projectsApi.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.response?.data?.detail || "Failed to delete project. It may have linked data.");
    }
  };

  const handleAnalyze = async (id: string) => {
    // Mark as analyzing
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, ai_analysis_status: "analyzing" } : p));
    if (selectedProject?.id === id) setSelectedProject((p) => p ? { ...p, ai_analysis_status: "analyzing" } : p);
    try {
      const updated = await projectsApi.analyzeProject(id);
      setProjects((prev) => prev.map((p) => p.id === updated.id ? updated : p));
      if (selectedProject?.id === id) setSelectedProject(updated);
    } catch (err) { console.error(err); }
  };

  return (
    <DashboardLayout
      title="Projects"
      subtitle={isManager ? "Create and manage project requirements" : "Your team's assigned projects"}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          {projects.length} project{projects.length !== 1 ? "s" : ""}
        </p>
        {isManager && (
          <button onClick={() => { setShowModal(true); setError(""); }} className="btn btn-primary">
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {/* Delete error banner */}
      {deleteError && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 10, padding: "12px 16px", color: "#f87171", fontSize: 13,
            marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12
          }}
        >
          <span>⚠ {deleteError}</span>
          <button onClick={() => setDeleteError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171" }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
        </div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <FolderOpen size={52} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>No projects yet</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>
            {isManager ? "Upload a requirements document to create your first project." : "No projects have been assigned to your team yet."}
          </p>
          {isManager && (
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <Plus size={15} /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {projects.map((project) => (
            <div
              key={project.id}
              className="card"
              style={{ cursor: "pointer", transition: "all 0.25s ease" }}
              onClick={() => setSelectedProject(project)}
              onMouseOver={(e) => { const el = e.currentTarget; el.style.borderColor = "rgba(99,102,241,0.4)"; el.style.transform = "translateY(-3px)"; el.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)"; }}
              onMouseOut={(e) => { const el = e.currentTarget; el.style.borderColor = "var(--border)"; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}
            >
              <div style={{ padding: "20px 24px" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25))", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FolderOpen size={17} style={{ color: "#818cf8" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3 }}>{project.name}</div>
                    {project.description && (
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{truncate(project.description, 60)}</p>
                    )}
                  </div>
                </div>

                <AIAnalysisBadge status={project.ai_analysis_status} />

                {/* AI metrics — compact preview */}
                {project.ai_analysis_status === "done" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                    {project.ai_difficulty && (
                      <div style={{ fontSize: 11.5, background: "var(--bg-base)", borderRadius: 8, padding: "6px 10px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Difficulty: </span>
                        <strong style={{ color: DIFFICULTY_COLORS[project.ai_difficulty] || "#94a3b8", textTransform: "capitalize" }}>
                          {project.ai_difficulty.replace("_", " ")}
                        </strong>
                      </div>
                    )}
                    {project.ai_time_estimate && (
                      <div style={{ fontSize: 11.5, background: "var(--bg-base)", borderRadius: 8, padding: "6px 10px" }}>
                        <span style={{ color: "var(--text-muted)" }}>Est: </span>
                        <strong style={{ color: "#fbbf24" }}>{project.ai_time_estimate}</strong>
                      </div>
                    )}
                    {project.ai_budget_estimate && (
                      <div style={{ fontSize: 11.5, background: "var(--bg-base)", borderRadius: 8, padding: "6px 10px", gridColumn: "1 / -1" }}>
                        <span style={{ color: "var(--text-muted)" }}>Budget: </span>
                        <strong style={{ color: "#34d399" }}>{project.ai_budget_estimate}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Requirements snippet for employees */}
                {!isManager && project.client_requirements && (
                  <p style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.6, marginTop: 12, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 7, borderLeft: "2px solid rgba(99,102,241,0.3)" }}>
                    {truncate(project.client_requirements, 100)}
                  </p>
                )}

                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>Created {formatDate(project.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onDelete={handleDelete}
          onAnalyze={handleAnalyze}
          isManager={isManager}
        />
      )}

      {/* Create Project Modal (manager only) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>New Project</h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  Upload a requirements file — AI will analyze it automatically.
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <div>
                <label className="form-label">Project Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. E-Commerce Platform v2" required />
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea className="form-input" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="What is this project about?" rows={2} style={{ resize: "vertical" }} />
              </div>

              {/* Requirements file upload */}
              <div>
                <label className="form-label">Requirements Document *</label>
                <div
                  style={{ border: "1.5px dashed var(--border)", borderRadius: 10, padding: "18px 20px", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}
                  onClick={() => document.getElementById("req-file-input")?.click()}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = reqFile ? "var(--accent)" : "var(--border)")}
                >
                  <input id="req-file-input" type="file" accept=".pdf,.docx,.txt" style={{ display: "none" }} onChange={(e) => setReqFile(e.target.files?.[0] || null)} />
                  {reqFile ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <FileText size={16} style={{ color: "var(--accent)" }} />
                      <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>{reqFile.name}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setReqFile(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload size={22} style={{ color: "var(--text-muted)", margin: "0 auto 8px" }} />
                      <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Click to upload <strong>PDF, DOCX, or TXT</strong></p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>AI will parse and analyze automatically</p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? "Creating & Analyzing…" : <><Cpu size={15} /> Create & Analyze</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
