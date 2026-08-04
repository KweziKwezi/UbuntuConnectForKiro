import { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../lib/AuthContext";

// Guards a dashboard route: redirects to /login if there's no session, and
// redirects to the correct dashboard if a logged-in user of a different
// role lands here directly (e.g. an Individual manually visiting
// /npo-dashboard).
export default function ProtectedRoute({
  children,
  role,
}: {
  children: ReactNode;
  role: "Individual" | "NPO" | "Business" | "Admin";
}) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.userType !== role) {
    const redirects: Record<string, string> = {
      Individual: "/individual-dashboard",
      NPO: "/npo-dashboard",
      Business: "/business-dashboard",
      Admin: "/admin-dashboard",
    };
    return <Navigate to={redirects[user.userType] || "/dashboard"} replace />;
  }

  return <>{children}</>;
}
