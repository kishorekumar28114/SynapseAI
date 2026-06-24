import { useState, useRef, useEffect } from "react";
import { KeyRound, LogOut, ChevronDown, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getInitials } from "../../lib/utils";
import { authApi } from "../../api";

interface TopBarProps {
  title?: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Change Password Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openChangePassword = () => {
    setDropdownOpen(false);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setFeedback(null);
    setModalOpen(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (newPw.length < 6) {
      setFeedback({ type: "error", msg: "New password must be at least 6 characters." });
      return;
    }
    if (newPw !== confirmPw) {
      setFeedback({ type: "error", msg: "New passwords do not match." });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await authApi.changePassword(currentPw, newPw);
      setFeedback({ type: "success", msg: res.message });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => setModalOpen(false), 1800);
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.response?.data?.detail || "Failed to change password." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate("/login");
  };

  const pwField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    show: boolean,
    onToggle: () => void,
    id: string
  ) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          style={{
            width: "100%",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "9px 36px 9px 12px",
            fontSize: 13,
            color: "var(--text-primary)",
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex",
          }}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <header className="topbar">
        <div style={{ flex: 1 }}>
          {title && (
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
                {title}
              </h1>
              {subtitle && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{subtitle}</p>
              )}
            </div>
          )}
        </div>

        {/* Profile Button */}
        {user && (
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button
              id="profile-menu-btn"
              onClick={() => setDropdownOpen((o) => !o)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: dropdownOpen ? "var(--bg-elevated)" : "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "6px 10px 6px 6px",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--accent), var(--violet))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0,
              }}>
                {user.avatar_url
                  ? <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  : getInitials(user.full_name)}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.2 }}>
                  {user.full_name.split(" ")[0]}
                </div>
              </div>
              <ChevronDown
                size={13}
                style={{
                  color: "var(--text-muted)",
                  transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 1000,
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                borderRadius: 12, padding: "6px", minWidth: 200,
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                animation: "fadeIn 0.12s ease",
              }}>
                {/* User info header */}
                <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{user.full_name}</div>
                  <div style={{ fontSize: 11, color: "var(--accent-hover)", fontWeight: 500, marginTop: 2 }}>
                    {user.role.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </div>
                </div>

                {/* Change Password */}
                <button
                  id="change-password-btn"
                  onClick={openChangePassword}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 9,
                    background: "none", border: "none", borderRadius: 8,
                    padding: "8px 10px", cursor: "pointer",
                    fontSize: 13, color: "var(--text-secondary)", fontFamily: "inherit",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  <KeyRound size={14} style={{ color: "var(--text-muted)" }} />
                  Change Password
                </button>

                <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 9,
                    background: "none", border: "none", borderRadius: 8,
                    padding: "8px 10px", cursor: "pointer",
                    fontSize: 13, color: "#f87171", fontFamily: "inherit",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Change Password Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 2000,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div style={{
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            borderRadius: 16, padding: "28px", width: "100%", maxWidth: 400,
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            animation: "fadeIn 0.15s ease",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <KeyRound size={17} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Change Password</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>Update your account password</div>
              </div>
            </div>

            {/* Feedback banner */}
            {feedback && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: feedback.type === "success" ? "rgba(52,211,153,0.1)" : "rgba(239,68,68,0.1)",
                border: `1px solid ${feedback.type === "success" ? "rgba(52,211,153,0.3)" : "rgba(239,68,68,0.3)"}`,
                borderRadius: 8, padding: "10px 12px", marginBottom: 16,
                fontSize: 13,
                color: feedback.type === "success" ? "#34d399" : "#f87171",
              }}>
                {feedback.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {feedback.msg}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              {pwField("Current Password", currentPw, setCurrentPw, showCurrent, () => setShowCurrent(s => !s), "cur-pw")}
              {pwField("New Password", newPw, setNewPw, showNew, () => setShowNew(s => !s), "new-pw")}
              {pwField("Confirm New Password", confirmPw, setConfirmPw, showConfirm, () => setShowConfirm(s => !s), "conf-pw")}

              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 8,
                    background: "var(--bg-hover)", border: "1px solid var(--border)",
                    color: "var(--text-secondary)", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 8,
                    background: "linear-gradient(135deg, var(--accent), var(--violet))",
                    border: "none", color: "white", fontSize: 13, fontWeight: 600,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.7 : 1, fontFamily: "inherit",
                  }}
                >
                  {isSubmitting ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
