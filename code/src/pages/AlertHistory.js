import React from 'react';
import './AlertHistory.css';

function AlertHistory({ alerts }) {
  return (
    <div className="alert-history-container">
      <h2>Alert History</h2>
      <div className="alert-list">
        {alerts.map((alert, idx) => (
          <div className="alert-item" key={idx}>{alert}</div>
        ))}
      </div>
    </div>
  );
}

export default AlertHistory; 