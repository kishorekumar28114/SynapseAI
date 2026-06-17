import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FolderOpen, Video, BarChart2,
  MessageSquare, LogOut, ChevronRight, UserPlus, Upload
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { APP_NAME, ROLE_LABELS } from "../../lib/constants";
import { getInitials } from "../../lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: <LayoutDashboard size={16} />,
    roles: ["manager", "team_lead", "team_member"],
  },
  {
    label: "Teams",
    to: "/teams",
    icon: <Users size={16} />,
    roles: ["manager"],
  },
  {
    label: "Projects",
    to: "/projects",
    icon: <FolderOpen size={16} />,
    roles: ["manager", "team_lead", "team_member"],
  },
  {
    label: "Employees",
    to: "/employees",
    icon: <UserPlus size={16} />,
    roles: ["manager"],
  },
  {
    label: "Upload Meeting",
    to: "/upload-meeting",
    icon: <Upload size={16} />,
    roles: ["team_lead"],
  },
  {
    label: "Meetings",
    to: "/meetings",
    icon: <Video size={16} />,
    roles: ["manager", "team_lead", "team_member"],
  },
  {
    label: "Analytics",
    to: "/analytics",
    icon: <BarChart2 size={16} />,
    roles: ["manager", "team_lead"],
  },
  {
    label: "AI Assistant",
    to: "/ai-assistant",
    icon: <MessageSquare size={16} />,
    roles: ["manager", "team_lead", "team_member"],
  },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const filteredNav = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sidebar">
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--accent), var(--violet))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 800,
              color: "white",
              flexShrink: 0,
            }}
          >
            S
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
              {APP_NAME}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              Meeting Intelligence
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "1px", textTransform: "uppercase", padding: "4px 4px 8px" }}>
          Navigation
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? "active" : ""}`
              }
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              <ChevronRight size={12} style={{ opacity: 0.4 }} />
            </NavLink>
          ))}
        </div>
      </div>

      {/* User Profile */}
      {user && (
        <div style={{ padding: "12px", borderTop: "1px solid var(--border)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--accent), var(--violet))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "white",
                flexShrink: 0,
              }}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                getInitials(user.full_name)
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: 11, color: "var(--accent-hover)", fontWeight: 500 }}>
                {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", gap: 8 }}>
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
