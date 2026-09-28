import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Navbar.css";

const LINKS = [
  { to: "/farms", label: "Farms" },
  { to: "/crops", label: "Crops" },
  { to: "/agent-planner", label: "Agent Planner" },
];

// Only shown to users with the Administrator role.
// Add the audit log / analytics pages here as they get built.
const ADMIN_LINKS = [
  { to: "/admin/users", label: "Users" },
  { to: "/admin/audit-logs", label: "Audit Log" },
];

// Shown to Administrators and Farm Managers
const MANAGER_LINKS = [{ to: "/analytics", label: "Analytics" }];

/**
 * Top nav bar. Uses React Router's NavLink (built on Link) so the active
 * route is known automatically and gets a green underline.
 */
export default function Navbar() {
  const { user, loading, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const links = [
    ...LINKS,
    ...(hasRole("Administrator", "FarmManager") ? MANAGER_LINKS : []),
    ...(hasRole("Administrator") ? ADMIN_LINKS : []),
  ];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <span className="navbar-brand">AgriOps AI</span>
      <ul className="navbar-links">
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                `navbar-link${isActive ? " navbar-link-active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}

        {/* Auth controls at the end of the links row. Hidden while the saved token is being checked. */}
        {!loading && (
          <li className="navbar-auth">
            {user ? (
              <>
                <span className="navbar-user">{user.username}</span>
                <button
                  type="button"
                  className="navbar-link navbar-button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `navbar-link${isActive ? " navbar-link-active" : ""}`
                }
              >
                Login
              </NavLink>
            )}
          </li>
        )}
      </ul>
    </nav>
  );
}