import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/authcontext";
import { ShieldAlert, ArrowLeft } from "lucide-react";

/**
 * Standardizes role matching across the 3 core web personas:
 * - Administrator (matches 'Administrator', 'Admin')
 * - FarmManager (matches 'FarmManager', 'Manager')
 * - Agronomist (matches 'Agronomist')
 */
function hasMatchingRole(userRoles = [], requiredRoles = []) {
  if (!requiredRoles || requiredRoles.length === 0) return true;

  const normalizedUserRoles = userRoles.map((r) => r?.toLowerCase().trim());

  return requiredRoles.some((req) => {
    const r = req.toLowerCase().trim();
    if (r === "administrator" || r === "admin") {
      return normalizedUserRoles.includes("administrator") || normalizedUserRoles.includes("admin");
    }
    if (r === "farmmanager" || r === "manager") {
      return normalizedUserRoles.includes("farmmanager") || normalizedUserRoles.includes("manager");
    }
    if (r === "agronomist") {
      return normalizedUserRoles.includes("agronomist");
    }
    return normalizedUserRoles.includes(r);
  });
}

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;

  if (roles && !hasMatchingRole(user.roles, roles)) {
    return (
      <div className="p-6 sm:p-10 max-w-lg mx-auto my-12 bg-white rounded-2xl border border-rose-200 shadow-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto mb-4 shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Access Restricted</h2>
        <p className="text-rose-700 font-medium mb-3">You don't have permission to view this page.</p>
        
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs text-slate-700 space-y-1.5 mb-6">
          <p><strong>Required Roles:</strong> {roles.join(", ")}</p>
          <p><strong>Your Active Role(s):</strong> {(user.roles || []).join(", ") || "None"}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={user.roles?.includes("Administrator") ? "/users" : user.roles?.includes("Agronomist") ? "/analysis" : "/workspace"}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to My Workspace</span>
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition-colors"
          >
            Switch Account
          </Link>
        </div>
      </div>
    );
  }

  return children;
}