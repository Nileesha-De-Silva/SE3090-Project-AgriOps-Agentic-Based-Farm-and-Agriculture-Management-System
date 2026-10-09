import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  Shield, 
  Check, 
  Search, 
  RefreshCw, 
  Mail, 
  UserCheck, 
  UserX, 
  AlertCircle, 
  CheckCircle2, 
  Filter,
  Monitor,
  Smartphone,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { getUsers, getRoles, setUserStatus, setUserRoles, deleteUser } from "../../api/adminApi";

export default function UsersAdminPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");

  async function loadData() {
    setError(null);
    try {
      const [usersData, rolesData] = await Promise.all([getUsers(), getRoles()]);
      setUsers(usersData || []);
      setRoles(rolesData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleToggleStatus(user) {
    setError(null);
    setSuccessMsg(null);
    setSavingUserId(user.id);
    try {
      await setUserStatus(user.id, !user.isActive);
      setSuccessMsg(`Status for ${user.username} updated to ${!user.isActive ? "Active" : "Deactivated"}.`);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleRoleChange(user, roleName, checked) {
    setError(null);
    setSuccessMsg(null);
    const nextRoles = checked
      ? [...user.roles, roleName]
      : user.roles.filter((r) => r !== roleName);

    if (nextRoles.length === 0) {
      setError(`User "${user.username}" must keep at least one role.`);
      return;
    }

    setSavingUserId(user.id);
    try {
      await setUserRoles(user.id, nextRoles);
      setSuccessMsg(`Roles for ${user.username} updated successfully.`);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleExecuteDelete(user) {
    setError(null);
    setSuccessMsg(null);
    setSavingUserId(user.id);
    try {
      const res = await deleteUser(user.id);
      setSuccessMsg(
        res?.message ||
        `User "${user.username}" was permanently removed from database existence and all platform roles purged.`
      );
      setConfirmDeleteUser(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingUserId(null);
    }
  }

  // Filtered users based on search query and role filter
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        (u.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        selectedRoleFilter === "ALL" ||
        (u.roles || []).some(
          (r) => r.toLowerCase() === selectedRoleFilter.toLowerCase()
        );

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRoleFilter]);

  const activeCount = users.filter((u) => u.isActive).length;
  const deactivatedCount = users.length - activeCount;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-semibold text-emerald-950">Loading user management directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-900/20 ring-2 ring-emerald-500/20">
            <Users className="w-6 h-6 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">
                User Management
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                Admin Console
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage accounts, security status, and role permissions across Web and Mobile dashboards.
            </p>
          </div>
        </div>

        {/* Sync Button */}
        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50/80 text-emerald-900 border border-emerald-300/80 text-xs font-bold shadow-xs transition-colors self-start md:self-auto cursor-pointer"
          title="Reload user list from database"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${savingUserId ? "animate-spin" : ""}`} />
          <span>Refresh Users</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Accounts</p>
            <p className="text-2xl font-extrabold text-emerald-950 mt-1">{users.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-200/60">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Users</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-200/60">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deactivated</p>
            <p className="text-2xl font-extrabold text-rose-700 mt-1">{deactivatedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-700 border border-rose-200/60">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Role Legend Bar */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50/30 p-3.5 rounded-xl border border-emerald-200/70 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-emerald-900 font-bold">
          <Shield className="w-4 h-4 text-emerald-700" />
          <span>Platform Role Access Guide:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium">
          <div className="flex items-center space-x-1.5">
            <Monitor className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-bold text-emerald-950">Web Dashboard:</span>
            <span>Administrator, FarmManager, Agronomist</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Smartphone className="w-3.5 h-3.5 text-teal-700" />
            <span className="font-bold text-teal-950">Mobile App:</span>
            <span>FieldWorker, Farmer</span>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 shadow-xs flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-sm text-rose-950">{error}</p>
            {(error.includes("401") || error.includes("403") || error.includes("token")) && (
              <p className="mt-1 text-rose-800">
                Administrator permissions required. Please{" "}
                <Link to="/login" className="underline font-bold hover:text-rose-950">
                  Sign In
                </Link>{" "}
                using the administrator account.
              </p>
            )}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-xs flex items-center space-x-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-xs font-bold">{successMsg}</p>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
          />
        </div>

        {/* Role Filter Dropdown */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="text-xs py-2 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Roles ({users.length})</option>
            {roles.map((r) => (
              <option key={r.id} value={r.roleName}>
                {r.roleName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-emerald-200/90 shadow-card-green overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-emerald-100">
            <thead className="bg-gradient-to-r from-emerald-950/5 via-teal-950/5 to-emerald-950/5">
              <tr>
                <th className="px-5 py-3.5 text-left text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider">
                  User
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3.5 text-left text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider">
                  Assigned Roles (Click to toggle)
                </th>
                <th className="px-5 py-3.5 text-right text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100/70 bg-white">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs font-semibold">
                    No users found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-emerald-50/30 transition-colors"
                  >
                    {/* Username & Avatar */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center text-xs font-bold ring-2 ring-emerald-400/20 shadow-xs shrink-0">
                          {(user.username || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">
                            {user.username}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ID: {user.id ? String(user.id).slice(0, 8) : "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{user.email || "No email"}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {user.isActive ? (
                        <span className="inline-flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          <span>Deactivated</span>
                        </span>
                      )}
                    </td>

                    {/* Roles Badges (Interactive Toggles) */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xl">
                        {roles.map((role) => {
                          const hasRole = (user.roles || []).includes(role.roleName);
                          return (
                            <button
                              type="button"
                              key={role.id}
                              onClick={() => handleRoleChange(user, role.roleName, !hasRole)}
                              disabled={savingUserId === user.id}
                              title={
                                hasRole
                                  ? `Click to revoke ${role.roleName} from ${user.username}`
                                  : `Click to grant ${role.roleName} to ${user.username}`
                              }
                              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${
                                hasRole
                                  ? "bg-emerald-100/90 text-emerald-900 border-emerald-300 shadow-2xs hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300"
                                  : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300"
                              }`}
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] transition-colors ${
                                  hasRole
                                    ? "bg-emerald-600 border-emerald-600 text-white"
                                    : "border-slate-300 bg-white text-transparent"
                                }`}
                              >
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                              <span>{role.roleName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    {/* Actions: Deactivate / Activate AND Remove User */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end space-x-2">
                        {/* Deactivate / Activate Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          disabled={savingUserId === user.id}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            user.isActive
                              ? "bg-white hover:bg-amber-50 text-amber-700 border-amber-300 hover:border-amber-400"
                              : "bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300 hover:border-emerald-400"
                          }`}
                          title={user.isActive ? "Deactivate this account" : "Reactivate this account"}
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="w-3.5 h-3.5 text-amber-600" />
                              <span>Deactivate</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Activate</span>
                            </>
                          )}
                        </button>

                        {/* Remove User Button in Red beside Deactivate */}
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteUser(user)}
                          disabled={savingUserId === user.id}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-300 bg-rose-600 hover:bg-rose-700 text-white shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title={`Permanently delete user ${user.username} from platform database`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-100" />
                          <span>Remove User</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permanent Database Removal Confirmation Dialog */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 ring-4 ring-rose-50">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Remove User from Platform
                </h3>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 space-y-2">
              <p>
                Are you sure you want to permanently remove <strong className="text-slate-900 font-bold">{confirmDeleteUser.username}</strong> ({confirmDeleteUser.email || "no email"}) from the platform?
              </p>
              <p className="text-rose-600 font-semibold text-xs">
                ⚠️ This operation permanently purges all records for this user from the database. This action is irreversible.
              </p>
            </div>


            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
                disabled={savingUserId === confirmDeleteUser.id}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecuteDelete(confirmDeleteUser)}
                disabled={savingUserId === confirmDeleteUser.id}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-950/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingUserId === confirmDeleteUser.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Purging from Database...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge & Remove User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}