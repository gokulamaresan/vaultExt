import React from 'react';
import './Input.css';

export const Input = React.forwardRef(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className={`input-field ${className}`}>
        {label ? <label className="input-label">{label}</label> : null}
        <input ref={ref} className={`input-control ${error ? 'input-error' : ''}`} {...props} />
        {error ? <div className="input-feedback">{error}</div> : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
