import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleRoute } from "./routes/RoleRoute";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Manager pages
import ManagerDashboard from "./pages/manager/Dashboard";
import Teams from "./pages/manager/Teams";
import TeamDetail from "./pages/manager/TeamDetail";
import Employees from "./pages/manager/Employees";

// Employee pages
import EmployeeDashboard from "./pages/employee/Dashboard";

// Shared pages
import Meetings from "./pages/shared/Meetings";
import MeetingDetail from "./pages/shared/MeetingDetail";
import Projects from "./pages/shared/Projects";
import Analytics from "./pages/shared/Analytics";
import AIAssistant from "./pages/shared/AIAssistant";

// Team Lead pages
import UploadMeeting from "./pages/teamlead/UploadMeeting";

// Smart dashboard redirect based on role
function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === "manager") return <ManagerDashboard />;
  return <EmployeeDashboard />;
}

// 404 / Unauthorized
function NotFound() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg-base)", color: "var(--text-primary)"
    }}>
      <div style={{ fontSize: 80, fontWeight: 900, color: "var(--accent)", marginBottom: 16 }}>404</div>
      <h2 style={{ marginBottom: 8 }}>Page Not Found</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>The page you're looking for doesn't exist.</p>
      <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
    </div>
  );
}

function Unauthorized() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg-base)", color: "var(--text-primary)"
    }}>
      <div style={{ fontSize: 80, fontWeight: 900, color: "#ef4444", marginBottom: 16 }}>403</div>
      <h2 style={{ marginBottom: 8 }}>Access Denied</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>You don't have permission to view this page.</p>
      <a href="/dashboard" className="btn btn-secondary">Go to Dashboard</a>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>}
      />

      {/* Manager-only routes */}
      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["manager"]}>
              <Teams />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams/:id"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["manager"]}>
              <TeamDetail />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["manager"]}>
              <Employees />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Team Lead routes */}
      <Route
        path="/upload-meeting"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["team_lead", "manager"]}>
              <UploadMeeting />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Shared authenticated routes */}
      <Route
        path="/meetings"
        element={<ProtectedRoute><Meetings /></ProtectedRoute>}
      />
      <Route
        path="/meetings/:id"
        element={<ProtectedRoute><MeetingDetail /></ProtectedRoute>}
      />
      <Route
        path="/projects"
        element={<ProtectedRoute><Projects /></ProtectedRoute>}
      />
      <Route
        path="/analytics"
        element={<ProtectedRoute><Analytics /></ProtectedRoute>}
      />
      <Route
        path="/ai-assistant"
        element={<ProtectedRoute><AIAssistant /></ProtectedRoute>}
      />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
