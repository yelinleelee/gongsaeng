import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";

type Props = {
  children?: ReactNode;
  requireHost?: boolean;
};

export function ProtectedRoute({ children, requireHost = false }: Props) {
  const { ready, user } = useAuth();
  const location = useLocation();

  if (!ready) return <div className="p-6 text-sm text-slate-500">Loading…</div>;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireHost && user.role !== "host") {
    return <Navigate to="/" replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
