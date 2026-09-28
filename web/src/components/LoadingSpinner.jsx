import "./LoadingSpinner.css";

/**
 * Minimal loading indicator matching the AgriOps AI palette.
 *
 * @param {string} label - message shown next to the spinner. Defaults to "Loading...".
 */
export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="loading-spinner-wrap" role="status" aria-live="polite">
      <span className="loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}