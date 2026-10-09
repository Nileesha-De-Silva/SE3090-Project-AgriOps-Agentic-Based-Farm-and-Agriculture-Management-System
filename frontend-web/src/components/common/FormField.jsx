import "./FormField.css";

/**
 * Consistent label + input/select/textarea, styled from the shared theme.
 * Replaces the repeated <div><label>...</label><input .../></div> blocks
 * used across the app's create/edit forms.
 *
 * @param {string} label - text shown above the field.
 * @param {"text" | "number" | "date" | "textarea" | "select"} type - defaults to "text".
 * @param {string | number} value
 * @param {(e: React.ChangeEvent) => void} onChange
 * @param {boolean} required
 * @param {string} placeholder
 * @param {Array<string | { value: string | number, label: string }>} options
 *   - required when type is "select". Plain strings are used as both value and label.
 * @param {string} [id] - defaults to a slug built from `label`.
 * @param {string} [name]
 * @param {boolean} [disabled]
 * @param {string} [step] - forwarded to number inputs (e.g. "0.01").
 */
export default function FormField({
  label,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder,
  options = [],
  id,
  name,
  disabled = false,
  step,
  className = "",
  ...rest
}) {
  const fieldId =
    id || `field-${label?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;

  function renderControl() {
    if (type === "textarea") {
      return (
        <textarea
          id={fieldId}
          name={name}
          className="form-field-textarea"
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          {...rest}
        />
      );
    }

    if (type === "select") {
      return (
        <select
          id={fieldId}
          name={name}
          className="form-field-select"
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => {
            const optionValue = typeof option === "object" ? option.value : option;
            const optionLabel = typeof option === "object" ? option.label : option;
            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
      );
    }

    return (
      <input
        id={fieldId}
        name={name}
        type={type}
        className="form-field-input"
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        step={step}
        {...rest}
      />
    );
  }

  return (
    <div className={`form-field ${className}`.trim()}>
      <label htmlFor={fieldId} className="form-field-label">
        {label}
      </label>
      {renderControl()}
    </div>
  );
}
