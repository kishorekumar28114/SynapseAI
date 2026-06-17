import { useState, useEffect } from "react";
import { UserPlus, Mail, Shield, X, CheckCircle, Copy, Trash2, UserX } from "lucide-react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { employeesApi } from "../../api";
import type { Employee } from "../../types";
import { ROLE_LABELS } from "../../lib/constants";
import { formatDate } from "../../lib/utils";

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ username: string; temp_password: string } | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ full_name: "", email: "", role: "team_member" });

  const loadEmployees = () =>
    employeesApi.list().then(setEmployees).catch(console.error).finally(() => setIsLoading(false));

  useEffect(() => { loadEmployees(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setError("");
    try {
      const result = await employeesApi.invite(form);
      setInviteResult({ username: result.username, temp_password: result.temp_password });
      loadEmployees();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to invite employee.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!window.confirm(`Deactivate ${name}? They will no longer be able to log in.`)) return;
    try {
      await employeesApi.deactivate(id);
      loadEmployees();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    try {
      await employeesApi.delete(id);
      loadEmployees();
    } catch (err) { console.error(err); }
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  return (
    <DashboardLayout title="Employees" subtitle="Invite and manage your team members">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>{employees.length} employees</p>
        <button onClick={() => { setShowInviteModal(true); setInviteResult(null); setError(""); }} className="btn btn-primary">
          <UserPlus size={16} /> Invite Employee
        </button>
      </div>

      {/* Employees Table */}
      <div className="card">
        {isLoading ? (
          <div style={{ padding: 24 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 52, marginBottom: 8, borderRadius: 8 }} />)}
          </div>
        ) : employees.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <UserPlus size={40} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
            <h3 style={{ marginBottom: 8 }}>No employees yet</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: 20, fontSize: 13 }}>Invite your first team member</p>
            <button onClick={() => setShowInviteModal(true)} className="btn btn-primary">
              <UserPlus size={15} /> Invite Employee
            </button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Email</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--accent), var(--violet))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0
                      }}>
                        {emp.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13 }}>{emp.full_name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>@{emp.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: "var(--accent-subtle)", color: "var(--accent-hover)", border: "1px solid rgba(99,102,241,0.3)" }}>
                      {ROLE_LABELS[emp.role as keyof typeof ROLE_LABELS]}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>{emp.email || "—"}</td>
                  <td>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600,
                      padding: "3px 10px", borderRadius: 20,
                      background: emp.is_active ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      color: emp.is_active ? "#34d399" : "#f87171",
                      border: `1px solid ${emp.is_active ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                    }}>
                      {emp.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{formatDate(emp.created_at)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      {emp.is_active && (
                        <button
                          onClick={() => handleDeactivate(emp.id, emp.full_name)}
                          title="Deactivate"
                          style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "#fbbf24", display: "flex", alignItems: "center" }}
                        >
                          <UserX size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(emp.id, emp.full_name)}
                        title="Delete permanently"
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "#f87171", display: "flex", alignItems: "center" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>
                {inviteResult ? "Employee Invited!" : "Invite Employee"}
              </h3>
              <button onClick={() => setShowInviteModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            {inviteResult ? (
              <div style={{ padding: 24 }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <CheckCircle size={48} style={{ color: "#34d399", margin: "0 auto 12px" }} />
                  <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    Credentials generated. An onboarding email was sent.
                  </p>
                </div>
                <div style={{ background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                  {[
                    { label: "Username", value: inviteResult.username },
                    { label: "Temp Password", value: inviteResult.temp_password },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <code style={{ fontFamily: "monospace", fontSize: 13, color: "var(--text-primary)", background: "var(--accent-subtle)", padding: "2px 10px", borderRadius: 6 }}>
                          {value}
                        </code>
                        <button onClick={() => copyToClipboard(value)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setShowInviteModal(false); setInviteResult(null); }} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleInvite} style={{ padding: 24 }}>
                {error && (
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, color: "#f87171", fontSize: 13 }}>{error}</div>
                )}
                {[
                  { name: "full_name", label: "Full Name", type: "text", placeholder: "John Smith" },
                  { name: "email", label: "Email Address", type: "email", placeholder: "john@company.com" },
                ].map((field) => (
                  <div key={field.name} style={{ marginBottom: 16 }}>
                    <label className="form-label">{field.label} *</label>
                    <input className="form-input" type={field.type} value={form[field.name as keyof typeof form]} onChange={(e) => setForm((p) => ({ ...p, [field.name]: e.target.value }))} placeholder={field.placeholder} required />
                  </div>
                ))}
                <div style={{ marginBottom: 24 }}>
                  <label className="form-label">Role *</label>
                  <select className="form-input" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
                    <option value="team_member">Team Member</option>
                    <option value="team_lead">Team Lead</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button type="button" onClick={() => setShowInviteModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isInviting}>
                    {isInviting ? "Inviting..." : <><UserPlus size={15} /> Invite</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
