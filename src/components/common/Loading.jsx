import React from 'react';
import './Loading.css';

export const Loading = ({ text = 'Loading...', size = 'md' }) => {
  return (
    <div className={`loading-spinner loading-${size}`}>
      <div className="spinner" />
      <span className="loading-text">{text}</span>
    </div>
  );
};
