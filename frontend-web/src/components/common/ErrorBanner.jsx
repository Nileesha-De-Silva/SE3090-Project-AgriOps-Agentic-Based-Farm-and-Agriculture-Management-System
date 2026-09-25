import "./ErrorBanner.css";

/**
 * Minimal error state banner matching the AgriOps AI palette.
 *
 * @param {string} message - error text to display.
 * @param {() => void} [onDismiss] - optional dismiss handler; renders a close button when provided.
 */
export default function ErrorBanner({ message, onDismiss }) {
  return (
    <div className="error-banner" role="alert">
      <span className="error-banner-message">{message}</span>
      {onDismiss && (
        <button
          type="button"
          className="error-banner-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
}
