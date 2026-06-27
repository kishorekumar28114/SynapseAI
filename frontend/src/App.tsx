import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AIProvider } from "./contexts/AIContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleRoute } from "./routes/RoleRoute";

// Layout
import { WorkspaceLayout } from "./layouts/WorkspaceLayout";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Manager pages
import ManagerDashboard from "./pages/manager/Dashboard";
import Employees from "./pages/manager/Employees";
import Teams from "./pages/manager/Teams";
import TeamDetail from "./pages/manager/TeamDetail";

// Employee pages
import EmployeeDashboard from "./pages/employee/Dashboard";

// Shared pages
import Projects from "./pages/shared/Projects";
import ProjectWorkspace from "./pages/shared/ProjectWorkspace";
import Settings from "./pages/shared/Settings";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="mb-4 text-6xl font-black text-primary">404</div>
      <h2 className="mb-2 text-2xl font-bold">Page Not Found</h2>
      <p className="mb-6 text-muted-foreground">The page you're looking for doesn't exist.</p>
      <a href="/dashboard" className="rounded-md bg-primary px-4 py-2 text-primary-foreground font-medium hover:bg-primary/90">Go to Dashboard</a>
    </div>
  );
}

function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="mb-4 text-6xl font-black text-destructive">403</div>
      <h2 className="mb-2 text-2xl font-bold">Access Denied</h2>
      <p className="mb-6 text-muted-foreground">You don't have permission to view this page.</p>
      <a href="/dashboard" className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground font-medium hover:bg-secondary/80">Go to Dashboard</a>
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

      {/* Protected Workspace Routes */}
      <Route element={
        <ProtectedRoute>
          <WorkspaceLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<DashboardRouter />} />
        
        {/* Projects Directory & Workspace */}
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id/*" element={<ProjectWorkspace />} />

        {/* Directory (People/Teams) */}
        <Route 
          path="/people" 
          element={
            <RoleRoute allowedRoles={["manager"]}>
              <Employees />
            </RoleRoute>
          } 
        />
        
        {/* Teams Directory */}
        <Route 
          path="/teams" 
          element={
            <RoleRoute allowedRoles={["manager"]}>
              <Teams />
            </RoleRoute>
          } 
        />
        <Route 
          path="/teams/:id" 
          element={
            <RoleRoute allowedRoles={["manager"]}>
              <TeamDetail />
            </RoleRoute>
          } 
        />

        {/* Settings */}
        <Route path="/settings" element={<Settings />} />
      </Route>

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
        <AIProvider>
          <AppRoutes />
        </AIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
