import React from 'react';

/**
 * Reusable form field component that wraps label and input/textarea/select
 * @param {string} label - Label text for the field
 * @param {string} id - HTML id attribute (required for accessibility)
 * @param {string} type - Input type (text, number, email, etc.) or 'textarea' or 'select'
 * @param {string} placeholder - Placeholder text
 * @param {any} value - Field value
 * @param {function} onChange - Change handler
 * @param {boolean} required - Whether field is required
 * @param {boolean} disabled - Whether field is disabled
 * @param {string} className - Additional CSS classes
 * @param {object} inputProps - Additional props to pass to input/textarea/select
 * @param {array} selectOptions - Options for select type [{value, label}]
 * @param {number} rows - Number of rows for textarea
 */
const FormField = ({
  label,
  id,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  inputProps = {},
  selectOptions = [],
  rows = 4
}) => {
  const baseInputClass = type === 'textarea' 
    ? 'form-textarea' 
    : type === 'select' 
    ? 'form-select' 
    : 'form-input';

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          id={id}
          placeholder={placeholder}
          className={baseInputClass}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          rows={rows}
          {...inputProps}
        />
      ) : type === 'select' ? (
        <select
          id={id}
          className={baseInputClass}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          {...inputProps}
        >
          {selectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          id={id}
          placeholder={placeholder}
          className={baseInputClass}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          {...inputProps}
        />
      )}
    </div>
  );
};

export default FormField;

