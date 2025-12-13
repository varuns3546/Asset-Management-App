import { useState } from 'react';

const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder = 'Password', 
  disabled = false,
  required = true,
  className = 'auth-input'
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-password-container">
      <input 
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={className}
        required={required}
        disabled={disabled}
      />
      <button
        type="button"
        className="auth-password-toggle"
        onClick={() => setShowPassword(!showPassword)}
        disabled={disabled}
      >
        {showPassword ? '👁️' : '👁️‍🗨️'}
      </button>
    </div>
  );
};

export default PasswordInput;

