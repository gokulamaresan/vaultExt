import React from 'react';
import { Button } from '../../common/Button';
import './CredentialCard.css';

export const CredentialCard = ({ credential, onAutoFill, onDelete }) => {
  return (
    <div className="credential-card">
      <div className="credential-card-header">
        <h3 className="credential-title">{credential.name || credential.domain}</h3>
      </div>
      <div className="credential-card-body">
        <div className="credential-field">
          <span className="field-label">Username:</span>
          <span className="field-value">{credential.username}</span>
        </div>
      </div>
      <div className="credential-card-footer">
        <Button variant="primary" onClick={onAutoFill} className="autofill-btn">
          Auto-fill
        </Button>
        <Button variant="danger" onClick={() => onDelete(credential.id)} className="delete-btn">
          Delete
        </Button>
      </div>
    </div>
  );
};
