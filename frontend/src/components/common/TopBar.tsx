import { Bell, Search } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { ROLE_LABELS } from "../../lib/constants";

interface TopBarProps {
  title?: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { user } = useAuth();

  return (
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

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "7px 12px",
            cursor: "text",
          }}
        >
          <Search size={14} style={{ color: "var(--text-muted)" }} />
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Search...</span>
        </div>

        {/* Notifications */}
        <button
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-secondary)",
            position: "relative",
          }}
        >
          <Bell size={16} />
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--accent)",
              border: "1.5px solid var(--bg-base)",
            }}
          />
        </button>

        {/* Role Badge */}
        {user && (
          <div
            className="badge"
            style={{
              background: "var(--accent-subtle)",
              color: "var(--accent-hover)",
              border: "1px solid rgba(99,102,241,0.3)",
            }}
          >
            {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
          </div>
        )}
      </div>
    </header>
  );
}
