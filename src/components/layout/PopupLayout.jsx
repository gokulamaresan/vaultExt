import React from 'react';
import './PopupLayout.css';

export const PopupLayout = ({ header, footer, children }) => {
  return (
    <div className="popup-layout">
      {header && <div className="popup-layout-header">{header}</div>}
      <div className="popup-layout-body">{children}</div>
      {footer && <div className="popup-layout-footer">{footer}</div>}
    </div>
  );
};
