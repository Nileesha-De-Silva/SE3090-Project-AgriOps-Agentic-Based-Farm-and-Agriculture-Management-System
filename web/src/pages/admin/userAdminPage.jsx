import { useEffect, useState } from "react";
import { getUsers, getRoles, setUserStatus, setUserRoles } from "../../api/adminApi";

export default function UsersAdminPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setError(null);
    try {
      const [usersData, rolesData] = await Promise.all([getUsers(), getRoles()]);
      setUsers(usersData);
      setRoles(rolesData);
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
    try {
      await setUserStatus(user.id, !user.isActive);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRoleChange(user, roleName, checked) {
    const nextRoles = checked
      ? [...user.roles, roleName]
      : user.roles.filter((r) => r !== roleName);

    if (nextRoles.length === 0) {
      setError("A user must keep at least one role.");
      return;
    }

    try {
      await setUserRoles(user.id, nextRoles);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="users-admin-page">
      <h1>User Management</h1>
      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Status</th>
            <th>Roles</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.isActive ? "Active" : "Deactivated"}</td>
              <td>
                {roles.map((role) => (
                  <label key={role.id} style={{ marginRight: "0.75rem" }}>
                    <input
                      type="checkbox"
                      checked={user.roles.includes(role.roleName)}
                      onChange={(e) => handleRoleChange(user, role.roleName, e.target.checked)}
                    />
                    {role.roleName}
                  </label>
                ))}
              </td>
              <td>
                <button onClick={() => handleToggleStatus(user)}>
                  {user.isActive ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}