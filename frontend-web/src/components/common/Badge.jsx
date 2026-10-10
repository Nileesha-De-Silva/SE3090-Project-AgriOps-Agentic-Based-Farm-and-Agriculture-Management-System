import "./Badge.css";

const VARIANT_CLASSES = {
  success: "badge-success",
  active: "badge-active",
  info: "badge-info",
  neutral: "badge-neutral",
  warning: "badge-warning",
};

/**
 * Small pill-shaped label for statuses like crop season state or growth stage.
 *
 * @param {"success" | "active" | "info" | "neutral" | "warning"} variant - defaults to "neutral".
 */
export default function Badge({ variant = "neutral", children, className = "", ...rest }) {
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.neutral;

  return (
    <span className={`badge ${variantClass} ${className}`.trim()} {...rest}>
      {variant === "active" && <span className="badge-status-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
