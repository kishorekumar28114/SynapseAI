import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { Role } from "../lib/constants";

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  redirectTo?: string;
}

export function RoleRoute({ children, allowedRoles, redirectTo = "/unauthorized" }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role as Role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
