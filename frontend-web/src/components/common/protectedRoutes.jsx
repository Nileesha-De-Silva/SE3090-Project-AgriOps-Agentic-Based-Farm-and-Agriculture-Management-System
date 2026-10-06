import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/authcontext";

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.some((r) => user.roles?.includes(r))) {
    return <p>You don't have permission to view this page.</p>;
  }

  return children;
}