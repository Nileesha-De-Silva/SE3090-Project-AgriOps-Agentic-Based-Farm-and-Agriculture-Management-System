import { NavLink } from "react-router-dom";
import "./Navbar.css";

const LINKS = [
  { to: "/farms", label: "Farms" },
  { to: "/crops", label: "Crops" },
  { to: "/agent-planner", label: "Agent Planner" },
];

/**
 * Top nav bar. Uses React Router's NavLink (built on Link) so the active
 * route is known automatically and gets a green underline.
 */
export default function Navbar() {
  return (
    <nav className="navbar">
      <span className="navbar-brand">AgriOps AI</span>
      <ul className="navbar-links">
        {LINKS.map((link) => (
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
      </ul>
    </nav>
  );
}