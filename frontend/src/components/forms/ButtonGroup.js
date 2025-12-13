import React from 'react';

/**
 * Reusable button group component for modal/form actions
 * @param {array} buttons - Array of button configs: [{label, onClick, variant, disabled, className, ...props}]
 * @param {string} className - Additional CSS classes
 * @param {string} align - Alignment: 'left', 'right', 'center' (default: 'right')
 */
const ButtonGroup = ({ 
  buttons = [], 
  className = '', 
  align = 'right' 
}) => {
  const alignmentClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }[align] || 'justify-end';

  const getButtonClass = (variant = 'primary') => {
    const baseClass = 'btn';
    const variantClass = `btn-${variant}`;
    return `${baseClass} ${variantClass}`;
  };

  return (
    <div className={`button-group ${className}`} style={{ justifyContent: align === 'left' ? 'flex-start' : align === 'center' ? 'center' : 'flex-end' }}>
      {buttons.map((button, index) => {
        const {
          label,
          onClick,
          variant = 'primary',
          disabled = false,
          className: buttonClassName = '',
          ...buttonProps
        } = button;

        return (
          <button
            key={index}
            className={`${getButtonClass(variant)} ${buttonClassName}`}
            onClick={onClick}
            disabled={disabled}
            {...buttonProps}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default ButtonGroup;

