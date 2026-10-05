import "./Button.css";

/**
 * Shared button component.
 *
 * @param {"primary" | "secondary"} variant - visual style. Defaults to "primary".
 * @param {"button" | "submit" | "reset"} type - native button type. Defaults to "button".
 * @param {boolean} disabled
 * @param {() => void} onClick
 * @param {React.ReactNode} children
 */
export default function Button({
  variant = "primary",
  type = "button",
  disabled = false,
  onClick,
  children,
  className = "",
  ...rest
}) {
  const variantClass = variant === "secondary" ? "btn-secondary" : "btn-primary";

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}