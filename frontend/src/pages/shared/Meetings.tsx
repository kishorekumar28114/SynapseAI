import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Video, Upload, Clock, CheckCircle, AlertCircle, ArrowRight, Trash2 } from "lucide-react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { meetingsApi } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import type { Meeting } from "../../types";
import { MEETING_STATUS_COLORS } from "../../lib/constants";
import { formatRelativeTime, truncate } from "../../lib/utils";

export default function Meetings() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const isManager = user?.role === "manager";
  const canUpload = user?.role === "team_lead" || user?.role === "manager";

  const loadMeetings = () => {
    const fetcher = isManager ? meetingsApi.allMeetings : meetingsApi.myMeetings;
    fetcher()
      .then(setMeetings)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadMeetings(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete meeting "${title}"? This cannot be undone.`)) return;
    try {
      await meetingsApi.delete(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Failed to delete meeting. Please try again.";
      alert(detail);
      console.error(err);
    }
  };

  const filtered = filter === "all" ? meetings : meetings.filter((m) => m.status === filter);

  return (
    <DashboardLayout
      title="Meetings"
      subtitle={isManager ? "All meetings across your teams" : "Your team's meetings"}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {["all", "completed", "processing", "uploaded", "failed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="btn btn-sm"
              style={{
                background: filter === f ? "linear-gradient(135deg, var(--accent), var(--violet))" : "transparent",
                color: filter === f ? "white" : "var(--text-secondary)",
                border: filter === f ? "none" : "1px solid var(--border)",
                textTransform: "capitalize"
              }}
            >
              {f}
            </button>
          ))}
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
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 64, marginBottom: 8, borderRadius: 8 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <Video size={40} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
            <h3 style={{ marginBottom: 8 }}>No meetings found</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {filter !== "all" ? `No ${filter} meetings.` : "Upload your first meeting to get started."}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Meeting</th>
                <th>Type</th>
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
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Video size={16} style={{ color: "var(--accent)" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{truncate(meeting.title, 40)}</div>
                        {meeting.summary_preview && (
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{truncate(meeting.summary_preview, 60)}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                    {meeting.file_type}
                  </td>
                  <td>
                    <span className={`badge ${MEETING_STATUS_COLORS[meeting.status] || ""}`}>{meeting.status}</span>
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
                          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 6, padding: "5px 7px", cursor: "pointer", color: "#f87171", display: "flex", alignItems: "center" }}
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
