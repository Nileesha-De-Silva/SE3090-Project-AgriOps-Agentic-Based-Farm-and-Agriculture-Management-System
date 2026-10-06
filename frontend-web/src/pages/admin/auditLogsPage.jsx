import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAuditLogs, getUsers } from "../../api/adminApi";

const PAGE_SIZE = 50;

// Suggestions only - the filter accepts any action type, since the interceptor
// generates names like FARM_CREATED / CROP_UPDATED for every entity in the system.
const ACTION_SUGGESTIONS = [
  "USER_LOGIN",
  "USER_LOGIN_FAILED",
  "USER_CREATED",
  "USER_UPDATED",
  "USERROLE_CREATED",
  "USERROLE_DELETED",
];

function formatDetails(details) {
  if (!details) return "";
  try {
    return JSON.stringify(JSON.parse(details), null, 2);
  } catch {
    return details; // not JSON (e.g. the plain-text login-failure message)
  }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [actionInput, setActionInput] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // The API returns userId only, so fetch users once to show usernames.
  useEffect(() => {
    getUsers()
      .then((users) => setUsersById(Object.fromEntries(users.map((u) => [u.id, u.username]))))
      .catch(() => {}); // not critical: we fall back to a short id
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLogs() {
      try {
        const data = await getAuditLogs({
          actionType: actionFilter || undefined,
          skip: page * PAGE_SIZE,
          take: PAGE_SIZE,
        });
        if (!cancelled) {
          setLogs(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLogs();
    return () => {
      cancelled = true;
    };
  }, [page, actionFilter]);

  function handleFilterSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setPage(0);
    setActionFilter(actionInput.trim());
  }

  function goToPage(next) {
    setLoading(true);
    setPage(next);
  }

  function displayUser(userId) {
    if (!userId) return "System / unknown";
    return usersById[userId] ?? userId.slice(0, 8);
  }

  return (
    <div className="audit-logs-page">
      <h1>Audit Log</h1>

      <form onSubmit={handleFilterSubmit} style={{ marginBottom: "1rem" }}>
        <label>
          Action type{" "}
          <input
            list="audit-action-suggestions"
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
            placeholder="e.g. USER_LOGIN"
          />
        </label>
        <datalist id="audit-action-suggestions">
          {ACTION_SUGGESTIONS.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>{" "}
        <button type="submit">Filter</button>
      </form>

      {error && (
        <div style={{ padding: "1rem", marginBottom: "1.5rem", borderRadius: "0.5rem", backgroundColor: "#fef3c7", border: "1px solid #f59e0b", color: "#92400e" }}>
          <p style={{ fontWeight: 600, margin: 0 }}>{error}</p>
          {(error.includes("401") || error.includes("403") || error.includes("failed with status") || error.includes("token")) && (
            <p style={{ marginTop: "0.5rem", marginBottom: 0 }}>
              Administrator permissions are required to view system audit logs. Please{" "}
              <Link to="/login" style={{ fontWeight: 700, color: "#065f46", textDecoration: "underline" }}>
                Sign In
              </Link>{" "}
              using the administrator account (<strong>admin</strong> / <strong>ChangeMe123!</strong>).
            </p>
          )}
        </div>
      )}
      {loading && <p>Loading audit log...</p>}

      {!loading && logs.length === 0 && !error && <p>No audit entries found.</p>}

      {logs.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>User</th>
              <th>IP address</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.actionType}</td>
                <td>{displayUser(log.userId)}</td>
                <td>{log.ipAddress ?? "-"}</td>
                <td>
                  {log.details ? (
                    <details>
                      <summary>View</summary>
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                        {formatDetails(log.details)}
                      </pre>
                    </details>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: "1rem" }}>
        <button onClick={() => goToPage(page - 1)} disabled={page === 0}>
          Previous
        </button>{" "}
        <span>Page {page + 1}</span>{" "}
        <button onClick={() => goToPage(page + 1)} disabled={logs.length < PAGE_SIZE}>
          Next
        </button>
      </div>
    </div>
  );
}