import "./Card.css";

/**
 * White surface container with soft shadow and rounded corners.
 * Used to wrap list items, form sections, and other content blocks.
 */
export default function Card({ children, className = "", ...rest }) {
  return (
    <div className={`card ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
