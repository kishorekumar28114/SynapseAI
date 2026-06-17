import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, File, X, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { meetingsApi, teamsApi } from "../../api";
import type { Team } from "../../types";

const ALLOWED_EXTENSIONS = ["mp3", "wav", "m4a", "ogg", "pdf", "docx", "txt"];

export default function UploadMeeting() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [form, setForm] = useState({ title: "", team_id: "", project_id: "", description: "" });
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    teamsApi.myTeams().then((t) => {
      setTeams(t);
      if (t.length > 0) setForm((p) => ({ ...p, team_id: t[0].id }));
    }).catch(console.error);
  }, []);

  const handleFile = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`File type .${ext} not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      setError("File exceeds 100MB limit.");
      return;
    }
    setError("");
    setFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Please select a file."); return; }
    if (!form.team_id) { setError("Please select a team."); return; }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", form.title);
    formData.append("team_id", form.team_id);
    if (form.description) formData.append("description", form.description);

    setIsUploading(true);
    setError("");
    try {
      const result = await meetingsApi.upload(formData);
      setSuccess(true);
      setTimeout(() => navigate(`/meetings/${result.id}`), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout title="Upload Meeting" subtitle="Upload audio or document files for AI analysis">
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {success ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <CheckCircle size={56} style={{ color: "#34d399", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>Upload Successful!</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Redirecting to meeting detail page...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* File Dropzone */}
            <div
              className={`dropzone ${isDragOver ? "active" : ""}`}
              style={{ marginBottom: 24 }}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".mp3,.wav,.m4a,.ogg,.pdf,.docx,.txt"
                style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {file ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
                  <File size={32} style={{ color: "var(--accent)" }} />
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{file.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB · {file.type || "Unknown type"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", marginLeft: 8 }}
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload size={40} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                    Drag & drop or click to upload
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Supported: MP3, WAV, M4A, OGG, PDF, DOCX, TXT · Max 100MB
                  </p>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="card" style={{ padding: "24px" }}>
              {error && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, color: "#f87171", fontSize: 13, display: "flex", gap: 8 }}>
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Meeting Title *</label>
                <input
                  className="form-input"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Sprint Planning · June 14"
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Team *</label>
                <select
                  className="form-input"
                  value={form.team_id}
                  onChange={(e) => setForm((p) => ({ ...p, team_id: e.target.value }))}
                  required
                >
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  {teams.length === 0 && <option value="">No teams available</option>}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of the meeting..."
                  rows={3}
                  style={{ resize: "vertical" }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", height: 46, fontSize: 14 }}
                disabled={isUploading || !file}
              >
                {isUploading ? (
                  <><Loader size={16} className="animate-spin" /> Uploading...</>
                ) : (
                  <><Upload size={16} /> Upload Meeting</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
